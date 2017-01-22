ATTACH "util.sqlite" AS util;

CREATE TEMPORARY VIEW dayoffs AS
  SELECT substr(dayNames, 1 + w * 3, 3) AS nomeDia, data_feriado, comemoracao
  FROM (
    SELECT "DOMSEGTERQUAQUISEXSAB" AS dayNames, weekdays FROM config
  ) JOIN (
    SELECT strftime("%w", data_feriado) AS w, * FROM feriados_moveis
  UNION
    SELECT strftime("%w", data_feriado) AS w, * FROM feriados_fixos
  )
  WHERE weekdays >> w & 1
  ORDER BY data_feriado;

-- DELETE FROM feriados;
-- INSERT INTO feriados SELECT data_feriado, comemoracao FROM dayoffs;

-- DETACH util;
-- DROP VIEW dayoffs;