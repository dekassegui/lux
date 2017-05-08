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

  var mural = $(expression || "textarea");

  mural.after('<button id="cleaner">Esvaziar</button>').on(
    {
      "input": function () {
          mural.toggleClass("empty", cleaner[0].disabled = self.isEmpty());
        },
      "keyup mouseup scroll": posiciona
    });

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

  var cleaner = $("#cleaner").click(
    function () {
      mural.val("").trigger("input");
      posiciona();
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

  $(window).resize(posiciona).resize( /* posicionamento inicial */ );

  // inicia o mural com saudação em função da hora local
  mural[0].value = ["> Boa noite!", "> Bom dia!", "> Boa tarde!"]
    [Math.floor(new Date().getHours() / 6) % 3];

  return this;
}

/**
 * Apresenta conteúdo num pseudo popup sweet-alert.
*/
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
 * Desabilita os elementos no "array" conforme valor de "bool".
*/
function setDisabled(array, bool) {
  for (var n=array.length-1; n>=0; --n) array[n][0].disabled = bool;
}