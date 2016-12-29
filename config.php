<?php

  /**
   * Este script é parte do projeto LUX :: Código aberto em Domínio Público.
  */

  /**
   * Pesquisa valor do tipo Integer no único argumento do tipo String.
   *
   * @param $s String objeto da pesquisa.
   * @return String representando Integer identificado na pesquisa, senão ZERO.
  */
  function int($s) {
    return ($a=preg_replace('/[^\-\d]*(\-?\d*).*/','$1', $s)) ? $a: '0';
  }

  require 'utils.php';

  $db = new SQLite3(DB_FILENAME) or die('Unable to open database');

  switch ($_GET['action']) {

    case 'GETREC':

      // requisita parâmetros dos empréstimos
      $result = $db->query('SELECT prazo, pendencias FROM config;');
      $values = $result->fetchArray(SQLITE3_NUM);
      $text = int($values[0]).'|'.$values[1];

      // requisita parâmetros para cálculos de datas limite de empréstimo
      $result = $db->query(
        'SELECT dayNumber, allowed, surrogate FROM weekdays;');
      while ($row = $result->fetchArray(SQLITE3_NUM)) {
        $text .= "\n".join('|', $row);
      }

      echo $text;
      break;

    case 'UPDATE':

      // -- Atualização do único registro da tabela 'config'.

      if (isset($_GET['CFG'])) {
        $datum = aexplode('|', $_GET['CFG'], ['prazo', 'pendencias']);
        // formata o valor da coluna 'prazo' conforme usado na tabela
        $sql = 'UPDATE config SET prazo="'
          .sprintf('+%02d days', $datum['prazo'])
          .'", pendencias='.$datum['pendencias'];
      }

      if (!isset($sql) || $db->exec($sql)) {

        // -- Atualização dos 7 (sete) registros da tabela 'weekdays'.

        for ($numeroDia=0; ($numeroDia < 7) && !isset($_GET["DIA$numeroDia"]);
             ++$numeroDia);

        if ($numeroDia < 7) {

          // 'prepared statement' para atualização dos registros
          $sql = "UPDATE weekdays SET allowed=:allowed, surrogate=:surrogate
                  WHERE dayNumber == :dayNumber";

          if ($statement = $db->prepare($sql)) {

            // nomes das colunas envolvidas na atualização, na ordem de
            // montagem da string de parâmetros enviada pelo script cliente
            $fields = array('dayNumber', 'allowed', 'surrogate');

            $ok = true;   // status esperado ao final das iterações

            for ($numeroDia=0, $n=0; $ok AND ($numeroDia < 7); ++$numeroDia) {

              if (!isset($_GET["DIA$numeroDia"])) continue;

              // reinicia o 'prepared statement' a partir da segunda iteração
              if (++$n > 1) $statement->reset();

              // extrai os valores das colunas envolvidas na atualização
              $datum = aexplode('|', $_GET["DIA$numeroDia"], $fields);

              foreach ($fields as $f)
                $statement->bindValue(":$f", $datum["$f"], SQLITE3_INTEGER);

              if ($statement->execute() === FALSE) {
                $ok = false;
                echo 'Error 03: '.$db->lastErrorMsg()."\nDBG > $numeroDia";
              }

            }

            $statement->close();  // libera memória utilizada

            if ($ok) echo 'Atualização bem sucedida!';

          } else {

            echo 'Error 02: '.$db->lastErrorMsg();

          }

        } else {

          if (isset($_GET['CFG'])) {
            echo 'Atualização parcial bem sucedida!';
          } else {
            echo 'Nenhuma atualização realizada.';
          }

        }

      } else {

        echo 'Error 01: '.$db->lastErrorMsg();

      }

      break;

  }

  $db->close();

?>