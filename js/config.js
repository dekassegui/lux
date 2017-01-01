/**
 * Este script é parte do projeto LUX, software livre para bibliotecas de
 * casas Espíritas, em desenvolvimento desde 12/11/2016.
*/

window.addEventListener('load',
  function () {

    // URI do script "server side" que atende requisições ao DB
    var uri = location.href.replace("html", "php");

    var KASHITE = (function () {

      var inputs = $$('div#emprestimos input');

      function onKeyDown(ev) {
        // cancela o evento se a tecla pressionada não for digito entre
        // 0 e 9 (inclusive as do Numpad), Enter, Tab, Del, Backspace,
        // Left, Right, Home, End, Escape e Ctrl-Z
        ev = ev || event;
        var c = ev.keyCode;
        if ((c < 48 || c > 57) && (c < 96 || c > 105)
          && !(c == 90 && ev.ctrlKey) // Ctrl-Z :: undo command
          && (binarySearch([8, 9, 13, 27, 35, 36, 37, 39, 46], c) == -1))
        {
          ev.preventDefault();
        }
      }

      function onBlur(ev) {
        // restaura valor original se sair da edição com string vazia
        var t = (ev || event).target;
        if (t.value.length == 0) t.value = t.getAttribute("valor");
      }

      function onChange(ev) {
        var t = ev.target;
        if (t.getAttribute("valor") != t.value) {
          t.parentElement.classList.add("modified");
        } else {
          t.parentElement.classList.remove("modified");
        }
      }

      this.setValues = function (aValues) {
        for (var j=0; j<2; ++j) {
          inputs[j].value = aValues[j];
          inputs[j].setAttribute("valor", aValues[j]);
          inputs[j].parentElement.classList.remove("modified");
        }
      };

      this.getValues = function () {
        return inputs[0].value + '|' + inputs[1].value;
      };

      for (var j=0; j<2; ++j) {
        inputs[j].addEventListener('keydown', onKeyDown, true);
        inputs[j].addEventListener('blur', onBlur, true);
        inputs[j].addEventListener('change', onChange, true);
      }

      return this;

    })();

    var MASK = (function () {

      var inputs = $$('div#weekdays input');

      var value;

      function chkBit(n) { return !!((value >> n) & 1); }

      function onChange(ev) {
        var t = ev.target;
        if (chkBit(parseInt(t.getAttribute("index"))) != t.checked) {
          t.parentElement.classList.add("modified");
        } else {
          t.parentElement.classList.remove("modified");
        }
      }

      this.setValue = function (aValue) {
        value = aValue;
        for (var j=0; j<7; ++j) {
          inputs[j].checked = chkBit(j);
          inputs[j].parentElement.classList.remove("modified");
        }
      };

      this.getValue = function () {
        return inputs.reduce(
          function (acc, input, index) {
            return input.checked ? acc | (1 << index) : acc;
          }, 0);
      };

      for (var j=0; j<7; ++j) {
        inputs[j].setAttribute("index", j);
        inputs[j].addEventListener('change', onChange, true);
      }

      return this;

    })();

    $('updateBtn').onclick = function () {
      if ($$("label").some(el => el.classList.contains("modified"))) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
          if (this.readyState == 4 && this.status == 200) {
            alert(this.responseText);
            loadConfig();
          }
        };
        xhr.open("GET", uri + '?action=UPDATE&CFG='
          + KASHITE.getValues() + '|' + MASK.getValue(), true);
        xhr.send();
      } else {
        alert('Atualização desnecessária.');
      }
    };

    function loadConfig() {
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
          // monta o array dos valores :: [prazo, pendencias, weekdays]
          // particionando a string container dos dados requisitados
          var values = this.responseText.split('|');
          // preenche valores dos parâmetros numéricos
          KASHITE.setValues(values);
          // preenche valores dos 'dias da semana'
          MASK.setValue(parseInt(values[2]));
        }
      };
      xhr.open("GET", uri + '?action=GETREC', true);
      xhr.send();
    }

    loadConfig();

  }, true);