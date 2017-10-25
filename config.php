<?php

  /** Este script é parte do projeto LUX. */

  require 'utils.php';

  define('EASYQUERY', 'SELECT pendencias, prazo, weekdays FROM config_facil');

  function translate($s) {
    if (strpos($s, 'weekdays_chk') !== FALSE) {
      return 'Não haveria dia da semana para atendimento ao público.';
    }
    return $s;
  }

  try {
    $db = new SQLitePDO();
    $db->connect();
  } catch(PDOException $e) {
    die($e->getMessage());
  }

  switch ($_GET['action']) {

    case 'GETREC':

      // requisita parâmetros para cálculo dos empréstimos e datas limite
      $result = $db->query(EASYQUERY);
      $values = $result->fetch(PDO::FETCH_NUM);
      echo $values[0], '|', $values[1], '|', $values[2];
      break;

    case 'UPDATE':

      $fields = array('pendencias', 'prazo', 'weekdays');

      $result = $db->query(EASYQUERY);
      $current = $result->fetch(PDO::FETCH_ASSOC);

      $buffer = array();
      foreach (aexplode('|', $_GET['CFG'], $fields) as $parName=>$value)
      {
        if ($current[$parName] == $value) continue;

        if ($db->exec("UPDATE config_facil SET $parName=".$value) === FALSE) {

          $buffer[] = "Erro ao atualizar '$parName': "
            .translate($db->lastErrorMsg());

        } else {

          $buffer[] = "Parâmetro '$parName' atualizado com sucesso.";

        }
      }
      echo join(PHP_EOL, $buffer);
      break;

    case 'UPDATE_DAYOFFS':

      $ano_corrente = date('Y');
      $db->querySingle("INSERT INTO _feriados SELECT ano, null FROM (SELECT $ano_corrente AS ano UNION SELECT $ano_corrente+1 AS ano)");

      break;

  }

?>