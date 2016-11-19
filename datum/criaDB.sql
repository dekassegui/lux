/**
 *  Script para montagem do Banco de Dados da Biblioteca "Pingo de Luz"
 *  do "Núcleo Assistencial Espírita Maria de Nazaré".
*/

--
-- inabilita integridade referencial
--
PRAGMA FOREIGN_KEYS=OFF;

BEGIN TRANSACTION;

DROP TABLE IF EXISTS autores;
DROP TABLE IF EXISTS generos;
DROP TABLE IF EXISTS obras;
DROP TABLE IF EXISTS acervo;
DROP TABLE IF EXISTS bibliotecarios;
DROP TABLE IF EXISTS leitores;
DROP TABLE IF EXISTS emprestimos;
DROP VIEW IF EXISTS count_acervo;
DROP VIEW IF EXISTS count_emprestados;

CREATE TABLE IF NOT EXISTS autores (
  --
  -- autores de obras literárias
  --

  code      TEXT
            NOT NULL
            COLLATE NOCASE
            PRIMARY KEY
            CHECK(trim(code) <> ""),

  nome      TEXT
            NOT NULL
            COLLATE NOCASE
            CHECK(trim(nome) <> ""),

  espirito  TEXT
            COLLATE NOCASE
);

CREATE TABLE IF NOT EXISTS generos (
  --
  -- gêneros de obras literárias
  --

  code  TEXT
        NOT NULL
        PRIMARY KEY
        COLLATE NOCASE
        CHECK(trim(code) <> ""),

  nome  TEXT
        NOT NULL
        COLLATE NOCASE
        CHECK(trim(nome) <> "")
);

--
-- preenche a tabela "generos" com valores usuais
--
INSERT OR IGNORE INTO generos VALUES
  ("EST", "Estudos"), ("MSG", "Mensagens"), ("ROM", "Romance");

CREATE TRIGGER generos_t1 BEFORE DELETE ON generos
BEGIN
  --
  -- Não permite eliminar registros da tabela.
  --
  SELECT raise(ABORT, "Não delete registros desta tabela.");
END;

CREATE TRIGGER generos_t2 BEFORE UPDATE ON generos
BEGIN
  --
  -- Não permite modificar registros da tabela.
  --
  SELECT raise(ABORT, "Não edite registros desta tabela.");
END;

CREATE TABLE IF NOT EXISTS obras (
  --
  -- obras literárias
  --

  code    TEXT
          NOT NULL
          COLLATE NOCASE
          PRIMARY KEY
          CHECK(trim(code) <> ""),

  titulo  TEXT
          NOT NULL
          COLLATE NOCASE
          UNIQUE
          CHECK(trim(titulo) <> ""),

  autor   TEXT
          REFERENCES autores(code)
            ON UPDATE CASCADE ON DELETE RESTRICT,

  genero  TEXT
          REFERENCES generos(code)
            ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS acervo (
  --
  -- coleção de livros :: exemplares físicos (instâncias) de obras literárias
  --

  obra        TEXT
              REFERENCES obras(code)
                ON UPDATE CASCADE ON DELETE RESTRICT,

  exemplar    INTEGER               -- número de ordem do exemplar
              DEFAULT 1             -- com valor default 1
              NOT NULL
              CHECK(exemplar > 0),

  posicao     TEXT                  -- disposição numa das prateleiras:
              NOT NULL              -- A1 a A6 ou B1 a B6 ou C1 a C6
              COLLATE NOCASE
              CHECK((length(posicao) == 2)
                AND (upper(substr(posicao, 1, 1)) IN ("A", "B", "C"))
                AND (substr(posicao, 2) IN ("1", "2", "3", "4", "5", "6"))),

  comentario  TEXT  -- qualquer comentário sobre o exemplar
);

--
-- assegura unicidade de "exemplares de obras" registrados no acervo
-- imprescindível para atuar como "foreign keys parent table"
--
CREATE UNIQUE INDEX acervo_ndx ON acervo(obra, exemplar);

CREATE INDEX acervo_obra_ndx ON acervo(obra);

--
-- contabiliza as quantidades de exemplares de cada obra disponível no acervo
--
CREATE VIEW IF NOT EXISTS count_acervo AS
  SELECT obra, count(1) AS N FROM acervo GROUP BY obra ORDER BY obra;

CREATE TABLE IF NOT EXISTS bibliotecarios (
  --
  -- pessoas autorizadas a trabalhar na biblioteca
  --

  code  TEXT
        NOT NULL
        COLLATE NOCASE
        PRIMARY KEY
        CHECK(trim(code) <> ""),

  nome  TEXT
        NOT NULL
        COLLATE NOCASE
        CHECK(trim(nome) <> "")
);

CREATE TABLE IF NOT EXISTS leitores (
  --
  -- pessoas autorizadas a emprestar livros
  --

  code      TEXT
            NOT NULL
            COLLATE NOCASE
            PRIMARY KEY
            CHECK(trim(code) <> ""),

  nome      TEXT
            NOT NULL
            COLLATE NOCASE
            CHECK(trim(nome) <> ""),

  telefone  TEXT,

  email     TEXT
            COLLATE NOCASE,

  --
  -- assegura que foi fornecido "telefone" ou "e-mail"
  --
  CONSTRAINT leitores_chk CHECK(
    (telefone NOTNULL AND trim(telefone) <> "")
    OR (email NOTNULL AND trim(email) <> ""))
);

CREATE TABLE IF NOT EXISTS emprestimos (
  --
  -- a única operação registrada nesse DB
  --

  data_emprestimo DATE    -- data e hora local da operação
                  NOT NULL
                  DEFAULT(datetime('now', 'localtime')),

  data_devolucao  DATE,   -- NULL value se exemplar ainda não foi devolvido

  bibliotecario   TEXT                      -- código do bibliotecário
                  REFERENCES bibliotecarios(code)
                    ON UPDATE CASCADE ON DELETE RESTRICT,

  leitor          TEXT                      -- código do leitor
                  REFERENCES leitores(code)
                    ON UPDATE CASCADE ON DELETE RESTRICT,

  obra            TEXT,                 -- código da obra

  exemplar        INTEGER               -- número de ordem do exemplar
                  DEFAULT 1             -- com valor default 1
                  CHECK(exemplar > 0),

  comentario      TEXT,   -- qualquer comentário sobre a operação

  FOREIGN KEY (obra, exemplar) REFERENCES acervo(obra, exemplar)
    ON UPDATE CASCADE ON DELETE RESTRICT,

  CONSTRAINT emprestimos_chk CHECK(
    (data_devolucao ISNULL) OR (data_emprestimo < data_devolucao))
);

CREATE INDEX data_emprestimo_ndx ON emprestimos(data_emprestimo DESC);
CREATE INDEX data_devolucao_ndx ON emprestimos(data_devolucao DESC);
CREATE INDEX leitor_ndx ON emprestimos(leitor);

--
-- impede empréstimo se alguma restrição se aplica
--
CREATE TRIGGER IF NOT EXISTS kashite BEFORE INSERT ON emprestimos
BEGIN
  SELECT CASE WHEN EXISTS(SELECT 1 FROM emprestimos WHERE
    (leitor == new.leitor) AND data_devolucao ISNULL AND
    (date(data_emprestimo, "+30 days") < date("now", "localtime"))) THEN
    RAISE(ABORT, "O leitor tem ao menos 1 empréstimo em atraso")
  WHEN (SELECT count(1) FROM emprestimos WHERE (leitor == new.leitor)
    AND data_devolucao ISNULL) >= 3 THEN
    RAISE(ABORT, "O leitor não pode ter mais que 3 empréstimos pendentes")
  WHEN (SELECT (m > 0) AND (n > 0) AND (m == n) FROM (SELECT count(1) AS m
    FROM acervo WHERE obra == new.obra), (SELECT count(1) AS n FROM
    emprestimos WHERE (obra == new.obra) AND data_devolucao ISNULL)) THEN
    RAISE(ABORT, "Todos os exemplares da obra estão emprestados")
  WHEN EXISTS(SELECT 1 FROM emprestimos WHERE (exemplar == new.exemplar)
    AND (obra == new.obra) AND data_devolucao ISNULL) THEN
    RAISE(ABORT, "O exemplar requisitado já está emprestado")
  WHEN EXISTS(SELECT 1 FROM emprestimos WHERE (leitor == new.leitor)
    AND (obra == new.obra) AND data_devolucao ISNULL) THEN
    RAISE(ABORT, "O leitor não pode emprestar mais de um exemplar da obra")
  END;
END;

--
-- contabiliza as quantidades de exemplares de cada obra sob empréstimo
--
CREATE VIEW IF NOT EXISTS count_emprestados AS
  SELECT obra, count(1) AS N FROM emprestimos
  WHERE data_devolucao ISNULL
  GROUP BY obra ORDER BY obra;

COMMIT;

--
-- habilita integridade referencial
--
PRAGMA FOREIGN_KEYS=ON;

--
-- preenchimento das tabelas
--

.import "autores.dat" autores
UPDATE autores SET espirito=NULL WHERE trim(espirito) == "";

.import "obras.dat" obras

.import "bibliotecarios.dat" bibliotecarios

.import "acervo.dat" acervo

.import "leitores.dat" leitores
