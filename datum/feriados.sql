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

.import 'feriados-2017.dat' feriadosCREATE VIEW feriados_facil AS
  SELECT (
    SELECT CASE CAST(substr(rawDate, 1, 1) AS INTEGER)
      WHEN 0 THEN "Domingo"   WHEN 1 THEN "Segunda"   WHEN 2 THEN "Terça"
      WHEN 3 THEN "Quarta"    WHEN 4 THEN "Quinta"    WHEN 5 THEN "Sexta"
      ELSE "Sábado"
    END
  ) || substr(rawDate, 2) AS data, comemoracao
  FROM (
    SELECT strftime("%w %d-%m-%Y", data) AS rawDate, comemoracao
    FROM feriados
    ORDER BY data ASC
  );
CREATE TRIGGER feriados_facil_t0 INSTEAD OF INSERT ON feriados_facil
BEGIN
  INSERT INTO feriados SELECT (SELECT substr(new.data, 7)
    || substr(new.data, 3, 4) || substr(new.data, 1, 2)), new.comemoracao;
END;
CREATE TRIGGER feriados_facil_t1 INSTEAD OF UPDATE OF data ON feriados_facil
BEGIN
  UPDATE feriados SET data=(SELECT substr(new.data, 7)
    || substr(new.data, 3, 4) || substr(new.data, 1, 2))
  WHERE comemoracao == old.comemoracao;
END;
