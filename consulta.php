<?php

  require 'utils.php';

  $db = new SQLite3(DB_FILENAME) or die('Unable to open database');

  if (empty($_GET)) {
    echo $db->querySingle('SELECT count() FROM autores');
  } else {
    $result = $db->query(
      'SELECT * FROM autores WHERE rowid == '.$_GET['recnumber']);
    echo join('|', $result->fetchArray(SQLITE3_NUM));
  }

  $db->close();

?>