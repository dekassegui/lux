<?php

  /**
   * Este script é parte do projeto LUX :: Código aberto em Domínio Público.
  */

  require 'utils.php';

  setlocale(LC_ALL, "pt_BR", "pt_BR.iso-8859-1", "pt_BR.utf-8", "portuguese");

  function mkHeader($title) {
    printf("  === %s ===\n\n", mb_strtoupper($title, 'UTF8'));
    $d = explode('|', strftime('%A|%d-%m-%Y|%H:%M|%z'));
    printf("  Emissão: %s %s %s %s\n", ucfirst($d[0]), $d[1], $d[2],
      $d[3] == '-0300' ? 'BRT' : 'BRST');
  }

  $db = new SQLite3(DB_FILENAME) or die('Unable to open database');

  switch ($_GET['action']) {

    case 'INFO':

      mkHeader('Devolucões Esperadas');

      $sql = <<<EOT
  SELECT rowid, bibliotecario, data_emprestimo, leitor, obra, autor, exemplar,
    posicao, comentario
  FROM (SELECT date('now', 'localtime') AS hoje), emprestimos_facil
  WHERE substr(comentario, -5, 4) || substr(comentario, -9, 4)
    || substr(comentario, -11, 2) <= hoje;
EOT;
      for ($m=0, $result=$db->query($sql);
            $result->fetchArray(SQLITE3_NUM); ++$m);
      echo "\n  #Pendências = $m";
      if ($m > 0) {
        $result->reset();
        while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
          echo "\n\n        Registro: ".$row['rowid'];
          echo "\n          Agente: ".$row['bibliotecario'];
          echo "\n   Emprestado em: ".$row['data_emprestimo'];
          echo "\n          Leitor: ".$row['leitor'];
          echo "\n            Obra: ".$row['obra'];
          echo "\n  Autor&Espírito: ".$row['autor'];
          echo "\n        Exemplar: ".$row['exemplar'];
          echo "\n         Posição: ".$row['posicao'];
          echo "\n      Comentário: ".$row['comentario'];
        }
      }
      $result->finalize();

      echo("\n\n");
      mkHeader('Livros Disponíveis para Empréstimo');

      $n = $db->querySingle('SELECT count(1) FROM exemplares_disponiveis');
      echo "\n  #Exemplares = $n";
      if ($n > 0) {
        $sql = <<<EOT
  SELECT titulo, autores, genero,
    group_concat(quote(exemplar), ", ") AS exemplares, posicao
  FROM exemplares_disponiveis
  GROUP BY titulo;
EOT;
        for ($m=0, $result=$db->query($sql);
              $result->fetchArray(SQLITE3_NUM); ++$m);
        echo "\n     #Títulos = $m";
        $result->reset();
        while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
          echo "\n\n         Título : ".$row['titulo'];
          echo "\n  Autor&Espírito: ".$row['autores'];
          echo "\n          Gênero: ".$row['genero'];
          $n = strrpos($row['exemplares'], ',');
          if ($n === FALSE) {
            echo "\n        Exemplar: ".$row['exemplares'];
          } else {
            echo "\n      Exemplares: "
              .substr($row['exemplares'], 0, $n).' e'
              .substr($row['exemplares'], $n+1);
          }
          echo "\n         Posição: ".$row['posicao'];
        }
        $result->finalize();
      }

      break;

    case 'LEITOR':

      mkHeader("Empréstimos em Atraso");

      $sql = 'SELECT * FROM atrasados';
      for ($n=0, $result=$db->query($sql);
            $result->fetchArray(SQLITE3_NUM); ++$n);
      echo "\n  #Pendências = $n";
      if ($n > 0) {
        $result->reset();
        while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
          echo "\n\n           Leitor: ".$row['leitor'];
          echo "\n         Telefone: ".$row['telefone'];
          echo "\n           e-mail: ".$row['email'];
          echo "\n           Título: ".$row['titulo'];
          echo "\n            Autor: ".$row['autor'];
          echo "\n         Exemplar: ".$row['exemplar'];
          echo "\n  Data empréstimo: ".$row['data_emprestimo'];
          echo "\n    Data prevista: ".$row['data_prevista'];
          echo "\n           Atraso: ".$row['atraso'].' dias';
        }
        $result->finalize();
      }

      break;

  }

  $db->close();

?>