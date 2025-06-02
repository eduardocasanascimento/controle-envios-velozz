// Variáveis globais
let shipments = JSON.parse(localStorage.getItem('shipments')) || [];
let scannedCodes = [];
let uniqueDrivers = JSON.parse(localStorage.getItem('uniqueDrivers')) || [];
let isScanning = false;
let html5QrcodeScanner = null;
let lastScanTime = 0;

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
