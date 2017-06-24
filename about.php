<?php

  switch ($_GET['title']) {

    case 'BASIC':

      echo <<<EOT
<h3>&#xF0DA; Devolução</h3>
<div>
  <ol>
    <li>Acesse o registro de empréstimo do livro que está sendo devolvido, clicando no botão <span class="botao">&#xF002;&nbsp;Pesquisar</span> para localizar o registro se necessário.</li>
    <li>Clique no botão <span class="botao">&#xF040;&nbsp;Atualizar</span> para iniciar o procedimento ou alternativamente, clique no rótulo <span class="botao">&#xF040;&nbsp;Devolução</span> que antecipará parcialmente o próximo passo.</li>
    <li>Clique no campo <span class="field">Devolução</span> para selecionar a data no calendário que aparecerá abaixo do campo.</li>
    <li>Clique no botão <span class="botao">&#xf00c;&nbsp;Salvar</span> para confirmar o procedimento ou clique no botão <span class="botao">&#xf00d;&nbsp;Cancelar</span> em caso contrário.<p><b>Nota</b>: Se a atualização for mal sucedida, o motivo será informado na janela de diálogo.</p></li>
  </ol>
</div>
EOT;

      echo <<<EOT
<h3>&#xF0DA; Empréstimo</h3>
<div>
  <ol>
    <li>Clique no botão <span class="botao">&#xF067;&nbsp;Novo</span> ou alternativamente, clique no rótulo <span class="botao">&#xF067;&nbsp;Empréstimo</span>.</li>
    <li>Preencha os campos:
      <ul>
        <li><span class="field">Agente</span></li>
        <li><span class="field">Empréstimo</span></li>
        <li><span class="field">Leitor</span></li>
        <li><span class="field">Obra</span> (título do livro)</li>
      </ul>
      <p>Os demais campos serão preenchidos automaticamente e somente o campo <span class="field">Exemplar</span> será editável, se houver mais de um exemplar disponível.</p>
      <p><b>Dica</b>: Antes do preenchimento, pergunte ao leitor se já foi cadastrado.</p></li>
    <li>Clique no botão <span class="botao">&#xf00c;&nbsp;Salvar</span> para confirmar o procedimento ou clique no botão <span class="botao">&#xf00d;&nbsp;Cancelar</span> em caso contrário.
    <p><b>Nota</b>: Se a operação de registro do empréstimo for mal sucedida, o motivo será informado na janela de diálogo.</p></li>
    <li>Informe a <b>Data Limite</b> para devolução, recém calculada, apresentada no <span class="field">Comentário</span>.</li>
  </ol>
</div>
EOT;

      echo <<<EOT
<h3>&#xF0DA; Pesquisas - Sumário</h3>
<div>
  <p>Acionadas ao clicar no botão <span class="botao">&#xF002;&nbsp;Pesquisar</span>, para localizar registros sujeitos a restrições, tal que:</p>
  <ol class="simpleList">
    <li>Toda restrição é declarada pelo preenchimento de campo, no formato geral:<span class="evidence"><span>OPERADOR</span>&nbsp;<span>PARÂMETRO</span></span>onde o OPERADOR pode estar implícito e PARÂMETRO é valor arbitrário de referência, que pode ser opcional.</li>
    <li>Cada restrição está relacionada únicamente ao campo preenchido que, em caso contrário será ignorado.</li>
    <li>Se houver duas ou mais restrições, então ocorrerá <b>sucesso</b> somente se <b>satisfeitas simultâneamente</b>.</li>
    <li><strong>Todos</strong> <b>os operadores estão disponíveis em</b> <strong>todos</strong> <b>os campos do formulário</b>, inclusive os de caráter informativo, que não são editáveis na prática.</li>
    <li>O uso de letras MAIÚSCULAS ou minúsculas é irrelevante, porém vogais acentuadas e cedilha <b>são semelhantes</b> às não acentuadas e à letra <b>C</b> repectivamente, ou seja; <b>nâo são iguais</b>.</li>
    <li>Se a pesquisa for <b>bem sucedida</b>, resultando em <b>único registro</b>, então este será o registro (<i>corrente</i>) apresentado no formulário.</li>
    <li>Se a pesquisa for <b>bem sucedida</b>, resultando em <b>dois ou mais registros</b>, então serão listados na área de notificação abaixo do formulário.</li>
    <li>Se a pesquisa for <b>mal sucedida</b>, então o usuário será notificado na janela de diálogo.</li>
    <li>O <b>encerramento automático</b> das pequisas, somente acontece quando <b>bem sucedidas, com único registro resultante</b>, pois em caso contrario, será possível o <b>refinamento do resultado</b> pela modificação dos parâmetros, ou <b>encerramento arbitrário</b>.</li>
  </ol>
</div>
EOT;

      echo <<<EOT
<h3>&#xF0DA; Pesquisas - GLOB</h3>
<div>
  <p>Neste padrão de pesquisa, as restrições seguem o formato geral com utilização opcional dos componentes, aplicado tantas vezes quanto necessário.</p>
  <p>Exemplos de uso do operador <cite>*</cite>:</p>
  <ul>
    <li class="example"><span>*</span>pesquisa qualquer frase com qualquer conteúdo &#x2012; útil para listar todos registros</li>
    <li class="example"><span>fulano*</span>pesquisa <b>fulano</b> no início de frase</li>
    <li class="example"><span>*beltrano</span> pesquisa <b>beltrano</b> no final de frase</li>
    <li class="example"><span>*ciclano*</span> pesquisa <b>ciclano</b> em qualquer posição na frase</li>
  </ul>
  <p>Exemplos de uso do operador <cite>?</cite>:</p>
  <ul>
    <li class="example"><span>Joanna de ?ngelis</span>pesquisa frase, cuja última palavra inicia com caractere desconhecido</li>
    <li class="example"><span>espírito Mirame?</span>pesquisa frase, cuja última palavra termina com caractere desconhecido</li>
    <li class="example"><span>algum con?erto</span>pesquisa frase, cujo quarto caractere da última palavra é desconhecido</li>
  </ul>
  <p>Exemplos de uso de <b>classe de caracteres</b> <cite>[]</cite>:</p>
  <ul>
    <li class="example"><span>autor Mirame[sz]</span>pesquisa frase, cuja última palavra termina com <b>s</b> ou <b>z</b></li>
    <li class="example"><span>amiga M[aáé]rcia</span>pesquisa frase, cujo segundo caractere da última palavra pode ser <b>a</b>, <b>á</b> ou <b>é</b></li>
  </ul>
  <p>Exemplo de uso combinado de operadores:</p>
  <ul>
    <li class="example"><span>*auto?estima*</span>pesquisa frase contendo as palavras <b>auto</b> e <b>estima</b>, <i>em qualquer posição</i>, separadas por algum caractere</li>
  </ul>
</div>
EOT;

      echo <<<EOT
<h3>&#xF0DA; Pesquisas - SONAT</h3>
<div>
  <p>Operador para localizar registros, cujo conteúdo do campo visado contém termos <b>SEMELHANTES FONETICAMENTE</b> a todos os itens de <b>lista de parâmetros</b> arbitrária, por exemplo:</p>
  <ul>
    <li class="example"><span>SONAT Allan Kardec</span> valida conteúdo que soa semelhante, a exemplo de <strong>ALAN&nbsp;CARDEQUI</strong>.</li>
    <li class="example"><span>SONAT angelis joana</span> valida conteúdo que soa semelhante, a exemplo de <strong>Joanna&nbsp;de&nbsp;Ângelis</strong>.</li>
  </ul>
  <p><em><b>FATOS NOTÁVEIS</b></em></p>
  <ol class="simpleList">
    <li>Usar <b>termos corretos</b> como parâmetros é especialmente útil para localizar semelhantes, grafados erroneamente.</li>
    <li>A ordem dos parâmetros não importa.</li>
  </ol>
</div>
EOT;

      echo <<<EOT
<h3>&#xF0DA; Pesquisas - NULL</h3>
<div>
  <p>Operador para localizar registros, cujo conteúdo do campo visado é <b>nulo</b>, tal que:</p>
  <ul>
    <li><b>nulo</b> não equivale a <b>sequência de 1+ espaços em branco</b>, <b>nulo</b> é ausência de conteúdo, o vazio no sentido de: <b>campo não preenchido</b>.</li>
    <li><b>NULL</b> é <cite title="equivalente no sentido técnico, sinônimo">alias</cite> de <b>ISNULL</b>.</li>
    <li>O operador complementar de <b>NULL</b> é <b>NOTNULL</b>, para pesquisar registros cujo conteúdo do campo é <b>não nulo</b>.</li>
    <li>Tanto <b>NULL</b> como <b>NOTNULL</b> dispensam PARÂMETRO, bastando digitá-los.</li>
  </ul>
</div>
EOT;

      break;

  }
?>