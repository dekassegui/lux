# LUX

Sistema para gestão do acervo de bibliotecas de casas espíritas, composto de páginas da web que atuam como interface (_aka UI_) entre o usuário final e scripts que consultam o banco de dados (_aka DB_), hospedados em servidor local, portanto não é necessário acesso a internet e usa-se somente software livre.

![interfaces do LUX](https://github.com/dekassegui/lux/blob/dekassegui-raw/lux-views.png "interfaces do LUX")

**O "business" está completamente embarcado no DB**, possibilitando montagem de outras UIs em qualquer linguagem/tecnologia, manejo em aplicativos para gestão de banco de dados ou até mesmo via CLI.
![diagrama ER do DB](https://github.com/dekassegui/lux/blob/dekassegui-raw/lux.png "diagrama ER do DB")

### pré-requisitos da interface

* Qualquer sistema operacional.
* Servidor HTTPD, somente para uso local, e.g.: **Apache HTTPD Server**.
* **PHP** script engine provido de PDO para **SQLite 3.7.13** ou mais recente.
* Qualquer navegador da web aderente aos padrões **HTML5 + CSS3 + ECMAScript5**.

### dependências da interface

* [Font-Awesome](https://github.com/FortAwesome/Font-Awesome "Font-Awesome")
* [jQuery](https://github.com/jquery/jquery "jQuery")
* [jQuery UI](https://github.com/jquery/jquery-ui "jQuery UI")
* [Metaphone for Brazilian Portuguese](https://sourceforge.net/projects/metaphoneptbr/ "Metaphone for Brazilian Portuguese")
