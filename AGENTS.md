# AGENTS.md

Guia portável para agentes de IA que trabalham neste repositório.

## O que é este repositório

Laboratório de teste de segurança de aplicação web. Cada falha explorada vira um write-up
em `writeups/` e um script de exploração reproduzível em `exploits/`. O alvo é o OWASP
Juice Shop, aplicação propositalmente vulnerável, rodando localmente via Docker.

## Subir e derrubar o alvo

```bash
docker compose up -d     # http://localhost:3000
docker compose down
```

## Convenções

- **Write-ups** seguem o template de `writeups/01-sql-injection-login.md`: resumo,
  severidade com vetor CVSS, categoria OWASP, passos de reprodução com baseline e ataque,
  causa raiz, impacto, correção e referências.
- **Scripts de exploração** são autônomos, rodam contra `http://localhost:3000` e validam
  o resultado com asserção explícita, imprimindo PASS ou FAIL. A maioria usa só `requests`;
  os ataques que só aparecem no navegador (DOM XSS) usam Playwright. Deps em
  `requirements.txt`, instaladas num `venv` local. `bash exploits/run_all.sh` roda todos.
- **Suíte k6** em `performance/`: smoke, load, stress, spike e a sonda de rate limiting.
  Cada script aceita `-e BASE_URL=...` e declara thresholds que definem passou ou falhou.
- **Numeração** de write-up e exploit é compartilhada: `01-...md` casa com `01_...py`.
- **Escopo ético:** só se testa alvo local ou aplicação de treino autorizada. Nunca apontar
  os scripts para sistemas de terceiros.

## Idioma

Documentação e comentários em português. Termos técnicos e identificadores de código
permanecem na forma original.
