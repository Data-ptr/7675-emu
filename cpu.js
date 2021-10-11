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

function writeRAM(addr, byte, clockWrite) {
  cpu.memory.view[addr] = byte;

  if (clockWrite) {
    lastClockWrite = addr;
  } else {
    lastRAMWrite = addr;
  }

  redrawRAM = 1;

  //Refresh if register
  if (0x40 > addr) {
    updateRegisters(addr);
  }
}

function readRAM(addr, clockRead) {
  if (clockRead) {
    lastClockRead = addr;
  } else {
    lastRAMRead = addr;
  }

  redrawRAM = 1;

  return cpu.memory.view[addr];
}

function readROM(addr) {
  return cpu.ROM.view[addr - 0x8000];
}

function setPcToEntrypoint() {
  setPC(window.parseInt($("#entrypoint-text-input").val(), 16));
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
