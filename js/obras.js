/**
 * Este script é parte do projeto LUX, software livre para bibliotecas de
 * casas Espíritas, em desenvolvimento desde 12/11/2016.
 *
 * -- Atende a quase todas UIs, portanto seus métodos são genéricos.
*/
$(document).ready(
  function () {

    // URI do script backend que atende requisições ao DB
    const uri = location.href.replace("html", "php");

    var SPINNER = new Spinner("header");

    StyleManager.load();

    $(window).on({ "unload": function () { StyleManager.save(); } });

    // ajuste da largura do elemento ASIDE container do TEXTAREA
    $(window).resize(
      function () {
        var w = $(document.body).innerWidth();
        w -= (w < 1000) ? 20 : $("section").innerWidth()+30;
        $("aside").width(w);
      }
    ).resize( /* ajuste inicial */ );

    var indexRec,                  // índice do registro corrente
        counter = $("#counter");   // input do índice do..

    var numRecs,                   // quantidade de registros da tabela
        amount  = $("#amount");    // input da quantidade de..

    var fields = $("#fields > input").toArray().map($);

    // número de ordem do INPUT focado ao iniciar atualização ou pesquisa
    var FOCUS_NDX = (fields[0].attr("id") == "code") ? 1 : 0;

    var firstBtn  = $("#firstBtn"),  previousBtn = $("#previousBtn"),
        nextBtn   = $("#nextBtn"),   lastBtn     = $("#lastBtn");

    var updateBtn = $("#updateBtn"),   delBtn    = $("#delBtn"),
        searchBtn = $("#searchBtn"),   newBtn    = $("#newBtn"),
        saveBtn   = $("#saveBtn"),     cancelBtn = $("#cancelBtn");

    var actionButtons = [saveBtn, cancelBtn];

    var commandButtons = [updateBtn, delBtn, searchBtn, newBtn];

    var MURAL = new Mural();

    // nomes dos campos para visualização no MURAL de registros pesquisados
    var FIELDNAMES;
    (
      function () {
        const nomes = {
          "autores": ["#Registro", "Código", "Nome", "Espíritos"],
          "generos": ["#Registro", "Código", "Nome"],
          "obras": ["#Registro", "Código", "Título" , "Autores", "Gênero"],
          "acervo": ["#Registro", "Obra", "Exemplar", "Posição", "Comentário"],
          "bibliotecarios": ["#Registro", "Código", "Nome"],
          "leitores": ["#Registro", "Código", "Nome", "Telefone", "e-Mail"]
        };
        // extrai a chave da uri da página corrente
        var key = location.pathname.substring(1);
        key = key.substring(key.indexOf("/")+1, key.indexOf("."));
        // calcula o comprimento dos labels das colunas
        var m = Math.max.apply(null,
          nomes[key].map(function (nome) { return nome.length; })) + 2;
        // monta labels alinhados a direita
        FIELDNAMES = nomes[key].map(
          function (nome) {
            return " ".repeat( Math.max(0, m-nome.length) ) + nome + ": ";
          });
      }
    )();

    // TODO: remover a declaração abaixo quando possível.

    // atrela a cada botão que tem atributo "title", funções responsivas a
    // modificações da propriedade "disabled" via jQuery, que habilitam a
    // exibição de dicas via jQuery Tooltip, também atrelado a cada botão
    var provisorio = ["clique aqui para <b>acessar o primeiro registro</b>",
      "clique aqui para <b>acessar o registro anterior</b>",
      "clique aqui para <b>acessar o próximo registro</b>",
      "clique aqui para <b>acessar o último registro</b>",
      "clique aqui para <b>atualizar o registro de empréstimo apresentado</b>",
      "clique aqui para <b>excluir o registro de empréstimo apresentado</b>",
      "clique aqui para <b>pesquisar registros de empréstimos</b> com qualquer status",
      "clique aqui para <b>registrar novo empréstimo</b>",
      "clique aqui para <b>confirmar ou executar a operação</b>",
      "clique aqui para <b>cancelar a modificação</b> ou <b>encerrar a operação</b>"];
    $('#cmd input[type="button"]').each(
      function (index, input) {
        var btn = $(input).attr("title", provisorio[index]);
        btn.on({
            "disabledSet": function () { btn.tooltip("disable"); },
             "enabledSet": function () { btn.tooltip("enable"); },
                  "click": function () { btn.tooltip("close"); }
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

    // procedimento específico para tabelas vazias :: zero registros
    function whenTableIsEmpty() {
      counter[0].value = indexRec = 0;
      newBtn.click();                   // inserir registro :: o primeiro
      cancelBtn[0].disabled = true;     // somente será possível "salvar"
    }

    // preenchimento de todos INPUTs dos campos
    function setValues(array) {
      // preenche com componentes do "array" ou com strings vazias na ausência
      // de argumentos ou se argumento for indeterminado
      var f = (array === undefined) ? function (input) { input[0].value = ""; }
        : function (input, index) {
            input[0].value = (array[index] == "NULL") ? "" : array[index];
          };
      fields.forEach(f);
    }

    // declara o valor do atributo "readonly" dos inputs dos campos
    function setReadonly(value) {
      fields.forEach(function (input) { input.attr("readonly", value); });
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
            && !(c == 90 && ev.ctrlKey)
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
          show("\uF06A Atenção", "<p>A tabela está vazia.</p>");
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
          show("\uF06A Atenção", "<p>A edição do <strong>número de registro</strong> foi abortada pelo usuário, enquanto era esperado valor maior igual a <strong>1</strong> e menor igual a <strong>" + numRecs + "</strong>.</p>");
        }
        update();
      });

    // desabilita foco nos botões e no INPUT #amount
    actionButtons.concat([amount]).forEach(
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
        setReadonly(false);
        fields[FOCUS_NDX].focus();
      });

    delBtn.click(
      function () {
        delBtn.addClass("working");
        saveBtn[0].value = "\uF00C Confirmar";
        disableButtons();
      });

    searchBtn.click(
      function () {
        searchBtn.addClass("working");
        saveBtn[0].value = "\uF00C Executar";
        disableButtons();
        setValues();
        setReadonly(false);
        fields[FOCUS_NDX].focus();
      });

    newBtn.click(
      function () {
        newBtn.addClass("working");
        disableButtons();
        setValues();
        setReadonly(false);
        fields[0].focus();
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
              show("\uF06A Atenção", "<p>Não foi possível adicionar novo registro.\n\n" + texto + "</p>");
            } else {
              amount[0].value = ++numRecs;
              indexRec = parseInt(texto);
              update();
              counter[0].maxLength = amount[0].value.length;
              counter[0].disabled = false;
              commandButtons.forEach(
                function (el) {
                  el.removeClass("working").prop("disabled", false);
                });
              setDisabled(actionButtons, true);
              setReadonly(true);
              show("\uF06A Notificação", "<p>O novo registro foi adicionado com sucesso.</p>");
            }
          };
          par.push("?action=INSERT");
          addDataFields();

        } else if (searchBtn.hasClass("working")) {

          funktion = function (texto) {
            if (texto.startsWith("Advertência")) {
              show("\uF05A Informação", "<p><b>Não há dados que satisfaçam a pesquisa.</b>\n\nRevise os parâmetros e tente novamente.</p>");
              // FOR DEBUG PURPOSE: MURAL.append("SQL: " + texto);
            } else {
              let r = texto.split("\n");
              // checa se o resultado da pesquisa é único registro
              if (r.length == 1) {
                // monta o array dos valores dos campos
                r = r[0].split("|");
                // atualiza o contador do registro corrente
                indexRec = parseInt(counter[0].value = r.shift());
                counter[0].disabled = false;
                // habilita/desabilita botões de acesso sequencial
                setDisabled([firstBtn, previousBtn], indexRec <= 1);
                setDisabled([lastBtn, nextBtn], indexRec >= numRecs);
                // atualiza visualização e desabilita edição dos valores...
                setValues(r);
                setReadonly(true);
                // encerra o modo pesquisa e habilita os botões de comando
                searchBtn.removeClass("working");
                setDisabled(commandButtons, false);
                // desabilita os botões de ação
                setDisabled(actionButtons, true);
                saveBtn[0].value = "\uF00C Salvar";
                // "desfoca" algum input focado
                let elm = document.activeElement;
                if (elm.tagName == "INPUT" && elm.type == "text") elm.blur();
              } else {
                let buf = "> Sucesso: Localizou " + r.length + " registros:\n";
                // monta a lista de registros pesquisados
                r.forEach(
                  function (row) {
                    buf += "\n";
                    row.split("|").forEach(
                      function (value, index) {
                        buf += FIELDNAMES[index] + value + "\n";
                      });
                  });
                MURAL.append(buf);
              }
            }
          };
          par.push("?action=SEARCH");
          addDataFields();

        } else if (updateBtn.hasClass("working")) {

          funktion = function (texto) {
            if (texto.startsWith("Erro")) {
              show("\uF06A Atenção", "<p>Não foi possível atualizar o registro.\n\n" + texto + "</p>");
            } else {
              var n = parseInt(texto);
              if (n != indexRec) indexRec = n;
              show("\uF06A Notificação", "<p>O registro foi atualizado com sucesso.</p>");
              cancelBtn.click();
            }
          };
          par.push("?action=UPDATE&recnumber=", indexRec);
          addDataFields();

        } else if (delBtn.hasClass("working")) {

          funktion = function (texto) {
            if (texto.startsWith("Erro")) {
              show("\uF06A Atenção", "<p><b>Não foi possível excluir o registro.</b>\n\n" + texto + "</p>");
              cancelBtn.click();
            } else {
              amount[0].value = --numRecs;
              if (indexRec > numRecs) --indexRec;
              counter[0].maxLength = amount[0].value.length;
              show("\uF06A Notificação", "<p>O registro foi excluído com sucesso.</p>");
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
                cancelBtn.disabled = true;
                setValues();
                setReadonly(false);
                fields[0].focus();
              }
            }
          };
          par.push("?action=DELETE&recnumber=", indexRec);

        }

        $.get(par.join(""), funktion).done(function () { SPINNER.stop(); });

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
        setReadonly(true);                  // desabilita os inputs dos..
      });

    // preenche DATALISTs nas UIs da tabelas "acervo" e "obras"
    {
      let listas = $("#fields > datalist");
      if (listas.length > 0) {
        var URI = uri.substring(0, uri.lastIndexOf("/")+1);
        listas.each(
          function (index, dataList) {
            $.get(
              URI + dataList.id + ".php?action=GETALL",
              function (options) { dataList.innerHTML = options; });
          });
      }
    }

    // checa se há evidência de recarga do documento durante atualização,
    // pesquisa, exclusão ou inserção de novo registro, checando os valores
    // dos INPUTs mostradores de status da tabela
    if (counter.val() && amount.val()) {
      numRecs = parseInt(amount[0].value); // extrai o valor numérico do input
      if (numRecs == 0) {
        newBtn.click();
        cancelBtn[0].disabled = true;
        SPINNER.stop();
      } else {
        indexRec = parseInt(counter[0].value); // extrai o valor do input
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
              // habilita botões de navegação conforme número do registro
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
            firstBtn.click();   // mostra o primeiro registro
            setDisabled(actionButtons, true);
          } else {
            whenTableIsEmpty(); // força inserção de registro
          }
        }).done(function () { SPINNER.stop(); });
    }

  });