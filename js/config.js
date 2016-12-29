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
        function (option) { return option.value; }
      );

    function cousin(element) {
      return element.parentElement.nextElementSibling.firstElementChild;
    }

    function loadData() {
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
          var rows = this.responseText.split(/\n|\r|\r\n/g);
          var values = rows.shift().split('|');
          emprestimos.forEach(
            function (input, index) {
              input.value = values[index];
              input.setAttribute("valor", values[index]);
            });
          rows.forEach(
            function (row) {
              values = row.split('|').map(function (x) { return parseInt(x) });
              var dayNumber = values[0];
              var allowed = values[1];
              var surrogate = values[2];
              var input = weekdays[dayNumber];
              input.checked = !!allowed;
              input.setAttribute("valor", allowed);
              input = cousin(input);
              input.readOnly = !!allowed;
              input.value = dayNames[surrogate];
              input.setAttribute("valor", dayNames[surrogate]);
            });
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
      // tenta agregar parâmetros de dias da semana
      for (var numeroDiaDaSemana=0; numeroDiaDaSemana<7; ++numeroDiaDaSemana) {
        var input = weekdays[numeroDiaDaSemana];
        var $checked = !!parseInt(input.getAttribute("valor"));
        var c = cousin(input);
        var $dayName = c.getAttribute("valor");
        var dayName = c.value.trim().toLowerCase();
        // testa se parâmetros foram modificados
        if ((input.checked != $checked) || (dayName != $dayName)) {
          var datum = [
            numeroDiaDaSemana,          // número do dia da semana
            input.checked ? 1 : 0,      // disponibilidade de atendimento
            dayNames.indexOf(dayName)]; // número do dia substituto
          par += '&DIA' + numeroDiaDaSemana + '=' + datum.join('|');
        }
      }
      if (par.length > 0) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
          if (this.readyState == 4 && this.status == 200) {
            alert(this.responseText);
            loadData();
          }
        };
        xhr.open("GET", uri + '?action=UPDATE' + par, true);
        xhr.send();
      } else {
        alert('Atualização desnecessária.');
      }
    };

    // restaura valor original se sair da edição com string vazia
    function onLostFocus(ev) {
      var t = (ev || event).target;
      if (t.value.length == 0) t.value = t.getAttribute("valor");
    }

    // cancela o evento se a tecla pressionada não for digito entre
    // 0 e 9 (inclusive as do Numpad), Enter, Tab, Del, Backspace,
    // Left, Right, Home, End, Escape e Ctrl-Z
    function onKeyDown(ev) {
      ev = ev || event;
      var c = ev.keyCode;
      if ((c < 48 || c > 57) && (c < 96 || c > 105)
        && !(c == 90 && ev.ctrlKey)
        && (binarySearch([8, 9, 13, 27, 35, 36, 37, 39, 46], c) == -1))
      {
        ev.preventDefault();
      }
    }

    emprestimos.forEach(
      function (input) {
        input.addEventListener('keydown', onKeyDown, true);
        input.onblur = onLostFocus;
      });

    // altera "readonly" de "cousin" element quando "checked"
    function onChgCheckBox(ev) {
      var input = (ev || event).target;
      cousin(input).readOnly = input.checked;
    }

    weekdays.forEach(
      function (input, index) {
        input.onchange = onChgCheckBox;
        var c = cousin(input);
        c.onblur = onLostFocus;
        if (index > 0) {
          var sufixo = ((index < 6) ? 'na ' : 'no ') + dayNames[index];
          input.parentElement.title = localStorage.cfg1 + sufixo;
          c.parentElement.title = localStorage.cfg2 + sufixo;
        } else if (!localStorage.cfg1 || !localStorage.cfg2) {
          localStorage.cfg1 = input.parentElement.title.replace('no domingo', '');
          localStorage.cfg2 = c.parentElement.title.replace('no domingo', '');
        }
      });

    loadData.apply();

  }, true);

//window.onunload = function () { localStorage.clear(); }