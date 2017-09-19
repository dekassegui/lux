#!/bin/bash
#
# Manutenção do DB do LUX
#
alias speech='spd-say -l pt-BR -t child_male -p 40 -r -70'
# pesquisa diretório do LUX capturando resultado do comando "find"
luxdir=$(find /home/$USER -type d -user $USER -perm -0755 -name lux -print)
# checa se resultado é string vazia
if [[ -z $luxdir ]]; then
  echo 'Não localizou o diretório do LUX.';
  speech 'ops! não achei o lux'
  exit 1
fi
# muda para o diretório do LUX se necessário
[[ $PWD == $luxdir ]] && unset luxdir || pushd $luxdir
dbfile='datum/lux.sqlite'
read -d '' sql <<EOT
 SELECT EXISTS(SELECT 1 FROM emprestimos WHERE data_devolucao NOTNULL LIMIT 1)
EOT
# checa se existe(m) registro(s) de empréstimo com data de devolução preenchida
if [[ $(sqlite3 $dbfile "$sql") == 1 ]]; then
  # inicia o array de nomes de arquivos :: itens do zipfile
  declare -a entries
  # cria o sufixo dos nomes de arquivos :: nixtime
  sufix=$(date +'%s')
  # loop de backup dos DBs
  for prefix in lux util; do
    # inclui no início do array o nome do arquivo resultante da concatenação
    entries=( "$prefix-sqlite-dump-$sufix.sql" "${entries[@]}" )
    # cria o arquivo de backup
    sqlite3 datum/$prefix.sqlite '.dump' > ${entries[0]}
  done
  # atualiza ou cria o zipfile dos arquivos de backup
  zip -m -q db-backups.zip ${entries[@]}
  # exclusão dos registros de empréstimos com data de devolucao preenchida
  echo 'n43maria' | sudo -S sqlite3 $dbfile '.read datum/dumper.sql'
  speech 'DB ajustado'
else
  speech 'atualização desnecessaria'
fi
[[ $luxdir ]] && popd