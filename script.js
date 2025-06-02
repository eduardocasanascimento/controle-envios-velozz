// Variáveis globais
let shipments = JSON.parse(localStorage.getItem('shipments')) || [];
let scannedCodes = [];
let uniqueDrivers = JSON.parse(localStorage.getItem('uniqueDrivers')) || [];
let isScanning = false;

// Versão do sistema
const APP_VERSION = '1.2.0'; // Atualizado para suporte a QR Code

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

// Configuração do Quagga
function initQuagga() {
    console.log('Iniciando QuaggaJS...');
    
    if (typeof Quagga === 'undefined') {
        alert('Erro: Biblioteca QuaggaJS não foi carregada corretamente.');
        stopScanning();
        return;
    }

    const config = {
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: document.querySelector("#interactive"),
            constraints: {
                facingMode: "environment",
                width: { min: 640 },
                height: { min: 480 },
                aspectRatio: { min: 1, max: 2 }
            },
            area: {
                top: "30%",
                right: "20%",
                left: "20%",
                bottom: "30%"
            }
        },
        locator: {
            patchSize: "medium",
            halfSample: true
        },
        numOfWorkers: navigator.hardwareConcurrency || 4,
        decoder: {
            readers: [
                "qrcode_reader"  // Alterado para ler apenas QR Code
            ]
        },
        locate: true
    };

    try {
        Quagga.init(config, function(err) {
            if (err) {
                console.error('Erro ao inicializar Quagga:', err);
                // Se falhar com Quagga, tentar inicializar com jsQR
                initJsQR();
                return;
            }
            console.log("QuaggaJS iniciado com sucesso");
            Quagga.start();
        });

        Quagga.onDetected(function(result) {
            if (result && result.codeResult) {
                console.log('QR Code detectado:', result.codeResult.code);
                const code = result.codeResult.code;
                playBeep();
                processScannedCode(code);
            }
        });

    } catch (error) {
        console.error('Erro ao configurar Quagga:', error);
        // Se falhar com Quagga, tentar inicializar com jsQR
        initJsQR();
    }
}

// Função alternativa usando jsQR para melhor suporte a QR Code
function initJsQR() {
    const video = document.createElement('video');
    const canvasElement = document.createElement('canvas');
    const canvas = canvasElement.getContext('2d');
    
    document.querySelector("#interactive").appendChild(canvasElement);
    
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
    .then(function(stream) {
        video.srcObject = stream;
        video.setAttribute('playsinline', true);
        video.play();
        
        function tick() {
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                canvasElement.height = video.videoHeight;
                canvasElement.width = video.videoWidth;
                canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
                
                const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height);
                
                if (code) {
                    console.log('QR Code detectado:', code.data);
                    playBeep();
                    processScannedCode(code.data);
                }
            }
            if (isScanning) {
                requestAnimationFrame(tick);
            }
        }
        tick();
    })
    .catch(function(err) {
        console.error('Erro ao acessar a câmera:', err);
        alert('Erro ao acessar a câmera. Verifique se concedeu as permissões necessárias.');
        stopScanning();
    });
}

// Função para processar o código lido
function processScannedCode(code) {
    if (!scannedCodes.includes(code)) {
        scannedCodes.push(code);
        updateInterface();
        document.getElementById('trackingCode').value = '';
    }
}

// Função para iniciar o scanner
function startScanning() {
    console.log('Iniciando processo de scanner...');
    isScanning = true;
    
    const viewport = document.getElementById('interactive');
    const overlay = document.querySelector('.scanner-overlay');
    
    if (!viewport || !overlay) {
        console.error('Elementos do scanner não encontrados');
        return;
    }

    viewport.style.display = 'block';
    overlay.style.display = 'block';
    document.getElementById('startScanButton').style.display = 'none';
    document.getElementById('stopScanButton').style.display = 'inline-block';
    document.getElementById('stopScanButton').disabled = false;

    initQuagga(); // Iniciar Quagga diretamente sem verificação prévia da câmera
}

// Função para parar o scanner
function stopScanning() {
    console.log('Parando scanner...');
    isScanning = false;
    
    try {
        if (typeof Quagga !== 'undefined' && Quagga) {
            Quagga.stop();
            console.log('Scanner parado com sucesso');
        }
    } catch (error) {
        console.error('Erro ao parar Quagga:', error);
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
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime); // Frequência mais alta
    gainNode.gain.setValueAtTime(1, audioContext.currentTime);

    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    oscillator.stop(audioContext.currentTime + 0.1);
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
