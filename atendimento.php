<?php

  /** Este script é parte do projeto LUX. */

  require 'utils.php';

  try {
    $db = new SQLitePDO();
    $db->connect();
  } catch(PDOException $e) {
    die($e->getMessage());
  }

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
    try {
      $db->beginTransaction();
      $db->exec("PRAGMA foreign_keys=OFF;");
      $db->exec("DROP TRIGGER KASHITENAI;");
      $db->exec(<<<EOT
  CREATE TEMP TABLE t AS
    SELECT emprestimos.*
    FROM emprestimos
      JOIN leitores ON (emprestimos.leitor == leitores.code)
      JOIN obras ON (emprestimos.obra == obras.code)
    ORDER BY data_emprestimo, leitores.nome, obras.titulo;
EOT
      );
      $db->exec("DELETE FROM emprestimos;");
      $db->exec("INSERT INTO emprestimos_calc SELECT * FROM t;");
      $db->exec("REINDEX emprestimos;");
      $db->exec(<<<EOT
--
-- check-up sequencial das restrições de empréstimo nas inserções
--
CREATE TRIGGER KASHITENAI BEFORE INSERT ON emprestimos
BEGIN
  SELECT CASE
  WHEN EXISTS(
      SELECT 1 FROM emprestimos
      WHERE data_devolucao ISNULL AND leitor IS new.leitor
        AND data_limite < date("now", "localtime")
    )
    THEN raise(ABORT, "O leitor tem ao menos 1 empréstimo em atraso")
  WHEN EXISTS(
      SELECT 1 FROM emprestimos
      WHERE data_devolucao ISNULL AND leitor IS new.leitor
        AND obra IS new.obra
    )
    THEN raise(ABORT, "O leitor não pode emprestar mais de um exemplar da mesma obra")
  WHEN EXISTS(
      SELECT 1 FROM emprestimos
      WHERE data_devolucao ISNULL
        AND obra IS new.obra AND exemplar IS new.exemplar
    )
    THEN raise(ABORT, "O exemplar requisitado já está emprestado")
  WHEN (
      SELECT count(1) >= pendencias
      FROM config, emprestimos
      WHERE data_devolucao ISNULL AND leitor IS new.leitor
    )
    THEN raise(ABORT, "O leitor não pode exceder a quantidade máxima de empréstimos pendentes")
  WHEN (
      SELECT (M > 0) AND (N > 0) AND (M == N)
      FROM (
          SELECT count(1) AS M FROM acervo WHERE obra IS new.obra
        ), (
          SELECT count(1) AS N FROM emprestimos
          WHERE data_devolucao ISNULL AND obra IS new.obra
        )
    )
    THEN raise(ABORT, "Todos os exemplares da obra estão emprestados")
  END;
END;
EOT
      );
      $db->exec("PRAGMA foreign_keys=ON;");
      $db->commit();
      return TRUE;
    } catch (Exception $e) {
      $db->rollBack();
      $handle = fopen("/home/sergio/Projects/lux/datum/error.txt", 'wb');
      fwrite($handle, "Failed: ".$e->getMessage());
      fclose($handle);
      return FALSE;
    }
  }

  switch ($_GET['action']) {

    case 'GETREC':
      $result = $db->query(<<<EOT
  SELECT bibliotecario, data_emprestimo, data_devolucao, leitor, obra,
    autor, exemplar, posicao, comentario
  FROM emprestimos_facil
  WHERE rowid == {$_GET['recnumber']}
EOT
      );
      echo join('|', $result->fetch(PDO::FETCH_NUM));
      break;

    case 'COUNT':
      echo $db->querySingle('SELECT count() FROM emprestimos');
      break;

    case 'INSERT':
    case 'UPDATE':
      //$handle = fopen("/home/sergio/Projects/lux/datum/saida.txt", 'wb');
      $bibliotecario = chk($_GET['bibliotecario']);
      $data_emprestimo = chk(normalize($_GET['data_emprestimo']));
      $data_devolucao = chk(normalize($_GET['data_devolucao']));
      $leitor = chk($_GET['leitor']);
      $obra = chk($_GET['obra']);
      $exemplar = chk($_GET['exemplar']);
      // preparação do sql conforme tipo de requisição
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
      //fwrite($handle, "$sql\n\n");
      // requisita a atualização ou inserção
      if ($db->exec($sql) === FALSE) {
        echo 'Error: ', $db->lastErrorMsg();
      } else {
        //fwrite($handle, "Rebuild\n\n");
        if (rebuildTable($db) === TRUE) {
          // requisita o número de ordem do registro recém atualizado/inserido
          $d = substr($data_emprestimo, 1, 10);
          $sql = <<<EOT
  SELECT rowid
  FROM emprestimos_facil
  WHERE substr(data_emprestimo, 1, 10) == "$d"
    AND leitor == $leitor AND obra == $obra; -- AND exemplar == $exemplar;
EOT;
          //fwrite($handle, $sql);
          echo $db->querySingle($sql);
        } else {
          echo '1';
        }
      }
      //fclose($handle);
      break;

    case 'DELETE':
      $sql = <<<EOT
  PRAGMA foreign_keys = ON;
  DELETE FROM emprestimos WHERE rowid = {$_GET['recnumber']};
EOT;
      if ($db->exec($sql) === FALSE) {
        echo 'Error: ', $db->lastErrorMsg();
      } else {
        rebuildTable($db);
        echo 'TRUE';
      }
      break;

    case 'SEARCH':
      $constraints = buildConstraints(
        array('data_emprestimo', 'data_devolucao', 'bibliotecario', 'leitor',
          'obra', 'autor', 'exemplar', 'posicao', 'comentario'));
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
  }

?>