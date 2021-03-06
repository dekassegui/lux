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

  $numRecs = $m = $db->querySingle('SELECT count(distinct titulo) FROM exemplares_disponiveis');

  $recsPerPage = 10;

  $numPages = ceil($numRecs / $recsPerPage);

  $pagina = (isset($_GET['pagina']) && is_numeric($_GET['pagina'])) ?
            ((max(1, $_GET['pagina']) - 1) % $numPages) + 1 : 1;

  $inicio = ($pagina - 1) * $recsPerPage;

  echo '<tr><td>#Títulos:</td><td>', $m, '</td></tr>', PHP_EOL;
  echo '</table>', PHP_EOL;

  echo '<div>', PHP_EOL;
  $sql = <<<EOT
SELECT books.titulo AS titulo, autores, posicao, generos.nome AS genero,
  group_concat(exemplar, ", ") AS exemplares
FROM disponiveis_acervo JOIN (
    SELECT * FROM obras ORDER BY titulo COLLATE portuguese ASC
  ) AS books ON books.code == disponiveis_acervo.obra
  JOIN scribas ON scribas.code == books.autor
  JOIN generos ON generos.code == books.genero
GROUP BY books.titulo ORDER BY books.titulo COLLATE portuguese ASC
LIMIT
  $recsPerPage
OFFSET
  $inicio;
EOT;

  $recno = $inicio;

  $result = $db->query($sql);
  while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
    echo '<table>', PHP_EOL;
    echo '  <tr><td>Número:</td><td>', ++$recno, '</td></tr>', PHP_EOL;
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

  echo "\t", '<p id="pager">';
  $a = '<a href="'.$_SERVER['PHP_SELF'].'?pagina=';
  $c = ($pagina == 1) ? '<span>&#xf053;</span>'
       : $a.($pagina-1).'" title="página anterior">&#xf053;</a>';
  echo $c;
  for ($i=1; $i <= $numPages; ++$i) {
    $c = ($i == $pagina) ? "<span>$i</span>" : $a.$i.'">'."$i</a>";
    echo $c;
  }
  $c = ($pagina == $numPages) ? '<span>&#xf054;</span>'
       : $a.($pagina+1).'" title="próxima página">&#xf054;</a>';
  echo $c, '</p>';

  echo '</div>', PHP_EOL;

?>
  </section>

  <footer>
    <p>Software Livre para<br>bibliotecas de casas Espíritas.</p>
  </footer>

</body>
</html>
