CREATE VIEW IF NOT EXISTS emprestimos_easy AS
  SELECT emprestimos.rowid as rowid,
    strftime("%d-%m-%Y %H:%M:%S", data_emprestimo) AS data_emprestimo,
    strftime("%d-%m-%Y %H:%M:%S", data_devolucao) AS data_devolucao,
    emprestimos.bibliotecario AS bibliotecario_code,
    bibliotecarios.nome AS bibliotecario,
    emprestimos.leitor AS leitor_code,
    leitores.nome AS leitor,
    emprestimos.obra AS obra_code,
    obras.titulo AS obra,
    exemplar,
    comentario
  FROM emprestimos
    JOIN bibliotecarios ON (emprestimos.bibliotecario == bibliotecarios.code)
    JOIN leitores ON (emprestimos.leitor == leitores.code)
    JOIN obras ON (emprestimos.obra == obras.code);