function $(id) { return document.getElementById(id) }

window.addEventListener('load',
  function () {

    var uri = "http://localhost/lux/consulta.php";

    var fields   = [$('code'),      // código
                    $('name'),      // nome
                    $('spirit')];   // espírito

    var counter  = $('counter');

    var firstRec = $('firstRec'),
        prevRec  = $('prevRec'),
        nextRec  = $('nextRec'),
        lastRec  = $('lastRec');

    var numRecs,                  // quantidade total de registros de autores
        currentRec;               // número de ordem do registro visualizado

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
          firstRec.disabled = prevRec.disabled = (currentRec == 1);
          lastRec.disabled = nextRec.disabled = (currentRec == numRecs);
        }
      };
      xhr.open("GET", [uri, '?recnumber=', currentRec].join(''), true);
      xhr.send();
    }

    firstRec.addEventListener('click',
      function () {
        currentRec = 1;
        update();
      }, true);

    prevRec.addEventListener('click',
      function () {
        --currentRec;
        update();
      }, true);

    nextRec.addEventListener('click',
      function () {
        ++currentRec;
        update();
      }, true);

    lastRec.addEventListener('click',
      function () {
        currentRec = numRecs;
        update();
      }, true);

    firstRec.click();
  },
  true);
