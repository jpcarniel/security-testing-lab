# Security Testing Lab

Laboratório de teste de segurança de aplicação web. Cada falha é explorada contra um
alvo deliberadamente vulnerável, documentada num write-up e automatizada num script
reproduzível, seguindo a taxonomia do OWASP Top 10.

## Alvo

[OWASP Juice Shop](https://owasp.org/www-project-juice-shop/), aplicação propositalmente
vulnerável mantida pela OWASP. Roda localmente via Docker, então qualquer pessoa clona o
repositório e reproduz os ataques do zero.

```bash
docker compose up -d        # sobe o alvo em http://localhost:3000
docker compose down         # derruba o alvo
```

## Como reproduzir um ataque

Cada script em `exploits/` executa o ataque de ponta a ponta contra o alvo local e valida
o resultado, no mesmo espírito de uma suíte de testes: baseline esperado, ataque, asserção.

```bash
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
./venv/bin/python exploits/01_sql_injection_login.py
```

Saída esperada: baseline negado com HTTP 401, ataque autenticando como admin e `PASS` ao final.

## Write-ups

| # | Falha | Categoria OWASP | Severidade | Status |
|---|-------|-----------------|------------|--------|
| [01](writeups/01-sql-injection-login.md) | Bypass de autenticação via SQL injection | A03 Injection | Crítica | Documentado |
| [02](writeups/02-rate-limiting-login.md) | Ausência de rate limiting no login (brute force) | A07 Auth Failures | Alta | Documentado |

## Stack

- **Alvo:** OWASP Juice Shop (Docker)
- **Interceptação e manipulação:** Burp Suite, cURL
- **Automação de exploração:** Python (requests)
- **Resiliência, carga e rate limiting:** k6, em `performance/`
- **Escaneamento automatizado (DAST):** planejado, OWASP ZAP

## Estrutura

```
security-testing-lab/
├── docker-compose.yml   # sobe o alvo vulnerável
├── writeups/            # 1 relatório por falha: ataque, PoC, impacto, correção
├── exploits/            # scripts que reproduzem cada ataque de forma automatizada
├── performance/         # suíte k6: smoke, load e sonda de rate limiting
└── evidence/            # capturas de tela e saídas usadas nos write-ups
```

## Aviso

Todos os testes são executados contra alvos locais de propriedade do autor ou contra
aplicações explicitamente projetadas para treino de segurança. Técnicas aqui documentadas
servem a aprendizado e teste autorizado.
