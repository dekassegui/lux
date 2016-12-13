<?php

  define('DB_FILENAME', 'datum/lux.sqlite');

  define('BR_DATETIME_PATTERN', '/^\s*(?#DATE)(\d\d)(?<separator>\D)(\d\d)(?&separator)(\d{4})(?:\s*(\s(?#TIME)\d\d(?::\d\d){1,2}))?\s*$/');

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
   * Converte string representando Date&Time no formato DD?MM?YYYY HH:MM:SS,
   * indiferente ao separador de componentes usado no argumento com a parte
   * das horas opcional que pode conter apenas as horas e minutos, para o
   * formato YYYY-MM-DD HH:MM:SS aka ISO-8601, conforme disponibilidade de
   * componentes.
   *
   * @param $datetime String representando data e hora opcional.
   * @return String
  */
  function toISOdate($datetime) {
    if (preg_match(BR_DATETIME_PATTERN, $datetime, $matches)) {
      $r = "{$matches[4]}-{$matches[3]}-{$matches[1]}";
      if (count($matches) == 6) $r .= $matches[5];
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
      if (preg_match('/^\s*([<=>!]=?)\s+(.+)$/', $needle, $m)) {

        $operator = $m[1];
        $RHS = $m[2];
        // testa se o RHS é uma Date&Time
        if (preg_match(BR_DATETIME_PATTERN, $RHS)) {
          $RHS = toISOdate($RHS);
          $constraints[] = $negate."strftime('%s', substr($name, 7, 4)||substr($name, 3, 4)||substr($name, 1, 2)||substr($name, 11)) $operator strftime('%s', '$RHS')";
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
  }

?>