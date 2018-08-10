<?php

  /* Execute na linha de comando: php -f this_script.php */

  require 'utils.php';

  try {
    $db = new SQLitePDO();
    $db->connect();
  } catch(PDOException $e) {
    die($e->getMessage());
  }

  $sql =<<<EOT
    --
    -- REFORMA DAS TABELAS BÁSICAS PARA USO DE COLLATION PORTUGUESE DO PHP
    -- EXECUTADA MANUALMENTE
    --
    PRAGMA foreign_keys = OFF;
    BEGIN TRANSACTION;

    DROP TABLE IF EXISTS t;
    CREATE TEMP TABLE t AS SELECT * FROM autores;
    DELETE FROM autores;
    INSERT INTO autores
      SELECT * FROM t ORDER BY UPPER(nome) COLLATE portuguese, UPPER(espirito) COLLATE portuguese;

    DROP TABLE IF EXISTS t;
    CREATE TEMP TABLE t AS SELECT * FROM obras;
    DELETE FROM obras;
    INSERT INTO obras
      SELECT * FROM t ORDER BY UPPER(titulo) COLLATE portuguese;

    DROP TABLE IF EXISTS t;
    CREATE TEMP TABLE t AS SELECT * FROM acervo;
    DELETE FROM acervo;
    INSERT INTO acervo
      SELECT t.* FROM t JOIN obras ON t.obra == obras.code ORDER BY UPPER(obras.titulo) COLLATE portuguese, UPPER(exemplar);

    DROP TABLE IF EXISTS t;
    CREATE TEMP TABLE t AS SELECT * FROM bibliotecarios;
    DELETE FROM bibliotecarios;
    INSERT INTO bibliotecarios
      SELECT * FROM t ORDER BY UPPER(nome) COLLATE portuguese;

    DROP TABLE IF EXISTS t;
    CREATE TEMP TABLE t AS SELECT * FROM leitores;
    DELETE FROM leitores;
    INSERT INTO leitores
      SELECT * FROM t ORDER BY UPPER(nome) COLLATE portuguese;

    COMMIT;
    PRAGMA foreign_keys = ON;
    VACUUM;
EOT;

  $db->exec($sql);

  fwrite(STDOUT, "Tabelas reformadas.\n");

?>