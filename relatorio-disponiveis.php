<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Lux - Acervo - Exemplares Disponíveis</title>
<meta http-equiv="expires" content="0"/>
<meta http-equiv="pragma" content="no-cache"/>
<link href="css/reset.css" rel="stylesheet" type="text/css" media="screen">
<link href="css/comum.css" rel="stylesheet" type="text/css" media="screen">
<link href="css/relatorio.css" rel="stylesheet" type="text/css" media="screen">
<script src="js/jquery-3.1.1.js"></script>
<script src="js/jquery.scrollTo.min.js"></script>
<script src="js/relatorio.js"></script>
</head>
<body>

  <header>
    <h1>Lux - Acervo - Exemplares disponíveis</h1>
  </header>

  <section>

    <h2>Exemplares disponíveis</h2>

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

  $n = $db->querySingle('SELECT count(1) FROM exemplares_disponiveis');
  echo '<tr><td>#Exemplares:</td><td>', $n, '</td></tr>', PHP_EOL;

  if ($n == 0) {
    echo '</table>', PHP_EOL;
    exit(0);
  }

  $sql = 'SELECT count(distinct titulo) FROM exemplares_disponiveis';
  $m = $db->querySingle($sql);
  echo '<tr><td>#Títulos:</td><td>', $m, '</td></tr>', PHP_EOL;
  echo '</table>', PHP_EOL;

  echo '<div>', PHP_EOL;
  $sql = <<<EOT
  SELECT titulo, autores, genero,
    group_concat(quote(exemplar), ", ") AS exemplares, posicao
  FROM exemplares_disponiveis
  GROUP BY titulo;
EOT;
  $result = $db->query($sql);
  while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
    echo '<table>', PHP_EOL;
    echo '  <tr><td>Título:</td><td>', $row['titulo'], '</td></tr>', PHP_EOL;
    echo '  <tr><td>Autor&amp;Espírito:</td><td>', $row['autores'], '</td></tr>', PHP_EOL;
    echo '  <tr><td>Gênero:</td><td>', $row['genero'], '</td></tr>', PHP_EOL;
    $n = strrpos($row['exemplares'], ',');
    echo '  <tr><td>';
    if ($n === FALSE) {
      echo 'Exemplar:</td><td>', $row['exemplares'];
    } else {
      echo 'Exemplares:</td><td>';
      echo substr($row['exemplares'], 0, $n), ' e';
      echo substr($row['exemplares'], $n+1);
    }
    echo '</td></tr>', PHP_EOL;
    echo '  <tr><td>Posição:</td><td>', $row['posicao'], '</td></tr>', PHP_EOL;
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
