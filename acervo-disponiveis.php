<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Lux - Acervo - Exemplares Disponíveis</title>
<meta http-equiv="expires" content="0"/>
<meta http-equiv="pragma" content="no-cache"/>
<link href="css/reset.css" rel="stylesheet" type="text/css" media="screen">
<link href="css/comum.css" rel="stylesheet" type="text/css" media="screen">
<link href="css/reporter.css" rel="stylesheet" type="text/css" media="screen">
<!-- <link href="css/autores.css" rel="stylesheet" type="text/css" media="screen">
<link href="js/sweet-alert/sweetalert.css" rel="stylesheet" type="text/css">
<link href="js/sweet-alert/custom.css" rel="stylesheet" type="text/css">
<script type="text/javascript" src="js/utils.js"></script>
<script type="text/javascript" src="js/comum.js"></script>
<script type="text/javascript" src="js/obras.js"></script>
<script src="js/jquery-3.1.1.js"></script>
<script src="js/sweet-alert/sweetalert.min.js"></script> -->
</head>
<body>

  <header>
    <h1>Lux - Acervo - Exemplares disponíveis</h1>
  </header>

  <section>
<?php

  require 'utils.php';

  try {
    $db = new SQLitePDO();
    $db->connect();
  } catch(PDOException $e) {
    die($e->getMessage());
  }

  $n = $db->querySingle('SELECT count(1) FROM exemplares_disponiveis');
  echo '<p><span>#Exemplares:</span> ', $n, '</p>', PHP_EOL;

  if ($n > 0) {
    $sql = 'SELECT count(distinct titulo) FROM exemplares_disponiveis';
    $m = $db->querySingle($sql);
    echo '<p><span>#Títulos:</span> ', $m, '</p>', PHP_EOL;

    $sql = <<<EOT
  SELECT titulo, autores, genero,
    group_concat(quote(exemplar), ", ") AS exemplares, posicao
  FROM exemplares_disponiveis
  GROUP BY titulo;
EOT;
    $result = $db->query($sql);
    while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
      echo PHP_EOL, '<div>', PHP_EOL;
      echo '  <p><span>Título:</span> ', $row['titulo'], '</p>', PHP_EOL;
      echo '  <p><span>Autor&amp;Espírito:</span> ', $row['autores'], '</p>', PHP_EOL;
      echo '  <p><span>Gênero:</span> ', $row['genero'], '</p>', PHP_EOL;
      $n = strrpos($row['exemplares'], ',');
      echo '  <p><span>';
      if ($n === FALSE) {
        echo 'Exemplar:</span> ', $row['exemplares'];
      } else {
        echo 'Exemplares:</span> ',
          substr($row['exemplares'], 0, $n), ' e',
          substr($row['exemplares'], $n+1);
      }
      echo '</p>', PHP_EOL;
      echo '  <p><span>Posição:</span> ', $row['posicao'], '</p>', PHP_EOL;
      echo '</div>', PHP_EOL;
    }
  }

  // define "locale" para português do Brasil
  setlocale(LC_ALL, 'pt_BR', 'pt_BR.utf-8', 'pt_BR.iso-8859-1', 'portuguese');

  $d = explode('|', strftime('%A %d-%m-%Y %H:%M|%z'));

  printf('<p class="date"><span>Emissão:</span> %s %s</p>'.PHP_EOL,
    ucfirst($d[0]), $d[1] == '-0300' ? 'BRT' : 'BRST');

?>
  </section>

  <footer>
    <p>Software Livre para<br>bibliotecas de casas Espíritas.</p>
  </footer>

</body>
</html>
