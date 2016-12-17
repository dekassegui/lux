CREATE VIEW obras_facil AS
  SELECT obras.code, obras.titulo,
    ifnull(autores.nome||' & '||autores.espirito, autores.nome) AS autor,
    generos.nome AS genero
  FROM obras JOIN autores ON obras.autor == autores.code
    JOIN generos ON obras.genero == generos.code;

CREATE VIEW acervo_facil AS
  SELECT obra, exemplar, posicao, comentario, titulo, autor, genero
  FROM acervo JOIN obras_facil ON acervo.obra == obras_facil.code;

CREATE VIEW emprestimos_facil AS
  SELECT emprestimos.rowid AS rowid, bibliotecarios.nome AS bibliotecario,
    data_emprestimo, data_devolucao, leitores.nome AS leitor, titulo AS obra,
    autor, emprestimos.exemplar AS exemplar, posicao,
    emprestimos.comentario AS comentario
  FROM emprestimos
    JOIN bibliotecarios ON (emprestimos.bibliotecario == bibliotecarios.code)
    JOIN leitores ON (emprestimos.leitor == leitores.code)
    JOIN acervo_facil AS af ON (emprestimos.obra == af.obra
      AND emprestimos.exemplar == af.exemplar);