/** Pure gameplay model. All clock arguments use performance.now() milliseconds. */
export const MODES = Object.freeze({
  normal: Object.freeze({ duration: 10, distance: 6, stride: 0.27 }),
  rush: Object.freeze({ duration: 8, distance: 8, stride: 0.29 }),
  chill: Object.freeze({ duration: 14, distance: 6, stride: 0.3 }),
});

const MIN_STEP_MS = 100;
const STUMBLE_MS = 600;
const EPSILON = 1e-9;

export class GameEngine {
  constructor({ mode = 'normal' } = {}) {
    this.reset(mode);
  }

  reset(mode = this.mode) {
    this.mode = Object.hasOwn(MODES, mode) ? mode : 'normal';
    this.config = MODES[this.mode];
    this._startedAt = 0;
    this._lastNow = 0;
    this._lastInputAt = -Infinity;
    this.state = {
      mode: this.mode,
      phase: 'ready',
      paused: false,
      pausedAt: null,
      distance: this.config.distance,
      totalDistance: this.config.distance,
      progress: 0,
      timeLeft: this.config.duration,
      duration: this.config.duration,
      elapsed: 0,
      steps: 0,
      lastFoot: null,
      stumbleUntil: 0,
      stepAt: 0,
      quality: null,
      combo: 0,
      bestCombo: 0,
      stumbles: 0,
    };
    return this.state;
  }

  start(now) {
    this.reset(this.mode);
    this._startedAt = Number.isFinite(now) ? now : 0;
    this._lastNow = this._startedAt;
    this.state.phase = 'playing';
    return this.state;
  }

  update(now) {
    const s = this.state;
    if (s.phase !== 'playing' || s.paused || !Number.isFinite(now)) return s;
    this._lastNow = Math.max(now, this._lastNow);
    s.elapsed = Math.min(s.duration, Math.max(0, (this._lastNow - this._startedAt) / 1000));
    s.timeLeft = Math.max(0, s.duration - s.elapsed);
    if (s.timeLeft <= EPSILON) {
      s.timeLeft = 0;
      s.elapsed = s.duration;
      s.phase = 'lost';
    }
    return s;
  }

  /** Returns { accepted, reason?, quality?, phase }; accepted includes a stumble. */
  step(foot, now) {
    this.update(now);
    const s = this.state;
    const ignored = (reason) => ({ accepted: false, reason, phase: s.phase });
    if (!Number.isFinite(now)) return ignored('invalid-time');
    if (foot !== 'left' && foot !== 'right') return ignored('invalid-foot');
    if (s.phase !== 'playing') return ignored('not-playing');
    if (s.paused) return ignored('paused');
    const at = this._lastNow;
    if (at < s.stumbleUntil) return ignored('stumbling');
    const interval = at - this._lastInputAt;
    if (interval < MIN_STEP_MS) return ignored('too-fast');

    this._lastInputAt = at;
    s.stepAt = at;
    if (foot === s.lastFoot) {
      s.stumbleUntil = at + STUMBLE_MS;
      s.quality = 'miss';
      s.stumbles += 1;
      s.combo = 0;
      s.distance = Math.min(this.config.distance, s.distance + 0.15);
      s.progress = 1 - s.distance / this.config.distance;
      return { accepted: true, quality: 'miss', phase: s.phase };
    }

    s.quality = interval >= 180 && interval <= 500 ? 'perfect' : 'good';
    const stride = this.config.stride + (s.quality === 'perfect' ? 0.04 : 0);
    s.distance = Math.max(0, s.distance - stride);
    s.progress = 1 - s.distance / this.config.distance;
    s.lastFoot = foot;
    s.steps += 1;
    s.combo += 1;
    s.bestCombo = Math.max(s.bestCombo, s.combo);
    if (s.distance <= EPSILON) {
      s.distance = 0;
      s.progress = 1;
      s.phase = 'won';
    }
    return { accepted: true, quality: s.quality, phase: s.phase };
  }

  pause(now) {
    this.update(now);
    if (this.state.phase === 'playing' && !this.state.paused && Number.isFinite(now)) {
      this.state.paused = true;
      this.state.pausedAt = this._lastNow;
    }
    return this.state;
  }

  resume(now) {
    const s = this.state;
    if (!s.paused || s.phase !== 'playing' || !Number.isFinite(now)) return s;
    const at = Math.max(now, s.pausedAt);
    const pausedFor = at - s.pausedAt;
    this._startedAt += pausedFor;
    if (Number.isFinite(this._lastInputAt)) this._lastInputAt += pausedFor;
    if (s.quality !== null) s.stepAt += pausedFor;
    if (s.stumbleUntil > 0) s.stumbleUntil += pausedFor;
    this._lastNow = at;
    s.paused = false;
    s.pausedAt = null;
    return s;
  }
}
