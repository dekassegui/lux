<?php

  /**
   * Este script é parte do projeto LUX :: Código aberto em Domínio Público.
  */

  require 'utils.php';

  $db = new SQLite3(DB_FILENAME) or die('Unable to open database');

  addRegex($db);

  /**
   * Refaz a sequência contínua dos "rowid" dos registros da tabela "acervo",
   * esvaziando-a para imediatamente preenchê-la com os registros de sua
   * cópia, ordenados pelas colunas "titulo" e "exemplar" via junção com a
   * tabela "obras".
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
      CREATE TEMP TABLE t AS
        SELECT acervo.*
        FROM acervo JOIN obras ON acervo.obra == obras.code
        ORDER BY titulo, exemplar;
      DELETE FROM acervo;
      INSERT INTO acervo SELECT * FROM t;
      -- REINDEX acervo_ndx;
      COMMIT;
      PRAGMA foreign_keys = ON;
      -- VACUUM;
EOT
    );
  }

  switch ($_GET['action']) {

    case 'GETREC':
      $result = $db->query(
        "SELECT obra, exemplar, posicao, comentario FROM acervo_view WHERE rowid == {$_GET['recnumber']}");
      echo join('|', $result->fetchArray(SQLITE3_NUM));
      break;

    case 'COUNT':
      echo $db->querySingle('SELECT count() FROM acervo');
      break;

    case 'UPDATE':
      $obra = chk($_GET['obra']);
      $exemplar = chk($_GET['exemplar']);
      $posicao = chk($_GET['posicao']);
      $comentario = chk($_GET['comentario']);
      $sql = <<<EOT
        PRAGMA foreign_keys = ON;
        PRAGMA recursive_triggers = ON;
        UPDATE acervo SET obra=$obra, exemplar=$exemplar, posicao=$posicao, comentario=$comentario
        WHERE rowid == {$_GET['recnumber']};
EOT;
      if ($db->exec($sql)) {
        rebuildTable($db);
        $sql = "SELECT rowid FROM acervo WHERE obra == $obra AND exemplar == $exemplar";
        echo $db->querySingle($sql);
      } else {
        echo 'FALSE';
      }
      break;

    case 'INSERT':
      $obra = chk($_GET['obra']);
      $exemplar = chk($_GET['exemplar']);
      $posicao = chk($_GET['posicao']);
      $comentario = chk($_GET['comentario']);
      $sql = <<<EOT
        PRAGMA foreign_keys = ON;
        PRAGMA recursive_triggers = ON;
        INSERT INTO acervo SELECT $obra, $exemplar, $posicao, $comentario;
EOT;
      if ($db->exec($sql)) {
        rebuildTable($db);
        $sql = "SELECT rowid FROM acervo WHERE obra == $obra AND exemplar == $exemplar";
        echo $db->querySingle($sql);
      } else {
        echo 'FALSE';
      }
      break;

    case 'DELETE':
      $sql = <<<EOT
        PRAGMA foreign_keys = ON;
        DELETE FROM acervo WHERE rowid = {$_GET['recnumber']};
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
      */

      $constraints = buildConstraints(array('obra', 'exemplar', 'posicao', 'comentario'));

      $text = '';
      // requisita a pesquisa se a montagem foi bem sucedida
      if (count($constraints) > 0) {
        // montagem do sql da pesquisa
        $sql = 'SELECT rowid, obra, exemplar, posicao, comentario FROM acervo_view WHERE '.join(' AND ', $constraints);
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

    case 'GETALL':
      $text = '';
      $result = $db->query('SELECT code, obra FROM acervo_view');
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