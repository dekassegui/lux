<?php

  /**
   * Este script é parte do projeto LUX :: Código aberto em Domínio Público.
  */

  define('DB_FILENAME', 'datum/lux.sqlite');

  $nomeMes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  /**
   * Cria array associativo com as substrings resultantes de explode.
   *
   * @param string $delim String delimitadora de substrings.
   * @param string $string String alvo do particionamento.
   * @param array  $keys Array das chaves.
   * @return Array das substrings associadas às chaves.
   *
  */
  function aexplode($delim, $string, $keys) {
    foreach (explode($delim, $string) as $k=>$v) {
      $result[$keys[$k]] = $v;
    }
    return $result;
  }

  /**
   * Testa se o argumento do tipo String contém apenas espaços em branco.
   *
   * @param $text String objeto da verificação.
   * @return NULL se o argumento contém apenas espaços em branco, senão
   *         retorna-o com haspas simples.
  */
  function chk($text) {
    return strlen(trim($text)) == 0 ? 'NULL' : "'$text'";
  }

  /**
   * Padrão de expressão regular para identificação de strings representando
   * Date&Time pt-BR ie.: no formato DD?MM?YYYY HH:MM:SS, indiferente ao
   * separador de componentes usado na data, com a componente dos segundos e
   * até a própria parte do tempo, opcionais.
   * Os grupos de captura são:
   * (1) dia                (3) mês  (5) espaço em branco + tempo (aka TIME)
   * (2) separador da data  (4) ano  (6) tempo no formato HH:MM(:SS)?
  */
  define('BR_DATETIME_REGEX_PATTERN',
    '/^\s*(?#DATE)(\d\d?)(?<separator>\D)(\d\d?)(?&separator)(\d\d(?:\d\d)?)(?:\s*(\s(?#TIME)(\d\d(?::\d\d){1,2}))?)\s*$/');

  /**
   * Converte string representando Date&Time pt-BR para o formato que
   * representa Date&Time no ISO-8601, removendo espaços em branco
   * desnecessários e conforme disponibilidades dos componentes.
   *
   * @param $datetime String representando Date&Time no formato pt-BR.
   * @return String representando Date&Time no formato ISO-8601.
  */
  function toISOdate($datetime) {
    if (preg_match(BR_DATETIME_REGEX_PATTERN, $datetime, $matches)) {
      $r = sprintf('%4d-%02d-%02d', ($matches[4] < 100 ? 2000+$matches[4] : $matches[4]), $matches[3], $matches[1]);
      if (isset($matches[5])) $r .= $matches[5];
      return $r;
    } else {
      return $datetime;
    }
  }

  function normalize($datetime) {
    if (preg_match(BR_DATETIME_REGEX_PATTERN, $datetime, $matches)) {
      $r = sprintf('%02d-%02d-%4d', $matches[1], $matches[3], ($matches[4] < 100 ? 2000+$matches[4] : $matches[4]));
      if (isset($matches[5])) $r .= $matches[5];
      return $r;
    } else {
      return $datetime;
    }
  }

  /**
   * Tenta montar alguma restrição de pesquisa SQL com os valores postados
   * via método GET.
   *
   * @param $fields Array dos nomes das colunas da tabela pesquisada.
   * @return Array das restrições conforme requisição do usuário.
  */
  function buildConstraints($fieldsNames) {
    $constraints = array();
    foreach ($fieldsNames as $name)
    {
      // tenta obter a expressão a pesquisar na coluna corrente
      $needle = trim($_GET[$name]);
      if (strlen($needle) == 0) continue;

      // checa se a expressão é uma negação
      $negate = '';
      if (preg_match('/^NOT\s+(.+)$/i', $needle, $matches)) {
        $negate = 'NOT ';
        $needle = $matches[1];
      }

      // checa uso de operadores lógicos
      if (preg_match('/^([<=>]=?|!=)\s+(.+)$/', $needle, $m)) {

        $operator = $m[1];
        $RHS = $m[2];
        // testa se o RHS é uma Date&Time pt-BR
        if (preg_match(BR_DATETIME_REGEX_PATTERN, $RHS)) {
          $RHS = "strftime('%s', '".toISOdate($RHS)."')";
          $constraints[] = $negate."strftime('%s', toISOdate($name))"
            ." $operator $RHS";
        } else {
          $constraints[] = $negate."$name $operator $RHS";
        }

      // checa uso explícito de GLOB, LIKE ou IS
      } else if (preg_match('/^(GLOB|LIKE|IS)\s+(.+)\s*$/i', $needle,
                            $matches)) {

        $constraints[] = $negate."$name {$matches[1]} '{$matches[2]}'";

      // checa uso de REGEXP também detectando aliases
      } else if (preg_match('/^(I|)(?:REGEXP?|MATCH(?:ES)?)\s+(.+)\s*$/i',
                            $needle, $matches)) {

        // extrai opção "ignorecase" opcionalmente declarada
        $ignorecase = strtolower($matches[1]);
        $constraints[] =
          $negate."preg_match('/{$matches[2]}/$ignorecase', $name)";

      // checa uso de SOUNDEX
      } else if (preg_match('/^SOUNDEX\s+(.+)\s*$/i', $needle, $matches)) {

        $constraints[] =
          $negate."soundex($name) == '".soundex($matches[1])."'";

      // checa uso do operador IN
      } else if (preg_match('/^IN\s+\((.+)\)\s*$/i', $needle, $matches)) {

        $lista = '';
        foreach (preg_split('/,\s*/', $matches[1]) as $item) {
          if (strlen($lista) > 0) $lista .= ',';
          $lista .= "'$item'";
        }
        $constraints[] = $negate."$name IN ($lista)";

      // checa uso implícito de GLOB
      } else if (!(strpos($needle, '*') === FALSE
                   && strpos($needle, '?') === FALSE)) {

        $constraints[] = $negate."$name GLOB '$needle'";

      // checa uso implícito de LIKE
      } else if (!(strpos($needle, '%') === FALSE
                   && strpos($needle, '_') === FALSE)) {

        $constraints[] = $negate."$name LIKE '$needle'";

      // checa comparação com NULL
      } else if (strtoupper($needle) == 'NULL') {

        $constraints[] = $negate."$name ISNULL";

      // default :: comparação simples
      } else {

        $constraints[] = $negate."$name == '$needle'";

      }
    }

    return $constraints;
  }

  function addRegex($db) {
    if ($db->createFunction("preg_match", "preg_match", 2) === FALSE)
      exit("Failed creating function\n");
    if ($db->createFunction("toISOdate", "toISOdate", 1) === FALSE)
      exit("Failed creating function\n");
  }

?>