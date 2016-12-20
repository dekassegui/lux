<?php

  /**
   * Este script é parte do projeto LUX :: Código aberto em Domínio Público.
  */

  require 'utils.php';

  $db = new SQLite3(DB_FILENAME) or die('Unable to open database');

  addRegex($db);

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
    $db->exec(<<<EOT
  PRAGMA foreign_keys = OFF;
  BEGIN TRANSACTION;
  DROP TABLE IF EXISTS t;
  CREATE TEMP TABLE t AS SELECT * FROM obras ORDER BY titulo;
  DELETE FROM obras;
  INSERT INTO obras SELECT * FROM t;
  -- REINDEX obras_ndx;
  COMMIT;
  PRAGMA foreign_keys = ON;
  -- VACUUM;
EOT
    );
  }

  switch ($_GET['action']) {

    case 'GETREC':
      $result = $db->query(<<<EOT
  SELECT code, titulo, autor, genero
  FROM obras_facil
  WHERE rowid == {$_GET['recnumber']};
EOT
      );
      echo join('|', $result->fetchArray(SQLITE3_NUM));
      break;

    case 'COUNT':
      echo $db->querySingle('SELECT count() FROM obras');
      break;

    case 'INSERT':
    case 'UPDATE':
      $code = chk($_GET['code']);
      $titulo = chk($_GET['titulo']);
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
  INSERT INTO obras_facil SELECT $code, $titulo, $autor, $genero;
EOT;
      }
      if ($db->exec($sql)) {
        rebuildTable($db);
        $sql = "SELECT rowid FROM obras WHERE code == $code";
        echo $db->querySingle($sql);
      } else {
        echo 'Error: '.$db->lastErrorMsg();
      }
      break;

    case 'DELETE':
      $sql = <<<EOT
  PRAGMA foreign_keys = ON;
  DELETE FROM obras WHERE rowid = {$_GET['recnumber']};
EOT;
      if ($db->exec($sql)) {
        rebuildTable($db);
        echo 'TRUE';
      } else {
        echo 'Error: '.$db->lastErrorMsg();
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
        if ($row = $result->fetchArray(SQLITE3_NUM)) {
          $text .= join('|', $row);
          while ($row = $result->fetchArray(SQLITE3_NUM)) {
            $text .= "\n".join('|', $row);
          }
        } else {
          $text = "Warning: No data found to satisfy search:\n$sql";
        }
      }
      echo $text;
      break;

    case 'GETALL':
      $text = '';
      $result = $db->query('SELECT code, titulo FROM obras');
      if ($row = $result->fetchArray(SQLITE3_NUM)) {
        $text .= join('|', $row);
        while ($row = $result->fetchArray(SQLITE3_NUM)) {
          $text .= "\n".join('|', $row);
        }
      }
      echo $text;
      break;
  }

  $db->close();

?>