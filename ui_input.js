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
    let cycles = cpu.clock.tickCount;
    let simTimeNow = (1 / (cpu.clockSpeed * 0xF4240)) * cpu.clock.tickCount;
    let rtcNow = rtcStash + (((new Date().getTime()) - rtcStart) / 1000);

    $("#clock-ticks-output").val(cycles);
    $("#sim-time-output").val(simTimeNow);
    $("#real-time-output").val(rtcNow);
  }, 500);


  stepInterval = setInterval(
    step,
    window.parseInt($("#clock-speed-input").val())
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
