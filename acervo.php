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
   * cópia, ordenados pelo "titulo" da obra correspondentes aos seus códigos
   * e pela coluna "exemplar", mediante junção com a tabela "obras".
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
      $result = $db->query(<<<EOT
  SELECT obra, exemplar, posicao, comentario
  FROM acervo_facil
  WHERE rowid == {$_GET['recnumber']};
EOT
      );
      echo join('|', $result->fetchArray(SQLITE3_NUM));
      break;

    case 'COUNT':
      echo $db->querySingle('SELECT count() FROM acervo');
      break;

    case 'INSERT':
    case 'UPDATE':
      $obra = chk($_GET['obra']);
      $exemplar = chk($_GET['exemplar']);
      $posicao = chk($_GET['posicao']);
      $comentario = chk($_GET['comentario']);
      if ($_GET['action'] == 'UPDATE') {
        $sql = <<<EOT
  PRAGMA foreign_keys = ON;
  PRAGMA recursive_triggers = ON;
  UPDATE acervo_facil SET code='dummy_code', obra=$obra, autor='dummy_autor',
    exemplar=$exemplar, posicao=$posicao, comentario=$comentario
  WHERE rowid == {$_GET['recnumber']};
EOT;
      } else {
        $sql = <<<EOT
  PRAGMA foreign_keys = ON;
  PRAGMA recursive_triggers = ON;
  INSERT INTO acervo_facil SELECT 'dummy_rowid', 'dummy_code', $obra,
    'dummy_autor', $exemplar, $posicao, $comentario;
EOT;
      }
      if ($db->exec($sql)) {
        rebuildTable($db);
        $sql = <<<EOT
  SELECT rowid
  FROM acervo_facil
  WHERE obra == $obra AND exemplar == $exemplar
EOT;
        echo $db->querySingle($sql);
      } else {
        echo 'Error: '.$db->lastErrorMsg();
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
        echo 'Error: '.$db->lastErrorMsg();
      }
      break;

    case 'SEARCH':
      $constraints = buildConstraints(
        array('obra', 'exemplar', 'posicao', 'comentario'));
      $text = '';
      // requisita a pesquisa se a montagem foi bem sucedida
      if (count($constraints) > 0) {
        $restricoes = join(' AND ', $constraints);
        // montagem do sql da pesquisa
        $sql = <<<EOT
  SELECT rowid, obra, exemplar, posicao, comentario
  FROM acervo_facil
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

    case 'GETALL': // TODO: eliminar este trecho se não utilizado
      $text = '';
      $result = $db->query(
        'SELECT code, obra || " (" || exemplar || " - " || posicao || ")" FROM acervo_facil'
        );
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