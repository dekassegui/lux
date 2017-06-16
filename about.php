<?php

  switch ($_GET['title']) {

    case 'BASIC':

      echo <<<EOT
<h3>Devolução</h3>
<ol>
<li>Acesse o registro de empréstimo do livro que está sendo devolvido, clicando no botão <span class="botao">&#xF002;&nbsp;Pesquisar</span> para localizar o registro se necessário.</li>
<li>Clique no botão <span class="botao">&#xF040;&nbsp;Atualizar</span> para iniciar o procedimento ou alternativamente, clique no rótulo <span class="botao">&#xF040;&nbsp;Devolução</span> que antecipará parcialmente o próximo passo.</li>
<li>Clique no campo <span class="field">Devolução</span> para selecionar a data no calendário que aparecerá abaixo do campo.</li>
<li>Clique no botão <span class="botao">&#xf00c;&nbsp;Salvar</span> para confirmar o procedimento ou clique no botão <span class="botao">&#xf00d;&nbsp;Cancelar</span> em caso contrário.<p><b>Nota</b>: Se a atualização for mal sucedida, o motivo será informado na janela de diálogo.</p></li>
</ol>
EOT;

      echo <<<EOT
<h3>Empréstimo</h3>
<ol>
<li>Clique no botão <span class="botao">&#xF067;&nbsp;Novo</span> ou alternativamente, clique no rótulo <span class="botao">&#xF067;&nbsp;Empréstimo</span>.</li>
<li>Preencha os campos:<ul>
    <li>Agente</li>
    <li>Empréstimo</li>
    <li>Leitor</li>
    <li>Obra (título do livro)</li>
  </ul><p>Os demais campos serão preenchidos <em>automaticamente</em> e somente o campo <span class="field">Exemplar</span> será editável conforme disponibilidade no acervo.</p><p><b>Dica</b>: Antes do preenchimento, pergunte ao leitor se já foi cadastrado.</p></li>
<li>Clique no botão <span class="botao">&#xf00c;&nbsp;Salvar</span> para confirmar o procedimento ou clique no botão <span class="botao">&#xf00d;&nbsp;Cancelar</span> em caso contrário.<p><b>Nota</b>: Se a operação de registro do empréstimo for mal sucedida, o motivo será informado na janela de diálogo.</p></li>
<li>Informe a <b>Data Limite</b> para devolução, recém calculada, apresentada no <span class="field">Comentário</span>.</li>
</ol>
EOT;

      break;

  }
?>
