const LOC = {
  NONE: 0,
  IMM:  1,
  MEM:  2,
  A:    3,
  B:    4,
  D:    5,
  X:    6,
  Y:    7
}

const FLAG = {
  NONE: 0,
  ADD:  1,
  INC:  2,
  INX:  3,
  SUB:  4,
  DEC:  5,
  DEX:  6
}

const OPER = {
  LOAD:  0,
  STORE: 1,
  ADD:   2,
  SUB:   3,
  CMP:   4,
  SET:   5,
  CLEAR: 6
}

// ADDA, ADDB, ABA, INCA, INCB, INC
function add8(load, store, addr, val, flag) {
  return oper8(OPER.ADD, ...arguments);
}

// SUBA, SUBB, SBA, DECA, DECB, DEC
function sub8(load, store, addr, val, flag) {
  return oper8(OPER.SUB, ...arguments);
}

// ADDD, ABX, ABY, INX, INY
function add16 (oper, load, store, addr, val, flag) {
  return oper16(OPER.ADD, ...arguments);
}

// SUBD, DEX, DEY
function sub16 (oper, load, store, addr, val, flag) {
  return oper16(OPER.SUB, ...arguments);
}

// CMPA, CMPB, CBA
function cmp8(load, store, addr, val) {
  return oper8(OPER.CMP, ...arguments, FLAG.SUB);
}

// CPD, CPX, CPY
function cmp16(load, store, addr, val) {
  return oper16(OPER.CMP, ...arguments, FLAG.SUB);
}

function clearFlag(flag) {
  return operFlag(OPER.CLEAR, flag);
}

function setFlag(flag) {
  return operFlag(OPER.SET, flag);
}

function operFlag(oper, flag) {
  let ret = 0;

  switch(oper) {
    case OPER.SET:
      ret = 1;
      setStatusFlag(flag);
    break;
    case OPER.CLEAR:
      clearStatusFlag(flag);
    break;
  }

  return ret;
}

function oper8(oper, load, store, addr, val, flag) {
  let a = 0;
  let b = 0;
  let result = 0;
  let carry  = 0;

  switch(store) {
    case LOC.MEM:
      a = readRAM(addr);
    break;
    case LOC.A:
      a = cpu.A;
    break;
    case LOC.B:
      a = cpu.B;
    break;
  };

  switch(load) {
    case LOC.IMM:
      b = val;
    break;
    case LOC.MEM:
      if (RAMSize > addr) {
        b = readRAM(addr);
      } else {
        b = readROM(addr);
      }
    break;
    case LOC.A:
      b = cpu.A;
    break;
    case LOC.B:
      b = cpu.B;
    break;
  };

  switch(oper) {
    case OPER.ADD:
      result = a + b;
    break;
    case OPER.CMP:
    case OPER.SUB:
      result = a - b;
    break;
  }

  if (0 > result) {
    result += 0xFF;
  }

  if (0xFF < result) {
    carry = 1;
    result -= 0xFF;
  }

  if(oper != OPER.CMP) {
    switch(store) {
      case LOC.MEM:
        writeRAM(addr, result);
      break;
      case LOC.A:
        setA(result);
      break;
      case LOC.B:
        setB(result);
      break;
    };
  }

  switch(flag) {
    case FLAG.ADD:
      /*
        H: Set if there was a carry from bit 3; cleared otherwise.
        I: Not affected.
        N: Set if most significant bit of the result is set; cleared otherwise.
        Z: Set if all bits of the result are cleared; cleared otherwise.
        V: Set if there was two's complement overflow as a result of the operation;
        cleared otherwise.
        C: Set if there was a carry from the most significant bit of the result; cleared
        otherwise.
      */
      {
        if (a & 0b00000100 && result & 0b00001000) {
          setStatusFlag("H");
        } else {
          clearStatusFlag("H");
        }

        if (0x80 == (result & 0x80)) {
          setStatusFlag("N");
        } else {
          clearStatusFlag("N");
        }

        if (0 == result) {
          setStatusFlag("Z");
        } else {
          clearStatusFlag("Z");
        }

        // 2s compliment overflow test
        // Get MSBs of the operands
        const oa = a & 0x80;
        const ob = b & 0x80;

        if (oa != ob) {
          clearStatusFlag("V");
        } else {
          clearStatusFlag("V");
        }

        if (carry) {
          setStatusFlag("C");
        } else {
          clearStatusFlag("C");
        }
      }
    break;

    case FLAG.INC:
      /*
        N: Set if most significant bit of the result is set; cleared otherwise.
        Z: Set if all bits of the result are cleared; cleared otherwise.
        V: Set if there is a two's complement overflow as a result of the operation;
        cleared otherwise. Two's complement overflow will occur if and only if
        (ACCX) or (M) was 7F before the operation.
      */
      if (0x80 == (a & 0x80)) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      if (0 == a) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }

      if (0x7f == a || 0x7f == b) {
        setStatusFlag("V");
      } else {
        clearStatusFlag("V");
      }
    break;

    case FLAG.SUB:
      /*
        N: Set if most significant bit of the result is set; cleared otherwise.
        Z: Set if all bits of the result are cleared; cleared otherwise.
        V: Set if there is a two's complement overflow as a result of the operation;
        cleared otherwise.
        C: Set if the absolute value of the contents of memory are larger than the abso-
        lute value of the accumulator; cleared otherwise.
      */
      {
        if (0x80 == (result & 0x80)) {
          setStatusFlag("N");
        } else {
          clearStatusFlag("N");
        }

        if (0 == result) {
          setStatusFlag("Z");
        } else {
          clearStatusFlag("Z");
        }

        // 2s compliment overflow test
        // Get MSBs of the operands
        const oa = a & 0x80;
        const ob = b & 0x80;

        if (oa != ob) {
          clearStatusFlag("V");
        } else {
          clearStatusFlag("V");
        }

        if (b > a) {
          setStatusFlag("C");
        } else {
          clearStatusFlag("C");
        }
      }
    break;

    case FLAG.DEC:
      /*
        N: Set if most significant bit of the result is set; cleared otherwise.
        Z: Set if all bits of the result are cleared; cleared otherwise.
        V: Set if there was two's complement overflow as a result of the operation;
        cleared otherwise. Two's complement ·overflow occurs if and only if (ACCX)
        or (M) was 80 before the operation.
      */
      if (0x80 == (result & 0x80)) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      if (0 == result) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }

      if (0x80 == a || 0x80 == b) {
        setStatusFlag("V");
      } else {
        clearStatusFlag("V");
      }
    break;
  }

  return result;
}

function oper16(oper, load, store, addr, val, flag) {
  let a = 0;
  let b = 0;
  let result = 0;
  let carry  = 0;

  switch(store) {
    case LOC.D:
      a = cpu.D;
    break;
    case LOC.X:
      a = cpu.X;
    break;
    case LOC.Y:
      a = cpu.Y;
    break;
  };

  switch(load) {
    case LOC.IMM:
      b = val;
    break;
    case LOC.MEM:
      let mem1 = 0;
      let mem2 = 0;

      if (RAMSize > addr) {
        mem1 = readRAM(addr);
        mem2 = readRAM(addr + 1);
      } else {
        mem1 = readROM(addr);
        mem2 = readROM(addr + 1);
      }

      b = (mem1 << 8) + mem2;
    break;
    case LOC.A:
      b = cpu.A;
    break;
    case LOC.B:
      b = cpu.B;
    break;
  };

  switch(oper) {
    case OPER.ADD:
      result = a + b;
    break;
    case OPER.CMP:
    case OPER.SUB:
      result = a - b;
    break;
  }

  if (0 > result) {
    result += 0xFFFF;
  }

  if (0xFFFF < result) {
    carry = 1;
    result -= 0xFFFF;
  }

  if(oper != OPER.CMP) {
    switch(store) {
      case LOC.D:
        setD(result);
      break;
      case LOC.X:
        setX(result);
      break;
      case LOC.Y:
        setY(result);
      break;
    }
  }

  // Do flag stuff
  switch(flag) {
    case FLAG.ADD:
      {
        /*
          N: Set if most significant bit of result is set; cleared otherwise.
          Z: Set if all bits of the result are cleared; cleared otherwise.
          V: Set if there was two's complement overflow as a result of the operation;
          cleared otherwise.
          C: Set if there was a carry from the most significant bit of the result; cleared
          otherwise.
        */
        if (0x8000 == (result & 0x8000)) {
          setStatusFlag("N");
        } else {
          clearStatusFlag("N");
        }

        if (0 == result) {
          setStatusFlag("Z");
        } else {
          clearStatusFlag("Z");
        }

        // 2s compliment overflow test
        // Get MSBs of the operands
        const oa = a & 0x8000;
        const ob = b & 0x8000;

        if (oa != ob) {
          clearStatusFlag("V");
        } else {
          clearStatusFlag("V");
        }

        if (carry) {
          setStatusFlag("C");
        } else {
          clearStatusFlag("C");
        }
      }
    break;

    case FLAG.INX:
    case FLAG.DEX:
      // Do flag stuff
      // Z: Set if all 16 bits of the result are cleared; cleared otherwise.
      if (0 == result) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }
    break;

    case FLAG.SUB:
      {
        /*
          N: Set if the most significant bit of the result of the subtraction is set; cleared
          otherwise.
          Z: Set if all bits of the result of the subtraction are cleared; cleared otherwise.
          V: Set if the subtraction results in two's complement overflow: cleared other-
          wise.
          C: Set if the absolute value of the contents of memory is larger than the abso-
          lute value of the accumulator; cleared otherwise.
        */
        if (0x8000 == (result & 0x8000)) {
          setStatusFlag("N");
        } else {
          clearStatusFlag("N");
        }

        if (0 == result) {
          setStatusFlag("Z");
        } else {
          clearStatusFlag("Z");
        }

        // 2s compliment overflow test
        // Get MSBs of the operands
        let oa = a & 0x8000;
        let ob = b & 0x8000;

        if (oa != ob) {
          clearStatusFlag("V");
        } else {
          clearStatusFlag("V");
        }

        if (a > b) {
          setStatusFlag("C");
        } else {
          clearStatusFlag("C");
        }
      }
    break;
  }
}
