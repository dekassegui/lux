/**
 * Este script é parte do projeto LUX, software livre para bibliotecas de
 * casas Espíritas, em desenvolvimento desde 12/11/2016.
*/

/**
 * Listener que ativa comandos para controle "full time" do aplicativo
 * para gestão de tabelas persistentes do projeto LUX, até o fim do seu
 * "life cycle", indiferente a recargas do documento interface.
*/
window.addEventListener('load',
  function () {

    $.noConflict();

    ["#data_emprestimo", "#data_devolucao"].forEach(
      function (iD) {
        jQuery(iD).datepicker({
          autoClose: true,
          language: 'pt-BR',
          dateFormat: 'dd-mm-yyyy',
          navTitles: {
            days: 'MM - <i>yyyy</i>',
            months: 'yyyy',
            years: 'yyyy1 - yyyy2'
          },
          timepicker: true,
          todayButton: new Date(),
          clearButton: true,
          keyboardNav: false,
          onShow: function (dp, animationCompleted) {
            if (dp.el.readOnly && !animationCompleted) {
              jQuery(dp.el).data("preserved", dp.el.value);
            }
          },
          onHide: function (dp, animationCompleted) {
            var inp = dp.el;
            if (inp.readOnly && inp.value != jQuery(inp).data("preserved")) {
              if (animationCompleted) {
                var valor = jQuery(inp).data("preserved");
                if (valor !== undefined) inp.value = valor;
              } else {
                show('<strong>READ ONLY</strong><br>O campo está disponível <b>somente&nbsp;para&nbsp;leitura</b>.');
              }
            }
          },
        });
      });

    (
      function ($) {
        var w = $(window);
        var h = $("header");
        var d = $("section > div:first-child");
        var b = true; /* a priori: d.innerHeight() > 0 */

        h.click(function () {
            // atualização do tooltip do header
            const a = ["esconder", "restaurar"];
            h.attr("title", "clique aqui para " + a[b=!b&1] + " o formulário");
          }
        ).click( /* atualização inicial */ ).click(function () {
            // posiciona window no topo
            w.scrollTo(0, 400 + (window.scrollY / 100 + 1) * 100);
            // alterna a visualização do formulário
            d.slideToggle("slow");
          }
        );
      }
    )(jQuery);

    // URI do script "server side" que atende requisições ao DB
    const uri = location.href.replace("html", "php");

    const aUri = uri.substring(0, uri.lastIndexOf("/")+1);

    var indexRec,                 // índice do registro corrente
        counter = $('counter');   // input do índice do..

    var numRecs,                  // quantidade de registros da tabela
        amount  = $('amount');    // input da quantidade de..

    var fields = ['bibliotecario', 'data_emprestimo', 'data_devolucao',
      'leitor', 'obra', 'autor', 'exemplar', 'posicao', 'comentario']
        .map( function(iD) { return $(iD); } );

    var firstBtn = $('firstBtn'),  previousBtn = $('previousBtn'),
        nextBtn  = $('nextBtn'),   lastBtn     = $('lastBtn');

    var updateBtn = $('updateBtn'),  delBtn    = $('delBtn'),
        searchBtn = $('searchBtn'),  newBtn    = $('newBtn'),
        saveBtn   = $('saveBtn'),    cancelBtn = $('cancelBtn'),
        infoBtn   = $('cmd01Btn'),   leitorBtn = $('cmd02Btn');

    var commandButtons = [updateBtn, delBtn, searchBtn, newBtn, infoBtn,
      leitorBtn];

    var actionButtons = [saveBtn, cancelBtn];

    var MURAL = new Mural();

    function print(text) { MURAL.append(text); }

    function scrollTo(y) {
      const win = jQuery(window);
      var d = window.scrollY;
      if (y === undefined) {
        d = y = $("mural").offsetTop - $$("body > header").offsetHeight - 5;
      }
      win.scrollTo(y, 400 + (d / 100 + 1) * 100, {easing:"swing"});
    }

    function disableButtons() {
      // desabilita botões de navegação & comando
      setDisabled([firstBtn, previousBtn, nextBtn, lastBtn], true);
      setDisabled(commandButtons, true);
      // habilita 'action buttons'
      setDisabled(actionButtons, false);
      // desabilita edição do índice do registro corrente
      counter.disabled = true;
    }

    function whenTableIsEmpty() {
      // prepara a única ação possível quando a tabela está vazia
      counter.value = indexRec = 0;
      newBtn.click();               // inserir registro :: o primeiro
      cancelBtn.disabled = true;    // somente será possível 'salvar'
    }

    function setInputsValues(array) {
      // preenche os inputs com componentes do argumento do tipo Array
      // ou com strings vazias se o argumento for indeterminado
      fields.forEach(
        (array === undefined) ? function (input) { input.value = ''; }
          : function (input, index) {
              input.value = (array[index] == 'NULL') ? '' : array[index];
            }
      );
    }

    function setInputsReadonly(boolValue) {
      // declara os valores do atributo readonly dos inputs de campos..
      (boolValue || searchBtn.classList.contains('working') ?
        [0, 1, 2, 3, 4, 5, 6, 7, 8] : [0, 1, 2, 3, 4, 6]).forEach(
          function (index) { fields[index].readOnly = boolValue; });
    }

    function update() {
      // testa o índice do registro corrente para atualizar os
      // respectivos dados ou preparar inserção na tabela vazia
      if (indexRec > 0) {
        jQuery.get(
          uri + "?action=GETREC&recnumber=" + indexRec,
          function (data) {
            // atualiza o input do índice do registro corrente
            counter.value = indexRec;
            // atualiza os inputs dos campos do registro corrente
            setInputsValues(data.split('|'));
            // habilita/desabilita botões de navegação
            setDisabled([firstBtn, previousBtn], indexRec <= 1);
            setDisabled([lastBtn, nextBtn], indexRec >= numRecs);
          });
      } else {
        whenTableIsEmpty();
      }
    }

    fields.forEach(
      function (input) {
        // incrementa a responsividade do input no evento 'keydown'
        input.addEventListener('keydown',
          function (ev) {
            // rejeita o evento na exclusão de registros
            if (delBtn.classList.contains('working')) return;
            // testa se 'action buttons' estão habilitados
            if (actionButtons.every(item => item.disabled == false)) {
              ev = ev || event;
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
          }, true);
      });

    counter.addEventListener('keydown',
      function (ev) {
        if (numRecs > 0) {
          ev = ev || event;
          // cancela o evento se a tecla pressionada não for digito entre
          // 0 e 9 (inclusive as do Numpad), Enter, Tab, Del, Backspace,
          // Left, Right, Home, End, Escape e Ctrl-Z
          var c = ev.keyCode;
          if ((c < 48 || c > 57) && (c < 96 || c > 105)
            && !(c == 90 && ev.ctrlKey) // NOT Ctrl-Z
            && (binarySearch([8, 9, 13, 27, 35, 36, 37, 39, 46], c) == -1)) {
            ev.preventDefault();
          } else if (c == 27) { // <Escape> desfaz edição
            counter.value = indexRec;
            update();
          } else if (c == 13 || c == 9) {           // <Enter> ou <Tab>
            var valor = parseInt(ev.target.value);  // atualiza o valor
            if (0 < valor && valor <= numRecs) {
              indexRec = valor;
              update();
            } else {
              show('Erro: Número de registro é ilegal.');
              ev.preventDefault();
            }
          }
        } else {
          show('Erro: A tabela está vazia.');
        }
      }, true);

    counter.addEventListener('blur',
      function () {
        var valor = parseInt(counter.value);  // aborta edição pendente do
        if (0 < valor && valor <= numRecs) {  // input do índice do registro
          indexRec = valor;                   // corrente, atualizando-o
        } else {
          var text = 'Erro: Valor do índice do registro ilegal.';
          if (0 < indexRec && indexRec <= numRecs) {
            text += '<br>Restaurando valor do índice do registro corrente.';
            counter.value = indexRec;
          } else {
            text += '<br>Reiniciando valor do índice do registro corrente.';
            counter.value = indexRec = 1;
          }
          show(text);
        }
        update();
      }, true);

    actionButtons.concat([amount, infoBtn, leitorBtn]).forEach(
      function (elm) {
        elm.addEventListener('focus', function () { this.blur(); }, true);
      });

    firstBtn.addEventListener('click',
      function () {
        indexRec = 1;
        update();
      }, true);

    previousBtn.addEventListener('click',
      function () {
        if (indexRec-1 > 0) { // evita o "bug do botão pressionado", cuja
          --indexRec;         // habilitação sai de sincronia com o índice
          update();           // do registro corrente devido a latência do
        }                     // servidor e do DB para atender requisições
      }, true);

    nextBtn.addEventListener('click',
      function () {
        if (indexRec+1 <= numRecs) {
          ++indexRec;
          update();
        }
      }, true);

    lastBtn.addEventListener('click',
      function () {
        indexRec = numRecs;
        update();
      }, true);

    updateBtn.addEventListener('click',
      function () {
        updateBtn.classList.add('working');
        disableButtons();
        setInputsReadonly(false);
        scrollTo(0);
        if (fields[2].value.length == 0) fields[2].focus();
      }, true);

    delBtn.addEventListener('click',
      function () {
        delBtn.classList.add('working');
        saveBtn.value = OKchar + " Confirmar";
        disableButtons();
        scrollTo(0);
      }, true);

    searchBtn.addEventListener('click',
      function () {
        searchBtn.classList.add('working');
        saveBtn.value = OKchar + ' Executar';
        disableButtons();
        setInputsValues();
        setInputsReadonly(false);
        scrollTo(0);
        fields[ 4 ].focus();
      }, true);

    newBtn.addEventListener('click',
      function () {
        newBtn.classList.add('working');
        disableButtons();
        setInputsValues();
        setInputsReadonly(false);
        scrollTo(0);
        fields[0].focus();
      }, true);

    saveBtn.addEventListener('click',
      function () {
        var funktion, par = [uri];

        function addDataFields() {
          fields.forEach(
            function (input) {
              par.push('&', input.id, '=', encodeURIComponent(input.value));
            });
        }

        if (newBtn.classList.contains('working')) {

          funktion = function (data) {
            if (data.startsWith('Error')) {
              show('Inserção mal sucedida.<br>' + data);
            } else {
              amount.value = ++numRecs;
              indexRec = parseInt(data);
              counter.maxLength = amount.value.length;
              counter.disabled = false;
              // atualiza para apresentar a data limite :: comentário
              update();
              // habilita/desabilita botões de comando
              commandButtons.forEach(
                function (el) {
                  el.disabled = false;
                  el.classList.remove('working');
                });
              setDisabled(actionButtons, true);
              setInputsReadonly(true);
              show('Inserção bem sucedida.');
            }
          };
          par.push('?action=INSERT');
          addDataFields();

        } else if (searchBtn.classList.contains('working')) {

          funktion = function (data) {
            if (/^(?:Advertência|Warning)/.test(data)) {
              show('Não há dados que satisfaçam a pesquisa.');
            } else {
              let r = data.split(/\r\n|\n|\r/g);
              // checa se resultado da pesquisa é registro único
              if (r.length == 1) {
                r = r[0].split('|');
                // atualiza o índice do registro corrente
                indexRec = parseInt(counter.value = r[0]);
                counter.disabled = false;
                setDisabled([firstBtn, previousBtn], indexRec <= 1);
                setDisabled([lastBtn, nextBtn], indexRec >= numRecs);
                // atualiza valores apresentados no formulário
                r[0] = r.splice(3, 1)[0];
                setInputsValues(r);
                setInputsReadonly(true);
                // restaura status dos botões
                searchBtn.classList.remove('working');
                commandButtons.forEach(function (b) { b.disabled = false; });
                setDisabled(actionButtons, true);
                saveBtn.value = OKchar + ' Salvar';
                // "desfoca" algum input focado
                let elm = document.activeElement;
                if (elm.tagName == 'INPUT' && elm.type == 'text') elm.blur();
              } else {
                print('> Sucesso: Localizou ' + r.length + ' registros:');
                // monta o array de labels dos campos dos registros
                const labels = ['#Registro', 'Emprestimo', 'Devolução', 'Agente', 'Leitor', 'Título', 'Autor&Espírito', 'Exemplar', 'Posição', 'Comentário'].map(
                  function (s) { return leftPad(s, 16) + ': '; });
                // monta a lista dos registros pesquisados
                let text = '';
                for (var fields, n=labels.length, i, j=0; j<r.length; ++j) {
                  text += '\n';
                  fields = r[j].split('|');
                  for (i=0; i<n; ++i) text += labels[i] + fields[i] + '\n';
                }
                print(text);
                scrollTo();
              }
            }
          };
          par.push('?action=SEARCH');
          addDataFields();

        } else if (updateBtn.classList.contains('working')) {

          funktion = function (data) {
            if (data.startsWith('Error')) {
              show('Atualização mal sucedida.<br>' + data);
            } else {
              var n = parseInt(data);
              if (n != indexRec) indexRec = n;
              show('Atualização bem sucedida.');
              update();
              commandButtons.forEach(
                function (elm) {
                  elm.disabled = false;
                  elm.classList.remove('working');
                });
              setDisabled(actionButtons, true);
              counter.disabled = false;
              setInputsReadonly(true);
            }
          };
          par.push("?action=UPDATE&recnumber=", indexRec);
          addDataFields();

        } else if (delBtn.classList.contains('working')) {

          funktion = function (data) {
            if (data.startsWith('Error')) {
              show('Exclusão mal sucedida.<br>' + data);
              cancelBtn.click();
            } else {
              amount.value = --numRecs;
              if (indexRec > numRecs) --indexRec;
              counter.maxLength = amount.value.length;
              show('Exclusão bem sucedida.');
              if (indexRec > 0) {
                cancelBtn.click();
              } else {
                // alterna de "excluir" para "novo"
                counter.value = 0;
                delBtn.classList.remove('working');
                newBtn.classList.add('working');
                // modifica rotulo do botão
                saveBtn.value = OKchar + ' Salvar';
                // somente permite "salvar"
                cancelBtn.disabled = true;
                setInputsValues();
                setInputsReadonly(false);
                /* TODO: foco inútil devido ao diálogo */
                fields[0].focus();
              }
            }
          };
          par.push("?action=DELETE&recnumber=", indexRec);

        }

        jQuery.get(par.join(""), funktion);

      }, true);

    cancelBtn.addEventListener('click',
      function () {
        update();
        commandButtons.forEach(
          function (elm) {
            elm.disabled = false;             // habilita o botão
            elm.classList.remove('working');  // remove classe 'working'
          });
        setDisabled(actionButtons, true);   // desabilita 'action buttons'
        counter.disabled = false;           // habilita edição no input..
        saveBtn.value = OKchar + ' Salvar'; // restaura o rotulo do botão
        setInputsReadonly(true);            // desabilita edição dos inputs
      }, true);

    jQuery(infoBtn).click(function () {
        // requisita listagem dos empréstimos esperado no dia corrente
        // e dos exemplares disponíveis no acervo, agrupados por título
        jQuery.get(
          aUri + "reporter.php?action=INFO",
          function (data) {
            if (!MURAL.isEmpty()) print("");
            print(data);
            scrollTo();
          });
      });

    jQuery(leitorBtn).click(function () {
        // requisita listagem dos leitores/obras com empréstimos em atraso
        jQuery.get(
          aUri + "reporter.php?action=LEITOR",
          function (data) {
            if (!MURAL.isEmpty()) print("");
            print(data);
            scrollTo();
          });
      });

    // declara o listener de evento "input" no input "obra" para atualizar
    // as opções do datalist de "exemplares", "autor&espirito" e "posição"
    // conforme "título da obra" selecionado na atualização ou criação de
    // registros de empréstimo
    jQuery(fields[4]).bind('input',
      function () {
        if ([newBtn, updateBtn].some(Bt => Bt.classList.contains('working'))) {
          // esvazia os valores dos inputs 'exemplar', 'autor' e 'posicao'
          for (var i=5; i<8; ++i) fields[i].value = '';
          // checa se o valor do input 'obra' não está vazio
          if (fields[4].value) {
            // obtem o datalist associado ao input 'obra'
            var code, datalist = $(fields[4].getAttribute('list'));
            // percorre as options do datalist associado ao input "obra"
            // para obter o "code" correspondente ao título selecionado
            for (var titulo=fields[4].value, collection=datalist.options, j=0;
                 !code && j<collection.length; ++j) {
              if (collection.item(j).value == titulo) {
                code = collection.item(j).getAttribute('code');
              }
            }
            if (code) {
              jQuery.get(
                aUri + 'acervo_exemplares.php?code=' + code,
                function (data) {
                  // obtem a posição do primeiro separador de valores
                  var j = data.indexOf('|');
                  // atualiza o valor do input 'autor'
                  fields[5].value = data.substring(0, j);
                  // mostra a posição dos exemplares da obra escolhida
                  var m = k = data.indexOf('\n');
                  if (data.charAt(k-1) == '\r') --m;
                  // atualiza o valor do input 'posicao'
                  fields[7].value = data.substring(j+1, m);
                  // obtem o datalist associado ao input 'exemplar'
                  datalist = $(fields[6].getAttribute('list'));
                  // substitui todos os itens da lista de opções, que pode
                  // tornar-se vazia caso não hajam exemplares disponíveis
                  var txt = montaOptions(data.substring(k+1));
                  datalist.innerHTML = txt;
                  if (txt.length > 0) {
                    // atualiza o valor do input 'exemplar' com o valor
                    // do primeiro item do datalist
                    fields[6].value = datalist.options.item(0).value;
                  } else {
                    show("Nenhum exemplar da obra<br>está disponível no momento.");
                    fields[6].value = "😣 Não achei!";
                  }
                });
            }
          }
        }
      });

    // preenche datalists cujos ids correspondem ao nome (sem extensão)
    // do script server side que atende a requisição dos seus dados
    jQuery("section > div:first-child datalist").each(
      function () {
        var dataList = jQuery(this);
        jQuery.get(
          aUri + dataList.attr("id") + ".php?action=GETALL",
          function (data) { if (data) dataList.html(montaOptions(data)); }
        );
      });

    // testa se valores de ambos inputs mostradores de status da tabela não
    // são string vazia, evidenciando que o documento foi atualizado durante
    // pesquisa, atualização, exclusão ou inserção de novo registro
    if ([counter, amount].every(input => input.value.length > 0)) {

      numRecs = parseInt(amount.value); // extrai o valor do input

      if (numRecs == 0) {

        newBtn.click();
        cancelBtn.disabled = true;

      } else {

        indexRec = parseInt(counter.value); // extrai o valor do input

        // restaura os valores dos inputs consultando o DB por segurança
        jQuery.get(
          uri + "?action=GETREC&recnumber=" + indexRec,
          function (data) {
            // atualiza os valores do registro corrente
            setInputsValues(data.split('|'));
          });

        // habilita edição e declara a quantidade máxima de
        // caracteres do input do índice do registro corrente
        counter.disabled = false;
        counter.maxLength = amount.value.length;

        // habilita/desabilita botões de navegação
        setDisabled([firstBtn, previousBtn], indexRec <= 1);
        setDisabled([lastBtn, nextBtn], indexRec >= numRecs);

        commandButtons.forEach(
          function (btn) {
            btn.disabled = false;            // habilita o botão
            btn.classList.remove('working'); // remove classe 'working'
          });

        setDisabled(actionButtons, true); // desabilita os 'action buttons'

      }

    } else {

      jQuery.get(
        uri + "?action=COUNT",
        function (data) {
          // declara a quantidade inicial de registros da tabela
          numRecs = parseInt(amount.value = data);
          // declara a quantidade máxima de caracteres do input
          counter.maxLength = data.length;
          // ação inicial conforme quantidade de registros da tabela
          if (numRecs > 0) {
            firstBtn.click();   // mostra o primeiro registro
          } else {
            whenTableIsEmpty(); // força inserção de registro
          }
        });

    }

  }, true);