const audioFileInput = document.getElementById('audioFile');
const audioCanvas = document.getElementById('audioCanvas');
const waveformCanvas = document.getElementById('waveformCanvas');
const audioCanvasContext = audioCanvas.getContext('2d');
const waveformCanvasContext = waveformCanvas.getContext('2d');
const themeSelector = document.getElementById('themeSelector');
const visualizerSelector = document.getElementById('visualizerSelector');
const sensitivitySlider = document.getElementById('sensitivitySlider');
const volumeSlider = document.getElementById('volumeSlider');
const playPauseButton = document.getElementById('playPauseButton');
const body = document.body;

let audioContext;
let audioSource;
let analyser;
let isPlaying = false;
let sensitivity = sensitivitySlider.value;

themeSelector.addEventListener('change', function() {
    body.className = themeSelector.value;
});

sensitivitySlider.addEventListener('input', function() {
    sensitivity = sensitivitySlider.value;
});

volumeSlider.addEventListener('input', function() {
    if (audioSource && audioSource.gainNode) {
        audioSource.gainNode.gain.value = volumeSlider.value;
    }
});

playPauseButton.addEventListener('click', function() {
    if (isPlaying) {
        audioContext.suspend().then(() => {
            playPauseButton.innerHTML = '<i class="fas fa-play"></i>';
            isPlaying = false;
        });
    } else {
        audioContext.resume().then(() => {
            playPauseButton.innerHTML = '<i class="fas fa-pause"></i>';
            isPlaying = true;
        });
    }
});

audioFileInput.addEventListener('change', function(event) {
    const audioFile = event.target.files[0];
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const reader = new FileReader();

    reader.onload = function(e) {
        audioContext.decodeAudioData(e.target.result, function(buffer) {
            if (audioSource) {
                audioSource.disconnect();
            }
            audioSource = audioContext.createBufferSource();
            analyser = audioContext.createAnalyser();
            const gainNode = audioContext.createGain();
            audioSource.buffer = buffer;
            audioSource.connect(gainNode);
            gainNode.connect(analyser);
            analyser.connect(audioContext.destination);
            gainNode.gain.value = volumeSlider.value;
            audioSource.start(0);
            isPlaying = true;
            playPauseButton.innerHTML = '<i class="fas fa-pause"></i>';
            visualizeAudio(analyser);
            drawWaveform(buffer);
        });
    };

    reader.readAsArrayBuffer(audioFile);
});

function visualizeAudio(analyser) {
    audioCanvas.width = window.innerWidth * 0.8;
    audioCanvas.height = window.innerHeight * 0.6;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
        requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);
        audioCanvasContext.clearRect(0, 0, audioCanvas.width, audioCanvas.height);

        const gradient = audioCanvasContext.createLinearGradient(0, 0, audioCanvas.width, audioCanvas.height);
        gradient.addColorStop(0, '#1a1a1a');
        gradient.addColorStop(1, '#333333');
        audioCanvasContext.fillStyle = gradient;
        audioCanvasContext.fillRect(0, 0, audioCanvas.width, audioCanvas.height);

        const visualizerType = visualizerSelector.value;
        if (visualizerType === 'bars') {
            drawBars(dataArray, bufferLength);
        } else if (visualizerType === 'circles') {
            drawCircles(dataArray, bufferLength);
        } else if (visualizerType === 'waves') {
            drawWaves(dataArray, bufferLength);
        }
    }

    draw();
}

function drawBars(dataArray, bufferLength) {
    const barWidth = (audioCanvas.width / bufferLength) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] * sensitivity / 5;
        audioCanvasContext.fillStyle = `rgb(${barHeight + 100}, 50, 50)`;
        audioCanvasContext.fillRect(x, audioCanvas.height - barHeight / 2, barWidth, barHeight / 2);
        x += barWidth + 1;
    }
}

function drawCircles(dataArray, bufferLength) {
    const centerX = audioCanvas.width / 2;
    const centerY = audioCanvas.height / 2;
    const radius = Math.min(centerX, centerY) / 2;

    for (let i = 0; i < bufferLength; i++) {
        const angle = (i / bufferLength) * 2 * Math.PI;
        const barHeight = dataArray[i] * sensitivity / 10;
        const x = centerX + (radius + barHeight) * Math.cos(angle);
        const y = centerY + (radius + barHeight) * Math.sin(angle);
        audioCanvasContext.beginPath();
        audioCanvasContext.arc(x, y, 2, 0, 2 * Math.PI);
        audioCanvasContext.fillStyle = `rgb(${barHeight + 100}, 50, 50)`;
        audioCanvasContext.fill();
    }
}

function drawWaves(dataArray, bufferLength) {
    const sliceWidth = audioCanvas.width / bufferLength;
    let x = 0;

    audioCanvasContext.beginPath();
    for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0 * sensitivity / 5;
        const y = (v * audioCanvas.height) / 2;
        if (i === 0) {
            audioCanvasContext.moveTo(x, y);
        } else {
            audioCanvasContext.lineTo(x, y);
        }
        x += sliceWidth;
    }
    audioCanvasContext.lineTo(audioCanvas.width, audioCanvas.height / 2);
    audioCanvasContext.strokeStyle = '#ff0000';
    audioCanvasContext.stroke();
}

function drawWaveform(buffer) {
    waveformCanvas.width = window.innerWidth * 0.8;
    const bufferLength = buffer.length;
    const dataArray = new Float32Array(bufferLength);
    waveformCanvasContext.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height);

    const sampleRate = audioContext.sampleRate;
    const duration = buffer.duration;
    const numberOfSamples = Math.floor(duration * sampleRate);
    const step = Math.ceil(numberOfSamples / waveformCanvas.width);

    function draw() {
        requestAnimationFrame(draw);
        const channelData = buffer.getChannelData(0);
        waveformCanvasContext.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height);
        waveformCanvasContext.beginPath();
        waveformCanvasContext.moveTo(0, waveformCanvas.height / 2);
        for (let x = 0; x < waveformCanvas.width; x++) {
            const sampleIndex = x * step;
            const sampleValue = channelData[sampleIndex] || 0;
            const y = (1 - sampleValue) * waveformCanvas.height / 2;
            waveformCanvasContext.lineTo(x, y);
        }
        waveformCanvasContext.strokeStyle = '#ff0000';
        waveformCanvasContext.stroke();
    }

    draw();
}
