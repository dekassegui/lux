/**
 * Este script é parte do projeto LUX.
*/

// Montagem de string container de sequência de options preenchidas
// com pares "code|valor" extraídos das linhas da string argumento.
function montaOptions(text) {
  var buffer = '';
  var i, j, k, m, r=(text.indexOf("\r\n") != -1)|0;
  for (i=0; (j=text.indexOf('|', i)) != -1; i=k+1) {
    k = text.indexOf("\n", j+1);
    m = (k != -1) ? (k - r) : (k = text.length);
    buffer += '<option code="' + text.substring(i, j) + '">'
      + text.substring(j+1, m) + '</option>';
  }
  return buffer;
}

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
      text.map(append);
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