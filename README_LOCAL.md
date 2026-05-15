# Automação Efacil - Script Local

Este script roda diretamente no seu computador, lê uma planilha de SKUs e gera uma nova planilha com os resultados de frete.

## Como Usar

1.  **Prepare sua Planilha**:
    *   Crie um arquivo chamado `skus.xlsx` na mesma pasta deste script.
    *   Coloque os códigos dos produtos (SKUs) na **primeira coluna**.
2.  **Configure o CEP**:
    *   Abra o arquivo `run_automation.js`.
    *   Altere a linha `const CEP = '04547006';` para o seu CEP de destino.
3.  **Execute o Script**:
    *   No terminal, digite:
        ```bash
        npm start
        ```
4.  **Resultado**:
    *   O script abrirá o navegador em segundo plano, processará cada item e criará um novo arquivo Excel chamado `resultados_frete_XXXX.xlsx` com todos os dados.

## Requisitos
*   Node.js instalado.
*   Playwright instalado (`npx playwright install chromium`).
