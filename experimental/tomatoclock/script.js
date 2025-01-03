let timer;
let isRunning = false;
let startTime;
let elapsedTime = 0;
const timerDisplay = document.getElementById('timer-display');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const resetBtn = document.getElementById('reset-btn');
const exportBtn = document.getElementById('export-btn');

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const remainingSeconds = (seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${remainingSeconds}`;
}

function startTimer() {
    if (!isRunning) {
        startTime = Date.now();
        isRunning = true;
        timer = setInterval(() => {
            elapsedTime = Math.floor((Date.now() - startTime) / 1000);
            const remainingTime = 25 * 60 - elapsedTime;
            if (remainingTime <= 0) {
                clearInterval(timer);
                isRunning = false;
                alert('番茄钟时间到！');
                return;
            }
            timerDisplay.textContent = formatTime(remainingTime);
        }, 1000);
    }
}

function stopTimer() {
    if (isRunning) {
        clearInterval(timer);
        isRunning = false;
    }
}

function resetTimer() {
    stopTimer();
    elapsedTime = 0;
    timerDisplay.textContent = formatTime(25 * 60);
}

function exportRecords() {
    const record = {
        startTime: new Date(startTime).toISOString(),
        elapsedTime: elapsedTime,
        totalTime: 25 * 60
    };
    const jsonData = JSON.stringify(record);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tomato-clock-record.json';
    a.click();
    URL.revokeObjectURL(url);
}

startBtn.addEventListener('click', startTimer);
stopBtn.addEventListener('click', stopTimer);
resetBtn.addEventListener('click', resetTimer);
exportBtn.addEventListener('click', exportRecords);