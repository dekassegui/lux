/**
 * Este script é parte do projeto LUX, software livre para bibliotecas
 * de casas Espíritas, em desenvolvimento desde 12/11/2016.
*/
$(document).ready(
  function () {

    // URI do script backend que atende requisições ao DB
    const uri = location.href.replace("html", "php");

    const aUri = uri.substring(0, uri.lastIndexOf("/")+1);

    ["#data_emprestimo", "#data_devolucao"].forEach(
      function (expression) {
        $(expression).datepicker({
          autoClose: true,
          language: "pt-BR",
          dateFormat: "dd-mm-yyyy",
          navTitles: {
            days: "MM - <i>yyyy</i>",
            months: "yyyy",
            years: "yyyy1 - yyyy2"
          },
          timepicker: true,
          todayButton: new Date(),
          clearButton: true,
          keyboardNav: false,
          onShow: function (dp, animationCompleted) {
            if (dp.el.readOnly && !animationCompleted) {
              $(dp.el).data("preserved", dp.el.value);
            }
          },
          onHide: function (dp, animationCompleted) {
            var inp = $(dp.el);
            if (inp[0].readOnly && inp[0].value != inp.data("preserved")) {
              if (animationCompleted) {
                var valor = inp.data("preserved");
                if (valor !== undefined) inp[0].value = valor;
              } else {
                show("<strong>READ ONLY</strong><br>O campo está disponível <b>somente&nbsp;para&nbsp;leitura</b>.");
              }
            }
          },
        });
      });

    // gestor de rolagens da WINDOW que sempre posiciona o TEXTAREA no topo
    var SCROLLER = (
      function () {
        var w = $(window);
        var h = $("header");
        var d = $("section > div:first-child");

        var b = true; /* inicialmente: d.innerHeight() > 0 */

        h.click(
          function () {
            // atualização do tooltip do HEADER
            const a = ["ocultar", "restaurar"];
            h.attr("title", "clique aqui para " + a[b=!b&1] + " o formulário")
              .children().css({color:(b?"#060":"#009")});
          }
        ).click( /* atualização inicial */ ).click(
          function () {
            // posiciona window no topo
            w.scrollTo(0, 400 + (window.scrollY / 100 + 1) * 100);
            // alterna a visualização do formulário
            d.slideToggle("slow");
          });

        var t = $("textarea");

        this.rolarAte = function (y) {
          var d = window.scrollY;
          if (y === undefined) {
            d = y = t.offset().top - h.outerHeight() - 15;
          }
          w.scrollTo(y, 400 + (d / 100 + 1) * 100, { easing:"swing" });
        }

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

    var firstBtn  = $("#firstBtn"),  previousBtn = $("#previousBtn"),
        nextBtn   = $("#nextBtn"),   lastBtn     = $("#lastBtn");

    var updateBtn = $("#updateBtn"),   delBtn    = $("#delBtn"),
        searchBtn = $("#searchBtn"),   newBtn    = $("#newBtn"),
        saveBtn   = $("#saveBtn"),     cancelBtn = $("#cancelBtn"),
        infoBtn   = $("#cmd01Btn"),    leitorBtn = $("#cmd02Btn");

    var commandButtons = [updateBtn, delBtn, searchBtn, newBtn, infoBtn,
                          leitorBtn];

    var actionButtons = [saveBtn, cancelBtn];

    // montador/gestor de elementos do tipo LABEL adaptados como BUTTON
    // para acionar a atualização e criação de registros de empréstimos
    var FAKE_BUTTONS = (
      function () {

        const className = "alive";

        function busy() {
          var i=3;
          while (i>=0 && !commandButtons[i].hasClass("working")) --i;
          return i>=0;
        }

        var lde = $('label[for="data_emprestimo"]').addClass(className).click(
          function (ev) {
            if (busy()) return;
            ev.preventDefault();
            newBtn.click();
          });

        var ldd = $('label[for="data_devolucao"]').addClass(className).click(
          function () {
            if (busy()) return;
            updateBtn.click();
          });

        this.toggle = function (bool) {
          lde.toggleClass(className, bool);
          ldd.toggleClass(className, bool);
        }

        return this;
      }
    )();

    var MURAL = new Mural();

    var DATALIST_EXEMPLARES = $("#acervo_exemplares");

    var DATALIST_OBRAS = $("#acervo_obras");

    var DATALISTS = [DATALIST_OBRAS, $("#leitores")];

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
      cancelBtn[0].disabled = true;     // somente será possível "salvar"
    }

    function setInputsValues(array) {
      // preenche os INPUTs com componentes do argumento do tipo Array
      // ou com strings vazias se o argumento for indeterminado
      fields.forEach(
        (array === undefined) ? function (input) { input[0].value = ""; }
          : function (input, index) {
              input[0].value = (array[index] == "NULL") ? "" : array[index];
            }
      );
    }

    function setInputsReadonly(boolValue) {
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
            setInputsValues(texto.split("|"));
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
            // rejeita o evento na exclusão de registros
            if (delBtn.hasClass("working")) return;
            // testa se "action buttons" estão habilitados
            if (actionButtons.every(item => item[0].disabled == false)) {
              if (ev.keyCode == 13) {
                // rejeita o evento se o input é associado a datalist
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
              show("Erro: Número de registro é ilegal.");
              ev.preventDefault();
            }
          }
        } else {
          show("Erro: A tabela está vazia.");
        }
      });

    // incrementa a responsividade na perda de foco do INPUT #counter
    counter.blur(
      function () {
        var valor = parseInt(counter[0].value);  // aborta edição pendente do
        if (0 < valor && valor <= numRecs) {  // input do índice do registro
          indexRec = valor;                   // corrente, atualizando-o
        } else {
          var text = "Erro: Valor do índice do registro ilegal.<br><span>";
          if (0 < indexRec && indexRec <= numRecs) {
            text += "Restaurando";
            counter[0].value = indexRec;
          } else {
            text += "Reiniciando";
            counter[0].value = indexRec = 1;
          }
          show(text+" valor do índice do registro corrente.<>/span");
        }
        update();
      });

    // desabilita foco nos botões de comando/relatório e no INPUT #amount
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
        updateBtn.addClass("working");
        disableButtons();
        setInputsReadonly(false);
        DATALISTS.forEach(
          function (dataList, index) {
            $.get(
              aUri + dataList[0].id + ".php?action=GETALL",
              function (texto) { dataList.empty().append(texto); }
            ).done(
              function () {
                if (index == 1) {
                  FAKE_BUTTONS.toggle(false);
                  SCROLLER.rolarAte(0);
                }
              });
          });
      });

    delBtn.click(
      function () {
        delBtn.addClass("working");
        saveBtn[0].value = "\uF00C Confirmar";
        disableButtons();
        FAKE_BUTTONS.toggle(false);
        SCROLLER.rolarAte(0);
      });

    searchBtn.click(
      function () {
        searchBtn.addClass("working");
        saveBtn[0].value = "\uF00C Executar";
        disableButtons();
        setInputsValues();
        setInputsReadonly(false);
        DATALISTS.forEach(
          function (dataList, index) {
            var inputField = dataList.prev();
            inputField.val("ATUALIZANDO LISTA!");
            $.get(
              aUri + dataList[0].id + ".php?action=PESQUISA",
              function (texto) { dataList.empty().append(texto); }
            ).done(
              function () {
                inputField.val("");
                if (index == 1) {
                  FAKE_BUTTONS.toggle(false);
                  SCROLLER.rolarAte(0);
                  fields[2].val("NULL");
                  fields[4].focus();    // focaliza no input#obra
                }
              });
          });
      });

    newBtn.click(
      function () {
        newBtn.addClass("working");
        disableButtons();
        setInputsValues();
        setInputsReadonly(false);
        DATALISTS.forEach(
          function (dataList, index) {
            var inputField = dataList.prev();
            inputField.val("ATUALIZANDO LISTA!");
            $.get(
              aUri + dataList[0].id + ".php?action=GETALL",
              function (texto) { dataList.empty().append(texto); }
            ).done(
              function () {
                inputField.val("");
                if (index == 1) {
                  FAKE_BUTTONS.toggle(false);
                  SCROLLER.rolarAte(0);
                  fields[0].focus();    // focaliza no input#bibliotecario
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

        if (newBtn.hasClass("working")) {

          funktion = function (texto) {
            if (texto.startsWith("Error")) {
              show("Inserção mal sucedida.<br>" + texto);
            } else {
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
              setInputsReadonly(true);
              FAKE_BUTTONS.toggle(true);
              show("Inserção bem sucedida.<span>Informe a data limite para devolução.</span>");
            }
          };
          par.push("?action=INSERT");
          addDataFields();

        } else if (searchBtn.hasClass("working")) {

          funktion = function (texto) {
            if (/^(?:Advertência|Warning)/.test(texto)) {
              show("\u2639 Não há dados que satisfaçam a pesquisa.");
            } else {
              let r = texto.split(/\r\n|\n|\r/g);
              // checa se resultado da pesquisa é registro único
              if (r.length == 1) {
                r = r[0].split("|");
                // atualiza o índice do registro corrente
                indexRec = parseInt(counter[0].value = r[0]);
                counter[0].disabled = false;
                setDisabled([firstBtn, previousBtn], indexRec <= 1);
                setDisabled([lastBtn, nextBtn], indexRec >= numRecs);
                // atualiza valores apresentados no formulário
                r[0] = r.splice(3, 1)[0];
                setInputsValues(r);
                setInputsReadonly(true);
                // restaura status dos botões
                searchBtn.removeClass("working");
                commandButtons.forEach(
                  function (Bt) { Bt[0].disabled = false; });
                setDisabled(actionButtons, true);
                saveBtn[0].value = "\uF00C Salvar";
                // "desfoca" algum input focado
                let elm = document.activeElement;
                if (elm.tagName == "INPUT" && elm.type == "text") elm.blur();
                FAKE_BUTTONS.toggle(true);
              } else {
                MURAL.append("> Sucesso: Localizou " + r.length + " registros:");
                // monta o array de labels dos campos dos registros
                const labels = ["#Registro", "Emprestimo", "Devolução", "Agente", "Leitor", "Título", "Autor&Espírito", "Exemplar", "Posição", "Comentário"].map(
                  function (s) {
                    return " ".repeat( Math.max(0, 16-s.length) ) + s + ": ";
                  });
                // monta a lista dos registros pesquisados
                let text = "";
                for (var values, n=labels.length, i, j=0; j<r.length; ++j) {
                  text += "\n";
                  values = r[j].split("|");
                  for (i=0; i<n; ++i) text += labels[i] + values[i] + "\n";
                }
                MURAL.append(text);
                SCROLLER.rolarAte();
              }
            }
          };
          par.push("?action=SEARCH");
          addDataFields();

        } else if (updateBtn.hasClass("working")) {

          funktion = function (texto) {
            if (texto.startsWith("Error")) {
              show("Atualização mal sucedida.<br>" + texto);
            } else {
              var n = parseInt(texto);
              if (n != indexRec) indexRec = n;
              show("Atualização bem sucedida.");
              update();
              commandButtons.forEach(
                function (el) {
                  el.removeClass("working").prop("disabled", false);
                });
              setDisabled(actionButtons, true);
              counter[0].disabled = false;
              setInputsReadonly(true);
              FAKE_BUTTONS.toggle(true);
            }
          };
          par.push("?action=UPDATE&recnumber=", indexRec);
          addDataFields();

        } else if (delBtn.hasClass("working")) {

          funktion = function (texto) {
            if (texto.startsWith("Error")) {
              show("Exclusão mal sucedida.<br>" + texto);
              cancelBtn.click();
            } else {
              amount[0].value = --numRecs;
              if (indexRec > numRecs) --indexRec;
              counter[0].maxLength = amount[0].value.length;
              show("Exclusão bem sucedida.");
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
                cancelBtn[0].disabled = true;
                setInputsValues();
                setInputsReadonly(false);
              }
            }
          };
          par.push("?action=DELETE&recnumber=", indexRec);

        }

        $.get(par.join(""), funktion);

      });

    cancelBtn.click(
      function () {
        update();
        commandButtons.forEach(
          function (elm) {
            elm.removeClass("working").prop("disabled", false);
          });
        setDisabled(actionButtons, true);   // desabilita "action buttons"
        counter[0].disabled = false;        // habilita edição no input..
        saveBtn[0].value = "\uF00C Salvar"; // restaura o rotulo do botão
        setInputsReadonly(true);            // desabilita edição dos inputs
        FAKE_BUTTONS.toggle(true);
      });

    infoBtn.click(
      function () {
        // requisita listagem dos empréstimos esperado no dia corrente
        // e dos exemplares disponíveis no acervo, agrupados por título
        $.get(
          aUri + "reporter.php?action=INFO",
          function (texto) {
            if (!MURAL.isEmpty()) MURAL.append("");
            MURAL.append(texto);
            SCROLLER.rolarAte();
          });
      });

    leitorBtn.click(
      function () {
        // requisita listagem dos leitores/obras com empréstimos em atraso
        $.get(
          aUri + "reporter.php?action=LEITOR",
          function (texto) {
            if (!MURAL.isEmpty()) MURAL.append("");
            MURAL.append(texto);
            SCROLLER.rolarAte();
          });
      });

    // declara o listener de evento "input" no INPUT #obra para atualizar
    // as opções do DATALIST de "exemplares", "autor&espirito" e "posição"
    // conforme "título da obra" selecionado na atualização ou criação de
    // novo registro de empréstimo
    fields[4].bind("input",
      function () {
        if ([newBtn, updateBtn].some(Bt => Bt.hasClass("working"))) {
          // esvazia os valores dos INPUTs "exemplar", "autor" e "posicao"
          for (var i=5; i<8; ++i) fields[i].val("");
          // checa se o valor do INPUT "obra" não está vazio
          if (fields[4].val()) {
            var code;
            // pesquisa via busca binária da OPTION selecionada no DATALIST
            // associado ao INPUT de obras, para extrair o valor do atributo
            // "code" correspondente se a pesquisa foi bem sucedida
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
                  DATALIST_EXEMPLARES.empty().html(values[2]);
                  if (values[2].length > 0) {
                    // atualiza o valor do INPUT "exemplar" com o valor
                    // do primeiro item do DATALIST
                    fields[6].val(DATALIST_EXEMPLARES[0].options.item(0).value);
                  } else {
                    show("Nenhum exemplar da obra<br>está disponível no momento.");
                    fields[6].val("\u2639 Não achei!");
                  }
                });
            }
          }
        }
      });

    // preenche DATALISTs cujos IDs correspondem ao nome (sem extensão)
    // do script backend que atende a requisição dos seus dados
    (
      function () {
        [$("#bibliotecarios"), DATALIST_EXEMPLARES].forEach(
          function (dataList) {
            $.get(
              aUri + dataList[0].id + ".php?action=GETALL",
              function (texto) { dataList.html(texto); });
          });
      }
    )();

    // testa se valores de ambos INPUTs mostradores de status da tabela não
    // são string vazia, evidenciando que o documento foi atualizado durante
    // pesquisa, atualização, exclusão ou inserção de novo registro
    if (counter[0].value.length > 0 && amount[0].value.length > 0) {

      numRecs = parseInt(amount[0].value); // extrai o valor do input

      if (numRecs == 0) {

        newBtn.click();
        cancelBtn[0].disabled = true;

      } else {

        indexRec = parseInt(counter[0].value); // extrai o valor do input

        // restaura os valores dos inputs consultando o DB por segurança
        $.get(
          uri + "?action=GETREC&recnumber=" + indexRec,
          function (texto) {
            // atualiza os valores do registro corrente
            setInputsValues(texto.split("|"));
          });

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

        setDisabled(actionButtons, true); // desabilita os "action buttons'

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
            lastBtn.click();    // mostra o último registro
          } else {
            whenTableIsEmpty(); // força inserção de registro
          }
        });

    }

  });