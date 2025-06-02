// Variáveis globais
let shipments = JSON.parse(localStorage.getItem('shipments')) || [];
let scannedCodes = [];
let uniqueDrivers = JSON.parse(localStorage.getItem('uniqueDrivers')) || [];
let isScanning = false;
let html5QrcodeScanner = null;
let lastScanTime = 0;

// Versão do sistema
const APP_VERSION = '1.3.1'; // Atualizado com melhorias no scanner

// ... existing code ...

// Função para iniciar o scanner
function startScanning() {
    console.log('Iniciando scanner de QR Code...');
    isScanning = true;
    
    const viewport = document.getElementById('interactive');
    viewport.innerHTML = ''; // Limpa o conteúdo anterior
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

    // Adiciona o botão de fechar
    const closeButton = document.createElement('button');
    closeButton.id = 'closeScanner';
    closeButton.innerHTML = '✕';
    closeButton.onclick = stopScanning;
    viewport.appendChild(closeButton);
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

// ... resto do código existente ...
