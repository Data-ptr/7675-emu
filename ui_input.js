let timeLast = 0;
let cyclesLast = 0;

// iOS hack
$(
  "#load-button-input, #load-reset-button-input, #save-button-input, #restore-button-input, #execute-button-input"
).css("cursor", "pointer");

// Load Tab

$("#load-button-input").bind("click", function() {
  let base64String = $("#base64-textarea").val();
  let binary_string = window.atob(base64String);
  let len = binary_string.length;

  let view = cpu.ROM.view;

  for (let i = 0; i < len; i++) {
    view[i] = binary_string.charCodeAt(i);
  }

  drawHexOutput(view, len);

  hideInput();

  setPcToEntrypoint();
});

$("#load-reset-button-input").bind("click", function() {
  showInput();

  fullReset();
});

$("#save-button-input").bind("click", function() {
  let base64String = $("#base64-textarea").val();
  let binary_string = window.atob(base64String);
  let len = binary_string.length;

  let view = cpu.ROM.view;

  for (let i = 0; i < len; i++) {
    view[i] = binary_string.charCodeAt(i);
  }

  localStorage.setItem("E931", binary_string);
});

$("#restore-button-input").bind("click", function() {
  let codeFromLS = localStorage.getItem("E931");

  if (undefined !== codeFromLS) {
    let len = codeFromLS.length;
    let view = cpu.ROM.view;

    for (let i = 0; i < len; i++) {
      view[i] = codeFromLS.charCodeAt(i);
    }

    drawHexOutput(view, len);

    hideInput();

    setPcToEntrypoint();
  }
});

// Execution control

$("#step-button-input, #src-step-button-input").bind("click", function() {
  step();
});

$("#run-button-input, #src-run-button-input").bind("click", function() {
  if(0 == rtcStart) {
    rtcStart = new Date().getTime();
  }

  intervalStepT = window.parseInt($("#clock-speed-input").val());

  startIntervalStep(intervalStepT);
  startIntervalClock(clockUpdateT);

  if(updateEngineUi) {
    startIntervalEngineUi(uiUpdateT);
    startIntervalTdcCasChart(uiUpdateT);
  }

  if(updateCelChart) {
    startIntervalCelChart(uiUpdateT);
  }
});

$("#pause-button-input, #src-pause-button-input").bind("click", function() {
  pauseExec();
});

// Debug tab

$('#write-break-input').bind('click', function() {
  breakOnWrite = $(this).is(':checked');

  writeBreakpoint = elementCache.writeBreakpointInput.val();
});

$('#write-breakpoint-input').bind('change', function() {
  breakOnWrite = false;
  $('#write-break-input').val('checked', 'false');
});

// Log tab

$("#clear-log-button-input").bind("click", function() {
  $("#log-output-div > ul").empty();
});

$("#set-breakpoint-pc-button-input").bind("click", function() {
  $('#breakpoint-input').val($('#register-PC-output').val());
});

// Update Data Registers UI

$('#myTab button').bind("click", function() {
  if(this.id == "registers-tab") {
    updateDataRegisters = 1;

    for(let i = 0; i < 0x40; i++) {
      updateRegisters(i);
    }
  } else {
    updateDataRegisters = 0;
  }

  if(this.id == "4G63-tab") {
    //TODO: only run once
    setTimeout(doRpmGauge, 500); //delay
  }
});

// Settings

$('#updateRamOutput-input').bind('click', function(){
  updateRAM = $(this).is(':checked');
  drawRAMOutput(cpu.memory.view, RAMSize, 1);
});

$('#updateRomOutput-input').bind('click', function(){
  updateROM = $(this).is(':checked');
});

$('#updateUiOutput-input').bind('click', function(){
  updateUI = $(this).is(':checked');
});

$('#updateLogOutput-input').bind('click', function(){
  logEnabled = $(this).is(':checked');
});

$('#updateSrcOutput-input').bind('click', function(){
  updateSrc = $(this).is(':checked');
});

$('#updateBatchOutput-input').bind('click', function(){
  updateBatchOutput = $(this).is(':checked');
});

$('#updateCelChart-input').bind('click', function(){
  updateCelChart = $(this).is(':checked');

  if(updateCelChart) {
    startIntervalCelChart(uiUpdateT);
  } else {
    clearInterval(chartCelInterval);
  }
});

$('#updateEngineUi-input').bind('click', function(){
  updateEngineUi = $(this).is(':checked');

  if(updateEngineUi) {
    startIntervalEngineUi(uiUpdateT);
    startIntervalTdcCasChart(uiUpdateT);
  } else {
    clearInterval(engineUiInterval);
    clearInterval(tdcCasChartInterval);
  }
});

// Events

$('#trigger-t1-ic-input').bind('click', function(){
  ;
});

$('#trigger-t2-ic-input').bind('click', function(){
  ;
});

$('#trigger-stby-pwr-fail-input').bind('click', function(){
  let ramCtrlReg = readRAM(0x14,1);
  writeRAM(0x14,ramCtrlReg & 0b01000000, 1);
});

$('#trigger-sci-input').bind('click', function(){
  interruptStack.push(vectors.sci_rx);
});

$('#trigger-rti-input').bind('click', function(){
  interruptStack.push(vectors.rti);
});

$('#trigger-irq-input').bind('click', function(){
  interruptStack.push(vectors.irq);
});

$('#trigger-swi-input').bind('click', function(){
  interruptStack.push(vectors.swi);
});

$('#trigger-nmi-input').bind('click', function(){
  interruptStack.push(vectors.nmi);
});

$('#trigger-reset-input').bind('click', function(){
  interruptStack.push(vector.reset);
});

// DSM

$('#dsm-test-mode-input').bind('click', function(){
  let prevVal = readRAM(0x07, 1);

  // ECU test mode
  if(prevVal & 0b00001000) { // If bit is set
    writeRAM(0x07, prevVal & 0b11110111, 1);    // Clear it
  } else {
    writeRAM(0x07, prevVal | 8, 1);    // Set it
  }
});

// Clear START bit
$('#dsm-key-start-input').bind('click', function() {
  writeRAM(0x06, readRAM(0x06, 1) & 0b10111111, 1);
});

// Set START bit
$('#dsm-key-off-input').bind('click', function() {
  writeRAM(0x06, readRAM(0x06, 1) | 0b01000000, 1);
});

$('#dsm-clear-cas-input').bind('click', function() {
  writeRAM(0x16, readRAM(0x16, 1) & 0b11111110, 1);
});
