/**
 * Este script é parte do projeto LUX, software livre para bibliotecas de
 * casas Espíritas, em desenvolvimento desde 12/11/2016.
*/

window.addEventListener('load',
  function () {

    // URI do script "server side" que atende requisições ao DB
    var uri = location.href.replace("html", "php");

    var emprestimos = $$('div#emprestimos input');

    var fieldsets = $$('div#weekdays > fieldset');

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
              // fieldset -> label -> input[type="checkbox"]
              var t = fieldsets[dayNumber].children[1].firstElementChild;
              t.checked = (allowed == 1);
              t.setAttribute("valor", allowed);
              // label -> label -> input[type="text"]
              t = cousin(t);
              t.readOnly = (allowed == 1);
              t.value = dayNames[surrogate];
              t.setAttribute("valor", dayNames[surrogate]);
            });
        };
      }
      xhr.open("GET", uri + '?action=GETREC', true);
      xhr.send();
    };

    $('updateBtn').onclick = function saveData() {
      var par = '';
      // agrega dados da tabela 'config' :: prazo e pendências
      emprestimos.forEach(
        function (input) {
          par += '&' + input.id + '=' + encodeURIComponent(input.value);
        });
      // agrega dados da tabela 'weekdays' :: dia, disponibilidade e substituto
      fieldsets.forEach(
        function (fieldset, index) {
          // identifica o dia da semana pelo número de acesso
          par += '&weekday' + index;
          // legend
          var t = fieldset.firstElementChild;
          // nome do dia da semana
          var datum = [t.textContent];
          // label -> input[type="checkbox"]
          t = t.nextElementSibling.firstElementChild;
          // disponibilidade de serviço no dia da semana
          datum.push(t.checked ? 1 : 0);
          // label -> label -> input[type="text"]
          t = cousin(t);
          // nome do dia substituto
          datum.push(t.value);
          par += '=' + encodeURIComponent(datum.join('|'));
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

    emprestimos.forEach(
      function (input) {

        input.addEventListener('keydown',
          // cancela o evento se a tecla pressionada não for digito entre
          // 0 e 9 (inclusive as do Numpad), Enter, Tab, Del, Backspace,
          // Left, Right, Home, End, Escape e Ctrl-Z
          function (ev) {
            ev = ev || event;
            var c = ev.keyCode;
            if ((c < 48 || c > 57) && (c < 96 || c > 105)
              && !(c == 90 && ev.ctrlKey)
              && (binarySearch([8, 9, 13, 27, 35, 36, 37, 39, 46], c) == -1))
            {
              ev.preventDefault();
            }
          }, true);

        input.addEventListener('blur',
          // restaura valor original se sair da edição com string vazia
          function (ev) {
            var t = (ev || event).target;
            if (t.value.length == 0) t.value = t.getAttribute("valor");
          }, true);

      });

    fieldsets.forEach(
      function (fieldset) {
        // fieldset -> label -> input[type="checkbox"]
        var input = fieldset.children[1].firstElementChild;
        input.onchange = function (ev) {
          // altera "readonly" de "cousin" element quando "checked"
          var input = (ev || event).target;
          var c = cousin(input);
          c.readOnly = input.checked;
        };
        // label -> label -> input[type="text"]
        input = cousin(input);
        input.onblur = function (ev) {
          var t = (ev || event).target;
          if (t.value.length == 0) t.value = t.getAttribute("valor");
        };
      });

    loadData.apply(this);

  }, true);