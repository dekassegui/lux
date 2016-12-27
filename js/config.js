/**
 * Este script é parte do projeto LUX, software livre para bibliotecas de
 * casas Espíritas, em desenvolvimento desde 12/11/2016.
*/

window.addEventListener('load',
  function () {

    // URI do script "server side" que atende requisições ao DB
    var uri = location.href.replace("html", "php");

    var prazo = $('prazo'),
        pendencias = $('pendencias'),
        fieldsets = $$('div#weekdays > fieldset');

    var dayNames = $$('datalist#days option').map(
        function (option) { return option.value; }
      );

    var loadData = function () {
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
          var rows = this.responseText.split(/\n|\r|\r\n/g);
          var values = rows.shift().split('|');
          prazo.value = values[0];
          prazo.setAttribute("valor", values[0]);
          pendencias.value = values[1];
          pendencias.setAttribute("valor", values[1]);
          rows.forEach(
            function (row) {
              values = row.split('|');
              var dayNumber = parseInt(values[0]),
                allowed = parseInt(values[1]),
                surrogate = parseInt(values[2]);
              var inputs = fieldsets[dayNumber].querySelectorAll('input');
              inputs[0].checked = inputs[1].readOnly = (allowed == 1);
              inputs[0].setAttribute("valor", allowed);
              inputs[1].value = dayNames[surrogate];
              inputs[1].setAttribute("valor", dayNames[surrogate]);
            });
        };
      }
      xhr.open("GET", uri + '?action=GETREC', true);
      xhr.send();
    };

    $('updateBtn').onclick = function saveData() {
      var par = '';
      [prazo, pendencias].forEach(
        function (input) {
          par += '&' + input.id + '=' + encodeURIComponent(input.value);
        });
      fieldsets.forEach(
        function (fieldset, index) {
          par += '&weekday' + index;
          var datum = [fieldset.querySelector('legend').textContent];
          var inputs = fieldset.querySelectorAll('input');
          datum.push(inputs[0].checked ? 1 : 0);
          datum.push(inputs[1].value);
          par += '=' + encodeURIComponent(datum.join('|'));
        });
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
          //
        };
      }
      xhr.open("GET", uri + '?action=SAVEREC' + par, true);
      xhr.send();
    };

    [prazo, pendencias].forEach(
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
          // executa contra-medida se conteúdo está vazio ao perder o foco
          function (ev) {
            var t = (ev || event).target;
            if (t.value.length == 0) t.value = t.getAttribute("valor");
          }, true);

      });

    $$('#weekdays fieldset').forEach(
      function (fieldset) {
        var input = fieldset.children[1].firstElementChild;
        input.onchange = function (ev) {
          var t = (ev || event).target;
          var c = t.parentElement.nextElementSibling.firstElementChild;
          c.readOnly = t.checked;
        }
      });

    loadData.apply(this);

  }, true);