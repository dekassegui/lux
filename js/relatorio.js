$(document).ready(function WINDOW_SCROLLER() {

  var win = $(window);

  var working = false;

  win.extend( win.scrollTo.defaults, { easing: "sweep" } );

  $("header").click(function (ev) {
      if (working) {
        win.stop();
      } else {
        var y = ev.ctrlKey ? 0 : window.scrollMaxY;
        var distance = Math.abs(y - window.scrollY);
        var tm = (distance / 100 + 1) * 50;
        win.scrollTo(y, {
            duration: Math.min(Math.max(tm, 1000), 20000),
            onAfter: function () { working = false; }
          });
      }
      working = !working;
    })
    .attr("title", "[<Ctrl> +] clique aqui para escorrer abaixo/acima ou parar");

});