// scripts/main.js

const audioFileInput = document.getElementById('audioFile');
const canvas = document.getElementById('audioCanvas');
const canvasContext = canvas.getContext('2d');
const themeSelector = document.getElementById('themeSelector');
const visualizerSelector = document.getElementById('visualizerSelector');
const body = document.body;

themeSelector.addEventListener('change', function() {
    body.className = themeSelector.value;
});

audioFileInput.addEventListener('change', function(event) {
    const audioFile = event.target.files[0];
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const reader = new FileReader();

    reader.onload = function(e) {
        audioContext.decodeAudioData(e.target.result, function(buffer) {
            const audioSource = audioContext.createBufferSource();
            audioSource.buffer = buffer;
            const analyser = audioContext.createAnalyser();
            audioSource.connect(analyser);
            analyser.connect(audioContext.destination);
            audioSource.start(0);
            visualizeAudio(analyser);
        });
    };

    reader.readAsArrayBuffer(audioFile);
});

function visualizeAudio(analyser) {
    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.6;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
        requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);
        canvasContext.clearRect(0, 0, canvas.width, canvas.height);

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
    const barWidth = (canvas.width / bufferLength) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i];
        canvasContext.fillStyle = `rgb(${barHeight + 100}, 50, 50)`;
        canvasContext.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);
        x += barWidth + 1;
    }
}

function drawCircles(dataArray, bufferLength) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) / 2;

    for (let i = 0; i < bufferLength; i++) {
        const angle = (i / bufferLength) * 2 * Math.PI;
        const barHeight = dataArray[i] / 2;
        const x = centerX + (radius + barHeight) * Math.cos(angle);
        const y = centerY + (radius + barHeight) * Math.sin(angle);
        canvasContext.beginPath();
        canvasContext.arc(x, y, 2, 0, 2 * Math.PI);
        canvasContext.fillStyle = `rgb(${barHeight + 100}, 50, 50)`;
        canvasContext.fill();
    }
}

function drawWaves(dataArray, bufferLength) {
    const sliceWidth = canvas.width / bufferLength;
    let x = 0;

    canvasContext.beginPath();
    for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;
        if (i === 0) {
            canvasContext.moveTo(x, y);
        } else {
            canvasContext.lineTo(x, y);
        }
        x += sliceWidth;
    }
    canvasContext.lineTo(canvas.width, canvas.height / 2);
    canvasContext.strokeStyle = 'rgb(0, 255, 0)';
    canvasContext.stroke();
}
