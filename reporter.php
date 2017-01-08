<?php

  /**
   * Este script é parte do projeto LUX :: Código aberto em Domínio Público.
  */

  require 'utils.php';

  $db = new SQLite3(DB_FILENAME) or die('Unable to open database');

  switch ($_GET['action']) {

    case 'INFO':

      $sql = <<<EOT
  SELECT rowid, bibliotecario, data_emprestimo, leitor, obra, autor, exemplar,
    posicao, comentario
  FROM (
    SELECT emprestimos.rowid AS rowid
    FROM (
        SELECT prazo, date("now", "localtime") AS hoje FROM config
      ), emprestimos
    WHERE data_devolucao isnull AND date(data_emprestimo, prazo) <= hoje
  ) NATURAL JOIN emprestimos_facil;
EOT;
      $result = $db->query($sql);
      $nrows = 0;
      while ($result->fetchArray()) $nrows++;
      if ($nrows > 0) {
        if ($nrows > 1) {
          echo "> Hoje, são esperadas $nrows devoluções:";
        } else {
          echo "> Hoje, é esperada $nrows devolução:";
        }
        $result->reset();
        while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
          echo "\n\n      #registro : ".$row['rowid'];
          echo "\n          Agente: ".$row['bibliotecario'];
          echo "\n   Emprestado em: ".$row['data_emprestimo'];
          echo "\n          Leitor: ".$row['leitor'];
          echo "\n            Obra: ".$row['obra'];
          echo "\n  Autor&Espírito: ".$row['autor'];
          echo "\n        Exemplar: ".$row['exemplar'];
          echo "\n         Posicao: ".$row['posicao'];
          echo "\n      Comentário: ".$row['comentario'];
        }
      } else {
        echo "> Hoje, nenhuma devolução é esperada.\n\n";
      }
      $result->finalize();

      $sql = <<<EOT
  SELECT titulo, autores, genero,
    group_concat(quote(exemplar), ", ") AS exemplares, posicao
  FROM exemplares_disponiveis
  GROUP BY titulo;
EOT;
      $result = $db->query($sql);
      $mrows = 0;
      while ($result->fetchArray()) $mrows++;
      if ($mrows > 0) {
        if ($nrows > 0) echo "\n\n";
        $n = $db->querySingle('SELECT count(1) FROM exemplares_disponiveis');
        if ($mrows > 1) {
          echo "> Há $n exemplares disponíveis de $mrows obras distintas:";
        } else {
          if ($n == 1) {
            echo '> Há 1 exemplar disponível da obra:';
          } else {
            echo '> Há $n exemplares disponíveis da obra:';
          }
        }
        $result->reset();
        while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
          echo "\n\n         Título : ".$row['titulo'];
          echo "\n  Autor&Espírito: ".$row['autores'];
          echo "\n          Gênero: ".$row['genero'];
          echo "\n    Exemplar(es): ".$row['exemplares'];
          echo "\n         Posição: ".$row['posicao'];
        }
      } else {
        echo "> Nenhum exemplar de obra alguma está disponível.\n\n";
      }
      $result->finalize();

      break;

    case 'LEITOR':

      echo "Em construção.";
      break;

  }

  $db->close();

?>