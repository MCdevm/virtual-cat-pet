/* ============================================
   VIRTUAL CAT PET — Game Logic
   ============================================ */

// ──────────────── STATE ────────────────
const state = {
  name:       '',
  color:      'orange',
  accessory:  'none',
  hunger:     80,      // 0=starving, 100=full
  happiness:  70,      // 0=sad, 100=ecstatic
  energy:     90,      // 0=exhausted, 100=rested
  level:      1,
  exp:        0,
  expNeeded:  100,
  isSleeping: false,
  isGameOver: false,
};

const ACCESSORY_MAP = {
  none:    { text: '',   cls: '' },
  wizard:  { text: '🧙', cls: '' },
  bow:     { text: '🎀', cls: 'bow-collar' },
  crown:   { text: '👑', cls: '' },
  glasses: { text: '🕶️', cls: '' },
};

// ──────────────── STARTUP ────────────────
window.addEventListener('DOMContentLoaded', () => {
  // Default color
  applyColorToElement(document.getElementById('preview-cat'), 'orange');

  // Color picker
  document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.color = btn.dataset.color;
      applyColorToElement(document.getElementById('preview-cat'), state.color);
    });
  });

  // Tick every 3 seconds
  setInterval(gameTick, 3000);
});

// ──────────────── COLOR UTILS ────────────────
function applyColorToElement(el, color) {
  if (!el) return;
  el.classList.remove('color-orange','color-gray','color-black','color-cream','color-brown');
  el.classList.add(`color-${color}`);
}

// ──────────────── START GAME ────────────────
function startGame() {
  const nameInput = document.getElementById('cat-name-input').value.trim();
  if (!nameInput) {
    shakeInput();
    return;
  }
  state.name = nameInput;

  document.getElementById('screen-creation').classList.remove('active');
  document.getElementById('screen-petcare').classList.add('active');

  // Apply color to main cat
  applyColorToElement(document.getElementById('main-cat'), state.color);

  // Set name
  document.getElementById('display-cat-name').textContent = `น้องแมว "${state.name}"`;

  updateUI();
  addLog(`🐱 ${state.name} มาถึงบ้านแล้ว! ยินดีต้อนรับ~`);
}

function shakeInput() {
  const input = document.getElementById('cat-name-input');
  input.style.animation = 'none';
  input.style.border = '2px solid #FF6B9D';
  input.placeholder = 'ต้องตั้งชื่อก่อนนะ! 🐾';
  setTimeout(() => {
    input.style.border = '';
    input.placeholder = 'เช่น มูมู่, ออมสิน, พิกซี่…';
  }, 1500);
}

// ──────────────── GAME TICK ────────────────
function gameTick() {
  if (state.isGameOver || state.isSleeping) return;

  // Decay stats
  state.hunger    = clamp(state.hunger    - 3, 0, 100);
  state.happiness = clamp(state.happiness - 2, 0, 100);
  state.energy    = clamp(state.energy    - 1, 0, 100);

  checkGameOver();
  updateUI();
}

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function checkGameOver() {
  if (state.hunger <= 0 || state.happiness <= 0 || state.energy <= 0) {
    triggerGameOver();
  }
}

// ──────────────── ACTIONS ────────────────
function feedCat() {
  if (state.isGameOver) return;
  if (state.isSleeping) { wakeUp(); return; }

  state.hunger    = clamp(state.hunger + 25, 0, 100);
  state.happiness = clamp(state.happiness + 5, 0, 100);
  gainExp(10);

  triggerAnimation('feed');
  showReaction('😋');
  addLog(`🍣 ให้อาหาร${state.name}แล้ว! อร่อยมาก~`);
  updateUI();
}

function playCat() {
  if (state.isGameOver) return;
  if (state.isSleeping) { wakeUp(); return; }
  if (state.energy < 10) {
    showReaction('😩');
    addLog(`😴 ${state.name} เหนื่อยเกินไปแล้ว ให้พักก่อนนะ!`);
    return;
  }

  state.happiness = clamp(state.happiness + 20, 0, 100);
  state.hunger    = clamp(state.hunger - 5, 0, 100);
  state.energy    = clamp(state.energy - 10, 0, 100);
  gainExp(15);

  triggerAnimation('play');
  animateToy();
  showReaction('🎉');
  addLog(`🧶 เล่นไหมพรมกับ${state.name}แล้ว! สนุกมาก~`);
  updateUI();
}

function sleepCat() {
  if (state.isGameOver) return;
  if (state.isSleeping) { wakeUp(); return; }

  state.isSleeping = true;
  document.getElementById('btn-sleep').textContent = '☀️ ปลุกน้องแมว';

  // eyes go sleepy
  document.getElementById('cat-eyes').classList.add('sleeping');
  document.getElementById('cat-eyes').classList.remove('happy','sad');

  const mainCat = document.getElementById('main-cat');
  mainCat.classList.add('cat-anim-sleep');

  showReaction('💤');
  addLog(`😴 ${state.name} กำลังหลับ… zzzz`);

  // Recover energy while sleeping
  const sleepTick = setInterval(() => {
    if (!state.isSleeping) { clearInterval(sleepTick); return; }
    state.energy = clamp(state.energy + 8, 0, 100);
    updateUI();
    if (state.energy >= 100) {
      clearInterval(sleepTick);
      wakeUp();
    }
  }, 2000);
}

function wakeUp() {
  state.isSleeping = false;
  const btn = document.getElementById('btn-sleep');
  btn.innerHTML = '<span class="action-icon">😴</span><span>พักผ่อน</span>';
  const mainCat = document.getElementById('main-cat');
  mainCat.classList.remove('cat-anim-sleep');
  mainCat.style.animation = '';
  // restore idle float
  setTimeout(() => { mainCat.style.animation = ''; }, 50);
  showReaction('☀️');
  addLog(`☀️ ${state.name} ตื่นขึ้นมาแล้ว พร้อมเล่นใหม่!`);
  updateUI();
}

function animateToy() {
  const toy = document.getElementById('env-toy');
  toy.style.transform = 'scale(1.5) rotate(20deg)';
  toy.style.transition = 'all 0.2s';
  setTimeout(() => {
    toy.style.transform = '';
  }, 400);
}

// ──────────────── ACCESSORY ────────────────
function changeAccessory(value) {
  state.accessory = value;
  const info = ACCESSORY_MAP[value];

  // Apply to preview cat
  applyAccessoryTo('preview-accessory', info);
  // Apply to main cat
  applyAccessoryTo('main-accessory', info);

  addLog(`✨ ใส่ ${value === 'none' ? 'ไม่ใส่อะไร' : getAccessoryName(value)} ให้${state.name}แล้ว!`);
}

function applyAccessoryTo(elId, info) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent  = info.text;
  el.className    = `accessory-overlay ${info.cls}`;
}

function getAccessoryName(v) {
  const names = { wizard:'หมวกพ่อมด', bow:'ปลอกคอโบว์', crown:'มงกุฎ', glasses:'แว่นกันแดด' };
  return names[v] || v;
}

// ──────────────── UI UPDATE ────────────────
function updateUI() {
  if (!document.getElementById('screen-petcare').classList.contains('active')) return;

  // Stat bars
  setBar('hunger',    state.hunger);
  setBar('happiness', state.happiness);
  setBar('energy',    state.energy);

  // Level / EXP
  document.getElementById('level-text').textContent = `Level ${state.level}`;
  document.getElementById('exp-text').textContent   = `${state.exp} / ${state.expNeeded} XP`;
  document.getElementById('exp-bar').style.width    = `${(state.exp / state.expNeeded) * 100}%`;

  // Mood
  updateMood();
}

function setBar(key, val) {
  document.getElementById(`${key}-bar`).style.width = `${val}%`;
  document.getElementById(`${key}-val`).textContent = `${Math.round(val)}%`;

  // Color shift when low
  const bar = document.getElementById(`${key}-bar`);
  if (val < 25) bar.style.filter = 'saturate(1.5) hue-rotate(-20deg)';
  else          bar.style.filter = '';
}

function updateMood() {
  const avg = (state.hunger + state.happiness + state.energy) / 3;
  const eyes = document.getElementById('cat-eyes');
  const badge = document.getElementById('mood-badge');
  let mood, emoji;

  if (state.isSleeping) {
    mood = 'กำลังหลับ'; emoji = '💤';
    eyes.classList.remove('happy','sad');
    eyes.classList.add('sleeping');
  } else if (avg >= 75) {
    mood = 'แฮปปี้มาก!'; emoji = '😸';
    eyes.classList.add('happy'); eyes.classList.remove('sad','sleeping');
  } else if (avg >= 50) {
    mood = 'ปกติดี'; emoji = '😊';
    eyes.classList.remove('happy','sad','sleeping');
  } else if (avg >= 25) {
    mood = 'ไม่ค่อยดีนัก'; emoji = '😿';
    eyes.classList.add('sad'); eyes.classList.remove('happy','sleeping');
  } else {
    mood = 'อยากได้รับการดูแล!'; emoji = '😰';
    eyes.classList.add('sad'); eyes.classList.remove('happy','sleeping');
  }

  badge.textContent = `${emoji} ${mood}`;
}

// ──────────────── EXP & LEVEL ────────────────
function gainExp(amount) {
  state.exp += amount;
  while (state.exp >= state.expNeeded) {
    state.exp -= state.expNeeded;
    state.level++;
    state.expNeeded = Math.floor(state.expNeeded * 1.5);
    showReaction('⭐');
    addLog(`🎉 เลเวลอัพ! ${state.name} ขึ้นเป็น Level ${state.level} แล้ว!`);
  }
}

// ──────────────── REACTION BUBBLE ────────────────
let reactionTimeout = null;
function showReaction(emoji) {
  const bubble = document.getElementById('reaction-bubble');
  bubble.textContent = emoji;
  bubble.classList.remove('show');
  void bubble.offsetWidth; // reflow
  bubble.classList.add('show');

  clearTimeout(reactionTimeout);
  reactionTimeout = setTimeout(() => bubble.classList.remove('show'), 1800);
}

// ──────────────── ANIMATION ────────────────
function triggerAnimation(type) {
  const cat = document.getElementById('main-cat');
  cat.classList.remove('cat-anim-feed','cat-anim-play','cat-anim-sleep');
  void cat.offsetWidth;
  cat.classList.add(`cat-anim-${type}`);
  if (type !== 'sleep') {
    setTimeout(() => cat.classList.remove(`cat-anim-${type}`), 900);
  }
}

// ──────────────── ACTIVITY LOG ────────────────
function addLog(msg) {
  const log = document.getElementById('activity-log');
  if (!log) return;
  const li = document.createElement('li');
  li.className = 'log-item';
  li.textContent = msg;
  log.prepend(li);
  // keep max 20 entries
  while (log.children.length > 20) log.removeChild(log.lastChild);
}

// ──────────────── GAME OVER ────────────────
function triggerGameOver() {
  state.isGameOver = true;
  let reason = '';
  if (state.hunger <= 0)    reason = 'น้องแมวหิวมากจนเป็นลม…';
  else if (state.happiness <= 0) reason = 'น้องแมวเศร้ามากเลย ต้องการความรัก!';
  else if (state.energy <= 0)    reason = 'น้องแมวเหนื่อยมากจนล้มป่วย…';

  document.getElementById('gameover-msg').textContent = reason;
  document.getElementById('gameover-overlay').classList.remove('hidden');
}

// ──────────────── RESET ────────────────
function resetGame() {
  state.hunger = 80;
  state.happiness = 70;
  state.energy = 90;
  state.level = 1;
  state.exp = 0;
  state.expNeeded = 100;
  state.isSleeping = false;
  state.isGameOver = false;
  state.name = '';
  state.color = 'orange';
  state.accessory = 'none';

  document.getElementById('gameover-overlay').classList.add('hidden');
  document.getElementById('screen-petcare').classList.remove('active');
  document.getElementById('screen-creation').classList.add('active');

  // Reset form
  document.getElementById('cat-name-input').value = '';
  document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('color-orange').classList.add('active');
  applyColorToElement(document.getElementById('preview-cat'), 'orange');

  // Reset accessory
  document.getElementById('acc-none').checked = true;
  applyAccessoryTo('preview-accessory', ACCESSORY_MAP['none']);

  // Reset activity log
  const log = document.getElementById('activity-log');
  log.innerHTML = '<li class="log-item">🐱 น้องแมวมาถึงบ้านแล้ว!</li>';

  // Reset sleep button
  const btn = document.getElementById('btn-sleep');
  btn.innerHTML = '<span class="action-icon">😴</span><span>พักผ่อน</span>';
}
