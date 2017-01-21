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
 *  Este software está licenciado em GNU Lesser General Public License,
 *  aka LGPL v.3, cujo texto está disponível em:
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

  data_feriado  DATE            --> ISO-8601
                NOT NULL
                PRIMARY KEY,

  comemoracao   TEXT            --> motivo da comemoração/homenagem
                NOT NULL
                COLLATE NOCASE
);

CREATE TRIGGER CHK_NEWREC_FERIADOS_MOVEIS BEFORE INSERT ON feriados_moveis
BEGIN
  SELECT CASE
  WHEN NOT (new.data_feriado GLOB "[0-9][0-9][0-9][0-9]"
      OR new.data_feriado GLOB "[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]")
    THEN raise(ABORT, "Formato ilegal da coluna 'data_feriado'.")
  WHEN cast(substr(new.data_feriado, 1, 4) AS INTEGER) < 1583
    THEN raise(ABORT, "Ano de 'data_feriado' < 1583.")
  WHEN NOT (soundex(new.comemoracao) IN (soundex("PÁSCOA"), soundex("PAIXÃO"))
      OR upper(new.comemoracao) IN ("CARNAVAL", "CORPUS CHRISTI"))
    THEN raise(ABORT, "Valor ilegal da coluna 'comemoracao'.")
  WHEN EXISTS(
      SELECT 1 FROM feriados_moveis WHERE
        length(new.comemoracao) == length(comemoracao)
        AND soundex(new.comemoracao) == soundex(comemoracao)
        AND length(data_feriado) == 10
        AND length(new.data_feriado) == 10
        AND substr(data_feriado, 1, 4) IS substr(new.data_feriado, 1, 4)
        AND data_feriado IS NOT new.data_feriado
    )
    THEN raise(ABORT, "O feriado/ano já está registrado com outra data.")
  END;
END;

/**
 * Calcula a data da "Páscoa" e dos feriados móveis obtidos em sua função:
 * "Carnaval", "Paixão", e "Corpus Christi", de qualquer ano arbitrário no
 * Calendário Gregoriano isto é; a partir de 1583. Se a data da Páscoa não
 * for requisitada explicitamente, então o será, prévia e automaticamente,
 * para atender a requisição das demais datas.
 *
 * Importante: As datas serão calculadas somente se o valor da coluna
 *             "data_feriado" for unicamente o ANO com 4 dígitos!
*/
CREATE TRIGGER COMPUTUS AFTER INSERT ON feriados_moveis
WHEN new.data_feriado GLOB "[0-9][0-9][0-9][0-9]"
BEGIN

  DELETE FROM feriados_moveis
  WHERE data_feriado IS new.data_feriado
    AND soundex(new.comemoracao) IS soundex("PÁSCOA");

  INSERT OR IGNORE INTO feriados_moveis VALUES ((
      SELECT date(dia, "+" || (7 - strftime("%w", dia)) || " days")
      FROM (
        SELECT new.data_feriado ||
          substr("-04-14-04-03-03-23-04-11-03-31-04-18-04-08-03-28-04-16-04-05-03-25-04-13-04-02-03-22-04-10-03-30-04-17-04-07-03-27",
            1 + (new.data_feriado % 19) * 6, 6) AS dia
      )
    ), "Páscoa");

  UPDATE feriados_moveis SET data_feriado = (
    date(
      (
        SELECT data_feriado
        FROM (
          SELECT soundex("PÁSCOA") as SDX, new.data_feriado || "%" AS PAT
        ) JOIN feriados_moveis
        WHERE soundex(comemoracao) IS SDX AND like(PAT, data_feriado)
      ), (
        SELECT CASE
        WHEN upper(new.comemoracao) IS "CARNAVAL" THEN "-47 days"
        WHEN soundex(new.comemoracao) IS soundex("PAIXÃO") THEN "-2 days"
        WHEN upper(new.comemoracao) IS "CORPUS CHRISTI" THEN "+60 days"
        ELSE raise(IGNORE)
        END
      )
    )
  )
  WHERE data_feriado IS new.data_feriado;

END;

INSERT INTO feriados_moveis VALUES
  -- (strftime("%Y", "now", "localtime"), "Páscoa"), --> desnecessário
  (strftime("%Y", "now", "localtime"), "Carnaval"),
  (strftime("%Y", "now", "localtime"), "Paixão"),
  (strftime("%Y", "now", "localtime"), "Corpus Christi");

INSERT INTO feriados_moveis
  SELECT NEXT_YEAR, comemoracao
  FROM (
    SELECT strftime("%Y", "now", "localtime", "+1 year") AS NEXT_YEAR
  ) JOIN feriados_moveis;

CREATE TABLE feriados_fixos (

  data_feriado  DATE            --> ISO-8601
                NOT NULL
                PRIMARY KEY,

  comemoracao   TEXT            --> motivo da comemoração/homenagem
                NOT NULL
                COLLATE NOCASE
);

CREATE TRIGGER CHK_NEWREC_FERIADOS_FIXOS BEFORE INSERT ON feriados_fixos
BEGIN
  SELECT CASE
  WHEN NOT new.data_feriado GLOB "[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]"
    THEN raise(ABORT, "Formato ilegal da coluna 'data_feriado'.")
  WHEN EXISTS(
      SELECT 1 FROM feriados_fixos WHERE
        length(new.comemoracao) == length(comemoracao)
        AND soundex(new.comemoracao) == soundex(comemoracao)
        AND length(new.comemoracao) == length(comemoracao)
        AND length(data_feriado) == 10
        AND length(new.data_feriado) == 10
        AND substr(data_feriado, 1, 4) IS substr(new.data_feriado, 1, 4)
        AND data_feriado IS NOT new.data_feriado
    )
    THEN raise(ABORT, "O feriado/ano já está registrado com outra data.")
  END;
END;

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