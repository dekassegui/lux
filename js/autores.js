function $(id) { return document.getElementById(id) }

window.addEventListener('load',
  function () {

    var uri = "http://localhost/lux/autores.php";

    var fields = [$('code'), $('nome'), $('espirito')];

    var counter  = $('counter'),
        amount   = $('amount');

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

    var currentRec,   // número de ordem do registro corrente
        numRecs,      // quantidade total de registros
        xhr;          // ponteiro para instâncias de XMLHttpRequest

    function print(text) {
      var t = mural.value;
      mural.value = (t.length == 0) ? text : [t, text].join("\n");
    }

    function toggleNavigationButtons() {
      // alterna habilitação dos botões de navegação
      firstBtn.disabled = previousBtn.disabled = (currentRec <= 1);
      lastBtn.disabled = nextBtn.disabled = (currentRec >= numRecs);
    }

    function enableButtons() {
      // habilita botões de navegação se possível
      toggleNavigationButtons()
      // habilita botões de comando
      updateBtn.disabled = delBtn.disabled =
        searchBtn.disabled = newBtn.disabled = false;
      // desabilita botões de decisão
      saveBtn.disabled = cancelBtn.disabled = true;
    }

    function whenTableIsEmpty() {
      counter.value = 0;
      newBtn.click();
      cancelBtn.disabled = true;
    }

    function update() {
      if (currentRec > 0) {
        xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
          if (this.readyState == 4 && this.status == 200) {
            // atualiza o display do número de ordem do registro corrente
            counter.value = currentRec;
            // atualiza o display dos valores dos campos do registro corrente
            setFieldValues(this.responseText.split('|'));
            // alterna habilitação dos botões de navegação
            toggleNavigationButtons();
          }
        };
        xhr.open("GET", [uri, "?action=GETREC&recnumber=", currentRec].join(""), true);
        xhr.send();
      } else {
        whenTableIsEmpty();
      }
    }

    function getFieldValues() {
      var par = [];
      for (var i=0; i<3; ++i)
        par.push('&', fields[i].id, '=', fields[i].value);
      return par.join("");
    }

    function setFieldValues(array) {
      if (array === undefined) {
        for (var i=0; i<3; ++i) fields[i].value = '';
      } else {
        for (var i=0; i<3; ++i)
          fields[i].value = (array[i] == 'NULL') ? '' : array[i];
      }
    }

    counter.addEventListener('keydown',
      function (ev) {
        if (numRecs > 0) {
          ev = ev || event;
          if (ev.keyCode == 13) {
            if (counter.value.match(/^\s*\d+\s*$/)) {
              var valor = parseInt(counter.value);
              if (0 < valor && valor <= numRecs) {
                currentRec = valor;
                update();
              } else {
                print('Erro: Número de registro inválido.');
              }
            } else {
              print('Erro: Valor digitado não é número.');
            }
          }
        } else {
          print('Erro: A tabela está vazia.');
        }
      }, true);

    amount.addEventListener('focus',
      function (ev) {
        amount.blur();
        // print('A quantidade de registros não pode ser editada.');
      }, true);

    firstBtn.addEventListener('click',
      function () {
        currentRec = 1;
        update();
      }, true);

    previousBtn.addEventListener('click',
      function () {
        --currentRec;
        update();
      }, true);

    nextBtn.addEventListener('click',
      function () {
        ++currentRec;
        update();
      }, true);

    lastBtn.addEventListener('click',
      function () {
        currentRec = numRecs;
        update();
      }, true);

    updateBtn.addEventListener('click',
      function () {
        xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
          if (this.readyState == 4 && this.status == 200) {
            if (this.responseText == 'FALSE') {
              print('Atualização mal sucedida.');
            } else {
              var n = parseInt(this.responseText);
              if (n != currentRec) counter.value = currentRec = n;
              print('Atualização bem sucedida.');
            }
          }
        };
        var par = [uri, "?action=UPDATE&recnumber=", currentRec, getFieldValues()];
        xhr.open("GET", par.join(""), true);
        xhr.send();
      }, true);

    delBtn.addEventListener('click',
      function () {
        xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
          if (this.readyState == 4 && this.status == 200) {
            if ((this.responseText == 'TRUE')) {
              amount.value = --numRecs;
              if (currentRec > numRecs) --currentRec;
              update();
              print('Exclusão bem sucedida.');
            } else {
              print('Exclusão mal sucedida.');
            }
          }
        };
        xhr.open("GET", [uri, "?action=DELETE&recnumber=", currentRec].join(""), true);
        xhr.send();
      }, true);

    searchBtn.addEventListener('click',
      function () {
        xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
          if (this.readyState == 4 && this.status == 200) {
            if (this.responseText.length > 0) {
              print('Resultado da pesquisa:');
              print(this.responseText);
            } else {
              print('Pesquisa mal sucedida.');
            }
          }
        };
        var par = [uri, "?action=SEARCH", getFieldValues()];
        xhr.open("GET", par.join(""), true);
        xhr.send();
      }, true);

    newBtn.addEventListener('click',
      function () {
        // desabilita botões de navegação & comando
        firstBtn.disabled = previousBtn.disabled = nextBtn.disabled = lastBtn.disabled = updateBtn.disabled = delBtn.disabled = searchBtn.disabled = newBtn.disabled = true;
        // habilita botões de decisão
        saveBtn.disabled = cancelBtn.disabled = false;
        // limpa todos os campos do registro
        setFieldValues();
        // entra em modo de edição dando o foco ao primeiro campo
        fields[0].focus();
      }, true);

    saveBtn.addEventListener('click',
      function () {
        xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
          if (this.readyState == 4 && this.status == 200) {
            if ((this.responseText == 'FALSE')) {
              print('Inserção mal sucedida.');
            } else {
              // atualiza contadores
              amount.value = ++numRecs;
              counter.value = currentRec = parseInt(this.responseText);
              // habilita botões de navegação & comando
              enableButtons();
              print('Inserção bem sucedida.');
            }
          }
        };
        var par = [uri, "?action=INSERT", getFieldValues()];
        xhr.open("GET", par.join(""), true);
        xhr.send();
      }, true);

    cancelBtn.addEventListener('click',
      function () {
        update();         // restaura os valores do display
        enableButtons();  // alterna disponibilidade dos botões
      }, true);

    xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        // inicia o display da quantidade total de registros
        amount.value = numRecs = parseInt(this.responseText);
        currentRec = (numRecs > 0) ? 1 : 0;
        // inicia conforme status do DB
        if (numRecs > 0) {
          firstBtn.click();
        } else {
          whenTableIsEmpty();
        }
        // inicia o mural informando a data e hora do sistema
        mural.value = new Date().toLocaleString();
      }
    };
    xhr.open("GET", [uri, "?action=COUNT"].join(""), true);
    xhr.send();
  },
  true);