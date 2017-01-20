DROP TABLE IF EXISTS moonDays;
DROP TABLE IF EXISTS feriados_moveis;
DROP TABLE IF EXISTS feriados_fixos;

BEGIN TRANSACTION;

CREATE TABLE moonDays (mesDia TEXT NOT NULL);

INSERT INTO moonDays VALUES
  ("-04-14"), ("-04-03"), ("-03-23"), ("-04-11"),
  ("-03-31"), ("-04-18"), ("-04-08"), ("-03-28"),
  ("-04-16"), ("-04-05"), ("-03-25"), ("-04-13"),
  ("-04-02"), ("-03-22"), ("-04-10"), ("-03-30"),
  ("-04-17"), ("-04-07"), ("-03-27");

CREATE TRIGGER moonDays_t0 BEFORE DELETE ON moonDays
BEGIN
  SELECT raise(ABORT, "Table is READONLY.");
END;

CREATE TRIGGER moonDays_t1 BEFORE INSERT ON moonDays
BEGIN
  SELECT raise(ABORT, "Table is READONLY.");
END;

CREATE TRIGGER moonDays_t2 BEFORE UPDATE ON moonDays
BEGIN
  SELECT raise(ABORT, "Table is READONLY.");
END;

CREATE TABLE feriados_moveis (

  data_feriado  DATE            --> ISO-8601
                NOT NULL
                PRIMARY KEY,

  comemoracao   TEXT            --> motivo da comemoração/homenagem
                NOT NULL
                COLLATE NOCASE
);

CREATE TRIGGER FERIADOS_MOVEIS_T0 BEFORE INSERT ON feriados_moveis
BEGIN
  SELECT CASE
  WHEN NOT (new.data_feriado GLOB "[0-9][0-9][0-9][0-9]"
      OR new.data_feriado GLOB "[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]")
    THEN raise(ABORT, "Formato ilegal da coluna 'data_feriado'.")
  WHEN cast(substr(new.data_feriado, 1, 4) AS INTEGER) < 1583
    THEN raise(ABORT, "Ano de 'data_feriado' < 1583.")
  WHEN NOT (glob("P[Áá]SCOA", upper(new.comemoracao))
      OR glob("PAIX[Ãã]O", upper(new.comemoracao))
      OR upper(new.comemoracao) IN ("CARNAVAL", "CORPUS CHRISTI"))
    THEN raise(ABORT, "Valor ilegal da coluna 'comemoracao'.")
  END;
END;

/**
 * Calcula a data da "Páscoa" e outros feriados móveis; "Corpus Christi",
 * "Carnaval" e "Paixão", os quais são baseados na data da "Páscoa" que
 * necessariamente precisa ser calculada antes das demais datas, de ano
 * arbitrário no Calendário Gregoriano (a partir de 1583).
 *
 * Importante: As datas serão calculadas somente se o valor da coluna
 *            "data_feriado" for unicamente o ANO com 4 dígitos!
*/
CREATE TRIGGER COMPUTUS AFTER INSERT ON feriados_moveis
WHEN new.data_feriado GLOB "[0-9][0-9][0-9][0-9]"
BEGIN
  UPDATE feriados_moveis SET data_feriado = (
    SELECT CASE
    WHEN like('P_SCOA', new.comemoracao) THEN (
      SELECT date(dia, "+" || (7 - strftime("%w", dia)) || " days")
      FROM (
        SELECT new.data_feriado || (
            SELECT mesDia FROM moonDays
            WHERE rowid == ((new.data_feriado % 19) + 1)
          ) AS dia
      )
    ) ELSE (
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
          FROM (SELECT new.data_feriado || '%' AS pattern)
        ),
        (
          SELECT CASE
          WHEN upper(new.comemoracao) IS 'CARNAVAL'       THEN '-47 days'
          WHEN like('PAIX_O', new.comemoracao)            THEN  '-2 days'
          WHEN upper(new.comemoracao) IS 'CORPUS CHRISTI' THEN '+60 days'
          END
        )
      )
    )
    END
  )
  WHERE data_feriado IS new.data_feriado;
END;

INSERT INTO feriados_moveis VALUES
  (strftime("%Y", "now", "localtime"), 'Páscoa'),
  (strftime("%Y", "now", "localtime"), 'Carnaval'),
  (strftime("%Y", "now", "localtime"), 'Paixão'),
  (strftime("%Y", "now", "localtime"), 'Corpus Christi');

INSERT INTO feriados_moveis
  SELECT NEXT_YEAR, comemoracao
  FROM (
    SELECT strftime("%Y", "now", "localtime", "+1 year") AS NEXT_YEAR
  ) JOIN feriados_moveis;

CREATE TABLE feriados_fixos (

  data_feriado    DATE                --> ISO-8601
                  NOT NULL
                  PRIMARY KEY,

  comemoracao     TEXT                --> motivo da comemoração/homenagem
                  NOT NULL
                  COLLATE NOCASE
);

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

INSERT INTO feriados_fixos
  SELECT NEXT_YEAR || substr(data_feriado, 5), comemoracao
  FROM (
    SELECT strftime("%Y", "now", "localtime", "+1 year") AS NEXT_YEAR
  ) JOIN feriados_fixos;

COMMIT;