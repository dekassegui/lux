<?php

  /** Este script é parte do projeto LUX. */

  /**
   * Satisfaz a requisição de dados para preenchimento do datalist associado
   * ao input de posição de livro no formulário da tabela 'acervo'.
  */

  foreach (array('A', 'B', 'C') as $x)
  {
    for ($n=1; $n<7; ++$n)
    {
      $code = $x.$n;
      echo '<option code="', $code, '">', $code, '</option>';
    }
  }

?>