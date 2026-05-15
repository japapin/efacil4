# Guia de Deploy - Render.com

Siga estes passos para colocar sua automação eFácil online.

## 1. O que subir para o GitHub
Você deve criar um repositório no seu GitHub e subir todos os arquivos da pasta do projeto, **EXCETO** a pasta `node_modules` (o arquivo `.gitignore` que criei já cuida disso).

**Arquivos essenciais no repositório:**
*   `server.js` (O servidor)
*   `scraper.js` (A inteligência de busca)
*   `Dockerfile` (Instruções para o Render instalar o Playwright)
*   `package.json` (Dependências)
*   Pasta `public/` (Toda a interface visual)

## 2. Configuração no Render
1.  Acesse [dashboard.render.com](https://dashboard.render.com) e faça login.
2.  Clique em **"New +"** e selecione **"Web Service"**.
3.  Conecte sua conta do GitHub e selecione o repositório deste projeto.
4.  **Configurações Importantes:**
    *   **Runtime:** Selecione `Docker` (O Render detectará seu arquivo `Dockerfile` automaticamente).
    *   **Region:** Escolha a mais próxima de você (ex: Ohio ou Frankfurt).
    *   **Instance Type:** Recomendo o plano **"Starter"** (US$ 7/mês) que possui 512MB de RAM. O plano gratuito pode funcionar para poucos SKUs, mas para processamento massivo em paralelo, os 512MB são necessários para o navegador não travar.
5.  Clique em **"Create Web Service"**.

## 3. Como acessar
Assim que o Render terminar o "Build" (pode levar uns 3-5 minutos na primeira vez), ele fornecerá uma URL (ex: `efacil-search.onrender.com`). Basta abrir esse link no seu navegador e usar!

---
**Nota:** O arquivo `Dockerfile` já está configurado para instalar todas as dependências do Linux necessárias para o Playwright rodar sem erros no servidor.
