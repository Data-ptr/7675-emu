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
  NONE:   0,
  LOAD:   1,
  STORE:  2,
  ADD:    3,
  INC:    4,
  INX:    5,
  SUB:    6,
  DEC:    7,
  DEX:    8,
  TST:    9,
  xSR:    10, // Logical Shift Right
  ASL:    11, // Arithmetic shift left
  ROR:    12,
  ROL:    13
}

const OPER = {
  LOAD:  0,
  STORE: 1,
  ADD:   2,
  SUB:   3,
  CMP:   4,
  TST:   5,
  SET:   6,
  CLEAR: 7,
  LSR:   8,
  ASL:   9,
  ASR:   10,
  ADC:   11,
  ORA:   12,
  EOR:   13,
  ROR:   14,
  ROL:   15
}

// LDAA, LDAB
function load8(load, store, addr, val) {
  return oper8(OPER.LOAD, ...arguments, FLAG.LOAD);
}

// LDD, LDX, LDY
function load16(load, store, addr, val) {
  return oper16(OPER.LOAD, ...arguments, FLAG.LOAD);
}

// STAA, STAB
function store8(load, store, addr, val) {
  return oper8(OPER.LOAD, ...arguments, FLAG.LOAD);
}

// STD, STX, STY
function store16(load, store, addr, val) {
  return oper16(OPER.LOAD, ...arguments, FLAG.LOAD);
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

function tst8(store, addr) {
  return oper8(OPER.TST, LOC.IMM, ...arguments, 0, FLAG.TST);
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
    case OPER.LOAD:
      result = b;
    break;
    case OPER.STORE:
      result = a;
    break;
    case OPER.ADD:
      result = a + b;
    break;
    case OPER.CMP:
    case OPER.TST:
    case OPER.SUB:
      result = a - b;
    break;
    case OPER.ADC:
      result = a + b + cpu.status.C;
    break;
    case OPER.LSR:
      result = a >>> 1;
    break;
    case OPER.ASL:
      result = (a << 1) & 0xFF;
    break;
    case OPER.ASR:
      const sign = a & 0x80;
      result = (a >> 1) & sign;
    break;
    case OPER.ORA:
      result = a | b;
    break;
    case OPER.EOR:
      result = a ^ b;
    break;
    case OPER.ROR:
      result = (a >> 1) | (cpu.status.C << 7);
    break;
    case OPER.ROL:
      result = (a << 1) | cpu.status.C;
    break;
  }

  if (0 > result) {
    result += 0xFF;
  }

  while (0xFF < result) {
    carry = 1;
    result -= 0xFF;
  }

  if(oper != OPER.CMP && oper != OPER.TST) {
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
      flagCheck("H", null, a, null, result);
      flagCheck("N", "msb", null, null, result);
      flagCheck("Z", null, null, null, result);
      flagCheck("V", "2sc", a, b, null);
      flagCheck("C", "carry", null, null, null, carry);
    break;

    case FLAG.INC:
      /*
        N: Set if most significant bit of the result is set; cleared otherwise.
        Z: Set if all bits of the result are cleared; cleared otherwise.
        V: Set if there is a two's complement overflow as a result of the operation;
        cleared otherwise. Two's complement overflow will occur if and only if
        (ACCX) or (M) was 7F before the operation.
      */
      flagCheck("N", "msb", null, null, result);
      flagCheck("Z", null, null, null, result);
      flagCheck("V", "inc", a, b, null);
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
      flagCheck("N", "msb", null, null, result);
      flagCheck("Z", null, null, null, result);
      flagCheck("V", "2sc", a, b, null);
      flagCheck("C", "sub", a, b, null);
    break;

    case FLAG.DEC:
      /*
        N: Set if most significant bit of the result is set; cleared otherwise.
        Z: Set if all bits of the result are cleared; cleared otherwise.
        V: Set if there was two's complement overflow as a result of the operation;
        cleared otherwise. Two's complement ·overflow occurs if and only if (ACCX)
        or (M) was 80 before the operation.
      */
      flagCheck("N", "msb", null, null, result);
      flagCheck("Z", null, null, null, result);
      flagCheck("V", "dec", a, b, null);
    break;

    case FLAG.TST:
      /*
        N: Set if most significant bit of the contents of ACCX or M is set; cleared
        otherwise.
        Z: Set if all bits of the contents of ACCX or M are cleared; cleared otherwise.
        V: Cleared.
        C: Cleared.
      */
      flagCheck("N", "msb", null, null, result);
      flagCheck("Z", null, null, null, result);
      clearStatusFlag("V");
      clearStatusFlag("C");
    break;

    case FLAG.LOAD:
      /*
        N: Set if the most significant bit of the contents of ACCX is set; cleared
        otherwise.
        Z: Set if all bits of the contents of ACCX are cleared; cleared otherwise.
        V: Cleared.
      */
      flagCheck("N", "msb", null, null, result);
      flagCheck("Z", null, null, null, result);
      clearStatusFlag("V");
    break;

    case FLAG.xSR:
      /*
        N: Cleared.
        Z: Set if all bits of the result are cleared; cleared otherwise.
        V: Set if, after the completion of the shift operation, (Nis set and C is cleared)
        OR (N is cleared and C is set); cleared otherwise.
        C: Set if, before the operation, the least significant bit of the ACCX or M was
        set; cleared otherwise.
      */
      clearStatusFlag("N");
      flagCheck("Z", null, null, null, result);
      flagCheck("C", "lsb", a, b, null);
      flagCheck("V", "NC", null, null, null);
    break;

    case FLAG.ASL:
      /*
        N: Set if most significant bit of the result is set; cleared otherwise.
        Z: Set if all bits of the result are cleared; cleared othewise.
        V: Set if, after the completion of the shift operation, (N is set and C is cleared)
        OR (N is cleared and C is set); cleared otherwise.
        C: Set if, before the operation, the most significant bit of the ACCX or M was
        set; cleared otherwise.
      */
      flagCheck("N", "msb", null, null, result);
      flagCheck("Z", null, null, null, result);
      flagCheck("C", "msb", a, b, null);
      flagCheck("V", "NC", null, null, null);
    break;

    case FLAG.ROR:
      /*
        N: Set if most significant bit of the result is set; cleared otherwise.
        Z: Set if all bits of the result are cleared; cleared otherwise.
        V: Set if, after the completion of the operation, (N is set and C is cleared) OR
        (N is cleared and C is set); cleared otherwise.
        C: Set if, before the operation, the least significant bit of the ACCX or M was
        set; cleared otherwise.
      */
      flagCheck("N", "msb", null, null, result);
      flagCheck("Z", null, null, null, result);
      flagCheck("C", "lsb", a, b, null);
      flagCheck("V", "NC", null, null, null);
    break;

    case FLAG.ROL:
      /*
        N: Set if most significant bit of the result is set; cleared otherwise.
        Z: Set if all bits of the result are cleared; cleared otherwise.
        V: Set if, after the completion of the operation, (N is set and C is cleared) OR
        (N is cleared and C is set); cleared otherwise.
        C: Set if, before the operation, the least significant bit of the ACCX or M was
        set; cleared otherwise.
      */
      flagCheck("N", "msb", null, null, result);
      flagCheck("Z", null, null, null, result);
      flagCheck("C", "msb", a, b, null);
      flagCheck("V", "NC", null, null, null);
    break;
  }

  return result;
}

function oper16(oper, load, store, addr, val, flag) {
  let a = 0;
  let b = 0;
  let result = 0;
  let carry  = 0;

  if(oper != OPER.LOAD) {
    switch(store) {
      case LOC.MEM: //TODO: Ever used?
        let mem1 = 0;
        let mem2 = 0;

        if (0 <= addr && RAMSize > addr) {          // In RAM area
          mem1 = readRAM(addr);
          mem2 = readRAM(addr + 1);
        } else if(0xFFFF > addr && 0x8000 < addr) { // In ROM area
          mem1 = readROM(addr);
          mem2 = readROM(addr + 1);
        } else {                                    // Out of bounds
          mem1 = 0;
          mem2 = 0;
          //debugger;
        }

        a = (mem1 << 8) + mem2;
      break;
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
  }

  switch(load) {
    case LOC.IMM:
      b = val;
    break;
    case LOC.MEM:
      let mem1 = 0;
      let mem2 = 0;

      if (0 <= addr && RAMSize > addr) {          // In RAM area
        mem1 = readRAM(addr);
        mem2 = readRAM(addr + 1);
      } else if(0xFFFF > addr && 0x8000 < addr) { // In ROM area
        mem1 = readROM(addr);
        mem2 = readROM(addr + 1);
      } else {                                    // Out of bounds
        mem1 = 0;
        mem2 = 0;
        //debugger;
      }

      b = (mem1 << 8) + mem2;
    break;
    case LOC.A:
      b = cpu.A;
    break;
    case LOC.B:
      b = cpu.B;
    break;
    case LOC.D:
      b = cpu.D;
    break;
    case LOC.X:
      b = cpu.X;
    break;
    case LOC.Y:
      b = cpu.Y;
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
    case OPER.LOAD:
      result = b;
    break;
    case OPER.STORE:
      result = a;
    break;
    case OPER.LSR:
      result = a >>> 1;
    break;
    case OPER.ASL:
      result = (a << 1) & 0xFFFF;
    break;
  }

  if (0 > result) {
    result += 0xFFFF;
  }

  while (0xFFFF < result) {
    carry = 1;
    result -= 0xFFFF;
  }

  if(oper != OPER.CMP) {
    switch(store) {
      case LOC.MEM:
        writeRAM(addr, result >> 8);
        writeRAM(addr + 1, result & 0xFF);
      break;
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
      /*
        N: Set if most significant bit of result is set; cleared otherwise.
        Z: Set if all bits of the result are cleared; cleared otherwise.
        V: Set if there was two's complement overflow as a result of the operation;
        cleared otherwise.
        C: Set if there was a carry from the most significant bit of the result; cleared
        otherwise.
      */
      flagCheck("N", "msb16", null, null, result);
      flagCheck("Z", null, null, null, result);
      flagCheck("V", "2sc16", a, b, null);
      flagCheck("C", "carry", null, null, null, carry);
    break;

    case FLAG.INX:
    case FLAG.DEX:
      // Do flag stuff
      // Z: Set if all 16 bits of the result are cleared; cleared otherwise.
      flagCheck("Z", null, null, null, result);
    break;

    case FLAG.SUB:
      /*
        N: Set if the most significant bit of the result of the subtraction is set; cleared
        otherwise.
        Z: Set if all bits of the result of the subtraction are cleared; cleared otherwise.
        V: Set if the subtraction results in two's complement overflow: cleared other-
        wise.
        C: Set if the absolute value of the contents of memory is larger than the abso-
        lute value of the accumulator; cleared otherwise.
      */
      flagCheck("N", "msb16", null, null, result);
      flagCheck("Z", null, null, null, result);
      flagCheck("V", "2sc16", a, b, null);
      flagCheck("C", "sub", a, b, null);
    break;

    case FLAG.LOAD:
      /*
        N: Set if the most significant bit of the contents of ACCX is set; cleared
        otherwise.
        Z: Set if all bits of the contents of ACCX are cleared; cleared otherwise.
        V: Cleared.
      */
      flagCheck("N", "msb16", null, null, result);
      flagCheck("Z", null, null, null, result);
      clearStatusFlag("V");
    break;

    case FLAG.xSR:
      /*
        N: Cleared.
        Z: Set if all bits of the result are cleared; cleared otherwise.
        V: Set if, after the completion of the shift operation, (Nis set and C is cleared)
        OR (N is cleared and C is set); cleared otherwise.
        C: Set if, before the operation, the least significant bit of the ACCX or M was
        set; cleared otherwise.
      */
      clearStatusFlag("N");
      flagCheck("Z", null, null, null, result);
      flagCheck("C", "lsb", a, b, null);
      flagCheck("V", "NC", null, null, null);
    break;

    case FLAG.ASL:
      /*
        N: Set if most significant bit of the result is set; cleared otherwise.
        Z: Set if all bits of the result are cleared; cleared othewise.
        V: Set if, after the completion of the shift operation, (N is set and C is cleared)
        OR (N is cleared and C is set); cleared otherwise.
        C: Set if, before the operation, the most significant bit of the ACCX or M was
        set; cleared otherwise.
      */
      flagCheck("N", "msb16", null, null, result);
      flagCheck("Z", null, null, null, result);
      flagCheck("C", "msb16", a, b, null);
      flagCheck("V", "NC", null, null, null);
    break;
  }
}

function branch(offset, test) {
  if (test) {
    if (0b10000000 == (0b10000000 & offset)) {
      setPC(cpu.PC - ((offset ^ 0xFF) + 0x1));
    } else {
      setPC(cpu.PC + offset);
    }
  }

  // Do flag stuff
  // Not affected.
}

function flagCheck(flag, check, acc, mem, result, carry) {
  switch(flag) {
    case "H":
      if (acc & 0b00000100 && result & 0b00001000) {
        setStatusFlag("H");
      } else {
        clearStatusFlag("H");
      }
    break;

    case "N":
      switch(check) {
        case "msb":
          if (0x80 == (result & 0x80)) {
            setStatusFlag("N");
          } else {
            clearStatusFlag("N");
          }
        break;
        case "msb16":
          if (0x8000 == (result & 0x8000)) {
            setStatusFlag("N");
          } else {
            clearStatusFlag("N");
          }
        break;
      }
    break;

    case "Z":
      if (0 == result) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }
    break;

    case "V":
      switch(check) {
        case "2sc":
          {
            // 2s compliment overflow test
            // Get MSBs of the operands
            const oa = acc & 0x80;
            const ob = mem & 0x80;

            if (oa != ob) {
              setStatusFlag("V");
            } else {
              clearStatusFlag("V");
            }
          }
        break;
        case "2sc16":
          {
            // 2s compliment overflow test
            // Get MSBs of the operands
            const oa = acc & 0x8000;
            const ob = mem & 0x8000;

            if (oa != ob) {
              setStatusFlag("V");
            } else {
              clearStatusFlag("V");
            }
          }
        break;
        case "inc":
          if (0x7f == acc || 0x7f == mem) {
            setStatusFlag("V");
          } else {
            clearStatusFlag("V");
          }
        break;
        case "dec":
          if (0x80 == acc || 0x80 == mem) {
            setStatusFlag("V");
          } else {
            clearStatusFlag("V");
          }
        break;
        case "NC":
          if (1 == cpu.status.N + cpu.status.C) {
            setStatusFlag("V");
          } else {
            clearStatusFlag("V");
          }
        break;
      }
    break;

    case "C":
      switch(check) {
        case "carry":
          if (carry) {
            setStatusFlag("C");
          } else {
            clearStatusFlag("C");
          }
        break;
        case "sub":
          if (mem > acc) {
            setStatusFlag("C");
          } else {
            clearStatusFlag("C");
          }
        break;
        case "lsb":
          if (acc & 0b00000001 || mem & 0b00000001) {
            setStatusFlag("C");
          } else {
            clearStatusFlag("C");
          }
        break;
        case "msb":
          if (0x80 == (acc & 0x80) || 0x80 == (mem & 0x80)) {
            setStatusFlag("C");
          } else {
            clearStatusFlag("C");
          }
        break;
        case "msb16":
          if (0x8000 == (acc & 0x8000) || 0x8000 == (mem & 0x8000)) {
            setStatusFlag("C");
          } else {
            clearStatusFlag("C");
          }
        break;
      }
    break;
  }
}
