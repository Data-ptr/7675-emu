const crankDegMax = 720;
const secondsPerMinute = 60;
const cylinderState = {
  COMPRESSION: "compression",
  INTAKE: "intake",
  EXHAUST: "exhaust",
  COMBUSTION: "combustion"
};

let engineT = 0;

let guage;
let crankGauge;
let tdcChart;

let m_4G63 = {
  crankAngle: 0,            // [Degrees] out of 720°
  RPM: 5000,                 // [Revolutions] {700 = idle}
  totalDisplacement: 1997,  // [cc/cm^3]
  connectingRodLen: 150,    // [mm]
  bore: 85,         // [mm]
  stroke: 88,       // [mm]
  TDC: true,
  CAS: true,
  TDC_list: [-1, 0, 1, 2],
  CAS_list: [-1, 0, 1, 2],
  cylinders: {
    comprssion: 7.8,  // [mm] 7.8, 9.0, 9.8, 10.4
    each: [
      {
        name: 1,
        state: cylinderState.COMPRESSION,   // cylinderState
        pressure: 0,        // Pascal (N/m^2),
        y: 88               // [88] (TDC) Distance from deck surface
      },
      {
        name: 2,
        state: cylinderState.COMBUSTION,   // cylinderState
        pressure: 0,        // Pascal (N/m^2)
        y: 00,              // [mm] (TDB) Distance from deck surface
      },
      {
        name: 3,
        state: cylinderState.INTAKE,   // cylinderState
        pressure: -10,        // Pascal (N/m^2)
        y: 00,              // [mm] (TDB) Distance from deck surface
      },
      {
        name: 4,
        state: cylinderState.EXHAUST,   // cylinderState
        pressure: 0,        // Pascal (N/m^2)
        y: 88,               // [mm] (TDC) Distance from deck surface
      }
    ]
  }
};

function degreesPerMillisecond() {
  const rps = m_4G63.RPM / secondsPerMinute;
  const dps = rps * crankDegMax; // Degrees per second
  const degPerMs = dps / 1000;

  return degPerMs;
}

function updateEngine(t) {
  const time = Math.floor(t);
  const totalDegs = time * degreesPerMillisecond();
  let rotPos = totalDegs;


  if(rotPos > crankDegMax) {
    rotPos = totalDegs % crankDegMax;
  }

  m_4G63.crankAngle = rotPos;

  updatePistons(rotPos);

  //figure out state
  if(rotPos > 0 && rotPos < 180) { // NO.1 TDC
    if(rotPos <= 55) {
      m_4G63.TDC= true;
    } else {
      m_4G63.TDC = false;
    }

    if(rotPos > 180 - 75 && rotPos < 180 - 5) {
      m_4G63.CAS = true;
    } else {
      m_4G63.CAS = false;
    }

    m_4G63.cylinders.each[0].state = cylinderState.INTAKE;
    m_4G63.cylinders.each[2].state = cylinderState.EXHAUST;
    m_4G63.cylinders.each[3].state = cylinderState.COMBUSTION;
    m_4G63.cylinders.each[1].state = cylinderState.COMPRESSION;

  }

  if(rotPos > 180 && rotPos < 360) {
    if(rotPos > 360 - 85 && rotPos < 360 - 15) {
      m_4G63.TDC = true;
    } else {
      m_4G63.TDC = false;
    }

    if(rotPos > 360 - 75 && rotPos < 360 - 5) {
      m_4G63.CAS = true;
    } else {
      m_4G63.CAS = false;
    }

    m_4G63.cylinders.each[0].state = cylinderState.COMPRESSION;
    m_4G63.cylinders.each[2].state = cylinderState.INTAKE;
    m_4G63.cylinders.each[3].state = cylinderState.EXHAUST;
    m_4G63.cylinders.each[1].state = cylinderState.COMBUSTION;
  }

  if(rotPos > 360 && rotPos < 540) {
    if(rotPos > 540 - 75 && rotPos < 540 - 5) {
      m_4G63.CAS = true;
    } else {
      m_4G63.CAS = false;
    }

    m_4G63.cylinders.each[0].state = cylinderState.COMBUSTION;
    m_4G63.cylinders.each[2].state = cylinderState.COMPRESSION;
    m_4G63.cylinders.each[3].state = cylinderState.INTAKE;
    m_4G63.cylinders.each[1].state = cylinderState.EXHAUST;
  }

  if(rotPos > 540 && rotPos < 720) {
    if(rotPos >= 720 - 85) {
      m_4G63.TDC = true;
    } else {
      m_4G63.TDC = false;
    }

    if(rotPos > 720 - 75 && rotPos < 720 - 5) {
      m_4G63.CAS = true;
    } else {
      m_4G63.CAS = false;
    }

    m_4G63.cylinders.each[0].state = cylinderState.EXHAUST;
    m_4G63.cylinders.each[2].state = cylinderState.COMBUSTION;
    m_4G63.cylinders.each[3].state = cylinderState.COMPRESSION;
    m_4G63.cylinders.each[1].state = cylinderState.INTAKE;
  } // No.1 TDC
}

function updatePistons(rotPos) {
  const crankQuart = crankDegMax / 4;

  let rotAC = true; // Else rotBD
  let rotNum = 0;

  if(rotPos < crankQuart ||
    (rotPos > crankQuart * 2 && rotPos < crankQuart * 3)) {
    rotAC = true;
  } else {
    rotAC = false;
  }

  if(rotPos < crankDegMax / 2) {
    rotNum = 0;
  } else {
    rotNum = 1;
  }

  if(rotAC) {
    // 1 & 4 rotate down
    const rotPct = rotNum ? crankQuart / (rotPos - crankQuart * 2) : crankQuart / rotPos; // Rotation percent
    const strokePos = m_4G63.stroke / rotPct;
    m_4G63.cylinders.each[0].y = strokePos;
    m_4G63.cylinders.each[3].y = strokePos;
    m_4G63.cylinders.each[1].y = (m_4G63.stroke) - strokePos;
    m_4G63.cylinders.each[2].y = (m_4G63.stroke) - strokePos;
    // 2 & 3 rotate up
  } else {                        // Second half of rotation
    // 1 & 4 rotate up
    const rotPct =  rotNum ? crankQuart / (rotPos - crankQuart * 3) : crankQuart / (rotPos - crankQuart); // Rotation percent
    const strokePos = m_4G63.stroke / rotPct;
    m_4G63.cylinders.each[0].y = (m_4G63.stroke) - strokePos;
    m_4G63.cylinders.each[3].y = (m_4G63.stroke) - strokePos;
    m_4G63.cylinders.each[1].y = strokePos;
    m_4G63.cylinders.each[2].y = strokePos;
    // 2 & 3 rotate down
  }
}

function updateEngineUI() {
  $('#engine-crank-angle-output').val(m_4G63.crankAngle);
  $('#cly1-pos').text(m_4G63.cylinders.each[0].state);
  $('#cly2-pos').text(m_4G63.cylinders.each[1].state);
  $('#cly3-pos').text(m_4G63.cylinders.each[2].state);
  $('#cly4-pos').text(m_4G63.cylinders.each[3].state);

  $('#pis1, #pis4').attr("y", mapClyY(m_4G63.cylinders.each[0].y));
  $('#pis2, #pis3').attr("y", mapClyY(m_4G63.cylinders.each[1].y));

  $('#cyl1').removeClass().addClass(m_4G63.cylinders.each[0].state);
  $('#cyl2').removeClass().addClass(m_4G63.cylinders.each[1].state);
  $('#cyl3').removeClass().addClass(m_4G63.cylinders.each[2].state);
  $('#cyl4').removeClass().addClass(m_4G63.cylinders.each[3].state);

  $('#engine-tdc').text(m_4G63.TDC);
  $('#engine-cas').text(m_4G63.CAS);

  m_4G63.RPM = $('#rpm-range-input').val();

  if(gauge) {
    gauge.set(m_4G63.RPM / 1000); // set actual value
  }

  if(crankGauge) {
    crankGauge.set(m_4G63.crankAngle);
  }
}

function mapClyY(height) {
  const top = 113.77083;
  const bottom = 139.17065;
  const maxHeight = 88;

  const range = (bottom - top);
  const frac = range / maxHeight;
  const mappedHeight = top + (height * frac);

  return mappedHeight;
}

// CEL Chart
let dps = [];
var celChart = new CanvasJS.Chart(
  "chartContainer",
  {
    title : {
      text: "CEL"
    },
    data: [{
      type: "line",
      dataPoints: dps
    }]
  }
);

var xVal = 0;
var yVal = 100;
var dataLength = 250; // number of dataPoints visible at any point

var celChartUpdate = function(count) {
  while(dps.length > dataLength) {
    dps.shift();
  }

  celChart.render();
};

// Gauge
function doRpmGauge() {
  var opts = {
    angle: -0.28, // The span of the gauge arc
    lineWidth: 0.10, // The line thickness
    radiusScale: 1, // Relative radius
    pointer: {
      length: 0.55, // // Relative to gauge radius
      strokeWidth: 0.024, // The thickness
      color: '#FF5805' // Fill color
    },
    limitMax: false,     // If false, max value increases automatically if value > maxValue
    limitMin: false,     // If true, the min value of the gauge will be fixed
    colorStart: '#000000',   // Colors
    colorStop: '#000000',    // just experiment with them
    strokeColor: '#000000',  // to see which ones work best for you
    generateGradient: false,
    highDpiSupport: true,     // High resolution support
    // renderTicks is Optional
    renderTicks: {
      divisions: 9,
      divWidth: 1.0,
      divLength: 1.0,
      divColor: '#FFFFFF',
      subDivisions: 10,
      subLength: 0.4,
      subWidth: 0.7,
      subColor: '#FFFFFF'
    },
    staticLabels: {
      font: "12px bold sans-serif",  // Specifies font
      labels: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],  // Print labels at these values
      color: "#FFFFFF",  // Optional: Label text color
      fractionDigits: 0  // Optional: Numerical precision. 0=round off.
    }
  };
  var target = document.getElementById('rpm-gauge'); // your canvas element
  if(target) {
    gauge = new Gauge(target);
    gauge.setOptions(opts); // create sexy gauge!
    gauge.maxValue = 9; // set max gauge value
    gauge.setMinValue(0);  // Prefer setter over gauge.minValue = 0
    gauge.animationSpeed = 20; // set animation speed (32 is default value)
    gauge.set(m_4G63.RPM / 1000); // set actual value
  }
}

doRpmGauge();

function doCrankGauge() {
  var opts = {
    angle: -0.28, // The span of the gauge arc
    lineWidth: 0.10, // The line thickness
    radiusScale: 1, // Relative radius
    pointer: {
      length: 0.55, // // Relative to gauge radius
      strokeWidth: 0.024, // The thickness
      color: '#FF5805' // Fill color
    },
    limitMax: false,     // If false, max value increases automatically if value > maxValue
    limitMin: false,     // If true, the min value of the gauge will be fixed
    colorStart: '#000000',   // Colors
    colorStop: '#000000',    // just experiment with them
    strokeColor: '#000000',  // to see which ones work best for you
    generateGradient: false,
    highDpiSupport: true,     // High resolution support
    // renderTicks is Optional
    renderTicks: {
      divisions: 8,
      divWidth: 1.0,
      divLength: 1.0,
      divColor: '#FFFFFF',
      subDivisions: 6,
      subLength: 0.4,
      subWidth: 0.7,
      subColor: '#FFFFFF'
    },
    staticLabels: {
      font: "12px bold sans-serif",  // Specifies font
      labels: [0, 90, 180, 270, 360, 450, 540, 630, 720],  // Print labels at these values
      color: "#FFFFFF",  // Optional: Label text color
      fractionDigits: 0  // Optional: Numerical precision. 0=round off.
    }
  };
  var target = document.getElementById('crank-gauge'); // your canvas element
  if(target) {
    crankGauge = new Gauge(target);
    crankGauge.setOptions(opts); // create sexy gauge!
    crankGauge.maxValue = 720; // set max gauge value
    crankGauge.setMinValue(0);  // Prefer setter over gauge.minValue = 0
    crankGauge.animationSpeed = 1; // set animation speed (32 is default value)
    crankGauge.set(m_4G63.crankAngle); // set actual value
  }
}

doCrankGauge();

function doTdcCasChart() {
  var options = {
    chart: {
      type: 'line',
      offsetY: 10
    },
    stroke: {
      curve: 'stepline',
    },
    series: [{
      name: 'TDC',
      data: [-1,0,1,2]
    }],
    xaxis: {
      type: 'numeric'
    }
  };

  tdcChart = new ApexCharts(document.querySelector("#tdc-chart"), options);

  tdcChart.render();

  tdcChart.appendSeries({
    name: "CAS",
    data: [-1, 0, 1, 2]
  });
}

doTdcCasChart();

function o2Simulation(t) {
  let ret = 0;
  const time = Math.floor(t * 1000);

  if(time % 2) {
    ret = 0.3;
  } else {
    ret = 0.7;
  }

  return ret;
}
