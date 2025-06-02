// Variáveis globais
let shipments = JSON.parse(localStorage.getItem('shipments')) || [];
let scannedCodes = [];
let uniqueDrivers = JSON.parse(localStorage.getItem('uniqueDrivers')) || [];
let isScanning = false;
let html5QrcodeScanner = null;
let lastScanTime = 0;
let errorBeep = new Audio('data:audio/mp3;base64,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');

// ... existing code ...

// Função para atualizar resultados da busca
function updateSearchResults() {
    const searchDate = document.getElementById('searchDate').value;
    const filteredShipments = shipments.filter(s => s.date === searchDate);
    const resultsContainer = document.getElementById('resultsContainer');
    const resultsTable = document.getElementById('resultsTable').getElementsByTagName('tbody')[0];
    
    document.getElementById('pacotesDia').textContent = filteredShipments.reduce((acc, s) => acc + s.codes.length, 0);
    document.getElementById('coletasDia').textContent = filteredShipments.length;
    
    resultsTable.innerHTML = '';
    
    if (filteredShipments.length === 0) {
        const row = resultsTable.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 4;
        cell.textContent = 'Nenhum envio encontrado';
        cell.style.textAlign = 'center';
    } else {
        filteredShipments.forEach(shipment => {
            const row = resultsTable.insertRow();
            row.insertCell().textContent = shipment.time;
            row.insertCell().textContent = shipment.codes.join(', ');
            row.insertCell().textContent = shipment.driver;
            row.insertCell().textContent = shipment.observations || '-';
        });
    }
    
    resultsContainer.hidden = false;
}

// ... existing code ...

// Função para processar código escaneado
function processScannedCode(code) {
    const now = Date.now();
    if (now - lastScanTime < 1000) { // Delay de 1 segundo
        return;
    }
    
    if (scannedCodes.includes(code)) {
        errorBeep.play();
        alert('Este código já foi escaneado!');
        return;
    }
    
    lastScanTime = now;
    scannedCodes.push(code);
    playBeep();
    updateInterface();
    document.getElementById('trackingCode').value = '';
}

// Função para salvar envio
function saveShipment() {
    const now = new Date();
    const shipment = {
        date: now.toISOString().split('T')[0],
        time: now.toLocaleTimeString('pt-BR'),
        codes: [...scannedCodes],
        driver: document.getElementById('driverName').value.trim(),
        observations: document.getElementById('observations').value.trim()
    };
    
    shipments.push(shipment);
    localStorage.setItem('shipments', JSON.stringify(shipments));
    
    if (!uniqueDrivers.includes(shipment.driver)) {
        uniqueDrivers.push(shipment.driver);
        localStorage.setItem('uniqueDrivers', JSON.stringify(uniqueDrivers));
        displayDriverSuggestions();
    }
    
    generateTXT(shipment);
    resetForm();
    updateDailyStats();
    closeModal();
    
    // Atualiza as estatísticas em tempo real para todos os usuários
    window.dispatchEvent(new Event('storage'));
    
    alert('Envio registrado com sucesso!');
}

// Adicionar listener para atualizações em tempo real
window.addEventListener('storage', function(e) {
    if (e.key === 'shipments') {
        shipments = JSON.parse(localStorage.getItem('shipments')) || [];
        updateDailyStats();
        if (document.getElementById('searchDate').value) {
            updateSearchResults();
        }
    }
});

// Atualizar estatísticas ao carregar a página
window.addEventListener('load', function() {
    updateDailyStats();
    displayDriverSuggestions();
});
