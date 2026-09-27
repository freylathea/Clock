// --- 1. AUDIO ENGINE (Synthesizes sound for alarms without external MP3 files) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function triggerBuzzer() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.5);
}

// --- 2. ALARM FUNCTIONALITY ---
let alarms = JSON.parse(localStorage.getItem('alarms')) || [
  { id: '1', time: '08:05', active: true },
  { id: '2', time: '08:10', active: false }
];

function saveAlarms() {
  localStorage.setItem('alarms', JSON.stringify(alarms));
  renderAlarms();
}

function renderAlarms() {
  const list = document.getElementById('alarm-list');
  list.innerHTML = '';
  alarms.forEach(alarm => {
    const card = document.createElement('div');
    card.className = 'alarm-card';
    card.innerHTML = `
      <div>
        <div class="alarm-time">${alarm.time}</div>
        <div class="alarm-label">Daily</div>
      </div>
      <label class="switch">
        <input type="checkbox" ${alarm.active ? 'checked' : ''} onchange="toggleAlarm('${alarm.id}')">
        <span class="slider"></span>
      </label>
    `;
    list.appendChild(card);
  });
}

function toggleAlarm(id) {
  alarms = alarms.map(a => a.id === id ? { ...a, active: !a.active } : a);
  saveAlarms();
}

function addAlarm() {
  const time = prompt('Enter alarm time (HH:MM 24-hr format):', '07:00');
  if (time && /^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    alarms.push({ id: Date.now().toString(), time: time, active: true });
    saveAlarms();
  }
}

// Background Alarm Monitoring Daemon (Checks every second)
setInterval(() => {
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const seconds = now.getSeconds();

  if (seconds === 0) { // Trigger at top of minute
    alarms.forEach(alarm => {
      if (alarm.active && alarm.time === currentTime) {
        triggerBuzzer();
        alert(`ALARM RINGING: ${alarm.time}`);
      }
    });
  }
}, 1000);

// --- 3. WORLD CLOCK FUNCTIONALITY ---
const timezones = [
  { name: 'Local Time', zone: undefined },
  { name: 'New York (EST)', zone: 'America/New_York' },
  { name: 'London (GMT)', zone: 'Europe/London' },
  { name: 'Tokyo (JST)', zone: 'Asia/Tokyo' }
];

function updateWorldClock() {
  const list = document.getElementById('world-clock-list');
  list.innerHTML = '';
  timezones.forEach(tz => {
    const date = new Date();
    const timeStr = date.toLocaleTimeString('en-US', { timeZone: tz.zone, hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const card = document.createElement('div');
    card.className = 'alarm-card';
    card.innerHTML = `
      <div>
        <div style="font-size: 16px; font-weight: bold;">${tz.name}</div>
        <div class="alarm-label">${tz.zone || 'System Local'}</div>
      </div>
      <div class="alarm-time">${timeStr}</div>
    `;
    list.appendChild(card);
  });
}
setInterval(updateWorldClock, 1000);

// --- 4. TIMER FUNCTIONALITY ---
let timerInterval = null;
let timerTotalSeconds = 0;

function startTimer() {
  if (timerInterval) return;
  if (timerTotalSeconds === 0) {
    const mins = parseInt(document.getElementById('t-min').value) || 0;
    const secs = parseInt(document.getElementById('t-sec').value) || 0;
    timerTotalSeconds = mins * 60 + secs;
  }
  
  if (timerTotalSeconds <= 0) return;

  timerInterval = setInterval(() => {
    timerTotalSeconds--;
    const m = String(Math.floor(timerTotalSeconds / 60)).padStart(2, '0');
    const s = String(timerTotalSeconds % 60).padStart(2, '0');
    document.getElementById('timer-display').innerText = `${m}:${s}`;

    if (timerTotalSeconds <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      triggerBuzzer();
      alert('Timer Finished!');
    }
  }, 1000);
}

function pauseTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function resetTimer() {
  pauseTimer();
  timerTotalSeconds = 0;
  document.getElementById('timer-display').innerText = "00:00";
}

// --- 5. STOPWATCH FUNCTIONALITY ---
let swStartTime = 0;
let swElapsedTime = 0;
let swInterval = null;

function startSW() {
  if (swInterval) return;
  swStartTime = Date.now() - swElapsedTime;
  swInterval = setInterval(() => {
    swElapsedTime = Date.now() - swStartTime;
    
    const ms = String(Math.floor((swElapsedTime % 1000) / 10)).padStart(2, '0');
    const totalSecs = Math.floor(swElapsedTime / 1000);
    const s = String(totalSecs % 60).padStart(2, '0');
    const m = String(Math.floor(totalSecs / 60)).padStart(2, '0');
    
    document.getElementById('sw-display').innerText = `${m}:${s}.${ms}`;
  }, 10);
}

function pauseSW() {
  clearInterval(swInterval);
  swInterval = null;
}

function resetSW() {
  pauseSW();
  swElapsedTime = 0;
  document.getElementById('sw-display').innerText = "00:00.00";
}

// --- TAB SWITCHING ---
function switchTab(tab, btn) {
  document.querySelectorAll('.tab-view').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
  
  document.getElementById(`tab-${tab}`).classList.add('active');
  btn.classList.add('active');
  document.getElementById('title').innerText = btn.innerText;
  document.getElementById('add-btn').style.display = tab === 'alarm' ? 'block' : 'none';
}

// Initial Run
renderAlarms();
updateWorldClock();