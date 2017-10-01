/**
 *  Parte do Projeto LUX, em desenvolvimento desde 12 de novembro de 2016.
 *
 *  Contém implementação do "Cálculo da Páscoa" pelo método tabular para
 *  datas no calendário Gregoriano, descrito em "Computus":
 *
 *      https://en.wikipedia.org/wiki/Computus#Gregorian_calendar
 *
 *  com adequações para o SQLite 3.7.13 ou mais recente, privilegiando o
 *  uso de datas no padrão ISO-8601.
 *
 * ===========================================================================
 *
 *  Este software está licenciado sob GNU Lesser General Public License v3,
 *  aka LGPL v3, cujo texto está disponível em:
 *
 *      https://www.gnu.org/licenses/lgpl-3.0.html
 *
 *        Concepção: Aguinaldo Antonietto
 *  Desenvolvimento: Antonio Sergio Ando
 *
 *                      "Vita sine spe non felix est."
 *
 * ===========================================================================
*/

DROP TABLE IF EXISTS feriados_moveis;
DROP TABLE IF EXISTS feriados_fixos;

BEGIN TRANSACTION;

CREATE TABLE feriados_moveis (

  data_feriado  DATE      --> ISO-8601
                NOT NULL
                PRIMARY KEY,

  nome_feriado  TEXT
                NOT NULL
                COLLATE NOCASE,

  -- checa se o valor de "data_feriado" segue um dos padrões esperados:
  -- apenas ANO com 4 dígitos (inicio do cálculo) ou DATA conforme ISO-8601
  CONSTRAINT chk_date_format CHECK(
      data_feriado GLOB "[0-9][0-9][0-9][0-9]"
      OR data_feriado GLOB "[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]")
    ON CONFLICT ABORT,

  -- checa se o ANO de "data_feriado" está contido no calendário Gregoriano
  CONSTRAINT chk_calendar CHECK(
      CAST(substr(data_feriado, 1, 4) AS INTEGER) >= 1583)
    ON CONFLICT ABORT,

  -- checa se "nome_feriado" é um dentre: "Páscoa", "Carnaval", "Paixão"
  -- ou "Corpus Christi", indiferente ao uso de maiúsculas/minúsculas
  CONSTRAINT chk_name CHECK(
      UPPER(nome_feriado) IN (
        "CARNAVAL", "CORPUS CHRISTI", "PáSCOA", "PÁSCOA", "PAIXãO", "PAIXÃO"))
    ON CONFLICT ABORT
);

/**
 * Computa a data da Páscoa e dos feriados móveis obtidos em sua função:
 * Carnaval, Paixão, e Corpus Christi, de qualquer ano arbitrário no
 * Calendário Gregoriano isto é; a partir de 1583.
 *
 * Importante: As datas serão calculadas somente se o valor da coluna
 *             "data_feriado" for unicamente o ANO com 4 dígitos!
*/
CREATE TRIGGER COMPUTUS AFTER INSERT ON feriados_moveis
WHEN new.data_feriado GLOB "[0-9][0-9][0-9][0-9]" --> YYYY
BEGIN

  INSERT INTO feriados_moveis VALUES (
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

  INSERT INTO feriados_moveis
    SELECT date(Pascoa, dias), feriado
    FROM (
      SELECT data_feriado as Pascoa
      FROM feriados_moveis WHERE ROWID == last_insert_rowid()
    ) JOIN (
      SELECT "Carnaval" AS feriado, "-47 days" AS dias
      UNION SELECT "Paixão" AS feriado, "-2 days" AS dias
      UNION SELECT "Corpus Christi" AS feriado, "+60 days" AS dias
    );

END;

CREATE TRIGGER AFTER_COMPUTUS AFTER INSERT ON feriados_moveis
WHEN new.data_feriado GLOB "[0-9][0-9][0-9][0-9]" --> YYYY
BEGIN
  DELETE FROM feriados_moveis WHERE data_feriado IS new.data_feriado;
END;

INSERT INTO feriados_moveis SELECT ANO_CORRENTE+N, "Páscoa"
  FROM (
    SELECT strftime("%Y", "now", "localtime") ANO_CORRENTE
  ) JOIN (
    SELECT 0 N UNION SELECT 1 N
  );

CREATE TABLE feriados_fixos (

  data_feriado  DATE        --> ISO-8601
                NOT NULL
                PRIMARY KEY,

  nome_feriado  TEXT
                NOT NULL
                COLLATE NOCASE,

  -- checa se o valor de "data_feriado" segue um dos padrões esperados:
  -- apenas ANO com 4 dígitos (inicio do cálculo) ou DATA conforme ISO-8601
  CONSTRAINT chk_date_format CHECK(
      data_feriado GLOB "[0-9][0-9][0-9][0-9]"
      OR data_feriado GLOB "[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]")
    ON CONFLICT ABORT
);

/**
 * Preenche a tabela dos feriados fixos com os registros dos 10 feriados
 * nacionais reconhecidos oficialmente, atualizando a coluna "nome_feriado"
 * dos registros com datas coincidentes com as já existentes.
 *
 * Importante: As datas serão preenchidas somente se o valor da coluna
 *             "data_feriado" for unicamente o ANO com 4 dígitos!
*/
CREATE TRIGGER PREENCHE_FERIADOS_FIXOS AFTER INSERT ON feriados_fixos
WHEN new.data_feriado GLOB "[0-9][0-9][0-9][0-9]" --> YYYY
BEGIN

  DELETE FROM feriados_fixos WHERE data_feriado == new.data_feriado;

  INSERT OR REPLACE INTO feriados_fixos
    SELECT new.data_feriado || sufixo, nome_feriado
    FROM (
      SELECT "-01-01" sufixo, "Ano Novo" nome_feriado
      UNION SELECT "-04-21" sufixo, "Tiradentes" nome_feriado
      UNION SELECT "-05-01" sufixo, "Dia do Trabalho" nome_feriado
      UNION SELECT "-09-07" sufixo, "Independência do Brasil" nome_feriado
      UNION SELECT "-10-12" sufixo, "Nossa Senhora Aparecida" nome_feriado
      UNION SELECT "-11-02" sufixo, "Finados" nome_feriado
      UNION SELECT "-11-15" sufixo, "Proclamação da República" nome_feriado
      UNION SELECT "-11-20" sufixo, "Dia da Consciência Negra" nome_feriado
      UNION SELECT "-12-08" sufixo, "Nossa Senhora da Conceição" nome_feriado
      UNION SELECT "-12-25" sufixo, "Natal" nome_feriado
    );

END;

INSERT INTO feriados_fixos SELECT ANO_CORRENTE+N, "DUMMY_VALUE"
  FROM (
    SELECT strftime("%Y", "now", "localtime") ANO_CORRENTE
  ) JOIN (
    SELECT 0 N UNION SELECT 1 N
  );

COMMIT;
