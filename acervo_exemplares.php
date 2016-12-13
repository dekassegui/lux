<?php

  /**
   * Este script é parte do projeto LUX :: Código aberto em Domínio Público.
  */

  require 'utils.php';

  $db = new SQLite3(DB_FILENAME) or die('Unable to open database');

  $text = '';
  $result = $db->query(<<<EOT
   SELECT DISTINCT exemplar, exemplar
   FROM acervo
EOT
    );
  if ($row = $result->fetchArray(SQLITE3_NUM)) {
    $text .= join('|', $row);
    while ($row = $result->fetchArray(SQLITE3_NUM)) {
      $text .= "\n".join('|', $row);
    }
  }
  echo $text;

  $db->close();

?>