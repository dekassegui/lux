<?php

  require 'utils.php';

  /**
   * Testa se o argumento do tipo String contém apenas espaços em branco.
   *
   * @param $text String objeto da verificação.
   * @return NULL se $text contém apenas espaços em branco senão retorna a
   *         retorna com haspas simples
  */
  function chk($text) {
    return strlen(trim($text)) == 0 ? 'NULL' : "'".$text."'";
  }

  $db = new SQLite3(DB_FILENAME) or die('Unable to open database');

  function sortDB($db) {
    $db->exec('CREATE TEMP TABLE t AS SELECT * FROM autores ORDER BY nome, espirito');
    $db->exec('PRAGMA foreign_keys = OFF');
    $db->exec('DELETE FROM autores');
    $db->exec('INSERT INTO autores SELECT * FROM t');
    $db->exec('REINDEX autores_ndx');
    $db->exec('PRAGMA foreign_keys = ON');
    $db->exec('DROP TABLE t');
    $db->exec('VACUUM');
  }

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
      $code = chk($_GET['code']);
      $nome = chk($_GET['nome']);
      $espirito = chk($_GET['espirito']);
      $sql = "UPDATE autores SET code=$code, nome=$nome, espirito=$espirito WHERE rowid == ".$_GET['recnumber'];
      $db->exec('PRAGMA foreign_keys = ON');
      $db->exec('PRAGMA recursive_triggers = ON');
      if ($db->exec($sql)) {
        sortDB($db);
        $sql = "SELECT rowid FROM autores WHERE code == $code";
        echo $db->querySingle($sql);
      } else {
        echo 'FALSE';
      }
      break;

    case 'INSERT':
      $code = chk($_GET['code']);
      $nome = chk($_GET['nome']);
      $espirito = chk($_GET['espirito']);
      $sql = "INSERT INTO autores SELECT $code, $nome, $espirito";
      $db->exec('PRAGMA foreign_keys = ON');
      $db->exec('PRAGMA recursive_triggers = ON');
      if ($db->exec($sql)) {
        sortDB($db);
        $sql = "SELECT rowid FROM autores WHERE code == $code";
        echo $db->querySingle($sql);
      } else {
        echo 'FALSE';
      }
      break;

    case 'DELETE':
      $sql = 'DELETE FROM autores WHERE rowid = '.$_GET['recnumber'];
      $db->exec('PRAGMA foreign_keys = ON');
      if ($db->exec($sql)) {
        sortDB($db);
        echo 'TRUE';
      } else {
        echo 'FALSE';
      }
      break;

    case 'SEARCH':
      $sql = '';
      $needle = trim($_GET['code']);
      if (strlen($needle) > 0) {
        $sql .= 'code GLOB "'.$needle.'"';
      }
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
      $text = '';
      if (strlen($sql) > 0) {
        $result = $db->query('SELECT rowid, * FROM autores WHERE '.$sql);
        if ($row = $result->fetchArray(SQLITE3_NUM)) {
          $text = join('|', $row);
          while ($row = $result->fetchArray(SQLITE3_NUM)) {
            $text .= "\n".join('|', $row);
          }
        }
      }
      echo $text;
      break;
  }

  $db->close();

?>