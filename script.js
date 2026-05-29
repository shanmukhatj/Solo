const STORAGE_KEY = 'soloWorkoutTracker';
const exercises = ['pushups', 'situps', 'squats', 'running'];
const todayKey = new Date().toISOString().slice(0, 10);

function loadStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) || {};
  } catch (error) {
    console.warn('Failed to parse storage, resetting.', error);
    return {};
  }
} 

function saveStorage(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function ensureTodayEntry(data) {
  if (!data[todayKey]) {
    data[todayKey] = {
      pushups: 0,
      situps: 0,
      squats: 0,
      running: 0,
      history: []
    };
  }
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function buildLogMessage(exercise, amount) {
  const label = exercise === 'running' ? 'Ran' : 'Added';
  const value = exercise === 'running' ? `${amount.toFixed(2)} miles` : `${amount} ${exercise}`;
  return `${label} ${value}`;
}

function getAllTimeTotals(data) {
  return exercises.reduce((totals, name) => {
    totals[name] = Object.values(data).reduce((sum, day) => {
      const value = day[name] || 0;
      return sum + Number(value);
    }, 0);
    return totals;
  }, {});
}

function getTodayTotals(data) {
  const today = data[todayKey] || { pushups: 0, situps: 0, squats: 0, running: 0, history: [] };
  return {
    pushups: today.pushups || 0,
    situps: today.situps || 0,
    squats: today.squats || 0,
    running: Number(today.running || 0)
  };
}

function animateValue(element) {
  element.classList.add('pulse');
  element.addEventListener('animationend', () => element.classList.remove('pulse'), { once: true });
}

function updateDisplay(data) {
  const allTime = getAllTimeTotals(data);
  const today = getTodayTotals(data);

  document.getElementById('pushups-today').textContent = today.pushups;
  document.getElementById('situps-today').textContent = today.situps;
  document.getElementById('squats-today').textContent = today.squats;
  document.getElementById('running-today').textContent = today.running.toFixed(2);

  document.getElementById('pushups-alltime').textContent = allTime.pushups;
  document.getElementById('situps-alltime').textContent = allTime.situps;
  document.getElementById('squats-alltime').textContent = allTime.squats;
  document.getElementById('running-alltime').textContent = allTime.running.toFixed(2);

  const repExp = allTime.pushups + allTime.situps + allTime.squats;
  const mileExp = Math.round(allTime.running * 100);
  const totalExp = repExp + mileExp;

  const repExpEl = document.getElementById('repExp');
  const mileExpEl = document.getElementById('mileExp');
  const totalExpEl = document.getElementById('totalExp');

  repExpEl.textContent = repExp;
  mileExpEl.textContent = mileExp;
  totalExpEl.textContent = totalExp;

  animateValue(repExpEl);
  animateValue(mileExpEl);
  animateValue(totalExpEl);

  renderLog(data[todayKey]?.history || []);
}

function renderLog(history) {
  const logList = document.getElementById('logList');
  logList.innerHTML = '';
  if (!history.length) {
    logList.innerHTML = '<div class="log-item">No entries yet. Train hard and log your progress.</div>';
    return;
  }

  history.slice().reverse().forEach(entry => {
    const item = document.createElement('div');
    item.className = 'log-item';
    item.innerHTML = `<strong>${entry.message}</strong><span>${entry.time}</span>`;
    logList.appendChild(item);
  });
}

function addEntry(exercise, value) {
  const data = loadStorage();
  ensureTodayEntry(data);

  if (exercise === 'running') {
    value = Number(value);
    if (!value || value <= 0) return;
    data[todayKey].running = Number((data[todayKey].running + value).toFixed(2));
  } else {
    value = parseInt(value, 10);
    if (!Number.isInteger(value) || value <= 0) return;
    data[todayKey][exercise] = (data[todayKey][exercise] || 0) + value;
  }

  const now = new Date();
  data[todayKey].history.push({
    time: formatTime(now),
    message: buildLogMessage(exercise, value)
  });
  saveStorage(data);
  updateDisplay(data);
}

function resetToday() {
  const data = loadStorage();
  data[todayKey] = {
    pushups: 0,
    situps: 0,
    squats: 0,
    running: 0,
    history: []
  };
  saveStorage(data);
  updateDisplay(data);
}

function wireControls() {
  document.querySelectorAll('.action-btn').forEach(button => {
    button.addEventListener('click', () => {
      const exercise = button.dataset.action;
      const value = parseFloat(button.dataset.value);
      addEntry(exercise, value);
    });
  });

  document.querySelectorAll('.log-btn').forEach(button => {
    button.addEventListener('click', () => {
      const exercise = button.dataset.exercise;
      const input = document.getElementById(`${exercise}-input`);
      const value = input.value;
      if (!value) return;
      addEntry(exercise, value);
      input.value = '';
    });
  });

  document.getElementById('resetToday').addEventListener('click', resetToday);
}

function initialize() {
  const data = loadStorage();
  ensureTodayEntry(data);
  saveStorage(data);
  wireControls();
  updateDisplay(data);
}

initialize();
