# 05 - DOM XSS na busca

## Resumo

O termo digitado na busca volta para a página e é inserido no DOM via `innerHTML`, sem
sanitização. Um payload com um `iframe` de `src` igual a `javascript:` é interpretado como
HTML e executa script no contexto da aplicação. Como a injeção acontece no navegador, e não
na resposta do servidor, a falha é DOM-based e só se prova com um navegador real rodando o
JavaScript. A prova usa Playwright.

- **Ponto de entrada:** parâmetro de busca `q` em `/#/search?q=`
- **Categoria OWASP Top 10 (2021):** A03 Injection (Cross-Site Scripting)
- **Severidade:** Média
- **CVSS 3.1:** 6.1 (`AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N`)

## Ambiente

- Alvo: OWASP Juice Shop em `http://localhost:3000` (via `docker compose up -d`)
- Ferramenta: Playwright, script `exploits/05_xss_search_dom.py`
- Evidência: `evidence/05_xss_search.png`

## Passos de reprodução

O payload abaixo vai no campo de busca ou direto na URL:

```
<iframe src="javascript:alert(`xss`)">
```

```
http://localhost:3000/#/search?q=<iframe src="javascript:alert(`xss`)">
```

Ao carregar, o navegador executa o `alert`, sinal de que o conteúdo da busca virou código.
O script confirma por dois caminhos independentes: o `iframe` com `src` `javascript:`
aparece no DOM, e o diálogo de `alert` dispara de fato.

```
iframe malicioso inserido no DOM: sim
alert disparado pelo navegador: sim
PASS: DOM XSS confirmado
```

## Causa raiz

O valor da busca é escrito na página com `innerHTML`, que interpreta o texto como marcação.
Sem sanitização ou escape, qualquer HTML que o usuário digitar é montado e executado pelo
navegador. A fronteira entre "texto a exibir" e "HTML a renderizar" não existe nesse ponto.

## Impacto

- Execução de JavaScript arbitrário no contexto da aplicação, com acesso ao que o script
  da página alcança, como token de sessão e dados exibidos.
- Entregue por link, vira um ataque de um clique: a vítima abre a URL e o payload roda.
- Serve de trampolim para roubo de sessão, ações em nome do usuário e redirecionamento.

## Correção

- **Nunca montar HTML com entrada do usuário via `innerHTML`.** Usar APIs que tratam o
  valor como texto (`textContent`) ou o binding seguro do framework, que escapa por padrão.
- **Sanitizar** quando HTML rico for realmente necessário, com uma biblioteca dedicada e
  uma allowlist estrita de tags e atributos.
- **Content Security Policy** como defesa em profundidade, para reduzir o que um script
  injetado consegue fazer mesmo que escape passe.

## Referências

- OWASP Top 10 2021 - A03 Injection: https://owasp.org/Top10/A03_2021-Injection/
- OWASP Cross Site Scripting (XSS): https://owasp.org/www-community/attacks/xss/
- OWASP DOM based XSS Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html
