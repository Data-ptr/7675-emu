function hideInput() {
  $("#input-div").hide();
  $("#input-hidden-div").show();
}

function showInput() {
  $("#input-div").show();
  $("#input-hidden-div").hide();
}

function drawHexOutput(view, len) {
  let hexString = "";

  for (let i = 0; i < len; i++) {
    hexString += ("0" + Number(view[i]).toString(16)).slice(-2).toUpperCase();
  }

  $("#hex-output-textarea").text(hexString);
}

function drawRAMOutput(view, len, all) {
  let i = 0;
  let byteElements = $("#RAM-output-div > span");

  if (all) {
    for (let i = 0; i < len; i++) {
      let hexByte = ("0" + Number(view[i]).toString(16))
        .slice(-2)
        .toUpperCase();
      $(byteElements[i]).text(hexByte);
      $(byteElements[i]).removeClass("hilight");
      $(byteElements[i]).removeClass("hilight-read");
      $(byteElements[i]).removeClass("stack-pointer");
    }
  } else {
    while ((i = lastClockWrite.pop())) {
      let hexByte = ("0" + Number(view[i]).toString(16))
        .slice(-2)
        .toUpperCase();
      $(byteElements[i]).text(hexByte);
    }

    while ((i = lastRAMWrite.pop())) {
      let hexByte = ("0" + Number(view[i]).toString(16))
        .slice(-2)
        .toUpperCase();
      $(byteElements[i]).text(hexByte);

      $(byteElements).removeClass("hilight");
      $(byteElements[i]).addClass("hilight");

      if ($("#followRamWrite-input").is(":checked")) {
        $("#RAM-output-div").scrollTop(
          $(byteElements[i]).offset().top -
            $(byteElements[i])
              .parent()
              .offset().top
        );
      }
    }

    while ((i = lastClockRead.pop())) {
      let hexByte = ("0" + Number(view[i]).toString(16))
        .slice(-2)
        .toUpperCase();
      $(byteElements[i]).text(hexByte);
    }

    while ((i = lastRAMRead.pop())) {
      let hexByte = ("0" + Number(view[i]).toString(16))
        .slice(-2)
        .toUpperCase();
      $(byteElements[i]).text(hexByte);

      $(byteElements).removeClass("hilight-read");
      $(byteElements[i]).addClass("hilight-read");

      if ($("#followRamRead-input").is(":checked")) {
        $("#RAM-output-div").scrollTop(
          $(byteElements[i]).offset().top -
            $(byteElements[i])
              .parent()
              .offset().top
        );
      }
    }

    $(byteElements).removeClass("stack-pointer");
    $(byteElements[cpu.SP]).addClass("stack-pointer");
  }
}

function updateRegisters(i) {
  let bin = ("00000000" + cpu.memory.view[i].toString(2)).slice(-8);

  $("#registers-table > tbody > tr:eq(" + i + ") table td").each(function(
    index,
    elem
  ) {
    $(elem).text(bin[index]);
  });

  // Special cases
  switch (i) {
    case 0:
      $("#registers-table > tbody > tr:eq(2) table th").each(function(
        index,
        elem
      ) {
        $(elem)
          .text("1" === bin[index] ? "O" : "I")
          .attr("title", "1" === bin[index] ? "Output" : "Input");
      });
      break;
    case 1:
      $("#registers-table > tbody > tr:eq(3) table th").each(function(
        index,
        elem
      ) {
        $(elem)
          .text("1" === bin[index] ? "O" : "I")
          .attr("title", "1" === bin[index] ? "Output" : "Input");
      });
      break;
    case 4:
      $("#registers-table > tbody > tr:eq(6) table th").each(function(
        index,
        elem
      ) {
        $(elem)
          .text("1" === bin[index] ? "O" : "I")
          .attr("title", "1" === bin[index] ? "Output" : "Input");
      });
      break;
    case 5:
      $("#registers-table > tbody > tr:eq(7) table th").each(function(
        index,
        elem
      ) {
        $(elem)
          .text("1" === bin[index] ? "O" : "I")
          .attr("title", "1" === bin[index] ? "Output" : "Input");
      });
      break;
    case 0x15:
      $("#registers-table > tbody > tr:eq(0x16) table th").each(function(
        index,
        elem
      ) {
        $(elem)
          .text("1" === bin[index] ? "O" : "I")
          .attr("title", "1" === bin[index] ? "Output" : "Input");
      });
      break;
  }
}

function updatePCOutput() {
  $("#register-PC-output").val(
    ("0" + Number(cpu.PC).toString(16)).slice(-4).toUpperCase()
  );
}
