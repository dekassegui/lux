/**
 * Este script é parte do projeto LUX.
*/

function Mural(iD) {

  var mural = $(iD || 'mural');  // área de notificações ao usuário

  var lineHeight = parseInt(getCSSproperty(mural, 'line-height'));

  mural.oninput = function () {
    if (mural.textLength == 0) {
      mural.classList.add('empty');
    } else {
      mural.classList.remove('empty');
    }
  };

  // agrega 'text' como apêndice do conteúdo da textarea cujo canvas
  // escorre até que 'text' seja visível tão ao topo quanto possível
  this.append = function (text) {
    if (text.map) {
      text.map(this.append);
    } else {
      var a = mural.clientHeight,   // altura do canvas
          b = mural.scrollHeight;   // altura do conteúdo a priori
      if (mural.textLength > 0) {
        mural.value = [mural.value, text].join("\n");
      } else {
        mural.value = text;
        mural.oninput();
      }
      if (b > a) {
        mural.scrollTop = b - lineHeight;
      }
    }
  };

  this.isEmpty = function() { return mural.textLength == 0; };

  // inicia o mural com saudação em função da hora local
  mural.value = ["> Boa noite!", "> Bom dia!", "> Boa tarde!"]
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
