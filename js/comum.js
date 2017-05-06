/**
 * Este script é parte do projeto LUX.
*/

function Mural(iD) { // ÁREA DE NOTIFICAÇÕES AO USUÁRIO

  var mural = document.getElementById(iD || "mural");

  var lineHeight = parseInt(jQuery(mural).css("line-height"));

  mural.oninput = function () {
    if (mural.textLength == 0) {
      mural.classList.add("empty");
      cleaner.disabled = true;
    } else {
      mural.classList.remove("empty");
      cleaner.disabled = false;
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
        mural.value += "\n" + text;
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

  // adiciona botão para esvaziar o mural quando clicado
  var cleaner = document.createElement("BUTTON");
  cleaner.id = "cleaner";
  cleaner.textContent = "Esvaziar";
  mural.parentElement.appendChild(cleaner);
  cleaner.onclick = function () {
    mural.value = "";
    mural.oninput();
  };

  // posiciona botão à direita no topo :: vide CSS
  function posiciona() {
    cleaner.style.top = "-" + (mural.clientHeight + 6) + "px";
    cleaner.style.left = (mural.clientWidth - cleaner.offsetWidth - 16) + "px";
  }

  window.addEventListener("resize", posiciona, true);

  posiciona();  // posicionamento inicial do button

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
  array.forEach(function (item) { item[0].disabled = bool; });
}