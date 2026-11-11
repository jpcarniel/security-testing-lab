# Security Testing Lab

Um laboratório onde eu quebro uma aplicação web de propósito, documento como quebrei e
deixo o ataque automatizado pra qualquer pessoa reproduzir. O alvo é o OWASP Juice Shop,
que roda local via Docker, então nada aqui depende de bater em sistema de ninguém.

Cada falha vira três coisas: um write-up que explica o ataque e a correção, um script que
reproduz o ataque sozinho, e uma linha na tabela abaixo. A ideia é mostrar não só que eu
acho a falha, mas que sei provar e automatizar a prova.

## Subir o alvo

```bash
docker compose up -d        # alvo em http://localhost:3000
docker compose down         # derruba quando terminar
```

## Rodar os ataques

Os exploits ficam em `exploits/`. Cada um sobe o ataque de ponta a ponta e termina com
`PASS` quando a falha se confirma, no mesmo espírito de um teste automatizado: baseline,
ataque, asserção.

```bash
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
./venv/bin/playwright install chromium     # só o exploit 05 (XSS) precisa de navegador

bash exploits/run_all.sh                    # roda todos e resume o placar
```

## Falhas encontradas

| # | Falha | OWASP | Severidade | Prova |
|---|-------|-------|------------|-------|
| [01](writeups/01-sql-injection-login.md) | Bypass de login por SQL injection | A03 Injection | Crítica | [exploit](exploits/01_sql_injection_login.py) |
| [02](writeups/02-rate-limiting-login.md) | Login sem rate limiting, aberto a brute force | A07 Auth Failures | Alta | [exploit](exploits/02_login_no_rate_limit.py) |
| [03](writeups/03-idor-basket.md) | IDOR: ler a cesta de outro usuário | A01 Access Control | Alta | [exploit](exploits/03_idor_basket.py) |
| [04](writeups/04-sensitive-data-ftp.md) | Arquivos sensíveis no /ftp e bypass por null byte | A01 / A05 | Alta | [exploit](exploits/04_ftp_path_traversal.py) |
| [05](writeups/05-xss-search-dom.md) | DOM XSS na busca | A03 Injection | Média | [exploit](exploits/05_xss_search_dom.py) |

## Performance e resiliência

A parte de carga e resiliência virou um repositório próprio,
[k6-performance-testing](https://github.com/jpcarniel/k6-performance-testing), com smoke,
load, stress e spike em k6 contra o mesmo alvo. Aqui o foco é a exploração de
vulnerabilidades; lá, a disponibilidade.

## Como está organizado

```
security-testing-lab/
├── docker-compose.yml   # sobe o alvo vulnerável
├── writeups/            # um relatório por falha: ataque, prova, impacto, correção
├── exploits/            # scripts que reproduzem cada ataque, mais o run_all.sh
└── evidence/            # capturas usadas nos write-ups
```

## Ferramentas

Burp Suite e cURL pra interceptar e manipular as requisições, Python com requests pra
automatizar os exploits de API, e Playwright pros ataques que só aparecem no navegador. A
parte de carga e resiliência fica no repositório irmão de k6.

## Sobre o escopo

Tudo roda contra um alvo local, de minha propriedade, feito de propósito pra treino de
segurança. O objetivo é aprender e demonstrar teste de segurança autorizado.
