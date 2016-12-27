<?php

  /**
   * Este script é parte do projeto LUX :: Código aberto em Domínio Público.
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
      // requisita parâmetros para cálculo da data limite de empréstimo
      $result = $db->query('SELECT dayNumber, allowed, surrogate FROM weekdays;');
      while ($row = $result->fetchArray(SQLITE3_NUM)) {
        $text .= "\n".join('|', $row);
      }
      echo $text;
      break;

    case 'SAVEREC':
      $prazo = sprintf('+%02d days', $_GET['prazo']);
      $pendencias = $_GET['pendencias'];
      $sql = "UPDATE config SET prazo='$prazo', pendencias=$pendencias;";
      if (!$db->exec($sql)) {
        echo 'Error: '.$db->lastErrorMsg();
        break;
      }

      $dias = array(0 => 'domingo', 1 => 'segunda', 2 => 'terça', 3 => 'quarta', 4 => 'quinta', 5 => 'sexta', 6 => 'sábado');

      for ($ndx = 0; $ndx < 7; ++$ndx)
      {
        $varname = "weekday$ndx";
        $datum = aexplode('|', $_GET[$varname], ['dayName', 'allowed', 'surrogate']);
        $surrogate = array_search($datum['surrogate'], $dias);
        $sql = 'UPDATE weekdays SET allowed='.$datum['allowed'].', surrogate='
          .$surrogate.' WHERE dayName == "'.$datum['dayName'].'";';
        if (!$db->exec($sql)) {
          echo 'Error: '.$db->lastErrorMsg();
          break;
        }
      }
      echo 'Sucesso!';
      break;

  }

  $db->close();

?>