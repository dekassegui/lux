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
    <li><strong>Todos</strong> <b>os operadores estão disponíveis em</b> <strong>todos</strong> <b>os campos de formulários de</b> <strong>todas</strong> <b>as tabelas</b>, inclusive os de caráter informativo <i>que não são editáveis na prática</i>, para montagem de restrições sobre os conteúdos dos campos.</li>
    <li>Cada restrição está relacionada únicamente ao campo preenchido que, em caso contrário será ignorado.</li>
    <li>A validação de um registro é <b>bem sucedida</b> quando as restrições sobre os conteúdos de seus campos são satisfeitas simultâneamente e neste caso, diz-se que ocorreu <b>sucesso</b>.</li>
    <li>O uso de letras MAIÚSCULAS ou minúsculas é irrelevante, porém vogais acentuadas e cedilha <b>são semelhantes</b> às não acentuadas e à letra <b>C</b> respectivamente, ou seja; <b>nâo são iguais</b>.</li>
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
    <li class="example"><span>*</span>validação irrestrita de conteúdo &#x2012; útil para listar todos registros</li>
    <li class="example"><span>fulano*</span> valida conteúdo iniciado com <b>fulano</b></li>
    <li class="example"><span>*beltrano</span> valida conteúdo terminado com <b>beltrano</b></li>
    <li class="example"><span>*ciclano*</span> valida conteúdo que contém <b>ciclano</b> em qualquer posição</li>
  </ul>
  <p>Exemplos de uso do operador <cite>?</cite>:</p>
  <ul>
    <li class="example"><span>Joanna de ?ngelis</span> valida conteúdo cuja última palavra inicia com caractere desconhecido</li>
    <li class="example"><span>espírito Mirame?</span> valida conteúdo cuja última palavra termina com caractere desconhecido</li>
    <li class="example"><span>algum con?erto</span> valida conteúdo cujo quarto caractere da última palavra é desconhecido</li>
  </ul>
  <p>Exemplos de uso de <b>Classe de Caracteres</b> <cite>[]</cite>:</p>
  <ul>
    <li class="example"><span>autor Mirame[sz]</span> valida conteúdo cuja última palavra termina com <b>s</b> ou <b>z</b></li>
    <li class="example"><span>amiga M[aáé]rcia</span> valida conteúdo cujo segundo caractere da última palavra pode ser <b>a</b>, <b>á</b> ou <b>é</b></li>
  </ul>
  <p>Exemplo de uso combinado de operadores:</p>
  <ul>
    <li class="example"><span>*auto?estima*</span> valida conteúdo que contém as palavras <b>auto</b> e <b>estima</b>, em qualquer posição e separadas por algum caractere</li>
  </ul>
</div>
EOT;

      echo <<<EOT
<h3>&#xF0DA; Pesquisas - SONAT</h3>
<div>
  <p>Operador para validar conteúdo de campo que contém termos <b>SEMELHANTES FONETICAMENTE</b> a todos os itens de <b>lista de parâmetros</b> arbitrária, por exemplo:</p>
  <ul>
    <li class="example"><span>SONAT Allan Kardec</span> valida conteúdo que contém termos que soam semelhante, como <strong>ALAN&nbsp;CARDEQUI</strong>.</li>
    <li class="example"><span>SONAT angelis joana</span> valida conteúdo que contém termos que soam semelhante, como <strong>Joanna&nbsp;de&nbsp;Ângelis</strong>.</li>
  </ul>
  <p><em><b>Addendum</b></em></p>
  <ol class="simpleList">
    <li>Usar <b>termos corretos</b> como parâmetros é especialmente útil para localizar semelhantes, grafados erroneamente.</li>
    <li>O número de parâmetros é ilimitado e <b>a ordem não importa</b>, mas recomenda-se que a lista inicie com itens menos prováveis de haver semelhante.</li>
  </ol>
</div>
EOT;

      echo <<<EOT
<h3>&#xF0DA; Pesquisas - NULL</h3>
<div>
  <p>Operador para validar conteúdo <b>nulo</b>, tal que:</p>
  <ol class="simpleList">
    <li><b>nulo</b> não equivale a <b>sequência de um ou mais espaços em branco</b>, <b>nulo</b> é ausência de conteúdo, o vazio no sentido de: <b>campo não preenchido</b>.</li>
    <li><b>NULL</b> é <cite title="comando equivalente">alias</cite> de <b>ISNULL</b>.</li>
    <li>O operador complementar de <b>NULL</b> é <b>NOTNULL</b>, para pesquisar registros cujo conteúdo do campo é <b>não nulo</b>.</li>
    <li>Tanto <b>NULL</b> como <b>NOTNULL</b> dispensam PARÂMETRO, bastando digitá-los.</li>
    <li><b>NULL</b> é especialmente útil para pesquisar registros cujas datas de devolução são <b>nulas</b>, isto é: <b>não foram preenchidas</b>.</li>
  </ol>
</div>
EOT;

      echo <<<EOT
<h3>&#xF0DA; Pesquisas - Appendice</h3>
<div>
  <p>Outros operadores disponíveis:</p>
  <ol class="simpleList">
    <li>Comparação: <cite>&lt;</cite> <cite>&lt;=</cite> <cite>==</cite> <cite>&gt;=</cite> <cite>&gt;</cite> <cite>!=</cite></li>
    <li>Especiais: <cite>IN</cite> <cite>IS</cite> <cite>NOT</cite> <cite>SONDX</cite></li>
    <li>Padrão LIKE: <cite>%</cite> <cite>_</cite></li>
    <li>Expressões Regulares: <cite>REGEX</cite></li>
  </ol>
</div>
EOT;

      break;

  }
?>
