let lastRAMWrite = [];
let lastRAMRead = [];
let lastClockRead = [];
let lastClockWrite = [];

let lastClockOutCmp = 0;

let stepInterval;

let elementString = "";

let redrawRAM = 0;

for (let i = 0; i < RAMSize; i++) {
  elementString += "<span title='" + i.toString(16) + "'>00</span>";
}

$("#RAM-output-div")
  .empty()
  .append(elementString);

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
    fullInst = instructionTable[view[cpu.PC - 0x8000]].name.toUpperCase() + "(" + ("0" + view[cpu.PC - 0x8000].toString(16)).slice(-2).toUpperCase() + ")";

    for (let i = 1; i < instructionTable[view[cpu.PC - 0x8000]].len; i++) {
      fullInst +=
        " " +
        ("0" + view[cpu.PC - 0x8000 + i].toString(16)).slice(-2).toUpperCase();
    }
  } else {
    let b1 = view[cpu.PC - 0x8000];
    let b2 = view[cpu.PC - 0x8000 + 1];

    let v1 = ("0" + b1.toString(16)).slice(-2).toUpperCase();
    let v2 = ("0" + b2.toString(16)).slice(-2).toUpperCase();

    fullInst = subOps[b1][b2].name.toUpperCase() + "(" + v1 + " " + v2 + ")";

    for (let i = 2; i < subOps[view[cpu.PC - 0x8000]][view[cpu.PC - 0x8000 + 1]].len; i++) {
      fullInst +=
        " " +
        ("0" + view[cpu.PC - 0x8000 + i].toString(16)).slice(-2).toUpperCase();
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

  let timer1Freq = 2; //2Mhz
  let timer3Freq = 0.25; //250khz

  let ignoreInterrupts = $('#ignoreInterrupts-input').is(":checked");

  for (let i = 0; i < ticks; i++) {
    // Output compare 1
    let outCmp = (readRAM(0x000b, 1) << 8) + readRAM(0x000c, 1);

    if (!ignoreInterrupts && lastClockOutCmp != outCmp && Math.ceil(cpu.timer_1_2) + i == outCmp) {
      lastClockOutCmp = outCmp;
      console.log("Timer 1 output compare match! Watch");

      //TODO: use vector table
      //Output compare 1 vector= 0xFFF0
      let firstByte = cpu.ROM.view[0xFFF0 - 0x8000];
      let secondByte = cpu.ROM.view[0xFFF1 - 0x8000];
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

      //Output compare 2 vector= 0xFFEE
      //Output compare 3 vector= 0xFFEC
    }
  }

  cpu.timer_1_2 += (timer1Freq / cpu.clockSpeed) * ticks;
  cpu.timer_3 += (timer3Freq / cpu.clockSpeed) * ticks;

  if (cpu.timer_1_2 > 0xffff) {
    cpu.timer_1_2 -= 0xffff;
  }

  writeRAM(0x0009, Math.ceil(cpu.timer_1_2) >> 8, 1);
  writeRAM(0x000a, Math.ceil(cpu.timer_1_2) & 0xff, 1);

  if (cpu.timer_3 > 0xffff) {
    cpu.timer_3 -= 0xffff;
  }

  writeRAM(0x0029, Math.ceil(cpu.timer_3) >> 8, 1);
  writeRAM(0x002a, Math.ceil(cpu.timer_3) & 0xff, 1);

  writeRAM(0x002d, Math.ceil(cpu.timer_3) >> 8, 1);
  writeRAM(0x002e, Math.ceil(cpu.timer_3) & 0xff, 1);

  $("#clock-ticks-output").val(cpu.clock.tickCount);
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
    if (undefined == instructionTable[view[cpu.PC - 0x8000]].microcode) {
      clearInterval(stepInterval);
      console.log("No microcode implimented");
    } else {
      instructionTable[view[cpu.PC - 0x8000]].microcode(view); // branch here
    }
  }
}
