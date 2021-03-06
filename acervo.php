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
    $sql = <<<EOT
  PRAGMA foreign_keys = OFF;
  BEGIN TRANSACTION;
  DROP TABLE IF EXISTS t;
  CREATE TEMP TABLE t AS SELECT * FROM acervo;
  DELETE FROM acervo;
  INSERT INTO acervo SELECT t.* FROM t JOIN obras ON t.obra == obras.code
    ORDER BY UPPER(obras.titulo) COLLATE portuguese, UPPER(exemplar);
  -- REINDEX acervo_ndx;
  COMMIT;
  PRAGMA foreign_keys = ON;
  -- VACUUM;
EOT;
    return $db->exec($sql) === FALSE ? FALSE : TRUE;
  }

  switch ($_GET['action']) {

    case 'GETREC':
      $result = $db->query(<<<EOT
  SELECT obra, exemplar, posicao, comentario
  FROM acervo_facil
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
      echo $db->querySingle('SELECT count() FROM acervo');
      break;

    case 'INSERT':
    case 'UPDATE':
      $obra = chk($_GET['obra']);
      $exemplar = mb_strtoupper( chk($_GET['exemplar']) );
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
      // requisita a atualização ou inserção
      if ($db->exec($sql) === FALSE) {
        echo translate($db->lastErrorMsg());
      } else {
        if (rebuildTable($db)) {
          $sql = <<<EOT
  SELECT rowid
  FROM acervo_facil
  WHERE obra == $obra AND exemplar == $exemplar
EOT;
          echo $db->querySingle($sql);
        } else {
          echo '1';
        }
      }
      break;

    case 'DELETE':
      $sql = <<<EOT
  PRAGMA foreign_keys = ON;
  DELETE FROM acervo WHERE rowid = {$_GET['recnumber']};
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
        array('obra', 'exemplar', 'posicao', 'comentario'));
      // requisita a pesquisa se a montagem foi bem sucedida
      if (count($constraints) > 0) {
        $restricoes = join(' AND ', $constraints);
        // montagem do sql da pesquisa
        $sql = <<<EOT
  SELECT rowid, obra, exemplar, posicao, comentario
  FROM acervo_facil
  WHERE $restricoes;
EOT;
        // for DEBUG PURPOSE: echo $sql."\n";
        // consulta o DB
        $result = $db->query($sql);
        // montagem da lista de resultados
        if ($result !== FALSE AND $row = $result->fetch(PDO::FETCH_NUM)) {
          echo join('|', $row);
          while ($row = $result->fetch(PDO::FETCH_NUM)) {
            echo PHP_EOL, join('|', $row);
          }
        } else {
          echo 'Advertência: Não há dados que satisfaçam a requisição:', PHP_EOL, $sql;
        }
      } else {
        echo 'Advertência: Parâmetros insuficientes para montagem das restrições de pesquisa.';
      }
      break;

    case 'GETALL': // TODO: eliminar este trecho se não utilizado
      $result = $db->query(
        'SELECT code, obra || " (" || exemplar || " - " || posicao || ")" FROM acervo_facil'
        );
      if ($row = $result->fetch(PDO::FETCH_NUM)) {
        echo join('|', $row);
        while ($row = $result->fetch(PDO::FETCH_NUM)) {
          echo PHP_EOL, join('|', $row);
        }
      }
      break;
  }

?>
