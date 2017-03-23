<?php

  /** Este script é parte do projeto LUX. */

  require 'utils.php';

  try {
    $db = new SQLitePDO();
    $db->connect();
  } catch(PDOException $e) {
    die($e->getMessage());
  }

  $result = $db->query(<<<EOT
   SELECT DISTINCT acervo.obra || '|' || obras.titulo
   FROM acervo JOIN obras ON acervo.obra == obras.code
EOT
    );
  if ($result !== FALSE AND $row = $result->fetchcolumn()) {
    echo $row;
    while ($row = $result->fetchColumn()) echo PHP_EOL, $row;
  }

?>