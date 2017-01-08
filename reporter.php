<?php

  /**
   * Este script é parte do projeto LUX :: Código aberto em Domínio Público.
  */

  require 'utils.php';

  // $db = new SQLite3(DB_FILENAME) or die('Unable to open database');

  switch ($_GET['action']) {

    case 'INFO':

      $sql = 'SELECT * from emprestimos_facil';


      echo "Em construção.";
      break;

    case 'LEITOR':

      echo "Em construção.";
      break;

  }

  // $db->close();

?>