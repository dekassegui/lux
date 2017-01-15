<?php

  /**
   * Este script é parte do projeto LUX :: Código aberto em Domínio Público.
  */

  require 'utils.php';

  $db = new SQLite3(DB_FILENAME) or die('Unable to open database');

  addRegex($db);

  /**
   * Refaz a sequência contínua dos "rowid" dos registros da tabela
   * "emprestimos", esvaziando-a para imediatamente preenchê-la com os
   * registros de sua cópia, ordenados por valores relativos.
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
  CREATE TEMP TABLE t AS
    SELECT emprestimos.*
    FROM emprestimos
      JOIN leitores ON (emprestimos.leitor == leitores.code)
      JOIN obras ON (emprestimos.obra == obras.code)
    ORDER BY data_emprestimo, leitores.nome, obras.titulo;
  DELETE FROM emprestimos;
  INSERT INTO emprestimos_easy SELECT * FROM t;
  -- REINDEX autores_ndx;
  COMMIT;
  PRAGMA foreign_keys = ON;
  -- VACUUM;
EOT;
    return $db->exec($sql) ? TRUE : FALSE;
  }

  switch ($_GET['action']) {

    case 'GETREC':
      $result = $db->query(<<<EOT
  SELECT data_emprestimo, data_devolucao, bibliotecario, leitor, obra,
    exemplar, comentario
  FROM emprestimos_facil
  WHERE rowid == {$_GET['recnumber']}
EOT
      );
      echo join('|', $result->fetchArray(SQLITE3_NUM));
      break;

    case 'COUNT':
      echo $db->querySingle('SELECT count() FROM emprestimos');
      break;

    case 'INSERT':
    case 'UPDATE':
      $data_emprestimo = chk(normalize($_GET['data_emprestimo']));
      $data_devolucao = chk(normalize($_GET['data_devolucao']));
      $bibliotecario = chk($_GET['bibliotecario']);
      $leitor = chk($_GET['leitor']);
      $obra = chk($_GET['obra']);
      $exemplar = chk($_GET['exemplar']);
      $comentario = chk($_GET['comentario']);
      // preparação do sql conforme requisição
      if ($_GET['action'] == 'UPDATE') {
        $sql = <<<EOT
  PRAGMA foreign_keys = ON;
  PRAGMA recursive_triggers = ON;
  UPDATE emprestimos_facil SET
    bibliotecario=$bibliotecario,
    data_emprestimo=$data_emprestimo,
    data_devolucao=$data_devolucao,
    leitor=$leitor,
    obra=$obra,
    exemplar=$exemplar
  WHERE rowid == {$_GET['recnumber']};
EOT;
      } else {
        $sql = <<<EOT
  PRAGMA foreign_keys = ON;
  PRAGMA recursive_triggers = ON;
  INSERT INTO emprestimos_facil (bibliotecario, data_emprestimo,
    data_devolucao, leitor, obra, exemplar)
    SELECT $bibliotecario, $data_emprestimo, $data_devolucao, $leitor, $obra,
      $exemplar;
EOT;
      }
      // tenta executar a requisição
      if ($db->exec($sql)) {
        if (rebuildTable($db)) {
          // requisita o número de ordem do registro recém atualizado/inserido
          $d = toISOdate(
            substr($data_emprestimo, 1, strlen($data_emprestimo)-2));
          $sql = <<<EOT
  SELECT rowid
  FROM emprestimos_facil
  WHERE
    --> comparação "nixtime" de datas ISO-8601
    strftime("%s", substr(data_emprestimo, 7, 4) || "-"
      || substr(data_emprestimo, 4, 2) || "-"
      || substr(data_emprestimo, 1, 2)
      || substr(data_emprestimo, 11)) == strftime("%s", "$d")
    AND leitor == $leitor AND obra == $obra AND exemplar == $exemplar;
EOT;
          echo $db->querySingle($sql);
        } else {
          echo "1";
        }
      } else {
        echo 'Error: '.$db->lastErrorMsg();
      }
      break;

    case 'DELETE':
      $sql = <<<EOT
  PRAGMA foreign_keys = ON;
  DELETE FROM emprestimos WHERE rowid = {$_GET['recnumber']};
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
        array('data_emprestimo', 'data_devolucao', 'bibliotecario', 'leitor',
          'obra', 'exemplar', 'comentario'));
      $text = '';
      // requisita a pesquisa se a montagem foi bem sucedida
      if (count($constraints) > 0) {
        $restricoes = join(' AND ', $constraints);
        // montagem do sql da pesquisa
        $sql = <<<EOT
  SELECT rowid, data_emprestimo, data_devolucao, bibliotecario, leitor, obra,
    autor, exemplar, posicao, comentario
  FROM emprestimos_facil
  WHERE $restricoes ORDER BY rowid;
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
          $text = "Advertência: Não há dados que satisfaçam a requisição:\n$sql";
        }
      } else {
        $text = 'Advertência: Parâmetros insuficientes para montagem das restrições de pesquisa.';
      }
      echo $text;
      break;
  }

  $db->close();

?>