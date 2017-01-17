CREATE TEMP VIEW dayoffs AS
  SELECT
    dayoff, date(dayoff, prazo) AS critical_day
  FROM (
      SELECT "-" || substr(prazo, 2) AS prazo, weekdays FROM config
    ) JOIN (
      SELECT data_feriado AS dayoff,
        cast(strftime("%w", data_feriado) AS INTEGER) AS wday
      FROM feriados
    )
  WHERE (weekdays >> wday) & 1
  ORDER BY dayoff;