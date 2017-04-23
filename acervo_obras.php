<?php

  /** Este script é parte do projeto LUX. */

  require 'utils.php';

  try {
    $db = new SQLitePDO();
    $db->connect();
  } catch(PDOException $e) {
    die($e->getMessage());
  }

  switch ($_GET['action']) {

    case 'GETALL':
      $sql =<<<EOT
   SELECT DISTINCT obra, titulo
   FROM disponiveis_acervo JOIN obras ON obra is code
   ORDER BY titulo ASC;
EOT;
      break;

    case 'PESQUISA':
      $sql =<<<EOT
   SELECT DISTINCT obra, titulo
   FROM emprestimos JOIN obras ON obra IS code
   ORDER BY titulo ASC;
EOT;
      break;
  }

  $result = $db->query($sql);

  if ($result !== FALSE AND $row = $result->fetch(PDO::FETCH_NUM)) {
    echo '<option code="', $row[0], '">', $row[1], '</option>';
    while ($row = $result->fetch(PDO::FETCH_NUM))
      echo '<option code="', $row[0], '">', $row[1], '</option>';
  }

?>