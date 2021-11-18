let ic_p50_last = 1;

// ICF (input Capture Flag) Bit 7 of the Timer Control and Status Register
// which is used to indicate that a proper transition has occurred on the P20
// pin. The Counter Register is also transferred to the Input Capture Register
// when this occurs. Which transition is proper is defined by the IEDO bit.

// IEDG (Input Edge) Bit 1 of the Timer Control and Status Register.
// IEDO is used to define which edge of a signal present at P20
//  initiates the input capture function.

function ic_getConf() {
  const t1Csr = readRAM(0x08, 1);
  const t2Csr = readRAM(0x18, 1);

  return {
    t1: {
      enabled: (t1Csr & 0b00010000) >> 4,  // 1 = enabled
      edge:    (t1Csr & 0b00000010) >> 1   // 0 = neg; 1 = pos
    },
    t2: {
      enabled: (t2Csr & 0b00010000) >> 4,  // 1 = enabled
      edge:    (t2Csr & 0b00000010) >> 1   // 0 = neg; 1 = pos
    }
  }
}

function ic_check() {
  let t1Edge = 0; // 0 = neg edge; 1 = pos edge
  let t1Transition = 0;
  const ic_p50_now = readRAM(0x16, 1) & 1;

  if(ic_p50_last != ic_p50_now) { // There is an edge!
    t1Transition = 1;
    ic_p50_last = ic_p50_now;
    if(ic_p50_now) { // It was a positive edge!
      t1Edge = 1;
    }
  }

  if(t1Transition) {
    const csr = ic_getConf();

    if(csr.t1.enabled && t1Edge == csr.t1.edge) {
      console.log("Input compare 1 triggered!");

      // Copy timer into ic data register
      writeRAM(0x0D, readRAM(0x09, 1), 1);
      writeRAM(0x0E, readRAM(0x0A, 1), 1);

      //Hit IC flag in data register
      writeRAM(0x08, (readRAM(0x08, 1) & 0b01111111) + 0b10000000, 1);

      interruptStack.push(vectors.input_capture_1);
    }
  }
}
