function $(id) { return document.getElementById(id) }

window.addEventListener('load',
  function () {

    var uri = "http://localhost/lux/consulta.php";

    var fields   = [$('code'),      // código
                    $('name'),      // nome
                    $('spirit')];   // espírito

    var counter  = $('counter');

    var firstBtn    = $('firstBtn'),
        previousBtn = $('previousBtn'),
        nextBtn     = $('nextBtn'),
        lastBtn     = $('lastBtn');

    var numRecs,      // quantidade total de registros de autores
        currentRec;   // número de ordem do registro visualizado

    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        // atualiza o display da quantidade de registros
        $('amount').innerHTML = numRecs = parseInt(this.responseText);
      }
    };
    xhr.open("GET", uri, true);
    xhr.send();

    function update() {
      xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
          // atualiza o display do número de registro corrente
          counter.innerHTML = currentRec;
          // atualiza o display dos valores dos campos do registro corrente
          var values = this.responseText.split('|');
          for (var i=2; i>=0; --i) fields[i].value = values[i];
          // alterna habilitação dos botões de navegação
          firstBtn.disabled = previousBtn.disabled = (currentRec == 1);
          lastBtn.disabled = nextBtn.disabled = (currentRec == numRecs);
        }
      };
      xhr.open("GET", [uri, '?recnumber=', currentRec].join(''), true);
      xhr.send();
    }

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

    firstBtn.click();   // inicia a apresentação dos registros

    var updateBtn = $('updateBtn'),
        delBtn    = $('delBtn'),
        searchBtn = $('searchBtn'),
        newBtn    = $('newBtn'),
        saveBtn   = $('saveBtn'),
        cancelBtn = $('cancelBtn');

    updateBtn.addEventListener('click',
      function () {
        xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
          if (this.readyState == 4 && this.status == 200) {
            var text = this.responseText;
            alert(text);
          }
        };
        var par = [uri, "?recnumber=U", currentRec];
        par.push('&code=', fields[0].value);
        par.push('&nome=', fields[1].value);
        par.push('&espirito=', fields[2].value);
        xhr.open("GET", par.join(""), true);
        xhr.send();
      }, true);

    delBtn.addEventListener('click',
      function () {
        xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
          if (this.readyState == 4 && this.status == 200) {
            var text = this.responseText;
            alert(text);
          }
        };
        xhr.open("GET", [uri, "?recnumber=D", currentRec].join(""), true);
        xhr.send();
      }, true);

    searchBtn.addEventListener('click',
      function () {
        //newPressed = !newPressed;
        //newBtn.value = newPressed ? 'Novo' : 'Atualizar';
      }, true);

    newBtn.addEventListener('click',
      function () {
        //newPressed = !newPressed;
        //newBtn.value = newPressed ? 'Novo' : 'Atualizar';
      }, true);

    saveBtn.addEventListener('click',
      function () {
        xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
          if (this.readyState == 4 && this.status == 200) {
            var text = this.responseText;
            alert(text);
          }
        };
        xhr.open("GET", [uri, "?recnumber=S", currentRec].join(""), true);
        xhr.send();
      }, true);

    cancelBtn.addEventListener('click',
      function () {
        //newPressed = !newPressed;
        //newBtn.value = newPressed ? 'Novo' : 'Atualizar';
      }, true);

  },
  true);
