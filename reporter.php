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
  FROM (SELECT date('now', 'localtime') AS hoje), emprestimos_facil
  WHERE substr(comentario, -5, 4) || substr(comentario, -9, 4)
    || substr(comentario, -11, 2) <= hoje;
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
          echo "\n\n        Registro: ".$row['rowid'];
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
        echo '> Hoje, nenhuma devolução é esperada.';
      }
      $result->finalize();

      $n = $db->querySingle('SELECT count(1) FROM exemplares_disponiveis');
      if ($n > 0) {
        if ($nrows > 0) echo "\n\n";
        $sql = <<<EOT
  SELECT titulo, autores, genero,
    group_concat(quote(exemplar), ", ") AS exemplares, posicao
  FROM exemplares_disponiveis
  GROUP BY titulo;
EOT;
        $result = $db->query($sql);
        $mrows = 0;
        while ($result->fetchArray()) $mrows++;
        if ($mrows > 1) {
          echo "> Há $n exemplares disponíveis de $mrows obras distintas:";
        } else {
          if ($n == 1) {
            echo '> Há 1 exemplar disponível da obra:';
          } else {
            echo "> Há $n exemplares disponíveis da obra:";
          }
        }
        $result->reset();
        while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
          echo "\n\n         Título : ".$row['titulo'];
          echo "\n  Autor&Espírito: ".$row['autores'];
          echo "\n          Gênero: ".$row['genero'];
          if (strpos($row['exemplares'], ",") === FALSE) {
            echo "\n        Exemplar: ".$row['exemplares'];
          } else {
            echo "\n      Exemplares: ".$row['exemplares'];
          }
          echo "\n         Posição: ".$row['posicao'];
        }
        $result->finalize();
      } else {
        echo "> Nenhum exemplar de obra alguma está disponível.\n\n";
      }

      break;

    case 'LEITOR':

      $n = $db->querySingle('SELECT count(1) FROM atrasados');
      if ($n > 0) {
        if ($n == 1) {
          echo '> Até hoje, há 1 leitor em débito:';
        } else {
          echo "> Até hoje, há $n leitores em débito:";
        }
        $sql = 'SELECT * FROM atrasados';
        $result = $db->query($sql);
        while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
          echo "\n\n           Leitor: ".$row['leitor'];
          echo "\n         Telefone: ".$row['telefone'];
          echo "\n           e-mail: ".$row['email'];
          echo "\n           Título: ".$row['titulo'];
          echo "\n         Exemplar: ".$row['exemplar'];
          echo "\n  Data empréstimo: ".$row['data_emprestimo'];
          echo "\n    Data prevista: ".$row['data_prevista'];
          echo "\n           Atraso: ".$row['atraso'].' dias';
        }
        $result->finalize();
      } else {
        echo "Não há leitores em débito com a biblioteca.";
      }

      break;

  }

  $db->close();

?>