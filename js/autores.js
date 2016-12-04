/**
 *  Este script é parte do projeto LUX.
*/

window.onresize = function () {
  var w = parseInt(document.body.clientWidth);
  $$('aside').style.width = [(w < 1000) ? w-20 :
    w-parseInt($$('section').clientWidth)-30, 'px'].join("");
}

window.onload = function () {
  window.onresize();
  // checa se o documento foi atualizado durante alguma operação
  if (!$('cancelBtn').disabled) {
    var uri = "http://localhost/lux/autores.php";
    // aproveita os valores remanescentes do índice do registro corrente
    // e da quantidade de registros no DB no momento da atualização
    var indexRec = $('counter').value,
        numRecs  = $('amount').value;
    // restaura os valores dos inputs consultando o DB por segurança
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        // atualiza os valores dos campos do registro corrente
        var values = this.responseText.split('|');
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
    // habilita edição do índice do registro corrente
    $('counter').disabled = false;
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
    $('saveBtn').disabled = $('cancelBtn').disabled = true;
  }
};

window.addEventListener('load',
  function () {

    var uri = "http://localhost/lux/autores.php";

    var counter = $('counter'),
        amount  = $('amount');

    var fields = [$('code'), $('nome'), $('espirito')];

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

    var mural = $('mural');  // área de notificação

    var indexRec,   // índice, ou número de ordem, do registro corrente
        numRecs,    // quantidade de registros no DB
        xhr;        // ponteiro para instâncias de XMLHttpRequest

    function print(text) {
      var t = mural.value;
      mural.value = (t.length == 0) ? text : [t, text].join("\n");
    }

    function disableButtons() {
      // desabilita botões de navegação & comando
      [firstBtn, previousBtn, nextBtn, lastBtn, updateBtn, delBtn, searchBtn,
        newBtn].forEach(function (elm) { elm.disabled = true; });
      // habilita botões de decisão
      [saveBtn, cancelBtn].forEach(function (elm) { elm.disabled = false; });
      // desabilita edição do display do registro corrente
      counter.disabled = true;
    }

    function whenTableIsEmpty() {
      counter.value = indexRec = 0;
      newBtn.click();
      cancelBtn.disabled = true;
    }

    function setInputsValues(array) {
      var values = array;
      if (array === undefined) values = Array(fields.length).fill('');
      fields.forEach(
        function (input, index) {
          input.value = (values[index] == 'NULL') ? '' : values[index];
        });
    }

    function setInputsReadonly(boolValue) {
      fields.forEach(function (input) { input.readOnly = boolValue; });
    }

    function update() {
      if (indexRec > 0) {
        xhr = new XMLHttpRequest();
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
              print('> Erro: Número de registro inválido.');
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
          print('> Erro: Número de registro inválido.');
          if (0 < indexRec && indexRec <= numRecs) {
            print('> Restaurando valor anterior.');
            counter.value = indexRec;
          } else {
            print('> Reiniciando mostrador do registro corrente.');
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

        function addFields() {
          fields.forEach(
            function (input) { par.push('&', input.id, '=', input.value); });
        }

        xhr = new XMLHttpRequest();
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
          addFields();
        } else if (searchBtn.classList.contains('disabled')) {
          xhr.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
              if (this.responseText.length > 0) {
                print('> Resultado da pesquisa:');
                print(this.responseText);
              } else {
                print('> Pesquisa mal sucedida.');
              }
            }
          };
          par.push('?action=SEARCH');
          addFields();
        } else if (updateBtn.classList.contains('disabled')) {
          xhr.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
              if (this.responseText == 'FALSE') {
                print('> Atualização mal sucedida.');
              } else {
                var n = parseInt(this.responseText);
                if (n != indexRec) ev.target.value = indexRec = n;
                print('> Atualização bem sucedida.');
                cancelBtn.click();
              }
            }
          };
          par.push("?action=UPDATE&recnumber=", indexRec);
          addFields();
        } else if (delBtn.classList.contains('disabled')) {
          xhr.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
              if ((this.responseText == 'TRUE')) {
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

    xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        // inicia o input que exibe a quantidade de registros no DB
        amount.value = numRecs = parseInt(this.responseText);
        // declara a quantidade máxima de caracteres do input 'counter'
        counter.maxLength = this.responseText.length;
        // checa reutilização de valor do índice do registro corrente
        if (counter.value.length > 0) {
          indexRec = parseInt(counter.value);
        } else {
          // ação inicial conforme quantidade de registros no DB
          if (numRecs > 0) {
            firstBtn.click();     // mostra o primeiro registro
          } else {
            whenTableIsEmpty();   // força inserção de registro
          }
        }
        // inicia o mural informando a data e hora do sistema
        mural.value = ['Iniciado em ', new Date().toLocaleString()].join("");
      }
    };
    xhr.open("GET", [uri, "?action=COUNT"].join(""), true);
    xhr.send();

  },
  true);