/*
 * Montagem da tabela de feriados, essencial para o cálculo de datas limite de
 * empréstimo no LUX, resultante da união das tabelas de feriados móveis e da
 * tabela de feriados fixos.
 *
 * Este script deve ser executado dentro do db que contém as tabelas de feriados
 * móveis e fixos, usualmente em "util.sqlite", pelo qual o script "criaDB.sql"
 * copiará a tabela de feriados.
*/
-- .read "feriados.sql"
create table if not exists feriados (

  data_feriado  date
                not null
                -- garante que somente a primeira data é registrada
                -- se ocorrer mais de um feriado nessa data
                primary key on conflict ignore,

  nome_feriado  text
                not null
                collate nocase
);
-- exclui todos os registros se a tabela já existia
delete from feriados;
-- criação da tabela de feriados a priori
create temp view v as
  select * from feriados_moveis union select * from feriados_fixos;
-- conecta db LUX para usar sua tabela config
attach "lux.sqlite" as LUX;
-- preenchimento da tabela com registros de feriados em que o dia da semana de
-- suas datas coincidem com algum dia da semana com atendimento na biblioteca
insert into feriados
  select data_feriado, nome_feriado
  from
    (select weekdays from LUX.config)
    CROSS JOIN
    (select strftime("%w", data_feriado) as w, data_feriado, nome_feriado
      from v)
  where (weekdays >> w) & 1;
-- desconecta db LUX
detach LUX;
drop view v;
-- demonstração de uso com datas pt-BR
select substr("DOMSEGTERQUAQUISEXSÁB", strftime("%w", data_feriado)*3+1, 3) || strftime(" %d-%m-%Y", data_feriado), nome_feriado from feriados;
