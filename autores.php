<?php

  /**
   * Este script é parte do projeto LUX :: Código aberto em Domínio Público.
  */

  require 'utils.php';

  /**
   * Testa se o argumento do tipo String contém apenas espaços em branco.
   *
   * @param $text String objeto da verificação.
   * @return NULL se o argumento contém apenas espaços em branco, senão
   *         retorna-o com haspas simples.
  */
  function chk($text) {
    return strlen(trim($text)) == 0 ? 'NULL' : "'$text'";
  }

  $db = new SQLite3(DB_FILENAME) or die('Unable to open database');

  if ($db->createFunction("preg_match", "preg_match", 2) === FALSE) exit("Failed creating function\n");

  /**
   * Refaz a sequência contínua dos "rowid" dos registros da tabela
   * "autores", esvaziando-a para imediatamente preenchê-la com os
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
      CREATE TEMP TABLE t AS SELECT * FROM autores ORDER BY nome, espirito;
      DELETE FROM autores;
      INSERT INTO autores SELECT * FROM t;
      -- REINDEX autores_ndx;
      COMMIT;
      PRAGMA foreign_keys = ON;
      -- VACUUM;
EOT
    );
  }

  switch ($_GET['action']) {

    case 'GETREC':
      $result = $db->query(
        "SELECT * FROM autores WHERE rowid == {$_GET['recnumber']}");
      echo join('|', $result->fetchArray(SQLITE3_NUM));
      break;

    case 'COUNT':
      echo $db->querySingle('SELECT count() FROM autores');
      break;

    case 'UPDATE':
      $code = chk($_GET['code']);
      $nome = chk($_GET['nome']);
      $espirito = chk($_GET['espirito']);
      $sql = <<<EOT
        PRAGMA foreign_keys = ON;
        PRAGMA recursive_triggers = ON;
        UPDATE autores SET code=$code, nome=$nome, espirito=$espirito
          WHERE rowid == {$_GET['recnumber']};
EOT;
      if ($db->exec($sql)) {
        rebuildTable($db);
        $sql = "SELECT rowid FROM autores WHERE code == $code";
        echo $db->querySingle($sql);
      } else {
        echo 'FALSE';
      }
      break;

    case 'INSERT':
      $code = chk($_GET['code']);
      $nome = chk($_GET['nome']);
      $espirito = chk($_GET['espirito']);
      $sql = <<<EOT
        PRAGMA foreign_keys = ON;
        PRAGMA recursive_triggers = ON;
        INSERT INTO autores SELECT $code, $nome, $espirito;
EOT;
      if ($db->exec($sql)) {
        rebuildTable($db);
        $sql = "SELECT rowid FROM autores WHERE code == $code";
        echo $db->querySingle($sql);
      } else {
        echo 'FALSE';
      }
      break;

    case 'DELETE':
      $sql = <<<EOT
        PRAGMA foreign_keys = ON;
        DELETE FROM autores WHERE rowid = {$_GET['recnumber']};
EOT;
      if ($db->exec($sql)) {
        rebuildTable($db);
        echo 'TRUE';
      } else {
        echo 'FALSE';
      }
      break;

    case 'SEARCH':
      /*
       * Pesquisa registros usando ISNULL, SOUNDEX, GLOB, LIKE ou REGEXP.
       *
       * TODO: melhorar extração de argumentos dos operadores/funções
      */
      // tenta montar alguma restrição
      $constraints = array();
      foreach (array('code', 'nome', 'espirito') as $name) {
        $needle = trim($_GET[$name]);
        if (strlen($needle) == 0) continue;
        if (preg_match('/^(GLOB|LIKE)\s+(.+)\s*$/i', $needle, $matches)) {
          $constraints[] = "$name {$matches[1]} '{$matches[2]}'";
        } else if (preg_match('/^(?:REGEXP?|MATCH(?:ES)?)\s+(.+)\s*$/i', $needle, $matches)) {
          $constraints[] = "preg_match('/".$matches[1]."/i', $name)";
        } else if (preg_match('/^SOUNDEX\s+(.+)\s*$/i', $needle, $matches)) {
          $constraints[] = "soundex($name) == '".soundex($matches[1])."'";
        } else if (strtoupper($needle) == 'NULL') {
          $constraints[] = "$name ISNULL";
        } else if (!(strpos($needle, '*') === FALSE
                     && strpos($needle, '?') === FALSE)) {
          $constraints[] = "$name GLOB '$needle'";
        } else if (!(strpos($needle, '%') === FALSE
                     && strpos($needle, '_') === FALSE)) {
          $constraints[] = "$name LIKE '$needle'";
        } else {
          $constraints[] = "$name == '$needle'";
        }
      }
      $text = '';
      // requisita a pesquisa se a montagem foi bem sucedida
      if (count($constraints) > 0) {
        // montagem do sql da pesquisa
        $sql = "SELECT rowid, * FROM autores WHERE ".join(' AND ', $constraints);
        // consulta o DB
        $result = $db->query($sql);
        // for debug purpose --> $text = $sql."\n";
        // montagem da lista de resultados
        if ($row = $result->fetchArray(SQLITE3_NUM)) {
          $text .= join('|', $row);
          while ($row = $result->fetchArray(SQLITE3_NUM)) {
            $text .= "\n".join('|', $row);
          }
        }
      }
      echo $text;
      break;
  }

  $db->close();

?>