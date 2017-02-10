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
     * Gestor do botão que efetiva a atualização.
    */
    var BUTTON = (function () {

      var N, button = $("updateBtn");

      function reset() { N = 0; button.disabled = true; }

      this.setOnClick = function (callback) {
        button.addEventListener('click', callback, true);
        button.addEventListener('click', reset, true);
      };

      this.update = function (b) { button.disabled = !!!(b ? ++N : --N); };

      reset();

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
        var c = t.parentElement.classList;
        if (t.getAttribute("valor") != t.value) {
          if (!c.contains("modified")) {
            c.add("modified");
            BUTTON.update(true);
          }
        } else {
          if (c.contains("modified")) {
            c.remove("modified");
            BUTTON.update(false);
          }
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
        var b, t = ev.target;
        if (b = (chkBit(parseInt(t.getAttribute("index"))) != t.checked)) {
          t.parentElement.classList.add("modified");
        } else {
          t.parentElement.classList.remove("modified");
        }
        BUTTON.update(b);
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
     * Carrega a configuração efetiva, requisitada ao script "server side".
    */
    function loadConfig() {
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
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

    BUTTON.setOnClick(
      /**
       * Salva a configuração editada, requisitando atualização, reportando
       * seu resultado e finalmente, recarregando a configuração efetiva.
      */
      function /* saveConfig */ () {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
          if (this.readyState == 4 && this.status == 200) {
            var text = "<p>" + this.responseText
              .replace(/(['"])([^'"]+)\1/g, "<strong>$2</strong>")
              .replace(/:\s*/g, ":<br>")
              .replace(/\r\n|\n|\r/g, "</p><p>") + "</p>";
            swal({
                html: true,
                title: null,
                text: text,
                confirmButtonText: "Fechar",
                confirmButtonColor: "#ff9900",
                allowEscapeKey: true,
              }, loadConfig);
          }
        };
        xhr.open("GET", uri + '?action=UPDATE&CFG='
          + BANGO.getValues() + '|' + MASK.getValue(), true);
        xhr.send();
      });

    loadConfig();

  }, true);