PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE autores (
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
CREATE TABLE generos (
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
CREATE TABLE obras (
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
CREATE TABLE acervo (
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
CREATE TABLE bibliotecarios (
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
CREATE TABLE leitores (
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
CREATE TABLE config (
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
CREATE TABLE emprestimos (
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
CREATE TABLE _feriados (
  --
  -- tabela dos feriados móveis e fixos
  --

  data_feriado  DATE        --> ISO 8601
                NOT NULL,

  nome_feriado  TEXT
                NOT NULL
                COLLATE NOCASE,

  CONSTRAINT unicity UNIQUE(data_feriado, nome_feriado) ON CONFLICT IGNORE
);
CREATE INDEX acervo_obra_ndx ON acervo(obra);
CREATE INDEX data_emprestimo_ndx ON emprestimos(data_emprestimo ASC);
CREATE INDEX data_devolucao_ndx ON emprestimos(data_devolucao ASC);
CREATE INDEX leitor_ndx ON emprestimos(leitor);
CREATE UNIQUE INDEX autores_ndx ON autores(nome, espirito);
CREATE UNIQUE INDEX acervo_ndx ON acervo(obra, exemplar);
CREATE TRIGGER autores_t0 AFTER INSERT ON autores
WHEN (trim(new.nome) <> new.nome)
  OR (new.espirito NOTNULL AND (trim(new.espirito) <> new.espirito))
BEGIN
  UPDATE autores SET nome=trim(new.nome)
    WHERE nome == new.nome;
  UPDATE autores SET espirito=trim(new.espirito)
    WHERE espirito NOTNULL AND (espirito == new.espirito);
END;
CREATE TRIGGER autores_t1 AFTER UPDATE OF nome, espirito ON autores
WHEN (trim(new.nome) <> new.nome)
  OR (new.espirito NOTNULL AND (trim(new.espirito) <> new.espirito))
BEGIN
  UPDATE autores SET nome=trim(new.nome)
    WHERE nome == new.nome;
  UPDATE autores SET espirito=trim(new.espirito)
    WHERE espirito NOTNULL AND (espirito == new.espirito);
END;
CREATE TRIGGER autores_t2 AFTER INSERT ON autores
WHEN new.nome glob "*  *"
BEGIN
  UPDATE autores SET nome=replace(new.nome, "  ", " ") WHERE nome == new.nome;
END;
CREATE TRIGGER autores_t3 AFTER UPDATE OF nome ON autores
WHEN new.nome glob "*  *"
BEGIN
  UPDATE autores SET nome=replace(new.nome, "  ", " ") WHERE nome == new.nome;
END;
CREATE TRIGGER autores_t4 AFTER INSERT ON autores
WHEN (new.espirito NOTNULL) AND (new.espirito glob "*  *")
BEGIN
  UPDATE autores SET espirito=replace(new.espirito, "  ", " ")
    WHERE espirito == new.espirito;
END;
CREATE TRIGGER autores_t5 AFTER UPDATE OF espirito ON autores
WHEN (new.espirito NOTNULL) AND (new.espirito glob "*  *")
BEGIN
  UPDATE autores SET espirito=replace(new.espirito, "  ", " ")
    WHERE espirito == new.espirito;
END;
CREATE VIEW scribas AS
  select code, ifnull(nome || " + " || espirito, nome) as autores from autores;
CREATE TRIGGER obras_t0 AFTER INSERT ON obras
WHEN trim(new.titulo) <> new.titulo
BEGIN
  UPDATE obras SET titulo=trim(new.titulo) WHERE titulo == new.titulo;
END;
CREATE TRIGGER obras_t1 AFTER UPDATE OF titulo ON obras
WHEN trim(new.titulo) <> new.titulo
BEGIN
  UPDATE obras SET titulo=trim(new.titulo) WHERE titulo == new.titulo;
END;
CREATE TRIGGER obras_t2 AFTER INSERT ON obras
WHEN new.titulo glob "*  *"
BEGIN
  UPDATE obras SET titulo=replace(new.titulo, "  ", " ")
    WHERE titulo == new.titulo;
END;
CREATE TRIGGER obras_t3 AFTER UPDATE OF titulo ON obras
WHEN new.titulo glob "*  *"
BEGIN
  UPDATE obras SET titulo=replace(new.titulo, "  ", " ")
    WHERE titulo == new.titulo;
END;
CREATE VIEW obras_facil AS
  SELECT obras.rowid, obras.code, obras.titulo,
    scribas.autores AS autor, generos.nome AS genero
  FROM obras JOIN scribas ON obras.autor == scribas.code
    JOIN generos ON obras.genero == generos.code;
CREATE TRIGGER obras_facil_t0 INSTEAD OF INSERT ON obras_facil
BEGIN
  INSERT INTO obras SELECT
    new.code,
    new.titulo,
    (SELECT code FROM scribas WHERE scribas.autores == new.autor),
    (SELECT code FROM generos WHERE generos.nome == new.genero);
END;
CREATE TRIGGER obras_facil_t1 INSTEAD OF UPDATE ON obras_facil
BEGIN
  UPDATE obras SET
    code=new.code,
    titulo=new.titulo,
    autor=(SELECT code FROM scribas WHERE scribas.autores == new.autor),
    genero=(SELECT code FROM generos WHERE generos.nome == new.genero)
  WHERE rowid == old.rowid;
END;
CREATE TRIGGER obras_facil_t2 INSTEAD OF DELETE ON obras_facil
BEGIN
  DELETE FROM obras WHERE rowid == old.rowid;
END;
CREATE TRIGGER acervo_t0 AFTER INSERT ON acervo
WHEN trim(new.exemplar) <> new.exemplar
BEGIN
  UPDATE acervo SET exemplar=trim(new.exemplar) WHERE exemplar == new.exemplar;
END;
CREATE TRIGGER acervo_t1 AFTER UPDATE OF exemplar ON acervo
WHEN trim(new.exemplar) <> new.exemplar
BEGIN
  UPDATE acervo SET exemplar=trim(new.exemplar) WHERE exemplar == new.exemplar;
END;
CREATE VIEW conta_obras_acervo AS
  SELECT obra, count(1) AS N FROM acervo GROUP BY obra ORDER BY obra;
CREATE VIEW acervo_facil AS
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
CREATE TRIGGER bibliotecarios_t0 AFTER INSERT ON bibliotecarios
WHEN trim(new.nome) <> new.nome
BEGIN
  UPDATE bibliotecarios SET nome=trim(new.nome) WHERE nome == new.nome;
END;
CREATE TRIGGER bibliotecarios_t1 AFTER UPDATE OF nome ON bibliotecarios
WHEN trim(new.nome) <> new.nome
BEGIN
  UPDATE bibliotecarios SET nome=trim(new.nome) WHERE nome == new.nome;
END;
CREATE TRIGGER bibliotecarios_t2 AFTER INSERT ON bibliotecarios
WHEN new.nome glob "*  *"
BEGIN
  UPDATE bibliotecarios SET nome=replace(new.nome, "  ", " ")
    WHERE nome == new.nome;
END;
CREATE TRIGGER bibliotecarios_t3 AFTER UPDATE OF nome ON bibliotecarios
WHEN new.nome glob "*  *"
BEGIN
  UPDATE bibliotecarios SET nome=replace(new.nome, "  ", " ")
    WHERE nome == new.nome;
END;
CREATE TRIGGER leitores_t0 AFTER INSERT ON leitores
WHEN trim(new.nome) <> new.nome
BEGIN
  UPDATE leitores SET nome=trim(new.nome) WHERE nome == new.nome;
END;
CREATE TRIGGER leitores_t1 AFTER UPDATE OF nome ON leitores
WHEN trim(new.nome) <> new.nome
BEGIN
  UPDATE leitores SET nome=trim(new.nome) WHERE nome == new.nome;
END;
CREATE TRIGGER leitores_t2 AFTER INSERT ON leitores
WHEN new.nome glob "*  *"
BEGIN
  UPDATE leitores SET nome=replace(new.nome, "  ", " ") WHERE nome == new.nome;
END;
CREATE TRIGGER leitores_t3 AFTER UPDATE OF nome ON leitores
WHEN new.nome glob "*  *"
BEGIN
  UPDATE leitores SET nome=replace(new.nome, "  ", " ") WHERE nome == new.nome;
END;
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
CREATE TRIGGER config_facil_t0 INSTEAD OF UPDATE ON config_facil
BEGIN
  UPDATE config SET prazo=("+" || CAST(new.prazo AS INTEGER) || " days"),
    pendencias=new.pendencias, weekdays=new.weekdays;
END;
CREATE VIEW emprestimos_calc AS SELECT * FROM emprestimos;
CREATE TRIGGER emprestimos_calc_t0 INSTEAD OF INSERT ON emprestimos_calc
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
END
;
CREATE VIEW emprestimos_facil AS
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
      SELECT rtrim(substr("DomingoSegundaTerça++Quarta+Quinta+Sexta++Sábado",
        1 + substr(rawDate, 1, 1) * 7, 7), "+") || substr(rawDate, 2)
      FROM (SELECT strftime("%w %d-%m-%Y.", data_limite) AS rawDate)
    ) AS comentario
  FROM emprestimos
    JOIN bibliotecarios ON (emprestimos.bibliotecario == bibliotecarios.code)
    JOIN leitores ON (emprestimos.leitor == leitores.code)
    JOIN acervo_facil ON (
      emprestimos.obra == acervo_facil.code
      AND emprestimos.exemplar == acervo_facil.exemplar);
CREATE TRIGGER emprestimos_facil_t0 INSTEAD OF INSERT ON emprestimos_facil
BEGIN
  INSERT INTO emprestimos_calc SELECT
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
END
;
CREATE TRIGGER emprestimos_facil_t2 INSTEAD OF DELETE ON emprestimos_facil
BEGIN
  DELETE FROM emprestimos WHERE rowid == old.rowid;
END;
CREATE VIEW emprestados AS
  SELECT leitor, obra, exemplar, date(data_emprestimo) AS data_emprestimo
  FROM emprestimos WHERE data_devolucao ISNULL;
CREATE VIEW obras_emprestadas AS
  SELECT obra, count(1) AS N FROM emprestados GROUP BY obra ORDER BY obra;
CREATE VIEW disponiveis_acervo AS
  SELECT * FROM acervo
  WHERE NOT EXISTS (SELECT 1 FROM emprestimos
    WHERE data_devolucao ISNULL
      AND emprestimos.obra == acervo.obra
      AND emprestimos.exemplar == acervo.exemplar);
CREATE VIEW exemplares_disponiveis AS
  SELECT obra, titulo, scribas.autores,
    generos.nome AS genero, exemplar, posicao, comentario
  FROM disponiveis_acervo
    JOIN obras ON disponiveis_acervo.obra == obras.code
    JOIN generos ON obras.genero == generos.code
    JOIN scribas ON obras.autor == scribas.code;
CREATE TRIGGER emprestimos_facil_t1 INSTEAD OF UPDATE ON emprestimos_facil
BEGIN
  DELETE FROM emprestimos WHERE rowid == old.rowid;
  INSERT INTO emprestimos_calc SELECT
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
    null;
END;
CREATE TRIGGER generos_t1 BEFORE DELETE ON generos
BEGIN
  SELECT raise(ABORT, "Não delete registros desta tabela.");
END;
CREATE TRIGGER generos_t2 BEFORE UPDATE ON generos
BEGIN
  SELECT raise(ABORT, "Não edite registros desta tabela.");
END;
CREATE VIEW atrasados AS
  SELECT emprestimos.rowid AS rowid, strftime("%d-%m-%Y", data_emprestimo)
    AS data_emprestimo, strftime("%d-%m-%Y", data_limite) AS data_limite,
    leitores.nome AS leitor, telefone, email, titulo, autor, exemplar,
    CAST((today - julianday(data_limite)) AS INTEGER) AS atraso
  FROM (SELECT hoje, julianday(hoje) AS today
        FROM (SELECT date("now", "localtime") AS hoje)),
    emprestimos JOIN leitores ON emprestimos.leitor == leitores.code
    JOIN obras_facil ON emprestimos.obra == obras_facil.code
  WHERE data_devolucao ISNULL AND atraso > 0 ORDER BY atraso ASC;
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
CREATE TRIGGER _feriados_t0 BEFORE INSERT ON _feriados
WHEN new.data_feriado GLOB "[0-9][0-9][0-9][0-9]" --> ano 4 dígitos
BEGIN

  INSERT INTO _feriados VALUES ( --> COMPUTUS
    (
      SELECT date(dia, "+" || (7 - strftime("%w", dia)) || " days")
      FROM (
        SELECT new.data_feriado ||
          substr("-04-14-04-03-03-23-04-11-03-31-04-18-04-08-03-28-04-16-04-05-03-25-04-13-04-02-03-22-04-10-03-30-04-17-04-07-03-27",
            1 + (new.data_feriado % 19) * 6, 6) AS dia
      )
    ),
    "Páscoa"
  );

  INSERT INTO _feriados
    SELECT date(EASTER, dias), feriado  --> feriados baseados na Páscoa
    FROM (
      SELECT data_feriado AS EASTER
      FROM _feriados WHERE nome_feriado IS "Páscoa"
        AND substr(data_feriado, 1, 4) == new.data_feriado
    ) JOIN (
      SELECT "Carnaval" AS feriado, "-47 days" AS dias
      UNION SELECT "Paixão" AS feriado, "-2 days" AS dias
      UNION SELECT "Corpus Christi" AS feriado, "+60 days" AS dias
    );

  INSERT INTO _feriados
    SELECT new.data_feriado || sufixo, feriado  --> feriados nacionais
    FROM (
      SELECT "-01-01" AS sufixo, "Ano Novo" AS feriado
      UNION SELECT "-04-21" AS sufixo, "Tiradentes" AS feriado
      UNION SELECT "-05-01" AS sufixo, "Dia do Trabalho" AS feriado
      UNION SELECT "-09-07" AS sufixo, "Independência do Brasil" AS feriado
      UNION SELECT "-10-12" AS sufixo, "Nossa Senhora Aparecida" AS feriado
      UNION SELECT "-11-02" AS sufixo, "Finados" AS feriado
      UNION SELECT "-11-15" AS sufixo, "Proclamação da República" AS feriado
      UNION SELECT "-11-20" AS sufixo, "Dia da Consciência Negra" AS feriado
      UNION SELECT "-12-08" AS sufixo, "Nossa Senhora da Conceição" AS feriado
      UNION SELECT "-12-25" AS sufixo, "Natal" AS feriado
    );

  SELECT RAISE(IGNORE);   --> cancela inserção de registro dummy

END
;
CREATE VIEW feriados AS
  SELECT data_feriado, nome_feriado
  FROM (SELECT weekdays FROM config) CROSS JOIN
    (SELECT strftime("%w", data_feriado) AS w, * FROM _feriados)
  WHERE (weekdays >> w) & 1
  ORDER BY data_feriado;
COMMIT;
