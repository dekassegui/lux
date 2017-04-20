/**
 * Este script é parte do projeto LUX, software livre para bibliotecas de
 * casas Espíritas, em desenvolvimento desde 12/11/2016.
*/

/**
 * Script para apresentação dos relatórios do DB com animação da rolagem,
 * controlada pelo usuário.
*/
$(document).ready(function WINDOW_SCROLLER() {

  const MOUSE_LEFT_BUTTON = 0;    // serial do botão esquerdo do mouse
  const MINIMUM_DURATION  = 500;  // mínima duração da animação
  const SHORT_TM          = 1000; // curto tempo de rolagem de uma window
  const LONG_TM           = 5000; // longo tempo de rolagem de uma window

  var win = $(window);

  var header = $("header");

  var status = false;

  /**
   * Ativa ou desativa a rolagem da window conforme tecla(s) pressionada
   * simultaneamente tal que <Ctrl> controla a direção e <Shift> a velocidade,
   * com duração mínima restrita a um valor constante.
  */
  header.click(function (ev) {
      if (ev.button == MOUSE_LEFT_BUTTON) {
        if (status=!status) {
          var y = ev.ctrlKey ? 0 : window.scrollMaxY; // destino arbitrário
          var len = Math.abs(y - window.scrollY);     // distância até destino
          var tm = ev.shiftKey ? SHORT_TM : LONG_TM;  // tempo/win arbitrário
          tm *= len / window.innerHeight;             // duração a priori
          win.scrollTo(y, {
              duration: Math.max(tm, MINIMUM_DURATION),
              onAfter: function () { status = false; },
              easing: "linear"
            });
        } else {
          win.stop();
        }
      }
    }).attr("title", "clique ou <Ctrl>+clique para rolar abaixo ou acima");

  /**
   * Finaliza a rolagem quando "alguma" tecla for pressionada.
  */
  win.keypress(function (ev) {
      if (status) {
        ev.preventDefault();
        header.trigger(jQuery.Event("click", { button: MOUSE_LEFT_BUTTON }));
      }
    });

});