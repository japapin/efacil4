document.addEventListener('DOMContentLoaded', () => {
    const bulkCepInput = document.getElementById('bulk-cep');
    const fileInput = document.getElementById('file-input');
    const dropZone = document.getElementById('drop-zone');
    const btnBulkSearch = document.getElementById('btn-bulk-search');
    const statusContainer = document.getElementById('status-container');
    const statusText = document.getElementById('status-text');
    const resultsSection = document.getElementById('results-section');
    const resultsTableBody = document.querySelector('#results-table tbody');
    const btnDownload = document.getElementById('btn-download');

    let allResults = [];

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drop-zone--over'); });
    ['dragleave', 'dragend'].forEach(type => dropZone.addEventListener(type, () => dropZone.classList.remove('drop-zone--over')));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        if (e.dataTransfer.files.length) { fileInput.files = e.dataTransfer.files; updateDropZonePrompt(e.dataTransfer.files[0].name); }
        dropZone.classList.remove('drop-zone--over');
    });
    fileInput.addEventListener('change', () => { if (fileInput.files.length) updateDropZonePrompt(fileInput.files[0].name); });

    function updateDropZonePrompt(name) { document.querySelector('.drop-zone__prompt').textContent = name; }

    btnBulkSearch.addEventListener('click', async () => {
        const cep = bulkCepInput.value.trim();
        const file = fileInput.files[0];
        if (!cep || !file) return alert('Informe o CEP e a planilha.');
        
        showLoading('Processando planilha eFácil em alta performance...');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('cep', cep);
        
        try {
            const res = await fetch('/api/scrape-bulk', { method: 'POST', body: formData });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `Erro do servidor (${res.status})`);
            }
            const data = await res.json();
            renderResults(data.results);
        } catch (err) { 
            console.error(err);
            alert('Falha na comunicação: ' + err.message); 
        } finally { hideLoading(); }
    });

    function parsePrice(priceStr) {
        if (!priceStr || typeof priceStr !== 'string') return 0;
        // Remove R$, pontos de milhar e troca vírgula por ponto
        const clean = priceStr.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
        const val = parseFloat(clean);
        return isNaN(val) ? 0 : val;
    }

    function renderResults(results) {
        allResults = results;
        resultsTableBody.innerHTML = '';
        resultsSection.classList.remove('hidden');
        results.forEach(res => {
            if (res.success && res.results && res.results.length > 0) {
                res.results.forEach(opt => {
                    const row = document.createElement('tr');
                    row.innerHTML = `<td>${res.sku}</td><td>${opt.type}</td><td>${opt.price}</td><td><span class="status-badge success">Sucesso</span></td>`;
                    resultsTableBody.appendChild(row);
                });
            } else {
                const row = document.createElement('tr');
                row.innerHTML = `<td>${res.sku}</td><td colspan="2">${res.error || 'Erro'}</td><td><span class="status-badge error">Erro</span></td>`;
                resultsTableBody.appendChild(row);
            }
        });
    }

    function showLoading(text) { statusText.textContent = text; statusContainer.classList.remove('hidden'); resultsSection.classList.add('hidden'); }
    function hideLoading() { statusContainer.classList.add('hidden'); }

    btnDownload.addEventListener('click', () => {
        if (allResults.length === 0) return;

        // Prepara os dados para o Excel
        const excelData = [];
        allResults.forEach(res => {
            if (res.success && res.results) {
                res.results.forEach(opt => {
                    excelData.push({
                        "SKU": res.sku,
                        "Tipo": opt.type,
                        "Preço": parsePrice(opt.price), // Valor numérico
                        "Status": "Sucesso"
                    });
                });
            } else {
                excelData.push({
                    "SKU": res.sku,
                    "Tipo": "N/A",
                    "Preço": 0,
                    "Status": res.error || "Erro"
                });
            }
        });

        // Cria o workbook e a planilha
        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Resultados eFácil");

        // Salva o arquivo
        XLSX.writeFile(wb, `resultados_efacil_${Date.now()}.xlsx`);
    });
});
