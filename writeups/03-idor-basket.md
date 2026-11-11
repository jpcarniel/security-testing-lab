# 03 - IDOR na cesta de compras

## Resumo

A cesta de compras é lida por `GET /rest/basket/{id}`. O servidor exige um token válido,
mas não verifica se a cesta pedida pertence a quem está pedindo. Um usuário autenticado
troca o id na URL e lê a cesta de qualquer outro. É controle de acesso horizontal quebrado,
o padrão conhecido como IDOR (Insecure Direct Object Reference).

- **Endpoint:** `GET /rest/basket/{id}`
- **Categoria OWASP Top 10 (2021):** A01 Broken Access Control
- **Severidade:** Alta
- **CVSS 3.1:** 7.1 (`AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:L/A:N`)

## Ambiente

- Alvo: OWASP Juice Shop em `http://localhost:3000` (via `docker compose up -d`)
- Ferramenta: cURL ou o script `exploits/03_idor_basket.py`

## Passos de reprodução

Para o teste, dois usuários independentes são criados pelo registro público. Ao logar, a
resposta traz o id da cesta de cada um (campo `bid`). No exemplo abaixo, A ficou com a
cesta 8 e B com a cesta 9.

### Controle: A lê a própria cesta

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  http://localhost:3000/rest/basket/8 \
  -H "Authorization: Bearer <token_de_A>"
# 200, esperado
```

### Ataque: A lê a cesta de B

```bash
curl -s http://localhost:3000/rest/basket/9 \
  -H "Authorization: Bearer <token_de_A>"
# 200, e o corpo traz "UserId": 29, que é o dono B, não A
```

O token é o de A o tempo todo. A única mudança foi o número na URL.

## Causa raiz

A rota valida a autenticação, confirma que existe um token legítimo, mas pula a
autorização. Ninguém pergunta "essa cesta é desse usuário?". O id vem direto do cliente e
é usado para buscar o recurso sem nenhum vínculo com a identidade do token. Como os ids
são sequenciais, adivinhar o da vítima é trivial.

## Impacto

- Leitura da cesta de qualquer usuário, o que expõe o que a pessoa pretende comprar.
- Ids sequenciais permitem varrer todas as cestas em ordem, sem adivinhação.
- O mesmo descuido costuma se repetir em outras rotas por id (pedidos, endereços,
  cartões), então vale testar cada uma delas da mesma forma.

## Correção

- **Checar posse no servidor:** antes de devolver o recurso, confirmar que ele pertence ao
  usuário do token. A autorização mora no backend, nunca na suposição de que o cliente só
  pede o que é seu.
- **Negar por padrão:** a rota só responde se a regra de posse passar, em vez de responder
  e torcer para o id estar certo.
- **Ids difíceis de adivinhar** (UUID) ajudam como defesa em profundidade, mas não
  substituem a checagem de posse. Um id opaco ainda vaza se a autorização não existir.

## Referências

- OWASP Top 10 2021 - A01 Broken Access Control: https://owasp.org/Top10/A01_2021-Broken_Access_Control/
- OWASP Testing for IDOR: https://owasp.org/www-project-web-security-testing-guide/
