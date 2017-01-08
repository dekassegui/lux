/**
 * Este script é parte do projeto LUX, software livre para bibliotecas de
 * casas Espíritas, em desenvolvimento desde 12/11/2016.
*/

/**
 * Listener que ativa comandos para controle "full time" de dimensões
 * de elementos do documento que serve de interface entre o usuário e a
 * aplicação para gestão de tabelas persistentes do projeto LUX, em
 * complemento às suas declarações CSS.
*/
window.onresize = function () {
  // estabelece dinamicamente a largura do elemento 'aside'
  // em função da largura da janela (aka document.body)
  var w = parseInt(document.body.clientWidth);
  var x = (w < 1000) ? w-20 : w-parseInt($$('section').clientWidth)-30;
  $$('aside').style.width = x + 'px';
}

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

    window.onresize();  // ajuste inicial da largura do elemento 'aside'

    // URI do script "server side" que atende requisições ao DB
    var uri = location.href.replace("html", "php");

    var indexRec,                 // índice do registro corrente
        counter = $('counter');   // input do índice do..

    var numRecs,                  // quantidade de registros da tabela
        amount  = $('amount');    // input da quantidade de..

    var fields = $$('section > div#fields > input');

    var firstBtn    = $('firstBtn'),  previousBtn = $('previousBtn'),
        nextBtn     = $('nextBtn'),   lastBtn     = $('lastBtn');

    var updateBtn = $('updateBtn'),   delBtn    = $('delBtn'),
        searchBtn = $('searchBtn'),   newBtn    = $('newBtn'),
        saveBtn   = $('saveBtn'),     cancelBtn = $('cancelBtn');

    var actionButtons = [saveBtn, cancelBtn];

    var commandButtons = [updateBtn, delBtn, searchBtn, newBtn];

    var MURAL = (function () {

      var mural = $('mural');  // área de notificações ao usuário

      var lineHeight = parseInt(getCSSproperty(mural, 'line-height'));

      mural.oninput = function () {
        if (mural.textLength == 0) {
          mural.classList.add('empty');
        } else {
          mural.classList.remove('empty');
        }
      };

      // agrega 'text' como apêndice do conteúdo da textarea cujo canvas
      // escorre até que 'text' seja visível tão ao topo quanto possível
      this.append = function (text) {
        if (text.map) {
          text.map(append);
        } else {
          var a = mural.clientHeight,   // altura do canvas
              b = mural.scrollHeight;   // altura do conteúdo a priori
          if (mural.textLength > 0) {
            mural.value = [mural.value, text].join("\n");
          } else {
            mural.value = text;
            mural.oninput();
          }
          if (b > a) {
            mural.scrollTop = b - lineHeight;
          }
        }
      };

      // inicia o mural com saudação em função da hora local
      mural.value = ["> Boa noite!", "> Bom dia!", "> Boa tarde!"]
        [Math.floor(new Date().getHours() / 6) % 3];

      return this;

    })();

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
      fields.forEach(function (input) { input.readOnly = boolValue; });
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
              print('> Erro: Número de registro é ilegal.');
              ev.preventDefault();
            }
          }
        } else {
          print('> Erro: A tabela está vazia.');
        }
      }, true);

    counter.addEventListener('blur',
      function () {
        var valor = parseInt(counter.value);  // aborta edição pendente do
        if (0 < valor && valor <= numRecs) {  // input do índice do registro
          indexRec = valor;                   // corrente, atualizando-o
        } else {
          print('> Erro: Valor do índice do registro ilegal.');
          if (0 < indexRec && indexRec <= numRecs) {
            print('> Restaurando valor do índice do registro corrente.');
            counter.value = indexRec;
          } else {
            print('> Reiniciando valor do índice do registro corrente.');
            counter.value = indexRec = 1;
          }
        }
        update();
      }, true);

    amount.addEventListener('focus', function () { this.blur(); }, true);

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
        fields[fields[1].value.length > 0 ? 0 : 1].focus();
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
        fields[0].focus();
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
                print(['> Inserção mal sucedida.', this.responseText]);
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
                print('> Inserção bem sucedida.');
              }
            }
          };
          par.push('?action=INSERT');
          addDataFields();

        } else if (searchBtn.classList.contains('working')) {

          xhr.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
              if (this.responseText.startsWith('Warning')) {
                print('> Não há dados que satisfaçam a pesquisa.');
              } else {
                var n = this.responseText.split(/\n|\r|\r\n/g).length;
                print(['> Sucesso, localizou ', ' registro(s):'].join(n));
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
                print(['> Atualização mal sucedida.', this.responseText]);
              } else {
                var n = parseInt(this.responseText);
                if (n != indexRec) indexRec = n;
                print('> Atualização bem sucedida.');
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
                print(['> Exclusão mal sucedida.', this.responseText]);
              } else {
                amount.value = --numRecs;
                if (indexRec > numRecs) --indexRec;
                counter.maxLength = amount.value.length;
                print('> Exclusão bem sucedida.');
              }
              cancelBtn.click();
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
        setInputsReadonly(true);            // desabilita os inputs dos..
      }, true);

    {
      // preenche datalists cujos ids correspondem ao nome (sem extensão)
      // do script server side que atende a requisição dos seus dados
      ['bibliotecarios', 'leitores', 'acervo_obras', 'acervo_exemplares'].forEach(
        function (iD) {
          var datalist = $(iD);
          var xhr = new XMLHttpRequest();
          xhr.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
              var fragment = document.createDocumentFragment();
              this.responseText.split(/\n|\r|\r\n/g).forEach(
                function (text) {
                  var option = document.createElement("option");
                  var j = text.indexOf('|');
                  option.setAttribute("code", text.substring(0, j));
                  option.value = text.substring(j+1);
                  fragment.appendChild(option);
                }
              );
              datalist.appendChild(fragment);
            }
          };
          // monta a string da uri do script server side incumbente
          var aUri = uri.substring(0, uri.lastIndexOf("/")+1)
            + iD + ".php?action=GETALL";
          xhr.open("GET", aUri, true);
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

  },
  true);