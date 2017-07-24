#!/bin/bash
#
# Higienização do db do LUX se houver ao menos um registro de empréstimo
# com data de devolução não nula, preservando arquivos num zipfile.
#
pushd /home/sergio/Projects/lux
dbfile='datum/lux.sqlite'
read -d '' sql <<EOT
 SELECT EXISTS(SELECT 1 FROM emprestimos WHERE data_devolucao NOTNULL LIMIT 1)
EOT
if [[ $(sqlite3 $dbfile "$sql") == 1 ]]; then
  declare -a entries
  sufix=$(date +'%s')
  for prefix in lux util; do
    entries=( "$prefix-sqlite-dump-$sufix.sql" "${entries[@]}" )
    sqlite3 datum/$prefix.sqlite '.dump' > ${entries[0]}
  done
  zip -m -q db-backups.zip ${entries[@]}
  # exclusão dos registros da tabela "emprestimos" com data_devolucao não nula
  sudo sqlite3 $dbfile '.read datum/dumper.sql'
fi
popd