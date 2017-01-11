CREATE TABLE IF NOT EXISTS feriados (

  data        DATE          -- ISO 8859-1
              NOT NULL
              PRIMARY KEY,

  comemoracao TEXT
              NOT NULL
              COLLATE NOCASE
);

CREATE VIEW IF NOT EXISTS feriados_facil AS
  SELECT (
    SELECT CASE CAST(substr(rawData, 1) AS INTEGER)
      WHEN 0 THEN 'Domingo'   WHEN 1 THEN 'Segunda'   WHEN 2 THEN 'Terça'
      WHEN 3 THEN 'Quarta'    WHEN 4 THEN 'Quinta'    WHEN 5 THEN 'Sexta'
      ELSE 'Sábado'
    END
  ) || ' ' || substr(rawData, 3) AS data, comemoracao
  FROM (
    SELECT strftime('%w %d-%m-%Y', data) AS rawData, comemoracao
    FROM feriados
    ORDER BY data ASC
  );

.import 'feriados-2017.dat' feriados