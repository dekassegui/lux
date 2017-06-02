<?php

  /** Este script é parte do projeto LUX. */

  require 'utils.php';

  function translate($s) {
    if (strpos($s, 'NULL') !== FALSE) {
      $i = strpos($s, 'acervo.') + 7;
      $k = stripos($s, ' ');
      return 'Erro: O campo <b>'.substr($s, $i, $k-$i).'</b> não pode ser NULO.';
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
   * Refaz a sequência contínua dos "rowid" dos registros da tabela
   * "generos", esvaziando-a para imediatamente preenchê-la com os
   * registros de sua cópia, ordenados pelo "nome" em ordem crescente.
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
  CREATE TEMP TABLE t AS SELECT * FROM generos ORDER BY nome;
  DELETE FROM generos;
  INSERT INTO generos SELECT * FROM t;
  REINDEX generos;
  COMMIT;
  PRAGMA foreign_keys = ON;
  -- VACUUM;
EOT;
    return $db->exec($sql) === FALSE ? FALSE : TRUE;
  }

  switch ($_GET['action']) {

    case 'GETREC':
      $result = $db->query(
        "SELECT * FROM generos WHERE rowid == {$_GET['recnumber']}");
      if ($result !== FALSE AND $row = $result->fetch(PDO::FETCH_NUM)) {
        echo join('|', $row);
      } else {
        echo 'Erro: Requisição de registro #', $_GET['recnumber'], '.';
      }
      break;

    case 'COUNT':
      echo $db->querySingle('SELECT count() FROM generos');
      break;

    case 'INSERT':
    case 'UPDATE':
      $code = chk($_GET['code']);
      $nome = chk($_GET['nome']);
      if ($_GET['action'] == 'UPDATE') {
        $sql = <<<EOT
  PRAGMA foreign_keys = ON;
  PRAGMA recursive_triggers = ON;
  UPDATE generos SET code=$code, nome=$nome
  WHERE rowid == {$_GET['recnumber']};
EOT;
      } else {
        $sql = <<<EOT
  PRAGMA foreign_keys = ON;
  PRAGMA recursive_triggers = ON;
  INSERT INTO generos SELECT $code, $nome;
EOT;
      }
      // requisita a atualização ou inserção
      if ($db->exec($sql) === FALSE) {
        echo translate($db->lastErrorMsg());
      } else {
        if (rebuildTable($db)) {
          echo $db->querySingle(
            "SELECT rowid FROM generos WHERE code == $code");
        } else {
          echo '1';
        }
      }
      break;

    case 'DELETE':
      $sql = <<<EOT
        PRAGMA foreign_keys = ON;
        DELETE FROM generos WHERE rowid = {$_GET['recnumber']};
EOT;
      if ($db->exec($sql) === FALSE) {
        echo translate($db->lastErrorMsg());
      } else {
        rebuildTable($db);
        echo 'TRUE';
      }
      break;

    case 'SEARCH':
      $constraints = buildConstraints(array('code', 'nome'));
      $text = '';
      // requisita a pesquisa se a montagem foi bem sucedida
      if (count($constraints) > 0) {
        $restricoes = join(' AND ', $constraints);
        // montagem do sql da pesquisa
        $sql = "SELECT rowid, * FROM generos WHERE $restricoes";
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
  SELECT '<option code="' || code || '">' || nome || '</option>' FROM generos
EOT
      );
      if ($result !== FALSE)
        while ($row = $result->fetchColumn()) echo $row;
      break;
  }

?>