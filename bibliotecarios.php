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
   * "bibliotecarios", esvaziando-a para imediatamente preenchê-la com os
   * registros de sua cópia, ordenados pelo "nome" em ordem crescente.
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
      CREATE TEMP TABLE t AS SELECT * FROM bibliotecarios ORDER BY nome;
      DELETE FROM bibliotecarios;
      INSERT INTO bibliotecarios SELECT * FROM t;
      -- REINDEX bibliotecarios_ndx;
      COMMIT;
      PRAGMA foreign_keys = ON;
      -- VACUUM;
EOT
    );
  }

  switch ($_GET['action']) {

    case 'GETREC':
      $result = $db->query(
        "SELECT * FROM bibliotecarios WHERE rowid == {$_GET['recnumber']}");
      echo join('|', $result->fetchArray(SQLITE3_NUM));
      break;

    case 'COUNT':
      echo $db->querySingle('SELECT count() FROM bibliotecarios');
      break;

    case 'UPDATE':
      $code = chk($_GET['code']);
      $nome = chk($_GET['nome']);
      $sql = <<<EOT
        PRAGMA foreign_keys = ON;
        PRAGMA recursive_triggers = ON;
        UPDATE bibliotecarios SET code=$code, nome=$nome
          WHERE rowid == {$_GET['recnumber']};
EOT;
      if ($db->exec($sql)) {
        rebuildTable($db);
        $sql = "SELECT rowid FROM bibliotecarios WHERE code == $code";
        echo $db->querySingle($sql);
      } else {
        echo 'FALSE';
      }
      break;

    case 'INSERT':
      $code = chk($_GET['code']);
      $nome = chk($_GET['nome']);
      $sql = <<<EOT
        PRAGMA foreign_keys = ON;
        PRAGMA recursive_triggers = ON;
        INSERT INTO bibliotecarios SELECT $code, $nome;
EOT;
      if ($db->exec($sql)) {
        rebuildTable($db);
        $sql = "SELECT rowid FROM bibliotecarios WHERE code == $code";
        echo $db->querySingle($sql);
      } else {
        echo 'FALSE';
      }
      break;

    case 'DELETE':
      $sql = <<<EOT
        PRAGMA foreign_keys = ON;
        DELETE FROM bibliotecarios WHERE rowid = {$_GET['recnumber']};
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
       * Pesquisa registros usando ISNULL, SOUNDEX, GLOB, LIKE ou REGEXP
       * além dos operadores NOT, IS e IN.
       *
       * TODO: melhorar extração de argumentos dos operadores/funções
      */

      // tenta montar alguma restrição
      $constraints = array();
      foreach (array('code', 'nome') as $name)
      {
        // tenta obter a expressão a pesquisar na coluna corrente
        $needle = trim($_GET[$name]);
        if (strlen($needle) == 0) continue;

        // checa se a expressão é uma negação
        $negate = '';
        if (preg_match('/^NOT\s+(.+)$/i', $needle, $matches)) {
          $negate = 'NOT ';
          $needle = $matches[1];
        }

        // checa uso explícito de GLOB, LIKE ou IS
        if (preg_match('/^(GLOB|LIKE|IS)\s+(.+)\s*$/i', $needle, $matches)) {
          $constraints[] = $negate."$name {$matches[1]} '{$matches[2]}'";

        // checa uso de REGEXP também detectando aliases
        } else if (preg_match('/^(I|)(?:REGEXP?|MATCH(?:ES)?)\s+(.+)\s*$/i',
                              $needle, $matches)) {
          // extrai opção "ignorecase" opcionalmente declarada
          $ignorecase = strtolower($matches[1]);
          $constraints[] =
            $negate."preg_match('/{$matches[2]}/$ignorecase', $name)";

        // checa uso de SOUNDEX
        } else if (preg_match('/^SOUNDEX\s+(.+)\s*$/i', $needle, $matches)) {
          $constraints[] =
            $negate."soundex($name) == '".soundex($matches[1])."'";

        // checa uso do operador IN
        } else if (preg_match('/^IN\s+\((.+)\)\s*$/i', $needle, $matches)) {
          $lista = '';
          foreach (preg_split('/,\s*/', $matches[1]) as $item) {
            if (strlen($lista) > 0) $lista .= ',';
            $lista .= "'$item'";
          }
          $constraints[] = $negate."$name IN ($lista)";

        // checa uso implícito de GLOB
        } else if (!(strpos($needle, '*') === FALSE
                     && strpos($needle, '?') === FALSE)) {
          $constraints[] = $negate."$name GLOB '$needle'";

        // checa uso implícito de LIKE
        } else if (!(strpos($needle, '%') === FALSE
                     && strpos($needle, '_') === FALSE)) {
          $constraints[] = $negate."$name LIKE '$needle'";

        // checa comparação com NULL
        } else if (strtoupper($needle) == 'NULL') {
          $constraints[] = $negate."$name ISNULL";

        // default :: comparação simples
        } else {
          $constraints[] = $negate."$name == '$needle'";
        }
      }
      $text = '';
      // requisita a pesquisa se a montagem foi bem sucedida
      if (count($constraints) > 0) {
        // montagem do sql da pesquisa
        $sql = "SELECT rowid, * FROM bibliotecarios WHERE ".join(' AND ', $constraints);
        // for debug purpose --> $text = $sql."\n";
        // consulta o DB
        $result = $db->query($sql);
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