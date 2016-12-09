/**
 * Este script é parte do projeto LUX, software livre para bibliotecas de
 * casas Espíritas, em desenvolvimento desde 12/11/2016.
*/

/**
 * Listener que ativa comandos para controle "full time" de dimensões
 * de elementos do documento que serve de interface entre o usuário e a
 * aplicação para gestão da tabela persistente de "Autores & Espíritos",
 * em complemento às suas declarações CSS.
*/
window.onresize = function () {
  // estabelece dinamicamente a largura do elemento 'aside'
  // em função da largura da janela (aka document.body)
  var w = parseInt(document.body.clientWidth);
  var x = (w < 1000) ? w-20 : w-parseInt($$('section').clientWidth)-30;
  $$('aside').style.width = [x, 'px'].join("");
}

/**
 * Listener que ativa comandos para controle "full time" do aplicativo para
 * gestão da tabela persistente de "Autores & Espíritos", até o fim do seu
 * "life cycle", indiferente a recargas do documento interface.
*/
window.addEventListener('load',
  function () {

    window.onresize();  // ajuste inicial da largura do elemento 'aside'

    // URI do script "server side" que atende requisições ao DB
    var uri = location.href.replace(/html$/, "php");

    var counter = $('counter'),
        amount  = $('amount');

    var fields = $$('section > div#fields > input[type="text"]');

    var firstBtn    = $('firstBtn'),
        previousBtn = $('previousBtn'),
        nextBtn     = $('nextBtn'),
        lastBtn     = $('lastBtn');

    var updateBtn = $('updateBtn'),
        delBtn    = $('delBtn'),
        searchBtn = $('searchBtn'),
        newBtn    = $('newBtn'),
        saveBtn   = $('saveBtn'),
        cancelBtn = $('cancelBtn');

    var mural = $('mural');  // área de notificações ao usuário

    mural.oninput = function () {
      if (mural.textLength == 0) {
        mural.classList.add('empty');
      } else {
        mural.classList.remove('empty');
      }
    };

    // agrega 'text' como apêndice do conteúdo da textarea cujo canvas
    // escorre até que 'text' seja visível tão ao topo quanto possível
    function print(text) {
      var a = mural.clientHeight,   // altura do canvas
          b = mural.scrollHeight;   // altura do conteúdo a priori
      if (mural.textLength > 0) {
        mural.value = [mural.value, text].join("\n");
      } else {
        mural.value = text;
        mural.oninput();
      }
      if (b > a) {
        mural.scrollTop = b - parseInt(getCSSproperty(mural, 'line-height'));
      }
    }

    var indexRec,   // índice, ou número de ordem, do registro corrente
        numRecs;    // quantidade de registros da tabela de autores

    var actionButtons = [saveBtn, cancelBtn];

    var commandButtons = [updateBtn, delBtn, searchBtn, newBtn];

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
      // ou de array de strings vazias se o argumento for indeterminado
      var fn = (array === undefined) ? function (input) { input.value = ''; }
        : function (input, index) {
            var data = (index == 2)
              ? (array[4] + (array[5].length > 0 ? ' - ' + array[5] : ''))
              : ((index == 3) ? array[7] : array[index+1]);
            input.value = (data == 'NULL') ? '' : data;
          };
      fields.forEach(fn);
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
            if (delBtn.classList.contains('disabled')) return;
            // testa se 'action buttons' estão habilitados
            if (actionButtons.every(item => item.disabled == false)) {
              ev = ev || event;
              if (ev.keyCode == 13 && ev.ctrlKey) {
                saveBtn.click();    // <Ctrl>+<Enter> aciona comando pendente
              } else if (ev.keyCode == 27) {
                cancelBtn.click();  // <Escape> cancela comando pendente
                ev.target.blur();   // remove o foco do input
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
          // Left, Right, Home, End e Escape
          var c = ev.keyCode;
          if ((c < 48 || c > 57) && (c < 96 || c > 105)
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
          indexRec = valor;                   // corrente, atualizando-o com
          update();                           // algum valor legal
        } else {
          print('> Erro: Valor do índice do registro ilegal.');
          if (0 < indexRec && indexRec <= numRecs) {
            print('> Restaurando valor do índice do registro corrente.');
            counter.value = indexRec;
          } else {
            print('> Reiniciando valor do índice do registro corrente.');
            counter.value = indexRec = 1;
          }
          update();
        }
      }, true);

    amount.addEventListener('focus',
      function () {
        amount.target.blur();  // rejeita foco nesse input
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
        updateBtn.classList.add('disabled');
        disableButtons();
        setInputsReadonly(false);
        fields[1].focus();
      }, true);

    delBtn.addEventListener('click',
      function () {
        delBtn.classList.add('disabled');
        saveBtn.value = 'Confirmar';
        disableButtons();
      }, true);

    searchBtn.addEventListener('click',
      function () {
        searchBtn.classList.add('disabled');
        saveBtn.value = 'Executar';
        disableButtons();
        setInputsValues();
        setInputsReadonly(false);
        fields[1].focus();
      }, true);

    newBtn.addEventListener('click',
      function () {
        newBtn.classList.add('disabled');
        disableButtons();
        setInputsValues();
        setInputsReadonly(false);
        fields[0].focus();
      }, true);

    saveBtn.addEventListener('click',
      function () {
        var par = [uri];

        function addDataFields(bool) {
          fields.forEach(
            function (input) {
              var value = input.value.trim();
              if (!bool && input.hasAttribute("list")) {
                value = $(input.getAttribute("list"))
                  .querySelector("option[value='" + value + "']")
                  .getAttribute("code");
              }
              par.push('&', input.id, '=', encodeURIComponent(value));
            });
        }

        var xhr = new XMLHttpRequest();
        if (newBtn.classList.contains('disabled')) {

          xhr.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
              if ((this.responseText == 'FALSE')) {
                print('> Inserção mal sucedida.');
              } else {
                // atualiza inputs do índice/quantidade de registros
                amount.value = ++numRecs;
                counter.value = indexRec = parseInt(this.responseText);
                counter.maxLength = amount.value.length;
                // habilita botões de navegação & comando
                cancelBtn.click();
                print('> Inserção bem sucedida.');
              }
            }
          };
          par.push('?action=INSERT');
          addDataFields();

        } else if (searchBtn.classList.contains('disabled')) {

          xhr.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
              if (this.responseText.length > 0) {
                var n = this.responseText.split(/\n|\r|\r\n/g).length;
                print(['> Sucesso, localizou ', ' registro(s):'].join(n));
                print(this.responseText);
              } else {
                print('> Pesquisa mal sucedida.');
              }
            }
          };
          par.push('?action=SEARCH');
          addDataFields(true);

        } else if (updateBtn.classList.contains('disabled')) {

          xhr.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
              if (this.responseText == 'FALSE') {
                print('> Atualização mal sucedida.');
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

        } else if (delBtn.classList.contains('disabled')) {

          xhr.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
              if (this.responseText == 'TRUE') {
                amount.value = --numRecs;
                if (indexRec > numRecs) --indexRec;
                counter.maxLength = amount.value.length;
                update();
                print('> Exclusão bem sucedida.');
                cancelBtn.click();
              } else {
                print('> Exclusão mal sucedida.');
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
            elm.classList.remove('disabled'); // remove classe 'disabled'
          });
        setDisabled(actionButtons, true); // desabilita 'action buttons'
        counter.disabled = false;         // habilita edição no input..
        saveBtn.value = 'Salvar';         // restaura o rotulo do botão
        setInputsReadonly(true);          // desabilita os inputs dos..
      }, true);

    {
      // preenche datalists dos inputs 'autor' e 'genero'

      ["autores", "generos"].forEach(
        function (iD) {
          var xhr = new XMLHttpRequest();
          xhr.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
              var datalist = $(iD);
              this.responseText.split(/\n|\r|\r\n/g).forEach(
                function (text) {
                  var option = document.createElement("option");
                  var j = text.indexOf('|');
                  option.setAttribute('code', text.substring(0, j));
                  var value = text.substring(j+1);
                  j = value.indexOf('|');
                  option.value = (j < value.length-1)
                    ? value.replace('|', ' - ') : value.substring(0, j);
                  datalist.appendChild(option);
                }
              );
            }
          };
          xhr.open("GET", [uri.replace("obras", iD), "?action=GETALL"]
            .join(""), true);
          xhr.send();
        });
    }

    // verifica a habilitação dos 'action buttons', a qual, sendo confirmada,
    // evidencia que o documento foi atualizado durante exclusão, pesquisa,
    // atualização, ou inserção (em tabela nao vazia) de novo registro
    //
    //if (actionButtons.every(btn => btn.disabled == false)) {
    //
    // --> BUG: perda de escopo :: WORKAROUND: testar os inputs dos números
    //
    if ([counter, amount].every(input => input.value.length > 0)) {

      // aproveita os valores remanescentes do índice do registro corrente
      // e da quantidade de registros da tabela no momento da atualização
      indexRec = parseInt(counter.value);
      numRecs = parseInt(amount.value);

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
          btn.classList.remove('disabled'); // remove classe 'disabled'
        });

      setDisabled(actionButtons, true); // desabilita os 'action buttons'

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

    // inicia o mural com saudação em função da hora local
    mural.value = ['> Boa noite!', '> Bom dia!', '> Boa tarde!'][
      Math.floor(new Date().getHours() / 6) % 3];

  },
  true);
