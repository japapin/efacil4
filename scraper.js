const { chromium } = require('playwright');

let sharedBrowser = null;

async function scrapeShipping(sku, cep, attempt = 1) {
    const maxRetries = 2; // Reduzido para 2 para ser mais rápido
    
    if (!sharedBrowser) {
        sharedBrowser = await chromium.launch({ 
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--blink-settings=imagesEnabled=false'
            ]
        });
    }
    
    const context = await sharedBrowser.newContext({
        viewport: { width: 1024, height: 768 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();
    
    // Bloqueio ultra-agressivo via strings e padrões (mais estável no Render)
    await page.route('**/*.{png,jpg,jpeg,gif,webp,svg,woff,woff2,ttf,eot}', route => route.abort());
    await page.route('**/google-analytics/**', route => route.abort());
    await page.route('**/facebook/**', route => route.abort());
    await page.route('**/doubleclick/**', route => route.abort());
    await page.route('**/hotjar/**', route => route.abort());
    await page.route('**/clarity/**', route => route.abort());

    try {
        const searchUrl = `https://www.efacil.com.br/loja/busca/?searchTerm=${sku}`;
        
        // Navegação mais lenta permitida no Render
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });

        // Tenta achar o CEP input o mais rápido possível
        let found = false;
        try {
            await page.waitForSelector('#searchCep_Input', { timeout: 15000 });
            found = true;
        } catch (e) {
            // Fallback imediato para o primeiro link se não estiver na página do produto
            const firstProduct = await page.$('.product-item a, [class*="product-card"] a');
            if (firstProduct) {
                await firstProduct.click();
                await page.waitForSelector('#searchCep_Input', { timeout: 20000 });
                found = true;
            }
        }

        if (!found) throw new Error("Página não carregou.");

        // Voltagem Automática (se houver)
        const hasVoltage = await page.$('#btn_atributoVoltagem110V, #btn_atributoVoltagem220V');
        if (hasVoltage) {
            await page.evaluate(() => {
                const b = document.querySelector('#btn_atributoVoltagem110V') || document.querySelector('#btn_atributoVoltagem220V');
                if (b) b.click();
            });
            await page.waitForTimeout(400);
        }

        // Preenche o CEP
        await page.fill('#searchCep_Input', cep);
        await page.keyboard.press('Enter');

        // Aguarda o resultado específico
        const resultId = '#searchCep_ResultAmount';
        try {
            await page.waitForFunction(() => {
                const el = document.getElementById('searchCep_ResultAmount');
                const bt = document.body.innerText;
                return (el && el.innerText.trim().includes('R$')) || bt.includes('indisponível') || bt.includes('Não foi possível');
            }, { timeout: 10000 });
        } catch (e) {}

        const data = await page.evaluate(() => {
            const priceEl = document.getElementById('searchCep_ResultAmount');
            if (priceEl && priceEl.innerText.includes('R$')) {
                return { success: true, price: priceEl.innerText.trim() };
            }
            if (document.body.innerText.includes('indisponível')) return { success: true, price: 'Indisponível' };
            return { success: false, error: 'Timeout' };
        });

        await context.close();

        if (!data.success && attempt < maxRetries) {
            return await scrapeShipping(sku, cep, attempt + 1);
        }

        return {
            sku,
            success: data.success,
            results: data.success ? [{ type: 'Frete', price: data.price }] : [],
            error: data.error
        };

    } catch (error) {
        await context.close();
        if (attempt < maxRetries) return await scrapeShipping(sku, cep, attempt + 1);
        return { sku, success: false, error: error.message };
    }
}

module.exports = { scrapeShipping };
