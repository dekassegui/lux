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
              values = row.split('|');
              var dayNumber = parseInt(values[0]);
              var allowed = parseInt(values[1]);
              var surrogate = parseInt(values[2]);
              var input = weekdays[dayNumber];
              input.checked = (allowed == 1);
              input.setAttribute("valor", allowed);
              input = cousin(input);
              input.readOnly = (allowed == 1);
              input.value = dayNames[surrogate];
              input.setAttribute("valor", dayNames[surrogate]);
            });
        };
      }
      xhr.open("GET", uri + '?action=GETREC', true);
      xhr.send();
    };

    $('updateBtn').onclick = function saveData() {
      var par = '';
      // agrega parâmetros para cálculo das datas limite :: prazo e pendências
      emprestimos.forEach(
        function (input) {
          par += '&' + input.id + '=' + encodeURIComponent(input.value);
        });
      // agrega parâmetros de cada dia da semana
      weekdays.forEach(
        function (input, numeroDiaDaSemana) {
          var datum = [
            numeroDiaDaSemana,      // número do dia da semana
            input.checked ? 1 : 0,  // disponibilidade de atendimento no dia
            dayNames.indexOf(       // número do dia substituto
              cousin(input).value.trim().toLowerCase())];
          par += '&DIA' + numeroDiaDaSemana + '='
                 + encodeURIComponent(datum.join('|'));
        });
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
          alert(this.responseText);
          if (this.responseText.startsWith('Error')) loadData();
        };
      }
      xhr.open("GET", uri + '?action=UPDATE' + par, true);
      xhr.send();
    };

    // restaura valor original se sair da edição com string vazia
    function lostFocus(ev) {
      var t = (ev || event).target;
      if (t.value.length == 0) t.value = t.getAttribute("valor");
    }

    // cancela o evento se a tecla pressionada não for digito entre
    // 0 e 9 (inclusive as do Numpad), Enter, Tab, Del, Backspace,
    // Left, Right, Home, End, Escape e Ctrl-Z
    function chkKeyDown(ev) {
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
        input.addEventListener('keydown', chkKeyDown, true);
        input.onblur = lostFocus;
      });

    // altera "readonly" de "cousin" element quando "checked"
    function chgCheckBox(ev) {
      var input = (ev || event).target;
      cousin(input).readOnly = input.checked;
    }

    weekdays.forEach(
      function (input, index) {
        input.onchange = chgCheckBox;
        var c = cousin(input);
        c.onblur = lostFocus;
        if (index == 0) {
          localStorage.setItem("msg1",
            input.parentElement.title.replace('no domingo', ''));
          localStorage.setItem("msg2",
            c.parentElement.title.replace('no domingo', ''));
        } else {
          var sufixo = ((index < 6) ? 'na ' : 'no ') + dayNames[index];
          input.parentElement.title = localStorage.getItem("msg1") + sufixo;
          c.parentElement.title = localStorage.getItem("msg2") + sufixo;
        }
      });

    loadData.apply(this);

  }, true);