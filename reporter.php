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
    printf("  === %s ===".PHP_EOL.PHP_EOL, mb_strtoupper($title, 'UTF8'));
    // formata Date&Time no padrão do Brasil com sufixo da região
    $d = explode('|', strftime('%A %d-%m-%Y %H:%M|%z'));
    printf("  Emissão: %s %s".PHP_EOL, ucfirst($d[0]),
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
      $m = $db->querySingle($sql);
      echo PHP_EOL."  #Pendências = $m";
      if ($m > 0) {
        $sql = <<<EOT
  SELECT rowid, bibliotecario, data_emprestimo, leitor, obra, autor, exemplar,
    posicao, comentario
  FROM emprestimos_facil
  WHERE data_devolucao ISNULL AND data_limite <= "$hoje";
EOT;
        $result = $db->query($sql);
        while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
          echo PHP_EOL.PHP_EOL."        Registro: ".$row['rowid'];
          echo PHP_EOL."          Agente: ".$row['bibliotecario'];
          echo PHP_EOL."   Emprestado em: ".$row['data_emprestimo'];
          echo PHP_EOL."          Leitor: ".$row['leitor'];
          echo PHP_EOL."            Obra: ".$row['obra'];
          echo PHP_EOL."  Autor&Espírito: ".$row['autor'];
          echo PHP_EOL."        Exemplar: ".$row['exemplar'];
          echo PHP_EOL."         Posição: ".$row['posicao'];
          echo PHP_EOL."      Comentário: ".$row['comentario'];
        }
      }

      echo(PHP_EOL.PHP_EOL);
      mkHeader('Livros Disponíveis para Empréstimo');

      $n = $db->querySingle('SELECT count(1) FROM exemplares_disponiveis');
      echo PHP_EOL."  #Exemplares = $n";
      if ($n > 0) {
        $sql = 'SELECT count(distinct titulo) FROM exemplares_disponiveis';
        $m = $db->querySingle($sql);
        echo PHP_EOL."     #Títulos = $m";
        $sql = <<<EOT
  SELECT titulo, autores, genero,
    group_concat(quote(exemplar), ", ") AS exemplares, posicao
  FROM exemplares_disponiveis
  GROUP BY titulo;
EOT;
        $result = $db->query($sql);
        while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
          echo PHP_EOL.PHP_EOL."         Título : ".$row['titulo'];
          echo PHP_EOL."  Autor&Espírito: ".$row['autores'];
          echo PHP_EOL."          Gênero: ".$row['genero'];
          $n = strrpos($row['exemplares'], ',');
          if ($n === FALSE) {
            echo PHP_EOL."        Exemplar: ".$row['exemplares'];
          } else {
            echo PHP_EOL."      Exemplares: "
              .substr($row['exemplares'], 0, $n).' e'
              .substr($row['exemplares'], $n+1);
          }
          echo PHP_EOL."         Posição: ".$row['posicao'];
        }
      }

      break;

    case 'LEITOR':

      mkHeader("Empréstimos em Atraso");

      $n = $db->querySingle('SELECT count(1) FROM atrasados');
      echo PHP_EOL."  #Pendências = $n";
      if ($n > 0) {
        $result = $db->query('SELECT * FROM atrasados');
        while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
          echo PHP_EOL.PHP_EOL."           Leitor: ".$row['leitor'];
          echo PHP_EOL."         Telefone: ".$row['telefone'];
          echo PHP_EOL."           e-mail: ".$row['email'];
          echo PHP_EOL."           Título: ".$row['titulo'];
          echo PHP_EOL."   Autor&Espírito: ".$row['autor'];
          echo PHP_EOL."         Exemplar: ".$row['exemplar'];
          echo PHP_EOL."  Data empréstimo: ".$row['data_emprestimo'];
          echo PHP_EOL."      Data limite: ".$row['data_limite'];
          echo PHP_EOL."           Atraso: ".$row['atraso'].' dias';
        }
      }

      break;

  }

?>