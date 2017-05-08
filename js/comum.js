/**
 * Este script é parte do projeto LUX.
*/

/**
 * Gestor de TEXTAREA com preenchimento cumulativo de conteúdo, que pode ser
 * esvaziado quando BUTTON incorporado para essa finalidade é acionado.
 *
 * @param expression String de pesquisa do elemento do tipo TEXTAREA, ou o
 *                   próprio, com valor default "textarea" caso indefinido.
*/
function Mural(expression) {

  var mural = $(expression || "textarea:first-child");

  mural.on({
      "input": function () {
          mural.toggleClass("empty", cleaner[0].disabled = self.isEmpty());
        },
      "focusout": posiciona,
    }).parent().append('<button id="cleaner">Esvaziar</button>');

  this.isEmpty = function () { return mural[0].textLength == 0; };

  var lineHeight = parseInt(mural.css("line-height"));

  var self = this;

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

  var cleaner = $("#cleaner").css("position", "relative").click(
    function () {
      mural.val("").trigger("input");
      posiciona();
    });

  var top = cleaner.css("top");
  var left = cleaner.css("left");

  // sobreposiciona #cleaner no canto superior direito do TEXTAREA
  function posiciona() {
    var value = "-" + (mural.outerHeight() + 4) + "px";
    if (value != self.top) cleaner.css("top", self.top = value);
    value = (mural[0].scrollHeight > mural[0].clientHeight) ? 18 : 2;
    value = (mural.outerWidth() - cleaner.outerWidth() - value) + "px";
    if (value != self.left) cleaner.css("left", self.left = value);
  }

  $(window).resize(posiciona).resize( /* posicionamento inicial */ );

  // inicia o mural com saudação em função da hora local
  mural[0].value = ["> Boa noite!", "> Bom dia!", "> Boa tarde!"]
    [Math.floor(new Date().getHours() / 6) % 3];

  return this;
}

function show(text) {
  swal({
      html: true,
      title: null,
      text: text.replace(/\r\n|\n|\r/g, "<br>"),
      confirmButtonText: "Fechar",
      confirmButtonColor: "#ff9900",
      allowEscapeKey: true,
    });
}

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

function setDisabled(array, bool) {
  array.forEach(function ($item) { $item[0].disabled = bool; });
}