/**
 * Este script é parte do projeto LUX.
*/

const TOOLTIP_OPTIONS = {
  content: function (ui) {
    return $(this).attr("title"); // indispensável para conteúdo HTML
  },
  track: true,
  position: { my: "left+20 top+20", at: "right bottom" },
  show: { effect: "fade", duration: 500, delay: 1500 },
  hide: { effect: "fade", duration: 500 },
};

/**
 * Gestor da ativação de Tooltips atrelados a um ou mais elementos jQuery
 * para apresentar a mesma mensagem.
 *
 * @param array Array de elements jQuery.
 * @param message String container da mensagem.
*/
function Tips(array, message) {

  for (var j=array.length-1; j>=0; --j) {
    array[j].addClass("help").attr("title", message).tooltip(TOOLTIP_OPTIONS);
  }

  function set(status) {
    const action = ["disable", "enable"];
    for (var j=array.length-1; j>=0; --j)
      array[j].toggleClass("help", status).tooltip(action[+status]);
  }

  set(false);

  this.enable = function () { set(true); };

  this.disable = function () { set(false); };

  return this;
}

/**
 * Gestor de TEXTAREA com preenchimento cumulativo de conteúdo, que pode ser
 * esvaziado quando BUTTON incorporado para essa finalidade é acionado.
 *
 * @param expression String de pesquisa do elemento do tipo TEXTAREA, ou o
 *                   próprio, com valor default "textarea" caso indefinido.
*/
function Mural(expression) {

  var mural = $(expression || "textarea");

  var cleaner = $('<button id="cleaner">Esvaziar</button>').click(
    function () {
      mural.val("").trigger("input");
    });

  // sobreposiciona #cleaner no canto superior direito do TEXTAREA
  function posiciona() {
    var mo = mural.offset();
    mo.top += 2;
    mo.left += mural.outerWidth() - cleaner.outerWidth()
      - ((mural[0].scrollHeight > mural[0].clientHeight) ? 18 : 2);
    var co = cleaner.offset();
    if (co.top != mo.top || co.left != mo.left) cleaner.offset(mo);
  }

  cleaner.click(posiciona);

  var self = this;

  this.isEmpty = function () { return mural[0].textLength == 0; };

  mural.after(cleaner).on(
    {
      "input": function () {
          mural.toggleClass("empty", cleaner[0].disabled = self.isEmpty());
        },
      "keyup mouseup scroll": posiciona
    });

  var lineHeight = parseInt(mural.css("line-height"));

  // agrega "text" como apêndice do conteúdo do TEXTAREA, cujo canvas
  // rola até que o "text" seja visível tão ao topo quanto possível
  this.append = function (text) {
    if (text.map) {
      text.map(this.append);
    } else {
      var a = mural[0].clientHeight,   // altura do canvas
          b = mural[0].scrollHeight;   // altura do conteúdo a priori
      if (self.isEmpty()) {
        mural.val(text).trigger("input");
      } else {
        mural[0].value += "\n" + text;
      }
      if (b > a) {
        mural[0].scrollTop = b - lineHeight;
      }
      posiciona();
    }
  };

  $(window).resize(posiciona).resize( /* posicionamento inicial */ );

  // inicia o mural com saudação em função da hora local
  mural[0].value = ["> Boa noite!", "> Bom dia!", "> Boa tarde!"]
    [Math.floor(new Date().getHours() / 6) % 3];

  return this;
}

/**
 * Apresenta conteúdo HTML numa janela modal dragável.
 *
 * @param title String container do título.
 * @param text  String container do conteúdo.
*/
function show(title, text) {
  $("<div>" + text.replace(/\r\n|\n|\r/g, "<br>") + "</div>").dialog({
      classes: { "ui-dialog": "ui-corner-all" },
      buttons: [{
          text: "Fechar",
          click: function () { $(this).dialog("close"); }
        }],
      show: { effect: "fade", duration: 750 },
      hide: { effect: "fade", duration: 750 },
      title: title,
      minHeight: 300,
      width: 533,
      modal: true,
      resizable: false,
    });
}

/**
 * Pesquisa "key" no "array" ordenado em ordem crescente, retornando o
 * índice do item coincidente ou -1 se não encontrado.
*/
function binarySearch(array, key) {
  var lo = 0, hi = array.length - 1, mid, element;
  while (lo <= hi) {
    mid = ((lo + hi) >> 1);
    element = array[mid];
    if (element < key) {
      lo = mid + 1;
    } else if (element > key) {
      hi = mid - 1;
    } else {
      return mid;
    }
  }
  return -1;
}

/**
 * Workaround para disparar evento na modificação da propriedade "disabled"
 * exclusivamente via jQuery.
*/
jQuery.propHooks.disabled = {
  set: function (el, value) {
    if (el.disabled !== value) {
      el.disabled = value;
      value && $(el).trigger("disabledSet");
      !value && $(el).trigger("enabledSet");
    }
  }
};

/**
 * Desabilita os elementos no "array" conforme "value".
*/
function setDisabled(array, value) {
  for (var n=array.length-1; n>=0; --n) array[n].prop("disabled", value);
}

/**
 * Gestor de folhas de estilo temáticas, persistentes para cada dia da semana.
*/
var StyleManager = {

  dayOfWeek: function () {
      return ["DOM","SEG","TER","QUA","QUI","SEX","SÁB"][new Date().getDay()];
    },

  save: function () {
      // pesquisa pela folha de estilo "ativa"
      var a = $("link[rel$='stylesheet'][title]")
        .filter(function () { return !this.disabled; });
      // extrai o título se a pesquisa foi bem sucedida
      var title = a.length ? a.attr("title") : null;
      // cache persistente do título conforme dia da semana
      localStorage.setItem("style" + this.dayOfWeek(), title);
    },

  load: function () {
      // carrega o título de folha de estilo em cache persistente
      var title = localStorage.getItem("style" + this.dayOfWeek());
      var a, links = $("link[rel$='stylesheet'][title]");
      // seleciona a folha de estilo correspondente ao título ou a "preferida"
      if (!title || !(a = links.filter("[title='" + title + "']")).length)
        a = links.filter("[rel='stylesheet']");
      // ativa a folha de estilo selecionada
      links.each(function (i, x) { x.disabled = (a[0] != x); });
    }
};

/**
 * Gestor de ícone com animação controlada para evidenciar status de
 * processamento, adicionado como apêndice de algum elemento.
 *
 * Importante: Widget implementado conforme http://loading.io
 *
 * @param parent DOM element container do ícone.
*/
function Spinner(parent) {

  var scope = parent;

  var spinner = $('<img src="img/gear.png" class="ld ld-cycle"/>').appendTo(parent);

  function toggle() { spinner.toggleClass("paused"); }

  this.stop = this.run = function () { toggle.apply(scope); };

  return this;
}