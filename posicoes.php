<?php

  /**
   * Satisfaz a requisição de dados para preenchimento do datalist associado
   * ao input de posição de livro no formulário da tabela acervo.
  */

  //if ($_GET['action'] == 'GETALL') {
    $text = '';
    $m = 0;
    foreach (array('A', 'B', 'C') as $x)
    {
      for ($n=1; $n<7; ++$n)
      {
        if ($m++ > 0) $text .= "\n";
        $code = $x.$n;
        $text .= "$code|$code";
      }
    }
    echo $text;
  //}

?>