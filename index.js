let cpu = {
  D: 0,
  X: 0,
  Y: 0,
  PC: 0,
  SP: 0,
  status: {
    H: 0,
    I: 0,
    N: 0,
    Z: 0,
    V: 0,
    C: 0
  },
  memory: { view: undefined, data: undefined },
  ROM: { view: undefined, data: undefined },
  clock: { auto: false, tickCount: 0 },
  timer_1_2: 0,
  timer_3: 0,
  clockSpeed: 2 //mhz
};

let lastRAMWrite = 0x00;
let lastRAMRead = 0x00;

let stepInterval;

const RAMSize = 0x7fff;

// Initialize memory
cpu.memory.data = new ArrayBuffer(RAMSize);
cpu.memory.view = new Uint8ClampedArray(cpu.memory.data);

let elementString = "";

for (let i = 0; i < RAMSize; i++) {
  elementString += "<span title='" + i.toString(16) + "'>00</span>";
}

$("#RAM-output-div")
  .empty()
  .append(elementString);

//Initialize ROM
cpu.ROM.data = new ArrayBuffer(0x8000);
cpu.ROM.view = new Uint8ClampedArray(cpu.ROM.data);

fullReset();

// iOS hack
$(
  "#load-button-input, #load-reset-button-input, #save-button-input, #restore-button-input, #execute-button-input"
).css("cursor", "pointer");

$("#load-button-input").bind("click", function() {
  let base64String = $("#base64-textarea").val();
  let binary_string = window.atob(base64String);
  let len = binary_string.length;

  let view = cpu.ROM.view;

  for (let i = 0; i < len; i++) {
    view[i] = binary_string.charCodeAt(i);
  }

  drawHexOutput(view, len);

  hideInput();

  setPcToEntrypoint();
});

$("#load-reset-button-input").bind("click", function() {
  showInput();

  fullReset();
});

$("#save-button-input").bind("click", function() {
  let base64String = $("#base64-textarea").val();
  let binary_string = window.atob(base64String);
  let len = binary_string.length;

  let view = cpu.ROM.view;

  for (let i = 0; i < len; i++) {
    view[i] = binary_string.charCodeAt(i);
  }

  localStorage.setItem("E931", binary_string);
});

$("#restore-button-input").bind("click", function() {
  let codeFromLS = localStorage.getItem("E931");

  if (undefined !== codeFromLS) {
    let len = codeFromLS.length;
    let view = cpu.ROM.view;

    for (let i = 0; i < len; i++) {
      view[i] = codeFromLS.charCodeAt(i);
    }

    drawHexOutput(view, len);

    hideInput();

    setPcToEntrypoint();
  }
});

$("#step-button-input").bind("click", function() {
  step();
});

$("#run-button-input").bind("click", function() {
  stepInterval = setInterval(
    step,
    window.parseInt($("#clock-speed-input").val())
  );
});

$("#pause-button-input").bind("click", function() {
  clearInterval(stepInterval);
});

function hideInput() {
  $("#input-div").hide();
  $("#input-hidden-div").show();
}

function showInput() {
  $("#input-div").show();
  $("#input-hidden-div").hide();
}

function drawHexOutput(view, len) {
  let hexString = "";

  for (let i = 0; i < len; i++) {
    hexString +=
      (0 == i ? "" : "") +
      ("0" + Number(view[i]).toString(16)).slice(-2).toUpperCase();
  }

  $("#hex-output-textarea").text(hexString);
}

function drawRAMOutput(view, len, all) {
  let byteElements = $("#RAM-output-div > span");

  for (let i = 0; i < len; i++) {
    if (all) {
      let hexByte = ("0" + Number(view[i]).toString(16))
        .slice(-2)
        .toUpperCase();
      $(byteElements[i]).text(hexByte);
      $(byteElements[i]).removeClass("hilight");
      $(byteElements[i]).removeClass("hilight-read");
      $(byteElements[i]).removeClass("stack-pointer");
    } else {
      if (i == lastRAMWrite / 2) {
        let hexByte = ("0" + Number(view[i]).toString(16))
          .slice(-2)
          .toUpperCase();
        $(byteElements[i]).text(hexByte);

        $(byteElements[i]).addClass("hilight");

        if ($("#followRamWrite-input").is(":checked")) {
          $("#RAM-output-div").scrollTop(
            $(byteElements[i]).position().top - $(byteElements[i]).height()
          );
        }
      } else {
        $(byteElements[i]).removeClass("hilight");
      }

      if (i == lastRAMRead) {
        $(byteElements[i]).addClass("hilight-read");

        if ($("#followRamRead-input").is(":checked")) {
          $("#RAM-output-div").scrollTop(
            $(byteElements[i]).position().top - $(byteElements[i]).height()
          );
        }
      } else {
        $(byteElements[i]).removeClass("hilight-read");
      }

      if (i == cpu.SP) {
        $(byteElements[i]).addClass("stack-pointer");
      } else {
        $(byteElements[i]).removeClass("stack-pointer");
      }
    }
  }
}

function updateRegisters(i) {
  let bin = ("00000000" + cpu.memory.view[i].toString(2)).slice(-8);

  $("#registers-table > tbody > tr:eq(" + i + ") table td").each(function(
    index,
    elem
  ) {
    $(elem).text(bin[index]);
  });

  // Special cases
  switch (i) {
    case 0:
      $("#registers-table > tbody > tr:eq(2) table th").each(function(
        index,
        elem
      ) {
        $(elem)
          .text("1" === bin[index] ? "O" : "I")
          .attr("title", "1" === bin[index] ? "Output" : "Input");
      });
      break;
    case 1:
      $("#registers-table > tbody > tr:eq(3) table th").each(function(
        index,
        elem
      ) {
        $(elem)
          .text("1" === bin[index] ? "O" : "I")
          .attr("title", "1" === bin[index] ? "Output" : "Input");
      });
      break;
    case 4:
      $("#registers-table > tbody > tr:eq(6) table th").each(function(
        index,
        elem
      ) {
        $(elem)
          .text("1" === bin[index] ? "O" : "I")
          .attr("title", "1" === bin[index] ? "Output" : "Input");
      });
      break;
    case 5:
      $("#registers-table > tbody > tr:eq(7) table th").each(function(
        index,
        elem
      ) {
        $(elem)
          .text("1" === bin[index] ? "O" : "I")
          .attr("title", "1" === bin[index] ? "Output" : "Input");
      });
      break;
    case 0x15:
      $("#registers-table > tbody > tr:eq(0x16) table th").each(function(
        index,
        elem
      ) {
        $(elem)
          .text("1" === bin[index] ? "O" : "I")
          .attr("title", "1" === bin[index] ? "Output" : "Input");
      });
      break;
  }
}

function setPC(addr) {
  cpu.PC = addr;

  updatePCOutput();
}

function setSP(addr) {
  cpu.SP = addr;

  $("#register-SP-output").val(
    ("0" + Number(cpu.SP).toString(16)).slice(-4).toUpperCase()
  );
}

function setA(bytes) {
  cpu.A = bytes;
  cpu.D = (bytes << 8) + cpu.B;

  $("#register-A-output").val(
    ("0" + Number(cpu.A).toString(16)).slice(-2).toUpperCase()
  );
  $("#register-D-output").val(
    ("0" + Number(cpu.D).toString(16)).slice(-4).toUpperCase()
  );
}

function setB(bytes) {
  cpu.B = bytes;
  cpu.D = (cpu.A << 8) + bytes;

  $("#register-B-output").val(
    ("0" + Number(cpu.B).toString(16)).slice(-2).toUpperCase()
  );
  $("#register-D-output").val(
    ("0" + Number(cpu.D).toString(16)).slice(-4).toUpperCase()
  );
}

function setD(bytes) {
  cpu.D = bytes;
  cpu.A = bytes >> 8;
  cpu.B = bytes & 0xff;

  $("#register-D-output").val(
    ("0" + Number(cpu.D).toString(16)).slice(-4).toUpperCase()
  );
  $("#register-A-output").val(
    ("0" + Number(cpu.A).toString(16)).slice(-2).toUpperCase()
  );
  $("#register-B-output").val(
    ("0" + Number(cpu.B).toString(16)).slice(-2).toUpperCase()
  );
}

function setX(bytes) {
  cpu.X = bytes;

  $("#register-X-output").val(
    ("0" + Number(cpu.X).toString(16)).slice(-4).toUpperCase()
  );
}

function setY(bytes) {
  cpu.Y = bytes;

  $("#register-Y-output").val(
    ("0" + Number(cpu.Y).toString(16)).slice(-4).toUpperCase()
  );
}

function fullReset() {
  //setA(0);
  //setB(0);
  setD(0);
  setX(0);
  setY(0);
  setSP(0);
  //setPC(0x8000);
  cpu.PC = 0;

  clearStatusFlag("H");
  clearStatusFlag("I");
  clearStatusFlag("N");
  clearStatusFlag("Z");
  clearStatusFlag("V");
  clearStatusFlag("C");

  lastRAMWrite = 0;
  lastRAMRead = 0;

  cpu.clock.tickCount = 0;

  $("#clock-ticks-output").val(cpu.clock.tickCount);

  cpu.memory.view.fill(0);

  drawRAMOutput(cpu.memory.view, RAMSize, 1);
}

function setStatusFlag(flag) {
  switch (flag) {
    case "H":
      cpu.status.H = 1;
      break;
    case "I":
      cpu.status.I = 1;
      break;
    case "N":
      cpu.status.N = 1;
      break;
    case "Z":
      cpu.status.Z = 1;
      break;
    case "V":
      cpu.status.V = 1;
      break;
    case "C":
      cpu.status.C = 1;
      break;
  }

  $("#register-H-output").val(cpu.status.H);
  $("#register-I-output").val(cpu.status.I);
  $("#register-N-output").val(cpu.status.N);
  $("#register-Z-output").val(cpu.status.Z);
  $("#register-V-output").val(cpu.status.V);
  $("#register-C-output").val(cpu.status.C);
}

function clearStatusFlag(flag) {
  switch (flag) {
    case "H":
      cpu.status.H = 0;
      break;
    case "I":
      cpu.status.I = 0;
      break;
    case "N":
      cpu.status.N = 0;
      break;
    case "Z":
      cpu.status.Z = 0;
      break;
    case "V":
      cpu.status.V = 0;
      break;
    case "C":
      cpu.status.C = 0;
      break;
  }

  $("#register-H-output").val(cpu.status.H);
  $("#register-I-output").val(cpu.status.I);
  $("#register-N-output").val(cpu.status.N);
  $("#register-Z-output").val(cpu.status.Z);
  $("#register-V-output").val(cpu.status.V);
  $("#register-C-output").val(cpu.status.C);
}

function setPcToEntrypoint() {
  setPC(window.parseInt($("#entrypoint-text-input").val(), 16));
}

function updatePCOutput() {
  let view = cpu.ROM.view;
  let textareaIndex = (cpu.PC - 0x8000) * 2;

  $("#register-PC-output").val(
    ("0" + Number(cpu.PC).toString(16)).slice(-4).toUpperCase()
  );

  $("#hex-output-textarea").blur();
  $("#hex-output-textarea")[0].setSelectionRange(
    textareaIndex,
    textareaIndex + 2
  );
  $("#hex-output-textarea").focus();

  let fullInst;

  if ("SUBOP" != instructionTable[view[cpu.PC - 0x8000]].type) {
    fullInst = instructionTable[view[cpu.PC - 0x8000]].name.toUpperCase();

    for (let i = 1; i < instructionTable[view[cpu.PC - 0x8000]].len; i++) {
      fullInst +=
        " " +
        ("0" + view[cpu.PC - 0x8000 + i].toString(16)).slice(-2).toUpperCase();
    }
  } else {
    fullInst = subOps[view[cpu.PC - 0x8000]][
      view[cpu.PC - 0x8000 + 1]
    ].name.toUpperCase();
  }

  $("#instruction").text(fullInst);

  //console.log(cpu.PC.toString(16) + ": " + fullInst);
  $("#log-output-div > ul").append(
    "<li>" + cpu.PC.toString(16) + ": " + fullInst + "</li>"
  );
  let d = $("#log-output-div");
  d.scrollTop(d.prop("scrollHeight"));
}

function writeRAM(addr, byte, noDraw) {
  cpu.memory.view[addr] = byte;

  if (!noDraw) {
    lastRAMWrite = addr * 2; //TODO: Why is this devided by 2?
  }

  drawRAMOutput(cpu.memory.view, RAMSize);

  //Refresh if register
  if (0x40 > addr) {
    updateRegisters(addr);
  }
}

function readRAM(addr) {
  lastRAMRead = addr;

  drawRAMOutput(cpu.memory.view, RAMSize);

  return cpu.memory.view[addr];
}

function readROM(addr) {
  return cpu.ROM.view[addr - 0x8000];
}

function step() {
  let view = cpu.ROM.view;

  if ("SUBOP" == instructionTable[view[cpu.PC - 0x8000]].type) {
    if (
      undefined ==
      subOps[view[cpu.PC - 0x8000]][view[cpu.PC - 0x8000 + 1]].microcode
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
      instructionTable[view[cpu.PC - 0x8000]].microcode(view);
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
}

function advanceClock(ticks) {
  let preTick = cpu.clock.tickCount;
  cpu.clock.tickCount += ticks;

  let timer1Freq = 2; //2Mhz
  let timer3Freq = 0.25; //250khz

  for (let i = 0; i < ticks; i++) {
    let outCmp = (readRAM(0x000b) << 8) + readRAM(0x000c);
    if (Math.ceil(cpu.timer_1_2) + i == outCmp) {
      let bit1Csr = readRAM(0x0008) && 0b1000000;
      writeRAM(0x0008, bit1Csr ? readRAM(0x0008) | 0b0100000 : 0);
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

let instructionTable = {
  0x00: {
    name: "test",
    len: 1,
    type: "IMPLIED",
    cycles: 0,
    microcode: function() {
      //Clock
      advanceClock(this.cycles);

      //Next
      setPC(cpu.PC + this.len);
    }
  },
  0x01: {
    name: "nop",
    len: 1,
    type: "IMPLIED",
    cycles: 2,
    microcode: function() {
      //Clock
      advanceClock(this.cycles);

      //Next
      setPC(cpu.PC + this.len);
    }
  },
  0x02: {
    name: "andm",
    len: 3,
    type: "DIRECT2",
    cycles: 1,
    microcode: function(view) {
      let addr = view[cpu.PC - 0x8000 + 1];
      let operand = view[cpu.PC - 0x8000 + 2];

      let mem = readRAM(addr);
      let result = mem & operand;

      writeRAM(addr, result);

      // Do flag stuff
      if (0 === result) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }

      if ((result & 0xf0) == 0xf0) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      clearStatusFlag("V");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      cpu.clock.tickCount += this.cycles;
    }
  },
  0x03: {
    name: "orm",
    len: 3,
    type: "DIRECT2",
    cycles: 1,
    microcode: function(view) {
      let addr = view[cpu.PC - 0x8000 + 1];
      let operand = view[cpu.PC - 0x8000 + 2];

      let mem = readRAM(addr);
      let result = mem | operand;

      writeRAM(addr, result);

      // Do flag stuff
      if (0 === result) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }

      if ((result & 0xf0) == 0xf0) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      clearStatusFlag("V");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      cpu.clock.tickCount += this.cycles;
    }
  },
  0x04: {
    name: "lsrd",
    len: 1,
    type: "IMPLIED",
    cycles: 3,
    microcode: function(view) {
      let acc = cpu.D;

      setB(cpu.D >> 1);

      // Do flag stuff
      if (0xf000 == (cpu.D & 0xf000)) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      if (0xf000 == (acc & 0xf000)) {
        setStatusFlag("C");
      } else {
        clearStatusFlag("C");
      }

      if (
        (1 == cpu.status.N && 0 == cpu.status.C) ||
        (0 == cpu.status.N && 1 == cpu.status.C)
      ) {
        setStatusFlag("V");
      } else {
        clearStatusFlag("V");
      }

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x05: {
    name: "asld",
    len: 1,
    type: "IMPLIED",
    cycles: 3,
    microcode: function(view) {
      let acc = cpu.D;

      setB(cpu.D << 1);

      // Do flag stuff
      if (0xf000 == (cpu.D & 0xf000)) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      if (0xf000 == (acc & 0xf000)) {
        setStatusFlag("C");
      } else {
        clearStatusFlag("C");
      }

      if (
        (1 == cpu.status.N && 0 == cpu.status.C) ||
        (0 == cpu.status.N && 1 == cpu.status.C)
      ) {
        setStatusFlag("V");
      } else {
        clearStatusFlag("V");
      }

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x06: { name: "tap", len: 1, type: "IMPLIED", cycles: 0 },
  0x07: { name: "tpa", len: 1, type: "IMPLIED", cycles: 0 },
  0x08: {
    name: "inx",
    len: 1,
    type: "IMPLIED",
    cycles: 3,
    microcode: function(view) {
      setX(cpu.X + 1);

      // Do flag stuff
      if (0 === cpu.X) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }

      if (0xf000 == (cpu.X & 0xf000)) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      if (0x7f == cpu.X) {
        setStatusFlag("V");
      } else {
        clearStatusFlag("V");
      }

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x09: {
    name: "dex",
    len: 1,
    type: "IMPLIED",
    cycles: 3,
    microcode: function(view) {
      setX(cpu.X - 1);

      // Do flag stuff
      if (0 === cpu.X) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }

      if ((cpu.X & 0xf0) == 0xf0) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      if (0x7f == cpu.X) {
        setStatusFlag("V");
      } else {
        clearStatusFlag("V");
      }

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x0a: { name: "clv", len: 1, type: "IMPLIED", cycles: 0 },
  0x0b: { name: "sev", len: 1, type: "IMPLIED", cycles: 0 },
  0x0c: { name: "clc", len: 1, type: "IMPLIED", cycles: 0 },
  0x0d: { name: "sec", len: 1, type: "IMPLIED", cycles: 0 },
  0x0e: {
    name: "cli",
    len: 1,
    type: "IMPLIED",
    cycles: 2,
    microcode: function(view) {
      clearStatusFlag("I");
      //Next
      setPC(cpu.PC + this.len);

      //Clock
      cpu.clock.tickCount += this.cycles;
    }
  },
  0x0f: {
    name: "sei",
    len: 1,
    type: "IMPLIED",
    cycles: 2,
    microcode: function(view) {
      setStatusFlag("I");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      cpu.clock.tickCount += this.cycles;
    }
  },
  0x10: { name: "sba", len: 1, type: "IMPLIED", cycles: 0 },
  0x11: { name: "cba", len: 1, type: "IMPLIED", cycles: 0 },
  0x12: { name: "nop", len: 3, type: "EXTENDED", cycles: 0 },
  0x13: { name: "brclr2", len: 4, type: "DIRECT3", cycles: 0 },
  0x14: { name: "idiv", len: 2, type: "DIRECT", cycles: 6 },
  0x15: {
    name: "fdiv",
    len: 2,
    type: "DIRECT",
    cycles: 6,
    microcode: function(view) {
      //         15 57 FDIV  L0057 - 16bit x 8bit fractional divide
      //         with the
      //         parameters as you stated: D = numerator, direct mem location $57 =
      //         denominator, B = result, A = remainder. sets carry if overflow, i.e.
      //         numerator > denominator. if this is like the hc11 FDIV it will also
      //         set the carry on a divide by 0. the denominator is not affected.
      let addr = view[cpu.PC - 0x8000 + 1];
      let n = cpu.D; //numerator
      let d = readRAM(addr); //denominator

      let q = 0 == d ? 0xffff : n / d; //quotient
      let r = 0 == d ? 0x0 : q - (n % d); //remainder

      console.log(
        "n/d = q, r: ",
        +n.toString(16) +
          " / " +
          d.toString(16) +
          " = " +
          q.toString(16) +
          ", " +
          r.toString(16)
      );

      q = q - r;

      console.log(
        "n/d = q, r: ",
        +n.toString(16) +
          " / " +
          d.toString(16) +
          " = " +
          q.toString(16) +
          ", " +
          r.toString(16)
      );

      setA(r);
      setB(q);

      // Do flag stuff
      if (0 == q) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }

      if (d <= n) {
        setStatusFlag("V");
      } else {
        clearStatusFlag("V");
      }

      if (0 == d || n > d) {
        setStatusFlag("C");
      } else {
        clearStatusFlag("C");
      }

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      cpu.clock.tickCount += this.cycles;
    }
  },
  0x16: {
    name: "tab",
    len: 1,
    type: "IMPLIED",
    cycles: 2,
    microcode: function(view) {
      setB(cpu.A);

      // Do flag stuff
      if (0 === cpu.B) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }

      if ((cpu.B & 0xf0) == 0xf0) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      clearStatusFlag("V");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x17: { name: "tba", len: 1, type: "IMPLIED", cycles: 0 },
  0x18: { name: "xgxy", len: 1, type: "IMPLIED", cycles: 0 },
  0x19: { name: "daa", len: 1, type: "IMPLIED", cycles: 0 },
  0x1a: { name: "xgdx", len: 1, type: "IMPLIED", cycles: 0 },
  0x1b: { name: "aba", len: 1, type: "IMPLIED", cycles: 0 },
  0x1c: { name: "cpd", len: 3, type: "IMMEDIATE16", cycles: 0 },
  0x1d: { name: "cmpd1", len: 2, type: "DIRECT", cycles: 0 },
  0x1e: { name: "cpd", len: 2, type: "INDEXED", cycles: 0 },
  0x1f: { name: "cpd", len: 3, type: "EXTENDED", cycles: 0 },
  0x20: {
    name: "bra",
    len: 2,
    type: "RELATIVE",
    cycles: 3,
    microcode: function(view) {
      let jmpOffset = view[cpu.PC - 0x8000 + 1];

      setPC(cpu.PC + this.len);

      setPC(cpu.PC + jmpOffset);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x21: {
    name: "brn",
    len: 2,
    type: "RELATIVE",
    cycles: 3,
    microcode: function() {
      //Next
      setPC(cpu.PC + this.len);

      //Clock
      cpu.clock.tickCount += this.cycles;
    }
  },
  0x22: {
    name: "bhi",
    len: 2,
    type: "RELATIVE",
    cycles: 3,
    microcode: function(view) {
      let jmpOffset = view[cpu.PC - 0x8000 + 1];

      setPC(cpu.PC + this.len);

      if (0 == cpu.status.C + cpu.status.Z) {
        setPC(cpu.PC + jmpOffset);
      }

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x23: {
    name: "bls",
    len: 2,
    type: "RELATIVE",
    cycles: 3,
    microcode: function(view) {
      let jmpOffset = view[cpu.PC - 0x8000 + 1];

      setPC(cpu.PC + this.len);

      if (1 == cpu.status.C || cpu.status.Z) {
        setPC(cpu.PC + jmpOffset);
      }

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x24: {
    name: "bcc",
    len: 2,
    type: "RELATIVE",
    cycles: 3,
    microcode: function(view) {
      let jmpOffset = view[cpu.PC - 0x8000 + 1];

      setPC(cpu.PC + this.len);

      if (0 == cpu.status.C) {
        setPC(cpu.PC + jmpOffset);
      }

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x25: {
    name: "bcs",
    len: 2,
    type: "RELATIVE",
    cycles: 3,
    microcode: function(view) {
      let jmpOffset = view[cpu.PC - 0x8000 + 1];

      setPC(cpu.PC + this.len);

      if (1 == cpu.status.C) {
        setPC(cpu.PC + jmpOffset);
      }

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x26: {
    name: "bne",
    len: 2,
    type: "RELATIVE",
    cycles: 3,
    microcode: function(view) {
      let jmpOffset = view[cpu.PC - 0x8000 + 1];

      setPC(cpu.PC + this.len);

      if (0 == cpu.status.Z) {
        setPC(cpu.PC + jmpOffset);
      }

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x27: {
    name: "beq",
    len: 2,
    type: "RELATIVE",
    cycles: 3,
    microcode: function(view) {
      let jmpOffset = view[cpu.PC - 0x8000 + 1];

      setPC(cpu.PC + this.len);

      if (1 == cpu.status.Z) {
        setPC(cpu.PC + jmpOffset);
      }

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x28: { name: "bvc", len: 2, type: "RELATIVE", cycles: 0 },
  0x29: { name: "bvs", len: 2, type: "RELATIVE", cycles: 0 },
  0x2a: { name: "bpl", len: 2, type: "RELATIVE", cycles: 0 },
  0x2b: {
    name: "bmi",
    len: 2,
    type: "RELATIVE",
    cycles: 3,
    microcode: function(view) {
      let jmpOffset = view[cpu.PC - 0x8000 + 1];

      setPC(cpu.PC + this.len);

      if (1 == cpu.status.N) {
        setPC(cpu.PC + jmpOffset);
      }

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x2c: { name: "bge", len: 2, type: "RELATIVE", cycles: 0 },
  0x2d: { name: "blt", len: 2, type: "RELATIVE", cycles: 0 },
  0x2e: { name: "bgt", len: 2, type: "RELATIVE", cycles: 0 },
  0x2f: { name: "ble", len: 2, type: "RELATIVE", cycles: 0 },
  0x30: { name: "tsx", len: 1, type: "IMPLIED", cycles: 0 },
  0x31: { name: "ins", len: 1, type: "IMPLIED", cycles: 0 },
  0x32: {
    name: "pula",
    len: 1,
    type: "IMPLIED",
    cycles: 4,
    microcode: function(view) {
      setSP(cpu.SP + 1);
      let b1 = readRAM(cpu.SP);

      setA(b1);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x33: {
    name: "pulb",
    len: 1,
    type: "IMPLIED",
    cycles: 4,
    microcode: function(view) {
      setSP(cpu.SP + 1);
      let b1 = readRAM(cpu.SP);

      setB(b1);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x34: { name: "des", len: 1, type: "IMPLIED", cycles: 0 },
  0x35: { name: "txs", len: 1, type: "IMPLIED", cycles: 0 },
  0x36: {
    name: "psha",
    len: 1,
    type: "IMPLIED",
    cycles: 3,
    microcode: function(view) {
      writeRAM(cpu.SP, cpu.A);
      setSP(cpu.SP - 1);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x37: {
    name: "pshb",
    len: 1,
    type: "IMPLIED",
    cycles: 3,
    microcode: function(view) {
      writeRAM(cpu.SP, cpu.B);
      setSP(cpu.SP - 1);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x38: {
    name: "pulx",
    len: 1,
    type: "IMPLIED",
    cycles: 5,
    microcode: function(view) {
      setSP(cpu.SP + 1);
      let b1 = readRAM(cpu.SP);

      setX(b1);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x39: {
    name: "rts",
    len: 1,
    type: "IMPLIED",
    cycles: 5,
    microcode: function(view) {
      setSP(cpu.SP + 1);
      let b1 = readRAM(cpu.SP);

      setSP(cpu.SP + 1);
      let b2 = readRAM(cpu.SP);

      let addr = (b2 << 8) + b1;

      setPC(addr);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x3a: {
    name: "abx",
    len: 1,
    type: "IMPLIED",
    cycles: 3,
    microcode: function(view) {
      setX(cpu.B + cpu.X);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x3b: { name: "rti", len: 1, type: "IMPLIED", cycles: 0 },
  0x3c: { name: "pshx", len: 1, type: "IMPLIED", cycles: 0 },
  0x3d: {
    name: "mul",
    len: 1,
    type: "IMPLIED",
    cycles: 10,
    microcode: function(view) {
      setD(cpu.A * cpu.B);

      // Do flag stuff
      if (1 == (cpu.B & 0b01000000)) {
        setStatusFlag("C");
      } else {
        clearStatusFlag("C");
      }

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x3e: { name: "wai", len: 1, type: "IMPLIED", cycles: 0 },
  0x3f: { name: "swi", len: 1, type: "IMPLIED", cycles: 0 },
  0x40: { name: "nega", len: 1, type: "IMPLIED", cycles: 0 },
  0x41: { name: "0x42", len: 1, type: "IMPLIED", cycles: 0 },
  0x42: { name: "0x42", len: 0, type: "IMPLIED", cycles: 0 },
  0x43: {
    name: "coma",
    len: 1,
    type: "IMPLIED",
    cycles: 2,
    microcode: function(view) {
      setA(0xff - cpu.A);

      // Do flag stuff
      if (0 === cpu.A) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }

      if ((cpu.A & 0xf0) == 0xf0) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      clearStatusFlag("V");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x44: {
    name: "lsra",
    len: 1,
    type: "IMPLIED",
    cycles: 2,
    microcode: function(view) {
      let acc = cpu.A;

      setA(cpu.A >>> 1);

      // Do flag stuff
      if (0xf0 == (cpu.A & 0xf0)) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      if (0xf0 == (acc & 0xf0)) {
        setStatusFlag("C");
      } else {
        clearStatusFlag("C");
      }

      if (
        (1 == cpu.status.N && 0 == cpu.status.C) ||
        (0 == cpu.status.N && 1 == cpu.status.C)
      ) {
        setStatusFlag("V");
      } else {
        clearStatusFlag("V");
      }

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x45: { name: "0x45", len: 0, type: "IMPLIED", cycles: 0 },
  0x46: { name: "rora", len: 1, type: "IMPLIED", cycles: 0 },
  0x47: {
    name: "asra",
    len: 1,
    type: "IMPLIED",
    cycles: 2,
    microcode: function(view) {
      let acc = cpu.A;

      setA(cpu.A >> 1);

      // Do flag stuff
      if (0xf0 == (cpu.A & 0xf0)) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      if (0xf0 == (acc & 0xf0)) {
        setStatusFlag("C");
      } else {
        clearStatusFlag("C");
      }

      if (
        (1 == cpu.status.N && 0 == cpu.status.C) ||
        (0 == cpu.status.N && 1 == cpu.status.C)
      ) {
        setStatusFlag("V");
      } else {
        clearStatusFlag("V");
      }

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x48: {
    name: "asla",
    len: 1,
    type: "IMPLIED",
    cycles: 2,
    microcode: function(view) {
      let acc = cpu.A;
      setA(cpu.A << 1);

      // Do flag stuff
      if (0xf0 == (cpu.A & 0xf0)) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      if (0xf0 == (acc & 0xf0)) {
        setStatusFlag("C");
      } else {
        clearStatusFlag("C");
      }

      if (
        (1 == cpu.status.N && 0 == cpu.status.C) ||
        (0 == cpu.status.N && 1 == cpu.status.C)
      ) {
        setStatusFlag("V");
      } else {
        clearStatusFlag("V");
      }

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x49: { name: "rola", len: 1, type: "IMPLIED", cycles: 0 },
  0x4a: { name: "deca", len: 1, type: "IMPLIED", cycles: 0 },
  0x4b: { name: "0x4b", len: 0, type: "IMPLIED", cycles: 0 },
  0x4c: {
    name: "inca",
    len: 1,
    type: "IMPLIED",
    cycles: 2,
    microcode: function(view) {
      setA(cpu.A + 1);

      // Do flag stuff
      if (0 === cpu.A) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }

      if ((cpu.A & 0xf0) == 0xf0) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      if (0x7f == cpu.A) {
        setStatusFlag("V");
      } else {
        clearStatusFlag("V");
      }

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x4d: { name: "tsta", len: 1, type: "IMPLIED", cycles: 0 },
  0x4e: { name: "0x4e", len: 0, type: "IMPLIED", cycles: 0 },
  0x4f: {
    name: "clra",
    len: 1,
    type: "IMPLIED",
    cycles: 2,
    microcode: function(view) {
      setA(0);

      // Do flag stuff
      setStatusFlag("Z");
      clearStatusFlag("N");
      clearStatusFlag("V");
      clearStatusFlag("C");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x50: { name: "negb", len: 1, type: "IMPLIED", cycles: 0 },
  0x51: { name: "0x51", len: 0, type: "IMPLIED", cycles: 0 },
  0x52: { name: "0x52", len: 0, type: "IMPLIED", cycles: 0 },
  0x53: { name: "comb", len: 1, type: "IMPLIED", cycles: 0 },
  0x54: { name: "lsrb", len: 1, type: "IMPLIED", cycles: 0 },
  0x55: { name: "0x55", len: 0, type: "IMPLIED", cycles: 0 },
  0x56: { name: "rorb", len: 1, type: "IMPLIED", cycles: 0 },
  0x57: {
    name: "asrb",
    len: 1,
    type: "IMPLIED",
    cycles: 2,
    microcode: function(view) {
      setB(cpu.B >> 1);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x58: {
    name: "aslb",
    len: 1,
    type: "IMPLIED",
    cycles: 2,
    microcode: function(view) {
      setB(cpu.B << 1);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x59: { name: "rolb", len: 1, type: "IMPLIED", cycles: 0 },
  0x5a: {
    name: "decb",
    len: 1,
    type: "IMPLIED",
    cycles: 2,
    microcode: function(view) {
      setB(cpu.B + 1);

      // Do flag stuff
      if (0 === cpu.B) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }

      if ((cpu.B & 0xf0) == 0xf0) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      if (0x7f == cpu.B) {
        setStatusFlag("V");
      } else {
        clearStatusFlag("V");
      }

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x5b: { name: "0x5b", len: 0, type: "IMPLIED", cycles: 0 },
  0x5c: { name: "incb", len: 1, type: "IMPLIED", cycles: 0 },
  0x5d: { name: "tstb", len: 1, type: "IMPLIED", cycles: 0 },
  0x5e: { name: "0x5e", len: 0, type: "IMPLIED", cycles: 0 },
  0x5f: {
    name: "clrb",
    len: 1,
    type: "IMPLIED",
    cycles: 2,
    microcode: function(view) {
      setB(0);

      // Do flag stuff
      setStatusFlag("Z");
      clearStatusFlag("N");
      clearStatusFlag("V");
      clearStatusFlag("C");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x60: { name: "neg", len: 2, type: "INDEXED", cycles: 0 },
  0x61: { name: "0x61", len: 0, type: "INDEXED", cycles: 0 },
  0x62: { name: "0x62", len: 0, type: "INDEXED", cycles: 0 },
  0x63: { name: "com", len: 2, type: "INDEXED", cycles: 0 },
  0x64: { name: "lsr", len: 2, type: "INDEXED", cycles: 0 },
  0x65: { name: "0x65", len: 0, type: "INDEXED", cycles: 0 },
  0x66: { name: "ror", len: 2, type: "INDEXED", cycles: 0 },
  0x67: { name: "asr", len: 2, type: "INDEXED", cycles: 0 },
  0x68: { name: "asl", len: 2, type: "INDEXED", cycles: 0 },
  0x69: { name: "rol", len: 2, type: "INDEXED", cycles: 0 },
  0x6a: {
    name: "dec",
    len: 2,
    type: "INDEXED",
    cycles: 6,
    microcode: function(view) {
      let b1 = view[cpu.PC - 0x8000 + 1];
      let addr = b1 + cpu.X;
      let mem = readRAM(addr);
      let result = mem - 1;

      writeRAM(addr, result);

      // Do flag stuff
      if (0 == result) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }

      if ((result & 0xf0) == 0xf0) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      if (0x80 == mem) {
        setStatusFlag("V");
      } else {
        clearStatusFlag("V");
      }

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x6b: { name: "nop", len: 1, type: "IMPLIED", cycles: 0 },
  0x6c: { name: "inc", len: 2, type: "INDEXED", cycles: 0 },
  0x6d: { name: "tst", len: 2, type: "INDEXED", cycles: 0 },
  0x6e: { name: "jmp", len: 2, type: "INDEXED", cycles: 0 },
  0x6f: { name: "clr", len: 2, type: "INDEXED", cycles: 0 },
  0x70: { name: "neg", len: 3, type: "EXTENDED", cycles: 0 },
  0x71: { name: "0x71", len: 0, type: "EXTENDED", cycles: 0 },
  0x72: { name: "0x72", len: 0, type: "EXTENDED", cycles: 0 },
  0x73: { name: "com", len: 3, type: "EXTENDED", cycles: 0 },
  0x74: { name: "lsr", len: 3, type: "EXTENDED", cycles: 0 },
  0x75: { name: "0x75", len: 0, type: "EXTENDED", cycles: 0 },
  0x76: { name: "ror", len: 3, type: "EXTENDED", cycles: 0 },
  0x77: { name: "asr", len: 3, type: "EXTENDED", cycles: 0 },
  0x78: { name: "asl", len: 3, type: "EXTENDED", cycles: 0 },
  0x79: { name: "rol", len: 3, type: "EXTENDED", cycles: 0 },
  0x7a: {
    name: "dec",
    len: 3,
    type: "EXTENDED",
    cycles: 6,
    microcode: function(view) {
      let firstByte = view[cpu.PC - 0x8000 + 1];
      let secondByte = view[cpu.PC - 0x8000 + 2];
      let addr = (firstByte << 8) + secondByte;
      let mem = readRAM(addr);
      let result = mem - 1;

      writeRAM(addr, result);

      // Do flag stuff
      if (0 === result) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }

      if ((result & 0xf0) == 0xf0) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      if (0x80 == mem) {
        setStatusFlag("V");
      } else {
        clearStatusFlag("V");
      }

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x7b: { name: "0x7b", len: 0, type: "EXTENDED", cycles: 0 },
  0x7c: {
    name: "inc",
    len: 3,
    type: "EXTENDED",
    cycles: 6,
    microcode: function(view) {
      let firstByte = view[cpu.PC - 0x8000 + 1];
      let secondByte = view[cpu.PC - 0x8000 + 2];
      let addr = (firstByte << 8) + secondByte;
      let mem = readRAM(addr);
      let result = mem + 1;

      writeRAM(addr, result);

      // Do flag stuff
      if (0 === result) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }

      if ((result & 0xf0) == 0xf0) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      if (0x7f == mem) {
        setStatusFlag("V");
      } else {
        clearStatusFlag("V");
      }

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x7d: { name: "tst", len: 3, type: "EXTENDED", cycles: 0 },
  0x7e: {
    name: "jmp",
    len: 3,
    type: "EXTENDED",
    cycles: 3,
    microcode: function(view) {
      let firstByte = view[cpu.PC - 0x8000 + 1];
      let secondByte = view[cpu.PC - 0x8000 + 2];
      let addr = (firstByte << 8) + secondByte;

      setPC(addr);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x7f: { name: "clr", len: 3, type: "EXTENDED", cycles: 0 },
  0x80: {
    name: "suba",
    len: 2,
    type: "IMMEDIATE",
    cycles: 2,
    microcode: function(view) {
      let b1 = view[cpu.PC - 0x8000 + 1];
      let result = cpu.A - b1;

      setA(result);

      // Do flag stuff
      if (0 === result) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }

      if ((cpu.A & 0xf0) == 0xf0) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      if (result > 0xffff) {
        clearStatusFlag("V");
      } else {
        clearStatusFlag("V");
      }

      if (result > 0xffff) {
        clearStatusFlag("C");
      } else {
        clearStatusFlag("C");
      }

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x81: {
    name: "cmpa",
    len: 2,
    type: "IMMEDIATE",
    cycles: 2,
    microcode: function(view) {
      let b1 = view[cpu.PC - 0x8000 + 1];
      let result = cpu.A - b1;

      // Do flag stuff
      if (0 === result) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }

      if ((cpu.A & 0xf0) == 0xf0) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      if (result > 0xffff) {
        clearStatusFlag("V");
      } else {
        clearStatusFlag("V");
      }

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x82: { name: "sbca", len: 2, type: "IMMEDIATE", cycles: 0 },
  0x83: { name: "subd", len: 3, type: "IMMEDIATE16", cycles: 0 },
  0x84: {
    name: "anda",
    len: 2,
    type: "IMMEDIATE",
    cycles: 2,
    microcode: function(view) {
      let firstByte = view[cpu.PC - 0x8000 + 1];

      setA(cpu.A & firstByte);

      // Do flag stuff
      if (0 === cpu.A) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }

      if ((cpu.A & 0xf0) == 0xf0) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      clearStatusFlag("V");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x85: { name: "bita", len: 2, type: "IMMEDIATE", cycles: 0 },
  0x86: {
    name: "ldaa",
    len: 2,
    type: "IMMEDIATE",
    cycles: 2,
    microcode: function(view) {
      let firstByte = view[cpu.PC - 0x8000 + 1];

      setA(firstByte);

      // Do flag stuff
      if (0 === cpu.A) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }

      if ((cpu.A & 0xf0) == 0xf0) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      clearStatusFlag("V");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x87: {
    name: "brset",
    len: 4,
    type: "DIRECT3",
    cycles: 1,
    microcode: function(view) {
      let addr = view[cpu.PC - 0x8000 + 1];
      let bitMask = view[cpu.PC - 0x8000 + 2];
      let jmpOffset = view[cpu.PC - 0x8000 + 3];

      setPC(cpu.PC + this.len);

      if ((0 != readRAM(addr)) & bitMask) {
        setPC(cpu.PC + jmpOffset);
      }

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x88: { name: "eora", len: 2, type: "IMMEDIATE", cycles: 0 },
  0x89: { name: "adca", len: 2, type: "IMMEDIATE", cycles: 0 },
  0x8a: {
    name: "oraa",
    len: 2,
    type: "IMMEDIATE",
    cycles: 2,
    microcode: function(view) {
      let b1 = view[cpu.PC - 0x8000 + 1];

      setA(cpu.A | b1);

      // Do flag stuff
      if (0 == cpu.A) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }

      if ((cpu.A & 0xf0) == 0xf0) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      clearStatusFlag("V");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x8b: { name: "adda", len: 2, type: "IMMEDIATE", cycles: 0 },
  0x8c: { name: "cpx", len: 3, type: "IMMEDIATE16", cycles: 0 },
  0x8d: {
    name: "bsr",
    len: 2,
    type: "RELATIVE",
    cycles: 6,
    microcode: function(view) {
      let b1 = view[cpu.PC - 0x8000 + 1];

      setPC(cpu.PC + this.len);

      let PcByte1 = cpu.PC >> 8;
      let PcByte2 = cpu.PC & 0xff;

      writeRAM(cpu.SP, PcByte1);
      setSP(cpu.SP - 1);

      writeRAM(cpu.SP, PcByte2);
      setSP(cpu.SP - 1);

      setPC(cpu.PC + b1);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x8e: {
    name: "lds",
    len: 3,
    type: "IMMEDIATE16",
    cycles: 3,
    microcode: function(view) {
      let firstByte = view[cpu.PC - 0x8000 + 1];
      let secondByte = view[cpu.PC - 0x8000 + 2];
      let addr = (firstByte << 8) + secondByte;

      setSP(addr);

      // Do flag stuff
      if (0 == addr) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }

      if ((addr & 0xf000) == 0xf000) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      clearStatusFlag("V");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x8f: {
    name: "brclr",
    len: 4,
    type: "DIRECT3",
    cycles: 1,
    microcode: function(view) {
      let addr = view[cpu.PC - 0x8000 + 1];
      let bitMask = view[cpu.PC - 0x8000 + 2];
      let jmpOffset = view[cpu.PC - 0x8000 + 3];

      setPC(cpu.PC + this.len);

      if ((0 == readRAM(addr)) & bitMask) {
        setPC(cpu.PC + jmpOffset);
      }

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x90: { name: "suba", len: 2, type: "DIRECT", cycles: 0 },
  0x91: { name: "cmpa", len: 2, type: "DIRECT", cycles: 0 },
  0x92: { name: "sbca", len: 2, type: "DIRECT", cycles: 0 },
  0x93: {
    name: "subd",
    len: 2,
    type: "DIRECT",
    cycles: 5,
    microcode: function(view) {
      let acc = cpu.D;
      let b1 = view[cpu.PC - 0x8000 + 1];
      let mem1 = readRAM(b1);
      let mem2 = readRAM(b1 + 1);
      let mem = ((mem1 >> 8) + mem2) & 0xff;
      let result = cpu.D - mem;

      setD(result);

      // Do flag stuff
      if (0 == cpu.D) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }

      if ((cpu.D & 0xf000) == 0xf000) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      // 2s compliment overflow test
      // Get MSBs of the operands
      let oa = acc & 0xf000;
      let ob = mem & 0xf000;

      if (oa != ob) {
        clearStatusFlag("V");
      } else {
        clearStatusFlag("V");
      }

      if (mem > acc) {
        clearStatusFlag("C");
      } else {
        clearStatusFlag("C");
      }

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x94: {
    name: "anda",
    len: 2,
    type: "DIRECT",
    cycles: 3,
    microcode: function(view) {
      let addr = view[cpu.PC - 0x8000 + 1];

      let mem = readRAM(addr);

      setA(cpu.A & mem);

      // Do flag stuff
      if (0 == cpu.A) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }

      if ((cpu.A & 0xf0) == 0xf0) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      clearStatusFlag("V");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x95: { name: "bita", len: 2, type: "DIRECT", cycles: 0 },
  0x96: {
    name: "ldaa",
    len: 2,
    type: "DIRECT",
    cycles: 3,
    microcode: function(view) {
      let addr = view[cpu.PC - 0x8000 + 1];

      let mem = readRAM(addr);

      setA(mem);

      // Do flag stuff
      if (0 == cpu.A) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }

      if ((cpu.A & 0xf0) == 0xf0) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      clearStatusFlag("V");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x97: {
    name: "staa",
    len: 2,
    type: "DIRECT",
    cycles: 3,
    microcode: function(view) {
      let addr = view[cpu.PC - 0x8000 + 1];

      writeRAM(addr, cpu.A);

      // Do flag stuff
      if (0 == cpu.A) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }

      if ((cpu.A & 0xf0) == 0xf0) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      clearStatusFlag("V");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x98: {
    name: "eora",
    len: 2,
    type: "DIRECT",
    cycles: 3,
    microcode: function(view) {
      let addr = view[cpu.PC - 0x8000 + 1];

      let mem = readRAM(addr);

      setA(cpu.A ^ mem);

      // Do flag stuff
      if (0 == cpu.A) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }

      if ((cpu.A & 0xf0) == 0xf0) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      clearStatusFlag("V");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x99: { name: "adca", len: 2, type: "DIRECT", cycles: 0 },
  0x9a: { name: "oraa", len: 2, type: "DIRECT", cycles: 0 },
  0x9b: {
    name: "adda",
    len: 2,
    type: "DIRECT",
    cycles: 3,
    microcode: function(view) {
      let addr = view[cpu.PC - 0x8000 + 1];

      let mem = readRAM(addr);

      setA(cpu.A + mem);

      // Do flag stuff
      if (0 == cpu.A) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }

      if ((cpu.A & 0xf0) == 0xf0) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      clearStatusFlag("V");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x9c: {
    name: "cpx",
    len: 2,
    type: "DIRECT",
    cycles: 5,
    microcode: function(view) {
      let b1 = view[cpu.PC - 0x8000 + 1];
      let mem = readRAM(b1);

      let result = cpu.X - mem;

      // Do flag stuff
      if (0 === result) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }

      if ((cpu.A & 0xf0) == 0xf0) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      if (result > 0xffff) {
        clearStatusFlag("V");
      } else {
        clearStatusFlag("V");
      }

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x9d: { name: "jsr", len: 2, type: "DIRECT", cycles: 0 },
  0x9e: { name: "lds", len: 2, type: "DIRECT", cycles: 0 },
  0x9f: { name: "sts", len: 2, type: "DIRECT", cycles: 0 },
  0xa0: { name: "suba", len: 2, type: "INDEXED", cycles: 0 },
  0xa1: { name: "cmpa", len: 2, type: "INDEXED", cycles: 0 },
  0xa2: { name: "sbca", len: 2, type: "INDEXED", cycles: 0 },
  0xa3: { name: "subd", len: 2, type: "INDEXED", cycles: 0 },
  0xa4: { name: "anda", len: 2, type: "INDEXED", cycles: 0 },
  0xa5: { name: "bita", len: 2, type: "INDEXED", cycles: 0 },
  0xa6: { name: "ldaa", len: 2, type: "INDEXED", cycles: 0 },
  0xa7: { name: "staa", len: 2, type: "INDEXED", cycles: 0 },
  0xa8: { name: "eora", len: 2, type: "INDEXED", cycles: 0 },
  0xa9: { name: "adca", len: 2, type: "INDEXED", cycles: 0 },
  0xaa: { name: "oraa", len: 2, type: "INDEXED", cycles: 0 },
  0xab: { name: "adda", len: 2, type: "INDEXED", cycles: 0 },
  0xac: { name: "cpx", len: 2, type: "INDEXED", cycles: 0 },
  0xad: { name: "jsr", len: 2, type: "INDEXED", cycles: 0 },
  0xae: { name: "lds", len: 2, type: "INDEXED", cycles: 0 },
  0xaf: { name: "sts", len: 2, type: "INDEXED", cycles: 0 },
  0xb0: { name: "suba", len: 3, type: "EXTENDED", cycles: 0 },
  0xb1: { name: "cmpa", len: 3, type: "EXTENDED", cycles: 0 },
  0xb2: { name: "sbca", len: 3, type: "EXTENDED", cycles: 0 },
  0xb3: { name: "subd", len: 3, type: "EXTENDED", cycles: 0 },
  0xb4: { name: "anda", len: 3, type: "EXTENDED", cycles: 0 },
  0xb5: { name: "bita", len: 3, type: "EXTENDED", cycles: 0 },
  0xb6: {
    name: "ldaa",
    len: 3,
    type: "EXTENDED",
    cycles: 3,
    microcode: function(view) {
      let firstByte = view[cpu.PC - 0x8000 + 1];
      let secondByte = view[cpu.PC - 0x8000 + 2];
      let addr = (firstByte << 8) + secondByte;
      let mem;

      if (RAMSize >= addr) {
        mem = readRAM(addr);
      } else {
        mem = readROM(addr);
      }

      setA(mem);

      // Do flag stuff
      if (0 == cpu.A) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }

      if ((cpu.A & 0xf0) == 0xf0) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      clearStatusFlag("V");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xb7: {
    name: "staa",
    len: 3,
    type: "EXTENDED",
    cycles: 4,
    microcode: function(view) {
      let firstByte = view[cpu.PC - 0x8000 + 1];
      let secondByte = view[cpu.PC - 0x8000 + 2];
      let addr = (firstByte << 8) + secondByte;

      writeRAM(addr, cpu.A);

      // Do flag stuff
      if (0 == cpu.A) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }

      if ((cpu.A & 0xf0) == 0xf0) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      clearStatusFlag("V");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xb8: {
    name: "eora",
    len: 3,
    type: "EXTENDED",
    cycles: 4,
    microcode: function(view) {
      let firstByte = view[cpu.PC - 0x8000 + 1];
      let secondByte = view[cpu.PC - 0x8000 + 2];
      let addr = (firstByte << 8) + secondByte;

      let b1 = readRAM(addr);

      setA(cpu.A ^ b1);

      // Do flag stuff
      if (0 == cpu.A) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }

      if ((cpu.A & 0xf0) == 0xf0) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      clearStatusFlag("V");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xb9: { name: "adca", len: 3, type: "EXTENDED", cycles: 0 },
  0xba: { name: "oraa", len: 3, type: "EXTENDED", cycles: 0 },
  0xbb: { name: "adda", len: 3, type: "EXTENDED", cycles: 0 },
  0xbc: { name: "cpx", len: 3, type: "EXTENDED", cycles: 0 },
  0xbd: {
    name: "jsr",
    len: 3,
    type: "EXTENDED",
    cycles: 6,
    microcode: function(view) {
      let firstByte = view[cpu.PC - 0x8000 + 1];
      let secondByte = view[cpu.PC - 0x8000 + 2];
      let addr = (firstByte << 8) + secondByte;

      setPC(cpu.PC + this.len);

      let PcByte1 = cpu.PC >> 8;
      let PcByte2 = cpu.PC & 0xff;

      writeRAM(cpu.SP, PcByte1);
      setSP(cpu.SP - 1);

      writeRAM(cpu.SP, PcByte2);
      setSP(cpu.SP - 1);

      setPC(addr);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xbe: { name: "lds", len: 3, type: "EXTENDED", cycles: 0 },
  0xbf: { name: "sts", len: 3, type: "EXTENDED", cycles: 0 },
  0xc0: { name: "subb", len: 2, type: "IMMEDIATE", cycles: 0 },
  0xc1: {
    name: "cmpb",
    len: 2,
    type: "IMMEDIATE",
    cycles: 2,
    microcode: function(view) {
      let b1 = view[cpu.PC - 0x8000 + 1];
      let result = cpu.B - b1;

      // Do flag stuff
      if (0 == result) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }

      if ((cpu.A & 0xf0) == 0xf0) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      if (result > 0xffff) {
        clearStatusFlag("V");
      } else {
        clearStatusFlag("V");
      }

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xc2: { name: "sbcb", len: 2, type: "IMMEDIATE", cycles: 0 },
  0xc3: {
    name: "addd",
    len: 3,
    type: "IMMEDIATE16",
    cycles: 4,
    microcode: function(view) {
      let acc = cpu.D;
      let firstByte = view[cpu.PC - 0x8000 + 1];
      let secondByte = view[cpu.PC - 0x8000 + 2];
      let word = (firstByte << 8) + secondByte;
      let result = cpu.D + word;

      setD(result);

      // Do flag stuff
      if (0 == cpu.D) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }

      if ((cpu.D & 0xf000) == 0xf000) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      // 2s compliment overflow test
      // Get MSBs of the operands
      let oa = acc & 0xf000;
      let ob = word & 0xf000;

      if (oa != ob) {
        clearStatusFlag("V");
      } else {
        clearStatusFlag("V");
      }

      if (result >= 0x10000) {
        clearStatusFlag("C");
      } else {
        clearStatusFlag("C");
      }

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xc4: {
    name: "andb",
    len: 2,
    type: "IMMEDIATE",
    cycles: 2,
    microcode: function(view) {
      let value = view[cpu.PC - 0x8000 + 1];

      setB(cpu.B & value);

      // Do flag stuff
      if (0 == cpu.B) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }

      if ((cpu.B & 0xf0) == 0xf0) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      clearStatusFlag("V");

      //Clock
      advanceClock(this.cycles);

      //Next
      setPC(cpu.PC + this.len);
    }
  },
  0xc5: { name: "bitb", len: 2, type: "IMMEDIATE", cycles: 0 },
  0xc6: {
    name: "ldab",
    len: 2,
    type: "IMMEDIATE",
    cycles: 2,
    microcode: function(view) {
      let firstByte = view[cpu.PC - 0x8000 + 1];

      setB(firstByte);

      // Do flag stuff
      if (0 == cpu.B) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }

      if ((cpu.B & 0xf0) == 0xf0) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      clearStatusFlag("V");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xc7: { name: "brset", len: 4, type: "INDEXED", cycles: 0 },
  0xc8: { name: "eorb", len: 2, type: "IMMEDIATE", cycles: 0 },
  0xc9: { name: "adcb", len: 2, type: "IMMEDIATE", cycles: 0 },
  0xca: {
    name: "orab",
    len: 2,
    type: "IMMEDIATE",
    cycles: 2,
    microcode: function(view) {
      let b1 = view[cpu.PC - 0x8000 + 1];

      setA(cpu.A | b1);

      // Do flag stuff
      if (0 == cpu.A) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }

      if ((cpu.A & 0xf0) == 0xf0) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      clearStatusFlag("V");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xcb: { name: "addb", len: 2, type: "IMMEDIATE", cycles: 0 },
  0xcc: {
    name: "ldd",
    len: 3,
    type: "IMMEDIATE16",
    cycles: 3,
    microcode: function(view) {
      let firstByte = view[cpu.PC - 0x8000 + 1];
      let secondByte = view[cpu.PC - 0x8000 + 2];
      let word = (firstByte << 8) + secondByte;

      setD(word);

      // Do flag stuff
      if (0 == word) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }

      if ((word & 0xf000) == 0xf000) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      clearStatusFlag("V");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xcd: { name: "0xcd", len: 0, type: "SUBOP", cycles: 0 },
  0xce: {
    name: "ldx",
    len: 3,
    type: "IMMEDIATE16",
    cycles: 3,
    microcode: function(view) {
      let firstByte = view[cpu.PC - 0x8000 + 1];
      let secondByte = view[cpu.PC - 0x8000 + 2];
      let word = (firstByte << 8) + secondByte;

      setX(word);

      // Do flag stuff
      if (0 == word) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }

      if ((word & 0xf000) == 0xf000) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      clearStatusFlag("V");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xcf: {
    name: "brclr",
    len: 4,
    type: "INDEXED",
    cycles: 1,
    microcode: function(view) {
      let addr = cpu.X + view[cpu.PC - 0x8000 + 1];
      let bitMask = view[cpu.PC - 0x8000 + 2];
      let jmpOffset = view[cpu.PC - 0x8000 + 3];

      setPC(cpu.PC + this.len);

      if ((0 == readRAM(addr)) & bitMask) {
        setPC(cpu.PC + jmpOffset);
      }

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xd0: { name: "subb", len: 2, type: "DIRECT", cycles: 0 },
  0xd1: {
    name: "cmpb",
    len: 2,
    type: "DIRECT",
    cycles: 3,
    microcode: function(view) {
      let b1 = view[cpu.PC - 0x8000 + 1];
      let mem = readRAM(b1);
      let result = cpu.B - mem;

      // Do flag stuff
      if (0 === result) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }

      if ((cpu.A & 0xf0) == 0xf0) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      if (result > 0xffff) {
        clearStatusFlag("V");
      } else {
        clearStatusFlag("V");
      }

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xd2: { name: "sbcb", len: 2, type: "DIRECT", cycles: 0 },
  0xd3: { name: "addd", len: 2, type: "DIRECT", cycles: 0 },
  0xd4: { name: "andb", len: 2, type: "DIRECT", cycles: 0 },
  0xd5: { name: "bitb", len: 2, type: "DIRECT", cycles: 0 },
  0xd6: {
    name: "ldab",
    len: 2,
    type: "DIRECT",
    cycles: 3,
    microcode: function(view) {
      let addr = view[cpu.PC - 0x8000 + 1];

      let ramContents = readRAM(addr);

      setB(ramContents);

      // Do flag stuff
      if (0 === cpu.B) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }

      if ((cpu.B & 0xf0) == 0xf0) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      clearStatusFlag("V");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xd7: {
    name: "stab",
    len: 2,
    type: "DIRECT",
    cycles: 3,
    microcode: function(view) {
      let addr = view[cpu.PC - 0x8000 + 1];

      writeRAM(addr, cpu.B);

      // Do flag stuff
      if (0 == cpu.B) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }

      if ((cpu.B & 0xf0) == 0xf0) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      clearStatusFlag("V");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xd8: { name: "eorb", len: 2, type: "DIRECT", cycles: 0 },
  0xd9: { name: "adcb", len: 2, type: "DIRECT", cycles: 0 },
  0xda: { name: "orab", len: 2, type: "DIRECT", cycles: 0 },
  0xdb: { name: "addb", len: 2, type: "DIRECT", cycles: 0 },
  0xdc: {
    name: "ldd",
    len: 2,
    type: "DIRECT",
    cycles: 4,
    microcode: function(view) {
      let b1 = view[cpu.PC - 0x8000 + 1];
      let mem = readRAM(b1);
      let mem2 = readRAM(b1 + 1);

      setD(((mem >> 8) + mem2) & 0xff);

      // Do flag stuff
      if (0 == cpu.D) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }

      if ((cpu.D & 0xf000) == 0xf000) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      clearStatusFlag("V");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xdd: {
    name: "std",
    len: 2,
    type: "DIRECT",
    cycles: 4,
    microcode: function(view) {
      let addr = view[cpu.PC - 0x8000 + 1];

      writeRAM(addr, cpu.D >> 8);
      writeRAM(addr + 1, cpu.D & 0xff);

      // Do flag stuff
      if (0 == cpu.D) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }

      if ((cpu.D & 0xf0) == 0xf0) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      clearStatusFlag("V");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xde: {
    name: "ldx",
    len: 2,
    type: "DIRECT",
    cycles: 4,
    microcode: function(view) {
      let b1 = view[cpu.PC - 0x8000 + 1];
      let mem = readRAM(b1);
      let mem2 = readRAM(b1 + 1);

      setX(((mem >> 8) + mem2) & 0xff);

      // Do flag stuff
      if (0 == cpu.X) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }

      if ((cpu.X & 0xf000) == 0xf000) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      clearStatusFlag("V");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xdf: {
    name: "stx",
    len: 2,
    type: "DIRECT",
    cycles: 4,
    microcode: function(view) {
      let addr = view[cpu.PC - 0x8000 + 1];

      writeRAM(addr, cpu.X >> 8);
      writeRAM(addr + 1, cpu.X & 0xff);

      // Do flag stuff
      if (0 == cpu.X) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }

      if ((cpu.X & 0xf000) == 0xf000) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      clearStatusFlag("V");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xe0: { name: "subb", len: 2, type: "INDEXED", cycles: 0 },
  0xe1: { name: "cmpb", len: 2, type: "INDEXED", cycles: 0 },
  0xe2: { name: "sbcb", len: 2, type: "INDEXED", cycles: 0 },
  0xe3: { name: "addd", len: 2, type: "INDEXED", cycles: 0 },
  0xe4: { name: "andb", len: 2, type: "INDEXED", cycles: 0 },
  0xe5: { name: "bitb", len: 2, type: "INDEXED", cycles: 0 },
  0xe6: { name: "ldab", len: 2, type: "INDEXED", cycles: 0 },
  0xe7: {
    name: "stab",
    len: 2,
    type: "INDEXED",
    cycles: 4,
    microcode: function(view) {
      //Check index type
      let indexType = 0x80 == view[cpu.PC - 0x8000 + 1] ? "Y" : "X";

      if ("Y" == indexType) {
        // Try to run subopcode
        subOps[0xe7][0x80].microcode(view);
      }
    }
  },
  0xe8: { name: "eorb", len: 2, type: "INDEXED", cycles: 0 },
  0xe9: { name: "adcb", len: 2, type: "INDEXED", cycles: 0 },
  0xea: { name: "orab", len: 2, type: "INDEXED", cycles: 0 },
  0xeb: { name: "addb", len: 2, type: "INDEXED", cycles: 0 },
  0xec: {
    name: "ldd",
    len: 2,
    type: "INDEXED",
    cycles: 5,
    microcode: function(view) {
      let b1 = view[cpu.PC - 0x8000 + 1];
      let m1 = readRAM(b1);
      let m2 = readRAM(b1 + 1);
      let word = (m1 << 8) + m2;

      setD(word);

      // Do flag stuff
      if (0 == word) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }

      if ((word & 0xf000) == 0xf000) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      clearStatusFlag("V");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xed: {
    name: "std",
    len: 2,
    type: "INDEXED",
    cycles: 5,
    microcode: function(view) {
      let addr = view[cpu.PC - 0x8000 + 1] + cpu.Y;

      writeRAM(addr, cpu.D >> 8);
      writeRAM(addr + 1, cpu.D & 0xff);

      // Do flag stuff
      if (0 == cpu.D) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }

      if ((cpu.D & 0xf0) == 0xf0) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      clearStatusFlag("V");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xee: { name: "ldx", len: 2, type: "INDEXED", cycles: 0 },
  0xef: { name: "stx", len: 2, type: "INDEXED", cycles: 0 },
  0xf0: { name: "subb", len: 3, type: "EXTENDED", cycles: 0 },
  0xf1: { name: "cmpb", len: 3, type: "EXTENDED", cycles: 0 },
  0xf2: { name: "sbcb", len: 3, type: "EXTENDED", cycles: 0 },
  0xf3: { name: "addd", len: 3, type: "EXTENDED", cycles: 0 },
  0xf4: { name: "andb", len: 3, type: "EXTENDED", cycles: 0 },
  0xf5: { name: "bitb", len: 3, type: "EXTENDED", cycles: 0 },
  0xf6: {
    name: "ldab",
    len: 3,
    type: "EXTENDED",
    cycles: 4,
    microcode: function(view) {
      let firstByte = view[cpu.PC - 0x8000 + 1];
      let secondByte = view[cpu.PC - 0x8000 + 2];
      let word = (firstByte << 8) + secondByte;

      let mem = readRAM(word);

      setB(mem);

      // Do flag stuff
      if (0 == word) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }

      if ((word & 0xf000) == 0xf000) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      clearStatusFlag("V");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xf7: {
    name: "stab",
    len: 3,
    type: "EXTENDED",
    cycles: 4,
    microcode: function(view) {
      let firstByte = view[cpu.PC - 0x8000 + 1];
      let secondByte = view[cpu.PC - 0x8000 + 2];
      let addr = (firstByte << 8) + secondByte;

      writeRAM(addr, cpu.B);

      // Do flag stuff
      if (0 == cpu.B) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }

      if ((cpu.B & 0xf0) == 0xf0) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      clearStatusFlag("V");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xf8: { name: "eorb", len: 3, type: "EXTENDED", cycles: 0 },
  0xf9: { name: "adcb", len: 3, type: "EXTENDED", cycles: 0 },
  0xfa: { name: "orab", len: 3, type: "EXTENDED", cycles: 0 },
  0xfb: { name: "addb", len: 3, type: "EXTENDED", cycles: 0 },
  0xfc: {
    name: "ldd",
    len: 3,
    type: "EXTENDED",
    cycles: 5,
    microcode: function(view) {
      let firstByte = view[cpu.PC - 0x8000 + 1];
      let secondByte = view[cpu.PC - 0x8000 + 2];
      let addr = (firstByte << 8) + secondByte;

      let mem = readRAM(addr);
      let mem2 = readRAM(addr + 1);

      let word = (mem << 8) + mem2;

      setD(word);

      // Do flag stuff
      if (0 == word) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }

      if ((word & 0xf000) == 0xf000) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      clearStatusFlag("V");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xfd: {
    name: "std",
    len: 3,
    type: "EXTENDED",
    cycles: 5,
    microcode: function(view) {
      let firstByte = view[cpu.PC - 0x8000 + 1];
      let secondByte = view[cpu.PC - 0x8000 + 2];
      let addr = (firstByte << 8) + secondByte;

      writeRAM(addr, cpu.D);

      // Do flag stuff
      if (0 == cpu.D) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }

      if ((cpu.D & 0xf000) == 0xf000) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      clearStatusFlag("V");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xfe: { name: "ldx", len: 3, type: "EXTENDED", cycles: 0 },
  0xff: { name: "stx", len: 3, type: "EXTENDED", cycles: 0 }
};

let subOps = {
  0xcd: {
    0x08: { name: "iny", len: 2, type: "IMPLIED", cycles: 1 },
    0x09: { name: "dey", len: 2, type: "IMPLIED", cycles: 1 },
    0x1a: { name: "xgdy", len: 2, type: "IMPLIED", cycles: 1 },
    0x3a: { name: "aby", len: 2, type: "IMPLIED", cycles: 1 },
    0x8c: {
      name: "cmpy",
      len: 4,
      type: "IMMEDIATE16",
      cycles: 1,
      microcode: function(view) {
        let firstByte = view[cpu.PC - 0x8000 + 2];
        let secondByte = view[cpu.PC - 0x8000 + 3];
        let word = (firstByte << 8) + secondByte;

        let result = cpu.Y - word;

        // Do flag stuff
        if (0 == result) {
          setStatusFlag("Z");
        } else {
          clearStatusFlag("Z");
        }

        if ((result & 0xf000) == 0xf000) {
          setStatusFlag("N");
        } else {
          clearStatusFlag("N");
        }

        if (0 != (result & 0xf0000)) {
          setStatusFlag("V");
        } else {
          clearStatusFlag("V");
        }

        if (result > cpu.Y) {
          setStatusFlag("C");
        } else {
          clearStatusFlag("C");
        }

        //Next
        setPC(cpu.PC + this.len);

        //Clock
        advanceClock(this.cycles);
      }
    },
    0xa3: { name: "cpd", len: 2, type: "INDEXEDY", cycles: 1 },
    0xac: { name: "cpx", len: 2, type: "INDEXEDY", cycles: 1 },
    0xce: {
      name: "ldy",
      len: 4,
      type: "IMMEDIATE16",
      cycles: 4,
      microcode: function(view) {
        let firstByte = view[cpu.PC - 0x8000 + 2];
        let secondByte = view[cpu.PC - 0x8000 + 3];
        let word = (firstByte << 8) + secondByte;

        setY(word);

        // Do flag stuff
        if (0 == word) {
          setStatusFlag("Z");
        } else {
          clearStatusFlag("Z");
        }

        if ((word & 0xf000) == 0xf000) {
          setStatusFlag("N");
        } else {
          clearStatusFlag("N");
        }

        clearStatusFlag("V");

        //Next
        setPC(cpu.PC + this.len);

        //Clock
        advanceClock(this.cycles);
      }
    },
    0xdf: { name: "sty", len: 3, type: "DIRECT", cycles: 1 },
    0xde: { name: "ldy", len: 3, type: "DIRECT", cycles: 1 },
    0xee: { name: "ldy", len: 3, type: "INDEXED", cycles: 1 },
    0xef: { name: "stx", len: 2, type: "INDEXEDY", cycles: 1 },
    0xfe: { name: "nop", len: 2, type: "INDEXEDY", cycles: 1 }
  },
  0xa0: {
    0x80: { name: "suba", len: 2, type: "INDEXEDY", cycles: 1 }
  },
  0xa1: {
    0x80: { name: "cmpa", len: 2, type: "INDEXEDY", cycles: 1 }
  },
  0xa2: {
    0x80: { name: "sbca", len: 2, type: "INDEXEDY", cycles: 1 }
  },
  0xa3: {
    0x80: { name: "subd", len: 2, type: "INDEXEDY", cycles: 1 }
  },
  0xa4: {
    0x80: { name: "anda", len: 2, type: "INDEXEDY", cycles: 1 }
  },
  0xa5: {
    0x80: { name: "bita", len: 2, type: "INDEXEDY", cycles: 1 }
  },
  0xa6: {
    0x80: { name: "ldaa", len: 2, type: "INDEXEDY", cycles: 1 }
  },
  0xa7: {
    0x80: { name: "staa", len: 2, type: "INDEXEDY", cycles: 1 }
  },
  0xa8: {
    0x80: { name: "eora", len: 2, type: "INDEXEDY", cycles: 1 }
  },
  0xa9: {
    0x80: { name: "adca", len: 2, type: "INDEXEDY", cycles: 1 }
  },
  0xaa: {
    0x80: { name: "oraa", len: 2, type: "INDEXEDY", cycles: 1 }
  },
  0xab: {
    0x80: { name: "adda", len: 2, type: "INDEXEDY", cycles: 1 }
  },
  0xac: {
    0x80: { name: "cpx", len: 2, type: "INDEXEDY", cycles: 1 }
  },
  0xad: {
    0x80: { name: "jsr", len: 2, type: "INDEXEDY", cycles: 1 }
  },
  0xae: {
    0x80: { name: "lds", len: 2, type: "INDEXEDY", cycles: 1 }
  },
  0xaf: {
    0x80: { name: "sts", len: 2, type: "INDEXEDY", cycles: 1 }
  },
  0xe0: {
    0x80: { name: "subb", len: 2, type: "INDEXEDY", cycles: 1 }
  },
  0xe1: {
    0x80: { name: "cmpb", len: 2, type: "INDEXEDY", cycles: 1 }
  },
  0xe2: {
    0x80: { name: "sbcb", len: 2, type: "INDEXEDY", cycles: 1 }
  },
  0xe3: {
    0x80: { name: "addd", len: 2, type: "INDEXEDY", cycles: 1 }
  },
  0xe4: {
    0x80: { name: "andb", len: 2, type: "INDEXEDY", cycles: 1 }
  },
  0xe5: {
    0x80: { name: "bitb", len: 2, type: "INDEXEDY", cycles: 1 }
  },
  0xe6: {
    0x80: { name: "ldab", len: 2, type: "INDEXEDY", cycles: 1 }
  },
  0xe7: {
    0x80: {
      name: "stab",
      len: 2,
      type: "INDEXEDY",
      cycles: 4,
      microcode: function(view) {
        let addr = cpu.Y;

        writeRAM(addr, cpu.B);

        // Do flag stuff
        if (0 == cpu.B) {
          setStatusFlag("Z");
        } else {
          clearStatusFlag("Z");
        }

        if ((cpu.B & 0xf0) == 0xf0) {
          setStatusFlag("N");
        } else {
          clearStatusFlag("N");
        }

        clearStatusFlag("V");

        //Next
        setPC(cpu.PC + this.len);

        //Clock
        advanceClock(this.cycles);
      }
    }
  },
  0xe8: {
    0x80: { name: "eorb", len: 2, type: "INDEXEDY", cycles: 1 }
  },
  0xe9: {
    0x80: { name: "adcb", len: 2, type: "INDEXEDY", cycles: 1 }
  },
  0xea: {
    0x80: { name: "orab", len: 2, type: "INDEXEDY", cycles: 1 }
  },
  0xeb: {
    0x80: { name: "addb", len: 2, type: "INDEXEDY", cycles: 1 }
  },
  0xec: {
    0x80: { name: "ldd", len: 2, type: "INDEXEDY", cycles: 1 }
  },
  0xed: {
    0x80: { name: "std", len: 2, type: "INDEXEDY", cycles: 1 }
  },
  0xee: {
    0x80: { name: "ldx", len: 2, type: "INDEXEDY", cycles: 1 }
  },
  0xef: {
    0x80: { name: "stx", len: 2, type: "INDEXEDY", cycles: 1 }
  }
};
