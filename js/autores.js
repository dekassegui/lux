/**
 * Este script é parte do projeto LUX, código aberto em Domínio Público.
*/

window.onresize = window.onload = function () {
  var w = parseInt(document.body.clientWidth);
  $$('aside').style.width = [(w < 1000) ? w-20 :
    w-parseInt($$('section').clientWidth)-30, 'px'].join("");
}

window.addEventListener('load',
  function () {

    var self = this;

    this.uri = "http://localhost/lux/autores.php";

    this.counter = $('counter');

    this.amount = $('amount');

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

    var currentRec,   // número de ordem do registro corrente
        numRecs,      // quantidade total de registros
        xhr;          // ponteiro para instâncias de XMLHttpRequest

    function print(text) {
      var t = mural.value;
      mural.value = (t.length == 0) ? text : [t, text].join("\n");
    }

    function disableButtons() {
      // desabilita botões de navegação & comando
      firstBtn.disabled = previousBtn.disabled = nextBtn.disabled =
        lastBtn.disabled = updateBtn.disabled = delBtn.disabled =
        searchBtn.disabled = newBtn.disabled = true;
      // habilita botões de decisão
      saveBtn.disabled = cancelBtn.disabled = false;
      // desabilita edição do display do registro corrente
      self.counter.disabled = true;
    }

    function whenTableIsEmpty() {
      self.counter.value = 0;
      newBtn.click();
      cancelBtn.disabled = true;
    }

    function setFields(array) {
      if (array === undefined) {
        for (var i=0; i<3; ++i) fields[i].value = '';
      } else {
        for (var i=0; i<3; ++i)
          fields[i].value = (array[i] == 'NULL') ? '' : array[i];
      }
    }

    function update() {
      if (currentRec > 0) {
        xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
          if (this.readyState == 4 && this.status == 200) {
            // atualiza o display do número de ordem do registro corrente
            self.counter.value = currentRec;
            // atualiza o display dos valores dos campos do registro corrente
            setFields(this.responseText.split('|'));
            // habilita botões de navegação
            firstBtn.disabled = previousBtn.disabled = (currentRec <= 1);
            lastBtn.disabled = nextBtn.disabled = (currentRec >= numRecs);
          }
        };
        xhr.open("GET", [self.uri, "?action=GETREC&recnumber=",
                  currentRec].join(""), true);
        xhr.send();
      } else {
        whenTableIsEmpty();
      }
    }

    function setReadonly(boolValue) {
      for (var i=0; i<3; ++i) fields[i].readOnly = boolValue;
    }

    this.counter.addEventListener('keydown',
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
            self.counter.value = currentRec;
            update();
          } else if (c == 13 || c == 9) { // Enter ou Tab
            var valor = parseInt(ev.target.value);
            if (0 < valor && valor <= numRecs) {
              currentRec = valor;
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

    this.counter.addEventListener('blur',
      function (ev) {
        ev = ev || event;
        var valor = parseInt(ev.target.value);
        if (0 < valor && valor <= numRecs) {
          currentRec = valor;
          update();
        } else {
          print('> Erro: Número de registro inválido.');
          if (0 < currentRec && currentRec <= numRecs) {
            print('> Restaurando valor anterior.');
            self.counter.value = currentRec;
          } else {
            print('> Reiniciando mostrador do registro corrente.');
            self.counter.value = currentRec = 1;
          }
          update();
        }
      }, true);

    this.amount.addEventListener('focus',
      function (ev) {
        ev.target.blur();  // rejeita foco nesse campo
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
        updateBtn.className = 'disabled';
        disableButtons();
        setReadonly(false);
        fields[1].focus();
      }, true);

    delBtn.addEventListener('click',
      function () {
        delBtn.className = 'disabled';
        saveBtn.value = 'Confirmar';
        disableButtons();
      }, true);

    searchBtn.addEventListener('click',
      function () {
        searchBtn.className = 'disabled';
        saveBtn.value = 'Executar';
        disableButtons();
        setFields();
        setReadonly(false);
        fields[1].focus();
      }, true);

    newBtn.addEventListener('click',
      function () {
        newBtn.className = 'disabled';
        disableButtons();
        setFields();
        setReadonly(false);
        fields[0].focus();
      }, true);

    saveBtn.addEventListener('click',
      function () {
        var par = [self.uri];

        function addFields() {
          for (var i=0; i<3; ++i)
            par.push('&', fields[i].id, '=', fields[i].value);
        }

        xhr = new XMLHttpRequest();
        if (newBtn.className == 'disabled') {
          xhr.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
              if ((this.responseText == 'FALSE')) {
                print('> Inserção mal sucedida.');
              } else {
                // atualiza contadores
                self.amount.value = ++numRecs;
                self.counter.value =
                  currentRec = parseInt(this.responseText);
                self.counter.maxLength = self.amount.value.length;
                // habilita botões de navegação & comando
                cancelBtn.click();
                print('> Inserção bem sucedida.');
              }
            }
          };
          par.push('?action=INSERT');
          addFields();
        } else if (searchBtn.className == 'disabled') {
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
        } else if (updateBtn.className == 'disabled') {
          xhr.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
              if (this.responseText == 'FALSE') {
                print('> Atualização mal sucedida.');
              } else {
                var n = parseInt(this.responseText);
                if (n != currentRec) ev.target.value = currentRec = n;
                print('> Atualização bem sucedida.');
                cancelBtn.click();
              }
            }
          };
          par.push("?action=UPDATE&recnumber=", currentRec);
          addFields();
        } else if (delBtn.className == 'disabled') {
          xhr.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
              if ((this.responseText == 'TRUE')) {
                self.amount.value = --numRecs;
                if (currentRec > numRecs) --currentRec;
                self.counter.maxLength = self.amount.value.length;
                update();
                print('> Exclusão bem sucedida.');
                cancelBtn.click();
              } else {
                print('> Exclusão mal sucedida.');
              }
            }
          };
          par.push("?action=DELETE&recnumber=", currentRec);
        }
        xhr.open("GET", par.join(""), true);
        xhr.send();
      }, true);

    cancelBtn.addEventListener('click',
      function () {
        update();
        // habilita botões de comando
        updateBtn.disabled = delBtn.disabled =
          searchBtn.disabled = newBtn.disabled = false;
        // desabilita botões de decisão
        saveBtn.disabled = cancelBtn.disabled = true;
        // habilita edição do display do registro corrente
        self.counter.disabled = false;
        // remove atributo de classe
        newBtn.className = searchBtn.className = updateBtn.className =
          delBtn.className = "";
        saveBtn.value = 'Salvar';
        setReadonly(true);
      }, true);

    xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        // inicia o display da quantidade total de registros
        self.amount.value = numRecs = parseInt(this.responseText);
        currentRec = (numRecs > 0) ? 1 : 0;
        self.counter.maxLength = this.responseText.length;
        // inicia conforme status do DB
        if (numRecs > 0) {
          firstBtn.click();
        } else {
          whenTableIsEmpty();
        }
        // inicia o mural informando a data e hora do sistema
        mural.value = ['Iniciado em ', new Date().toLocaleString()].join("");
      }
    };
    xhr.open("GET", [self.uri, "?action=COUNT"].join(""), true);
    xhr.send();

  },
  true);