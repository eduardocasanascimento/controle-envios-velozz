// Variáveis globais
let shipments = JSON.parse(localStorage.getItem('shipments')) || [];
let scannedCodes = [];
let uniqueDrivers = JSON.parse(localStorage.getItem('uniqueDrivers')) || [];
let isScanning = false;
let html5QrcodeScanner = null;
let lastScanTime = 0;
let errorBeep = new Audio('data:audio/mp3;base64,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');

// Versão do sistema
const APP_VERSION = '1.3.2'; // Atualizado com correções

// Função para mostrar versão
function displayVersion() {
    const existingVersion = document.getElementById('version-info');
    if (existingVersion) {
        existingVersion.remove();
    }
    
    const versionElement = document.createElement('div');
    versionElement.id = 'version-info';
    versionElement.textContent = `v${APP_VERSION}`;
    document.body.appendChild(versionElement);
    console.log('Versão exibida:', APP_VERSION);
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
            row.insertCell().textContent = shipment.codes.join(', ');
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
    
    if (!Html5Qrcode) {
        console.error('Biblioteca Html5Qrcode não encontrada');
        alert('Erro ao iniciar o scanner. A biblioteca necessária não foi carregada.');
        return;
    }
    
    isScanning = true;
    
    const viewport = document.getElementById('interactive');
    if (!viewport) {
        console.error('Elemento viewport não encontrado');
        return;
    }
    
    viewport.innerHTML = ''; // Limpa o conteúdo anterior
    viewport.style.display = 'block';
    
    const overlay = document.querySelector('.scanner-overlay');
    if (overlay) {
        overlay.style.display = 'block';
    }
    
    document.getElementById('startScanButton').style.display = 'none';
    document.getElementById('stopScanButton').style.display = 'inline-block';
    
    try {
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

        // Adiciona o botão de fechar
        const closeButton = document.createElement('button');
        closeButton.id = 'closeScanner';
        closeButton.innerHTML = '✕';
        closeButton.onclick = stopScanning;
        viewport.appendChild(closeButton);
        
        console.log('Scanner iniciado com sucesso');
    } catch (error) {
        console.error('Erro ao configurar o scanner:', error);
        alert('Erro ao iniciar o scanner. Por favor, tente novamente.');
        stopScanning();
    }
}

// Função chamada quando um QR Code é detectado com sucesso
function onScanSuccess(decodedText, decodedResult) {
    const currentTime = new Date().getTime();
    if (currentTime - lastScanTime < 500) { // 500ms de delay entre leituras
        return;
    }
    
    lastScanTime = currentTime;
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
    const audio = new Audio('C:\\Users\\USER\\Downloads\\👋 Efeito sonoro de resposta correta - Tin.mp3');
    audio.play().catch(error => {
        console.error('Erro ao tocar o som:', error);
        // Fallback para o beep padrão em caso de erro
        playFallbackBeep();
    });
}

// Função de beep fallback
function playFallbackBeep() {
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

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('Página carregada, inicializando...');
    
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
    
    // Configurar botões
    const startScanButton = document.getElementById('startScanButton');
    const stopScanButton = document.getElementById('stopScanButton');
    const addToListBtn = document.getElementById('addToListBtn');
    const confirmBtn = document.getElementById('confirmBtn');
    const searchBtn = document.getElementById('searchBtn');
    
    if (startScanButton) {
        startScanButton.addEventListener('click', () => {
            console.log('Botão iniciar scanner clicado');
            startScanning();
        });
    }
    
    if (stopScanButton) {
        stopScanButton.addEventListener('click', () => {
            console.log('Botão parar scanner clicado');
            stopScanning();
        });
    }
    
    if (addToListBtn) {
        addToListBtn.addEventListener('click', addCodeToList);
    }
    
    if (confirmBtn) {
        confirmBtn.addEventListener('click', showModal);
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', updateSearchResults);
    }
    
    console.log('Event listeners configurados');
}); 
