<?php

  require 'utils.php';

  $db = new SQLite3(DB_FILENAME) or die('Unable to open database');

  if (empty($_GET)) {
    echo $db->querySingle('SELECT count() FROM autores');
  } else {
    $recnumber = $_GET['recnumber'];
    switch (substr($recnumber, 0, 1)) {
      case 'U':
        $db->exec('PRAGMA foreign_keys = ON');
        $db->exec('PRAGMA recursive_triggers = ON');
        $sql = 'UPDATE autores SET code="'.$_GET['code']
          .'", nome="'.$_GET['nome'].'", espirito="'.$_GET['espirito']
          .'" WHERE rowid == '.substr($recnumber, 1);
        if ($db->exec($sql)) {
          echo 'atualização bem sucedida';
        } else {
          echo 'atualização mal sucedida';
        }
        break;
      case 'N':
        echo "insert $recnumber";
        break;
      case 'D':
        echo "delete $recnumber";
        break;
      default:
        $result = $db->query(
          "SELECT * FROM autores WHERE rowid == $recnumber");
        echo join('|', $result->fetchArray(SQLITE3_NUM));
    }
  }

  $db->close();

?>