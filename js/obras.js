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

    window.onresize();  // ajuste inicial da largura do elemento 'aside'

    // URI do script "server side" que atende requisições ao DB
    var uri = location.href.replace("html", "php");

    var indexRec,                 // índice do registro corrente
        counter = $('counter');   // input do índice do..

    var numRecs,                  // quantidade de registros da tabela
        amount  = $('amount');    // input da quantidade de..

    var fields = $$('section > div#fields > input');

    // número de ordem do input a focar quando iniciar atualização ou pesquisa
    var FOCUS_NDX = (fields[0].id == "code") ? 1 : 0;

    var firstBtn    = $('firstBtn'),  previousBtn = $('previousBtn'),
        nextBtn     = $('nextBtn'),   lastBtn     = $('lastBtn');

    var updateBtn = $('updateBtn'),   delBtn    = $('delBtn'),
        searchBtn = $('searchBtn'),   newBtn    = $('newBtn'),
        saveBtn   = $('saveBtn'),     cancelBtn = $('cancelBtn');

    var actionButtons = [saveBtn, cancelBtn];

    var commandButtons = [updateBtn, delBtn, searchBtn, newBtn];

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
      fields.forEach(function (input) { input.readOnly = boolValue; });
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
        jQuery(input).keydown(
          function (ev) {
            // rejeita o evento na exclusão de registros
            if (delBtn.classList.contains('working')) return;
            // testa se 'action buttons' estão habilitados
            if (actionButtons.every(item => item.disabled == false)) {
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

    jQuery(counter).keydown(
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
      });

    counter.addEventListener('blur',
      function () {
        var valor = parseInt(counter.value);  // aborta edição pendente do
        if (0 < valor && valor <= numRecs) {  // input do índice do registro
          indexRec = valor;                   // corrente, atualizando-o
        } else {
          print('> Erro: Valor do índice do registro ilegal.');
          if (0 < indexRec && indexRec <= numRecs) {
            print('> Restaurando valor do índice do registro corrente.');
          } else {
            print('> Reiniciando valor do índice do registro corrente.');
            indexRec = 1;
          }
          counter.value = indexRec;
        }
        update();
      }, true);

    actionButtons.concat([amount]).forEach(
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
        fields[FOCUS_NDX].focus();
      }, true);

    delBtn.addEventListener('click',
      function () {
        delBtn.classList.add('working');
        saveBtn.value = "\uF00C Confirmar";
        disableButtons();
      }, true);

    searchBtn.addEventListener('click',
      function () {
        searchBtn.classList.add('working');
        saveBtn.value = '\uF00C Executar';
        disableButtons();
        setInputsValues();
        setInputsReadonly(false);
        fields[FOCUS_NDX].focus();
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
        var funktion, par = [uri];

        function addDataFields() {
          fields.forEach(
            function (input) {
              par.push('&', input.id, '=', encodeURIComponent(input.value));
            });
        }

        if (newBtn.classList.contains('working')) {

          funktion = function(data) {
            if (data.startsWith('Error')) {
              print(['> Inserção mal sucedida.', data]);
            } else {
              amount.value = ++numRecs;
              indexRec = parseInt(data);
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
          };
          par.push('?action=INSERT');
          addDataFields();

        } else if (searchBtn.classList.contains('working')) {

          funktion = function(data) {
            if (/^(?:Advertência|Warning)/.test(data)) {
              show('Não há dados que satisfaçam a pesquisa.');
              // FOR DEBUG PURPOSE: print('SQL: ' + data);
            } else {
              let r = data.split(/\r\n|\n|\r/g);
              // checa se o resultado da pesquisa é único registro
              if (r.length == 1) {
                // monta o array dos valores dos campos
                r = r[0].split('|');
                // atualiza o contador do registro corrente
                indexRec = parseInt(counter.value = r[0]);
                counter.disabled = false;
                // habilita/desabilita botões de acesso sequencial
                setDisabled([firstBtn, previousBtn], indexRec <= 1);
                setDisabled([lastBtn, nextBtn], indexRec >= numRecs);
                // remove o primeiro dos valores...
                r.shift();
                // atualiza visualização e desabilita edição dos valores...
                setInputsValues(r);
                setInputsReadonly(true);
                // encerra o modo pesquisa e habilita os botões de comando
                searchBtn.classList.remove('working');
                commandButtons.forEach(function (b) { b.disabled = false; });
                // desabilita os botões de ação
                setDisabled(actionButtons, true);
                saveBtn.value = '\uF00C Salvar';
                // "desfoca" algum input focado
                let elm = document.activeElement;
                if (elm.tagName == 'INPUT' && elm.type == 'text') elm.blur();
              } else {
                let text = 'Sucesso: Localizou ' + r.length + ' registros:';
                print('> ' + text);
                const nomes = {
                  'autores': ['#Registro', 'Código', 'Nome', 'Espíritos'],
                  'generos': ['#Registro', 'Código', 'Nome'],
                  'obras': ['#Registro', 'Código', 'Título' , 'Autores', 'Gênero'],
                  'acervo': ['#Registro', 'Obra', 'Exemplar', 'Posição', 'Comentário'],
                  'bibliotecarios': ['#Registro', 'Código', 'Nome'],
                  'leitores': ['#Registro', 'Código', 'Nome', 'Telefone', 'e-Mail']
                };
                // extrai a chave da uri da página corrente
                let key = location.pathname.substring(1);
                key = key.substring(key.indexOf('/')+1, key.indexOf('.'));
                // calcula o comprimento dos labels das colunas
                let m = Math.max.apply(null,
                  nomes[key].map(function (s) { return s.length; })) + 2;
                // monta labels alinhados a direita
                let labels = nomes[key].map(
                  function (s) { return leftPad(s, m) + ': '; });
                // monta a lista de registros pesquisados
                text = '';
                for (var fields, k=labels.length, j, i=0; i<r.length; ++i) {
                  fields = r[i].split('|');
                  text += '\n';
                  for (j=0; j<k; ++j) text += labels[j] + fields[j] + '\n';
                }
                print(text);
              }
            }
          };
          par.push('?action=SEARCH');
          addDataFields();

        } else if (updateBtn.classList.contains('working')) {

          funktion = function(data) {
            if (data.startsWith('Error')) {
              print(['> Atualização mal sucedida.', data]);
            } else {
              var n = parseInt(data);
              if (n != indexRec) indexRec = n;
              print('> Atualização bem sucedida.');
              cancelBtn.click();
            }
          };
          par.push("?action=UPDATE&recnumber=", indexRec);
          addDataFields();

        } else if (delBtn.classList.contains('working')) {

          funktion = function(data) {
            if (data.startsWith('Error')) {
              print(['> Exclusão mal sucedida.', data]);
              cancelBtn.click();
            } else {
              amount.value = --numRecs;
              if (indexRec > numRecs) --indexRec;
              counter.maxLength = amount.value.length;
              print('> Exclusão bem sucedida.');
              if (indexRec > 0) {
                cancelBtn.click();
              } else {
                // alterna de "excluir" para "novo"
                counter.value = 0;
                delBtn.classList.remove('working');
                newBtn.classList.add('working');
                // modifica rotulo do botão
                saveBtn.value = '\uF00C Salvar';
                // somente permite "salvar"
                cancelBtn.disabled = true;
                setInputsValues();
                setInputsReadonly(false);
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
            elm.disabled = false;            // habilita o botão
            elm.classList.remove('working'); // remove classe 'working'
          });
        setDisabled(actionButtons, true);   // desabilita 'action buttons'
        counter.disabled = false;           // habilita edição no input..
        saveBtn.value = '\uF00C Salvar';    // restaura o rotulo do botão
        setInputsReadonly(true);            // desabilita os inputs dos..
      }, true);

    {
      // preenche datalists cujos ids correspondem ao nome (sem extensão)
      // do script server side que atende a requisição dos seus dados
      let set = $$("section > div#fields > datalist");
      if (Array.isArray(set)) {
        let aUri = uri.substring(0, uri.lastIndexOf("/")+1);
        set.forEach(
          function (datalist) {
            jQuery.get(
              aUri + datalist.id + ".php?action=GETALL",
              function (data) { jQuery(datalist).html(data); });
            });
      }
    }

    // testa se valores de ambos inputs mostradores de status da tabela não
    // são string vazia, evidenciando que o documento foi atualizado durante
    // pesquisa, atualização, exclusão ou inserção de novo registro
    if ([counter, amount].every(input => input.value.length > 0)) {

      numRecs = parseInt(amount.value); // extrai o valor numérico do input

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

  },
  true);