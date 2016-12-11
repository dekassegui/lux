<?php

  if ($_GET['action'] == 'GETALL') {
    $text = '';
    $m = 0;
    foreach (array('A', 'B', 'C') as $prateleira)
    {
      for ($n=1; $n<7; ++$n)
      {
        if ($m++ > 0) $text .= "\n";
        $code = $prateleira.$n;
        $text .= "$code|$code";
      }
    }
    echo $text;
  }

?>