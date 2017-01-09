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
            echo '> Há $n exemplares disponíveis da obra:';
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
        echo "Leitores em débito com a biblioteca até a data de hoje:";
        $sql = <<<EOT
  SELECT leitor, telefone, email, titulo, exemplar,
    strftime("%d-%m-%Y", data_emprestimo) as data_emprestimo,
    strftime("%d-%m-%Y", data_esperada) as data_esperada,
    dias_atraso
  FROM (
    SELECT leitores.nome AS leitor, leitores.telefone AS telefone,
      leitores.email AS email, obras.titulo AS titulo, exemplar,
      data_emprestimo, data_esperada, cast((julianday(hoje)
        - julianday(data_esperada)) AS integer) AS dias_atraso
    FROM (
        SELECT atrasados.*, date(data_emprestimo, prazo) AS data_esperada,
        date('now', 'localtime') AS hoje
        from config, atrasados
      ) AS x JOIN leitores ON x.leitor == leitores.code
        JOIN obras ON x.obra == obras.code);
EOT;
        $result = $db->query($sql);
        while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
          echo "\n\n      Leitor: ".$row['leitor'];
          echo "\n    Telefone: ".$row['telefone'];
          echo "\n      e-mail: ".$row['email'];
          echo "\n      Título: ".$row['titulo'];
          echo "\n    Exemplar: ".$row['exemplar'];
          echo "\n  Emprestimo: ".$row['data_emprestimo'];
          echo "\n    Esperada: ".$row['data_esperada'];
          echo "\n      Atraso: ".$row['dias_atraso'].' dias';
        }
        $result->finalize();
      } else {
        echo "Não há leitores em débito com a biblioteca.";
      }
      break;

  }

  $db->close();

?>