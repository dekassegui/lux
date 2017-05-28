/**
 * Este script é parte do projeto LUX.
*/

const TOOLTIP_OPTIONS = {
  content: function (ui) {        // indispensável para conteúdo HTML
    return $(this).attr("title");
  },
  track: true,
  position: { my: "left+20 top+20", at: "right bottom" },
  show: { effect: "fade", duration: 500, delay: 1500 },
  hide: { effect: "fade", duration: 500 },
};

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
 * Gestor de persistência de folhas de estilo temáticas.
*/
function StyleSwitcher() {

  var self = this;

  var links = $("link[rel$='stylesheet'][title]").toArray().map($);

  function search(callback) {
    var a = links.find(callback);
    return (a === undefined) ? null : a.attr("title");
  }

  this.getActiveStyleSheet = function () {
    return search(
        function (a) { return !a.prop("disabled"); }
      );
  };

  this.getPreferredStyleSheet = function() {
    return search(
        function (a) { return !a.attr("rel").startsWith("alternate"); }
      );
  };

  this.setActiveStyleSheet = function (title) {
    links.forEach(
      function (a) { a.prop("disabled", a.attr("title") != title); }
    );
  };

  function isValid(title) {
    return title && links.some(
      function (a) { return a.attr("title") == title; });
  }

  this.save = function (title) {
    localStorage.setItem("style",
      isValid(title) ? title : self.getActiveStyleSheet());
  };

  this.load = function () { return localStorage.getItem("style"); };

  /**
   * Cache "persistente" do título da folha de estilo ativa.
  */
  window.addEventListener("unload", function () { self.save(); }, true);

  /**
   * Ativa a folha de estilo preferencial se não há título válido em cache.
  */
  (
    function (title) {
      self.setActiveStyleSheet(
        isValid(title) ? title : self.getPreferredStyleSheet());
    }
  )(self.load());

  return this;
}

function Spinner(parent) {

  var scope = parent;

  var spinner = $('<img src="img/gear.png" class="ld ld-cycle"/>').appendTo(parent);

  function toggle() { spinner.toggleClass("paused"); }

  this.stop = this.run = function () { toggle.apply(scope); };

  return this;
}

function Tips(array, message) {

  this.add = function () {
    for (var j=array.length-1; j>=0; --j)
      array[j].addClass("help").attr("title", message).tooltip(TOOLTIP_OPTIONS);
  };

  this.remove = function () {
    for (var j=array.length-1; j>=0; --j)
      array[j].removeClass("help").removeAttr("title").tooltip("destroy");
  };

  return this;
}