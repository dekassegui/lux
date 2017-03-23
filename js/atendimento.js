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
            // esconde o datepicker se a animação recém iniciou e se o
            // input é readonly :: evita corrupção da data apresentada
            if (!animationCompleted && dp.el.readOnly) dp.hide();
          }
        });
      });

    // URI do script "server side" que atende requisições ao DB
    var uri = location.href.replace("html", "php");

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
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
          if (this.readyState == 4 && this.status == 200) {
            // atualiza o input do índice do registro corrente
            counter.value = indexRec;
            // atualiza os inputs dos campos do registro corrente
            setInputsValues(this.responseText.split('|'));
            // habilita/desabilita botões de navegação
            setDisabled([firstBtn, previousBtn], indexRec <= 1);
            setDisabled([lastBtn, nextBtn], indexRec >= numRecs);
          }
        };
        xhr.open("GET", [uri, "?action=GETREC&recnumber=", indexRec]
                          .join(""), true);
        xhr.send();
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
              //print('> Erro: Número de registro é ilegal.');
              show('Erro: Número de registro é ilegal.');
              ev.preventDefault();
            }
          }
        } else {
          //print('> Erro: A tabela está vazia.');
          show('Erro: A tabela está vazia.');
        }
      }, true);

    counter.addEventListener('blur',
      function () {
        var valor = parseInt(counter.value);  // aborta edição pendente do
        if (0 < valor && valor <= numRecs) {  // input do índice do registro
          indexRec = valor;                   // corrente, atualizando-o
        } else {
          print('> Erro: Valor do índice do registro ilegal.');
          text = 'Erro: Valor do índice do registro ilegal.';
          if (0 < indexRec && indexRec <= numRecs) {
            //print('> Restaurando valor do índice do registro corrente.');
            text += '<br>Restaurando valor do índice do registro corrente.';
            counter.value = indexRec;
          } else {
            //print('> Reiniciando valor do índice do registro corrente.');
            text += '<br>Reiniciando valor do índice do registro corrente.';
            counter.value = indexRec = 1;
          }
          show(text);
        }
        update();
      }, true);

    [amount, infoBtn, leitorBtn].forEach(
      function (el) {
        el.addEventListener('focus', function () { this.blur(); });
      }, true);

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
        fields[/* fields[2].value.length > 0 ? 0 : 2 */ 0 ].focus();
      }, true);

    delBtn.addEventListener('click',
      function () {
        delBtn.classList.add('working');
        saveBtn.value = OKchar + " Confirmar";
        disableButtons();
      }, true);

    searchBtn.addEventListener('click',
      function () {
        searchBtn.classList.add('working');
        saveBtn.value = OKchar + ' Executar';
        disableButtons();
        setInputsValues();
        setInputsReadonly(false);
        fields[/* 1 */ 0 ].focus();
      }, true);

    newBtn.addEventListener('click',
      function () {
        newBtn.classList.add('working');
        disableButtons();
        setInputsValues();
        setInputsReadonly(false);
        fields[0].focus();
      }, true);

    saveBtn.addEventListener('click',
      function () {
        var par = [uri];

        function addDataFields() {
          fields.forEach(
            function (input) {
              par.push('&', input.id, '=', encodeURIComponent(input.value));
            });
        }

        var xhr = new XMLHttpRequest();
        if (newBtn.classList.contains('working')) {

          xhr.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
              if (this.responseText.startsWith('Error')) {
                //print('> Inserção mal sucedida.' + this.responseText);
                show('Inserção mal sucedida.<br>' + this.responseText);
              } else {
                amount.value = ++numRecs;
                indexRec = parseInt(this.responseText);
                update();
                counter.maxLength = amount.value.length;
                counter.disabled = false;
                commandButtons.forEach(
                  function (el) {
                    el.disabled = false;
                    el.classList.remove('working');
                  });
                setDisabled(actionButtons, true);
                setInputsReadonly(true);
                //print('> Inserção bem sucedida.');
                show('Inserção bem sucedida.');
              }
            }
          };
          par.push('?action=INSERT');
          addDataFields();

        } else if (searchBtn.classList.contains('working')) {

          xhr.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
              if (this.responseText.startsWith('Advertência')
                  || this.responseText.startsWith('Warning')) {
                var text = 'Não há dados que satisfaçam a pesquisa.';
                //print('> ' + text);
                show(text);
              } else {
                var n = this.responseText.split(/\r\n|\n|\r/g).length;
                var text = 'Sucesso, localizou ' + n + ' registro(s)';
                print('> ' + text + ':');
                show(text + '!');
              }
              print(this.responseText);
            }
          };
          par.push('?action=SEARCH');
          addDataFields();

        } else if (updateBtn.classList.contains('working')) {

          xhr.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
              if (this.responseText.startsWith('Error')) {
                //print('> Atualização mal sucedida.' + this.responseText);
                show('Atualização mal sucedida.<br>' + this.responseText);
              } else {
                var n = parseInt(this.responseText);
                if (n != indexRec) indexRec = n;
                //print('> Atualização bem sucedida.');
                show('Atualização bem sucedida.');
                cancelBtn.click();
              }
            }
          };
          par.push("?action=UPDATE&recnumber=", indexRec);
          addDataFields();

        } else if (delBtn.classList.contains('working')) {

          xhr.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
              if (this.responseText.startsWith('Error')) {
                //print('> Exclusão mal sucedida.' + this.responseText);
                show('Exclusão mal sucedida.<br>' + this.responseText);
                cancelBtn.click();
              } else {
                amount.value = --numRecs;
                if (indexRec > numRecs) --indexRec;
                counter.maxLength = amount.value.length;
                //print('> Exclusão bem sucedida.');
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
            }
          };
          par.push("?action=DELETE&recnumber=", indexRec);

        }
        xhr.open("GET", par.join(""), true);
        xhr.send();
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

    infoBtn.addEventListener('click',
      function () {
        // requisita listagem dos empréstimos esperado no dia corrente
        // e dos exemplares disponíveis no acervo, agrupados por título
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
          if (this.readyState == 4 && this.status == 200) {
            if (!MURAL.isEmpty()) print("");
            print(this.responseText);
          }
        };
        // monta a string da uri do script server side incumbente
        var aUri = uri.substring(0, uri.lastIndexOf("/")+1)
          + "reporter.php?action=INFO";
        xhr.open("GET", aUri, true);
        xhr.send();
      }, true);

    leitorBtn.addEventListener('click',
      function () {
        // requisita listagem dos leitores/obras com empréstimos em atraso
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
          if (this.readyState == 4 && this.status == 200) {
            if (!MURAL.isEmpty()) print("");
            print(this.responseText);
          }
        };
        // monta a string da uri do script server side incumbente
        var aUri = uri.substring(0, uri.lastIndexOf("/")+1)
          + "reporter.php?action=LEITOR";
        xhr.open("GET", aUri, true);
        xhr.send();
      }, true);

    // declara o listener de evento 'change' no input 'obra'
    fields[4].addEventListener('change',
      function () {
        // tenta atualizar as opções do datalist de "exemplares", "autor
        // &espirito" e "posição" conforme "título da obra" selecionado na
        // atualização ou criação de registro
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
              var xhr = new XMLHttpRequest();
              xhr.onreadystatechange = function () {
                if (this.readyState == 4 && this.status == 200) {
                  // obtem a posição do primeiro separador de valores
                  var j = this.responseText.indexOf('|');
                  // atualiza o valor do input 'autor'
                  fields[5].value = this.responseText.substring(0, j);
                  // mostra a posição dos exemplares da obra escolhida
                  var m = k = this.responseText.indexOf('\n');
                  if (this.responseText.charAt(k-1) == '\r') --m;
                  // atualiza o valor do input 'posicao'
                  fields[7].value = this.responseText.substring(j+1, m);
                  // obtem o datalist associado ao input 'exemplar'
                  datalist = $(fields[6].getAttribute('list'));
                  // substitui todos os itens da lista de opções, que pode
                  // tornar-se vazia caso não hajam exemplares disponíveis
                  var txt = montaOptions(this.responseText.substring(k+1));
                  datalist.innerHTML = txt;
                  if (txt.length > 0) {
                    // atualiza o valor do input 'exemplar' com o valor
                    // do primeiro item do datalist
                    fields[6].value = datalist.options.item(0).value;
                  }
                }
              };
              // prepara uri para requisitar "exemplares disponíveis"
              // da "obra" cujo "code" foi previamente identificado
              var aUri = uri.substring(0, uri.lastIndexOf('/')+1)
                + 'acervo_exemplares.php?code=' + code;
              xhr.open('GET', aUri, true);
              xhr.send();
            }
          }
        }
      }, true);

    {
      let aUri = uri.substring(0, uri.lastIndexOf("/")+1);
      // preenche datalists cujos ids correspondem ao nome (sem extensão)
      // do script server side que atende a requisição dos seus dados
      ['bibliotecarios', 'leitores', 'acervo_obras',
        'acervo_exemplares'].forEach(
        function (iD) {
          var xhr = new XMLHttpRequest();
          xhr.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200
                && this.responseText)
              $(iD).innerHTML = montaOptions(this.responseText);
          };
          // monta a uri do script backend incumbente
          xhr.open("GET", aUri + iD + ".php?action=GETALL", true);
          xhr.send();
        });
    }

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
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
          if (this.readyState == 4 && this.status == 200) {
            // atualiza os valores do registro corrente
            setInputsValues(this.responseText.split('|'));
          }
        };
        xhr.open("GET",
          [uri, "?action=GETREC&recnumber=", indexRec].join(""), true);
        xhr.send();

        // habilita edição e declara a quantidade máxima de
        // caracteres do input do índice do registro corrente
        counter.disabled = false;
        counter.maxLength = amount.value.length;

        // habilita/desabilita botões de navegação
        setDisabled([firstBtn, previousBtn], indexRec <= 1);
        setDisabled([lastBtn, nextBtn], indexRec >= numRecs);

        commandButtons.forEach(
          function (btn) {
            btn.disabled = false;             // habilita o botão
            btn.classList.remove('working'); // remove classe 'working'
          });

        setDisabled(actionButtons, true); // desabilita os 'action buttons'

      }

    } else {

      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
          // declara a quantidade inicial de registros da tabela
          numRecs = parseInt(amount.value = this.responseText);
          // declara a quantidade máxima de caracteres do input
          counter.maxLength = this.responseText.length;
          // ação inicial conforme quantidade de registros da tabela
          if (numRecs > 0) {
            firstBtn.click();   // mostra o primeiro registro
          } else {
            whenTableIsEmpty(); // força inserção de registro
          }
        }
      };
      xhr.open("GET", [uri, "?action=COUNT"].join(""), true);
      xhr.send();

    }

  }, true);