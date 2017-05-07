/**
 * Este script é parte do projeto LUX.
*/

/**
 * Gestor de TEXTAREA que agrega BUTTON para esvaziar o conteúdo.
 *
 * @param expression String de pesquisa do elemento, ou o próprio, do tipo
 *          TEXTAREA, com valor default "textarea".
*/
function Mural(expression) {

  var mural = $(expression || "textarea");

  mural.parent().append('<button id="cleaner">Esvaziar</button>');

  var cleaner = $("#cleaner").click(
    function () {
      mural.val("").trigger("input");
    });

  this.isEmpty = function() { return mural[0].textLength == 0; };

  var self = this;

  mural.bind("input",
    function () {
      mural.toggleClass("empty", cleaner[0].disabled = self.isEmpty());
    });

  var lineHeight = parseInt(mural.css("line-height"));

  // agrega 'text' como apêndice do conteúdo da textarea cujo canvas
  // escorre até que 'text' seja visível tão ao topo quanto possível
  this.append = function (text) {
    if (text.map) {
      text.map(this.append);
    } else {
      var a = mural[0].clientHeight,   // altura do canvas
          b = mural[0].scrollHeight;   // altura do conteúdo a priori
      if (mural[0].textLength > 0) {
        mural[0].value += "\n" + text;
      } else {
        mural.val(text).trigger("input");
      }
      if (b > a) {
        mural[0].scrollTop = b - lineHeight;
      }
    }
  };

  // posiciona #cleaner à direita no topo :: vide CSS
  $(window).resize(
    function () {
      cleaner.css("top", "-" + (mural.outerHeight() + 4) + "px")
        .css("left", (mural.outerWidth() - cleaner.outerWidth() - 18) + "px");
    }).resize( /* posicionamento inicial */ );

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