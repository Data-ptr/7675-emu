let lastRAMWrite = [];
let lastRAMRead = [];
let lastClockRead = [];
let lastClockWrite = [];
let interruptStack = [];

let lastClockOutCmp = 0;
let rtcStart = 0;
let rtcStash = 0;
let rtcNow = 0;
let simTimeNow = 0;
let stepInterval = -1;
let clockUpdateInterval = -1;

let redrawRAM = 0;

let updateRAM = $('#updateRamOutput-input').is(":checked");
let updateROM = $('#updateRomOutput-input').is(":checked");
let updateUI = $('#updateUiOutput-input').is(":checked");
let updateBatchOutput = $('#updateBatchOutput-input').is(":checked");
let updateSrc = $('#updateSrcOutput-input').is(":checked");

let tdcCheckCnt = 0;
let casCheckCnt = 0;

const romTextarea = $("#hex-output-textarea");
const logOutputDiv = $("#log-output-div");

fullReset();

// DSM initilization
writeRAM(0x06, 128 + 64 + 32 + 16 + 4, 1);
// 128 = IDLE switch is on (TB switch?)
// 64 = Key is NOT in START position
// 32 = A/T is in park or nutral
// 16 = A/C is OFF
// 4 = NOT at TDC

// Set rx buffer empty
//writeRAM(0x11, 8, 1);

// Put test value into rx buffer
//writeRAM(0x12, 0xFD, 1);

// Set knock sensor ok
writeRAM(0x07, 0b00100000, 1);

function step() {
  let view = cpu.ROM.view;
  let textareaIndex = (cpu.PC - 0x8000) * 2;

  if(updateROM) {
    romTextarea.blur();
    romTextarea[0].setSelectionRange(
      textareaIndex,
      textareaIndex + 2
    );
    romTextarea.focus();
  }

  if(updateSrc) {
    const match = new RegExp(cleanHexify(cpu.PC, 4), "gims");
    const matches = match.exec(elementCache.srcTextarea.val());

    if(null != matches) {
      const lastMatch = matches.index;

      elementCache.srcTextarea.blur();
      elementCache.srcTextarea[0].setSelectionRange(
        lastMatch,
        lastMatch + 4
      );
      elementCache.srcTextarea.focus();
    }
  }

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

  if(updateUI) {
    $("#instruction").text(fullInst);
  }

  if(logEnabled) {
    logElement.append(
      "<li>----------</li>"
    );

    logElement.append(
      "<li>" + cpu.PC.toString(16) + ": " + fullInst + "</li>"
    );

    if($("#log-follow-input").is(":checked")) {
      let d = logOutputDiv;
      d.scrollTop(d.prop("scrollHeight"));
    }
  }

  //Execute
  if(instructionTable[view[cpu.PC - 0x8000]].hasSubops) {
    if(undefined != subOps[view[cpu.PC - 0x8000]][view[cpu.PC - 0x8000 + 1]]) {
      if (
        undefined ==
        subOps[view[cpu.PC - 0x8000]][view[cpu.PC - 0x8000 + 1]].microcode  // branch here
      ) {
        clearInterval(stepInterval);
        clearInterval(clockUpdateInterval);
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

      rtcStash = rtcStash + (((new Date().getTime()) - rtcStart) / 1000)
      rtcStart = 0;

      clearInterval(clockUpdateInterval);
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

      rtcStash = rtcStash + (((new Date().getTime()) - rtcStart) / 1000)
      rtcStart = 0;

      clearInterval(clockUpdateInterval);
      console.log("Hit the op-breakpoint");
    }
  }

  if(updateRAM && redrawRAM) {
    redrawRAM = 0;
    drawRAMOutput(cpu.memory.view, RAMSize, 0);
  }
}

function advanceClock(cycles) {
  cpu.clock.cycleCount += cycles;

  const timer1Freq = 1;     // 1Mhz
  const timer3Freq = 0.25;  // 250khz

  const ignoreInterrupts = $('#ignoreInterrupts-input').is(":checked");

  workOutputCompare(cycles, ignoreInterrupts);

  workInterrupts();

  workAdc();

  // New clocks values
  cpu.timer_1_2 += (timer1Freq / cpu.clockSpeed) * cycles;
  cpu.timer_3 += (timer3Freq / cpu.clockSpeed) * cycles;

  workTimerOverflows(ignoreInterrupts);

  storeTimers();

  let simTime = (1 / (cpu.clockSpeed * 0xF4240)) * cpu.clock.cycleCount;

  updateEngine(simTime * 1000);

  // Update data registers
  const port3Prev = readRAM(0x06, 1) & 0b11111011;
  const port5Prev = readRAM(0x16, 1) & 0b11111110;

  // Write TDC and CAS flag into RAM
  writeRAM(0x06, port3Prev + (m_4G63.TDC ? 0 : 0b00000100), 1);
  writeRAM(0x16, port5Prev + (m_4G63.CAS ? 0 : 1), 1);

  if(1000 == ++tdcCheckCnt) {
    tdcCheckCnt = 0;
    m_4G63.TDC_list.push(m_4G63.TDC ? 1 : 0);
  }

  if(1000 == ++casCheckCnt) {
    casCheckCnt = 0;
    m_4G63.CAS_list.push(m_4G63.CAS ? -3 : -4);
  }
}

const tdcCasChartUpdate = setInterval(function() {
  while(m_4G63.TDC_list.length > 50) {
    m_4G63.TDC_list.shift();
  }

  while(m_4G63.CAS_list.length > 50) {
    m_4G63.CAS_list.shift();
  }

  tdcChart.updateSeries([
    {
      data: m_4G63.TDC_list
    },
    {
      data: m_4G63.CAS_list
    }
  ]);
}, 500);

function executeMicrocode(view) {
  if ("SUBOP" == instructionTable[view[cpu.PC - 0x8000]].type) {
    if (
      undefined ==
      subOps[view[cpu.PC - 0x8000]][view[cpu.PC - 0x8000 + 1]].microcode  // branch here
    ) {
      clearInterval(stepInterval);
      clearInterval(clockUpdateInterval);
      console.log("No microcode implimented");
    } else {
      subOps[view[cpu.PC - 0x8000]][view[cpu.PC - 0x8000 + 1]].microcode(view);
    }
  } else {
    if (undefined == instructionTable[view[cpu.PC - 0x8000]].microcode) { // branch here
      clearInterval(stepInterval);
      clearInterval(clockUpdateInterval);
      console.log("No microcode implimented");
    } else {
      instructionTable[view[cpu.PC - 0x8000]].microcode(view);
    }
  }
}

function workOutputCompare(cycles, ignoreInterrupts) {
  // Output compare 1
  let t1OutCmp = (readRAM(0x000B, 1) << 8) + readRAM(0x000C, 1);
  let t2OutCmp = (readRAM(0x001B, 1) << 8) + readRAM(0x001C, 1);
  let t3OutCmp = (readRAM(0x002B, 1) << 8) + readRAM(0x002C, 1);

  let t1_2 = Math.ceil(cpu.timer_1_2);
  let t3 = Math.ceil(cpu.timer_3);

  for (let i = 0; i < cycles; i++) {
    //Output compare 1 vector = 0xFFF0
    if (!ignoreInterrupts && (readRAM(0x0008, 1) & 0b00001000) && t1_2 + i == t1OutCmp) {
      //console.log("Timer 1 output compare match!");

      writeRAM(0x0008, readRAM(0x0008, 1) | 0b01000000, 1);

      interruptStack.push(0xFFF0);
    }

    //Output compare 2 vector = 0xFFEE
    if (!ignoreInterrupts && (readRAM(0x0018, 1) & 0b00001000) && t1_2 + i == t2OutCmp) {
      //console.log("Timer 2 output compare match!");

      writeRAM(0x0018, readRAM(0x0018, 1) | 0b01000000, 1);

      interruptStack.push(0xFFEE);
    }

    //Output compare 3 vector = 0xFFEC
    if (!ignoreInterrupts && t3 + i == t3OutCmp) {
      console.log("Timer 3 output compare match!");

      interruptStack.push(0xFFEC);
    }
  }
}

function workInterrupts() {
  if(interruptStack.length > 0 && !cpu.status.I) {
    interrupt(interruptStack.pop());
  }
}

function workTimerOverflows(ignoreInterrupts) {
  let t1OverflowEnabled = readRAM(0x0008, 1) & 0b00000100;

  // Clk 1-2 rollover
  if (cpu.timer_1_2 > 0xFFFF) {
    cpu.timer_1_2 -= 0xFFFF; //TODO: should this be after the interrupt is called?

    // check if enabled
    if (!ignoreInterrupts && t1OverflowEnabled) {
      interruptStack.push(0xFFEA);
      // set overflow interrupt flag
      writeRAM(readRAM(0x0008, 1) & 0b00100000, 1);
    }
  }

  // Clk 3 rollover
  if (cpu.timer_3 > 0xFFFF) {
    cpu.timer_3 -= 0xFFFF;
    //TODO: is there a timer 3 overflow interrupt?
  }
}

function workAdc() {
  // ADC pending
  if(adcObj && adcObj.countdown > -1) {
    adcObj.countdown--;

    if(0 == adcObj.countdown) {
      doAdc();
    }
  }
}

function storeTimers() {
  // Clk 1-2 store
  let t2Ceil = Math.ceil(cpu.timer_1_2);

  writeRAM(0x0009, t2Ceil >> 8, 1);
  writeRAM(0x000a, t2Ceil & 0xFF, 1);

  // Clk 3 1&2 store
  let t3Ceil = Math.ceil(cpu.timer_3);
  let t3B1 = t3Ceil >> 8;
  let t3B2 = t3Ceil & 0xFF;

  writeRAM(0x0029, t3B1, 1);
  writeRAM(0x002a, t3B2, 1);
  writeRAM(0x002d, t3B1, 1);
  writeRAM(0x002e, t3B2, 1);
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
