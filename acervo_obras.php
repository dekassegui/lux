<?php

  /**
   * Este script é parte do projeto LUX :: Código aberto em Domínio Público.
  */

  require 'utils.php';

  try {
    $db = new SQLitePDO();
    $db->connect();
  } catch(PDOException $e) {
    die($e->getMessage());
  }

  $text = '';
  $result = $db->query(<<<EOT
   SELECT DISTINCT acervo.obra, obras.titulo
   FROM acervo JOIN obras ON acervo.obra == obras.code
EOT
    );
  if ($result !== FALSE AND $row = $result->fetch(PDO::FETCH_NUM)) {
    $text .= join('|', $row);
    while ($row = $result->fetch(PDO::FETCH_NUM)) {
      $text .= PHP_EOL.join('|', $row);
    }
  }
  echo $text;

?>