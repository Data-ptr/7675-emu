let logEnabled = $('#updateLogOutput-input').is(":checked");
const RAMSize = 0x01C0;
const logElement = $("#log-output-div > ul");

let subroutineLevel = 0;

let updateDataRegisters = 0;

let adcObj = undefined;

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
  clock: { auto: false, cycleCount: 0 },
  eClock: 0,
  timer_1_2: 0,
  timer_3: 0,
  clockSpeed: 2, //mhz,
  mode: 0
};

const vectors = {
  reset: 0xFFFE,
  nmi: 0xFFFC,
  swi: 0xFFFA,
  irq: 0xFFF8,
  input_capture_1: 0xFFF6,
  input_capture_2: 0xFFF4,
  output_compare_1: 0xFFF0,
  output_compare_2: 0xFFEE,
  output_compare_3: 0xFFEC,
  timer_1_overflow: 0xFFEA,
  rti: 0xFFE4,
  sci_rx: 0xFFE0
}

// Initialize memory
cpu.memory.data = new ArrayBuffer(RAMSize);
cpu.memory.view = new Uint8ClampedArray(cpu.memory.data);

// Initialize ROM
cpu.ROM.data = new ArrayBuffer(0x8000);
cpu.ROM.view = new Uint8ClampedArray(cpu.ROM.data);


function setPC(addr) {
  checkBytes(addr, 4);

  cpu.PC = addr;

  if(updateUI) {
    updatePCOutput();
  }

  if(logEnabled) {
    logElement.append(
      "<li>Set PC: " + ("000" + Number(cpu.PC).toString(16)).slice(-4).toUpperCase() + "</li>"
    );
  }
}

function setSP(addr) {
  checkBytes(addr, 4);

  cpu.SP = addr;

  if(updateUI) {
    elementCache.spRegisterOutput.val(
      ("000" + Number(cpu.SP).toString(16)).slice(-4).toUpperCase()
    );
  }

  if(logEnabled) {
    logElement.append(
      "<li>Set SP: " + ("000" + Number(cpu.SP).toString(16)).slice(-4).toUpperCase() + "</li>"
    );
  }
}

function setA(bytes) {
  checkBytes(bytes, 2);

  cpu.A = bytes;
  cpu.D = (bytes << 8) + cpu.B;

  if(updateUI) {
    elementCache.aRegisterOutput.val(
      ("0" + Number(cpu.A).toString(16)).slice(-2).toUpperCase()
    );

    elementCache.dRegisterOutput.val(
      ("000" + Number(cpu.D).toString(16)).slice(-4).toUpperCase()
    );
  }

  if(logEnabled) {
    logElement.append(
      "<li>Set A: " + ("0" + Number(bytes).toString(16)).slice(-2).toUpperCase() + "</li>"
    );
  }
}

function setB(bytes) {
  checkBytes(bytes, 2);

  cpu.B = bytes;
  cpu.D = (cpu.A << 8) + bytes;

  if(updateUI) {
    elementCache.bRegisterOutput.val(
      ("0" + Number(cpu.B).toString(16)).slice(-2).toUpperCase()
    );

    elementCache.dRegisterOutput.val(
      ("000" + Number(cpu.D).toString(16)).slice(-4).toUpperCase()
    );
  }

  if(logEnabled) {
    logElement.append(
      "<li>Set B: " + ("0" + Number(bytes).toString(16)).slice(-2).toUpperCase() + "</li>"
    );
  }
}

function setD(bytes) {
  checkBytes(bytes, 4);

  cpu.D = bytes;
  cpu.A = bytes >> 8;
  cpu.B = bytes & 0xFF;

  if(updateUI) {
    elementCache.dRegisterOutput.val(
      ("000" + Number(cpu.D).toString(16)).slice(-4).toUpperCase()
    );

    elementCache.aRegisterOutput.val(
      ("0" + Number(cpu.A).toString(16)).slice(-2).toUpperCase()
    );

    elementCache.bRegisterOutput.val(
      ("0" + Number(cpu.B).toString(16)).slice(-2).toUpperCase()
    );
  }

  if(logEnabled) {
    logElement.append(
      "<li>Set D: " + ("000" + Number(bytes).toString(16)).slice(-4).toUpperCase() + "</li>"
    );
  }
}

function setX(bytes) {
  checkBytes(bytes, 4);

  cpu.X = bytes;

  if(updateUI) {
    elementCache.xRegisterOutput.val(
      ("000" + Number(cpu.X).toString(16)).slice(-4).toUpperCase()
    );
  }

  if(logEnabled) {
    logElement.append(
      "<li>Set X: " + ("000" + Number(bytes).toString(16)).slice(-4).toUpperCase() + "</li>"
    );
  }
}

function incY(bytes) {
  let incr = cpu.Y + bytes;

  if(0xFFFF < incr) {
    incr -= 0xFFFF;
  }

  setY(incr);
}

function setY(bytes) {
  checkBytes(bytes, 4);

  cpu.Y = bytes;

  if(updateUI) {
    elementCache.yRegisterOutput.val(
      ("000" + Number(cpu.Y).toString(16)).slice(-4).toUpperCase()
    );
  }

  if(logEnabled) {
    logElement.append(
      "<li>Set Y: " + ("000" + Number(bytes).toString(16)).slice(-4).toUpperCase() + "</li>"
    );
  }
}

function setStatusFlag(flag) {
  switch (flag) {
    case "H":
      cpu.status.H = 1;
      if(updateUI) {
        elementCache.hRegisterOutput.val(cpu.status.H);
      }
      break;
    case "I":
      cpu.status.I = 1;
      if(updateUI) {
        elementCache.iRegisterOutput.val(cpu.status.I);
      }
      break;
    case "N":
      cpu.status.N = 1;
      if(updateUI) {
        elementCache.nRegisterOutput.val(cpu.status.N);
      }
      break;
    case "Z":
      cpu.status.Z = 1;
      if(updateUI) {
        elementCache.zRegisterOutput.val(cpu.status.Z);
      }
      break;
    case "V":
      cpu.status.V = 1;
      if(updateUI) {
        elementCache.vRegisterOutput.val(cpu.status.V);
      }
      break;
    case "C":
      cpu.status.C = 1;
      if(updateUI) {
        elementCache.cRegisterOutput.val(cpu.status.C);
      }
      break;
  }

  if(logEnabled) {
    logElement.append(
      "<li>Set " + flag + " flag</li>"
    );
  }
}

function clearStatusFlag(flag) {
  switch (flag) {
    case "H":
      cpu.status.H = 0;
      if(updateUI) {
        elementCache.hRegisterOutput.val(cpu.status.H);
      }
      break;
    case "I":
      cpu.status.I = 0;
      if(updateUI) {
        elementCache.iRegisterOutput.val(cpu.status.I);
      }
      break;
    case "N":
      cpu.status.N = 0;
      if(updateUI) {
        elementCache.nRegisterOutput.val(cpu.status.N);
      }
      break;
    case "Z":
      cpu.status.Z = 0;
      if(updateUI) {
        elementCache.zRegisterOutput.val(cpu.status.Z);
      }
      break;
    case "V":
      cpu.status.V = 0;
      if(updateUI) {
        elementCache.vRegisterOutput.val(cpu.status.V);
      }
      break;
    case "C":
      cpu.status.C = 0;
      if(updateUI) {
        elementCache.cRegisterOutput.val(cpu.status.C);
      }
      break;
  }

  if(logEnabled) {
    logElement.append(
      "<li>Clear " + flag + " flag</li>"
    );
  }
}

function writeRAM(addr, byte, clockWrite, adcIgnore) {
  cpu.memory.view[addr] = byte;

  if(updateRAM) {
    if (clockWrite) {
      //lastClockWrite.push(addr);
    } else {
      lastRAMWrite.push(addr);

      if(logEnabled) {
        logElement.append(
          "<li>Write RAM: " + ("0" + Number(byte).toString(16)).slice(-2).toUpperCase() + " @ " + ("000" + Number(addr).toString(16)).slice(-4).toUpperCase() +"</li>"
        );
      }
    }

    redrawRAM = 1;
  }

  // Memory write break (debug)
  if(breakOnWrite && window.parseInt(writeBreakpoint, 16) == addr) {
    breakExec();
  }

  tempWriteDebug(addr, byte);

  // Update to port 2 (mode)
  if(addr == 0x3) {
    workMode(addr);
  }

  // Update to port 6 (CEL)
  if(addr == 0x2F) {
    workCel(byte);
  }

  // ADC scan
  if(!adcIgnore && addr == 0x1F) { // ADC ctrl write
    workAdc(byte);
  }

  //Refresh if register
  if (updateDataRegisters && 0x40 > addr) {
    updateRegisters(addr);
  }
}

function tempWriteDebug(addr, byte) {
  //0x004C str faultHi catch
  if(addr == 0x004C && 0 != byte) {
    console.log("Caught str faultHi: " + cleanHexify(byte));
  }

  //0x004D str faultLo catch
  if(addr == 0x004D && 0 != byte) {
    console.log("Caught str faultLo: " + cleanHexify(byte));
  }

  //0x004E faultHi catch
  if(addr == 0x004E && 0 != byte) {
    console.log("Caught faultHi: " + cleanHexify(byte));
  }

  //0x004F faultLo catch
  if(addr == 0x004F && 0 != byte) {
    console.log("Caught faultLo: " + cleanHexify(byte));
  }

  //0x00FA obdFlag catch
  // if(addr == 0x00FA && 0 != byte) {
  //   console.log("Caught OBD flag: " + cleanHexify(byte));
  // }

  //0x00FB obdactcmd catch
  if(addr == 0x00FB && 0 != byte) {
    console.log("Caught OBD act cmd: " + cleanHexify(byte));
  }

  //0x0179 sensrchkidx catch
  // if(addr == 0x0179 && 0 != byte) {
  //   console.log("Caught sensor chk IDX: " + cleanHexify(byte));
  // }

  //0x017A obdCode catch
  if(addr == 0x017A && 0 != byte) {
    console.log("Caught OBD code: " + cleanHexify(byte));
  }

  //0x017B erridx catch
  if(addr == 0x017B && 0 != byte) {
    console.log("Caught err IDX: " + cleanHexify(byte));
  }

  //0x017C errcodeproc catch
  if(addr == 0x017C && 0 != byte) {
    console.log("Caught err code proc code: " + cleanHexify(byte));
  }
}

//TODO: Speed up with caching
function workMode(addr) {
  let modeBits = 0;

  if($('#p2p0-mode-input').is(":checked")) {
    modeBits += 0b00100000;
  }
  if($('#p2p1-mode-input').is(":checked")) {
    modeBits += 0b01000000;
  }
  if($('#p2p2-mode-input').is(":checked")) {
    modeBits += 0b10000000;
  }

  // Copy mode bits into port2
  cpu.memory.view[addr] |= modeBits;
}

function workCel(port2Byte) {
  const sTime = (1 / (cpu.clockSpeed * MHZ)) * cpu.clock.cycleCount;

  if(port2Byte & 0b00001000) { // CEL is on
    elementCache.dsmCelOutput.addClass("btn-danger").removeClass("btn-secondary");
    dps.push({y: 1, x: sTime});
  } else { // CEL is off
    elementCache.dsmCelOutput.addClass("btn-secondary").removeClass("btn-danger");
    dps.push({y: 0, x: sTime});
  }
}

function workAdc(adcCtrl) {
  if(adcCtrl & 0b00001000) { // START bit set
    const adcChan = adcCtrl & 0b00000111; // ADC channel
    let adcVal = 0;

    switch(adcChan) {
      case 0:
        // ECT
        adcVal = elementCache.dsmEctInput.val();
      break;
      case 1:
        // IAT
        adcVal = elementCache.dsmIatInput.val();
      break;
      case 2:
        // BARO
        // (.00486x)bar  [x = b / .00486]
        adcVal = Math.ceil(parseInt(elementCache.dsmBaroInput.val()) / 0.00486);
      break;
      case 3:
        // O2
        // (.0195x)v   [x = v / .0195]
        adcVal = Math.ceil(parseFloat(elementCache.dsmO2Input.val()) / 0.0195);
      break;
      case 4:
        // EGRT
        // (-2.7x + 597.7)deg F this is unofficial []
        adcVal = Math.ceil(0.037 * ( 5977 - 10 * elementCache.dsmEgrtInput.val()));
      break;
      case 5:
        // BATT
        // (.0733x)v   [x = v / .0733]
        adcVal = Math.ceil(elementCache.dsmBattInput.val() / 0.0733);
      break;
      case 6:
        // KNOCK count
        adcVal = parseInt(elementCache.dsmKnockCntInput.val());
      break;
      case 7:
        // TPS
        // (100x/255)% [x = 51y/20]
        adcVal = Math.ceil((51 * elementCache.dsmTpsInput.val()) / 20);
      break;
    };

    adcObj = {
      countdown: 3,
      val: adcVal,
      chan: adcChan
    }
  }
}

function doAdc() {
  writeRAM(0x20, adcObj.val);

  // Set done flag
  writeRAM(0x1F, 0b00100000 + adcObj.chan, 1, 1); //0b00101000

  updateRegisters(0x1F);
  updateRegisters(0x20);
}

function readRAM(addr, clockRead) {
  let result = cpu.memory.view[addr];

  if(updateRAM) {
    if (clockRead) {
      //lastClockRead.push(addr);
    } else {
      lastRAMRead.push(addr);

      if(logEnabled) {
        logElement.append(
          "<li>Read RAM: " + ("0" + Number(result).toString(16)).slice(-2).toUpperCase() + " @ " + ("000" + Number(addr).toString(16)).slice(-4).toUpperCase() + "</li>"
        );
      }
    }

    redrawRAM = 1;
  }

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

  cpu.clock.cycleCount = 0;
  cpu.eClock = 0;

  /*
      the MPU I-bit is set which masks (disables) both IRQI and IRQ2 interrupts;
    • the NMI interrupt latch is cleared which effectively disregards NMI interrupts occurring while the MPU is held in Reset;
    • the E (Enable) clock is active;
    • all Data Direction Registers are cleared;
    • the SCI Rate and Mode Control Register is cleared;
    • the SCI Transmit/Receive Control and Status Register is preset to $20;
    • the Receive Data Register is cleared;
    • the Timer Control and Status Register is cleared;
    • the free-running Counter is cleared;
    • the buffer for the LSB of the Counter and output level register are cleared;
    X the Output Compare Register is preset to $FFFF;
    • the Port 3 Control and Status Register is cleared;
    • Ports I, 2 and 3 are forced to the high impedance state;
    • Port 4 is also held in a high impedance state but internal pull-up resistors are provided to pull the lines high;
    • SCI is held high in a high impedance state with an internal pull-up resistor if the inputs to P20, P21, and P22 indicate the Single Chip modes; otherwise it is actively held high;
    • SC2 is actively held high.
  */
}

function uiReset() {
  let elementString = "";

  for (let i = 0; i < RAMSize; i++) {
    elementString += "<span class='ram-byte' title='0x" + cleanHexify(i, 4) + "'>00</span>";
  }

  $("#RAM-output-div")
    .empty()
    .append(elementString);

  $("#clock-cycles-output").val(cpu.clock.cycleCount);
  $("#real-time-output").val(0);
  $("#sim-time-output").val(0);

  logElement.empty();

  drawRAMOutput(cpu.memory.view, RAMSize, 1);
}

function stackD(unstack) {
  if(!unstack) {
    let b1 = cpu.D >> 8;
    let b2 = cpu.D & 0xff;

    //console.log("Prev D: 0x" + cpu.D.toString(16));

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

    //console.log("Prev X: 0x" + cpu.X.toString(16));

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

    //console.log("Prev Y: 0x" + cpu.Y.toString(16));

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

    //console.log("Prev PC: 0x" + cpu.PC.toString(16));

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

    //console.log("Prev D: 0b" + b1.toString(2));

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
