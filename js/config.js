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

      this.addListener = function (x) {
        if (x.map) {
          x.map(this.addListener);
        } else {
          for (var j=0; j<2; ++j) {
            inputs[j].addEventListener(x.eventName, x.callback, true);
          }
        }
      };

      this.setValues = function (aValues) {
        for (var j=0; j<2; ++j) {
          inputs[j].value = aValues[j];
          inputs[j].setAttribute("valor", aValues[j]);
        }
      };

      this.getValues = function () {
        return [inputs[0].value, inputs[1].value];
      };

      this.modified = function () {
        return inputs.some(el => el.getAttribute("valor") != el.value);
      }

      return this;

    })();

    var MASK = (function () {

      var inputs = $$('div#weekdays input');

      var value;

      this.setValue = function (aValue) {
        value = aValue;
        for (var j=0; j<7; ++j) inputs[j].checked = !!((value >> j) & 1);
      };

      this.getValue = function () {
        var valor = 0;
        for (var j=0; j<7; ++j) if (inputs[j].checked) valor |= (1 << j);
        return valor;
      };

      this.modified = function () { return (this.getValue() != value); };

      return this;

    })();

    KASHITE.addListener([
      {
        eventName: 'keydown',
        callback: function (ev) {
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
      },
      {
        eventName: 'blur',
        callback: function (ev) {
          // restaura valor original se sair da edição com string vazia
          var t = (ev || event).target;
          if (t.value.length == 0) t.value = t.getAttribute("valor");
        }
      }]);


    $('updateBtn').onclick = function () {
      if (MASK.modified() || KASHITE.modified())
      {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
          if (this.readyState == 4 && this.status == 200) {
            alert(this.responseText);
            loadConfig();
          }
        };
        xhr.open("GET", uri + '?action=UPDATE&CFG='
          + KASHITE.getValues().join('|') + '|' + MASK.getValue(), true);
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
          // após particionar a string container dos dados requisitados
          var values = this.responseText.split('|').map(Number);
          KASHITE.setValues(values);
          MASK.setValue(values[2]);
        }
      };
      xhr.open("GET", uri + '?action=GETREC', true);
      xhr.send();
    }

    loadConfig();

  }, true);