/**
 * Este script é parte do projeto LUX, software livre para bibliotecas
 * de casas Espíritas, em desenvolvimento desde 12/11/2016.
 *
 * Atende exclusivamente a UI de atendimento.
*/
$(document).ready(
  function () {

    // URI do script backend que atende requisições ao DB
    const uri = location.href.replace("html", "php");

    const aUri = uri.substring(0, uri.lastIndexOf("/")+1);

    var SPINNER = new Spinner("header");

    StyleManager.load();

    $(window).on({ "unload": function () { StyleManager.save(); } });

    // atrela calendário aos INPUTs de datas
    ["#data_emprestimo", "#data_devolucao"].forEach(
      function (element) {

        function zeroPad(x) { return (x < 10 ? "0" : "") + x; }

        $(element).datepicker({
            showAnim: "fade",
            duration: 1500,
            constrainInput: false,
            showOtherMonths: true,
            selectOtherMonths: true,
            beforeShow: function (input, object) {
                var $input = $(input).data("preserved", input.value);
                var t = $input.tooltip("instance");
                if (t) t.close();
              },
            onClose: function (dateText, instance) {
                var oldValue = $(this).data("preserved");
                if (this.readOnly) {
                  if (dateText != oldValue) {
                    if (oldValue !== undefined) this.value = oldValue;
                    var msg = "<p>O campo está disponível <strong>somente para leitura</strong>.</p>\n<p>Clique no botão <b>\uf040&nbsp;Atualizar</b> ";
                    if (this.id == "data_devolucao") msg += "ou em <b>\uf040&nbsp;Devolução</b>";
                    msg += " para digitar ou selecionar a data no calendário.</p>"
                    show("\uF06A READ ONLY", msg);
                  }
                } else {
                  if (dateText.length == 10) {
                    var date = new Date();
                    var hoje = zeroPad(date.getDate()) + "-"
                      + zeroPad(date.getMonth()+1) + "-" + date.getFullYear();
                    if (dateText == hoje) {
                      this.value = hoje + " " + zeroPad(date.getHours()) + ":"
                        + zeroPad(date.getMinutes());
                    }
                  }
                  // se houver modificação da data de empréstimo durante
                  // atualização do registro, então esvaziará o campo do
                  // comentário sobre a data limite que será recalculada
                  if (this.id == "data_emprestimo" && dateText != oldValue
                      && updateBtn.hasClass("working")) {
                    fields[8].val("");
                  }
                }
              },
          });
      });

    var FIELDS_PARENT = $("section > div").has("#fields");

    /*
     * Gestor de rolagem da WINDOW e da tangibilidade do formulário.
    */
    var SCROLLER = (
      function () {

        var h = $("header h1");
        var b = false;                          // status da tangibilidade

        function updateTip() {
          const par = [ { "action":"restaurar", "cor":"forestgreen" },
                        { "action":"ocultar", "cor":"darkblue" } ];
          h.tooltip("close");
          h.attr("title",
            "clique aqui para <b>" + par[+(b=!b)].action + " o formulário</b>")
            .css({ "color": par[+b].cor });
        }

        var w = $(window.opera ? "html" : "html, body");

        var t = $('<button id="GoTop">Go Top!</button>').click(
          function () {
            w.animate({ scrollTop: 0 }, 2000, "easeOutExpo");
          }).insertAfter( $("textarea") );

        var self = this;

        this.slideOptions = { duration: 1000, easing: "swing" };

        this.scroll = function (full) {
          t.click();
          if (full) {
            FIELDS_PARENT.slideToggle(self.slideOptions);
            updateTip.apply(this);
          }
        };

        var letterSpacing = { onEnter: h.css("letter-spacing") };

        letterSpacing.onExit = (5 * parseFloat(letterSpacing.onEnter)) + "px";

        h.tooltip(TOOLTIP_OPTIONS).click(function () { self.scroll(true); })
          .hover(
            function () {
              h.animate({ "letter-spacing": letterSpacing.onExit });
            },
            function () {
              h.animate({ "letter-spacing": letterSpacing.onEnter });
            });

        updateTip();

        return this;
      }
    )();

    var indexRec,                 // índice do registro corrente
        counter = $("#counter");  // input do índice do..

    var numRecs,                  // quantidade de registros da tabela
        amount  = $("#amount");   // input da quantidade de..

    var fields = [$("#bibliotecario"), $("#data_emprestimo"),
      $("#data_devolucao"), $("#leitor"), $("#obra"), $("#autor"),
      $("#exemplar"), $("#posicao"), $("#comentario")];

    var INFO_FIELDS_TIPS = new Tips([fields[5], fields[7], fields[8]], "este campo é <b>AUTO PREENCHIDO</b> e está disponível <b>SOMENTE PARA LEITURA</b>");

    var EXEMPLAR_TIPS = new Tips([fields[6]], "este campo está <span>MOMENTANEAMENTE</span> disponível <b>SOMENTE PARA LEITURA</b>");

    var DATA_DEVOLUCAO_TIP = new Tips([fields[2]], "somente neste campo, <cite>NULL</cite> é parâmetro para <b>pesquisar registros cuja</b> <strong>Data de Devolução</strong> <b>não foi preenchida</b> ou seja; <b>o exemplar não foi devolvido</b> e se o campo <i>está vazio</i> ou seja; <i>não tem conteúdo</i>, então <i>será ignorado na pesquisa</i>");

    var firstBtn  = $("#firstBtn"),  previousBtn = $("#previousBtn"),
        nextBtn   = $("#nextBtn"),   lastBtn     = $("#lastBtn");

    var updateBtn = $("#updateBtn"),   delBtn    = $("#delBtn"),
        searchBtn = $("#searchBtn"),   newBtn    = $("#newBtn"),
        saveBtn   = $("#saveBtn"),     cancelBtn = $("#cancelBtn"),
        infoBtn   = $("#cmd01Btn"),    leitorBtn = $("#cmd02Btn");

    var commandButtons = [updateBtn, delBtn, searchBtn, newBtn, infoBtn, leitorBtn];

    var actionButtons = [saveBtn, cancelBtn];

    // gestor/montador de elementos do tipo LABEL adaptados como BUTTON
    // para acionar a atualização e criação de registros de empréstimos
    var FAKE_BUTTONS = (
      function () {

        function busy() {
          var i=3;
          while (i>=0 && !commandButtons[i].hasClass("working")) --i;
          return i>=0;
        }

        var lde = $('label[for="data_emprestimo"]').addClass("alive").click(
          function (ev) {
            if (busy()) return;
            ev.preventDefault();
            newBtn.click();
          }).attr("title", "clique aqui para <b>registrar</b> <strong>Empréstimo</strong><br>&#x2012; <b>equivale a clicar no botão <span>\uf067&nbsp;Novo</span></b>").tooltip(TOOLTIP_OPTIONS);

        var ldd = $('label[for="data_devolucao"]').addClass("alive").click(
          function () {
            if (busy()) return;
            updateBtn.click();
          }).attr("title", "clique aqui para <b>atualizar o registro de empréstimo apresentado, iniciando pela</b> <strong>Data de Devolução</strong><br>&#x2012; <b>equivale a clicar no botão <span>\uf040&nbsp;Atualizar</span> e depois no campo de edição da</b> <strong>Data de Devolução</strong>").tooltip(TOOLTIP_OPTIONS);

        this.set = function (bool) {
          var action =  bool ? "enable" : "disable";
          [lde, ldd].forEach(
            function (el) {
              el.toggleClass("alive", bool).tooltip(action);
            });
        };

        return this;
      }
    )();

    var MURAL = new Mural();

    // nomes dos campos a visualizar no MURAL de registros pesquisados
    const FIELDNAMES = ["#Registro", "Emprestimo", "Devolução",
      "Agente", "Leitor", "Título", "Autor&Espírito", "Exemplar",
      "Posição", "Comentário"].map(
      function (name) {
        return " ".repeat( Math.max(0, 16-name.length) ) + name + ": ";
      });

    var DATALIST_EXEMPLARES = $("#acervo_exemplares");

    var DATALIST_OBRAS = $("#acervo_obras");

    var DATALISTS = [DATALIST_OBRAS, $("#leitores")];

    // atrela a cada botão que tem atributo "title", funções responsivas a
    // modificações da propriedade "disabled" via jQuery, que habilitam a
    // exibição de dicas via jQuery Tooltip, também atrelado a cada botão
    $('#cmd input[type="button"][title]').each(
      function (index, input) {
        var btn = $(input);
        btn.on({
          "disabledSet": function () { btn.tooltip("disable"); },
           "enabledSet": function () { btn.tooltip("enable"); },
                "click": function () { btn.tooltip("close"); }
        }).tooltip(TOOLTIP_OPTIONS);
      });

    // elemento a ocultar via efeito FADE, nas operações de novo registro
    var RETURN_DATE = $('#fields label[for="data_devolucao"], #fields input[name="data_devolucao"]')
      .wrapAll("<span></span>").first().parent();

    // elemento a ocultar via efeito SLIDE, nas operações de novo registro
    var LIMIT_DATE = $("#comentario").parent();

    var LIMIT_DATE_SLIDE_UP_OPTIONS = { duration: "slow", easing: "swing" };

    var LIMIT_DATE_SLIDE_DOWN_OPTIONS = { duration: "slow", easing: "swing" };

    /**
     * Instalação de "pseudo frame" para apresentação de conteúdo HTML, munido
     * de mecanismo de persistência da visibilidade na inicialização, conforme
     * o dia da semana.
    */
    (function () {
      // prefixo do código de serialização da visibilidade da "pseudo frame"
      const DOCAREA_PREFIX = "DOCAREA_ON_";

      var TOP = (FIELDS_PARENT.position().top + 10) + "px";

      var MAX_HEIGHT = FIELDS_PARENT.outerHeight(true) - 20;

      var MIN_HEIGHT = (MAX_HEIGHT - LIMIT_DATE.outerHeight(true)) + "px";

      MAX_HEIGHT += "px";

      var DOCAREA = $('<div id="docArea"></div>').appendTo("section").hide();

      var TEACHER = $('<button id="teacherBtn">&#xF0CB;</button>')
        .insertBefore("header img").tooltip(TOOLTIP_OPTIONS)
        .click(
          function () {
            DOCAREA.fadeToggle({
              done: function () {
                TEACHER.tooltip("close")
                  .toggleClass("pressed", !DOCAREA.is(":visible"));
                updateTEACHERtooltip();
              }
            });
          }).focus(
            // evita que TEACHER torne-se o elemento ativo da window,
            // possibilitando aparição indesejável do tooltip, mesmo
            // que nenhum "mouse event" tenha ocorrido
            function () { TEACHER.blur(); }
          );

      function updateTEACHERtooltip(status) {
        var isVisible = (status | DOCAREA.is(":visible"));
        TEACHER.attr("title", "clique aqui para <b>"
          + (isVisible ? "ocultar" : "restaurar")
          + " o resumo das sequências de operações</b>");
        FIELDS_PARENT.css({ "margin-left": (isVisible ? "10px" : "auto") });
        $(window).resize();
      }

      // atrela função responsiva ao redimensionamento da window,
      // que calcula as novas dimensões e posição do frame
      $(window).resize(function () {
          var divFields = $("#fields");
          var LEFT = divFields.position().left + divFields.outerWidth() + 10;
          DOCAREA.css({
              "top": TOP,
              "left": LEFT + "px",
              "width": ($(window.opera ? "html" : "html, body").outerWidth()
                - LEFT - 15) + "px",
              "height": MAX_HEIGHT
            });
        }).resize( /* POSICIONAMENTO INICIAL */ );

      $.get(
          aUri + "about.php?title=BASIC",
          function (texto) { DOCAREA.html(texto); }
        ).done(
          function () {

            // atrela função ao SCROLLER, que altera visibilidade da DOCAREA
            // sincronizada com rolamento e visibilidade do formulário
            SCROLLER.slideOptions.start = function () {
                if (DOCAREA.is(":visible")) {
                  DOCAREA.fadeOut(500);
                } else if (!TEACHER.hasClass("pressed")) {
                  DOCAREA.delay(700).fadeIn(750);
                }
              };

            // atrela função ao SCROLLER, que habilita o botão TEACHER
            // conforme visibilidade do formulário no final de rolamento
            SCROLLER.slideOptions.done = function () {
                var status = !FIELDS_PARENT.is(":visible");
                TEACHER.prop("disabled", status)
                  .tooltip(status ? "disable" : "enable");
              };

            // atrela função ao SCROLLER, que oculta rapidamente o DOCAREA e
            // habilita o botão TEACHER conforme visibilidade do formulário se
            // as animações não estiverem sincronizadas no fim do rolamento
            SCROLLER.slideOptions.fail = function () {
                DOCAREA.fadeOut("fast");
                SCROLLER.slideOptions.done();
              };

            // atrela função que minimiza o DOCAREA quando LABEL e INPUT
            // do "comentário container da data limite" são ocultados
            LIMIT_DATE_SLIDE_UP_OPTIONS.start = function () {
                DOCAREA.animate({ "height": MIN_HEIGHT });
              };

            // atrela função que maximiza o DOCAREA quando LABEL e INPUT
            // do "comentário container da data limite" são restaurados
            LIMIT_DATE_SLIDE_DOWN_OPTIONS.start = function () {
                DOCAREA.delay("slow").animate({ "height": MAX_HEIGHT });
              };

            // restaura a visibilidade do DOCAREA conforme valor serializado
            // no final da sessão anterior à corrente
            if (localStorage.getItem(
                DOCAREA_PREFIX + StyleManager.dayOfWeek()) !== "0") {
              DOCAREA.fadeIn(2500);
              updateTEACHERtooltip(true);
            } else {
              TEACHER.addClass("pressed");  // ajusta o look do botão
              updateTEACHERtooltip(false);
            }

            // configura "accordion" para rolar heading ativado para o topo
            DOCAREA.accordion({ collapsible: true, header: "h3", active: 0,
              heightStyle: "content", icons: null, animate: {
                duration: 1000, easing: "easeInOutSine", down: 1500 },
              activate: function /* scroll to ui.newHeader */ (ev, ui) {
                var OFFSET = ui.newHeader.offset();
                if (OFFSET) {
                  var me = $(this);
                  me.animate({
                    scrollTop: OFFSET.top - me.offset().top + me.scrollTop(),
                    duration: 1000,
                    easing: "easeInOutSine"
                  });
                }
              }
            });

          });

      // serializa a visibilidade da DOCAREA no fim da sessão corrente
      $(window).on({ "unload": function () {
          localStorage.setItem(DOCAREA_PREFIX + StyleManager.dayOfWeek(),
            DOCAREA.is(":visible") ? "1" : "0");
        } });
    })();

    function disableButtons() {
      // desabilita botões de navegação & comando
      setDisabled([firstBtn, previousBtn, nextBtn, lastBtn], true);
      setDisabled(commandButtons, true);
      // habilita "action buttons"
      setDisabled(actionButtons, false);
      // desabilita edição do índice do registro corrente
      counter[0].disabled = true;
    }

    // procedimento específico para tabelas vazias :: zero registros
    function whenTableIsEmpty() {
      counter[0].value = indexRec = 0;
      newBtn.click();                   // inserir registro :: o primeiro
      cancelBtn.prop("disabled", true); // somente será possível "salvar"
    }

    // preenchimento de todos INPUTs dos campos
    function setValues(array) {
      var f = (array === undefined) ? function (input) { input[0].value = ""; }
          : function (input, index) {
              input[0].value = (array[index] == "NULL") ? "" : array[index];
            };
      fields.forEach(f);
    }

    // declara o valor do atributo readonly dos inputs dos campos
    function setReadonly(value) {
      (value || searchBtn.hasClass("working") ?
        [0, 1, 2, 3, 4, 5, 6, 7, 8] : [0, 1, 2, 3, 4, 6]).forEach(
          function (index) { fields[index].prop("readonly", value); });
    }

    // atualiza os campos conforme número do registro ou invoca procedimento
    // para entrada de dados em tabela vazia
    function update() {
      if (indexRec > 0) {
        $.get(
          uri + "?action=GETREC&recnumber=" + indexRec,
          function (texto) {
            // atualiza o input do índice do registro corrente
            counter[0].value = indexRec;
            // atualiza os inputs dos campos do registro corrente
            setValues(texto.split("|"));
            // habilita/desabilita botões de navegação
            setDisabled([firstBtn, previousBtn], indexRec <= 1);
            setDisabled([lastBtn, nextBtn], indexRec >= numRecs);
          });
      } else {
        whenTableIsEmpty();
      }
    }

    // atrela aos INPUTs dos campos a função responsiva ao evento "input"
    // que executa comando pendente se <Enter> é pressionado ou cancela
    // se <Escape> pressionado
    fields.forEach(
      function (input) {
        input.keydown(
          function (ev) {
            // ignora evento se algum "action button" está desabilitado
            // ou na exclusão de registros
            if (saveBtn.is(":disabled") || cancelBtn.is(":disabled")
                || delBtn.hasClass("working")) return;
            if (ev.keyCode == 13) { // <Enter>
              // ignora evento se não foi pressionado <Ctrl>+<Enter>
              // num input associado a DataList
              if (!ev.ctrlKey && input.attr("list") !== undefined) return;
              saveBtn.click();    // executa comando pendente
            } else if (ev.keyCode == 27) { // <Escape>
              cancelBtn.click();  // cancela comando pendente
              input.blur();       // remove o foco do input
            }
          });
      });

    // atrela ao INPUT #counter a função responsiva ao evento "keydown" que
    // além de filtrar teclas, também modifica o valor do INPUT #counter
    counter.keydown(
      function (ev) {
        if (numRecs > 0) {
          // cancela o evento se a tecla pressionada não for digito entre
          // 0 e 9 (inclusive as do Numpad), Enter, Tab, Del, Backspace,
          // Left, Right, Home, End, Escape e Ctrl-Z
          var c = ev.keyCode;
          if ((c < 48 || c > 57) && (c < 96 || c > 105)
            && !(c == 90 && ev.ctrlKey) // NOT Ctrl-Z
            && (binarySearch([8, 9, 13, 27, 35, 36, 37, 39, 46], c) == -1)) {
            ev.preventDefault();
          } else if (c == 27) { // <Escape> desfaz edição
            counter[0].value = indexRec;
            update();
          } else if (c == 13 || c == 9) {           // <Enter> ou <Tab>
            var valor = parseInt(ev.target.value);  // atualiza o valor
            if (0 < valor && valor <= numRecs) {
              indexRec = valor;
              update();
            } else {
              ev.preventDefault();
            }
          }
        } else {
          show("\uF06A Atenção", "A tabela está vazia.");
          whenTableIsEmpty();
        }
      });

    // atrela ao INPUT #counter a função responsiva ao evento de tipo "blur"
    // que atualiza ou impede valor ilegal
    counter.blur(
      function () {
        var valor = parseInt(counter[0].value); // aborta edição pendente do
        if (0 < valor && valor <= numRecs) {    // input do índice do registro
          indexRec = valor;                     // corrente, atualizando-o
        } else {
          show("\uF06A Atenção", "<p>A edição do <strong>número de registro</strong> foi abortada pelo usuário, enquanto era esperado valor maior igual a <b>1</b> e menor igual a <b>" + numRecs + "</b>.</p>");
        }
        update();
      });

    // desabilita foco nos botões e no INPUT #amount
    actionButtons.concat([amount, infoBtn, leitorBtn]).forEach(
      function (elm) {
        elm.focus(function () { this.blur(); });
      });

    firstBtn.click(
      function () {
        indexRec = 1;
        update();
      });

    previousBtn.click(
      function () {
        if (indexRec-1 > 0) { // evita o "bug do botão pressionado", cuja
          --indexRec;         // habilitação sai de sincronia com o índice
          update();           // do registro corrente devido a latência do
        }                     // servidor e do DB para atender requisições
      });

    nextBtn.click(
      function () {
        if (indexRec+1 <= numRecs) {
          ++indexRec;
          update();
        }
      });

    lastBtn.click(
      function () {
        indexRec = numRecs;
        update();
      });

    updateBtn.click(
      function () {
        SPINNER.run();
        updateBtn.addClass("working");
        disableButtons();
        setReadonly(false);
        DATALISTS.forEach(
          function (dataList, index) {
            dataList.empty();
            $.get(
              aUri + dataList[0].id + ".php?action=GETALL",
              function (options) {
                dataList.html(options);
              }
            ).done(
              function () {
                if (index == 1) {
                  FAKE_BUTTONS.set(false);
                  INFO_FIELDS_TIPS.enable();
                  SCROLLER.scroll(false);
                  SPINNER.stop();
                }
              });
          });
        $.get(
            aUri + "acervo_exemplares.php?titulo=" + fields[4].val(),
            function (options) {
              DATALIST_EXEMPLARES.html(options);
              if (DATALIST_EXEMPLARES[0].options.length <= 1) {
                fields[6].prop("readonly", true);
                EXEMPLAR_TIPS.enable();
              }
            }
          );
      });

    delBtn.click(
      function () {
        delBtn.addClass("working");
        saveBtn[0].value = "\uF00C Confirmar";
        disableButtons();
        FAKE_BUTTONS.set(false);
        SCROLLER.scroll(false);
      });

    searchBtn.click(
      function () {
        SPINNER.run();
        searchBtn.addClass("working");
        saveBtn[0].value = "\uF00C Executar";
        disableButtons();
        setValues();
        setReadonly(false);
        DATALISTS.forEach(
          function (dataList, index) {
            dataList.empty();
            $.get(
              aUri + dataList[0].id + ".php?action=PESQUISA",
              function (options) {
                dataList.html(options);
              }
            ).done(
              function () {
                if (index == 1) {
                  FAKE_BUTTONS.set(false);
                  SCROLLER.scroll(false);
                  fields[2].val("NULL");
                  DATA_DEVOLUCAO_TIP.enable();
                  fields[4].focus( /* INPUT#obra */ );
                  SPINNER.stop();
                }
              });
          });
      });

    newBtn.click(
      function () {
        SPINNER.run();
        newBtn.addClass("working");
        disableButtons();
        setValues();
        setReadonly(false);
        RETURN_DATE.fadeOut("slow", "swing");
        LIMIT_DATE.slideUp(LIMIT_DATE_SLIDE_UP_OPTIONS);
        DATALISTS.forEach(
          function (dataList, index) {
            dataList.empty();
            $.get(
              aUri + dataList[0].id + ".php?action=GETALL",
              function (options) {
                dataList.html(options);
              }
            ).done(
              function () {
                if (index == 1) {
                  FAKE_BUTTONS.set(false);
                  SCROLLER.scroll(false);
                  INFO_FIELDS_TIPS.enable();
                  fields[0].focus( /* INPUT#bibliotecario */ );
                  SPINNER.stop();
                }
              });
          });
      });

    saveBtn.click(
      function () {
        var funktion, par = [uri];

        function addDataFields() {
          fields.forEach(
            function (input) {
              par.push("&", input[0].id, "=", encodeURIComponent(input.val()));
            });
        }

        SPINNER.run();

        if (newBtn.hasClass("working")) {

          funktion = function (texto) {
            if (texto.startsWith("Erro")) {
              show("\uF06A Atenção", "<p>Não foi possível registrar novo empréstimo.\n\n" + texto + "</p>");
            } else {
              RETURN_DATE.fadeIn("slow", "swing");
              LIMIT_DATE.slideDown(LIMIT_DATE_SLIDE_DOWN_OPTIONS);
              INFO_FIELDS_TIPS.disable();
              EXEMPLAR_TIPS.disable();
              amount[0].value = ++numRecs;
              indexRec = parseInt(texto);
              counter[0].maxLength = amount[0].value.length;
              counter[0].disabled = false;
              // atualiza para apresentar a data limite :: comentário
              update();
              // habilita/desabilita botões de comando
              commandButtons.forEach(
                function (el) {
                  el.removeClass("working").prop("disabled", false);
                });
              setDisabled(actionButtons, true);
              setReadonly(true);
              FAKE_BUTTONS.set(true);
              show("\uF06A Notificação", "<p><b>O empréstimo foi registrado com sucesso.</b>\n\nInforme a <strong>Data Limite</strong> para devolução.</p>");
            }
          };
          par.push("?action=INSERT");
          addDataFields();

        } else if (searchBtn.hasClass("working")) {

          funktion = function (texto) {
            if (texto.startsWith("Advertência")) {
              show("\uF05A Informação", "<p><b>Não há dados que satisfaçam a pesquisa.</b>\n\nRevise os parâmetros e tente novamente.</p>");
            } else {
              let r = texto.split("\n");
              // checa se resultado da pesquisa é registro único
              if (r.length == 1) {
                r = r[0].split("|");
                // atualiza o índice do registro corrente
                indexRec = parseInt(counter[0].value = r[0]);
                counter[0].disabled = false;
                setDisabled([firstBtn, previousBtn], indexRec <= 1);
                setDisabled([lastBtn, nextBtn], indexRec >= numRecs);
                // atualiza o formulário com array reorganizado
                r[0] = r.splice(3, 1)[0];
                setValues(r);
                setReadonly(true);
                // restaura status dos botões
                searchBtn.removeClass("working");
                setDisabled(commandButtons, false);
                setDisabled(actionButtons, true);
                saveBtn[0].value = "\uF00C Salvar";
                // "desfoca" algum input focado
                let elm = document.activeElement;
                if (elm.tagName == "INPUT" && elm.type == "text") elm.blur();
                FAKE_BUTTONS.set(true);
                DATA_DEVOLUCAO_TIP.disable();
              } else {
                let buf = "> Sucesso: Localizou " + r.length + " registros:\n";
                // monta a lista dos registros pesquisados
                for (var values, j=0; j<r.length; ++j) {
                  buf += "\n";
                  values = r[j].split("|");
                  for (var i=0; i<values.length; ++i) {
                    buf += FIELDNAMES[i] + values[i] + "\n";
                  }
                }
                MURAL.append(buf);
                SCROLLER.scroll(true);
              }
            }
          };
          par.push("?action=SEARCH");
          addDataFields();

        } else if (updateBtn.hasClass("working")) {

          funktion = function (texto) {
            if (texto.startsWith("Erro")) {
              show("\uF06A Atenção", "<p><b>Não foi possível atualizar o registro de empréstimo.</b>\n\n" + texto + "</p>");
            } else {
              INFO_FIELDS_TIPS.disable();
              EXEMPLAR_TIPS.disable();
              var n = parseInt(texto);
              if (n != indexRec) indexRec = n;
              show("\uF06A Notificação", '<p style="margin-top:1em">O registro de empréstimo foi atualizado com sucesso.</p>');
              update();
              commandButtons.forEach(
                function (el) {
                  el.removeClass("working").prop("disabled", false);
                });
              setDisabled(actionButtons, true);
              counter[0].disabled = false;
              setReadonly(true);
              FAKE_BUTTONS.set(true);
            }
          };
          par.push("?action=UPDATE&recnumber=", indexRec);
          addDataFields();

        } else if (delBtn.hasClass("working")) {

          funktion = function (texto) {
            if (texto.startsWith("Erro")) {
              show("\uF06A Atenção", "<p>Não foi possível excluir o registro de empréstimo.\n\n" + texto + "</p>");
              cancelBtn.click();
            } else {
              amount[0].value = --numRecs;
              if (indexRec > numRecs) --indexRec;
              counter[0].maxLength = amount[0].value.length;
              show("\uF06A Notificação", '<p style="margin-top:1em">O registro de empréstimo foi excluído com sucesso.</p>');
              if (indexRec > 0) {
                cancelBtn.click();
              } else {
                // alterna de "excluir" para "novo"
                counter[0].value = 0;
                delBtn.removeClass("working");
                newBtn.addClass("working");
                // modifica rotulo do botão
                saveBtn[0].value = "\uF00C Salvar";
                // somente permite "salvar"
                cancelBtn.prop("disabled", true);
                setValues();
                setReadonly(false);
              }
            }
          };
          par.push("?action=DELETE&recnumber=", indexRec);

        }

        $.get(par.join(""), funktion).done(function () { SPINNER.stop(); });

      });

    cancelBtn.click(
      function () {
        if (newBtn.hasClass("working") || updateBtn.hasClass("working")) {
          INFO_FIELDS_TIPS.disable();
          EXEMPLAR_TIPS.disable();
          if (newBtn.hasClass("working")) {
            RETURN_DATE.fadeIn("slow", "swing");
            LIMIT_DATE.slideDown(LIMIT_DATE_SLIDE_DOWN_OPTIONS);
          }
        } else if (searchBtn.hasClass("working")) {
          DATA_DEVOLUCAO_TIP.disable();
        }
        update();
        commandButtons.forEach(
          function (elm) {
            elm.removeClass("working").prop("disabled", false);
          });
        setDisabled(actionButtons, true);   // desabilita "action buttons"
        counter[0].disabled = false;        // habilita edição no input..
        saveBtn[0].value = "\uF00C Salvar"; // restaura o rotulo do botão
        setReadonly(true);                  // desabilita edição dos inputs
        FAKE_BUTTONS.set(true);
      });

    infoBtn.click(
      function () {
        // requisita listagem dos empréstimos esperado no dia corrente
        // e dos exemplares disponíveis no acervo, agrupados por título
        SPINNER.run();
        $.get(
          aUri + "reporter.php?action=INFO",
          function (texto) {
            if (!MURAL.isEmpty()) MURAL.append("");
            MURAL.append(texto);
            SCROLLER.scroll(true);
          }).done(function () { SPINNER.stop(); });
      });

    leitorBtn.click(
      function () {
        // requisita listagem dos leitores/obras com empréstimos em atraso
        SPINNER.run();
        $.get(
          aUri + "reporter.php?action=LEITOR",
          function (texto) {
            if (!MURAL.isEmpty()) MURAL.append("");
            MURAL.append(texto);
            SCROLLER.scroll(true);
          }).done(function () { SPINNER.stop(); });
      });

    // atrela ao INPUT#obra a função responsiva ao evento de tipo "input"
    // que atualiza OPTIONs do DATALIST de "Autor&Espírito", "Exemplares"
    // e "Posição", conforme "Título da Obra" selecionado na atualização
    // ou registro de novo empréstimo
    fields[4].on("input",
      function () {
        if (newBtn.hasClass("working") || updateBtn.hasClass("working")) {
          // esvazia os valores dos INPUTs "exemplar", "autor" e "posicao"
          for (var i=7; i>=5; --i) fields[i].val("");
          var code;
          // pesquisa via busca binária da OPTION selecionada no DATALIST
          // do INPUT de obras, para extrair o valor do atributo "code"
          // correspondente se a pesquisa foi bem sucedida
          for (var collection = DATALIST_OBRAS[0].options, element,
            key = fields[4].val(), lo = 0, hi = collection.length - 1, mid;
            !code && lo <= hi;) {
            mid = ((lo + hi) >> 1);
            element = collection.item(mid);
            if (element.value < key) {
              lo = mid + 1;
            } else if (element.value > key) {
              hi = mid - 1;
            } else {
              code = element.getAttribute("code");
            }
          }
          if (code) {
            DATALIST_EXEMPLARES.empty();
            $.get(
              aUri + "acervo_exemplares.php?code=" + code,
              function (texto) {
                var values = texto.split("|");
                // atualiza o valor do INPUT "autor"
                fields[5].val(values[0]);
                // atualiza o valor do INPUT "posicao"
                fields[7].val(values[1]);
                // substitui todos os itens da lista de opções, que pode
                // tornar-se vazia caso não haja exemplares disponíveis
                DATALIST_EXEMPLARES.html(values[2]);
                var collection = DATALIST_EXEMPLARES[0].options;
                if (collection.length) {
                  // atualiza o valor do INPUT "exemplar" com o valor
                  // do primeiro item do DATALIST
                  fields[6].val(collection.item(0).value);
                  if (collection.length == 1) {
                    fields[6].prop("readonly", true);
                    EXEMPLAR_TIPS.enable();
                  } else {
                    fields[6].prop("readonly", false);
                    EXEMPLAR_TIPS.disable();
                  }
                }
              });
          }
        }
      });

    // preenche DATALIST do INPUT#bibliotecarios e do INPUT#exemplares
    [$("#bibliotecarios"), DATALIST_EXEMPLARES].forEach(
      function (dataList) {
        $.get(aUri + dataList[0].id + ".php?action=GETALL",
          function (options) {
            dataList.html(options);
          });
      });

    // checa se há evidência de recarga do documento durante atualização,
    // pesquisa, exclusão ou inserção de novo registro, checando os valores
    // dos INPUTs mostradores de status da tabela
    if (counter.val() && amount.val()) {
      numRecs = parseInt(amount[0].value); // extrai o valor do input
      if (numRecs == 0) {
        newBtn.click();
        cancelBtn.prop("disabled", true);
        SPINNER.stop();
      } else {
        indexRec = parseInt(counter[0].value);
        if (indexRec < 1) {
          counter[0].value = indexRec = 1;
        } else if (indexRec > numRecs) {
          counter[0].value = indexRec = numRecs;
        }
        // restaura os valores dos inputs consultando o DB por segurança
        $.get(
          uri + "?action=GETREC&recnumber=" + indexRec,
          function (texto) {
            // atualiza os valores do registro corrente
            if (texto.startsWith("Erro")) {
              firstBtn.click();
            } else {
              setValues(texto.split("|"));
            }
          }).done(
            function () {
              // habilita edição e declara a quantidade máxima de
              // caracteres do input do índice do registro corrente
              counter[0].disabled = false;
              counter[0].maxLength = amount[0].value.length;
              // habilita/desabilita botões de navegação
              setDisabled([firstBtn, previousBtn], indexRec <= 1);
              setDisabled([lastBtn, nextBtn], indexRec >= numRecs);
              commandButtons.forEach(
                function (btn) {
                  btn.removeClass("working").prop("disabled", false);
                });
              setDisabled(actionButtons, true);
              SPINNER.stop();
            });
      }
    } else {
      $.get(
        uri + "?action=COUNT",
        function (texto) {
          // declara a quantidade inicial de registros da tabela
          numRecs = parseInt(amount[0].value = texto);
          // declara a quantidade máxima de caracteres do input
          counter[0].maxLength = texto.length;
          // ação inicial conforme quantidade de registros da tabela
          if (numRecs > 0) {
            lastBtn.click();
            setDisabled(actionButtons, true);
          } else {
            whenTableIsEmpty(); // força inserção de registro
          }
        }).done(function () { SPINNER.stop(); });
    }

  });
