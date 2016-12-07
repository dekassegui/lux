/**
 * Este script é parte do projeto LUX, software livre para bibliotecas de
 * casas Espíritas, em desenvolvimento desde 12/11/2016.
*/

/**
 * Listener que ativa comandos para controle "full time" de dimensões de
 * elementos do documento que serve de interface entre o usuário e a
 * aplicação para gestão da tabela persistente de "Autores & Espíritos", em
 * complemento às suas declarações CSS.
*/
window.onresize = function () {
  // estabelece dinamicamente a largura do elemento 'aside'
  // em função da largura da janela (aka document.body)
  var w = parseInt(document.body.clientWidth);
  var x = (w < 1000) ? w-20 : w-parseInt($$('section').clientWidth)-30;
  $$('aside').style.width = [x, 'px'].join("");
}

/**
 * URI do script server side que atende as requisições ao DB desse script.
*/
var uri = location.href.replace(/html$/, "php");

/**
 * Listener que ativa comandos para controle e check-up inicial do aplicativo
 * para gestão da tabela persistente de "Autores & Espíritos", descartado
 * imediatamente após terminar a execução "once a time" do seu conteúdo, com
 * prioridade superior aos demais de mesmo evento.
*/
window.onload = function () {

  window.onresize();  // ajuste inicial da largura do elemento 'aside'

  // checa se o documento foi atualizado durante alguma operação
  if (!$('cancelBtn').disabled && !$('saveBtn').disabled) {

    // aproveita os valores remanescentes do índice do registro corrente
    // e da quantidade de registros da tabela no momento da atualização
    var indexRec = parseInt($('counter').value),
        numRecs  = parseInt($('amount').value);

    // restaura os valores dos inputs consultando o DB por segurança
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        // atualiza os valores do registro corrente
        var values = this.responseText.split('|');
        // loop de atualização dos valores dos inputs
        $$('section > div#fields > input[type="text"]').forEach(
            function (input, index) {
              input.value = values[index];
              input.readOnly = true;
            }
          );
      }
    };
    xhr.open("GET",
      [uri, "?action=GETREC&recnumber=", indexRec].join(""), true);
    xhr.send();

    // habilita edição e declara a quantidade máxima de caracteres
    // do input do índice do registro corrente
    $('counter').disabled = false;
    $('counter').maxLength = $('amount').value.length;

    // habilita botões de navegação
    $('firstBtn').disabled = $('previousBtn').disabled = (indexRec <= 1);
    $('lastBtn').disabled = $('nextBtn').disabled = (indexRec >= numRecs);

    // habilita botões de comando e remove classe "disabled"
    ['updateBtn', 'delBtn', 'searchBtn', 'newBtn'].forEach(
      function (id) {
        var elm = $(id);
        elm.disabled = false;
        elm.classList.remove('disabled');
      });

    // desabilita botões de decisão
    ['saveBtn', 'cancelBtn'].forEach(
      function (id) { $(id).disabled = true; });
  }

  // inicia o mural com saudação em função da hora local
  var k = Math.floor(new Date().getHours() / 6) % 3;
  $('mural').value = ['Boa noite!', 'Bom dia!', 'Boa tarde!'][k];
};

/**
 * Listener que ativa comandos para controle "full time" do aplicativo para
 * gestão da tabela persistente de "Autores & Espíritos", até o fim do seu
 * "life cycle", impertinente a recargas do documento interface.
*/
window.addEventListener('load',
  function () {

    window.onload = null;  // código não mais necessário :: libera memória

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

    var indexRec,   // índice, ou número de ordem, do registro corrente
        numRecs;    // quantidade de registros na tabela de autores

    function disableButtons() {
      // desabilita botões de navegação & comando
      [firstBtn, previousBtn, nextBtn, lastBtn, updateBtn, delBtn, searchBtn,
        newBtn].forEach(function (elm) { elm.disabled = true; });
      // habilita botões de decisão
      [saveBtn, cancelBtn].forEach(function (elm) { elm.disabled = false; });
      // desabilita edição do índice do registro corrente
      counter.disabled = true;
    }

    function whenTableIsEmpty() {
      // prepara a única ação possível quando a tabela está vazia
      counter.value = indexRec = 0;
      newBtn.click();
      cancelBtn.disabled = true;
    }

    function setInputsValues(array) {
      // preenche os valores dos inputs com os componentes do argumento de
      // tipo Array ou de array de strings vazias se argumento indeterminado
      var values = array;
      if (array === undefined) values = Array(fields.length).fill('');
      fields.forEach(
        function (input, index) {
          input.value = (values[index] == 'NULL') ? '' : values[index];
        });
    }

    function setInputsReadonly(boolValue) {
      // preenche os valores de atributo readonly dos inputs
      fields.forEach(function (input) { input.readOnly = boolValue; });
    }

    function update() {
      // testa o índice do registro corrente para atualizar os
      // respectivos dados ou preparar inserção na tabela vazia
      if (indexRec > 0) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
          if (this.readyState == 4 && this.status == 200) {
            // atualiza o display do número de ordem do registro corrente
            counter.value = indexRec;
            // atualiza o display dos valores dos campos do registro corrente
            setInputsValues(this.responseText.split('|'));
            // habilita botões de navegação
            firstBtn.disabled = previousBtn.disabled = (indexRec <= 1);
            lastBtn.disabled = nextBtn.disabled = (indexRec >= numRecs);
          }
        };
        xhr.open("GET", [uri, "?action=GETREC&recnumber=", indexRec]
                          .join(""), true);
        xhr.send();
      } else {
        whenTableIsEmpty();
      }
    }

    function print(text) {
      // agrega 'text' como apêndice do conteúdo da textarea cujo canvas é
      // escorrido até que 'text' seja visível tão ao topo quanto possível
      var a = mural.clientHeight,   // altura do canvas
          b = mural.scrollHeight;   // altura do conteúdo a priori
      mural.value = (mural.textLength > 0) ? [mural.value, text].join("\n")
        : text;
      if (b > a) {
        mural.scrollTop = b - parseInt(getCSSproperty(mural, 'line-height'));
      }
      mural.oninput();
    }

    mural.oninput = function () {
        if (mural.textLength == 0)
          mural.classList.add('empty');
        else if (mural.classList.contains('empty'))
          mural.classList.remove('empty');
      };

    fields.forEach(
      function (input) {
        // estende a responsividade ao teclado nos inputs
        input.addEventListener('keydown',
          function (ev) {
            if (!saveBtn.disabled && !cancelBtn.disabled) {
              ev = ev || event;
              // <Ctrl>+<Enter> aciona comando pendente
              if (ev.keyCode == 13 && ev.ctrlKey) saveBtn.click();
              // <Escape> cancela comando pendente
              else if (ev.keyCode == 27) cancelBtn.click();
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
          } else if (c == 27) { // Escape
            counter.value = indexRec;
            update();
          } else if (c == 13 || c == 9) { // Enter ou Tab
            var valor = parseInt(ev.target.value);
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
      function (ev) {
        ev = ev || event;                       // aborta edição pendente do
        var valor = parseInt(ev.target.value);  // counter de registros e
        if (0 < valor && valor <= numRecs) {    // toma a ação necessária
          indexRec = valor;                     // para evitar valor ilegal
          update();
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
      function (ev) {
        ev.target.blur();  // rejeita foco nesse campo
      }, true);

    firstBtn.addEventListener('click',
      function () {
        indexRec = 1;
        update();
      }, true);

    previousBtn.addEventListener('click',
      function () {
        if (indexRec-1 > 0) { // evita o boogie do botão pressionado, cuja
          --indexRec;         // habilitação sai da sincronia com o número
          update();           // do registro devido a latência do servidor
        }                     // e do DB para atender requisições
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

        function addDataFields() {
          fields.forEach(
            function (input) {
              par.push('&', input.id, '=', encodeURIComponent(input.value));
            });
        }

        var xhr = new XMLHttpRequest();
        if (newBtn.classList.contains('disabled')) {
          xhr.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
              if ((this.responseText == 'FALSE')) {
                print('> Inserção mal sucedida.');
              } else {
                // atualiza contadores
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
          addDataFields();
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
        // habilita botões de comando e remove classe 'disabled'
        [updateBtn, delBtn, searchBtn, newBtn].forEach(
          function (elm) {
            elm.disabled = false;
            elm.classList.remove('disabled');
          });
        // desabilita botões de decisão
        [saveBtn, cancelBtn].forEach(
          function (elm) { elm.disabled = true; });
        // habilita edição do display do registro corrente
        counter.disabled = false;
        saveBtn.value = 'Salvar';
        setInputsReadonly(true);
      }, true);

    // checa se o documento foi atualizado durante alguma operação
    if ((counter.value.length > 0) && (amount.value.length > 0)) {
      // coleta os valores dos mostradores
      indexRec = parseInt(counter.value);
      numRecs = parseInt(amount.value);
    } else {
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
          // inicia o input que exibe a quantidade de registros na tabela
          numRecs = parseInt(amount.value = this.responseText);
          // declara a quantidade máxima de caracteres do input 'counter'
          counter.maxLength = this.responseText.length;
          // ação inicial conforme quantidade de registros na tabela
          if (numRecs > 0) {
            firstBtn.click();     // mostra o primeiro registro
          } else {
            whenTableIsEmpty();   // força inserção de registro
          }
        }
      };
      xhr.open("GET", [uri, "?action=COUNT"].join(""), true);
      xhr.send();
    }

  },
  true);