/**
 *  Script para montagem do Banco de Dados da Biblioteca "Pingo de Luz"
 *  do "Núcleo Assistencial Espírita Maria de Nazaré".
 *
 *  + Programado para uso via SQLite na versão 3.7.13 ou acima.
 *  + Independe de extensões, mas recomendamos uso de REGEX.
 *
 *  + Sob constante desenvolvimento desde 12 de novembro de 2016.
 *
 *  ===========================================================================
 *
 *   Este software é de Domínio Público, sem restrição de uso comercial, pois:
 *
 *     "Compartilhar é uma das melhores formas de reduzir desigualdades".
 *
 *         Concepção: Aguinaldo Antonietto
 *   Desenvolvimento: Antonio Sergio Ando
 *
 *  ===========================================================================
*/

PRAGMA FOREIGN_KEYS = OFF;  --> inabilita integridade referencial

PRAGMA RECURSIVE_TRIGGERS = ON; --> habilita recursividade dos gatilhos

BEGIN TRANSACTION;

DROP TABLE IF EXISTS config;
DROP TABLE IF EXISTS autores;
DROP TABLE IF EXISTS generos;
DROP TABLE IF EXISTS obras;
DROP TABLE IF EXISTS acervo;
DROP TABLE IF EXISTS bibliotecarios;
DROP TABLE IF EXISTS leitores;
DROP TABLE IF EXISTS emprestimos;
DROP TABLE IF EXISTS feriados_moveis;
DROP TABLE IF EXISTS feriados_fixos;
DROP VIEW IF EXISTS conta_obras_acervo;
DROP VIEW IF EXISTS disponiveis_acervo;
DROP VIEW IF EXISTS emprestados;
DROP VIEW IF EXISTS atrasados;
DROP VIEW IF EXISTS count_emprestados;
DROP VIEW IF EXISTS obras_facil;
DROP VIEW IF EXISTS obras_emprestadas;
DROP VIEW IF EXISTS acervo_facil;
DROP VIEW IF EXISTS emprestimos_easy;
DROP VIEW IF EXISTS emprestimos_facil;
DROP VIEW IF EXISTS exemplares_disponiveis;
DROP VIEW IF EXISTS config_facil;
DROP VIEW IF EXISTS feriados;
DROP VIEW IF EXISTS calc_feriados_moveis;

CREATE TABLE IF NOT EXISTS autores (
  --
  -- autores de obras literárias
  --

  code      TEXT                      --> código mnemônico do autor, tão
            NOT NULL                  --> reduzido quanto possível para bom
            COLLATE NOCASE            --> desempenho em pesquisas
            PRIMARY KEY
            CHECK(trim(code) <> ""),

  nome      TEXT                      --> nome do espírito encarnado que
            NOT NULL                  --> assina as suas obras e de outros
            COLLATE NOCASE
            CHECK(trim(nome) <> ""),

  espirito  TEXT                      --> nome do espírito psicografado
            COLLATE NOCASE            --> orientador e/ou coautor
            CHECK(espirito ISNULL
              OR (trim(espirito) <> ""))
);

--
-- assegura unicidade da combinação de "nomes e espíritos"
--
CREATE UNIQUE INDEX autores_ndx ON autores(nome, espirito);

--
-- remove espaços em branco no início e fim das strings armazenadas nas
-- colunas "nome" e "espirito" de registro recém inserido na tabela de
-- "autores"
--
CREATE TRIGGER autores_t0 AFTER INSERT ON autores
WHEN (trim(new.nome) <> new.nome)
  OR (new.espirito NOTNULL AND (trim(new.espirito) <> new.espirito))
BEGIN
  UPDATE autores SET nome=trim(new.nome)
    WHERE nome == new.nome;
  UPDATE autores SET espirito=trim(new.espirito)
    WHERE espirito NOTNULL AND (espirito == new.espirito);
END;

--
-- remove espaços em branco no início e fim das strings armazenadas nas
-- colunas "nome" e "espirito" de registro recém atualizado na tabela de
-- "autores"
--
CREATE TRIGGER autores_t1 AFTER UPDATE OF nome, espirito ON autores
WHEN (trim(new.nome) <> new.nome)
  OR (new.espirito NOTNULL AND (trim(new.espirito) <> new.espirito))
BEGIN
  UPDATE autores SET nome=trim(new.nome)
    WHERE nome == new.nome;
  UPDATE autores SET espirito=trim(new.espirito)
    WHERE espirito NOTNULL AND (espirito == new.espirito);
END;

--
-- substitui sequências de espaços em branco na string armazenada na
-- coluna "nome" de registro recém inserido na tabela de "autores"
--
CREATE TRIGGER autores_t2 AFTER INSERT ON autores
WHEN new.nome glob "*  *"
BEGIN
  UPDATE autores SET nome=replace(new.nome, "  ", " ") WHERE nome == new.nome;
END;

--
-- substitui sequências de espaços em branco na string armazenada na
-- coluna "nome" de registro recém atualizado na tabela de "autores"
--
CREATE TRIGGER autores_t3 AFTER UPDATE OF nome ON autores
WHEN new.nome glob "*  *"
BEGIN
  UPDATE autores SET nome=replace(new.nome, "  ", " ") WHERE nome == new.nome;
END;

--
-- substitui sequências de espaços em branco na string armazenada na
-- coluna "espirito" de registro recém inserido na tabela de "autores"
--
CREATE TRIGGER autores_t4 AFTER INSERT ON autores
WHEN (new.espirito NOTNULL) AND (new.espirito glob "*  *")
BEGIN
  UPDATE autores SET espirito=replace(new.espirito, "  ", " ")
    WHERE espirito == new.espirito;
END;

--
-- substitui sequências de espaços em branco na string armazenada na
-- coluna "espirito" de registro recém atualizado na tabela de "autores"
--
CREATE TRIGGER autores_t5 AFTER UPDATE OF espirito ON autores
WHEN (new.espirito NOTNULL) AND (new.espirito glob "*  *")
BEGIN
  UPDATE autores SET espirito=replace(new.espirito, "  ", " ")
    WHERE espirito == new.espirito;
END;

CREATE TABLE IF NOT EXISTS generos (
  --
  -- gêneros de obras literárias
  --

  code  TEXT                      --> código mnemônico do gênero literário,
        NOT NULL                  --> tão reduzido quanto possível para bom
        PRIMARY KEY               --> desempenho em pesquisas
        COLLATE NOCASE
        CHECK(trim(code) <> ""),

  nome  TEXT                      --> nome por extenso do gênero
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
  SELECT raise(ABORT, "Não delete registros desta tabela.");
END;

CREATE TRIGGER generos_t2 BEFORE UPDATE ON generos
BEGIN
  SELECT raise(ABORT, "Não edite registros desta tabela.");
END;

CREATE TABLE IF NOT EXISTS obras (
  --
  -- obras literárias
  --

  code    TEXT                      --> código mnemônico da obra literária,
          NOT NULL                  --> tão reduzido quanto possível para bom
          COLLATE NOCASE            --> desempenho em pesquisas
          PRIMARY KEY
          CHECK(trim(code) <> ""),

  titulo  TEXT                      --> título da obra por extenso
          NOT NULL
          COLLATE NOCASE
          UNIQUE
          CHECK(trim(titulo) <> ""),

  autor   TEXT                     --> valor coincidente com um dos valores
          NOT NULL                 --> de código de autor na tabela "autores"
          REFERENCES autores(code)
            ON UPDATE CASCADE ON DELETE RESTRICT,

  genero  TEXT                    --> valor coincidente com um dos valores
          NOT NULL                --> de código de gênero na tabela "generos"
          REFERENCES generos(code)
            ON UPDATE CASCADE ON DELETE RESTRICT
);

--
-- remove espaços em branco no início e fim da string armazenada na
-- coluna "titulo" de registro recém inserido na tabela de "obras"
--
CREATE TRIGGER obras_t0 AFTER INSERT ON obras
WHEN trim(new.titulo) <> new.titulo
BEGIN
  UPDATE obras SET titulo=trim(new.titulo) WHERE titulo == new.titulo;
END;

--
-- remove espaços em branco no início e fim da string armazenada na
-- coluna "titulo" de registro recém atualizado na tabela de "obras"
--
CREATE TRIGGER obras_t1 AFTER UPDATE OF titulo ON obras
WHEN trim(new.titulo) <> new.titulo
BEGIN
  UPDATE obras SET titulo=trim(new.titulo) WHERE titulo == new.titulo;
END;

--
-- substitui sequências de espaços em branco na string armazenada na
-- coluna "titulo" de registro recém inserido na tabela de "obras"
--
CREATE TRIGGER obras_t2 AFTER INSERT ON obras
WHEN new.titulo glob "*  *"
BEGIN
  UPDATE obras SET titulo=replace(new.titulo, "  ", " ")
    WHERE titulo == new.titulo;
END;

--
-- substitui sequências de espaços em branco na string armazenada na
-- coluna "titulo" de registro recém inserido na tabela de "obras"
--
CREATE TRIGGER obras_t3 AFTER UPDATE OF titulo ON obras
WHEN new.titulo glob "*  *"
BEGIN
  UPDATE obras SET titulo=replace(new.titulo, "  ", " ")
    WHERE titulo == new.titulo;
END;

--
-- Conveniência para tornar o acesso à tabela "obras" amigável,
-- substituindo códigos mnemônicos por seus valores associados.
--
CREATE VIEW IF NOT EXISTS obras_facil AS
  SELECT obras.rowid, obras.code, obras.titulo,
    ifnull(autores.nome || " + " || autores.espirito, autores.nome) AS autor,
    generos.nome AS genero
  FROM obras JOIN autores ON obras.autor == autores.code
    JOIN generos ON obras.genero == generos.code;

CREATE TRIGGER obras_facil_t0 INSTEAD OF INSERT ON obras_facil
BEGIN
  INSERT INTO obras SELECT
    new.code,
    new.titulo,
    (SELECT code FROM autores WHERE nome == new.autor),
    (SELECT code FROM generos WHERE nome == new.genero);
END;

CREATE TRIGGER obras_facil_t1 INSTEAD OF UPDATE ON obras_facil
BEGIN
  UPDATE obras SET
    code=new.code,
    titulo=new.titulo,
    autor=(SELECT code FROM autores WHERE nome == new.autor),
    genero=(SELECT code FROM generos WHERE nome == new.genero)
  WHERE rowid == old.rowid;
END;

CREATE TRIGGER obras_facil_t2 INSTEAD OF DELETE ON obras_facil
BEGIN
  DELETE FROM obras WHERE rowid == old.rowid;
END;

CREATE TABLE IF NOT EXISTS acervo (
  --
  -- coleção de livros :: exemplares físicos (instâncias) de obras literárias
  --

  obra        TEXT                   --> valor coincidente com um dos valores
              NOT NULL               --> de código de obra na tabela "obras"
              REFERENCES obras(code)
                ON UPDATE CASCADE ON DELETE RESTRICT,

  exemplar    TEXT        --> alguma característica que diferencia o exemplar
              DEFAULT 1   --> dos demais e.g.: seu número de ordem, cor, etc.
              NOT NULL
              CHECK(trim(exemplar) <> ""),

  posicao     TEXT                  --> disposição numa das prateleiras:
              NOT NULL              --> A1 a A6 ou B1 a B6 ou C1 a C6
              COLLATE NOCASE
              CHECK(upper(posicao) glob "[ABC][1-6]"),

  comentario  TEXT  --> qualquer comentário sobre o exemplar
);

--
-- remove espaços em branco no início e fim da string armazenada na
-- coluna "exemplar" de registro recém inserido na tabela "acervo"
--
CREATE TRIGGER acervo_t0 AFTER INSERT ON acervo
WHEN trim(new.exemplar) <> new.exemplar
BEGIN
  UPDATE acervo SET exemplar=trim(new.exemplar) WHERE exemplar == new.exemplar;
END;

--
-- remove espaços em branco no início e fim da string armazenada na
-- coluna "exemplar" de registro recém atualizado na tabela "acervo"
--
CREATE TRIGGER acervo_t1 AFTER UPDATE OF exemplar ON acervo
WHEN trim(new.exemplar) <> new.exemplar
BEGIN
  UPDATE acervo SET exemplar=trim(new.exemplar) WHERE exemplar == new.exemplar;
END;

--
-- assegura unicidade da combinação de "exemplares" e "obras"
-- imprescindível para atuar como "foreign keys parent table"
--
CREATE UNIQUE INDEX acervo_ndx ON acervo(obra, exemplar);

CREATE INDEX acervo_obra_ndx ON acervo(obra);

--
-- contabiliza as quantidades de exemplares de cada obra disponível no acervo
--
CREATE VIEW IF NOT EXISTS conta_obras_acervo AS
  SELECT obra, count(1) AS N FROM acervo GROUP BY obra ORDER BY obra;

--
-- Conveniência para tornar o acesso à tabela "acervo" amigável,
-- substituindo códigos mnemônicos por seus valores associados.
--
CREATE VIEW IF NOT EXISTS acervo_facil AS
  SELECT acervo.rowid,
    obras_facil.code AS code,
    obras_facil.titulo AS obra,
    obras_facil.autor,
    exemplar,
    posicao,
    comentario
  FROM acervo JOIN obras_facil ON acervo.obra == obras_facil.code;

CREATE TRIGGER acervo_facil_t0 INSTEAD OF INSERT ON acervo_facil
BEGIN
  INSERT INTO acervo SELECT
    (SELECT code FROM obras WHERE titulo == new.obra),
    new.exemplar,
    new.posicao,
    new.comentario;
END;

CREATE TRIGGER acervo_facil_t1 INSTEAD OF UPDATE ON acervo_facil
BEGIN
  UPDATE acervo SET
    obra=(SELECT code FROM obras WHERE titulo == new.obra),
    exemplar=new.exemplar,
    posicao=new.posicao,
    comentario=new.comentario
  WHERE rowid == old.rowid;
END;

CREATE TRIGGER acervo_facil_t2 INSTEAD OF DELETE ON acervo_facil
BEGIN
  DELETE FROM acervo WHERE rowid == old.rowid;
END;

CREATE TABLE IF NOT EXISTS bibliotecarios (
  --
  -- pessoas responsáveis pela operação da biblioteca em qualquer turno
  --

  code  TEXT                      --> código mnemônico da pessoa responsável
        NOT NULL                  --> pela operação da biblioteca, tão
        COLLATE NOCASE            --> reduzido quanto possível para bom
        PRIMARY KEY               --> desempenho em pesquisas
        CHECK(trim(code) <> ""),

  nome  TEXT                      --> nome por extenso da pessoa
        NOT NULL
        COLLATE NOCASE
        CHECK(trim(nome) <> "")
);

--
-- remove espaços em branco no início e fim da string armazenada na
-- coluna "nome" de registro recém inserido na tabela "bibliotecarios"
--
CREATE TRIGGER bibliotecarios_t0 AFTER INSERT ON bibliotecarios
WHEN trim(new.nome) <> new.nome
BEGIN
  UPDATE bibliotecarios SET nome=trim(new.nome) WHERE nome == new.nome;
END;

--
-- remove espaços em branco no início e fim da string armazenada na
-- coluna "nome" de registro recém atualizado na tabela "bibliotecarios"
--
CREATE TRIGGER bibliotecarios_t1 AFTER UPDATE OF nome ON bibliotecarios
WHEN trim(new.nome) <> new.nome
BEGIN
  UPDATE bibliotecarios SET nome=trim(new.nome) WHERE nome == new.nome;
END;

--
-- substitui sequências de espaços em branco na string armazenada na
-- coluna "nome" de registro recém inserido na tabela de "bibliotecarios"
--
CREATE TRIGGER bibliotecarios_t2 AFTER INSERT ON bibliotecarios
WHEN new.nome glob "*  *"
BEGIN
  UPDATE bibliotecarios SET nome=replace(new.nome, "  ", " ")
    WHERE nome == new.nome;
END;

--
-- substitui sequências de espaços em branco na string armazenada na
-- coluna "nome" de registro recém inserido na tabela de "bibliotecarios"
--
CREATE TRIGGER bibliotecarios_t3 AFTER UPDATE OF nome ON bibliotecarios
WHEN new.nome glob "*  *"
BEGIN
  UPDATE bibliotecarios SET nome=replace(new.nome, "  ", " ")
    WHERE nome == new.nome;
END;

CREATE TABLE IF NOT EXISTS leitores (
  --
  -- pessoas autorizadas a emprestar livros
  --

  code      TEXT                      --> código mnemônico do leitor, tão
            NOT NULL                  --> reduzido quanto possível para bom
            COLLATE NOCASE            --> desempenho em pesquisas
            PRIMARY KEY
            CHECK(trim(code) <> ""),

  nome      TEXT                      --> nome por extenso da pessoa
            NOT NULL
            COLLATE NOCASE
            CHECK(trim(nome) <> ""),

  telefone  TEXT,                     --> número(s) de telefone(s)

  email     TEXT                      --> email(s) válido(s) e ativo(s)
            COLLATE NOCASE,

  CONSTRAINT leitores_chk CHECK(                  --> assegura contato via
    (telefone NOTNULL AND trim(telefone) <> "")   --> telefone(s)
    OR (email NOTNULL                             --> ou e-mail(s)
        AND trim(email)
         glob "*[^ .@]@[^ .@]*.[^ .@]*"))
);

--
-- remove espaços em branco no início e fim da string armazenada na
-- coluna "nome" de registro recém inserido na tabela "leitores"
--
CREATE TRIGGER leitores_t0 AFTER INSERT ON leitores
WHEN trim(new.nome) <> new.nome
BEGIN
  UPDATE leitores SET nome=trim(new.nome) WHERE nome == new.nome;
END;

--
-- remove espaços em branco no início e fim da string armazenada na
-- coluna "nome" de registro recém atualizado na tabela "leitores"
--
CREATE TRIGGER leitores_t1 AFTER UPDATE OF nome ON leitores
WHEN trim(new.nome) <> new.nome
BEGIN
  UPDATE leitores SET nome=trim(new.nome) WHERE nome == new.nome;
END;

--
-- substitui sequências de espaços em branco na string armazenada na
-- coluna "nome" de registro recém inserido na tabela de "leitores"
--
CREATE TRIGGER leitores_t2 AFTER INSERT ON leitores
WHEN new.nome glob "*  *"
BEGIN
  UPDATE leitores SET nome=replace(new.nome, "  ", " ") WHERE nome == new.nome;
END;

--
-- substitui sequências de espaços em branco na string armazenada na
-- coluna "nome" de registro recém inserido na tabela de "leitores"
--
CREATE TRIGGER leitores_t3 AFTER UPDATE OF nome ON leitores
WHEN new.nome glob "*  *"
BEGIN
  UPDATE leitores SET nome=replace(new.nome, "  ", " ") WHERE nome == new.nome;
END;

CREATE TABLE IF NOT EXISTS config (
  --
  -- conjunto de parâmetros das restrições de empréstimos
  -- e cálculo das "datas limite" para devolução
  --

  prazo       TEXT                      --> expressão para cálculo da data
              DEFAULT "+60 days"        --> limite de devolução de livros
              NOT NULL,                 --> conforme funções Date&Time do
                                        --> SQLite

  pendencias  INTEGER                   --> quantidade máxima de livros que
              DEFAULT 3                 --> podem ser emprestados a qualquer
              NOT NULL,                 --> leitor

  weekdays    INTEGER                   --> bitmask dos dias da semana
              DEFAULT 26                --> com atendimento ao público
              NOT NULL,

  CONSTRAINT prazo_chk CHECK(
    ((lower(prazo) glob "+[0-9][0-9] days")
     OR (lower(prazo) glob "+[0-9] days"))
    AND (CAST(prazo AS integer) > 0)),

  CONSTRAINT pendencias_chk CHECK(pendencias > 0),

  CONSTRAINT weekdays_chk CHECK(weekdays BETWEEN 1 AND 128),

  CONSTRAINT registro_unico_chk CHECK(ROWID < 2)  --> único registro
);

INSERT OR IGNORE INTO config DEFAULT VALUES;

CREATE TRIGGER config_t0 BEFORE DELETE ON config
BEGIN
  SELECT raise(ABORT, "Não delete o único registro desta tabela.");
END;

CREATE TRIGGER config_t1 BEFORE UPDATE OF pendencias ON config
WHEN new.pendencias NOTNULL and EXISTS(
  SELECT count() AS n FROM emprestimos WHERE data_devolucao ISNULL
  GROUP BY leitor HAVING n > new.pendencias)
BEGIN
  SELECT raise(ABORT,
    "1+ leitores emprestariam mais que a quantidade máxima permitida.");
END;

CREATE VIEW config_facil AS
  SELECT CAST(prazo AS INTEGER) AS prazo, pendencias, weekdays FROM config;

--
-- conveniência para facilitar a atualização da coluna "prazo"
--
CREATE TRIGGER config_facil_t0 INSTEAD OF UPDATE ON config_facil
BEGIN
  UPDATE config SET prazo=("+" || CAST(new.prazo AS INTEGER) || " days"),
    pendencias=new.pendencias, weekdays=new.weekdays;
END;

CREATE TABLE IF NOT EXISTS emprestimos (
  --
  -- a única operação registrada nesse DB
  --

  data_emprestimo DATE      --> DATA e HORA local da operação :: ISO-8601
                  NOT NULL
                  DEFAULT(datetime(CURRENT_TIMESTAMP, 'localtime')),

  data_devolucao  DATE,     --> NULL value se exemplar está emprestado!

  bibliotecario   TEXT           --> valor coincidente com um dos valores
                  NOT NULL       --> de código de bibliotecario na tabela
                  COLLATE NOCASE --> "bibliotecarios"
                  REFERENCES bibliotecarios(code)
                    ON UPDATE CASCADE ON DELETE RESTRICT,

  leitor          TEXT           --> valor coincidente com um dos valores
                  NOT NULL       --> de código de leitor na tabela "leitores"
                  COLLATE NOCASE
                  REFERENCES leitores(code)
                    ON UPDATE CASCADE ON DELETE RESTRICT,

  obra            TEXT             --> valor coincidente com um dos valores
                  NOT NULL         --> de obra na tabela "acervo"
                  COLLATE NOCASE,

  exemplar        TEXT        --> valor coincidente com um dos valores
                  DEFAULT 1   --> de exemplar na tabela "acervo"
                  NOT NULL
                  COLLATE NOCASE,

  data_limite     DATE,       --> data máxima para devolução, calculada
                              --> automaticamente após inserção do registro
  --
  -- combinação única dos valores coincidentes na tabela "acervo"
  --
  FOREIGN KEY (obra, exemplar) REFERENCES acervo(obra, exemplar)
    ON UPDATE CASCADE ON DELETE RESTRICT,

  CONSTRAINT chk_data_emprestimo CHECK(
    CAST(strftime("%s", data_emprestimo) AS INTEGER) NOTNULL),

  CONSTRAINT chk_data_devolucao CHECK(
    data_devolucao ISNULL
    OR (CAST(strftime("%s", data_devolucao) AS INTEGER) NOTNULL)),

  CONSTRAINT chk_dates_range CHECK(        --> assegura que data de devolução
    data_devolucao ISNULL                  --> NÃO ESTÁ PREENCHIDA ou é
    OR (data_devolucao > data_emprestimo)) --> posterior à data de empréstimo
);

CREATE INDEX data_emprestimo_ndx ON emprestimos(data_emprestimo DESC);
CREATE INDEX data_devolucao_ndx ON emprestimos(data_devolucao DESC);
CREATE INDEX leitor_ndx ON emprestimos(leitor);

--
-- check-up sequencial das restrições de empréstimo nas inserções
--
CREATE TRIGGER KASHITENAI BEFORE INSERT ON emprestimos
BEGIN
  SELECT CASE
  WHEN EXISTS(
      SELECT 1 FROM emprestimos
      WHERE data_devolucao ISNULL AND leitor IS new.leitor
        AND data_limite < date("now", "localtime")
    )
    THEN raise(ABORT, "O leitor tem ao menos 1 empréstimo em atraso")
  WHEN EXISTS(
      SELECT 1 FROM emprestimos
      WHERE data_devolucao ISNULL AND leitor IS new.leitor
        AND obra IS new.obra
    )
    THEN raise(ABORT, "O leitor não pode emprestar mais de um exemplar da mesma obra")
  WHEN EXISTS(
      SELECT 1 FROM emprestimos
      WHERE data_devolucao ISNULL
        AND obra IS new.obra AND exemplar IS new.exemplar
    )
    THEN raise(ABORT, "O exemplar requisitado já está emprestado")
  WHEN (
      SELECT count(1) >= pendencias
      FROM config, emprestimos
      WHERE data_devolucao ISNULL AND leitor IS new.leitor
    )
    THEN raise(ABORT, "O leitor não pode exceder a quantidade máxima de empréstimos pendentes")
  WHEN (
      SELECT (M > 0) AND (N > 0) AND (M == N)
      FROM (
          SELECT count(1) AS M FROM acervo WHERE obra IS new.obra
        ), (
          SELECT count(1) AS N FROM emprestimos
          WHERE data_devolucao ISNULL AND obra IS new.obra
        )
    )
    THEN raise(ABORT, "Todos os exemplares da obra estão emprestados")
  END;
END;

--
-- check-up sequencial das restrições de empréstimo nas atualizações
--
CREATE TRIGGER CHK_UPDATE_ON_EMPRESTIMOS BEFORE UPDATE ON emprestimos
BEGIN
  SELECT CASE
  WHEN new.leitor NOTNULL AND new.leitor IS NOT old.leitor
    THEN (
      SELECT CASE
      WHEN EXISTS(
          SELECT 1 FROM emprestimos
          WHERE data_devolucao ISNULL AND leitor IS new.leitor
            AND data_limite < date("now", "localtime")
        )
        THEN raise(ABORT, "O leitor tem ao menos 1 empréstimo em atraso")
      WHEN (
          SELECT count(1) >= pendencias
          FROM config, emprestimos
          WHERE data_devolucao ISNULL AND leitor IS new.leitor
        )
        THEN raise(ABORT, "O leitor não pode exceder a quantidade máxima de empréstimos pendentes")
      WHEN EXISTS(
          SELECT 1 FROM emprestimos
          WHERE data_devolucao ISNULL AND leitor IS new.leitor
            AND obra IS ifnull(new.obra, old.obra)
        )
        THEN raise(ABORT, "O leitor não pode emprestar mais de um exemplar da mesma obra")
      END
    )
  WHEN new.obra NOTNULL AND new.obra IS NOT old.obra
    THEN (
      SELECT CASE
      WHEN (
          SELECT (M > 0) AND (N > 0) AND (M == N)
          FROM (
              SELECT count(1) AS M FROM acervo WHERE obra IS new.obra
            ), (
              SELECT count(1) AS N FROM emprestimos
              WHERE data_devolucao ISNULL AND obra IS new.obra
            )
        )
        THEN raise(ABORT, "Todos os exemplares da obra estão emprestados")
      WHEN (
          SELECT 1 FROM emprestimos
          WHERE data_devolucao ISNULL AND obra IS new.obra
            AND exemplar IS ifnull(new.exemplar, old.exemplar)
        )
        THEN raise(ABORT, "O exemplar da obra já está emprestado")
      END
    )
  WHEN new.exemplar NOTNULL AND new.exemplar IS NOT old.exemplar
    THEN (
      SELECT CASE
      WHEN (
          SELECT (M > 0) AND (N > 0) AND (M == N)
          FROM (
              SELECT count(1) AS M FROM acervo
              WHERE obra IS ifnull(new.obra, old.obra)
            ), (
              SELECT count(1) AS N FROM emprestimos
              WHERE data_devolucao ISNULL
                AND obra IS ifnull(new.obra, old.obra)
            )
        )
        THEN raise(ABORT, "Todos os exemplares da obra estão emprestados")
      WHEN (
          SELECT 1 FROM emprestimos
          WHERE data_devolucao ISNULL AND exemplar IS new.exemplar
            AND obra IS ifnull(new.obra, old.obra)
        )
        THEN raise(ABORT, "O exemplar da obra já está emprestado")
      END
    )
  END;
END;

--
-- conveniência exclusivamente para calcular e preencher a coluna
-- "data_limite" na inserção de registros de "emprestimos"
--
CREATE VIEW IF NOT EXISTS emprestimos_easy AS SELECT * FROM emprestimos;

--
-- Se o novo valor da coluna "data_limite" é NULL, então calcula e preenche
-- a coluna, restrita aos dias da semana com atendimento, i.e.: a biblioteca
-- funciona e que não sejam feriado, senão preenche a coluna com o novo valor.
--
CREATE TRIGGER emprestimos_easy_t0 INSTEAD OF INSERT ON emprestimos_easy
BEGIN
  INSERT INTO emprestimos SELECT new.data_emprestimo, new.data_devolucao,
    new.bibliotecario, new.leitor, new.obra, new.exemplar,
    (
      SELECT CASE WHEN new.data_limite ISNULL THEN
      (
        -- Calcula a "data limite" do empréstimo conforme o prazo, restrita
        -- aos dias da semana com atendimento, i.e.: a biblioteca funciona
        -- e que não sejam feriado.
        SELECT CASE WHEN (
          -- testa disponibilidade do dia da semana da data candidata
          ((weekdays >> wday) & 1)
          -- testa se a data não cai num feriado
          AND NOT EXISTS(SELECT 1 FROM feriados WHERE data_feriado == expDate)
        ) THEN (
          expDate  --> data candidata disponível
        ) ELSE (
          -- data candidata indisponível --> calcula dia substituto
          SELECT MIN(
            (SELECT CASE WHEN wday<>0 AND weekdays&1
              THEN (
                SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM feriados
                  WHERE data_feriado == dia) THEN dia ELSE NEVER END
                FROM (SELECT DATE(expDate, "weekday 0") AS dia)
              )
              ELSE NEVER END),
            (SELECT CASE WHEN wday<>1 AND weekdays&2
              THEN (
                SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM feriados
                  WHERE data_feriado == dia) THEN dia ELSE NEVER END
                FROM (SELECT DATE(expDate, "weekday 1") AS dia)
              )
              ELSE NEVER END),
            (SELECT CASE WHEN wday<>2 AND weekdays&4
              THEN (
                SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM feriados
                  WHERE data_feriado == dia) THEN dia ELSE NEVER END
                FROM (SELECT DATE(expDate, "weekday 2") AS dia)
              )
              ELSE NEVER END),
            (SELECT CASE WHEN wday<>3 AND weekdays&8
              THEN (
                SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM feriados
                  WHERE data_feriado == dia) THEN dia ELSE NEVER END
                FROM (SELECT DATE(expDate, "weekday 3") AS dia)
              )
              ELSE NEVER END),
            (SELECT CASE WHEN wday<>4 AND weekdays&16
              THEN (
                SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM feriados
                  WHERE data_feriado == dia) THEN dia ELSE NEVER END
                FROM (SELECT DATE(expDate, "weekday 4") AS dia)
              )
              ELSE NEVER END),
            (SELECT CASE WHEN wday<>5 AND weekdays&32
              THEN (
                SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM feriados
                  WHERE data_feriado == dia) THEN dia ELSE NEVER END
                FROM (SELECT DATE(expDate, "weekday 5") AS dia)
              )
              ELSE NEVER END),
            (SELECT CASE WHEN wday<>6 AND weekdays&64
              THEN (
                SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM feriados
                  WHERE data_feriado == dia) THEN dia ELSE NEVER END
                FROM (SELECT DATE(expDate, "weekday 6") AS dia)
              )
              ELSE NEVER END),
            --
            -- set complementar dos dias candidatos, com offset de 7 dias,
            -- quando o único dia da semana com atendimento cai num feriado
            --
            (SELECT CASE WHEN weekdays&1
              THEN (
                SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM feriados
                  WHERE data_feriado == dia) THEN dia ELSE NEVER END
                FROM (SELECT DATE(expDateExt, "weekday 0") AS dia)
              )
              ELSE NEVER END),
            (SELECT CASE WHEN weekdays&2
              THEN (
                SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM feriados
                  WHERE data_feriado == dia) THEN dia ELSE NEVER END
                FROM (SELECT DATE(expDateExt, "weekday 1") AS dia)
              )
              ELSE NEVER END),
            (SELECT CASE WHEN weekdays&4
              THEN (
                SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM feriados
                  WHERE data_feriado == dia) THEN dia ELSE NEVER END
                FROM (SELECT DATE(expDateExt, "weekday 2") AS dia)
              )
              ELSE NEVER END),
            (SELECT CASE WHEN weekdays&8
              THEN (
                SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM feriados
                  WHERE data_feriado == dia) THEN dia ELSE NEVER END
                FROM (SELECT DATE(expDateExt, "weekday 3") AS dia)
              )
              ELSE NEVER END),
            (SELECT CASE WHEN weekdays&16
              THEN (
                SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM feriados
                  WHERE data_feriado == dia) THEN dia ELSE NEVER END
                FROM (SELECT DATE(expDateExt, "weekday 4") AS dia)
              )
              ELSE NEVER END),
            (SELECT CASE WHEN weekdays&32
              THEN (
                SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM feriados
                  WHERE data_feriado == dia) THEN dia ELSE NEVER END
                FROM (SELECT DATE(expDateExt, "weekday 5") AS dia)
              )
              ELSE NEVER END),
            (SELECT CASE WHEN weekdays&64
              THEN (
                SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM feriados
                  WHERE data_feriado == dia) THEN dia ELSE NEVER END
                FROM (SELECT DATE(expDateExt, "weekday 6") AS dia)
              )
              ELSE NEVER END)
          ) FROM (SELECT DATE(expDate, "+7 days") AS expDateExt,
                  "9999-12-31" AS NEVER)
        ) END
        FROM (
          -- calcula a data candidata a "data limite" e seu respectivo
          -- número de dia da semana, conforme prazo arbitrário
          SELECT weekdays, substr(rawDate, 2) AS expDate,
            CAST(substr(rawDate, 1, 1) AS INTEGER) AS wday
          FROM (
            SELECT weekdays,
              strftime("%w%Y-%m-%d", new.data_emprestimo, prazo) AS rawDate
            FROM config
          )
        )
      )
      ELSE new.data_limite END
    );
END;

--
-- conveniência para exibir registros da tabela "emprestimos" com valores
-- correspondentes aos respectivos códigos em suas tabelas e datas pt-BR
--
CREATE VIEW IF NOT EXISTS emprestimos_facil AS
  SELECT emprestimos.rowid AS rowid,
    bibliotecarios.nome AS bibliotecario,
    strftime("%d-%m-%Y %H:%M", data_emprestimo) AS data_emprestimo,
    strftime("%d-%m-%Y %H:%M", data_devolucao) AS data_devolucao,
    leitores.nome AS leitor,
    acervo_facil.obra,
    acervo_facil.autor,
    acervo_facil.exemplar,
    acervo_facil.posicao,
    data_limite,
    "Emprestado até " || (
      SELECT CASE CAST(substr(rawDate, 1, 1) AS INTEGER)
        WHEN 0 THEN "Domingo"   WHEN 1 THEN "Segunda"   WHEN 2 THEN "Terça"
        WHEN 3 THEN "Quarta"    WHEN 4 THEN "Quinta"    WHEN 5 THEN "Sexta"
        ELSE "Sábado"
      END || substr(rawDate, 2)
      FROM (SELECT strftime("%w %d-%m-%Y.", data_limite) AS rawDate)
    ) AS comentario
  FROM emprestimos
    JOIN bibliotecarios ON (emprestimos.bibliotecario == bibliotecarios.code)
    JOIN leitores ON (emprestimos.leitor == leitores.code)
    JOIN acervo_facil ON (
      emprestimos.obra == acervo_facil.code
      AND emprestimos.exemplar == acervo_facil.exemplar);

--
-- conveniência para inserção de registros na tabela "emprestimos" com
-- valores correspondentes aos respectivos códigos em suas tabelas e
-- datas localizadas em pt-BR
--
CREATE TRIGGER emprestimos_facil_t0 INSTEAD OF INSERT ON emprestimos_facil
BEGIN
  INSERT INTO emprestimos_easy SELECT
    substr(new.data_emprestimo, 7, 4) || "-"
      || substr(new.data_emprestimo, 4, 2) || "-"
      || substr(new.data_emprestimo, 1, 2)
      || substr(new.data_emprestimo, 11),
    substr(new.data_devolucao, 7, 4) || "-"
      || substr(new.data_devolucao, 4, 2) || "-"
      || substr(new.data_devolucao, 1, 2)
      || substr(new.data_devolucao, 11),
    (SELECT code FROM bibliotecarios WHERE nome == new.bibliotecario),
    (SELECT code FROM leitores WHERE nome == new.leitor),
    (SELECT code FROM obras WHERE titulo == new.obra),
    new.exemplar,
    null;           --> força cálculo da "data limite" via trigger
END;

--
-- conveniência para atualização de registros na tabela "emprestimos" com
-- valores correspondentes aos respectivos códigos em suas tabelas e datas
-- localizadas em pt-BR
--
CREATE TRIGGER emprestimos_facil_t1 INSTEAD OF UPDATE ON emprestimos_facil
BEGIN
  UPDATE emprestimos SET
    data_emprestimo=substr(new.data_emprestimo, 7, 4) || "-"
      || substr(new.data_emprestimo, 4, 2) || "-"
      || substr(new.data_emprestimo, 1, 2) || substr(new.data_emprestimo, 11),
    data_devolucao=substr(new.data_devolucao, 7, 4) || "-"
      || substr(new.data_devolucao, 4, 2) || "-"
      || substr(new.data_devolucao, 1, 2) || substr(new.data_devolucao, 11),
    bibliotecario=(SELECT code FROM bibliotecarios
      WHERE nome == new.bibliotecario),
    leitor=(SELECT code FROM leitores WHERE nome == new.leitor),
    obra=(SELECT code FROM obras WHERE titulo == new.obra),
    exemplar=new.exemplar
  WHERE rowid == old.rowid;
END;

--
-- conveniência para excluir registros da tabela "emprestimos"
--
CREATE TRIGGER emprestimos_facil_t2 INSTEAD OF DELETE ON emprestimos_facil
BEGIN
  DELETE FROM emprestimos WHERE rowid == old.rowid;
END;

--
-- listagem de todos os empréstimos pendentes
--
CREATE VIEW IF NOT EXISTS emprestados AS
  SELECT leitor, obra, exemplar, date(data_emprestimo) AS data_emprestimo
  FROM emprestimos WHERE data_devolucao ISNULL;

--
-- listagem de empréstimos atrasados até a data corrente
--
CREATE VIEW IF NOT EXISTS atrasados AS
  SELECT emprestimos.rowid, strftime("%d-%m-%Y", data_emprestimo) AS
    data_emprestimo, strftime("%d-%m-%Y", data_limite) AS data_limite,
    leitores.nome AS leitor, telefone, email, titulo, autor, exemplar,
    CAST((today - julianday(data_limite)) AS INTEGER) AS atraso
  FROM (SELECT hoje, julianday(hoje) AS today
        FROM (SELECT date("now", "localtime") AS hoje)),
    emprestimos JOIN leitores ON emprestimos.leitor == leitores.code
    JOIN obras_facil ON emprestimos.obra == obras_facil.code
  WHERE data_devolucao ISNULL AND data_limite < hoje;

--
-- contabiliza as quantidades de exemplares de cada obra sob empréstimo
--
CREATE VIEW IF NOT EXISTS obras_emprestadas AS
  SELECT obra, count(1) AS N FROM emprestados GROUP BY obra ORDER BY obra;

--
-- listagem dos exemplares disponíveis para empréstimo
--
CREATE VIEW IF NOT EXISTS disponiveis_acervo AS
  SELECT * FROM acervo
  WHERE NOT EXISTS (SELECT 1 FROM emprestimos
    WHERE data_devolucao ISNULL
      AND emprestimos.obra == acervo.obra
      AND emprestimos.exemplar == acervo.exemplar);

--
-- listagem "conveniente" dos exemplares disponíveis para empréstimo
--
CREATE VIEW IF NOT EXISTS exemplares_disponiveis AS
  SELECT obra, titulo,
    ifnull(autores.nome || " + " || espirito, autores.nome) AS autores,
    generos.nome AS genero, exemplar, posicao, comentario
  FROM disponiveis_acervo
    JOIN obras ON disponiveis_acervo.obra == obras.code
    JOIN generos ON obras.genero == generos.code
    JOIN autores ON obras.autor == autores.code;

CREATE TABLE feriados_moveis (
  --
  -- feriados baseados na data da Páscoa: Carnaval, Paixão e Corpus Christi
  --
  -- importante: use a view "calc_feriados_moveis" para cálculo automático
  --             de data, com base na data da Páscoa do seu respectivo ano
  --

  data_feriado    DATE  --> ISO 8601
                  NOT NULL ON CONFLICT FAIL
                  PRIMARY KEY ON CONFLICT FAIL,

  comemoracao     TEXT  --> motivo da comemoração/homenagem
                  NOT NULL ON CONFLICT FAIL
                  COLLATE NOCASE,

  CONSTRAINT NOMES_FERIADOS_MOVEIS CHECK(       --> aceita somente os valores:
    glob("P[AÁaá]SCOA", upper(comemoracao))     --> "Páscoa", "Corpus Christi",
    OR glob("PAIX[AÃaã]O", upper(comemoracao))  --> "Paixão" ou "Carnaval",
    OR upper(comemoracao)                       --> indiferente ao uso de
      IN ("CARNAVAL", "CORPUS CHRISTI")         --> maiúsculas/minúsculas
  ) ON CONFLICT FAIL
);

CREATE VIEW calc_feriados_moveis AS SELECT * FROM feriados_moveis;

--
-- Calcula a data da "Páscoa" e outros feriados móveis; "Corpus Christi",
-- "Carnaval" e "Paixão", os quais são baseados na data da "Páscoa" que
-- necessariamente precisa ser calculada antes das demais datas, de ano
-- arbitrário no Calendário Gregoriano (a partir de 1583).
--
-- PSEUDO ARGUMENTOS (em ordem natural)
--
-- A coluna "data_feriado", do tipo DATE no padrão ISO-8601, utilizará
-- apenas o ANO, cujo valor default é o ano corrente, enquanto a coluna
-- "comemoracao" deve ser um dentre os valores: "Páscoa", "Carnaval",
-- "Paixão" e "Corpus Christi".
--
CREATE TRIGGER calc_feriados_moveis_t0 INSTEAD OF INSERT ON calc_feriados_moveis
BEGIN
  INSERT INTO feriados_moveis SELECT (
    SELECT CASE
    WHEN like('P_SCOA', new.comemoracao) THEN (
      SELECT ANO || '-' || substr(MES+100, 2) || '-' || substr(DIA+100, 2)
      FROM (
        SELECT ANO, n / 31 AS MES, (n % 31) + 1 AS DIA
        FROM (
          SELECT ANO, h + L - 7 * m + 114 AS n
          FROM (
            SELECT ANO, h, L, (a + 11 * (h + (L << 1))) / 451 AS m
            FROM (
              SELECT ANO, a, h, (32 + ((e + i) << 1) - h - k) % 7 AS L
              FROM (
                SELECT ANO, a, e, h, c >> 2 AS i, c % 4 AS k
                FROM (
                  SELECT ANO, a, e, c, (19 * a + b - d - g + 15) % 30 AS h
                  FROM (
                    SELECT ANO, a, b, c, d, e, (b - f + 1) / 3 AS g
                    FROM (
                      SELECT ANO, a, b, c, b >> 2 AS d, b%4 AS e, (b + 8) / 25 AS f
                      FROM (
                        SELECT ANO, ANO%19 AS a, ANO/100 AS b, ANO%100 AS c
                        FROM (
                          SELECT substr(
                            ifnull(new.data_feriado, date("now", "localtime")),
                            1, 4) + 0 AS ANO  --> evita cast & strftime
                        )
                      )
                    )
                  )
                )
              )
            )
          )
        )
      )
    )
    ELSE (
      date(
        (
          SELECT CASE
          WHEN EXISTS(
            SELECT 1 FROM feriados_moveis
            WHERE like('P_SCOA', comemoracao) AND like(pattern, data_feriado)
          ) THEN (
            SELECT data_feriado FROM feriados_moveis
            WHERE like('P_SCOA', comemoracao) AND like(pattern, data_feriado)
          )
          ELSE raise(ABORT, 'Não há registro da Data da Páscoa do ano.')
          END
          FROM (SELECT substr(new.data_feriado, 1, 4) || '%' AS pattern)
        ),
        (
          SELECT CASE
          WHEN upper(new.comemoracao) IS 'CARNAVAL'       THEN '-47 days'
          WHEN like('PAIX_O', new.comemoracao)            THEN  '-2 days'
          WHEN upper(new.comemoracao) IS 'CORPUS CHRISTI' THEN '+60 days'
          ELSE raise(ABORT, 'Valor da coluna "comemoracao" não é válido.')
          END
        )
      )
    )
    END
  ),
  new.comemoracao;
END;

CREATE TABLE feriados_fixos (

  data_feriado    DATE  --> ISO 8601
                  NOT NULL ON CONFLICT FAIL
                  PRIMARY KEY ON CONFLICT FAIL,

  comemoracao     TEXT  --> motivo da comemoração/homenagem
                  NOT NULL ON CONFLICT FAIL
                  COLLATE NOCASE
);

--
-- Subconjunto dos feriados móveis/fixos em que a biblioteca não funcionará,
-- considerados os dias da semana com atendimento, declarados na config.
--
CREATE VIEW feriados AS
  SELECT data_feriado, comemoracao
    FROM config, feriados_moveis
    WHERE (weekdays >> strftime("%w", data_feriado)) & 1
  UNION
  SELECT data_feriado, comemoracao
    FROM config, feriados_fixos
    WHERE (weekdays >> strftime("%w", data_feriado)) & 1;

INSERT INTO calc_feriados_moveis VALUES
  (strftime("%Y", "now", "localtime"), 'Páscoa'),
  (strftime("%Y", "now", "localtime"), 'Carnaval'),
  (strftime("%Y", "now", "localtime"), 'Paixão'),
  (strftime("%Y", "now", "localtime"), 'Corpus Christi');

INSERT INTO calc_feriados_moveis SELECT NEXT_YEAR, comemoracao
  FROM (SELECT strftime("%Y", "now", "localtime", "+1 year") AS NEXT_YEAR),
    feriados_moveis;

INSERT INTO feriados_fixos VALUES
  (strftime("%Y-01-01", "now", "localtime"), "Ano Novo"),
  (strftime("%Y-04-21", "now", "localtime"), "Tiradentes"),
  (strftime("%Y-05-01", "now", "localtime"), "Dia do Trabalho"),
  (strftime("%Y-09-07", "now", "localtime"), "Independência do Brasil"),
  (strftime("%Y-10-12", "now", "localtime"), "Nossa Senhora Aparecida"),
  (strftime("%Y-11-02", "now", "localtime"), "Finados"),
  (strftime("%Y-11-15", "now", "localtime"), "Proclamação da República"),
  (strftime("%Y-11-20", "now", "localtime"), "Dia da Consciência Negra"),
  (strftime("%Y-12-08", "now", "localtime"), "Nossa Senhora da Conceição"),
  (strftime("%Y-12-25", "now", "localtime"), "Natal");

INSERT INTO feriados_fixos SELECT NEXT_YEAR || substr(data_feriado, 5),
  comemoracao FROM (SELECT strftime("%Y", "now", "localtime", "+1 year") AS
  NEXT_YEAR), feriados_fixos;

COMMIT;

PRAGMA FOREIGN_KEYS = ON;   --> habilita integridade referencial

-- PREENCHIMENTO DAS TABELAS COM DADOS DE TESTE

create temp table t (c, n, e);
.import "autores.dat" t
update t set e=null where e == "";
insert into autores select * from t;
drop table t;

.import "obras.dat" obras

.import "acervo.dat" acervo
update acervo set comentario=null where comentario == "";

.import "bibliotecarios.dat" bibliotecarios

.import "leitores.dat" leitores

create temp table t (e, d, b, l, o, x, c);
.import "emprestimos.dat" t
update t set d=null where d == "";
update t set c=null;
insert into emprestimos_easy select * from t;
drop table t;