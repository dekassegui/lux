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

      // requisita parâmetros para cálculo dos empréstimos e datas limite
      $result = $db->query('SELECT prazo, pendencias, weekdays FROM config;');
      $values = $result->fetchArray(SQLITE3_NUM);
      echo int($values[0]).'|'.$values[1].'|'.$values[2];
      break;

    case 'UPDATE':

      $fields = array('prazo', 'pendencias', 'weekdays');
      $new = aexplode('|', $_GET['CFG'], $fields);
      $result = $db->query('SELECT prazo, pendencias, weekdays FROM config;');
      $old = $result->fetchArray(SQLITE3_ASSOC);
      $c = array();
      $e = array();
      if ($new['prazo'] <> int($old['prazo'])) {
        // contagem dos empréstimos que estarão em atraso
        // se houver modificação, exceto os que já estão
        $sql = "select count() from emprestimos, config, (select date('now', 'localtime') as hoje) where data_devolucao isnull and (date(data_emprestimo, prazo) >= hoje) and (date(data_emprestimo, '+{$new['prazo']} days') < hoje)";
        $n = $db->querySingle($sql);
        if ($n == 0) {
          $c[] = sprintf('prazo="+%02d days"', $new['prazo']);
        } else {
          $e[] = 'Se o prazo for alterado de '.int($old['prazo']).' para '
            .$new['prazo'].' dias, então '.(($n == 1)
            ? '1 empréstimo pendente estará'
            : "$n empréstimos pendentes estarão")
            .' em atraso.';
        }
      }
      if ($new['pendencias'] <> $old['pendencias']) {
        // contagem dos leitores que ultrapassarão a cota máxima
        // de obras emprestadas se houver modificação
        $sql = "SELECT count(n) FROM (SELECT count(leitor) AS n FROM emprestimos WHERE data_devolucao isnull GROUP BY leitor HAVING n > {$new['pendencias']})";
        $m = $db->querySingle($sql);
        if ($m == 0) {
          $c[] = 'pendencias='.$new['pendencias'];
        } else {
          $e[] = 'Se o número máximo de livros emprestados for alterado de '
            .$old['pendencias'].' para '.$new['pendencias'].', então '
            .(($m == 1) ? '1 leitor ultrapassará'
              : '$m leitores ultrapassarão').' a cota.';
        }
      }
      if ($new['weekdays'] <> $old['weekdays']) {
        if ($new['weekdays'] > 0) {
          $c[] = 'weekdays='.$new['weekdays'];
        } else {
          $e[] = 'Não há previsão de atendimento na semana.';
        }
      }
      $msg = '';
      if (count($c) > 0) {
        $sql = 'UPDATE config SET '.join(', ', $c);
        if ($db->exec($sql)) {
          $msg = 'Atualização bem sucedida!';
        } else {
          $msg = 'Error: '.$db->lastErrorMsg();
        }
      }
      if (count($e) > 0) {
        if (strlen($msg) > 0) $msg .= "\n\n";
        $msg .= "Erro(s):\n\n".join("\n\n", $e);
      }
      echo $msg;
      break;

  }

  $db->close();

?>