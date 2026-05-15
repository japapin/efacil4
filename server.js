const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const cors = require('cors');
const { scrapeShipping } = require('./scraper');
const path = require('path');

const app = express();
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.post('/api/scrape-single', async (req, res) => {
    const { sku, cep } = req.body;
    if (!sku || !cep) {
        return res.status(400).json({ error: 'SKU and CEP are required' });
    }

    const result = await scrapeShipping(sku, cep);
    res.json(result);
});

app.post('/api/scrape-bulk', upload.single('file'), async (req, res) => {
    const { cep } = req.body;
    if (!req.file || !cep) {
        return res.status(400).json({ error: 'File and CEP are required' });
    }

    try {
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
        
        const skus = data.map(row => row[0]).filter(sku => sku && sku.toString().toLowerCase() !== 'sku' && sku.toString().toLowerCase() !== 'código');

        console.log(`Processing bulk request for ${skus.length} SKUs in parallel batches...`);
        
        const results = [];
        const batchSize = 1; // Forçadamente 1 no Render para não estourar memória
        
        for (let i = 0; i < skus.length; i += batchSize) {
            const batch = skus.slice(i, i + batchSize);
            const batchPromises = batch.map(sku => scrapeShipping(sku.toString(), cep));
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
            
            // Pausa mínima para não travar o Render mas manter a velocidade
            if (i + batchSize < skus.length) {
                await new Promise(r => setTimeout(r, 500));
            }
        }

        res.json({ success: true, results });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
