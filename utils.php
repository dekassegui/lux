<?php

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

      // checa uso explícito de GLOB, LIKE ou IS
      if (preg_match('/^(GLOB|LIKE|IS)\s+(.+)\s*$/i', $needle, $matches)) {
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