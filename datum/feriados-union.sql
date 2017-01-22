ATTACH "util.sqlite" AS util;

CREATE TEMPORARY VIEW dayoffs AS
  SELECT substr("DOMSEGTERQUAQUISEXSAB", 1+w*3, 3) AS dayname,
    data_feriado, comemoracao
  FROM (
    SELECT strftime("%w", data_feriado) AS w, *
    FROM config, feriados_moveis
    WHERE weekdays >> w & 1
  UNION
    SELECT strftime("%w", data_feriado) AS w, *
    FROM config, feriados_fixos
    WHERE weekdays >> w & 1
  )
  ORDER BY data_feriado;

DELETE FROM feriados;

INSERT INTO feriados SELECT data_feriado, comemoracao FROM dayoffs;

DETACH util;

DROP VIEW dayoffs;