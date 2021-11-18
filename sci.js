let rxBuffer = 0xFD;
let txBuffer = 0;

function sciClockCheck(cycles) {


  for (let i = 0; i < cycles; i++) {
    const eClock = (cpu.timer_1_2 + i) / 4;
    if(0 == (eClock + i) % getSciClockSpeed()) {
      sciClock();
    }
  }
}

function sciClock(){
  const cntrl = readRAM(0x11, 1);
  const txReg = readRAM(0x13, 1);
  let cnt = cntrl;

  // RX
  if(0 == rxBuffer) {
    //Set rx register (not) full
    cnt &= 0b01111111;
    writeRAM(0x12, 0, 1);
  } else {
    writeRAM(0x12, rxBuffer, 1);
    rxBuffer = 0;

    //Set rx register full
    cnt |= 0b10000000;
  }

  // TX
  if(0 == txReg) {
    //Set tx register empty
    cnt |= 0b00100000;
  } else {
    txBuffer = txReg;
    writeRAM(0x13, 0, 1)

    console.log("TX set: " + cleanHexify(txBuffer));

    //Set tx register (not) empty
    cnt &= 0b11011111;
  }

  writeRAM(0x11, cnt, 1);

  sciCheck();
}

function sciCheck(){
  let ret = 0;
  const cntrl = readRAM(0x11, 1);
  let   cnt   = cntrl;

  const rdrf = cnt & 0b10000000; // byte 7
  const orfe = cnt & 0b01000000; // byte 6
  const tdre = cnt & 0b00100000; // byte 5
  const rie  = cnt & 0b00010000; // byte 4
  const tie  = cnt & 0b00000100; // byte 2

  const orGate = rdrf || orfe;
  const andA = orGate && rie;
  const andB = tdre && tie;

  if(andA || andB) {
    ret = 1;
    interruptStack.push(vectors.output_compare_1);
  }

  return ret;
}

function getSciClockSpeed() {
  let ret = 0;
  const sciBaud = readRAM(0x10, 1);
  const baud0 = sciBaud & 0b00000001;
  const baud1 = sciBaud & 0b00000010;
  const baud2 = sciBaud & 0b00010000;
  const baud = baud0 + baud1 + (baud2 >> 2);

  // Clock divider 000=E/16, 001=E/128, 010=E/1024, 011=E/4096
  switch(baud) {
    case 0:
      ret = 16;
    break;
    case 1:
      ret = 128;
    break;
    case 2:
      ret = 1024;
    break;
    case 3:
      ret = 4096;
    break;
  }

  return ret;
}
