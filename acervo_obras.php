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
      // usa "toupper" - função "emprestada" do PHP - para que a sequência de
      // options HTML elements esteja alfabeticamente em ordem crescente,
      // indiferente ao letter case no DB, pois tais elements serão processados
      // numa busca binária via javascript :: restrição para desempenho ótimo
      $sql =<<<EOT
   SELECT DISTINCT obra, toupper(titulo) AS title
   FROM disponiveis_acervo JOIN obras ON obra IS code
   ORDER BY title ASC;
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

  if ($result !== FALSE)
    while ($row = $result->fetch(PDO::FETCH_NUM))
      echo '<option code="', $row[0], '">', $row[1], '</option>';

?>