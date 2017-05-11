<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Lux - Acervo</title>
<meta http-equiv="expires" content="0"/>
<meta http-equiv="pragma" content="no-cache"/>
<link href="css/reset.css" rel="stylesheet" type="text/css" media="screen">
<link href="css/comum.css" rel="stylesheet" type="text/css" media="screen">
<link href="css/relatorio.css" rel="stylesheet" type="text/css" media="screen">
<script src="js/jquery.js"></script>
<script src="js/jquery.scrollTo.min.js"></script>
<script src="js/relatorio.js"></script>
</head>
<body>

  <header>
    <h1>Lux - Acervo</h1>
  </header>

  <section>

    <h2>Lux - Acervo</h2>

<?php

  require 'utils.php';

  try {
    $db = new SQLitePDO();
    $db->connect();
  } catch(PDOException $e) {
    die($e->getMessage());
  }

  setlocale(LC_ALL, 'pt_BR', 'pt_BR.utf-8', 'pt_BR.iso-8859-1', 'portuguese');

  $d = explode('|', strftime('%A %d-%m-%Y %H:%M|%z'));
  echo '<table>', PHP_EOL;
  echo '<tr><td>Emissão:</td><td>', ucfirst($d[0]), " ";
  echo ($d[1] == '-0300' ? 'BRT' : 'BRST'), '</td></tr>', PHP_EOL;

  $n = $db->querySingle('SELECT count(1) FROM acervo');
  echo '<tr><td>#Exemplares:</td><td>', $n, '</td></tr>', PHP_EOL;

  if ($n == 0) {
    echo '</table>', PHP_EOL;
    exit(0);
  }

  $sql = 'SELECT count(distinct obra) FROM acervo';
  $m = $db->querySingle($sql);
  echo '<tr><td>#Títulos:</td><td>', $m, '</td></tr>', PHP_EOL;

  $sql = 'SELECT count(1) FROM emprestimos WHERE data_devolucao ISNULL';
  $m = $db->querySingle($sql);
  echo '<tr><td>#Empréstimos:</td><td>', $m, '</td></tr>', PHP_EOL;

  echo '</table>', PHP_EOL;

  echo '<div>', PHP_EOL;
  $sql = <<<EOT
SELECT v.obra AS code, titulo, autores, generos.nome AS genero, exemplar, posicao, comentario, strftime("%d-%m-%Y", data_emprestimo) AS data_emprestimo, strftime("%d-%m-%Y", data_limite) AS data_limite
FROM (
  SELECT acervo.*, data_emprestimo, data_limite
  FROM acervo LEFT OUTER JOIN (
    SELECT obra, exemplar, DATE(data_emprestimo) AS data_emprestimo, data_limite
    FROM emprestimos WHERE data_devolucao ISNULL
  ) AS x ON (acervo.obra IS x.obra AND acervo.exemplar IS x.exemplar)
) AS v JOIN obras ON v.obra IS obras.code
  JOIN scribas ON obras.autor IS scribas.code
  JOIN generos ON obras.genero IS generos.code
ORDER BY titulo COLLATE portuguese ASC;
EOT;
  $result = $db->query($sql);
  while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
    echo '<table>', PHP_EOL;
    echo '  <tr><td>Código:</td><td>', $row['code'], '</td></tr>', PHP_EOL;
    echo '  <tr><td>Título:</td><td>', $row['titulo'], '</td></tr>', PHP_EOL;
    echo '  <tr><td>Autor&amp;Espírito:</td><td>', $row['autores'], '</td></tr>', PHP_EOL;
    echo '  <tr><td>Gênero:</td><td>', $row['genero'], '</td></tr>', PHP_EOL;
    echo '  <tr><td>Exemplar:</td><td>', $row['exemplar'],'</td></tr>', PHP_EOL;
    echo '  <tr><td>Posição:</td><td>', $row['posicao'], '</td></tr>', PHP_EOL;
    echo '  <tr><td>Comentário:</td><td>', $row['comentario'], '</td></tr>', PHP_EOL;
    if (strlen($row['data_emprestimo']) > 0) {
      echo '  <tr><td>Data Empréstimo:</td><td>', $row['data_emprestimo'], '</td></tr>', PHP_EOL;
      echo '  <tr><td>Data Limite:</td><td>', $row['data_limite'], '</td></tr>', PHP_EOL;
    }
    echo '</table>', PHP_EOL;
  }
  echo '</div>', PHP_EOL;

?>
  </section>

  <footer>
    <p>Software Livre para<br>bibliotecas de casas Espíritas.</p>
  </footer>

</body>
</html>
