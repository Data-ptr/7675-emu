let rtiFreq = 0;
let lastRtiT = 0;

function getRtiClockSpeed() {
  let ret = 0;
  const rtiReg = readRAM(0x27, 1);
  //F=125000/(256-x)
  const freq = 125000 / (256 - rtiReg);
  ret = freq;

  return ret;
}

function workRti(t) {
  if(0 == rtiFreq) {
    rtiFreq = getRtiClockSpeed();
  }

  if(t % rtiFreq == 0) {

    console.log("Stacking real-time interrupt!");

    interruptStack.push(vectors.rti);
  }
}
