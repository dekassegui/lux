<?php

  /**
   * Este script é parte do projeto LUX :: Código aberto em Domínio Público.
  */

  require 'utils.php';

  $db = new SQLite3(DB_FILENAME) or die('Unable to open database');

  switch ($_GET['action']) {

    case 'GETREC':

      // requisita parâmetros para cálculo dos empréstimos e datas limite
      $result = $db->query(
        'SELECT prazo, pendencias, weekdays FROM config_facil;');
      $values = $result->fetchArray(SQLITE3_NUM);
      echo $values[0].'|'.$values[1].'|'.$values[2];
      break;

    case 'UPDATE':

      $fields = array('prazo', 'pendencias', 'weekdays');

      $buffer = '';
      foreach (aexplode('|', $_GET['CFG'], $fields) as $parName=>$value)
      {
        if (strlen($buffer) > 0) $buffer .= "\n\n";

        if ($db->exec("UPDATE config_facil SET $parName=".$value))
        {
          $buffer .= "Parâmetro \"$parName\" atualizado com sucesso.";
        } else {
          $buffer .= 'Erro: '.$db->lastErrorMsg();
        }
      }
      echo $buffer;
      break;

  }

  $db->close();

?>