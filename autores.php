<?php

  require 'utils.php';

  /**
   * Testa se o argumento do tipo String contém apenas espaços em branco.
   *
   * @param text String objeto da verificação.
   * @return NULL se text contém apenas espaços em branco.
  */
  function chk($text) {
    return trim($text) == '' ? 'NULL' : $text;
  }

  $db = new SQLite3(DB_FILENAME) or die('Unable to open database');

  switch ($_GET['action']) {

    case 'GETREC':
      $result = $db->query(
        'SELECT * FROM autores WHERE rowid == '.$_GET['recnumber']);
      echo join('|', $result->fetchArray(SQLITE3_NUM));
      break;

    case 'COUNT':
      echo $db->querySingle('SELECT count() FROM autores');
      break;

    case 'UPDATE':
      $sql = 'UPDATE autores SET code="'.$_GET['code']
        .'", nome="'.$_GET['nome'].'", espirito="'.chk($_GET['espirito'])
        .'" WHERE rowid == '.$_GET['recnumber'];
      $db->exec('PRAGMA foreign_keys = ON');
      $db->exec('PRAGMA recursive_triggers = ON');
      if ($db->exec($sql)) {
        echo 'Atualização bem sucedida.';
      } else {
        echo 'Atualização mal sucedida.';
      }
      break;

    case 'INSERT':
      $sql = 'INSERT INTO autores VALUES ("'.$_GET['code'].'", "'
                .$_GET['nome'].'", "'.chk($_GET['espirito']).'")';
      $db->exec('PRAGMA foreign_keys = ON');
      $db->exec('PRAGMA recursive_triggers = ON');
      if ($db->exec($sql)) {
        echo 'TRUE';
      } else {
        echo 'Inserção mal sucedida.';
      }
      break;

    case 'DELETE':
      $sql = 'DELETE FROM autores WHERE rowid = '.$_GET['recnumber'];
      $db->exec('PRAGMA foreign_keys = ON');
      if ($db->exec($sql)) {
        echo 'TRUE';
      } else {
        echo 'Exclusão mal sucedida.';
      }
      break;

    case 'SEARCH':
      $sql = '';
      $needle = trim($_GET['code']);
      if (strlen($needle) > 0) $sql .= 'code GLOB "'.$needle.'"';
      $needle = trim($_GET['nome']);
      if (strlen($needle) > 0) {
        if (strlen($sql) > 0) $sql .= ' OR ';
        $sql .= 'nome GLOB "'.$needle.'"';
      }
      $needle = trim($_GET['espirito']);
      if (strlen($needle) > 0) {
        if (strlen($sql) > 0) $sql .= ' OR ';
        $sql .= 'espirito GLOB "'.$needle.'"';
      }
      if (strlen($sql) == 0) {
        echo 'Pesquisa requisitada é desnecessária.'.$_GET['nome'];
      } else {
        $result = $db->query('SELECT * FROM autores WHERE '.$sql);
        $text = '';
        while ($row = $result->fetchArray(SQLITE3_NUM)) {
          $text .= join('|', $row)."\n";
        }
        echo $text;
      }
      break;
  }

  $db->close();

?>