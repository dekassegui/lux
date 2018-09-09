<?php

  /** Este script é parte do projeto LUX. */

  require 'utils.php';

  function translate($s) {
    if (strpos($s, 'NULL') !== FALSE) {
      preg_match('/\b\w+\.(\S+)\b/', $s, $match);
      $fieldname = ($match[1] == 'code') ? 'Código' : $match[1];
      return "Erro: O campo <b>$fieldname</b> não pode ser NULO.";
    } else if (strpos($s, 'foreign key constraint') !== FALSE) {
      return 'Erro: Algum registro em outra tabela usa informações desse registro.';
    } else if (strpos($s, 'UNIQUE constraint failed') !== FALSE) {
      return 'Erro: Código e Título de obras precisam ser únicos.';
    }
    return "Erro: $s";
  }

  try {
    $db = new SQLitePDO();
    $db->connect();
  } catch(PDOException $e) {
    die($e->getMessage());
  }

  /**
   * Refaz a sequência contínua dos "rowid" dos registros da tabela
   * "obras", esvaziando-a para imediatamente preenchê-la com os
   * registros de sua cópia, ordenados pela combinação das colunas
   * "nome" e "espirito", em ordem crescente.
   *
   * Nota: As requisições são feitas numa transação, para comprometer
   *       minimamente o desempenho da interface.
   *
   * @param $db Handle do database container da tabela.
  */
  function rebuildTable($db) {
    $sql = <<<EOT
  PRAGMA foreign_keys = OFF;
  BEGIN TRANSACTION;
  DROP TABLE IF EXISTS t;
  CREATE TEMP TABLE t AS SELECT * FROM obras;
  DELETE FROM obras;
  INSERT INTO obras SELECT * FROM t ORDER BY UPPER(titulo) COLLATE
  portuguese;
  -- REINDEX obras_ndx;
  COMMIT;
  PRAGMA foreign_keys = ON;
  -- VACUUM;
EOT;
    return $db->exec($sql) === FALSE ? FALSE : TRUE;
  }

  switch ($_GET['action']) {

    case 'GETREC':
      $result = $db->query(<<<EOT
  SELECT code, titulo, autor, genero
  FROM obras_facil
  WHERE rowid == {$_GET['recnumber']};
EOT
      );
      if ($result !== FALSE AND $row = $result->fetch(PDO::FETCH_NUM)) {
        echo join('|', $row);
      } else {
        echo 'Erro: Requisição de registro #', $_GET['recnumber'], '.';
      }
      break;

    case 'COUNT':
      echo $db->querySingle('SELECT count() FROM obras');
      break;

    case 'INSERT':
    case 'UPDATE':
      $code = chk($_GET['code']);
      $titulo = mb_strtoupper( chk($_GET['titulo']) );
      $autor = chk($_GET['autor']);
      $genero = chk($_GET['genero']);
      if ($_GET['action'] == 'UPDATE') {
        $sql = <<<EOT
  PRAGMA foreign_keys = ON;
  PRAGMA recursive_triggers = ON;
  UPDATE obras_facil
    SET code=$code, titulo=$titulo, autor=$autor, genero=$genero
  WHERE rowid == {$_GET['recnumber']};
EOT;
      } else {
        $sql = <<<EOT
  PRAGMA foreign_keys = ON;
  PRAGMA recursive_triggers = ON;
  INSERT INTO obras_facil SELECT 'dummy_rowid', $code, $titulo, $autor, $genero;
EOT;
      }
      // requisita a atualização ou inserção
      if ($db->exec($sql) === FALSE) {
        echo translate($db->lastErrorMsg());
      } else {
        if (rebuildTable($db)) {
          echo $db->querySingle(
            "SELECT rowid FROM obras WHERE code == $code");
        } else {
          echo '1';
        }
      }
      break;

    case 'DELETE':
      $sql = <<<EOT
  PRAGMA foreign_keys = ON;
  DELETE FROM obras WHERE rowid = {$_GET['recnumber']};
EOT;
      if ($db->exec($sql) === FALSE) {
        echo translate($db->lastErrorMsg());
      } else {
        rebuildTable($db);
        echo 'TRUE';
      }
      break;

    case 'SEARCH':
      $constraints = buildConstraints(
        array('code', 'titulo', 'autor', 'genero'));
      $text = '';
      // requisita a pesquisa se a montagem foi bem sucedida
      if (count($constraints) > 0) {
        $restricoes = join(' AND ', $constraints);
        // montagem do sql da pesquisa
        $sql = <<<EOT
  SELECT rowid, code, titulo, autor, genero
  FROM obras_facil
  WHERE $restricoes;
EOT;
        // for debug purpose --> $text = $sql."\n";
        // consulta o DB
        $result = $db->query($sql);
        // montagem da lista de resultados
        if ($result !== FALSE AND $row = $result->fetch(PDO::FETCH_NUM)) {
          $text .= join('|', $row);
          while ($row = $result->fetch(PDO::FETCH_NUM)) {
            $text .= PHP_EOL.join('|', $row);
          }
        } else {
          $text = 'Advertência: Não há dados que satisfaçam a requisição:'.PHP_EOL.$sql;
        }
      } else {
        $text = 'Advertência: Parâmetros insuficientes para montagem das restrições de pesquisa.';
      }
      echo $text;
      break;

    case 'GETALL':
      $result = $db->query(<<<EOT
  SELECT '<option code="' || code || '">' || titulo || '</option>' FROM obras
EOT
      );
      if ($result !== FALSE)
        while ($row = $result->fetchColumn()) echo $row;
      break;
  }

?>
