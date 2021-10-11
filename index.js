let lastRAMWrite = 0x00;
let lastRAMRead = 0x00;
let lastClockRead = 0;
let lastClockWrite = 0;

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

  for (let i = 0; i < ticks; i++) {
    let outCmp = (readRAM(0x000b, 1) << 8) + readRAM(0x000c, 1);
    if (Math.ceil(cpu.timer_1_2) + i == outCmp) {
      let bit1Csr = readRAM(0x0008, 1) && 0b1000000;
      writeRAM(0x0008, bit1Csr ? readRAM(0x0008, 1) | 0b0100000 : 0, 1);
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
