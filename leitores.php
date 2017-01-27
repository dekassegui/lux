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
   * "leitores", esvaziando-a para imediatamente preenchê-la com os
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
  CREATE TEMP TABLE t AS SELECT * FROM leitores ORDER BY nome;
  DELETE FROM leitores;
  INSERT INTO leitores SELECT * FROM t;
  -- REINDEX leitores_ndx;
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
        "SELECT * FROM leitores WHERE rowid == {$_GET['recnumber']}");
      echo join('|', $result->fetch(PDO::FETCH_NUM));
      break;

    case 'COUNT':
      $result = $db->query('SELECT count() FROM leitores');
      echo $result->fetchColumn();
      break;

    case 'INSERT':
    case 'UPDATE':
      $code = chk($_GET['code']);
      $nome = chk($_GET['nome']);
      $telefone = chk($_GET['telefone']);
      $email = chk($_GET['email']);
      if ($_GET['action'] == 'UPDATE') {
        $sql = <<<EOT
  PRAGMA foreign_keys = ON;
  PRAGMA recursive_triggers = ON;
  UPDATE leitores
    SET code=$code, nome=$nome, telefone=$telefone, email=$email
  WHERE rowid == {$_GET['recnumber']};
EOT;
      } else {
      $sql = <<<EOT
  PRAGMA foreign_keys = ON;
  PRAGMA recursive_triggers = ON;
  INSERT INTO leitores SELECT $code, $nome, $telefone, $email;
EOT;
      }
      // requisita a atualização ou inserção
      if ($db->exec($sql) === FALSE) {
        $arr = $db->errorInfo();
        echo join('|', $arr);
      } else {
        if (rebuildTable($db)) {
          $sql = "SELECT rowid FROM leitores WHERE code == $code";
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
        DELETE FROM leitores WHERE rowid = {$_GET['recnumber']};
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
      $constraints = buildConstraints(
        array('code', 'nome', 'telefone', 'email'));
      $text = '';
      // requisita a pesquisa se a montagem foi bem sucedida
      if (count($constraints) > 0) {
        $restricoes = join(' AND ', $constraints);
        // montagem do sql da pesquisa
        $sql = "SELECT rowid, * FROM leitores WHERE $restricoes";
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
      $result = $db->query('SELECT code, nome FROM leitores');
      if ($row = $result->fetch(PDO::FETCH_NUM)) {
        $text .= join('|', $row);
        while ($row = $result->fetch(PDO::FETCH_NUM)) {
          $text .= "\n".join('|', $row);
        }
      }
      echo $text;
      break;
  }

?>