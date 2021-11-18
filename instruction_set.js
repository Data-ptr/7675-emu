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
    cycles: 1, // Unknown
    microcode: function(view) {
      const addr = view[cpu.PC - 0x8000 + 1];
      const operand = view[cpu.PC - 0x8000 + 2];

      const mem = readRAM(addr);
      const result = mem & operand;

      writeRAM(addr, result);

      // Do flag stuff
      /*
        N  = R7: Set  if the  result's MSB is  "1"; cleared  otherwise
        Z = R7-R6-RS-R4-R3-R2-Rl-RO: Set  if  the  result is  zero; cleared otherwise
        V  =  0: Cleared
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

      clearStatusFlag("V");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x03: {
    name: "orm",
    len: 3,
    type: "DIRECT2",
    cycles: 1, // Unknown
    microcode: function(view) {
      const addr = view[cpu.PC - 0x8000 + 1];
      const operand = view[cpu.PC - 0x8000 + 2];

      const mem = readRAM(addr);
      const result = mem | operand;

      writeRAM(addr, result);

      // Do flag stuff
      /*
        N  = R7: Set  if the  result's MSB is  "1"; cleared  otherwise_
        Z = R7-R6-RS-R4-R3-R2-Rl-RO: Set  if  the  "resul t is  zero;  cleared otherwise_
        V  =  0: Cleared
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

      clearStatusFlag("V");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x04: {
    name: "lsrd",
    len: 1,
    type: "IMPLIED",
    cycles: 3,
    microcode: function(view) {
      oper16(OPER.LSR, LOC.NONE, LOC.D, 0, 0, FLAG.xSR);

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
      oper16(OPER.ASL, LOC.NONE, LOC.D, 0, 0, FLAG.ASL);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x06: { name: "tap", len: 1, type: "IMPLIED", cycles: 2 },
  0x07: { name: "tpa", len: 1, type: "IMPLIED", cycles: 2 },
  0x08: {
    name: "inx",
    len: 1,
    type: "IMPLIED",
    cycles: 3,
    microcode: function(view) {
      add16(LOC.IMM, LOC.X, 0, 1, FLAG.INX);

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
      sub16(LOC.IMM, LOC.X, 0, 1, FLAG.DEX);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x0a: {
    name: "clv",
    len: 1,
    type: "IMPLIED",
    cycles: 2,
    microcode: function(view) {
      clearFlag("V");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x0b: {
    name: "sev",
    len: 1,
    type: "IMPLIED",
    cycles: 2,
    microcode: function(view) {
      setFlag("V");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x0c: {
    name: "clc",
    len: 1,
    type: "IMPLIED",
    cycles: 2,
    microcode: function(view) {
      clearFlag("C");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x0d: {
    name: "sec",
    len: 1,
    type: "IMPLIED",
    cycles: 2,
    microcode: function(view) {
      setFlag("C");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x0e: {
    name: "cli",
    len: 1,
    type: "IMPLIED",
    cycles: 2,
    microcode: function(view) {
      clearFlag("I");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x0f: {
    name: "sei",
    len: 1,
    type: "IMPLIED",
    cycles: 2,
    microcode: function(view) {
      setFlag("I");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x10: {
    name: "sba",
    len: 1,
    type: "IMPLIED",
    cycles: 2,
    microcode: function(view) {
      sub8(LOC.IMM, LOC.A, 0, cpu.B, FLAG.SUB);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x11: {
    name: "cba",
    len: 1,
    type: "IMPLIED",
    cycles: 2,
    microcode: function(view) {
      cmp8(LOC.B, cpu.A, 0, 0);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x12: { name: "nop", len: 3, type: "EXTENDED", cycles: 0 },
  0x13: {
    name: "brclr2",
    len: 4,
    type: "DIRECT3",
    cycles: 1, // Unknown
    microcode: function(view) {
      const addr = view[cpu.PC - 0x8000 + 1];
      const bitMask = view[cpu.PC - 0x8000 + 2];
      const jmpOffset = view[cpu.PC - 0x8000 + 3];
      let mem = 0;

      if (RAMSize > addr) {
        mem = readRAM(addr);
      } else {
        mem = readROM(addr);
      }

      setPC(cpu.PC + this.len);

      branch(jmpOffset, 0 == (mem & bitMask));

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x14: {
    name: "idiv",
    len: 2,
    type: "DIRECT",
    cycles: 6,
    microcode: function(view) {
      const addr = view[cpu.PC - 0x8000 + 1];
      const n = cpu.D; //numerator
      const d = readRAM(addr); //denominator
      let q = 0; //quotient
      let r = 0; //remainder

      if(0 == d || d <= n) {
        q = 0xFF;
        r = 0;
      } else {
        q = n / d;
        r = Math.floor((q - Math.floor(q)) / (1 / 0xff));
      }

      const resultA = r > 0xFF ? r >> 8 : r;
      const resultB = Math.floor(q);

      setA(resultA);
      setB(resultB);

      // Do flag stuff
      /*
        Z: Set if quotient is $0000; cleared otherwise.
        V: Set if denominator was less than or equal to the numerator; cleared
        otherwise.
        C: Set if denominator was $0000; cleared otherwise.
      */
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

      if (0 == d) {
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
      const addr = view[cpu.PC - 0x8000 + 1];
      const n = cpu.D; //numerator
      const d = readRAM(addr); //denominator
      let q = 0; //quotient
      let r = 0; //remainder

      if(0 == d || d <= n) {
        q = 0xFF;
        r = 0;
      } else {
        q = n / d;
        r = Math.floor((q - Math.floor(q)) / (1 / 0xff));
      }

      const resultA = r > 0xFF ? r >> 8 : r;
      const resultB = Math.floor(q);

      setA(resultA);
      setB(resultB);

      // Do flag stuff
      /*
        Z: Set if quotient is $0000; cleared otherwise.
        V: Set if denominator was less than or equal to the numerator; cleared
        otherwise.
        C: Set if denominator was $0000; cleared otherwise.
      */
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

      if (0 == d) {
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
  0x16: {
    name: "tab",
    len: 1,
    type: "IMPLIED",
    cycles: 2,
    microcode: function(view) {
      load8(LOC.A, LOC.B, 0, 0);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x17: {
    name: "tba",
    len: 1,
    type: "IMPLIED",
    cycles: 2,
    microcode: function(view) {
      load8(LOC.B, LOC.A, 0, 0);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x18: {
    name: "xgxy",
    len: 1,
    type: "IMPLIED",
    cycles: 4,
    microcode: function(view) {
      const index1 = cpu.X;
      const index2 = cpu.Y;

      setY(index1);
      setX(index2);

      // Do flag stuff
      /*
        None affected
      */

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x19: { name: "daa", len: 1, type: "IMPLIED", cycles: 2 },
  0x1a: {
    name: "xgdx",
    len: 1,
    type: "IMPLIED",
    cycles: 4, // A guess
    microcode: function(view) {
      const acc = cpu.D;
      const index = cpu.X;

      setD(index);
      setX(acc);

      // Do flag stuff
      /*
        None affected
      */

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x1b: {
    name: "aba",
    len: 1,
    type: "IMPLIED",
    cycles: 2,
    microcode: function(view) {
      add8(LOC.B, LOC.A, 0, 0, FLAG.ADD);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x1c: {
    name: "cpd",
    len: 3,
    type: "IMMEDIATE16",
    cycles: 5,
    microcode: function(view) {
      const firstByte = view[cpu.PC - 0x8000 + 1];
      const secondByte = view[cpu.PC - 0x8000 + 2];
      const word = (firstByte << 8) + secondByte;

      cmp16(LOC.IMM, LOC.D, 0, word);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x1d: {
    name: "cpd",
    len: 2,
    type: "DIRECT",
    cycles: 6,
    microcode: function(view) {
      const addr = view[cpu.PC - 0x8000 + 1];

      cmp16(LOC.MEM, LOC.D, addr, 0);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x1e: {
    name: "cpd",
    len: 2,
    type: "INDEXED",
    cycles: 6,
    microcode: function(view) {
      const offset = view[cpu.PC - 0x8000 + 1];
      const addr = offset + cpu.X;

      cmp16(LOC.MEM, LOC.D, addr, 0);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x1f: {
    name: "cpd",
    len: 3,
    type: "EXTENDED",
    cycles: 7,
    microcode: function(view) {
      const firstByte = view[cpu.PC - 0x8000 + 1];
      const secondByte = view[cpu.PC - 0x8000 + 2];
      const addr = (firstByte << 8) + secondByte;

      cmp16(LOC.MEM, LOC.D, addr, 0);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x20: {
    name: "bra",
    len: 2,
    type: "RELATIVE",
    cycles: 3,
    microcode: function(view) {
      const jmpOffset = view[cpu.PC - 0x8000 + 1];

      setPC(cpu.PC + this.len);

      branch(jmpOffset, true);

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
      advanceClock(this.cycles);
    }
  },
  0x22: {
    name: "bhi",
    len: 2,
    type: "RELATIVE",
    cycles: 3,
    microcode: function(view) {
      const jmpOffset = view[cpu.PC - 0x8000 + 1];

      setPC(cpu.PC + this.len);

      branch(jmpOffset, 0 == cpu.status.C + cpu.status.Z);

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
      const jmpOffset = view[cpu.PC - 0x8000 + 1];

      setPC(cpu.PC + this.len);

      branch(jmpOffset, cpu.status.C | cpu.status.Z);

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
      const jmpOffset = view[cpu.PC - 0x8000 + 1];

      setPC(cpu.PC + this.len);

      branch(jmpOffset, !cpu.status.C);

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
      const jmpOffset = view[cpu.PC - 0x8000 + 1];

      setPC(cpu.PC + this.len);

      branch(jmpOffset, cpu.status.C);

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
      const jmpOffset = view[cpu.PC - 0x8000 + 1];

      setPC(cpu.PC + this.len);

      branch(jmpOffset, !cpu.status.Z);

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
      const jmpOffset = view[cpu.PC - 0x8000 + 1];

      setPC(cpu.PC + this.len);

      branch(jmpOffset, cpu.status.Z);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x28: {
    name: "bvc",
    len: 2,
    type: "RELATIVE",
    cycles: 3,
    microcode: function(view) {
      const jmpOffset = view[cpu.PC - 0x8000 + 1];

      setPC(cpu.PC + this.len);

      branch(jmpOffset, !cpu.status.V);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x29: {
    name: "bvs",
    len: 2,
    type: "RELATIVE",
    cycles: 3,
    microcode: function(view) {
      const jmpOffset = view[cpu.PC - 0x8000 + 1];

      setPC(cpu.PC + this.len);

      branch(jmpOffset, cpu.status.V);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x2a: {
    name: "bpl",
    len: 2,
    type: "RELATIVE",
    cycles: 3,
    microcode: function(view) {
      const jmpOffset = view[cpu.PC - 0x8000 + 1];

      setPC(cpu.PC + this.len);

      branch(jmpOffset, !cpu.status.N);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x2b: {
    name: "bmi",
    len: 2,
    type: "RELATIVE",
    cycles: 3,
    microcode: function(view) {
      const jmpOffset = view[cpu.PC - 0x8000 + 1];

      setPC(cpu.PC + this.len);

      branch(jmpOffset, cpu.status.N);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x2c: {
    name: "bge",
    len: 2,
    type: "RELATIVE",
    cycles: 3,
    microcode: function(view) {
      const jmpOffset = view[cpu.PC - 0x8000 + 1];

      setPC(cpu.PC + this.len);

      branch(jmpOffset, cpu.status.N == cpu.status.V);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x2d: {
    name: "blt",
    len: 2,
    type: "RELATIVE",
    cycles: 3,
    microcode: function(view) {
      const jmpOffset = view[cpu.PC - 0x8000 + 1];

      setPC(cpu.PC + this.len);

      branch(jmpOffset, 1 == cpu.status.N + cpu.status.V);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x2e: {
    name: "bgt",
    len: 2,
    type: "RELATIVE",
    cycles: 3,
    microcode: function(view) {
      const jmpOffset = view[cpu.PC - 0x8000 + 1];

      setPC(cpu.PC + this.len);

      branch(jmpOffset, !cpu.status.Z && cpu.status.N == cpu.status.V);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x2f: {
    name: "ble",
    len: 2,
    type: "RELATIVE",
    cycles: 3,
    microcode: function(view) {
      const jmpOffset = view[cpu.PC - 0x8000 + 1];

      setPC(cpu.PC + this.len);

      branch(jmpOffset, cpu.status.Z && 1 == cpu.status.N + cpu.status.V);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x30: {
    name: "tsx",
    len: 1,
    type: "IMPLIED",
    cycles: 3,
    microcode: function(view) {
      setX(cpu.SP);

      // Do flag stuff
      // Not affected.

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x31: {
    name: "ins",
    len: 1,
    type: "IMPLIED",
    cycles: 3,
    microcode: function(view) {
      setSP(cpu.SP + 1);

      // Do flag stuff
      // Not affected.

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x32: {
    name: "pula",
    len: 1,
    type: "IMPLIED",
    cycles: 4,
    microcode: function(view) {
      setSP(cpu.SP + 1);
      const b1 = readRAM(cpu.SP);

      setA(b1);

      // Do flag stuff
      // Not affected.

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
      const b1 = readRAM(cpu.SP);

      setB(b1);

      // Do flag stuff
      // Not affected.

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x34: { name: "des", len: 1, type: "IMPLIED", cycles: 3,
  microcode: function(view) {
    setSP(cpu.SP - 1);

    // Do flag stuff
    // Not affected.

    //Next
    setPC(cpu.PC + this.len);

    //Clock
    advanceClock(this.cycles);
  } },
  0x35: { name: "txs", len: 1, type: "IMPLIED", cycles: 3,
  microcode: function(view) {
    setSP(cpu.X);

    // Do flag stuff
    // Not affected.

    //Next
    setPC(cpu.PC + this.len);

    //Clock
    advanceClock(this.cycles);
  } },
  0x36: {
    name: "psha",
    len: 1,
    type: "IMPLIED",
    cycles: 3,
    microcode: function(view) {
      writeRAM(cpu.SP, cpu.A);
      setSP(cpu.SP - 1);

      // Do flag stuff
      // Not affected.

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

      // Do flag stuff
      // Not affected.

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
      const bHi = readRAM(cpu.SP);

      setSP(cpu.SP + 1);
      const bLo = readRAM(cpu.SP);

      setX((bHi << 8) + bLo);

      // Do flag stuff
      // Not affected.

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
      subroutineChange(0, cpu.SP);

      setSP(cpu.SP + 1);
      const b1 = readRAM(cpu.SP);

      setSP(cpu.SP + 1);
      const b2 = readRAM(cpu.SP);

      const addr = (b2 << 8) + b1;

      setPC(addr);

      // Do flag stuff
      // Not affected.

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
      add16(LOC.IMM, LOC.X, 0, cpu.B, FLAG.NONE);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x3b: {
    name: "rti",
    len: 1,
    type: "IMPLIED",
    cycles: 12,
    microcode: function(view) {
      if (cpu.status.I) {
        stackFlags(1);
        stackD(1);
        stackX(1);
        stackY(1);
        stackPC(1);
      } else {
        console.log(
          "Trying to return from interrupt while not in an interrrupt..."
        );
        clearInterval(stepInterval);
      }
    }

    // Do flag stuff
    // Restored to the states pulled from the stack.
  },
  0x3c: {
    name: "pshx",
    len: 1,
    type: "IMPLIED",
    cycles: 4,
    microcode: function(view) {
      writeRAM(cpu.SP, cpu.X & 0xff);
      setSP(cpu.SP - 1);

      writeRAM(cpu.SP, cpu.X >> 8);
      setSP(cpu.SP - 1);

      // Do flag stuff
      // Not affected.

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x3d: {
    name: "mul",
    len: 1,
    type: "IMPLIED",
    cycles: 10,
    microcode: function(view) {
      let result = cpu.A * cpu.B;

      if (result > 0xff) {
        result = result - 0xff;
      }

      setD(result);

      // Do flag stuff
      // C: Set if bit 7 of result (ACCB B7) is set; cleared otherwise.
      if (0x80 == (result & 0x80)) {
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
  0x3e: { name: "wai", len: 1, type: "IMPLIED", cycles: 14 },
  0x3f: { name: "swi", len: 1, type: "IMPLIED", cycles: 14 },
  0x40: {
    name: "nega",
    len: 1,
    type: "IMPLIED",
    cycles: 2,
    microcode: function(view) {
      let acc = cpu.A;
      let result = 0x80 == acc ? 0x80 : 0 - acc;

      // Do flag stuff
      /*
      N: Set if most significant bit of the result is set; cleared otherwise.
      Z: Set if all bits of the result are cleared; cleared otherwise.
      V: Set if there was two's complement overflow as a result of the operation;
      cleared otherwise. Two's complement ·overflow occurs if and only if (ACCX)
      or (M) was 80 before the operation.
      C: Set if there is a borrow in the implied subtraction from zero; the C bit will
      be set in all cases except when the contents of ACCX or M is 00.
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

      if (0x80 == acc) {
        setStatusFlag("V");
      } else {
        clearStatusFlag("V");
      }

      if (0 != acc) {
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
  0x41: { name: "0x41", len: 0, type: "INVALID", cycles: 0 },
  0x42: { name: "0x42", len: 0, type: "INVALID", cycles: 0 },
  0x43: {
    name: "coma",
    len: 1,
    type: "IMPLIED",
    cycles: 2,
    microcode: function(view) {
      setA(0xff - cpu.A);

      // Do flag stuff
      /*
        N: Set if most significant bit of the result is set; cleared otherwise.
        Z: Set if all bits of the result are cleared; cleared otherwise.
        V: Cleared.
        C: Set.
      */
      if (0x80 == (cpu.A & 0x80)) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      if (0 == cpu.A) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
      }

      clearStatusFlag("V");

      setStatusFlag("C");

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
      oper8(OPER.LSR, LOC.NONE, LOC.A, 0, 0, FLAG.xSR);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x45: { name: "0x45", len: 0, type: "INVALID", cycles: 0 },
  0x46: {
    name: "rora",
    len: 1,
    type: "IMPLIED",
    cycles: 2,
    microcode: function(view) {
      oper8(OPER.ROR, LOC.NONE, LOC.A, 0, 0, FLAG.ROR);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x47: {
    name: "asra",
    len: 1,
    type: "IMPLIED",
    cycles: 2,
    microcode: function(view) {
      oper8(OPER.ASR, LOC.NONE, LOC.A, 0, 0, FLAG.xSR);

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
      oper8(OPER.ASL, LOC.NONE, LOC.A, 0, 0, FLAG.ASL);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x49: {
    name: "rola",
    len: 1,
    type: "IMPLIED",
    cycles: 2,
    microcode: function(view) {
      oper8(OPER.ROL, LOC.NONE, LOC.A, 0, 0, FLAG.ROL);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x4a: {
    name: "deca",
    len: 1,
    type: "IMPLIED",
    cycles: 2,
    microcode: function(view) {
      sub8(LOC.IMM, LOC.A, 0, 1, FLAG.DEC);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x4b: { name: "0x4b", len: 0, type: "INVALID", cycles: 0 },
  0x4c: {
    name: "inca",
    len: 1,
    type: "IMPLIED",
    cycles: 2,
    microcode: function(view) {
      add8(LOC.IMM, LOC.A, 0, 1, FLAG.INC);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x4d: {
    name: "tsta",
    len: 1,
    type: "IMPLIED",
    cycles: 2,
    microcode: function(view) {
      tst8(LOC.A, 0);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x4e: { name: "0x4e", len: 0, type: "INVALID", cycles: 0 },
  0x4f: {
    name: "clra",
    len: 1,
    type: "IMPLIED",
    cycles: 2,
    microcode: function(view) {
      setA(0);

      // Do flag stuff
      /*
        N: Cleared.
        Z: Set.
        V: Cleared.
        C: Cleared.
      */
      clearStatusFlag("N");
      setStatusFlag("Z");
      clearStatusFlag("V");
      clearStatusFlag("C");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x50: {
    name: "negb",
    len: 1,
    type: "IMPLIED",
    cycles: 2,
    microcode: function(view) {
      let acc = cpu.B;
      let result = 0x80 == acc ? 0x80 : 0 - acc;

      // Do flag stuff
      /*
      N: Set if most significant bit of the result is set; cleared otherwise.
      Z: Set if all bits of the result are cleared; cleared otherwise.
      V: Set if there was two's complement overflow as a result of the operation;
      cleared otherwise. Two's complement ·overflow occurs if and only if (ACCX)
      or (M) was 80 before the operation.
      C: Set if there is a borrow in the implied subtraction from zero; the C bit will
      be set in all cases except when the contents of ACCX or M is 00.
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

      if (0x80 == acc) {
        setStatusFlag("V");
      } else {
        clearStatusFlag("V");
      }

      if (0 != acc) {
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
  0x51: { name: "0x51", len: 0, type: "INVALID", cycles: 0 },
  0x52: { name: "0x52", len: 0, type: "INVALID", cycles: 0 },
  0x53: {
    name: "comb",
    len: 1,
    type: "IMPLIED",
    cycles: 2,
    microcode: function(view) {
      const result = 0xff - cpu.B;

      setB(result);

      // Do flag stuff
      /*
        N: Set if most significant bit of the result is set; cleared otherwise.
        Z: Set if all bits of the result are cleared; cleared otherwise.
        V: Cleared.
        C: Set.
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

      clearStatusFlag("V");

      setStatusFlag("C");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x54: {
    name: "lsrb",
    len: 1,
    type: "IMPLIED",
    cycles: 2,
    microcode: function(view) {
      oper8(OPER.LSR, LOC.NONE, LOC.B, 0, 0, FLAG.xSR);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x55: { name: "0x55", len: 0, type: "IMPLIED", cycles: 0 },
  0x56: {
    name: "rorb",
    len: 1,
    type: "IMPLIED",
    cycles: 2,
    microcode: function(view) {
      oper8(OPER.ROR, LOC.NONE, LOC.B, 0, 0, FLAG.ROR);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x57: {
    name: "asrb",
    len: 1,
    type: "IMPLIED",
    cycles: 2,
    microcode: function(view) {
      oper8(OPER.LSR, LOC.NONE, LOC.B, 0, 0, FLAG.xSR);

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
      oper8(OPER.ASL, LOC.NONE, LOC.B, 0, 0, FLAG.ASL);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x59: {
    name: "rolb",
    len: 1,
    type: "IMPLIED",
    cycles: 2,
    microcode: function(view) {
      oper8(OPER.ROL, LOC.NONE, LOC.B, 0, 0, FLAG.ROL);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x5a: {
    name: "decb",
    len: 1,
    type: "IMPLIED",
    cycles: 2,
    microcode: function(view) {
      sub8(LOC.IMM, LOC.B, 0, 1, FLAG.DEC);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x5b: { name: "0x5b", len: 0, type: "INVALID", cycles: 0 },
  0x5c: {
    name: "incb",
    len: 1,
    type: "IMPLIED",
    cycles: 2,
    microcode: function(view) {
      add8(LOC.IMM, LOC.B, 0, 1, FLAG.INC);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x5d: {
    name: "tstb",
    len: 1,
    type: "IMPLIED",
    cycles: 2,
    microcode: function(view) {
      tst8(LOC.B, 0);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x5e: { name: "0x5e", len: 0, type: "INVALID", cycles: 0 },
  0x5f: {
    name: "clrb",
    len: 1,
    type: "IMPLIED",
    cycles: 2,
    microcode: function(view) {
      setB(0);

      // Do flag stuff
      /*
        N: Cleared.
        Z: Set.
        V: Cleared.
        C: Cleared.
      */
      clearStatusFlag("N");
      setStatusFlag("Z");
      clearStatusFlag("V");
      clearStatusFlag("C");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x60: { name: "neg", len: 2, type: "INDEXED", cycles: 6 },
  0x61: { name: "0x61", len: 0, type: "INVALID", cycles: 0 },
  0x62: { name: "0x62", len: 0, type: "INVALID", cycles: 0 },
  0x63: { name: "com", len: 2, type: "INDEXED", cycles: 6 },
  0x64: { name: "lsr", len: 2, type: "INDEXED", cycles: 6,
  microcode: function(view) {
    const offset = view[cpu.PC - 0x8000 + 1];
    const addr = offset + cpu.X;

    oper8(OPER.LSR, LOC.NONE, LOC.MEM, addr, 0, FLAG.xSR);

    //Next
    setPC(cpu.PC + this.len);

    //Clock
    advanceClock(this.cycles);
  } },
  0x65: { name: "0x65", len: 0, type: "INVALID", cycles: 0 },
  0x66: { name: "ror", len: 2, type: "INDEXED", cycles: 6 },
  0x67: { name: "asr", len: 2, type: "INDEXED", cycles: 6 },
  0x68: { name: "asl", len: 2, type: "INDEXED", cycles: 6 },
  0x69: { name: "rol", len: 2, type: "INDEXED", cycles: 6 },
  0x6a: {
    name: "dec",
    len: 2,
    type: "INDEXED",
    cycles: 6,
    microcode: function(view) {
      const offset = view[cpu.PC - 0x8000 + 1];
      const addr = offset + cpu.X;

      sub8(LOC.IMM, LOC.MEM, addr, 1, FLAG.DEC);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x6b: { name: "0x6b", len: 1, type: "INVALID", cycles: 0 },
  0x6c: {
    name: "inc",
    len: 2,
    type: "INDEXED",
    cycles: 6,
    microcode: function(view) {
      const offset = view[cpu.PC - 0x8000 + 1];
      const addr = offset + cpu.X;

      add8(LOC.IMM, LOC.MEM, addr, 1, FLAG.INC);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x6d: {
    name: "tst",
    len: 2,
    type: "INDEXED",
    cycles: 6,
    microcode: function(view) {
      const offset = view[cpu.PC - 0x8000 + 1];
      const addr = offset + cpu.X;

      tst8(LOC.MEM, addr);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x6e: { name: "jmp", len: 2, type: "INDEXED", cycles: 0 },
  0x6f: {
    name: "clr",
    len: 2,
    type: "INDEXED",
    cycles: 6,
    microcode: function(view) {
      const offset = view[cpu.PC - 0x8000 + 1];
      const addr = offset + cpu.X;

      writeRAM(addr, 0x00);

      // Do flag stuff
      /*
      N: Cleared.
      Z: Set.
      V: Cleared.
      C: Cleared.
    */
      clearStatusFlag("N");
      setStatusFlag("Z");
      clearStatusFlag("V");
      clearStatusFlag("C");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x70: { name: "neg", len: 3, type: "EXTENDED", cycles: 0 },
  0x71: { name: "0x71", len: 0, type: "EXTENDED", cycles: 0 },
  0x72: { name: "0x72", len: 0, type: "EXTENDED", cycles: 0 },
  0x73: { name: "com", len: 3, type: "EXTENDED", cycles: 0 },
  0x74: { name: "lsr", len: 3, type: "EXTENDED", cycles: 6,
  microcode: function(view) {
    const firstByte = view[cpu.PC - 0x8000 + 1];
    const secondByte = view[cpu.PC - 0x8000 + 2];
    const addr = (firstByte << 8) + secondByte;

    oper8(OPER.LSR, LOC.NONE, LOC.MEM, addr, 0, FLAG.xSR);

    //Next
    setPC(cpu.PC + this.len);

    //Clock
    advanceClock(this.cycles);
  }  },
  0x75: { name: "0x75", len: 0, type: "EXTENDED", cycles: 0 },
  0x76: {
    name: "ror",
    len: 3,
    type: "EXTENDED",
    cycles: 6,
    microcode: function(view) {
      const firstByte = view[cpu.PC - 0x8000 + 1];
      const secondByte = view[cpu.PC - 0x8000 + 2];
      const addr = (firstByte << 8) + secondByte;

      oper8(OPER.ROR, LOC.NONE, LOC.MEM, addr, 0, FLAG.ROR);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x77: { name: "asr", len: 3, type: "EXTENDED", cycles: 0 },
  0x78: {
    name: "asl",
    len: 3,
    type: "EXTENDED",
    cycles: 6,
    microcode: function(view) {
      const firstByte = view[cpu.PC - 0x8000 + 1];
      const secondByte = view[cpu.PC - 0x8000 + 2];
      const addr = (firstByte << 8) + secondByte;

      oper8(OPER.ASL, LOC.NONE, LOC.MEM, addr, 0, FLAG.ASL);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x79: {
    name: "rol",
    len: 3,
    type: "EXTENDED",
    cycles: 6,
    microcode: function(view) {
      const firstByte = view[cpu.PC - 0x8000 + 1];
      const secondByte = view[cpu.PC - 0x8000 + 2];
      const addr = (firstByte << 8) + secondByte;

      oper8(OPER.ROL, LOC.NONE, LOC.MEM, addr, 0, FLAG.ROL);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x7a: {
    name: "dec",
    len: 3,
    type: "EXTENDED",
    cycles: 6,
    microcode: function(view) {
      const firstByte = view[cpu.PC - 0x8000 + 1];
      const secondByte = view[cpu.PC - 0x8000 + 2];
      const addr = (firstByte << 8) + secondByte;
      let mem = 0;

      if (RAMSize > addr) {
        mem = readRAM(addr);
      } else {
        mem = readROM(addr);
      }

      let result = mem - 1;

      //TODO: questionable...
      if (0 > result) {
        result += 0xff;
      }

      writeRAM(addr, result);

      // Do flag stuff
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
      const firstByte = view[cpu.PC - 0x8000 + 1];
      const secondByte = view[cpu.PC - 0x8000 + 2];
      const addr = (firstByte << 8) + secondByte;

      add8(LOC.IMM, LOC.MEM, addr, 1, FLAG.INC);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x7d: {
    name: "tst",
    len: 3,
    type: "EXTENDED",
    cycles: 6,
    microcode: function(view) {
      const firstByte = view[cpu.PC - 0x8000 + 1];
      const secondByte = view[cpu.PC - 0x8000 + 2];
      const addr = (firstByte << 8) + secondByte;

      tst8(LOC.MEM, addr);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x7e: {
    name: "jmp",
    len: 3,
    type: "EXTENDED",
    cycles: 3,
    microcode: function(view) {
      const firstByte = view[cpu.PC - 0x8000 + 1];
      const secondByte = view[cpu.PC - 0x8000 + 2];
      const addr = (firstByte << 8) + secondByte;

      setPC(addr);

      // Do flag stuff
      // Not affected.

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x7f: {
    name: "clr",
    len: 3,
    type: "EXTENDED",
    cycles: 6,
    microcode: function(view) {
      const firstByte = view[cpu.PC - 0x8000 + 1];
      const secondByte = view[cpu.PC - 0x8000 + 2];
      const addr = (firstByte << 8) + secondByte;

      writeRAM(addr, 0x00);

      // Do flag stuff
      /*
        N: Cleared.
        Z: Set.
        V: Cleared.
        C: Cleared.
      */
      clearStatusFlag("N");
      setStatusFlag("Z");
      clearStatusFlag("V");
      clearStatusFlag("C");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x80: {
    name: "suba",
    len: 2,
    type: "IMMEDIATE",
    cycles: 2,
    microcode: function(view) {
      const byte = view[cpu.PC - 0x8000 + 1];

      sub8(LOC.IMM, LOC.A, 0, byte, FLAG.SUB);

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
      const byte = view[cpu.PC - 0x8000 + 1];

      cmp8(LOC.IMM, LOC.A, 0, byte);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x82: {
    name: "sbca",
    len: 2,
    type: "IMMEDIATE",
    cycles: 2,
    microcode: function(view) {
      const acc = cpu.A;
      const byte = view[cpu.PC - 0x8000 + 1];
      let result = acc - byte - cpu.status.C;

      if (0 > result) {
        result += 0xff;
      }

      setA(result);

      // Do flag stuff
      /*
    N: Set if most significant bit of the result is set; cleared otherwise.
    Z: Set if all bits of the result are cleared; cleared otherwise.
    V: Set if there is two's complement overflow as a result of the operation;
    cleared otherwise.
    C: Carry is set if the absolute value of the contents of memory plus previous
    carry is larger than the absolute value of the accumulator; cleared otherwise.
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

      // 2s compliment overflow test
      // Get MSBs of the operands
      let oa = acc & 0x80;
      let ob = byte & 0x80;

      if (oa != ob) {
        setStatusFlag("V");
} else {
clearStatusFlag("V");
      }

      if (byte + cpu.status.C > acc) {
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
  0x83: {
    name: "subd",
    len: 3,
    type: "IMMEDIATE16",
    cycles: 4,
    microcode: function(view) {
      const firstByte = view[cpu.PC - 0x8000 + 1];
      const secondByte = view[cpu.PC - 0x8000 + 2];
      const word = (firstByte << 8) + secondByte;

      sub16(LOC.IMM, LOC.D, 0, word, FLAG.SUB);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x84: {
    name: "anda",
    len: 2,
    type: "IMMEDIATE",
    cycles: 2,
    microcode: function(view) {
      const acc = cpu.A;
      const byte = view[cpu.PC - 0x8000 + 1];
      const result = acc & byte;

      setA(result);

      // Do flag stuff
      /*
        N: Set if most significant bit of the result is set; cleared otherwise.
        Z: Set if all bits of the result are cleared; cleared otherwise.
        V: Cleared
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

      clearStatusFlag("V");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x85: {
    name: "bita",
    len: 2,
    type: "IMMEDIATE",
    cycles: 2,
    microcode: function(view) {
      const acc = cpu.A;
      const byte = view[cpu.PC - 0x8000 + 1];

      const result = acc & byte;

      // Do flag stuff
      /*
      N: Set if the most significant bit of the result of the AND is set; cleared otherwise.
      Z: Set if all bits of the result of the AND are cleared; cleared otherwise.
      V: Cleared.
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

      clearStatusFlag("V");

      //Clock
      advanceClock(this.cycles);

      //Next
      setPC(cpu.PC + this.len);
    }
  },
  0x86: {
    name: "ldaa",
    len: 2,
    type: "IMMEDIATE",
    cycles: 2,
    microcode: function(view) {
      const byte = view[cpu.PC - 0x8000 + 1];

      load8(LOC.IMM, LOC.A, 0, byte);

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
      const addr = view[cpu.PC - 0x8000 + 1];
      const bitMask = view[cpu.PC - 0x8000 + 2];
      const jmpOffset = view[cpu.PC - 0x8000 + 3];
      let mem = 0;

      if (RAMSize > addr) {
        mem = readRAM(addr);
      } else {
        mem = readROM(addr);
      }

      setPC(cpu.PC + this.len);

      branch(jmpOffset, mem & bitMask);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x88: {
    name: "eora",
    len: 2,
    type: "IMMEDIATE",
    cycles: 2,
    microcode: function(view) {
      const acc = cpu.A;
      const byte = view[cpu.PC - 0x8000 + 1];
      const result = acc ^ byte;

      setA(result);

      // Do flag stuff
      /*
        N: Set if most significant bit of the result is set; cleared otherwise.
        Z: Set if all bits of the result are cleared; cleared otherwise.
        V: Cleared.
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

      clearStatusFlag("V");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x89: {
    name: "adca",
    len: 2,
    type: "IMMEDIATE",
    cycles: 2,
    microcode: function(view) {
      const byte = view[cpu.PC - 0x8000 + 1];

      oper8(OPER.ADC, LOC.IMM, LOC.A, 0, byte, FLAG.ADD);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x8a: {
    name: "oraa",
    len: 2,
    type: "IMMEDIATE",
    cycles: 2,
    microcode: function(view) {
      const byte = view[cpu.PC - 0x8000 + 1];

      oper8(OPER.ORA, LOC.IMM, LOC.A, 0, byte, FLAG.LOAD);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x8b: {
    name: "adda",
    len: 2,
    type: "IMMEDIATE",
    cycles: 2,
    microcode: function(view) {
      const byte = view[cpu.PC - 0x8000 + 1];

      add8(LOC.IMM, LOC.A, 0, byte, FLAG.ADD);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x8c: {
    name: "cpx",
    len: 3,
    type: "IMMEDIATE16",
    cycles: 4,
    microcode: function(view) {
      const firstByte = view[cpu.PC - 0x8000 + 1];
      const secondByte = view[cpu.PC - 0x8000 + 2];
      const word = (firstByte << 8) + secondByte;

      cmp16(LOC.IMM, LOC.X, 0, word);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x8d: {
    name: "bsr",
    len: 2,
    type: "RELATIVE",
    cycles: 6,
    microcode: function(view) {
      const byte = view[cpu.PC - 0x8000 + 1];

      setPC(cpu.PC + this.len);

      const pcByte1 = cpu.PC >> 8;
      const pcByte2 = cpu.PC & 0xff;

      writeRAM(cpu.SP, pcByte1);
      setSP(cpu.SP - 1);

      writeRAM(cpu.SP, pcByte2);
      setSP(cpu.SP - 1);

      if (0b10000000 == (0b10000000 & byte)) {
        setPC(cpu.PC - ((byte ^ 0xff) + 0x1));
      } else {
        setPC(cpu.PC + byte);
      }

      subroutineChange(1, cpu.PC);

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
      const firstByte = view[cpu.PC - 0x8000 + 1];
      const secondByte = view[cpu.PC - 0x8000 + 2];
      const addr = (firstByte << 8) + secondByte;

      setSP(addr);

      // Do flag stuff
      /*
        N: Set if the most significant bit of the stack pointer is set by the operation; cleared otherwise.
        Set if all bits of the stack pointer are cleared by the operation; cleared otherwise.
        Z:
        V: Cleared.
      */
      if (0x8000 == (addr & 0x8000)) {
        setStatusFlag("N");
      } else {
        clearStatusFlag("N");
      }

      if (0 == addr) {
        setStatusFlag("Z");
      } else {
        clearStatusFlag("Z");
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
      const addr = view[cpu.PC - 0x8000 + 1];
      const bitMask = view[cpu.PC - 0x8000 + 2];
      const jmpOffset = view[cpu.PC - 0x8000 + 3];
      let mem = 0;

      if (RAMSize > addr) {
        mem = readRAM(addr);
      } else {
        mem = readROM(addr);
      }

      setPC(cpu.PC + this.len);

      branch(jmpOffset, 0 == (mem & bitMask));

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x90: {
    name: "suba",
    len: 2,
    type: "DIRECT",
    cycles: 3,
    microcode: function(view) {
      const addr = view[cpu.PC - 0x8000 + 1];

      sub8(LOC.MEM, LOC.A, addr, 0, FLAG.SUB);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x91: {
    name: "cmpa",
    len: 2,
    type: "DIRECT",
    cycles: 3,
    microcode: function(view) {
      const addr = view[cpu.PC - 0x8000 + 1];

      cmp8(LOC.MEM, LOC.A, addr, 0);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x92: {
    name: "sbca",
    len: 2,
    type: "DIRECT",
    cycles: 3,
    microcode: function(view) {
      const acc = cpu.A;
      const addr = view[cpu.PC - 0x8000 + 1];
      const mem = readRAM(addr);
      let result = acc - mem - cpu.status.C;

      if (0 > result) {
        result += 0xff;
      }

      setA(result);

      // Do flag stuff
      /*
        N: Set if most significant bit of the result is set; cleared otherwise.
        Z: Set if all bits of the result are cleared; cleared otherwise.
        V: Set if there is two's complement overflow as a result of the operation;
        cleared otherwise.
        C: Carry is set if the absolute value of the contents of memory plus previous
        carry is larger than the absolute value of the accumulator; cleared otherwise.
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

      // 2s compliment overflow test
      // Get MSBs of the operands
      let oa = acc & 0x8000;
      let ob = mem & 0x8000;

      if (oa != ob) {
        setStatusFlag("V");
} else {
clearStatusFlag("V");
      }

      if (mem + cpu.status.C > acc) {
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
  0x93: {
    name: "subd",
    len: 2,
    type: "DIRECT",
    cycles: 5,
    microcode: function(view) {
      const addr = view[cpu.PC - 0x8000 + 1];

      sub16(LOC.MEM, LOC.D, addr, 0, FLAG.SUB);

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
      const acc = cpu.A;
      const addr = view[cpu.PC - 0x8000 + 1];
      const mem = readRAM(addr);
      const result = acc & mem;

      setA(result);

      // Do flag stuff
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
      const addr = view[cpu.PC - 0x8000 + 1];

      load8(LOC.MEM, LOC.A, addr, 0);

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
      const addr = view[cpu.PC - 0x8000 + 1];

      store8(LOC.A, LOC.MEM, addr, 0);

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
      const addr = view[cpu.PC - 0x8000 + 1];

      oper8(OPER.EOR, LOC.MEM, LOC.A, addr, 0, FLAG.LOAD);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x99: { name: "adca", len: 2, type: "DIRECT", cycles: 0 },
  0x9a: {
    name: "oraa",
    len: 2,
    type: "DIRECT",
    cycles: 3,
    microcode: function(view) {
      const addr = view[cpu.PC - 0x8000 + 1];

      oper8(OPER.ORA, LOC.MEM, LOC.A, addr, 0, FLAG.LOAD);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x9b: {
    name: "adda",
    len: 2,
    type: "DIRECT",
    cycles: 3,
    microcode: function(view) {
      const addr = view[cpu.PC - 0x8000 + 1];

      add8(LOC.MEM, LOC.A, addr, 0, FLAG.ADD);

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
      const addr = view[cpu.PC - 0x8000 + 1];

      cmp16(LOC.MEM, LOC.X, addr, 0);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0x9d: {
    name: "jsr",
    len: 2,
    type: "DIRECT",
    cycles: 5,
    microcode: function(view) {
      const addr = view[cpu.PC - 0x8000 + 1];

      setPC(cpu.PC + this.len);

      const pcByte1 = cpu.PC >> 8;
      const pcByte2 = cpu.PC & 0xff;

      writeRAM(cpu.SP, pcByte1);
      setSP(cpu.SP - 1);

      writeRAM(cpu.SP, pcByte2);
      setSP(cpu.SP - 1);

      setPC(addr);

      //Clock
      advanceClock(this.cycles);

      subroutineChange(1, cpu.PC);
    }
  },
  0x9e: { name: "lds", len: 2, type: "DIRECT", cycles: 0 },
  0x9f: { name: "sts", len: 2, type: "DIRECT", cycles: 0 },
  0xa0: { name: "suba", len: 2, type: "INDEXED", hasSubops: true, cycles: 0 },
  0xa1: {
    name: "cmpa",
    len: 2,
    type: "INDEXED",
    hasSubops: true,
    cycles: 4,
    microcode: function(view) {
      const offset = view[cpu.PC - 0x8000 + 1];
      const addr = offset + cpu.X;

      cmp8(LOC.MEM, LOC.A, addr, 0);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xa2: { name: "sbca", len: 2, type: "INDEXED", hasSubops: true, cycles: 0 },
  0xa3: { name: "subd", len: 2, type: "INDEXED", hasSubops: true, cycles: 0 },
  0xa4: { name: "anda", len: 2, type: "INDEXED", hasSubops: true, cycles: 0 },
  0xa5: { name: "bita", len: 2, type: "INDEXED", hasSubops: true, cycles: 0 },
  0xa6: {
    name: "ldaa",
    len: 2,
    type: "INDEXED",
    hasSubops: true,
    cycles: 4,
    microcode: function(view) {
      const offset = view[cpu.PC - 0x8000 + 1];
      const addr = offset + cpu.X;

      load8(LOC.MEM, LOC.A, addr, 0);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xa7: {
    name: "staa",
    len: 2,
    type: "INDEXED",
    hasSubops: true,
    cycles: 4,
    microcode: function(view) {
      const offset = view[cpu.PC - 0x8000 + 1];
      const addr = offset + cpu.X;

      store8(LOC.A, LOC.MEM, addr, 0);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xa8: { name: "eora", len: 2, type: "INDEXED", hasSubops: true, cycles: 0 },
  0xa9: {
    name: "adca",
    len: 2,
    type: "INDEXED",
    hasSubops: true,
    cycles: 4,
    microcode: function(view) {
      const offset = view[cpu.PC - 0x8000 + 1];
      const addr = offset + cpu.X;

      oper8(OPER.ADC, LOC.MEM, LOC.A, addr, 0, FLAG.ADD);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xaa: {
    name: "oraa",
    len: 2,
    type: "INDEXED",
    hasSubops: true,
    cycles: 4,
    microcode: function(view) {
      const offset = view[cpu.PC - 0x8000 + 1];
      const addr = offset + cpu.X;

      oper8(OPER.ORA, LOC.MEM, LOC.A, addr, 0, FLAG.LOAD);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xab: {
    name: "adda",
    len: 2,
    type: "INDEXED",
    hasSubops: true,
    cycles: 4,
    microcode: function(view) {
      const offset = view[cpu.PC - 0x8000 + 1];
      const addr = offset + cpu.X;

      add8(LOC.MEM, LOC.A, addr, 0, FLAG.ADD);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xac: { name: "cpx", len: 2, type: "INDEXED", hasSubops: true, cycles: 0 },
  0xad: {
    name: "jsr",
    len: 2,
    type: "INDEXED",
    hasSubops: true,
    cycles: 6,
    microcode: function(view) {
      const offset = view[cpu.PC - 0x8000 + 1];
      const addr = offset + cpu.X;

      setPC(cpu.PC + this.len);

      let pcByte1 = cpu.PC >> 8;
      let pcByte2 = cpu.PC & 0xff;

      writeRAM(cpu.SP, pcByte1);
      setSP(cpu.SP - 1);

      writeRAM(cpu.SP, pcByte2);
      setSP(cpu.SP - 1);

      setPC(addr);

      //Clock
      advanceClock(this.cycles);

      subroutineChange(1, cpu.PC);
    }
  },
  0xae: { name: "lds", len: 2, type: "INDEXED", hasSubops: true, cycles: 0 },
  0xaf: { name: "sts", len: 2, type: "INDEXED", hasSubops: true, cycles: 0 },
  0xb0: {
    name: "suba",
    len: 3,
    type: "EXTENDED",
    cycles: 4,
    microcode: function(view) {
      const firstByte = view[cpu.PC - 0x8000 + 1];
      const secondByte = view[cpu.PC - 0x8000 + 2];
      const addr = (firstByte << 8) + secondByte;

      sub8(LOC.MEM, LOC.A, addr, 0, FLAG.SUB);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xb1: {
    name: "cmpa",
    len: 3,
    type: "EXTENDED",
    cycles: 4,
    microcode: function(view) {
      const firstByte = view[cpu.PC - 0x8000 + 1];
      const secondByte = view[cpu.PC - 0x8000 + 2];
      const addr = (firstByte << 8) + secondByte;

      cmp8(LOC.MEM, LOC.A, addr, 0);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
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
      const firstByte = view[cpu.PC - 0x8000 + 1];
      const secondByte = view[cpu.PC - 0x8000 + 2];
      const addr = (firstByte << 8) + secondByte;

      load8(LOC.MEM, LOC.A, addr, 0);

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
      const firstByte = view[cpu.PC - 0x8000 + 1];
      const secondByte = view[cpu.PC - 0x8000 + 2];
      const addr = (firstByte << 8) + secondByte;

      store8(LOC.A, LOC.MEM, addr, 0);

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
      const firstByte = view[cpu.PC - 0x8000 + 1];
      const secondByte = view[cpu.PC - 0x8000 + 2];
      const addr = (firstByte << 8) + secondByte;

      oper8(OPER.EOR, LOC.MEM, LOC.A, addr, 0, FLAG.LOAD);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xb9: { name: "adca", len: 3, type: "EXTENDED", cycles: 0 },
  0xba: { name: "oraa", len: 3, type: "EXTENDED", cycles: 0 },
  0xbb: {
    name: "adda",
    len: 3,
    type: "EXTENDED",
    cycles: 4,
    microcode: function(view) {
      const firstByte = view[cpu.PC - 0x8000 + 1];
      const secondByte = view[cpu.PC - 0x8000 + 2];
      const addr = (firstByte << 8) + secondByte;

      add8(LOC.MEM, LOC.A, addr, 0, FLAG.ADD);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xbc: { name: "cpx", len: 3, type: "EXTENDED", cycles: 0 },
  0xbd: {
    name: "jsr",
    len: 3,
    type: "EXTENDED",
    cycles: 6,
    microcode: function(view) {
      const firstByte = view[cpu.PC - 0x8000 + 1];
      const secondByte = view[cpu.PC - 0x8000 + 2];
      const addr = (firstByte << 8) + secondByte;

      setPC(cpu.PC + this.len);

      const pcByte1 = cpu.PC >> 8;
      const pcByte2 = cpu.PC & 0xff;

      writeRAM(cpu.SP, pcByte1);
      setSP(cpu.SP - 1);

      writeRAM(cpu.SP, pcByte2);
      setSP(cpu.SP - 1);

      setPC(addr);

      //Clock
      advanceClock(this.cycles);

      subroutineChange(1, cpu.PC);
    }
  },
  0xbe: { name: "lds", len: 3, type: "EXTENDED", cycles: 0 },
  0xbf: { name: "sts", len: 3, type: "EXTENDED", cycles: 0 },
  0xc0: {
    name: "subb",
    len: 2,
    type: "IMMEDIATE",
    cycles: 2,
    microcode: function(view) {
      const byte = view[cpu.PC - 0x8000 + 1];

      sub8(LOC.IMM, LOC.B, 0, byte, FLAG.SUB);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xc1: {
    name: "cmpb",
    len: 2,
    type: "IMMEDIATE",
    cycles: 2,
    microcode: function(view) {
      const byte = view[cpu.PC - 0x8000 + 1];

      cmp8(LOC.IMM, LOC.B, 0, byte);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xc2: {
    name: "sbcb",
    len: 2,
    type: "IMMEDIATE",
    cycles: 2,
    microcode: function(view) {
      const acc = cpu.B;
      const byte = view[cpu.PC - 0x8000 + 1];
      let result = acc - byte - cpu.status.C;

      if (0 > result) {
        result += 0xff;
      }

      setB(result);

      // Do flag stuff
      /*
        N: Set if most significant bit of the result is set; cleared otherwise.
        Z: Set if all bits of the result are cleared; cleared otherwise.
        V: Set if there is two's complement overflow as a result of the operation;
        cleared otherwise.
        C: Carry is set if the absolute value of the contents of memory plus previous
        carry is larger than the absolute value of the accumulator; cleared otherwise.
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

      // 2s compliment overflow test
      // Get MSBs of the operands
      let oa = acc & 0x80;
      let ob = byte & 0x80;

      if (oa != ob) {
        setStatusFlag("V");
} else {
clearStatusFlag("V");
      }

      if (byte + cpu.status.C > acc) {
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
  0xc3: {
    name: "addd",
    len: 3,
    type: "IMMEDIATE16",
    cycles: 4,
    microcode: function(view) {
      const firstByte = view[cpu.PC - 0x8000 + 1];
      const secondByte = view[cpu.PC - 0x8000 + 2];
      const word = (firstByte << 8) + secondByte;

      add16(LOC.IMM, LOC.D, 0, word, FLAG.ADD);

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
      const acc = cpu.B;
      const value = view[cpu.PC - 0x8000 + 1];
      const result = acc & value;

      setB(result);

      // Do flag stuff
      /*
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

      clearStatusFlag("V");

      //Clock
      advanceClock(this.cycles);

      //Next
      setPC(cpu.PC + this.len);
    }
  },
  0xc5: {
    name: "bitb",
    len: 2,
    type: "IMMEDIATE",
    cycles: 2,
    microcode: function(view) {
      const acc = cpu.B;
      const value = view[cpu.PC - 0x8000 + 1];
      const result = acc & value;

      // Do flag stuff
      /*
        N: Set if the most significant bit of the result of the AND is set; cleared otherwise.
        Z: Set if all bits of the result of the AND are cleared; cleared otherwise.
        V: Cleared.
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

      clearStatusFlag("V");

      //Clock
      advanceClock(this.cycles);

      //Next
      setPC(cpu.PC + this.len);
    }
  },
  0xc6: {
    name: "ldab",
    len: 2,
    type: "IMMEDIATE",
    cycles: 2,
    microcode: function(view) {
      const byte = view[cpu.PC - 0x8000 + 1];

      load8(LOC.IMM, LOC.B, 0, byte);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xc7: { name: "brset", len: 4, type: "INDEXED", cycles: 0 },
  0xc8: {
    name: "eorb",
    len: 2,
    type: "IMMEDIATE",
    cycles: 2,
    microcode: function(view) {
      const acc = cpu.B;
      const byte = view[cpu.PC - 0x8000 + 1];
      const result = acc ^ byte;

      setB(result);

      // Do flag stuff
      /*
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

      clearStatusFlag("V");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xc9: {
    name: "adcb",
    len: 2,
    type: "IMMEDIATE",
    cycles: 2,
    microcode: function(view) {
      const byte = view[cpu.PC - 0x8000 + 1];

      oper8(OPER.ADC, LOC.IMM, LOC.B, 0, byte, FLAG.ADD);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xca: {
    name: "orab",
    len: 2,
    type: "IMMEDIATE",
    cycles: 2,
    microcode: function(view) {
      const byte = view[cpu.PC - 0x8000 + 1];

      oper8(OPER.ORA, LOC.IMM, LOC.B, 0, byte, FLAG.LOAD);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xcb: {
    name: "addb",
    len: 2,
    type: "IMMEDIATE",
    cycles: 2,
    microcode: function(view) {
      const byte = view[cpu.PC - 0x8000 + 1];

      add8(LOC.IMM, LOC.B, 0, byte, FLAG.ADD);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xcc: {
    name: "ldd",
    len: 3,
    type: "IMMEDIATE16",
    cycles: 3,
    microcode: function(view) {
      const firstByte = view[cpu.PC - 0x8000 + 1];
      const secondByte = view[cpu.PC - 0x8000 + 2];
      const word = (firstByte << 8) + secondByte;

      load16(LOC.IMM, LOC.D, 0, word);

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
      const firstByte = view[cpu.PC - 0x8000 + 1];
      const secondByte = view[cpu.PC - 0x8000 + 2];
      const word = (firstByte << 8) + secondByte;

      load16(LOC.IMM, LOC.X, 0, word);

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
      const offset = view[cpu.PC - 0x8000 + 1];
      const bitMask = view[cpu.PC - 0x8000 + 2];
      const jmpOffset = view[cpu.PC - 0x8000 + 3];
      const addr = offset + cpu.X;
      let mem = 0;

      if (RAMSize > addr) {
        mem = readRAM(addr);
      } else {
        mem = readROM(addr);
      }

      setPC(cpu.PC + this.len);

      branch(jmpOffset, 0 == (mem & bitMask));

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xd0: {
    name: "subb",
    len: 2,
    type: "DIRECT",
    cycles: 3,
    microcode: function(view) {
      const addr = view[cpu.PC - 0x8000 + 1];

      sub8(LOC.MEM, LOC.B, addr, 0, FLAG.SUB);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xd1: {
    name: "cmpb",
    len: 2,
    type: "DIRECT",
    cycles: 3,
    microcode: function(view) {
      const addr = view[cpu.PC - 0x8000 + 1];

      cmp8(LOC.MEM, LOC.B, addr, 0);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xd2: {
    name: "sbcb",
    len: 2,
    type: "DIRECT",
    cycles: 3,
    microcode: function(view) {
      const acc = cpu.B;
      const addr = view[cpu.PC - 0x8000 + 1];
      const mem = readRAM(addr);
      let result = acc - mem - cpu.status.C;

      if (0 > result) {
        result += 0xff;
      }

      setB(result);

      // Do flag stuff
      /*
        N: Set if most significant bit of the result is set; cleared otherwise.
        Z: Set if all bits of the result are cleared; cleared otherwise.
        V: Set if there is two's complement overflow as a result of the operation;
        cleared otherwise.
        C: Carry is set if the absolute value of the contents of memory plus previous
        carry is larger than the absolute value of the accumulator; cleared otherwise.
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

      // 2s compliment overflow test
      // Get MSBs of the operands
      let oa = acc & 0x8000;
      let ob = mem & 0x8000;

      if (oa != ob) {
        setStatusFlag("V");
} else {
clearStatusFlag("V");
      }

      if (mem + cpu.status.C > acc) {
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
  0xd3: {
    name: "addd",
    len: 2,
    type: "DIRECT",
    cycles: 5,
    microcode: function(view) {
      const addr = view[cpu.PC - 0x8000 + 1];

      add16(LOC.MEM, LOC.D, addr, 0, FLAG.ADD);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xd4: {
    name: "andb",
    len: 2,
    type: "DIRECT",
    cycles: 3,
    microcode: function(view) {
      const acc = cpu.B;
      const addr = view[cpu.PC - 0x8000 + 1];
      const mem = readRAM(addr);
      const result = acc & mem;

      setB(result);

      // Do flag stuff
      /*
        N: Set if most significant bit of the result is set; cleared otherwise.
        Z: Set if all bits of the result are cleared; cleared otherwise.
        V: Cleared
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

      clearStatusFlag("V");

      //Clock
      advanceClock(this.cycles);

      //Next
      setPC(cpu.PC + this.len);
    }
  },
  0xd5: { name: "bitb", len: 2, type: "DIRECT", cycles: 0 },
  0xd6: {
    name: "ldab",
    len: 2,
    type: "DIRECT",
    cycles: 3,
    microcode: function(view) {
      const addr = view[cpu.PC - 0x8000 + 1];

      load8(LOC.MEM, LOC.B, addr, 0);
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
      const addr = view[cpu.PC - 0x8000 + 1];

      store8(LOC.B, LOC.MEM, addr, 0);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xd8: {
    name: "eorb",
    len: 2,
    type: "DIRECT",
    cycles: 3,
    microcode: function(view) {
      const acc = cpu.B;
      const addr = view[cpu.PC - 0x8000 + 1];
      const mem = readRAM(addr);
      const result = acc ^ mem;

      setB(result);

      // Do flag stuff
      /*
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

      clearStatusFlag("V");

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xd9: { name: "adcb", len: 2, type: "DIRECT", cycles: 0 },
  0xda: { name: "orab", len: 2, type: "DIRECT", cycles: 0 },
  0xdb: {
    name: "addb",
    len: 2,
    type: "DIRECT",
    cycles: 3,
    microcode: function(view) {
      const addr = view[cpu.PC - 0x8000 + 1];

      add8(LOC.MEM, LOC.B, addr, 0, FLAG.ADD);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xdc: {
    name: "ldd",
    len: 2,
    type: "DIRECT",
    cycles: 4,
    microcode: function(view) {
      const addr = view[cpu.PC - 0x8000 + 1];

      load16(LOC.MEM, LOC.D, addr, 0);

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
      const addr = view[cpu.PC - 0x8000 + 1];

      store16(LOC.D, LOC.MEM, addr, 0);

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
      const addr = view[cpu.PC - 0x8000 + 1];

      load16(LOC.MEM, LOC.X, addr, 0);

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
      const addr = view[cpu.PC - 0x8000 + 1];

      store16(LOC.X, LOC.MEM, addr, 0);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xe0: {
    name: "subb",
    len: 2,
    type: "INDEXED",
    hasSubops: true,
    cycles: 4,
    microcode: function(view) {
      const offset = view[cpu.PC - 0x8000 + 1];
      const addr = offset + cpu.X;

      sub8(LOC.MEM, LOC.B, addr, 0, FLAG.SUB);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xe1: {
    name: "cmpb",
    len: 2,
    type: "INDEXED",
    hasSubops: true,
    cycles: 4,
    microcode: function(view) {
      const offset = view[cpu.PC - 0x8000 + 1];
      const addr = offset + cpu.X;

      cmp8(LOC.MEM, LOC.B, addr, 0);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xe2: { name: "sbcb", len: 2, type: "INDEXED", hasSubops: true, cycles: 0 },
  0xe3: { name: "addd", len: 2, type: "INDEXED", hasSubops: true, cycles: 0 },
  0xe4: { name: "andb", len: 2, type: "INDEXED", hasSubops: true, cycles: 0 },
  0xe5: { name: "bitb", len: 2, type: "INDEXED", hasSubops: true, cycles: 0 },
  0xe6: {
    name: "ldab",
    len: 2,
    type: "INDEXED",
    hasSubops: true,
    cycles: 4,
    microcode: function(view) {
      const offset = view[cpu.PC - 0x8000 + 1];
      const addr = offset + cpu.X;

      load8(LOC.MEM, LOC.B, addr, 0);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xe7: {
    name: "stab",
    len: 2,
    type: "INDEXED",
    hasSubops: true,
    cycles: 4,
    microcode: function(view) {
      const offset = view[cpu.PC - 0x8000 + 1];
      const addr = offset + cpu.X;

      store8(LOC.B, LOC.MEM, addr, 0);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xe8: { name: "eorb", len: 2, type: "INDEXED", hasSubops: true, cycles: 0 },
  0xe9: {
    name: "adcb",
    len: 2,
    type: "INDEXED",
    hasSubops: true,
    cycles: 4,
    microcode: function(view) {
      const offset = view[cpu.PC - 0x8000 + 1];
      const addr = offset + cpu.X;

      oper8(OPER.ADC, LOC.MEM, LOC.B, addr, 0, FLAG.ADD);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xea: { name: "orab", len: 2, type: "INDEXED", hasSubops: true, cycles: 0 },
  0xeb: {
    name: "addb",
    len: 2,
    type: "INDEXED",
    hasSubops: true,
    cycles: 4,
    microcode: function(view) {
      const offset = view[cpu.PC - 0x8000 + 1];
      const addr = offset + cpu.X;

      add8(LOC.MEM, LOC.B, addr, 0, FLAG.ADD);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xec: {
    name: "ldd",
    len: 2,
    type: "INDEXED",
    hasSubops: true,
    cycles: 5,
    microcode: function(view) {
      const offset = view[cpu.PC - 0x8000 + 1];
      const addr = offset + cpu.X;

      load16(LOC.MEM, LOC.D, addr, 0);

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
    hasSubops: true,
    cycles: 5,
    microcode: function(view) {
      const offset = view[cpu.PC - 0x8000 + 1];
      const addr = offset + cpu.X;

      store16(LOC.D, LOC.MEM, addr, 0);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xee: {
    name: "ldx",
    len: 2,
    type: "INDEXED",
    hasSubops: true,
    cycles: 5,
    microcode: function(view) {
      const offset = view[cpu.PC - 0x8000 + 1];
      const addr = offset + cpu.X;

      load16(LOC.MEM, LOC.X, addr, 0);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xef: { name: "stx", len: 2, type: "INDEXED", hasSubops: true, cycles: 0 },
  0xf0: { name: "subb", len: 3, type: "EXTENDED", cycles: 0 },
  0xf1: {
    name: "cmpb",
    len: 3,
    type: "EXTENDED",
    cycles: 4,
    microcode: function(view) {
      const firstByte = view[cpu.PC - 0x8000 + 1];
      const secondByte = view[cpu.PC - 0x8000 + 2];
      let addr = (firstByte << 8) + secondByte;

      cmp8(LOC.MEM, LOC.B, addr, 0);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xf2: { name: "sbcb", len: 3, type: "EXTENDED", cycles: 0 },
  0xf3: {
    name: "addd",
    len: 3,
    type: "EXTENDED",
    cycles: 6,
    microcode: function(view) {
      const firstByte = view[cpu.PC - 0x8000 + 1];
      const secondByte = view[cpu.PC - 0x8000 + 2];
      const addr = (firstByte << 8) + secondByte;

      add16(LOC.MEM, LOC.D, addr, 0, FLAG.ADD);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xf4: { name: "andb", len: 3, type: "EXTENDED", cycles: 0 },
  0xf5: { name: "bitb", len: 3, type: "EXTENDED", cycles: 0 },
  0xf6: {
    name: "ldab",
    len: 3,
    type: "EXTENDED",
    cycles: 4,
    microcode: function(view) {
      const firstByte = view[cpu.PC - 0x8000 + 1];
      const secondByte = view[cpu.PC - 0x8000 + 2];
      const addr = (firstByte << 8) + secondByte;

      load8(LOC.MEM, LOC.B, addr, 0);

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
      const firstByte = view[cpu.PC - 0x8000 + 1];
      const secondByte = view[cpu.PC - 0x8000 + 2];
      const addr = (firstByte << 8) + secondByte;

      store8(LOC.B, LOC.MEM, addr, 0);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xf8: { name: "eorb", len: 3, type: "EXTENDED", cycles: 0 },
  0xf9: { name: "adcb", len: 3, type: "EXTENDED", cycles: 0 },
  0xfa: { name: "orab", len: 3, type: "EXTENDED", cycles: 0 },
  0xfb: {
    name: "addb",
    len: 3,
    type: "EXTENDED",
    cycles: 4,
    microcode: function(view) {
      const firstByte = view[cpu.PC - 0x8000 + 1];
      const secondByte = view[cpu.PC - 0x8000 + 2];
      const addr = (firstByte << 8) + secondByte;

      add8(LOC.MEM, LOC.B, addr, 0, FLAG.ADD);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xfc: {
    name: "ldd",
    len: 3,
    type: "EXTENDED",
    cycles: 5,
    microcode: function(view) {
      const firstByte = view[cpu.PC - 0x8000 + 1];
      const secondByte = view[cpu.PC - 0x8000 + 2];
      const addr = (firstByte << 8) + secondByte;

      load16(LOC.MEM, LOC.D, addr, 0);

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
      const firstByte = view[cpu.PC - 0x8000 + 1];
      const secondByte = view[cpu.PC - 0x8000 + 2];
      const addr = (firstByte << 8) + secondByte;

      store16(LOC.D, LOC.MEM, addr, 0);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xfe: {
    name: "ldx",
    len: 3,
    type: "EXTENDED",
    cycles: 5,
    microcode: function(view) {
      const firstByte = view[cpu.PC - 0x8000 + 1];
      const secondByte = view[cpu.PC - 0x8000 + 2];
      const addr = (firstByte << 8) + secondByte;

      load16(LOC.MEM, LOC.X, addr, 0);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  },
  0xff: {
    name: "stx",
    len: 3,
    type: "EXTENDED",
    cycles: 5,
    microcode: function(view) {
      const firstByte = view[cpu.PC - 0x8000 + 1];
      const secondByte = view[cpu.PC - 0x8000 + 2];
      const addr = (firstByte << 8) + secondByte;

      store16(LOC.X, LOC.MEM, addr, 0);

      //Next
      setPC(cpu.PC + this.len);

      //Clock
      advanceClock(this.cycles);
    }
  }
};

let subOps = {
  0xcd: {
    0x08: {
      name: "iny",
      len: 2,
      type: "IMPLIED",
      cycles: 4,
      microcode: function(view) {
        add16(LOC.IMM, LOC.Y, 0, 1, FLAG.INX);

        //Next
        setPC(cpu.PC + this.len);

        //Clock
        advanceClock(this.cycles);
      }
    },
    0x09: {
      name: "dey",
      len: 2,
      type: "IMPLIED",
      cycles: 4,
      microcode: function(view) {
        sub16(LOC.IMM, LOC.Y, 0, 1, FLAG.DEX);

        //Next
        setPC(cpu.PC + this.len);

        //Clock
        advanceClock(this.cycles);
      }
    },
    0x1a: {
      name: "xgdy",
      len: 2,
      type: "IMPLIED",
      cycles: 1,
      microcode: function(view) {
        const acc = cpu.D;
        const index = cpu.Y;

        setD(index);
        setY(acc);

        // Do flag stuff
        /*
          None affected
        */

        //Next
        setPC(cpu.PC + this.len);

        //Clock
        advanceClock(this.cycles);
      }
    },
    0x3a: {
      name: "aby",
      len: 2,
      type: "IMPLIED",
      cycles: 3,
      microcode: function(view) {
        add16(LOC.IMM, LOC.Y, 0, cpu.B, FLAG.NONE);

        //Next
        setPC(cpu.PC + this.len);

        //Clock
        advanceClock(this.cycles);
      }
    },
    0x8c: {
      name: "cpy",
      len: 4,
      type: "IMMEDIATE16",
      cycles: 1,
      microcode: function(view) {
        const firstByte = view[cpu.PC - 0x8000 + 2];
        const secondByte = view[cpu.PC - 0x8000 + 3];
        const word = (firstByte << 8) + secondByte;

        cmp16(LOC.IMM, LOC.Y, 0, word);

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
        const firstByte = view[cpu.PC - 0x8000 + 2];
        const secondByte = view[cpu.PC - 0x8000 + 3];
        const word = (firstByte << 8) + secondByte;

        load16(LOC.IMM, LOC.Y, 0, word);

        //Next
        setPC(cpu.PC + this.len);

        //Clock
        advanceClock(this.cycles);
      }
    },
    0xdf: {
      name: "sty",
      len: 3,
      type: "DIRECT",
      cycles: 5,
      microcode: function(view) {
        const addr = view[cpu.PC - 0x8000 + 2];

        store16(LOC.Y, LOC.MEM, addr, 0);

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
      cycles: 1,
      microcode: function(view) {
        const addr = view[cpu.PC - 0x8000 + 1];

        load16(LOC.MEM, LOC.X, addr, 0);

        //Next
        setPC(cpu.PC + this.len);

        //Clock
        advanceClock(this.cycles);
      }
    },
    0xee: {
      name: "ldy",
      len: 3,
      type: "INDEXED",
      cycles: 5,
      microcode: function(view) {
        const offset = view[cpu.PC - 0x8000 + 2];
        const addr = offset + cpu.X;

        load16(LOC.MEM, LOC.Y, addr, 0);

        //Next
        setPC(cpu.PC + this.len);

        //Clock
        advanceClock(this.cycles);
      }
    },
    0xef: { name: "stx", len: 2, type: "INDEXEDY", cycles: 1 },
    0xfe: { name: "nop", len: 2, type: "INDEXEDY", cycles: 1 }
  },
  0xa0: {
    0x80: {
      name: "suba",
      len: 2,
      type: "INDEXEDY",
      cycles: 4,
      microcode: function(view) {
        sub8(LOC.MEM, LOC.A, cpu.Y, 0, FLAG.SUB);

        incY(1);

        //Next
        setPC(cpu.PC + this.len);

        //Clock
        advanceClock(this.cycles);
      }
    }
  },
  0xa1: {
    0x80: {
      name: "cmpa",
      len: 2,
      type: "INDEXEDY",
      cycles: 4,
      microcode: function(view) {
        cmp8(LOC.MEM, LOC.A, cpu.Y, 0);

        //incY(1);

        //Next
        setPC(cpu.PC + this.len);

        //Clock
        advanceClock(this.cycles);
      }
    }
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
    0x80: {
      name: "ldaa",
      len: 2,
      type: "INDEXEDY",
      cycles: 4,
      microcode: function(view) {
        load8(LOC.MEM, LOC.A, cpu.Y, 0);

        incY(1);

        //Next
        setPC(cpu.PC + this.len);

        //Clock
        advanceClock(this.cycles);
      }
    }
  },
  0xa7: {
    0x80: {
      name: "staa",
      len: 2,
      type: "INDEXEDY",
      cycles: 1,
      microcode: function(view) {
        store8(LOC.A, LOC.MEM, cpu.Y, 0);

        //Next
        setPC(cpu.PC + this.len);

        //Clock
        advanceClock(this.cycles);
      }
    }
  },
  0xa8: {
    0x80: { name: "eora", len: 2, type: "INDEXEDY", cycles: 1 }
  },
  0xa9: {
    0x80: {
      name: "adca",
      len: 2,
      type: "INDEXEDY",
      cycles: 1,
      microcode: function(view) {
        oper8(OPER.ADC, LOC.MEM, LOC.B, cpu.Y, 0, FLAG.ADD);

        incY(1);

        //Next
        setPC(cpu.PC + this.len);

        //Clock
        advanceClock(this.cycles);
      }
    }
  },
  0xaa: {
    0x80: { name: "oraa", len: 2, type: "INDEXEDY", cycles: 1 }
  },
  0xab: {
    0x80: {
      name: "adda",
      len: 2,
      type: "INDEXEDY",
      cycles: 1,
      microcode: function(view) {
        add8(LOC.MEM, LOC.A, cpu.Y, 0, FLAG.ADD);

        incY(1);

        //Next
        setPC(cpu.PC + this.len);

        //Clock
        advanceClock(this.cycles);
      }
    }
  },
  0xac: {
    0x80: { name: "cpx", len: 2, type: "INDEXEDY", cycles: 1 }
  },
  0xad: {
    0x80: {
      name: "jsr",
      len: 2,
      type: "INDEXEDY",
      cycles: 1,
      microcode: function(view) {
        const addr = cpu.Y;

        setPC(cpu.PC + this.len);

        const pcByte1 = cpu.PC >> 8;
        const pcByte2 = cpu.PC & 0xff;

        writeRAM(cpu.SP, pcByte1);
        setSP(cpu.SP - 1);

        writeRAM(cpu.SP, pcByte2);
        setSP(cpu.SP - 1);

        setPC(addr);

        //Clock
        advanceClock(this.cycles);

        subroutineChange(1, cpu.PC);
      }
    }
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
    0x80: {
      name: "cmpb",
      len: 2,
      type: "INDEXEDY",
      cycles: 4,
      microcode: function(view) {
        cmp8(LOC.MEM, LOC.B, cpu.Y, 0);

        incY(1);

        //Next
        setPC(cpu.PC + this.len);

        //Clock
        advanceClock(this.cycles);
      }
    }
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
        store8(LOC.B, LOC.MEM, cpu.Y, 0);

        incY(1);

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
    0x80: {
      name: "adcb",
      len: 2,
      type: "INDEXEDY",
      cycles: 1,
      microcode: function(view) {
        oper8(OPER.ADC, LOC.MEM, LOC.B, cpu.Y, 0, FLAG.ADD);

        incY(1);

        //Next
        setPC(cpu.PC + this.len);

        //Clock
        advanceClock(this.cycles);
      }
    }
  },
  0xea: {
    0x80: { name: "orab", len: 2, type: "INDEXEDY", cycles: 1 }
  },
  0xeb: {
    0x80: {
      name: "addb",
      len: 2,
      type: "INDEXEDY",
      cycles: 1,
      microcode: function(view) {
        add8(LOC.MEM, LOC.B, cpu.Y, 0, FLAG.ADD);

        incY(1);

        //Next
        setPC(cpu.PC + this.len);

        //Clock
        advanceClock(this.cycles);
      }
    }
  },
  0xec: {
    0x80: { name: "ldd", len: 2, type: "INDEXEDY", cycles: 1 }
  },
  0xed: {
    0x80: {
      name: "std",
      len: 2,
      type: "INDEXEDY",
      cycles: 5,
      microcode: function(view) {
        store16(LOC.D, LOC.MEM, cpu.Y, 0);

        incY(2);

        //Next
        setPC(cpu.PC + this.len);

        //Clock
        advanceClock(this.cycles);
      }
    }
  },
  0xee: {
    0x80: {
      name: "ldx",
      len: 2,
      type: "INDEXEDY",
      cycles: 5,
      microcode: function(view) {
        load16(LOC.MEM, LOC.X, cpu.Y, 0);

        incY(2);

        //Next
        setPC(cpu.PC + this.len);

        //Clock
        advanceClock(this.cycles);
      }
    }
  },
  0xef: {
    0x80: { name: "stx", len: 2, type: "INDEXEDY", cycles: 1 }
  }
};

function subroutineChange(dir, addr) {
  let string = "Moving ";
  if (dir > 0) {
    subroutineLevel++;
    string += "into";
  } else {
    subroutineLevel--;
    string += "out of";
  }

  string += " subroutine: " + cleanHexify(addr, 4);

  //console.log(string);
}
