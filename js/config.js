/**
 * Este script é parte do projeto LUX, software livre para bibliotecas de
 * casas Espíritas, em desenvolvimento desde 12/11/2016.
*/

/**
 * Listener que ativa comandos para controle "full time" do aplicativo
 * para gestão da tabela de configuração dos empréstimos no projeto LUX,
 * até o fim do seu "life cycle", indiferente a 'reloads' do documento.
*/
window.addEventListener('load',
  function () {

    /**
     * URI do script "server side" que atende requisições ao DB.
    */
    var uri = location.href.replace("html", "php");

    /**
     * Encapsulamento de propriedades e métodos agregados ao único
     * elemento do tipo button que dispara a atualização.
    */
    var ACTION = (function () {

      var button = $("updateBtn");

      var labels = $$("div#emprestimos label, div#weekdays label");

      this.setCallback = function (callback) { button.onclick = callback; };

      this.setDisabled = function (value) {
        button.disabled = (value === undefined) ? true : value;
      };

      this.update = function () {
        setDisabled( !labels.some(el => el.classList.contains("modified")) );
      };

      return this;

    })();

    /**
     * Gestor dos inputs dos parâmetros numéricos para cálculo
     * de "datas limite" e validação dos empréstimos.
    */
    var BANGO = (function () {

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
        ACTION.update();
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

    /**
     * Gestor dos inputs da máscara de bits que representa
     * o status de atendimento nos "dias da semana".
    */
    var MASK = (function () {

      var inputs = $$('div#weekdays input');

      var value;  /* valor reduzido da máscara de bits */

      /**
       * Testa o status de "bit" componente do valor reduzido da máscara.
       *
       * @param n Integer primitivo, número de ordem do bit a testar,
       *          da direita para a esquerda.
       * @return Boolean, "true" se o bit está ligado, senão "false".
      */
      function chkBit(n) { return !!((value >> n) & 1); }

      function onChange(ev) {
        var t = ev.target;
        if (chkBit(parseInt(t.getAttribute("index"))) != t.checked) {
          t.parentElement.classList.add("modified");
        } else {
          t.parentElement.classList.remove("modified");
        }
        ACTION.update();
      }

      /**
       * Checa os inputs conforme status de cada bit componente
       * do valor reduzido da máscara.
       *
       * @param Integer primitivo, valor reduzido da máscara.
      */
      this.setValue = function (aValue) {
        value = aValue;
        for (var j=0; j<7; ++j) {
          inputs[j].checked = chkBit(j);
          inputs[j].parentElement.classList.remove("modified");
        }
      };

      /**
       * Calcula o valor reduzido da máscara.
       *
       * @return Integer primitivo, valor reduzido da máscara.
      */
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

    /**
     * Carrega configuração requisitada ao script "server side".
    */
    function loadConfig() {
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
          ACTION.setDisabled();
          // monta o array dos valores :: [prazo, pendencias, weekdays]
          // particionando a string container dos dados requisitados
          var values = this.responseText.split('|');
          // preenche inputs dos parâmetros numéricos
          BANGO.setValues(values);
          // preenche inputs dos 'dias da semana'
          MASK.setValue(parseInt(values[2]));
        }
      };
      xhr.open("GET", uri + '?action=GETREC', true);
      xhr.send();
    }

    /**
     * Salva a configuração, enviando os valores dos parâmetros
     * e valor reduzido da máscara ao script "server side".
    */
    function saveConfig() {
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
          var text = '<div class="info">' + this.responseText.split(/\n+/g)
              .map(function (txt) {
                  return '<p>' + txt.replace(/"([^"]+)"/g,
                    '<strong>$1</strong>') + '</p>';
                })
              .join("") + '</div>';
          swal({
            title: null,
            text: text,
            html: true,
            type: "info",
            confirmButtonText: "Fechar",
            allowEscapeKey: true,
            allowOutsideClick: true
          });
          loadConfig();
        }
      };
      xhr.open("GET", uri + '?action=UPDATE&CFG='
        + BANGO.getValues() + '|' + MASK.getValue(), true);
      xhr.send();
    }

    ACTION.setCallback(saveConfig);

    loadConfig();

  }, true);