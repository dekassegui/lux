# lux
<p>Sistema para gestão do acervo de bibliotecas de casas espíritas, composto de um conjunto de páginas da web que atuam como interface (<em>aka UI</em>) entre o usuário final e scripts que consultam o banco de dados (<em>aka DB</em>), hospedados em servidor local, portanto não é necessário acesso a internet e usa-se somente software livre.</p>
<img src="https://github.com/dekassegui/lux/blob/dekassegui-raw/lux-views.png" alt="interfaces do LUX">
<p><strong>O "business" está completamente embarcado no DB</strong>, possibilitando montagem de outras UIs em qualquer linguagem/tecnologia, manejo em aplicativos para gestão de banco de dados ou até mesmo via CLI, dado que o esquema do DB é para o <strong>SQLite</strong>.</p>
## pré-requisitos
<ul>
<li>Qualquer sistema operacional.</li>
<li>Servidor HTTPD, somente para uso local, e.g.: <strong>Apache HTTPD Server</strong>.</li>
<li><strong>PHP</strong> script engine provido de PDO para <strong>SQLite 3.7.13</strong> ou mais recente.</li>
<li>Qualquer navegador da web aderente aos padrões <strong>HTML5 + CSS3 + ECMAScript5</strong>.</li>
</ul>
## diagrama ER do DB
<img src="https://github.com/dekassegui/lux/blob/dekassegui-raw/lux.png" alt="diagrama ER do Lux">
## dependências
<ul>
<li><a href="https://github.com/t1m0n/air-datepicker">Air-Datepicker</a></li>
<li><a href="https://github.com/FortAwesome/Font-Awesome">Font-Awesome</a></li>
<li><a href="https://github.com/jquery/jquery">jQuery</a></li>
<li><a href="https://sourceforge.net/projects/metaphoneptbr/">Metaphone for Brazilian Portuguese</a></li>
<li><a href="https://github.com/t4t5/sweetalert">Sweet Alert</a></li>
</ul>
