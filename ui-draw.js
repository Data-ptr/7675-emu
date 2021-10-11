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
    hexString +=
      ("0" + Number(view[i]).toString(16)).slice(-2).toUpperCase();
  }

  $("#hex-output-textarea").text(hexString);
}


function drawRAMOutput(view, len, all) {
  let byteElements = $("#RAM-output-div > span");

  for (let i = 0; i < len; i++) {
    if (all) {
      let hexByte = ("0" + Number(view[i]).toString(16))
        .slice(-2)
        .toUpperCase();
      $(byteElements[i]).text(hexByte);
      $(byteElements[i]).removeClass("hilight");
      $(byteElements[i]).removeClass("hilight-read");
      $(byteElements[i]).removeClass("stack-pointer");
    } else {
      if(i == lastClockWrite) {
        let hexByte = ("0" + Number(view[i]).toString(16))
          .slice(-2)
          .toUpperCase();
        $(byteElements[i]).text(hexByte);
      } else if (i == lastRAMWrite) {
        let hexByte = ("0" + Number(view[i]).toString(16))
          .slice(-2)
          .toUpperCase();
        $(byteElements[i]).text(hexByte);

        $(byteElements[i]).addClass("hilight");

        if ($("#followRamWrite-input").is(":checked")) {
          $("#RAM-output-div").scrollTop(
            $(byteElements[i]).offset().top - $(byteElements[i]).parent().offset().top
          );
        }
      } else {
        $(byteElements[i]).removeClass("hilight");
      }

      if(i == lastClockRead) {
        let hexByte = ("0" + Number(view[i]).toString(16))
          .slice(-2)
          .toUpperCase();
        $(byteElements[i]).text(hexByte);
      } else if (i == lastRAMRead) {
        let hexByte = ("0" + Number(view[i]).toString(16))
          .slice(-2)
          .toUpperCase();
        $(byteElements[i]).text(hexByte);

        $(byteElements[i]).addClass("hilight-read");

        if ($("#followRamRead-input").is(":checked")) {
          $("#RAM-output-div").scrollTop(
            $(byteElements[i]).offset().top - $(byteElements[i]).parent().offset().top
          );
        }
      } else {
        $(byteElements[i]).removeClass("hilight-read");
      }

      if (i == cpu.SP) {
        $(byteElements[i]).addClass("stack-pointer");
      } else {
        $(byteElements[i]).removeClass("stack-pointer");
      }
    }
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
  let view = cpu.ROM.view;
  let textareaIndex = (cpu.PC - 0x8000) * 2;

  $("#register-PC-output").val(
    ("0" + Number(cpu.PC).toString(16)).slice(-4).toUpperCase()
  );

  $("#hex-output-textarea").blur();
  $("#hex-output-textarea")[0].setSelectionRange(
    textareaIndex,
    textareaIndex + 2
  );
  $("#hex-output-textarea").focus();

  let fullInst;

  if ("SUBOP" != instructionTable[view[cpu.PC - 0x8000]].type) {
    fullInst = instructionTable[view[cpu.PC - 0x8000]].name.toUpperCase();

    for (let i = 1; i < instructionTable[view[cpu.PC - 0x8000]].len; i++) {
      fullInst +=
        " " +
        ("0" + view[cpu.PC - 0x8000 + i].toString(16)).slice(-2).toUpperCase();
    }
  } else {
    fullInst = subOps[view[cpu.PC - 0x8000]][
      view[cpu.PC - 0x8000 + 1]
    ].name.toUpperCase();
  }

  $("#instruction").text(fullInst);

  //console.log(cpu.PC.toString(16) + ": " + fullInst);
  $("#log-output-div > ul").append(
    "<li>" + cpu.PC.toString(16) + ": " + fullInst + "</li>"
  );
  let d = $("#log-output-div");
  d.scrollTop(d.prop("scrollHeight"));
}
