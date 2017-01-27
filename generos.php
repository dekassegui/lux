<?php

  /**
   * Este script é parte do projeto LUX :: Código aberto em Domínio Público.
  */

  require 'utils.php';

  try {
    $db = new SQLitePDO();
    $db->connect(DB_FILENAME);
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
    $db->exec(<<<EOT
  PRAGMA foreign_keys = OFF;
  BEGIN TRANSACTION;
  DROP TABLE IF EXISTS t;
  CREATE TEMP TABLE t AS SELECT * FROM generos ORDER BY nome;
  DELETE FROM generos;
  INSERT INTO generos SELECT * FROM t;
  -- REINDEX generos_ndx;
  COMMIT;
  PRAGMA foreign_keys = ON;
  -- VACUUM;
EOT
    );
    return $db->exec($sql) === FALSE ? FALSE : TRUE;
  }

  switch ($_GET['action']) {

    case 'GETREC':
      $result = $db->query(
        "SELECT * FROM generos WHERE rowid == {$_GET['recnumber']}");
      echo join('|', $result->fetch(PDO::FETCH_NUM));
      break;

    case 'COUNT':
      $result = $db->query('SELECT count() FROM generos');
      echo $result->fetchColumn();
      break;

    case 'INSERT':
    case 'UPDATE':
      $code = chk($_GET['code']);
      $nome = chk($_GET['nome']);
      if ($_GET['action']) {
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
        $arr = $db->errorInfo();
        echo join('|', $arr);
      } else {
        if (rebuildTable($db)) {
          $sql = "SELECT rowid FROM generos WHERE code == $code";
          $result = $db->query($sql);
          echo $result->fetchColumn();
        } else {
          echo "1";
        }
      }
      break;

    case 'DELETE':
      $sql = <<<EOT
        PRAGMA foreign_keys = ON;
        DELETE FROM generos WHERE rowid = {$_GET['recnumber']};
EOT;
      if ($db->exec($sql)) {
        rebuildTable($db);
        echo 'TRUE';
      } else {
        $arr = $db->errorInfo();
        echo join('|', $arr);
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
        if ($row = $result->fetch(PDO::FETCH_NUM)) {
          $text .= join('|', $row);
          while ($row = $result->fetch(PDO::FETCH_NUM)) {
            $text .= "\n".join('|', $row);
          }
        } else {
          $text = "Advertência: Não há dados que satisfaçam a requisição:\n$sql";
        }
      } else {
        $text = 'Advertência: Parâmetros insuficientes para montagem das restrições de pesquisa.';
      }
      echo $text;
      break;

    case 'GETALL':
      $text = '';
      $result = $db->query('SELECT code, nome FROM generos');
      if ($row = $result->fetch(PDO::FETCH_NUM)) {
        $text .= $row[0].'|'.$row[1];
        while ($row = $result->fetch(PDO::FETCH_NUM)) {
          $text .= "\n".$row[0].'|'.$row[1];
        }
      }
      echo $text;
      break;
  }

?>