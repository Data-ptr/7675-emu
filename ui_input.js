let timeLast = 0;
let cyclesLast = 0;
let intervalSpeed = 0;
let stepsPerInterval = 1;

// iOS hack
$(
  "#load-button-input, #load-reset-button-input, #save-button-input, #restore-button-input, #execute-button-input"
).css("cursor", "pointer");

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

$("#step-button-input").bind("click", function() {
  step();
});

$("#run-button-input").bind("click", function() {
  if(0 == rtcStart)
  {
    rtcStart = new Date().getTime();
  }

  clockUpdateInterval = setInterval(function(){
    let cycles = cpu.clock.cycleCount;
    let now = new Date().getTime();
    let simTimeNow = (1 / (cpu.clockSpeed * 0xF4240)) * cpu.clock.cycleCount;
    let rtcNow = rtcStash + ((now - rtcStart) / 1000);
    let realSpeed = (cycles - cyclesLast) / ((now-timeLast) * 1000);

    cyclesLast = cycles;
    timeLast = now;

    elementCache.clockCyclesOutput.val(cycles);
    elementCache.simTimeOutput.val(simTimeNow);
    elementCache.realSpeedOutput.val(realSpeed);
    elementCache.realTimeOutput.val(rtcNow);
  }, 500);

  intervalSpeed = window.parseInt($("#clock-speed-input").val());

  stepInterval = setInterval(
    function(){
      if(updateBatchOutput){
        let start = new Date().getTime();

        for(let i = 0; i < stepsPerInterval; i++) {
          step();
        }

        let end = new Date().getTime();

        let t = end - start;

        if(t > intervalSpeed + (intervalSpeed / 2)) {
          stepsPerInterval -= Math.ceil((t - intervalSpeed) / 2);
        } else if(t < intervalSpeed - (intervalSpeed / 2)) {
          stepsPerInterval += Math.ceil((intervalSpeed - t) / 2);
        }

        if(stepsPerInterval < 0) {
          stepsPerInterval = 1;
        }
      } else {
        step();
      }
    },
    intervalSpeed
  );
});

$("#pause-button-input").bind("click", function() {
  clearInterval(stepInterval);

  rtcStash = rtcStash + (((new Date().getTime()) - rtcStart) / 1000)
  rtcStart = 0;

  clearInterval(clockUpdateInterval);
});

$("#clear-log-button-input").bind("click", function() {
  $("#log-output-div > ul").empty();
});

$("#set-breakpoint-pc-button-input").bind("click", function() {
  $('#breakpoint-input').val($('#register-PC-output').val());
});

$('#myTab button').bind("click", function() {
  if(this.id == "registers-tab") {
    updateDataRegisters = 1;

    for(let i = 0; i < 0x40; i++) {
      updateRegisters(i);
    }
  } else {
    updateDataRegisters = 0;
  }
})

$('#updateRamOutput-input').bind('click', function(){
  updateRAM = $(this).is(':checked');
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

$('#updateBatchOutput-input').bind('click', function(){
  updateBatchOutput = $(this).is(':checked');
});

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

$('#trigger-rti-input').bind('click', function(){
  interruptStack.push(0xFFE4);
});

$('#trigger-irq-input').bind('click', function(){
  interruptStack.push(0xFFF8);
});

$('#trigger-swi-input').bind('click', function(){
  interruptStack.push(0xFFFA);
});

$('#trigger-nmi-input').bind('click', function(){
  interruptStack.push(0xFFFC);
});

$('#trigger-reset-input').bind('click', function(){
  interruptStack.push(0xFFFE);
});
