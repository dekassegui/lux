<?php

  /** Este script é parte do projeto LUX. */

  require 'utils.php';

  try {
    $db = new SQLitePDO();
    $db->connect();
  } catch(PDOException $e) {
    die($e->getMessage());
  }

  if (isset($_GET['code'])) {

    $sql = <<<EOT
  SELECT autor || "|" || posicao FROM acervo_facil
  WHERE code IS "{$_GET['code']}"
EOT;
    $result = $db->query($sql);
    if ($result !== FALSE AND $row = $result->fetchColumn()) {
      echo $row, PHP_EOL;
    }

    $sql = <<<EOT
  SELECT exemplar || "|" || exemplar FROM disponiveis_acervo
  WHERE obra == "{$_GET['code']}"
EOT;

  } else {

    $sql = 'SELECT DISTINCT exemplar || "|" || exemplar FROM acervo';

  }

  $result = $db->query($sql);
  if ($result !== FALSE AND $row = $result->fetchColumn()) {
    echo $row;
    while ($row = $result->fetchColumn()) echo PHP_EOL, $row;
  }

?>