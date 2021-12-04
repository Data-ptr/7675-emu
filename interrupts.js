const INT_TYPE = {
  NMI:  0,
  IRQ1: 1,
  PULS: 2,
  IC:   3,  // Input Capture
  OC:   4,  // Oputput Compare,
  OF:   5,  // Overflow
  SCI:  6,
  SWI:  7
}

function workInterrupts() {
  if(interruptStack.length > 0 && !cpu.status.I) {
    interrupt(interruptStack.pop());
  }
}

function interrupt(vector) {
  const firstByte = cpu.ROM.view[vector - 0x8000];
  const secondByte = cpu.ROM.view[vector + 1 - 0x8000];
  const addr = (firstByte << 8) + secondByte;

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
