/**
 * Exclui todos os registros de empréstimos finalizados e em seguida refaz a
 * sequência contínua dos "rowid" dos registros da tabela, esvaziando-a para
 * imediatamente preenchê-la com todos registros de sua cópia, ordenados por
 * valores relativos.
*/
BEGIN TRANSACTION;

DELETE FROM emprestimos WHERE data_devolucao NOTNULL;

PRAGMA foreign_keys=OFF;
DROP TRIGGER KASHITENAI;

CREATE TEMP TABLE t AS
  SELECT emprestimos.*
  FROM emprestimos
    JOIN leitores ON (emprestimos.leitor == leitores.code)
    JOIN obras ON (emprestimos.obra == obras.code)
  ORDER BY data_emprestimo, leitores.nome, obras.titulo;

DELETE FROM emprestimos;
INSERT INTO emprestimos_calc SELECT * FROM t;
REINDEX emprestimos;

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

-- PRAGMA foreign_keys=ON;

COMMIT;