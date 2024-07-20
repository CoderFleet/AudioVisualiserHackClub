const audioFileInput = document.getElementById('audioFile');
const canvas = document.getElementById('audioCanvas');
const canvasContext = canvas.getContext('2d');

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

    draw();
}
