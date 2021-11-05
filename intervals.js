let stepsPerInterval = 1;

let intervalStepT   = 0; // Step interval
const uiUpdateT     = 50;
const clockUpdateT  = 500;

let stepInterval        = -1;
let clockUpdateInterval = -1;
let chartCelInterval    = -1;
let engineUiInterval    = -1;
let tdcCasChartInterval = -1;

function startIntervalStep(t) {
  stepInterval = setInterval(
    function() {
      if(updateBatchOutput) {
        let start = new Date().getTime();

        for(let i = 0; i < stepsPerInterval; i++) {
          step();
        }

        let end = new Date().getTime();

        let x = end - start;

        if(x > intervalStepT + (intervalStepT / 2)) {
          stepsPerInterval -= Math.ceil((x - intervalStepT) / 2);
        } else if(x < intervalStepT - (intervalStepT / 2)) {
          stepsPerInterval += Math.ceil((intervalStepT - x) / 2);
        }

        if(stepsPerInterval < 0) {
          stepsPerInterval = 1;
        }
      } else {
        step();
      }
    }, t);
}

function startIntervalClock(t) {
  clockUpdateInterval = setInterval(
    function(){
      let cycles = cpu.clock.cycleCount;
      let now = new Date().getTime();
      let simTimeNow = (1 / (cpu.clockSpeed * MHZ)) * cpu.clock.cycleCount;
      let rtcNow = rtcStash + ((now - rtcStart) / 1000);
      let realSpeed = (cycles - cyclesLast) / ((now-timeLast) * 1000);

      cyclesLast = cycles;
      timeLast = now;

      elementCache.clockCyclesOutput.val(cycles);
      elementCache.simTimeOutput.val(simTimeNow);
      elementCache.realSpeedOutput.val(realSpeed);
      elementCache.realTimeOutput.val(rtcNow);
    }, t);
}

function startIntervalEngineUi(t) {
  engineUiInterval = setInterval(
    function() {
      updateEngineUI();
      //updateEngine(engineT+=0.5);
    }, t);
}

function startIntervalCelChart(t) {
  if(updateCelChart) {
    celChartUpdate(dataLength);

    chartCelInterval = setInterval(celChartUpdate, t);
  }
}

function startIntervalTdcCasChart(t) {
  tdcCasChartInterval = setInterval(
    function() {
      while(m_4G63.TDC_list.length > 50) {
        m_4G63.TDC_list.shift();
      }

      while(m_4G63.CAS_list.length > 50) {
        m_4G63.CAS_list.shift();
      }

      tdcChart.updateSeries([
        {
          data: m_4G63.TDC_list
        },
        {
          data: m_4G63.CAS_list
        }
      ]);
    }, t);
}
