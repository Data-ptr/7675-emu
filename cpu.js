const RAMSize = 0x7fff;

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

// Initialize memory
cpu.memory.data = new ArrayBuffer(RAMSize);
cpu.memory.view = new Uint8ClampedArray(cpu.memory.data);

//Initialize ROM
cpu.ROM.data = new ArrayBuffer(0x8000);
cpu.ROM.view = new Uint8ClampedArray(cpu.ROM.data);

function setPC(addr) {
  checkBytes(addr, 4);

  cpu.PC = addr;

  updatePCOutput();

  $("#log-output-div > ul").append(
    "<li>Set PC: " + ("000" + Number(cpu.PC).toString(16)).slice(-4).toUpperCase() + "</li>"
  );
}

function setSP(addr) {
  checkBytes(addr, 4);

  cpu.SP = addr;

  $("#register-SP-output").val(
    ("000" + Number(cpu.SP).toString(16)).slice(-4).toUpperCase()
  );

  $("#log-output-div > ul").append(
    "<li>Set SP: " + ("000" + Number(cpu.SP).toString(16)).slice(-4).toUpperCase() + "</li>"
  );
}

function setA(bytes) {
  checkBytes(bytes, 2);

  cpu.A = bytes;
  cpu.D = (bytes << 8) + cpu.B;

  $("#register-A-output").val(
    ("0" + Number(cpu.A).toString(16)).slice(-2).toUpperCase()
  );

  $("#register-D-output").val(
    ("000" + Number(cpu.D).toString(16)).slice(-4).toUpperCase()
  );

  $("#log-output-div > ul").append(
    "<li>Set A: " + ("0" + Number(bytes).toString(16)).slice(-2).toUpperCase() + "</li>"
  );
}

function setB(bytes) {
  checkBytes(bytes, 2);

  cpu.B = bytes;
  cpu.D = (cpu.A << 8) + bytes;

  $("#register-B-output").val(
    ("0" + Number(cpu.B).toString(16)).slice(-2).toUpperCase()
  );

  $("#register-D-output").val(
    ("000" + Number(cpu.D).toString(16)).slice(-4).toUpperCase()
  );

  $("#log-output-div > ul").append(
    "<li>Set B: " + ("0" + Number(bytes).toString(16)).slice(-2).toUpperCase() + "</li>"
  );
}

function setD(bytes) {
  checkBytes(bytes, 4);

  cpu.D = bytes;
  cpu.A = bytes >> 8;
  cpu.B = bytes & 0xff;

  $("#register-D-output").val(
    ("000" + Number(cpu.D).toString(16)).slice(-4).toUpperCase()
  );

  $("#register-A-output").val(
    ("0" + Number(cpu.A).toString(16)).slice(-2).toUpperCase()
  );

  $("#register-B-output").val(
    ("0" + Number(cpu.B).toString(16)).slice(-2).toUpperCase()
  );

  $("#log-output-div > ul").append(
    "<li>Set D: " + ("000" + Number(bytes).toString(16)).slice(-4).toUpperCase() + "</li>"
  );
}

function setX(bytes) {
  checkBytes(bytes, 4);

  cpu.X = bytes;

  $("#register-X-output").val(
    ("000" + Number(cpu.X).toString(16)).slice(-4).toUpperCase()
  );

  $("#log-output-div > ul").append(
    "<li>Set X: " + ("000" + Number(bytes).toString(16)).slice(-4).toUpperCase() + "</li>"
  );
}

function setY(bytes) {
  checkBytes(bytes, 4);

  cpu.Y = bytes;

  $("#register-Y-output").val(
    ("000" + Number(cpu.Y).toString(16)).slice(-4).toUpperCase()
  );

  $("#log-output-div > ul").append(
    "<li>Set Y: " + ("000" + Number(bytes).toString(16)).slice(-4).toUpperCase() + "</li>"
  );
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

  $("#log-output-div > ul").append(
    "<li>Set " + flag + " flag</li>"
  );
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

  $("#log-output-div > ul").append(
    "<li>Clear " + flag + " flag</li>"
  );
}

function writeRAM(addr, byte, clockWrite) {
  cpu.memory.view[addr] = byte;

  if (clockWrite) {
    lastClockWrite.push(addr);
  } else {
    lastRAMWrite.push(addr);

    $("#log-output-div > ul").append(
      "<li>Write RAM: " + ("0" + Number(byte).toString(16)).slice(-2).toUpperCase() + " @ " + ("000" + Number(addr).toString(16)).slice(-4).toUpperCase() +"</li>"
    );
  }

  redrawRAM = 1;

  //Refresh if register
  if (0x40 > addr) {
    updateRegisters(addr);
  }
}

function readRAM(addr, clockRead) {
  let result = cpu.memory.view[addr];

  if (clockRead) {
    lastClockRead.push(addr);
  } else {
    lastRAMRead.push(addr);

    $("#log-output-div > ul").append(
      "<li>Read RAM: " + ("0" + Number(result).toString(16)).slice(-2).toUpperCase() + " @ " + ("000" + Number(addr).toString(16)).slice(-4).toUpperCase() + "</li>"
    );
  }

  redrawRAM = 1;

  return result;
}

function readROM(addr) {
  return cpu.ROM.view[addr - 0x8000];
}

function setPcToEntrypoint() {
  setPC(window.parseInt($("#entrypoint-text-input").val(), 16));
}

function fullReset() {
  cpuReset();
  uiReset();
}

function cpuReset() {
  cpu.memory.view.fill(0);

  //Set Output compares to 0xFFFF
  //Timer 1 (0x0B:0x0C)
  writeRAM(0x000B, 0xFF);
  writeRAM(0x000C, 0xFF);
  //Timer 2 (0x1B:0x1C)
  writeRAM(0x001B, 0xFF);
  writeRAM(0x001C, 0xFF);
  //Timer 3 (0x2B:0x2C)
  writeRAM(0x002B, 0xFF);
  writeRAM(0x002C, 0xFF);

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

  lastRAMWrite.length = 0;
  lastRAMRead.length = 0;

  cpu.clock.tickCount = 0;
}

function uiReset() {
  let elementString = "";

  for (let i = 0; i < RAMSize; i++) {
    elementString += "<span title='" + i.toString(16) + "'>00</span>";
  }

  $("#RAM-output-div")
    .empty()
    .append(elementString);

  $("#clock-ticks-output").val(cpu.clock.tickCount);
  $("#real-time-output").val(0);
  $("#sim-time-output").val(0);

  $("#log-output-div > ul").empty();

  drawRAMOutput(cpu.memory.view, RAMSize, 1);
}

function stackD(unstack) {
  if(!unstack) {
    let b1 = cpu.D >> 8;
    let b2 = cpu.D & 0xff;

    console.log("Prev D: 0x" + cpu.D.toString(16));

    writeRAM(cpu.SP, b2);
    setSP(cpu.SP - 1);

    writeRAM(cpu.SP, b1);
    setSP(cpu.SP - 1);
  } else {
    setSP(cpu.SP + 1);
    let b1 = readRAM(cpu.SP);
    setSP(cpu.SP + 1);
    let b2 = readRAM(cpu.SP);

    setD((b1 << 8) + b2);
  }
}

function stackX(unstack) {
  if(!unstack) {
    let b1 = cpu.X >> 8;
    let b2 = cpu.X & 0xff;

    console.log("Prev X: 0x" + cpu.X.toString(16));

    writeRAM(cpu.SP, b2);
    setSP(cpu.SP - 1);

    writeRAM(cpu.SP, b1);
    setSP(cpu.SP - 1);
  } else {
    setSP(cpu.SP + 1);
    let b1 = readRAM(cpu.SP);
    setSP(cpu.SP + 1);
    let b2 = readRAM(cpu.SP);

    setX((b1 << 8) + b2);
  }
}

function stackY(unstack) {
  if(!unstack) {
    let b1 = cpu.Y >> 8;
    let b2 = cpu.Y & 0xff;

    console.log("Prev Y: 0x" + cpu.Y.toString(16));

    writeRAM(cpu.SP, b2);
    setSP(cpu.SP - 1);

    writeRAM(cpu.SP, b1);
    setSP(cpu.SP - 1);
  } else {
    setSP(cpu.SP + 1);
    let b1 = readRAM(cpu.SP);
    setSP(cpu.SP + 1);
    let b2 = readRAM(cpu.SP);

    setY((b1 << 8) + b2);
  }
}

function stackPC(unstack) {
  if(!unstack) {
    let b1 = cpu.PC >> 8;
    let b2 = cpu.PC & 0xff;

    console.log("Prev PC: 0x" + cpu.PC.toString(16));

    writeRAM(cpu.SP, b2);
    setSP(cpu.SP - 1);

    writeRAM(cpu.SP, b1);
    setSP(cpu.SP - 1);
  } else {
    setSP(cpu.SP + 1);
    let b1 = readRAM(cpu.SP);
    setSP(cpu.SP + 1);
    let b2 = readRAM(cpu.SP);

    setPC((b1 << 8) + b2);
  }
}

function stackFlags(unstack) {
  if(!unstack) {
    let b1 = 0xC0;

    b1 += cpu.status.H;
    b1 += cpu.status.I << 1;
    b1 += cpu.status.N << 2;
    b1 += cpu.status.Z << 3;
    b1 += cpu.status.V << 4;
    b1 += cpu.status.C << 5;

    console.log("Prev D: 0b" + b1.toString(2));

    writeRAM(cpu.SP, b1);
    setSP(cpu.SP - 1);
  } else {
    setSP(cpu.SP + 1);
    let b1 = readRAM(cpu.SP);

    if(b1 & 1) {
      setStatusFlag("H");
    } else {
      clearStatusFlag("H");
    }

    if(b1 & 2) {
      setStatusFlag("I");
    } else {
      clearStatusFlag("I");
    }

    if(b1 & 3) {
      setStatusFlag("N");
    } else {
      clearStatusFlag("N");
    }

    if(b1 & 4) {
      setStatusFlag("Z");
    } else {
      clearStatusFlag("Z");
    }

    if(b1 & 5) {
      setStatusFlag("V");
    } else {
      clearStatusFlag("V");
    }

    if(b1 & 6) {
      setStatusFlag("C");
    } else {
      clearStatusFlag("C");
    }
  }
}
