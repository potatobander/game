import { GameEngine } from './engine.js';
import { SceneRenderer } from './scene.js';

const $ = (id) => document.getElementById(id);
const engine = new GameEngine({ mode: 'normal' });
const renderer = new SceneRenderer($('scene'));
const modeLabels = { chill: '散步热身', normal: '日常通勤', rush: '极限早八' };
let mode = 'normal';
let previousPhase = 'ready';
let feedbackUntil = 0;
let soundOn = false;
let audioContext;
let records = {};
try { records = JSON.parse(localStorage.getItem('wait-for-me-records-v1')) || {}; } catch { /* Storage is optional. */ }
if (typeof records !== 'object' || Array.isArray(records)) records = {};

function announce(message) { $('announcer').textContent = message; }
function sound(kind) {
  if (!soundOn) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume();
    const notes = kind === 'won' ? [523, 659, 784, 1046] : kind === 'miss' ? [145, 110] : kind === 'lost' ? [330, 247, 196] : [kind === 'left' ? 360 : 440];
    notes.forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const at = audioContext.currentTime + index * .11;
      oscillator.type = kind === 'miss' ? 'triangle' : 'sine';
      oscillator.frequency.setValueAtTime(frequency, at);
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(.09, at + .008);
      gain.gain.exponentialRampToValueAtTime(.001, at + .15);
      oscillator.connect(gain); gain.connect(audioContext.destination);
      oscillator.start(at); oscillator.stop(at + .16);
    });
  } catch { /* Game remains playable without audio support. */ }
}
function updateRecord() {
  const record = records[mode];
  if (record && Number.isFinite(record.elapsed)) {
    $('best').textContent = `${record.elapsed.toFixed(2)} 秒 · ${record.stumbles === 0 ? '零失误上车' : '成功上车'}`;
    $('best-note').textContent = `${modeLabels[mode]} · 最佳用时`;
  } else {
    $('best').textContent = '下一张车票，等你来拿';
    $('best-note').textContent = `${modeLabels[mode]} · 成绩保存在此浏览器`;
  }
}
function showReady() {
  $('overlay').hidden = false;
  $('card-kicker').textContent = '你的公交就要开了';
  $('card-title').innerHTML = '再跑两步，<br>就能赶上好事。';
  $('card-copy').innerHTML = '交替点击左脚、右脚<br>在车门关闭前，跑到公交旁！';
  $('start').innerHTML = '出发，追上这班车 <span>↗</span>';
  $('start-hint').textContent = '按空格开始 · 第一脚左右都可以';
  $('result-metrics').hidden = true;
  $('feedback').classList.remove('visible');
}
function start() {
  if (engine.state.paused) { togglePause(); return; }
  engine.start(performance.now());
  previousPhase = 'playing';
  $('overlay').hidden = true;
  $('feedback').classList.remove('visible');
  document.activeElement?.blur();
  announce('出发！左右脚交替，在关门前跑到车门。');
  sound('left');
  syncUI(performance.now());
}
function restart() {
  engine.reset(mode);
  previousPhase = 'ready';
  showReady();
  syncUI(performance.now());
}
function finish() {
  const s = engine.state;
  const won = s.phase === 'won';
  const elapsed = Math.max(0, s.duration - s.timeLeft);
  let newBest = false;
  if (won && (!records[mode] || !Number.isFinite(records[mode].elapsed) || elapsed < records[mode].elapsed)) {
    records[mode] = { elapsed, stumbles: s.stumbles };
    try { localStorage.setItem('wait-for-me-records-v1', JSON.stringify(records)); } catch { /* Optional persistence. */ }
    newBest = true; updateRecord();
  }
  $('overlay').hidden = false;
  $('card-kicker').textContent = won ? '21 路 · 幸福里乘车凭证' : '末班倒计时已结束';
  $('card-title').innerHTML = won ? '上车啦！<br>下一站，好运。' : '差一点点！<br>下一班，一定赶上。';
  $('card-copy').textContent = won ? (newBest ? '新纪录！这张车票，值得好好收藏。' : '师傅笑着说：下次记得早点出门。') : '稳住节奏，左右交替。师傅再给你一次机会。';
  $('result-metrics').hidden = false;
  $('result-metrics').innerHTML = `<span><strong>${won ? elapsed.toFixed(2) : s.distance.toFixed(1)}</strong>${won ? '秒，成功上车' : '米，就差这么远'}</span><span><strong>${s.bestCombo}</strong>最长连续步数</span><span><strong>${s.stumbles}</strong>次绊倒</span>`;
  $('start').innerHTML = '再追一班车 <span>↗</span>';
  $('start-hint').textContent = '空格再来一局 · 也可以换个难度';
  $('feedback').classList.remove('visible');
  announce(won ? `上车成功，用时 ${elapsed.toFixed(2)} 秒。` : `没赶上，还差 ${s.distance.toFixed(1)} 米，再试一次吧。`);
  sound(won ? 'won' : 'lost');
}
function togglePause() {
  if (engine.state.phase !== 'playing') return;
  const now = performance.now();
  if (engine.state.paused) {
    engine.resume(now);
    $('overlay').hidden = true;
    announce('继续追车。');
  } else {
    engine.pause(now);
    if (engine.state.phase !== 'playing') return;
    $('overlay').hidden = false;
    $('card-kicker').textContent = '师傅帮你等一会儿';
    $('card-title').innerHTML = '喘口气，<br>再接着跑。';
    $('card-copy').textContent = '倒计时已经暂停，你的脚步也会被记住。';
    $('result-metrics').hidden = true;
    $('start').innerHTML = '继续追车 <span>→</span>';
    $('start-hint').textContent = '按空格 / P 继续';
    announce('游戏已暂停。');
  }
  syncUI(now);
}
function step(foot) {
  const s = engine.state;
  if (s.phase !== 'playing' || s.paused) return;
  const now = performance.now();
  const beforeSteps = s.steps;
  const beforeStumbles = s.stumbles;
  engine.step(foot, now);
  const after = engine.state;
  if (after.steps === beforeSteps && after.stumbles === beforeStumbles) return;
  const missed = after.stumbles > beforeStumbles;
  const button = $(foot + '-foot');
  button.classList.add('pressed');
  setTimeout(() => button.classList.remove('pressed'), 110);
  $('feedback').textContent = missed ? '哎哟！换另一只脚' : after.quality === 'perfect' ? '好节奏！再快一点点 ↗' : '稳住，就快赶上了';
  $('feedback').classList.toggle('miss', missed);
  $('feedback').classList.add('visible');
  feedbackUntil = now + (missed ? 800 : 440);
  sound(missed ? 'miss' : foot);
  if (missed) announce('绊了一下！稍等片刻，换另一只脚。');
  syncUI(now);
}
function syncUI(now) {
  const s = engine.state;
  const running = s.phase === 'playing' && !s.paused;
  $('time').textContent = s.timeLeft.toFixed(1);
  $('distance').textContent = s.distance.toFixed(1);
  document.querySelector('.hud').classList.toggle('urgent', running && s.timeLeft < 3);
  $('left-foot').disabled = $('right-foot').disabled = !running;
  $('pause').disabled = s.phase !== 'playing';
  $('pause').setAttribute('aria-label', s.paused ? '继续游戏' : '暂停游戏');
  const pauseLabel = s.paused ? '▷<span>继续</span>' : 'Ⅱ<span>暂停</span>';
  if ($('pause').innerHTML !== pauseLabel) $('pause').innerHTML = pauseLabel;
  document.querySelectorAll('[data-mode]').forEach((b) => { b.disabled = s.phase === 'playing'; });
  $('left-foot').classList.toggle('next', running && (!s.lastFoot || s.lastFoot === 'right'));
  $('right-foot').classList.toggle('next', running && s.lastFoot === 'left');
  const hint = s.paused ? '休息一下，车门会等你。' : s.phase === 'won' ? '叮！欢迎乘坐 21 路公交。' : s.phase === 'lost' ? '别气馁，下一班为你而来。' : !running ? '准备好了吗？左右交替，一起出发。' : now < s.stumbleUntil ? '稳住，换另一只脚再出发！' : !s.lastFoot ? '迈出第一步，左右都可以！' : `下一步：${s.lastFoot === 'left' ? '右' : '左'}脚`;
  $('step-prompt').textContent = hint;
  $('combo').textContent = s.combo > 1 ? `连续 ${s.combo} 步 · ${s.stumbles ? `绊倒 ${s.stumbles} 次` : '节奏不错，继续保持'}` : '跟着节奏，别踩同一只脚';
  $('track-fill').style.width = `${s.progress * 100}%`;
  $('track-dot').style.left = `${s.progress * 100}%`;
  if (now > feedbackUntil) $('feedback').classList.remove('visible');
  if (s.phase !== previousPhase) {
    previousPhase = s.phase;
    if (s.phase === 'won' || s.phase === 'lost') finish();
  }
}
document.querySelectorAll('[data-mode]').forEach((b) => {
  b.setAttribute('aria-pressed', String(b.dataset.mode === mode));
  b.addEventListener('click', () => {
    if (engine.state.phase === 'playing') return;
    mode = b.dataset.mode;
    document.querySelectorAll('[data-mode]').forEach((x) => { x.classList.toggle('selected', x === b); x.setAttribute('aria-pressed', String(x === b)); x.querySelector('i').textContent = x === b ? '●' : '○'; });
    restart(); updateRecord();
    document.querySelector('.intro-ticket small').textContent = `一场 ${engine.state.duration} 秒钟的街角小冒险`;
    document.querySelector('.side-note').innerHTML = `生活已经很赶了。<br>至少在这里，师傅会等你 ${engine.state.duration} 秒。`;
  });
});
for (const foot of ['left', 'right']) {
  const button = $(foot + '-foot');
  button.addEventListener('pointerdown', (event) => { if (event.button !== 0) return; event.preventDefault(); step(foot); });
  button.addEventListener('click', (event) => { if (event.detail === 0) step(foot); });
  button.addEventListener('contextmenu', (event) => event.preventDefault());
}
$('start').addEventListener('click', start);
$('restart').addEventListener('click', restart);
$('pause').addEventListener('click', togglePause);
$('sound').addEventListener('click', () => {
  soundOn = !soundOn;
  $('sound').innerHTML = `♪<span>音效${soundOn ? '开' : '关'}</span>`;
  $('sound').setAttribute('aria-label', soundOn ? '关闭音效' : '打开音效');
  $('sound').setAttribute('aria-pressed', String(soundOn));
  if (soundOn) sound('right');
});
window.addEventListener('keydown', (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
  const key = event.key.toLowerCase();
  if (!['a', 'd', 'arrowleft', 'arrowright', ' ', 'p', 'escape', 'r'].includes(key)) return;
  // Keep ordinary keyboard activation for focused buttons, except dedicated game keys.
  if (key === ' ' && event.target.closest('button,a')) return;
  event.preventDefault();
  if (event.repeat) return;
  if (key === 'a' || key === 'arrowleft') step('left');
  else if (key === 'd' || key === 'arrowright') step('right');
  else if (key === ' ') { if (engine.state.phase !== 'playing' || engine.state.paused) start(); else togglePause(); }
  else if (key === 'p' || key === 'escape') togglePause();
  else if (key === 'r') restart();
});
document.addEventListener('visibilitychange', () => { if (document.hidden && engine.state.phase === 'playing' && !engine.state.paused) togglePause(); });
window.addEventListener('blur', () => { if (engine.state.phase === 'playing' && !engine.state.paused) togglePause(); });
function frame(now) {
  engine.update(now);
  renderer.render(engine.state, now);
  syncUI(now);
  requestAnimationFrame(frame);
}
updateRecord();
requestAnimationFrame(frame);
