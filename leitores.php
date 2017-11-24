<?php

  /** Este script é parte do projeto LUX. */

  require 'utils.php';

  function translate($s, $action) {
    $invalid = (strpos($s, 'NULL') !== FALSE);
    if ($invalid) {
      if (strpos($s, 'code') !== FALSE) {
        return 'Erro: O <b>Código</b> do leitor não foi preenchido.';
      } else if (strpos($s, 'nome') !== FALSE) {
        return 'Erro: O <b>Nome</b> do leitor não foi preenchido.';
      } else if (strpos($s, 'telefone') !== FALSE) {
        return 'Erro: O <b>Telefone</b> do leitor não foi preenchido.';
      } else if (strpos($s, 'email') !== FALSE) {
        return 'Erro: O <b>e-Mail</b> do leitor não foi preenchido.';
      }
    } else if (strpos($s, 'constraint') !== FALSE) {
      if ($action == 'DELETE') {
        return 'Erro: O leitor tem algum empréstimo pendente.';
      } else {
        return 'Erro: O <b>Telefone</b>  ou <b>e-Mail</b> do leitor não foi preenchido.';
      }
    } else if (strpos($s, 'UNIQUE constraint failed') !== FALSE) {
      return 'Erro: Código de leitor precisa ser único.';
    }
    return 'Erro: '.$s;
  }

  try {
    $db = new SQLitePDO();
    $db->connect();
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
    $sql = <<<EOT
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
EOT;
    return $db->exec($sql) === FALSE ? FALSE : TRUE;
  }

  switch ($_GET['action']) {

    case 'GETREC':
      $result = $db->query(
        "SELECT * FROM leitores WHERE rowid == {$_GET['recnumber']}");
      if ($result !== FALSE AND $row = $result->fetch(PDO::FETCH_NUM)) {
        echo join('|', $row);
      } else {
        echo 'Erro: Requisição de registro #', $_GET['recnumber'], '.';
      }
      break;

    case 'COUNT':
      echo $db->querySingle('SELECT count() FROM leitores');
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
        echo translate($db->lastErrorMsg());
      } else {
        if (rebuildTable($db)) {
          echo $db->querySingle(
            "SELECT rowid FROM leitores WHERE code == $code");
        } else {
          echo '1';
        }
      }
      break;

    case 'DELETE':
      $sql = <<<EOT
        PRAGMA foreign_keys = ON;
        DELETE FROM leitores WHERE rowid = {$_GET['recnumber']};
EOT;
      if ($db->exec($sql) === FALSE) {
        echo translate($db->lastErrorMsg(), 'DELETE');
      } else {
        rebuildTable($db);
        echo 'TRUE';
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
      $result = $db->query('SELECT code, nome FROM leitores');
      if ($result !== FALSE)
        while ($row = $result->fetch(PDO::FETCH_NUM))
          echo '<option code="', $row[0], '">', $row[1], '</option>';
      break;

    case 'PESQUISA':
      $result = $db->query('SELECT DISTINCT leitor, nome FROM emprestimos JOIN leitores ON leitor IS code ORDER BY nome;');
      if ($result !== FALSE)
        while ($row = $result->fetch(PDO::FETCH_NUM))
          echo '<option code="', $row[0], '">', $row[1], '</option>';
      break;

  }

?>