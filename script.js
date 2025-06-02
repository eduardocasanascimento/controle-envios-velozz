// Variáveis globais
let shipments = JSON.parse(localStorage.getItem('shipments')) || [];
let scannedCodes = [];
let uniqueDrivers = JSON.parse(localStorage.getItem('uniqueDrivers')) || [];
let isScanning = false;
let html5QrcodeScanner = null;

// Versão do sistema
const APP_VERSION = '1.3.0'; // Atualizado para nova biblioteca de QR Code

// Função para mostrar versão
function displayVersion() {
    const versionElement = document.createElement('div');
    versionElement.id = 'version-info';
    versionElement.textContent = `v${APP_VERSION}`;
    document.body.appendChild(versionElement);
}

// Função para atualizar estatísticas diárias
function updateDailyStats() {
    const today = new Date().toISOString().split('T')[0];
    const todayShipments = shipments.filter(s => s.date === today);
    const totalPackages = todayShipments.reduce((acc, s) => acc + s.codes.length, 0);
    
    document.getElementById('totalPackages').textContent = totalPackages;
    document.getElementById('totalShipments').textContent = todayShipments.length;
}

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
            row.insertCell().textContent = `${shipment.codes.length} código(s)`;
            row.insertCell().textContent = shipment.driver;
            row.insertCell().textContent = shipment.observations || '-';
        });
    }
    
    resultsContainer.hidden = false;
}

// Função para adicionar código à lista
function addCodeToList() {
    const trackingCode = document.getElementById('trackingCode').value.trim();
    
    if (!trackingCode) {
        alert('Por favor, insira um código de rastreio.');
        return;
    }
    
    if (scannedCodes.includes(trackingCode)) {
        alert('Este código já foi adicionado à lista.');
        document.getElementById('trackingCode').value = '';
        document.getElementById('trackingCode').focus();
        return;
    }
    
    scannedCodes.push(trackingCode);
    updateInterface();
    
    document.getElementById('trackingCode').value = '';
    document.getElementById('trackingCode').focus();
}

// Função para atualizar a interface
function updateInterface() {
    const codeList = document.getElementById('codeList');
    const counter = document.getElementById('counter');
    
    codeList.innerHTML = '';
    scannedCodes.forEach(code => {
        const li = document.createElement('li');
        li.innerHTML = `
            ${code}
            <button class="remove-btn" onclick="removeCode('${code}')">×</button>
        `;
        codeList.appendChild(li);
    });
    
    counter.textContent = `${scannedCodes.length} pacote(s)`;
}

// Função para remover código
function removeCode(code) {
    scannedCodes = scannedCodes.filter(c => c !== code);
    updateInterface();
    document.getElementById('trackingCode').focus();
}

// Função para exibir sugestões de motoristas
function displayDriverSuggestions() {
    const datalist = document.getElementById('driverNamesList');
    datalist.innerHTML = '';
    uniqueDrivers.forEach(driver => {
        const option = document.createElement('option');
        option.value = driver;
        datalist.appendChild(option);
    });
}

// Função para exibir modal
function showModal() {
    const driverName = document.getElementById('driverName').value.trim();
    const observations = document.getElementById('observations').value.trim();
    
    if (!driverName) {
        alert('Por favor, insira o nome do motorista.');
        return;
    }
    
    if (scannedCodes.length === 0) {
        alert('Por favor, adicione pelo menos um código de rastreio.');
        return;
    }
    
    const modalDetails = document.getElementById('modal-details');
    modalDetails.innerHTML = `
        <p><strong>Motorista:</strong> ${driverName}</p>
        <p><strong>Quantidade de Pacotes:</strong> ${scannedCodes.length}</p>
        <p><strong>Observações:</strong> ${observations || '-'}</p>
    `;
    
    document.getElementById('confirmation-modal').style.display = 'block';
}

// Função para fechar modal
function closeModal() {
    document.getElementById('confirmation-modal').style.display = 'none';
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
    
    alert('Envio registrado com sucesso!');
}

// Função para gerar arquivo TXT
function generateTXT(shipment) {
    const content = `RELATÓRIO DE ENVIO
Data: ${shipment.date}
Hora: ${shipment.time}
Motorista: ${shipment.driver}
Quantidade de Pacotes: ${shipment.codes.length}
Observações: ${shipment.observations || '-'}

CÓDIGOS DE RASTREIO:
${shipment.codes.join('\n')}`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ENVIO_${shipment.date}_${shipment.driver.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
}

// Função para resetar formulário
function resetForm() {
    scannedCodes = [];
    document.getElementById('trackingCode').value = '';
    document.getElementById('driverName').value = '';
    document.getElementById('observations').value = '';
    updateInterface();
    document.getElementById('trackingCode').focus();
}

// Função para iniciar o scanner
function startScanning() {
    console.log('Iniciando scanner de QR Code...');
    isScanning = true;
    
    const viewport = document.getElementById('interactive');
    viewport.style.display = 'block';
    document.querySelector('.scanner-overlay').style.display = 'block';
    document.getElementById('startScanButton').style.display = 'none';
    document.getElementById('stopScanButton').style.display = 'inline-block';
    
    // Configurar o scanner
    html5QrcodeScanner = new Html5Qrcode("interactive");
    const config = {
        fps: 10,
        qrbox: {
            width: 250,
            height: 250
        },
        aspectRatio: 1.0
    };
    
    html5QrcodeScanner.start(
        { facingMode: "environment" },
        config,
        onScanSuccess,
        onScanError
    )
    .catch(function(err) {
        console.error('Erro ao iniciar scanner:', err);
        alert('Erro ao iniciar a câmera. Verifique as permissões.');
        stopScanning();
    });
}

// Função chamada quando um QR Code é detectado com sucesso
function onScanSuccess(decodedText, decodedResult) {
    console.log('QR Code detectado:', decodedText);
    playBeep();
    processScannedCode(decodedText);
}

// Função chamada quando ocorre um erro na leitura
function onScanError(error) {
    // Ignorar erros de leitura para não encher o console
    // console.warn(`Erro de leitura = ${error}`);
}

// Função para parar o scanner
function stopScanning() {
    console.log('Parando scanner...');
    isScanning = false;
    
    if (html5QrcodeScanner) {
        html5QrcodeScanner.stop()
            .then(() => {
                console.log('Scanner parado com sucesso');
            })
            .catch((err) => {
                console.error('Erro ao parar scanner:', err);
            });
        html5QrcodeScanner = null;
    }

    document.getElementById('interactive').style.display = 'none';
    document.querySelector('.scanner-overlay').style.display = 'none';
    document.getElementById('startScanButton').style.display = 'inline-block';
    document.getElementById('stopScanButton').style.display = 'none';
}

// Função para tocar o som de bipe
function playBeep() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
    gainNode.gain.setValueAtTime(1, audioContext.currentTime);

    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    oscillator.stop(audioContext.currentTime + 0.1);
}

// Função para processar o código lido
function processScannedCode(code) {
    if (!scannedCodes.includes(code)) {
        scannedCodes.push(code);
        updateInterface();
        document.getElementById('trackingCode').value = '';
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Mostrar versão
    displayVersion();
    
    // Inicializar data de busca com hoje
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('searchDate').value = today;
    
    // Atualizar estatísticas e sugestões
    updateDailyStats();
    displayDriverSuggestions();
    
    // Adicionar código ao pressionar Enter
    document.getElementById('trackingCode').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addCodeToList();
        }
    });
    
    // Botões
    document.getElementById('addToListBtn').addEventListener('click', addCodeToList);
    document.getElementById('confirmBtn').addEventListener('click', showModal);
    document.getElementById('searchBtn').addEventListener('click', updateSearchResults);
    
    // Botões do scanner
    document.getElementById('startScanButton').addEventListener('click', startScanning);
    document.getElementById('stopScanButton').addEventListener('click', stopScanning);
}); 
