# Performance e resiliência (k6)

Suíte de teste de carga com [k6](https://grafana.com/docs/k6/latest/). Além de medir
desempenho, cobre a perna de disponibilidade da tríade CIA e um vetor de segurança
concreto: a ausência de rate limiting no login.

## Pré-requisito

Alvo no ar via `docker compose up -d` (a partir da raiz do repositório).

## Scripts

| Script | Propósito | Duração aprox. |
|--------|-----------|----------------|
| `smoke.js` | Sanidade: 1 usuário virtual valida que o alvo responde e o script está são. Rode antes dos demais. | 15s |
| `load.js` | Carga: rampa até 30 usuários navegando (home, catálogo, busca), mede latência e erro sob carga sustentada contra um SLO. | ~70s |
| `stress.js` | Limite: empurra em degraus até 200 usuários pra achar onde a latência dispara e os erros começam. | ~70s |
| `spike.js` | Pico: sobe de 10 pra 200 usuários de repente e observa se o sistema aguenta e se recupera depois. | ~55s |
| `rate-limit-login.js` | Segurança: dispara uma rajada de tentativas de login e verifica se há bloqueio por rate limit (429). A ausência é o achado. | 15s |

## Como rodar

```bash
k6 run performance/smoke.js
k6 run performance/load.js
k6 run performance/stress.js
k6 run performance/spike.js
k6 run performance/rate-limit-login.js
```

O host do alvo pode ser trocado por variável de ambiente:

```bash
k6 run -e BASE_URL=http://localhost:3000 performance/load.js
```

## Como ler os resultados

- **`http_req_duration`** com `p(95)` é a latência que importa: 95% das respostas ficaram
  abaixo desse valor. É o número que vira SLO.
- **`http_req_failed`** é a taxa de respostas que não foram 2xx. Cuidado: em testes que
  esperam 401 (como `rate-limit-login.js`), essa métrica sobe sem que haja problema real.
  Sempre confira qual métrica responde à pergunta do teste.
- **Thresholds** são os limites que definem passou ou falhou. Um `✗` pode ser defeito de
  desempenho ou, no caso da sonda de rate limiting, a própria evidência de segurança.

O achado da sonda de rate limiting está documentado em
[`writeups/02-rate-limiting-login.md`](../writeups/02-rate-limiting-login.md).
