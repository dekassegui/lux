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
    if ($result !== FALSE AND $row = $result->fetchColumn()) echo $row, '|';

    $sql = <<<EOT
  SELECT '<option code="' || exemplar || '">' || exemplar || '</option>'
  FROM disponiveis_acervo
  WHERE obra == "{$_GET['code']}"
EOT;

  } else if (isset($_GET['titulo'])) {

    $sql = <<<EOT
  SELECT '<option code="' || exemplar || '">' || exemplar || '</option>'
  FROM disponiveis_acervo
  WHERE obra == (SELECT code FROM obras WHERE titulo == "{$_GET['titulo']}")
EOT;

  } else {

    $sql = <<<EOT
  SELECT '<option code="' || exemplar || '">' || exemplar || '</option>'
  FROM (SELECT DISTINCT exemplar FROM acervo)
EOT;

  }

  $result = $db->query($sql);
  if ($result !== FALSE)
    while ($row = $result->fetchColumn()) echo $row;

?>