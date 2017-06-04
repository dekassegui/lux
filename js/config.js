/**
 * Este script é parte do projeto LUX, software livre para bibliotecas de
 * casas Espíritas, em desenvolvimento desde 12/11/2016.
 *
 * Atende exclusivamente a UI de configuração de empréstimos.
*/

$(document).ready(function () {

  /**
   * URI do script backend que consulta o DB.
  */
  const uri = location.href.replace("html", "php");

  var SPINNER = new Spinner("header");

  StyleManager.load();

  $(window).on({"unload":function(){StyleManager.save();}});

  /**
   * Gestor do botão que efetiva a atualização quando clicado.
  */
  var BUTTON = (function () {

    const button = $("#updateBtn");

    var N;  /* contador de "inputs" editados */

    function reset() { N = 0; button.prop("disabled", true); }

    this.setOnClick = function (callback)
    {
      button.click(callback).click(reset);
    };

    this.update = function (b)
    {
      button.prop("disabled", !!!(b ? ++N : --N));
    };

    reset();

    return this;

  })();

  /**
   * Gestor dos inputs dos parâmetros numéricos para cálculo de "datas limite"
   * e validação dos empréstimos.
  */
  var BANGO = (function () {

    var inputs = $.map($("#emprestimos input"), function (e) { return $(e); });

    /**
     * Cancela o evento se a tecla pressionada não for digito entre "0" e "9",
     * inclusive as do Numpad, Enter, Tab, Del, Backspace, Left, Right, Home,
     * End, Escape e Ctrl-Z.
    */
    function onKeyDown(ev) {
      var c = ev.which;
      if ((c < 48 || c > 57) && (c < 96 || c > 105)
        && !(c == 90 && ev.ctrlKey) // Ctrl-Z :: undo command
        && (binarySearch([8, 9, 13, 27, 35, 36, 37, 39, 46], c) == -1))
      {
        ev.preventDefault();
      }
    }

    /**
     * Restaura valor original se sair da edição com string vazia.
    */
    function onBlur(ev) {
      var t = $(ev.target);
      if (t.val().length == 0) t.val( t.attr("valor") );
    }

    /**
     * Alterna a classe CSS que evidencia o "label" do "input" conforme
     * modificação de seu valor e invoca a atualização de BUTTON usando
     * o mesmo resultado da comparação logica.
    */
    function onChange(ev) {
      var t = $(ev.target);
      var status = (t.attr("valor") != t.val());
      t.parent().toggleClass("modified", status);
      BUTTON.update(status);
    }

    this.setValues = function (aValues)
    {
      for (var j=0; j<2; ++j) {
        inputs[j].val(aValues[j]).attr("valor", aValues[j])
          .parent().removeClass("modified");
      }
    };

    this.getValues = function ()
    {
      return inputs[0].val() + "|" + inputs[1].val();
    };

    for (var j=0; j<2; ++j)
    {
      inputs[j].keydown(onKeyDown).change(onChange).blur(onBlur);
    }

    return this;

  })();

  /**
   * Gestor dos inputs da máscara de bits que representa o status de
   * atendimento nos "dias da semana".
  */
  var MASK = (function () {

    var inputs = $.map($("#weekdays input"), function (e) { return $(e); });

    var mask;  /* valor reduzido da máscara de bits */

    /**
     * Testa o status de "bit" componente do valor reduzido da máscara.
     *
     * @param n Integer primitivo, número de ordem do bit a testar,
     *          da direita para a esquerda.
     * @return Boolean, "true" se o bit está ligado, senão "false".
    */
    function chkBit(n) { return !!((mask >> n) & 1); }

    function onChange(ev) {
      var t = $(ev.target);
      var status = (chkBit(parseInt(t.attr("index"))) != t.prop("checked"));
      t.parent().toggleClass("modified", status);
      BUTTON.update(status);
    }

    /**
     * Checa os "inputs" conforme status de cada bit do valor reduzido da
     * máscara.
     *
     * @param newValue Integer primitivo, novo valor reduzido da máscara.
    */
    this.setValue = function (newValue)
    {
      mask = newValue;
      for (var j=0; j<7; ++j) {
        inputs[j].prop("checked", chkBit(j)).parent().removeClass("modified");
      }
    };

    /**
     * Calcula o valor reduzido da máscara.
     *
     * @return Integer primitivo, valor reduzido da máscara.
    */
    this.getValue = function ()
    {
      return inputs.reduce(
        function (acc, input, index) {
          return input.prop("checked") ? acc | (1 << index) : acc;
        }, 0);
    };

    for (var j=0; j<7; ++j) inputs[j].attr("index", j).change(onChange);

    return this;

  })();

  /**
   * Requisita e carrega registro container da configuração de empréstimos.
  */
  function loadConfig() {
    SPINNER.run();
    $.get(
      uri + "?action=GETREC",
      function (texto) {
        // monta o array dos valores :: [prazo, pendencias, weekdays]
        // particionando a string container dos dados requisitados
        var values = texto.split("|");
        // preenche inputs dos parâmetros numéricos
        BANGO.setValues(values);
        // preenche inputs dos "dias da semana"
        MASK.setValue(parseInt(values[2]));
        SPINNER.stop();
      });
  }

  /**
   * Salva a configuração editada,
  */
  function saveConfig() {
    $.get(
      uri + "?action=UPDATE&CFG=" + BANGO.getValues() + "|" + MASK.getValue(),
      function (texto) {
        var msg = (texto.length == 0) ? "<p>Atualização desnecessária.</p>" :
              "<p>" + texto.replace(/(['"])([^'"]+)\1/g, "<strong>$2</strong>")
         .replace(/:\s*/g, ":<br>").replace(/\r\n|\n|\r/g, "</p><p>") + "</p>";
        show("\uF06A Informação", msg);
      }).done(loadConfig);
  }

  BUTTON.setOnClick(saveConfig);

  $(document).tooltip(TOOLTIP_OPTIONS);

  loadConfig();

  SPINNER.stop();

});