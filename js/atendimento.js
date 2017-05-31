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

    new StyleSwitcher();

    ["#data_emprestimo", "#data_devolucao"].forEach(
      function (element) {
        $(element).datepicker({
            showAnim: "fade",
            duration: 1500,
            constrainInput: false,
            beforeShow: function (input, object) {
                var $input = $(input);
                var t = $input.tooltip("instance");
                if (t) t.close();
                if (input.readOnly) {
                  $input.data("preserved", input.value);
                }
              },
            onClose: function (dateText, instance) {
                if (this.readOnly) {
                  var input = $(this);
                  var valor = input.data("preserved");
                  if (dateText != valor) {
                    if (valor !== undefined) input.val(valor);
                    var msg = "<p>O campo está disponível <strong>somente para leitura</strong>.</p>\n<p>Clique no botão <b>\uf040&nbsp;Atualizar</b> ";
                    if (this.id == "data_devolucao") msg += "ou em <b>\uf040&nbsp;Devolução</b>";
                    msg += " para digitar ou selecionar a data no calendário.</p>"
                    show("\uF06A READ ONLY", msg);
                  }
                } else if (dateText.length == 10) {
                  function pad(x) { return (x < 10 ? "0" : "") + x; }
                  var d = new Date();
                  var hoje = pad(d.getDate()) + "-" + pad(d.getMonth()+1) + "-" + d.getFullYear();
                  console.log(dateText + " " + hoje);
                  if (dateText == hoje) this.value = hoje + " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
                }
              },
          });
      });

    /*
     * Gestor de rolagem da WINDOW e da tangibilidade do formulário.
    */
    var SCROLLER = (
      function () {

        var h = $("header");
        var d = $("section > div:first-child"); // container do formulário
        var b = false;                          // status da tangibilidade

        function updateTip() {
          const par = [ { "action":"restaurar", "cor":"#060" },
                        { "action":"ocultar", "cor":"#009" } ];
          h.tooltip("close");
          h.attr("title",
            "clique aqui para <b>" + par[+(b=!b)].action + "</b> o formulário")
            .children().animate({color:"#cfc"}).animate({color:par[+b].cor});
        }

        var w = $(window.opera ? "html" : "html, body");

        var t = $('<button id="GoTop">Go Top!</button>').click(
          function () {
            w.animate({ scrollTop: 0 }, 2000, "easeOutExpo");
          }).insertAfter( $("textarea") );

        this.scroll = function (complete) {
          t.click();
          if (complete) {
            d.slideToggle({ duration: 1000, easing: "swing" });
            updateTip.apply(this);
          }
        };

        var self = this;

        h.click(function () { self.scroll(true); }).tooltip(TOOLTIP_OPTIONS);

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

    var DATA_DEVOLUCAO_TIP = new Tips([fields[2]], "somente neste campo, <b>NULL</b> é parâmetro para pesquisar registro(s) cuja data de <span>Devolução</span> não foi preenchida ou seja; <em>o exemplar não foi devolvido</em> e quando o campo estiver vazio, será ignorado");

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
          }).attr("title", "clique aqui para registrar <span>Empréstimo</span><br><em>equivale a clicar no botão</em> <b>\uf067&nbsp;Novo</b>").tooltip(TOOLTIP_OPTIONS);

        var ldd = $('label[for="data_devolucao"]').addClass("alive").click(
          function () {
            if (busy()) return;
            updateBtn.click();
          }).attr("title", "clique aqui para atualizar o registro de empréstimo apresentado, iniciando pela data de <span>Devolução</span><br><em>equivale a clicar no botão</em> <b>\uf040&nbsp;Atualizar</b> <em>e depois no campo de edição da data de</em> <span>Devolução</span>").tooltip(TOOLTIP_OPTIONS);

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

    var DATALIST_EXEMPLARES = document.getElementById("acervo_exemplares");

    var DATALIST_OBRAS = document.getElementById("acervo_obras");

    var DATALISTS = [DATALIST_OBRAS, document.getElementById("leitores")];

    // atrela a cada botão que tem atributo "title", funções responsivas a
    // modificações da propriedade "disabled" via jQuery, que habilitam a
    // exibição de dicas via jQuery Tooltip, também atrelado a cada botão
    $('#cmd input[type="button"][title]').each(
      function (index, input) {
        var btn = $(input);
        btn.on({
          "disabledSet": function () { btn.tooltip("disable"); },
           "enabledSet": function () { btn.tooltip("enable"); }
        }).tooltip(TOOLTIP_OPTIONS);
      });

    function disableButtons() {
      // desabilita botões de navegação & comando
      setDisabled([firstBtn, previousBtn, nextBtn, lastBtn], true);
      setDisabled(commandButtons, true);
      // habilita "action buttons"
      setDisabled(actionButtons, false);
      // desabilita edição do índice do registro corrente
      counter[0].disabled = true;
    }

    function whenTableIsEmpty() {
      // prepara a única ação possível quando a tabela está vazia
      counter[0].value = indexRec = 0;
      newBtn.click();                   // inserir registro :: o primeiro
      cancelBtn.prop("disabled", true); // somente será possível "salvar"
    }

    function setValues(array) {
      // preenche os INPUTs com componentes do argumento do tipo Array
      // ou com strings vazias se o argumento for indeterminado
      fields.forEach(
        (array === undefined) ? function (input) { input[0].value = ""; }
          : function (input, index) {
              input[0].value = (array[index] == "NULL") ? "" : array[index];
            }
      );
    }

    function setReadonly(boolValue) {
      // declara os valores do atributo readonly dos inputs de campos..
      (boolValue || searchBtn.hasClass("working") ?
        [0, 1, 2, 3, 4, 5, 6, 7, 8] : [0, 1, 2, 3, 4, 6]).forEach(
          function (index) { fields[index].prop("readonly", boolValue); });
    }

    function update() {
      // testa o índice do registro corrente para atualizar os
      // respectivos dados ou preparar inserção na tabela vazia
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

    // incrementa a responsividade ao digitar nos INPUTs do registro
    fields.forEach(
      function (input) {
        input.keydown(
          function (ev) {
            // ignora o evento na exclusão de registros
            if (delBtn.hasClass("working")) return;
            // testa se "action buttons" estão habilitados
            if (actionButtons.every(item => item[0].disabled == false)) {
              if (ev.keyCode == 13) {
                // ignora o evento se o input é associado a datalist
                // e nao foi pressionado <Ctrl> simultaneamente
                if (!ev.ctrlKey && ev.target.hasAttribute("list")) return;
                saveBtn.click();  // (<Ctrl>+)<Enter> aciona comando pendente
              } else if (ev.keyCode == 27) {
                cancelBtn.click(); // <Escape> cancela comando pendente
                ev.target.blur();  // remove o foco do input
              }
            }
          });
      });

    // incrementa a responsividade ao digitar no INPUT #counter
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

    // incrementa a responsividade na perda de foco do INPUT #counter
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
        $(this).tooltip("close");
        if (indexRec-1 > 0) { // evita o "bug do botão pressionado", cuja
          --indexRec;         // habilitação sai de sincronia com o índice
          update();           // do registro corrente devido a latência do
        }                     // servidor e do DB para atender requisições
      });

    nextBtn.click(
      function () {
        $(this).tooltip("close");
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
        updateBtn.addClass("working").tooltip("close");
        disableButtons();
        setReadonly(false);
        DATALISTS.forEach(
          function (dataList, index) {
            $.get(
              aUri + dataList.id + ".php?action=GETALL",
              function (options) {
                dataList.innerHTML = options;
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
      });

    delBtn.click(
      function () {
        delBtn.addClass("working").tooltip("close");
        saveBtn[0].value = "\uF00C Confirmar";
        disableButtons();
        FAKE_BUTTONS.set(false);
        SCROLLER.scroll(false);
      });

    searchBtn.click(
      function () {
        SPINNER.run();
        searchBtn.addClass("working").tooltip("close");
        saveBtn[0].value = "\uF00C Executar";
        disableButtons();
        setValues();
        setReadonly(false);
        DATALISTS.forEach(
          function (dataList, index) {
            $.get(
              aUri + dataList.id + ".php?action=PESQUISA",
              function (options) {
                dataList.innerHTML = options;
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
        newBtn.addClass("working").tooltip("close");
        disableButtons();
        setValues();
        setReadonly(false);
        DATALISTS.forEach(
          function (dataList, index) {
            $.get(
              aUri + dataList.id + ".php?action=GETALL",
              function (options) {
                dataList.innerHTML = options;
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
              INFO_FIELDS_TIPS.disable();
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
              show("\uF06A Notificação", "<p><b>O empréstimo foi registrado com sucesso.</b>\n\nInforme a data limite para devolução.</p>");
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
              var n = parseInt(texto);
              if (n != indexRec) indexRec = n;
              show("\uF06A Notificação", "<p>O registro de empréstimo foi atualizado com sucesso.</p>");
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
            if (texto.startsWith("Error")) {
              show("\uF06A Atenção", "<p>Não foi possível excluir o registro de empréstimo.\n\n" + texto + "</p>");
              cancelBtn.click();
            } else {
              amount[0].value = --numRecs;
              if (indexRec > numRecs) --indexRec;
              counter[0].maxLength = amount[0].value.length;
              show("\uF06A Notificação", "<p>O registro de empréstimo foi excluído com sucesso.</p>");
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
        infoBtn.tooltip("close");
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
        leitorBtn.tooltip("close");
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
    // que atualiza OPTIONs do DATALIST de "Autor&Espírito", "exemplares"
    // e "posição", conforme "Título da Obra" selecionado na atualização
    // ou registro de novo empréstimo
    fields[4].on("input",
      function () {
        if (newBtn.hasClass("working") || updateBtn.hasClass("working")) {
          // esvazia os valores dos INPUTs "exemplar", "autor" e "posicao"
          for (var i=7; i>=5; --i) fields[i].val("");
          // checa se o valor do INPUT "obra" não está vazio
          if (fields[4].val()) {
            var code;
            // pesquisa via busca binária da OPTION selecionada no DATALIST
            // do INPUT de obras, para extrair o valor do atributo "code"
            // correspondente se a pesquisa foi bem sucedida
            for (var collection = DATALIST_OBRAS.options, element,
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
                  DATALIST_EXEMPLARES.innerHTML = values[2];
                  if (values[2].length > 0) {
                    // atualiza o valor do INPUT "exemplar" com o valor
                    // do primeiro item do DATALIST
                    fields[6].val(DATALIST_EXEMPLARES.options.item(0).value);
                  } else {
                    show("\uF06A Atenção", "Não há exemplar desta obra, disponível no momento.");
                    fields[6].val("\u2639 Não achei!");
                  }
                });
            }
          }
        }
      });

    // preenche DATALIST do INPUT#bibliotecarios e do INPUT#exemplares
    [document.getElementById("bibliotecarios"), DATALIST_EXEMPLARES].forEach(
      function (dataList) {
        $.get(aUri + dataList.id + ".php?action=GETALL",
          function (options) {
            dataList.innerHTML = options;
          });
      });

    // testa se valores de ambos INPUTs mostradores de status da tabela não
    // são string vazia, evidenciando que o documento foi atualizado durante
    // pesquisa, atualização, exclusão ou inserção de novo registro
    if (counter[0].value.length > 0 && amount[0].value.length > 0) {

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
            $(actionButtons).prop("disabled", true);
          } else {
            whenTableIsEmpty(); // força inserção de registro
          }
        }).done(function () { SPINNER.stop(); });

    }

  });