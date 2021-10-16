let lastRAMWrite = [];
let lastRAMRead = [];
let lastClockRead = [];
let lastClockWrite = [];

let lastClockOutCmp = 0;
let rtcStart = 0;
let rtcStash = 0;
let stepInterval = -1;
let clockUpdateInterval = -1;

let redrawRAM = 0;

fullReset();

function step() {
  let view = cpu.ROM.view;
  let textareaIndex = (cpu.PC - 0x8000) * 2;

  $("#hex-output-textarea").blur();
  $("#hex-output-textarea")[0].setSelectionRange(
    textareaIndex,
    textareaIndex + 2
  );
  $("#hex-output-textarea").focus();

  let fullInst;

  if ("SUBOP" != instructionTable[view[cpu.PC - 0x8000]].type) {
    let opName = instructionTable[view[cpu.PC - 0x8000]].name.toUpperCase();
    let opCode = cleanHexify(view[cpu.PC - 0x8000]);

    fullInst = opName + "(" + opCode + ")";

    for (let i = 1; i < instructionTable[view[cpu.PC - 0x8000]].len; i++) {
      fullInst += " " + cleanHexify(view[cpu.PC - 0x8000 + i]);
    }
  } else {
    let b1 = view[cpu.PC - 0x8000];
    let b2 = view[cpu.PC - 0x8000 + 1];

    let v1 = cleanHexify(b1);
    let v2 = cleanHexify(b2);

    fullInst = subOps[b1][b2].name.toUpperCase() + "(" + v1 + " " + v2 + ")";

    for (let i = 2; i < subOps[view[cpu.PC - 0x8000]][view[cpu.PC - 0x8000 + 1]].len; i++) {
      fullInst += " " + cleanHexify(view[cpu.PC - 0x8000 + i]);
    }
  }

  $("#instruction").text(fullInst);

  $("#log-output-div > ul").append(
    "<li>----------</li>"
  );

  $("#log-output-div > ul").append(
    "<li>" + cpu.PC.toString(16) + ": " + fullInst + "</li>"
  );

  if($("#log-follow-input").is(":checked")) {
    let d = $("#log-output-div");
    d.scrollTop(d.prop("scrollHeight"));
  }

  //Execute
  if(instructionTable[view[cpu.PC - 0x8000]].hasSubops) {
    if(undefined != subOps[view[cpu.PC - 0x8000]][view[cpu.PC - 0x8000 + 1]]) {
      if (
        undefined ==
        subOps[view[cpu.PC - 0x8000]][view[cpu.PC - 0x8000 + 1]].microcode  // branch here
      ) {
        clearInterval(stepInterval);
        console.log("No microcode implimented");
      } else {
        subOps[view[cpu.PC - 0x8000]][view[cpu.PC - 0x8000 + 1]].microcode(view);
      }
    } else {
      executeMicrocode(view);
    }
  } else {
    executeMicrocode(view);
  }

  if ($("#break-input").is(":checked")) {
    if (cpu.PC == window.parseInt($("#breakpoint-input").val(), 16)) {
      clearInterval(stepInterval);
      console.log("Hit the breakpoint");
    }
  }

  if ($("#op-break-input").is(":checked")) {
    if (
      instructionTable[view[cpu.PC - 0x8000]].name.toLowerCase() ==
      $("#op-breakpoint-input")
        .val()
        .toLowerCase()
    ) {
      clearInterval(stepInterval);
      console.log("Hit the op-breakpoint");
    }
  }

  if(redrawRAM) {
    redrawRAM = 0;
    drawRAMOutput(cpu.memory.view, RAMSize);
  }
}

function advanceClock(ticks) {
  let preTick = cpu.clock.tickCount;
  cpu.clock.tickCount += ticks;

  let timer1Freq = 2;     //2Mhz
  let timer3Freq = 0.25;  //250khz

  let ignoreInterrupts = cpu.status.I || $('#ignoreInterrupts-input').is(":checked");

  // Output compare 1
  let t1OutCmp = (readRAM(0x000B, 1) << 8) + readRAM(0x000C, 1);
  let t2OutCmp = (readRAM(0x001B, 1) << 8) + readRAM(0x001C, 1);
  let t3OutCmp = (readRAM(0x002B, 1) << 8) + readRAM(0x002C, 1);

  let t1_2 = Math.ceil(cpu.timer_1_2);
  let t3 = Math.ceil(cpu.timer_3);


  for (let i = 0; i < ticks; i++) {
    //console.log("Compare: 0b" + t1OutCmp.toString(2) + " and clk: 0b" + (t1_2 + i).toString(2));
    //Output compare 1 vector = 0xFFF0
    if (!ignoreInterrupts && t1_2 + i == t1OutCmp) {
      console.log("Timer 1 output compare match!");

      interrupt(0xFFF0);
    }

    //Output compare 2 vector = 0xFFEE
    if (!ignoreInterrupts && t1_2 + i == t2OutCmp) {
      console.log("Timer 2 output compare match!");

      interrupt(0xFFEE);
    }

    //Output compare 3 vector = 0xFFEC
    if (!ignoreInterrupts && t3 + i == t3OutCmp) {
      console.log("Timer 3 output compare match!");

      interrupt(0xFFEC);
    }
  }

  // New clocks values
  cpu.timer_1_2 += (timer1Freq / cpu.clockSpeed) * ticks;
  cpu.timer_3 += (timer3Freq / cpu.clockSpeed) * ticks;

  // Clk 1-2 rollover
  if (cpu.timer_1_2 > 0xFFFF) {
    cpu.timer_1_2 -= 0xFFFF;
  }

  // Clk 3 rollover
  if (cpu.timer_3 > 0xFFFF) {
    cpu.timer_3 -= 0xFFFF;
  }

  // Clk 1-2 store
  writeRAM(0x0009, Math.ceil(cpu.timer_1_2) >> 8, 1);
  writeRAM(0x000a, Math.ceil(cpu.timer_1_2) & 0xFF, 1);

  // Clk 3 1&2 store
  writeRAM(0x0029, Math.ceil(cpu.timer_3) >> 8, 1);
  writeRAM(0x002a, Math.ceil(cpu.timer_3) & 0xFF, 1);

  writeRAM(0x002d, Math.ceil(cpu.timer_3) >> 8, 1);
  writeRAM(0x002e, Math.ceil(cpu.timer_3) & 0xFF, 1);
}

function executeMicrocode(view) {
  if ("SUBOP" == instructionTable[view[cpu.PC - 0x8000]].type) {
    if (
      undefined ==
      subOps[view[cpu.PC - 0x8000]][view[cpu.PC - 0x8000 + 1]].microcode  // branch here
    ) {
      clearInterval(stepInterval);
      console.log("No microcode implimented");
    } else {
      subOps[view[cpu.PC - 0x8000]][view[cpu.PC - 0x8000 + 1]].microcode(view);
    }
  } else {
    if (undefined == instructionTable[view[cpu.PC - 0x8000]].microcode) { // branch here
      clearInterval(stepInterval);
      console.log("No microcode implimented");
    } else {
      instructionTable[view[cpu.PC - 0x8000]].microcode(view);
    }
  }
}

function interrupt(vector) {
  let firstByte = cpu.ROM.view[vector - 0x8000];
  let secondByte = cpu.ROM.view[vector + 1 - 0x8000];
  let addr = (firstByte << 8) + secondByte;

  stackPC();
  stackY();
  stackX();
  stackD();
  stackFlags();

  setD(0);
  setX(0);
  setY(0);

  setPC(addr);

  clearStatusFlag("H");
  setStatusFlag("I");
  clearStatusFlag("N");
  clearStatusFlag("Z");
  clearStatusFlag("V");
  clearStatusFlag("C");
}
