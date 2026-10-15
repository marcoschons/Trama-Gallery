# Trama — Arte encontra conexão

Galeria em português para descobrir artistas e contatá-los para comissões. Criada para Adrian e Marco; Trama é um nome provisório.

## O que o projeto faz

- Carrossel de artes com setas, teclado e gestos.
- Galeria, busca por nome, @, título e tags; filtros por estilo e disponibilidade.
- Favoritos salvos no navegador.
- Perfis com Instagram, WhatsApp, e-mail e portfólio.
- Rascunho de mensagem para pedir comissões diretamente ao artista.
- Ateliê para editar o perfil, publicar PNG, JPG e WebP de até 10 MB e remover obras próprias.
- Banco Cloudflare D1 para perfis e obras; R2 para imagens.
- Autenticação Entrar com ChatGPT na hospedagem Sites.

Os artistas de exemplo são fictícios. As três ilustrações de demonstração foram geradas com IA e estão identificadas na interface.

## Subir manualmente no GitHub

### 1. Preparar a pasta

Extraia o ZIP e abra a pasta `trama-galeria`, a que contém `package.json`, `README.md` e `app/`.

Instale o Git se ainda não estiver instalado. No Windows, use o Git Bash dentro dessa pasta; no macOS ou Linux, use o terminal.

### 2. Criar o repositório

Na sua conta do GitHub:

1. Clique em **+ → New repository**.
2. Nomeie como **trama-galeria**.
3. Selecione **Private**.
4. Deixe desmarcadas as opções de adicionar README, .gitignore e licença: os arquivos já estão neste pacote.
5. Clique em **Create repository** e copie a URL HTTPS exibida.

### 3. Enviar o código

No terminal dentro da pasta do projeto:

```bash
git init -b main
git add .
git commit -m "Versão inicial da galeria Trama"
git remote add origin https://github.com/SEU_USUARIO/trama-galeria.git
git push -u origin main
```

Substitua a URL de exemplo pela URL HTTPS do repositório criado. O envio pode pedir autenticação no GitHub; conclua o fluxo oferecido pelo Git. Não coloque senha ou token nos arquivos do projeto.

Se o primeiro commit pedir nome e e-mail, configure apenas neste projeto e repita o commit e o push:

```bash
git config user.name "Seu nome"
git config user.email "Seu e-mail de commit no GitHub"
git commit -m "Versão inicial da galeria Trama"
git push -u origin main
```

Você pode usar o e-mail de privacidade fornecido pelo GitHub em **Settings → Emails**.

### 4. Conferir

Atualize a página do repositório e confirme que aparecem `app/`, `public/`, `drizzle/`, `scripts/`, `package.json` e este README.

O ZIP contém o código-fonte e os assets. Dependências, arquivos de build, banco local, uploads reais e credenciais não fazem parte do pacote.

### Próximas alterações

```bash
git add .
git commit -m "Descreva sua alteração"
git push
```

## Rodar no computador

Requer Node.js 22.13 ou superior compatível com o pnpm indicado em `package.json`, e pnpm 11.25.0.

```bash
pnpm install --frozen-lockfile
pnpm build
```

Na primeira execução, crie as tabelas do banco local:

```bash
pnpm exec wrangler d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_noisy_ken_ellis.sql
```

Execute esse SQL apenas uma vez para cada banco local novo. Depois:

```bash
pnpm dev
```

Abra a URL local exibida no terminal, normalmente `http://localhost:5173`. O desenvolvimento local simula a identidade do ChatGPT; não usa uma conta real para autenticar.

## Hospedagem e autenticação

O GitHub guarda o código. O site atual é hospedado pelo Sites e foi criado privado para revisão.

Este projeto tem um backend com autenticação, D1 e R2. GitHub Pages sozinho não executa essas funções. Para hospedar fora do Sites, configure os recursos de banco e armazenamento e implemente uma camada confiável de autenticação para substituir a identidade fornecida pela hospedagem.

Os cabeçalhos de identidade em `app/chatgpt-auth.ts` só devem ser considerados confiáveis quando preenchidos por uma camada de hospedagem que autentique o usuário e impeça que visitantes os forjem.

## Verificação

```bash
pnpm exec tsc --noEmit
pnpm build
node scripts/test-integration.mjs
```

Os testes de integração usam o Worker compilado e uma base descartável com D1 e R2 locais. O código da primeira versão passou por build, verificação TypeScript e 19 verificações de integração.

## Organização

- `app/gallery.tsx`: navegação, carrossel, galeria, filtros e contato.
- `app/studio.tsx`: perfil do artista e envio de artes.
- `app/globals.css`: identidade visual e layout responsivo.
- `app/api/`: perfis, obras e imagens.
- `app/lib/`: tipos, validação e utilitários.
- `db/` e `drizzle/`: esquema e migrações.
- `public/art/`: ilustrações de exemplo.
- `public/fonts/`: fontes locais e respectivas licenças.
- `scripts/test-integration.mjs`: verificações do backend.

## Direção visual e referências

O protótipo de Paint orientou o foco na obra central, nas obras laterais e no botão “Gostei dessa”. Fundo claro, verde, tipografia editorial, traços e cartões sobrepostos compõem a identidade original.

Referências de descoberta de artistas: ArtStation, Behance e VGen. Fontes locais DM Sans e Space Grotesk, distribuídas sob SIL Open Font License.

Moderação, denúncias e administração são evoluções para abrir a comunidade em maior escala.
