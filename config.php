<?php

  /**
   * Este script é parte do projeto LUX :: Código aberto em Domínio Público.
  */

  /**
   * Pesquisa valor do tipo Integer no único argumento do tipo String.
   *
   * @param $s String objeto da pesquisa.
   * @return String representando Integer identificado na pesquisa, senão ZERO.
  */
  function int($s) {
    return ($a=preg_replace('/[^\-\d]*(\-?\d*).*/','$1', $s)) ? $a: '0';
  }

  require 'utils.php';

  $db = new SQLite3(DB_FILENAME) or die('Unable to open database');

  switch ($_GET['action']) {

    case 'GETREC':

      // requisita parâmetros dos empréstimos
      $result = $db->query('SELECT prazo, pendencias FROM config;');
      $values = $result->fetchArray(SQLITE3_NUM);
      $text = int($values[0]).'|'.$values[1];

      // requisita parâmetros para cálculos de datas limite de empréstimo
      $result = $db->query(
        'SELECT dayNumber, allowed, surrogate FROM weekdays;');
      while ($row = $result->fetchArray(SQLITE3_NUM)) {
        $text .= "\n".join('|', $row);
      }

      echo $text;
      break;

    case 'UPDATE':

      // Atualização do único registro da tabela 'config'.

      // formata o valor da coluna 'prazo' conforme usado na tabela
      $prazo = sprintf('+%02d days', $_GET['prazo']);
      $pendencias = $_GET['pendencias'];
      $sql = "UPDATE config SET prazo='$prazo', pendencias=$pendencias;";
      if (!$db->exec($sql)) {
        echo 'Error: '.$db->lastErrorMsg();
        break;
      }

      // Atualização dos 7 (sete) registros da tabela 'weekdays'.

      // 'prepared statement' para atualização dos registros
      $sql = "UPDATE weekdays SET allowed=:allowed, surrogate=:surrogate
              WHERE upper(dayName) == upper(:dayName)";

      if ($statement = $db->prepare($sql))
      {
        // nomes das colunas envolvidas na atualização, na ordem de
        // montagem da string de parâmetros enviada pelo script cliente
        $fields = array('dayName', 'allowed', 'surrogate');

        $dias = array(0 => 'domingo', 1 => 'segunda', 2 => 'terça',
                3 => 'quarta', 4 => 'quinta', 5 => 'sexta', 6 => 'sábado');

        foreach ($dias as $numeroDia => $nomeDia)
        {
          // reinicia o 'prepared statement' a partir da segunda iteração
          if ($numeroDia > 0) $statement->reset();

          // extrai os valores das colunas envolvidas na atualização
          $datum = aexplode('|', $_GET["weekday$numeroDia"], $fields);

          $statement->bindValue(':allowed',
            $datum['allowed'],
            SQLITE3_INTEGER);

          // atribui 'numeroDia' do 'nomeDia' correspondente ao nome do dia
          // substituto, extraído da UI e enviado pelo script cliente
          $statement->bindValue(':surrogate',
            array_search(strtolower(trim($datum['surrogate'])), $dias),
            SQLITE3_INTEGER);

          $statement->bindValue(':dayName',
            $datum['dayName'],
            SQLITE3_TEXT);

          if ($statement->execute() === FALSE) {
            echo 'Error: '.$db->lastErrorMsg();
            break;
          }
        }

      } else {
        echo 'Error: '.$db->lastErrorMsg();
        break;
      }

      echo 'Sucesso!';
      break;
  }

  $db->close();

?>