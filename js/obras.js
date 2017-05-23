/**
 * Este script é parte do projeto LUX, software livre para bibliotecas de
 * casas Espíritas, em desenvolvimento desde 12/11/2016.
*/
$(document).ready(
  function () {

    // URI do script backend que atende requisições ao DB
    const uri = location.href.replace("html", "php");

    new StyleSwitcher();

    var SPINNER = new Spinner("header");

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

    function setValues(array) {
      // preenche os inputs com componentes do argumento do tipo Array
      // ou com strings vazias se o argumento for indeterminado
      fields.forEach(
        (array === undefined) ? function (input) { input[0].value = ""; }
          : function (input, index) {
              input[0].value = (array[index] == "NULL") ? "" : array[index];
            }
      );
    }

    function setReadonly(bool) {
      // declara os valores do atributo readonly dos inputs de campos..
      fields.forEach(function (input) { input[0].readOnly = bool; });
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
          show("\uF06A Atenção", "A edição do <strong>número de registro</strong> foi abortada pelo usuário, enquanto era esperado valor maior igual a <strong>1</strong> e menor igual a <strong>" + numRecs + "</strong>.");
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
            SPINNER.stop();
            if (texto.startsWith("Erro")) {
              show("\uF06A Atenção", "<p>Não foi possível adicionar novo registro.</p>\n" + texto);
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
            SPINNER.stop();
            if (texto.startsWith("Advertência")) {
              show("\uF05A Informação", "<p>Não há dados que satisfaçam a pesquisa.</p>\nRevise os valores dos campos e tente novamente.");
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
            SPINNER.stop();
            if (texto.startsWith("Erro")) {
              show("\uF06A Atenção", "<p>Não foi possível atualizar o registro.</p>\n" + texto);
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
            SPINNER.stop();
            if (texto.startsWith("Erro")) {
              show("\uF06A Atenção", "<p>Não foi possível excluir o registro.</p>\n<p>" + texto + "</p>");
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
        setReadonly(true);                  // desabilita os inputs dos..
      });

    // preenche DATALISTs cujos IDs correspondem ao nome (sem extensão)
    // do script backend que atende a requisição dos seus dados
    (
      function () {
        var listas = $("#fields > datalist");
        if (listas.length > 0) {
          var URI = uri.substring(0, uri.lastIndexOf("/")+1);
          listas.toArray().map($).forEach(
            function (dataList) {
              $.get(
                URI + dataList[0].id + ".php?action=GETALL",
                function (options) { dataList.html(options); });
            });
        }
      }
    )();

    // testa se valores de ambos inputs mostradores de status da tabela não
    // são string vazia, evidenciando que o documento foi atualizado durante
    // pesquisa, atualização, exclusão ou inserção de novo registro
    if (counter[0].value.length > 0 && amount[0].value.length > 0) {

      numRecs = parseInt(amount[0].value); // extrai o valor numérico do input

      if (numRecs == 0) {

        newBtn.click();
        cancelBtn[0].disabled = true;

      } else {

        indexRec = parseInt(counter[0].value); // extrai o valor do input

        // restaura os valores dos inputs consultando o DB por segurança
        $.get(
          uri + "?action=GETREC&recnumber=" + indexRec,
          function (texto) {
            SPINNER.stop();
            // atualiza os valores do registro corrente
            setValues(texto.split("|"));
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
          SPINNER.stop();
          // declara a quantidade inicial de registros da tabela
          numRecs = parseInt(amount[0].value = texto);
          // declara a quantidade máxima de caracteres do input
          counter[0].maxLength = texto.length;
          // ação inicial conforme quantidade de registros da tabela
          if (numRecs > 0) {
            firstBtn.click();   // mostra o primeiro registro
          } else {
            whenTableIsEmpty(); // força inserção de registro
          }
        });

    }

  });