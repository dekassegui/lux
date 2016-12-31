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

      // requisita parâmetros para cálculo dos empréstimos e datas limite
      $result = $db->query('SELECT prazo, pendencias, weekdays FROM config;');
      $values = $result->fetchArray(SQLITE3_NUM);
      echo int($values[0]).'|'.$values[1].'|'.$values[2];
      break;

    case 'UPDATE':

      // -- Atualização do único registro da tabela 'config'.

      $datum = aexplode('|', $_GET['CFG'], ['prazo', 'pendencias', 'weekdays']);

      $sql = 'UPDATE config SET prazo="'        // formata o valor de 'prazo'
        .sprintf('+%02d days', $datum['prazo']) // conforme usado na tabela
        .'", pendencias='.$datum['pendencias']
        .', weekdays='.$datum['weekdays'];

      if ($db->exec($sql)) {
        echo 'Atualização bem sucedida!';
      } else {
        echo 'Error: '.$db->lastErrorMsg();
      }

      break;

  }

  $db->close();

?>