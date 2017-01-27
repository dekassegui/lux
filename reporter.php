<?php

  /**
   * Este script é parte do projeto LUX :: Código aberto em Domínio Público.
  */

  require 'utils.php';

  /**
   * Tenta definir "locale" para português do Brasil.
  */
  setlocale(LC_ALL, "pt_BR", "pt_BR.utf-8", "pt_BR.iso-8859-1", "portuguese");

  /**
   * Formata e imprime cabeçalho de relatório agregando Date&Time de emissão.
   *
   * @param $title String container do título.
  */
  function mkHeader($title) {
    printf("  === %s ===\n\n", mb_strtoupper($title, 'UTF8'));
    // formata Date&Time no padrão do Brasil com sufixo da região
    $d = explode('|', strftime('%A %d-%m-%Y %H:%M|%z'));
    printf("  Emissão: %s %s\n", ucfirst($d[0]),
      $d[1] == '-0300' ? 'BRT' : 'BRST');
  }

  try {
    $db = new SQLitePDO();
    $db->connect(DB_FILENAME);
  } catch(PDOException $e) {
    die($e->getMessage());
  }

  switch ($_GET['action']) {

    case 'INFO':

      mkHeader('Devolucões Esperadas');

      $hoje = strftime('%Y-%m-%d');
      $sql = <<<EOT
  SELECT count(1)
  FROM emprestimos_facil
  WHERE data_devolucao ISNULL AND data_limite <= "$hoje";
EOT;
      $result = $db->query($sql);
      $m = $result->fetchColumn();
      echo "\n  #Pendências = $m";
      if ($m > 0) {
        $sql = <<<EOT
  SELECT rowid, bibliotecario, data_emprestimo, leitor, obra, autor, exemplar,
    posicao, comentario
  FROM emprestimos_facil
  WHERE data_devolucao ISNULL AND data_limite <= "$hoje";
EOT;
        $result = $db->query($sql);
        while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
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

      echo("\n\n");
      mkHeader('Livros Disponíveis para Empréstimo');

      $result = $db->query('SELECT count(1) FROM exemplares_disponiveis');
      $n = $result->fetchColumn();
      echo "\n  #Exemplares = $n";
      if ($n > 0) {
        $sql = 'SELECT count(distinct titulo) FROM exemplares_disponiveis';
        $result = $db->query($sql);
        $m = $result->fetchColumn();
        echo "\n     #Títulos = $m";
        $sql = <<<EOT
  SELECT titulo, autores, genero,
    group_concat(quote(exemplar), ", ") AS exemplares, posicao
  FROM exemplares_disponiveis
  GROUP BY titulo;
EOT;
        $result = $db->query($sql);
        while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
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
      }

      break;

    case 'LEITOR':

      mkHeader("Empréstimos em Atraso");

      $sql = 'SELECT count(1) FROM atrasados';
      $result = $db->query($sql);
      $n = $result->fetchColumn();
      echo "\n  #Pendências = $n";
      if ($n > 0) {
        $sql = 'SELECT * FROM atrasados';
        $result = $db->query($sql);
        while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
          echo "\n\n           Leitor: ".$row['leitor'];
          echo "\n         Telefone: ".$row['telefone'];
          echo "\n           e-mail: ".$row['email'];
          echo "\n           Título: ".$row['titulo'];
          echo "\n   Autor&Espírito: ".$row['autor'];
          echo "\n         Exemplar: ".$row['exemplar'];
          echo "\n  Data empréstimo: ".$row['data_emprestimo'];
          echo "\n      Data limite: ".$row['data_limite'];
          echo "\n           Atraso: ".$row['atraso'].' dias';
        }
      }

      break;

  }

?>