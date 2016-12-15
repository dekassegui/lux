CREATE VIEW disponiveis_acervo AS
  SELECT *
  FROM acervo
  WHERE NOT EXISTS (
      SELECT 1
      FROM emprestimos
      WHERE data_devolucao isnull
        AND emprestimos.obra == acervo.obra
        AND emprestimos.exemplar == acervo.exemplar
    );