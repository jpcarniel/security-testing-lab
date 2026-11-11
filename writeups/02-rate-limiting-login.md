# 02 - Ausência de rate limiting no login permite brute force

## Resumo

O endpoint de login do Juice Shop não aplica nenhum controle de taxa sobre tentativas
de autenticação. Uma rajada de 751 tentativas de login em 15 segundos, a 50 por segundo,
foi integralmente processada pelo servidor, sem uma única resposta de bloqueio
(HTTP 429 Too Many Requests) e sem bloqueio de conta. Isso deixa o endpoint exposto a
ataques de brute force e credential stuffing.

- **Endpoint:** `POST /rest/user/login`
- **Categoria OWASP Top 10 (2021):** A07 Identification and Authentication Failures
- **Severidade:** Alta
- **CVSS 3.1:** 7.5 (`AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N`)

## Ambiente

- Alvo: OWASP Juice Shop em `http://localhost:3000` (via `docker compose up -d`)
- Ferramenta: k6, script `performance/rate-limit-login.js`

## Passos de reprodução

A sonda dispara tentativas de login com email válido e senha incorreta a uma taxa
constante, e conta quantas respostas foram 429 (bloqueio por rate limit) versus 401
(tentativa processada normalmente).

```bash
k6 run performance/rate-limit-login.js
```

### Resultado observado

```
login_401_tentativa_processada...: 751    50.05/s
login_429_bloqueado..............: 0      0/s
THRESHOLD login_429_bloqueado 'count>0'  ->  FALHOU (count=0)
```

As 751 tentativas foram todas processadas. Nenhuma foi bloqueada. O threshold do teste
esperava ao menos um 429, e a sua falha é a evidência direta da ausência de proteção.

> Observação de leitura: a métrica nativa `http_req_failed` do k6 marca os 401 como
> falha por não serem respostas 2xx. No contexto deste teste, 401 é o resultado esperado
> de uma tentativa com senha incorreta. A métrica que responde à pergunta de segurança é
> `login_429_bloqueado`, que ficou em zero.

## Causa raiz

O servidor trata cada requisição de login de forma independente, sem manter contador de
tentativas por origem (IP, conta ou sessão) e sem introduzir atraso progressivo ou
bloqueio temporário após sucessivas falhas. Não há camada de rate limiting no caminho da
requisição, nem lockout de conta.

## Impacto

- **Brute force de senha:** um atacante pode testar milhares de senhas por minuto contra
  uma conta conhecida, limitado apenas pela própria banda.
- **Credential stuffing:** listas de credenciais vazadas podem ser validadas em massa
  contra o endpoint.
- O impacto real escala com a fraqueza das senhas dos usuários e com a ausência de
  segundo fator. Combinado com senhas fracas, leva a comprometimento de conta.

## Correção

- **Rate limiting por IP e por conta** no endpoint de autenticação, respondendo 429 ao
  ultrapassar o limite dentro de uma janela de tempo.
- **Lockout temporário ou atraso progressivo** após um número de falhas consecutivas na
  mesma conta.
- **CAPTCHA** após as primeiras falhas, para elevar o custo de automação.
- **Autenticação de segundo fator (MFA)**, que reduz o valor de uma senha isolada.
- **Monitoramento e alerta** de picos de falha de login, para detectar o ataque em curso.

## Referências

- OWASP Top 10 2021 - A07 Identification and Authentication Failures: https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/
- OWASP Blocking Brute Force Attacks: https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks
- k6 Documentation: https://grafana.com/docs/k6/latest/
