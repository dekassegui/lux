<?php

  /**
   * Este script é parte do projeto LUX :: Código aberto em Domínio Público.
  */

  define('DB_FILENAME', 'datum/lux.sqlite');

  require 'metaphone.php';

  use Metaphone\Metaphone;

  /**
   * Pesquisa na "phrase" por todas as palavras distintas de "needle"
   * via "Metaphone", indiferente à ordem das palavras e desde que a
   * quantidade de palavras distintas de "needle" não seja maior que
   * a da "phrase".
   *
   * @param $phrase String container da frase pesquisada.
   * @param $needle String container da(s) palavra(s) procurada(s).
   * @return Boolean status da pesquisa.
  */
  function sonat($phrase, $needle) {
    // obtém array das palavras da frase pesquisada
    $p_arr = preg_split('|\s+|', $phrase);
    // testa se não há separação de palavras procuradas i.e; palavra é única
    if (strpos($needle, ' ') === FALSE) {
      // obtém o metaphone da única palavra procurada
      $meta = Metaphone::getMetaphone($needle);
      // retorna TRUE imediatamente se o metaphone da única palavra
      // procurada coincide com algum metaphone de palavra da frase
      // pesquisada, ou retorna FALSE em caso contrário
      foreach ($p_arr as $word) {
        if (Metaphone::getMetaphone($word) == $meta) return TRUE;
      }
      return FALSE;
    } else {
      // obtém array das palavras procuradas distintas, sem preservar chaves
      $n_arr = array_keys(array_flip(preg_split('|\s+|', $needle)));
      $n = count($n_arr);
      // retorna resultado de pesquisa invocada recursivamente se a palavra
      // procurada distinta é única
      if ($n == 1) return sonat($phrase, $n_arr[0]);
      $m = count($p_arr);
      // retorna FALSE imediatamente se a restrição de cardinalidade não
      // for respeitada i.e; há mais palavras procuradas do que na frase
      if ($m < $n) return FALSE;
      // obtém o metaphone da primeira palavra procurada
      $meta = Metaphone::getMetaphone($n_arr[0]);
      // monta array dos metaphones das palavras da frase
      // e testa o metaphone da primeira palavra procurada
      for ($found=FALSE, $i=0; $i<$m; ++$i) {
        $p_arr[$i] = Metaphone::getMetaphone($p_arr[$i]);
        $found |= ($p_arr[$i] == $meta);
      }
      // se o teste no metaphone da primeira palavra procurada resultou TRUE
      // então inicia a sequência de testes dos metaphones das demais palavras
      // procuradas, que pode terminar antecipadamente se algum deles resultar
      // FALSE i.e; a palavra procurada não se assemelha a nenhuma da frase
      for ($i=1; $found && $i<$n; ++$i) {
        $meta = Metaphone::getMetaphone($n_arr[$i]);
        $found = in_array($meta, $p_arr);
      }
      return $found;
    }
  }

  /**
   * Extensão da classe PDO para SQLite, provendo "workaround" para
   * bug no método de criação de funções e métodos de conveniência.
  */
  class SQLitePDO extends PDO
  {
    public function __construct() {}

    /**
     * Instancia objeto e agrega funções nativas para uso nas requisições.
     *
     * @param $dsn String container do "data source name".
    */
    public function connect($dsn)
    {
      parent::__construct('sqlite:'.$dsn);

      $this->sqliteCreateFunction('preg_match', 'preg_match', 2);
      $this->sqliteCreateFunction('toISOdate', 'toISOdate', 1);
      $this->sqliteCreateFunction('sonat', 'sonat', 2);
    }

    /**
     * Executa requisição de único resultado com tipo primitivo.
     *
     * Observação: Não substitui o método de mesmo nome no SQlite3.
     *
     * @param $sql String container do sql a executar.
     * @return O valor único requisitado na expressão.
    */
    public function querySingle($sql)
    {
      $result = $this->query($sql);
      return $result->fetchColumn();
    }

    /**
     * @return Retorna texto descrevendo a falha na requisição mais recente.
    */
    public function lastErrorMsg()
    {
      return $this->errorInfo()[2];
    }
  }

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

  /**
   * Normaliza string representando Date&Time pt-BR para facilitar
   * conversão como representação de Date&Time no ISO-8601.
   *
   * @param $datetime String representando Date&Time no formato pt-BR.
   * @return String resultante da normalização ou o parâmetro original se
   *                não identificado como representação de Date&Time no
   *                formato pt-BR.
  */
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

      // checa uso de SONAT aka METAPHONE
      } else if (preg_match('/^SONAT\s+(.+)\s*$/i', $needle, $matches)) {

        $constraints[] = $negate."sonat($name, '{$matches[1]}')";

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
      } else if (preg_match('/((?:IS|NOT|)NULL)/i', $needle, $matches)) {

        $op = strtoupper($matches[1]);
        if ($op == 'NULL') $op = 'ISNULL';
        $constraints[] = $negate."$name $op";

      // default :: comparação simples
      } else {

        $constraints[] = $negate."$name == '$needle'";

      }
    }

    return $constraints;
  }

?>