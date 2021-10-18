let lastSP = -1;
let byteElements = undefined;

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

  romTextarea.text(hexString);
}

function drawRAMOutput(view, len, all) {
  let i = 0;

  if(!byteElements) {
    byteElements = $("#RAM-output-div > span");
  }

  if (all) {
    for (let i = 0; i < len; i++) {
      let hexByte = ("0" + Number(view[i]).toString(16))
        .slice(-2)
        .toUpperCase();
      $(byteElements[i]).text(hexByte);
    }

    $(byteElements).removeClass("hilight");
    $(byteElements).removeClass("hilight-read");
    $(byteElements).removeClass("stack-pointer");
  } else {
    while ((i = lastClockWrite.pop())) {
      let hexByte = ("0" + Number(view[i]).toString(16))
        .slice(-2)
        .toUpperCase();
      $(byteElements[i]).text(hexByte);
    }

    if(lastRAMWrite.length > 0) {
      $("#RAM-output-div > span.hilight").removeClass("hilight");
    }

    while ((i = lastRAMWrite.pop())) {
      let hexByte = ("0" + Number(view[i]).toString(16))
        .slice(-2)
        .toUpperCase();
      $(byteElements[i]).text(hexByte);

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

    if(lastRAMRead.length > 0) {
      $("#RAM-output-div > span.hilight-read").removeClass("hilight-read");
    }

    while ((i = lastRAMRead.pop())) {
      let hexByte = ("0" + Number(view[i]).toString(16))
        .slice(-2)
        .toUpperCase();
      $(byteElements[i]).text(hexByte);

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

    if(cpu.SP != lastSP) {
      lastSP = cpu.SP;

      $(byteElements).removeClass("stack-pointer");
      $(byteElements[cpu.SP]).addClass("stack-pointer");
    }
  }
}

function updateRegisters(i) {
  let bin = ("00000000" + cpu.memory.view[i].toString(2)).slice(-8);

  $("#data-registers-table > tbody > tr:eq(" + i + ") table td").each(function(
    index,
    elem
  ) {
    $(elem).text(bin[index]);
  });

  // Special cases
  switch (i) {
    case 0:
      $("#data-registers-table > tbody > tr:eq(2) table th").each(function(
        index,
        elem
      ) {
        $(elem)
          .text("1" === bin[index] ? "O" : "I")
          .attr("title", "1" === bin[index] ? "Output" : "Input");
      });
      break;
    case 1:
      $("#data-registers-table > tbody > tr:eq(3) table th").each(function(
        index,
        elem
      ) {
        $(elem)
          .text("1" === bin[index] ? "O" : "I")
          .attr("title", "1" === bin[index] ? "Output" : "Input");
      });
      break;
    case 4:
      $("#data-registers-table > tbody > tr:eq(6) table th").each(function(
        index,
        elem
      ) {
        $(elem)
          .text("1" === bin[index] ? "O" : "I")
          .attr("title", "1" === bin[index] ? "Output" : "Input");
      });
      break;
    case 5:
      $("#data-registers-table > tbody > tr:eq(7) table th").each(function(
        index,
        elem
      ) {
        $(elem)
          .text("1" === bin[index] ? "O" : "I")
          .attr("title", "1" === bin[index] ? "Output" : "Input");
      });
      break;
    case 0x15:
      $("#data-registers-table > tbody > tr:eq(0x16) table th").each(function(
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
  elementCache.pcRegisterOutput.val(
    ("0" + Number(cpu.PC).toString(16)).slice(-4).toUpperCase()
  );
}
