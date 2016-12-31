/**
 * Este script é parte do projeto LUX, software livre para bibliotecas de
 * casas Espíritas, em desenvolvimento desde 12/11/2016.
*/

window.addEventListener('load',
  function () {

    // URI do script "server side" que atende requisições ao DB
    var uri = location.href.replace("html", "php");

    var emprestimos = $$('div#emprestimos input');

    var weekdays = $$('div#weekdays fieldset label:first-child input');

    var dayNames = $$('datalist#days option').map(
        function (option) { return option.value; });

    function cousin(element) {
      return element.parentElement.nextElementSibling.firstElementChild;
    }

    function loadConfig() {
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
          // particiona a string container dos dados requisitados
          var rows = this.responseText.split(/\n|\r|\r\n/g);
          // monta o array dos valores :: [prazo, pendencias]
          var values = rows[0].split('|').map(Number);
          // preenche os valores para cálculo de datas limite
          for (var j=0; j<2; ++j) {
            emprestimos[j].value = values[j];
            emprestimos[j].setAttribute("valor", values[j]);
          }
          // preenche os valores de 'dias da semana'
          for (var j=1; j<8; ++j) {
            // monta o array dos valores :: [dayNumber, allowed, surrogate]
            values = rows[j].split('|').map(Number);
            var input = weekdays[ values[0] ];
            input.checked = !!values[1];
            input.setAttribute("valor", values[1]);
            input = cousin(input);
            input.readOnly = !!values[1];
            input.value = dayNames[ values[2] ];
            input.setAttribute("valor", dayNames[ values[2] ]);
          }
        }
      };
      xhr.open("GET", uri + '?action=GETREC', true);
      xhr.send();
    }

    $('updateBtn').onclick = function saveData() {
      var par = '';
      // tenta agregar parâmetros para cálculo de datas limite
      if (emprestimos.some(el => el.getAttribute("valor") != el.value)) {
        var datum = emprestimos.map(function (input) { return input.value; });
        par += '&CFG=' + datum.join('|');
      }
      // tenta agregar parâmetros de 'dias da semana'
      for (var numeroDiaSemana=0; numeroDiaSemana<7; ++numeroDiaSemana) {
        var input = weekdays[numeroDiaSemana];
        var $checked = !!parseInt(input.getAttribute("valor"));
        var c = cousin(input);
        var $dayName = c.getAttribute("valor");
        var dayName = c.value.trim().toLowerCase();
        // testa se parâmetros foram modificados
        if ((input.checked != $checked) || (dayName != $dayName)) {
          var datum = [
            numeroDiaSemana,            // número do dia da semana
            input.checked ? 1 : 0,      // disponibilidade de atendimento
            dayNames.indexOf(dayName)]; // número do dia substituto
          par += '&DIA' + numeroDiaSemana + '=' + datum.join('|');
        }
      }
      if (par.length > 0) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
          if (this.readyState == 4 && this.status == 200) {
            alert(this.responseText);
            if (this.responseText.indexOf('Error') == -1) {
              loadConfig();
            } else {
              loadConfig();
            }
          }
        };
        xhr.open("GET", uri + '?action=UPDATE' + par, true);
        xhr.send();
      } else {
        alert('Atualização desnecessária.');
      }
    };

    // cancela o evento se a tecla pressionada não for digito entre
    // 0 e 9 (inclusive as do Numpad), Enter, Tab, Del, Backspace,
    // Left, Right, Home, End, Escape e Ctrl-Z
    function onKeyDown(ev) {
      ev = ev || event;
      var c = ev.keyCode;
      if ((c < 48 || c > 57) && (c < 96 || c > 105)
        && !(c == 90 && ev.ctrlKey) // Ctrl-Z :: undo command
        && (binarySearch([8, 9, 13, 27, 35, 36, 37, 39, 46], c) == -1))
      {
        ev.preventDefault();
      }
    }

    // restaura valor original se sair da edição com string vazia
    function onLostFocus(ev) {
      var t = (ev || event).target;
      if (t.value.length == 0) t.value = t.getAttribute("valor");
    }

    // altera "readonly" de "cousin" element quando "checked"
    function onChgCheckBox(ev) {
      var input = (ev || event).target;
      cousin(input).readOnly = input.checked;
    }

    // atribuição de 'event listeners' dos inputs em 'emprestimos'
    for (var j=0; j<2; ++j) {
      var input = emprestimos[j];
      input.onkeydown = onKeyDown;
      input.onblur = onLostFocus;
    }

    // atribuição de 'event listeners' e tooltips dos inputs em 'weekdays'
    for (var j=0; j<7; ++j) {
      var input = weekdays[j];
      input.onchange = onChgCheckBox;
      var c = cousin(input);
      c.onblur = onLostFocus;
      // clona tooltip message dos inputs do primeiro fieldset para os
      // inputs dos demais fieldsets, alterando o sufixo dia da semana
      if (j > 0) {
        var sufixo = ((j < 6) ? 'na ' : 'no ') + dayNames[j];
        input.parentElement.title = localStorage.cfg1 + sufixo;
        c.parentElement.title = localStorage.cfg2 + sufixo;
      } else if (!localStorage.cfg1 || !localStorage.cfg2) {
        localStorage.cfg1 =
          input.parentElement.title.replace('no domingo', '');
        localStorage.cfg2 = c.parentElement.title.replace('no domingo', '');
      }
    }

    loadConfig.apply();

  }, true);

//window.onunload = function () { localStorage.clear(); }