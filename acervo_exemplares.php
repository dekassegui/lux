<?php

  /**
   * Este script é parte do projeto LUX :: Código aberto em Domínio Público.
  */

  require 'utils.php';

  try {
    $db = new SQLitePDO();
    $db->connect(DB_FILENAME);
  } catch(PDOException $e) {
    die($e->getMessage());
  }

  if (isset($_GET['code'])) {

    $sql = <<<EOT
  SELECT exemplar, exemplar FROM disponiveis_acervo
  WHERE obra == "{$_GET['code']}"
EOT;

  } else {

    $sql = 'SELECT DISTINCT exemplar, exemplar FROM acervo';

  }

  $result = $db->query($sql);
  if ($result !== FALSE AND $row = $result->fetch(PDO::FETCH_NUM)) {
    echo join('|', $row);
    while ($row = $result->fetch(PDO::FETCH_NUM)) {
      echo PHP_EOL, join('|', $row);
    }
  }

?>