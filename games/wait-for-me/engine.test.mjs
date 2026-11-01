import test from 'node:test';
import assert from 'node:assert/strict';
import { GameEngine, MODES } from './engine.js';

test('starts ready and either first foot is valid', () => {
  for (const foot of ['left', 'right']) {
    const game = new GameEngine();
    assert.equal(game.state.phase, 'ready');
    assert.equal(game.step(foot, 0).accepted, false);
    game.start(1000);
    assert.equal(game.step(foot, 1000).accepted, true);
    assert.equal(game.state.steps, 1);
    assert.equal(game.state.lastFoot, foot);
    assert.equal(game.state.quality, 'good');
    assert.equal(game.state.distance, 5.73);
  }
});

test('a steady alternating rhythm catches the bus and freezes the final timer', () => {
  const game = new GameEngine();
  game.start(100);
  for (let i = 0; i < 20; i += 1) game.step(i % 2 ? 'right' : 'left', 100 + i * 300);
  assert.equal(game.state.phase, 'won');
  assert.equal(game.state.distance, 0);
  assert.equal(game.state.progress, 1);
  assert.equal(game.state.steps, 20);
  assert.equal(game.state.bestCombo, 20);
  assert.equal(game.state.stumbles, 0);
  assert.ok(game.state.timeLeft > 4);
  const timeLeft = game.state.timeLeft;
  game.update(100000);
  assert.equal(game.state.timeLeft, timeLeft);
  assert.equal(game.step('left', 100000).accepted, false);
});

test('repeated foot causes one stumble and a setback; recovery needs the other foot', () => {
  const game = new GameEngine();
  game.start(0);
  game.step('left', 0);
  const distance = game.state.distance;
  assert.equal(game.step('left', 300).quality, 'miss');
  assert.ok(Math.abs(game.state.distance - distance - 0.15) < 1e-8);
  assert.equal(game.state.stumbleUntil, 900);
  assert.equal(game.state.combo, 0);
  assert.equal(game.state.bestCombo, 1);
  assert.equal(game.step('left', 400).reason, 'stumbling');
  assert.equal(game.step('right', 800).reason, 'stumbling');
  assert.equal(game.state.stumbles, 1);
  assert.equal(game.step('right', 900).accepted, true);
  assert.equal(game.state.steps, 2);
  assert.equal(game.state.lastFoot, 'right');
});

test('rapid presses cannot create steps or penalties', () => {
  const game = new GameEngine();
  game.start(0);
  game.step('left', 0);
  for (let i = 1; i < 100; i += 1) {
    assert.equal(game.step(i % 2 ? 'right' : 'left', i).reason, 'too-fast');
  }
  assert.equal(game.state.steps, 1);
  assert.equal(game.state.stumbles, 0);
  assert.equal(game.step('right', 100).accepted, true);
});

test('idle timeout loses and even a final stride at the deadline cannot win', () => {
  const idle = new GameEngine();
  idle.start(500);
  idle.update(10500);
  assert.equal(idle.state.phase, 'lost');
  assert.equal(idle.state.timeLeft, 0);
  const game = new GameEngine();
  game.start(0);
  for (let i = 0; i < 19; i += 1) game.step(i % 2 ? 'right' : 'left', i * 300);
  assert.ok(game.state.distance < 0.3);
  assert.equal(game.step('right', 10000).accepted, false);
  assert.equal(game.state.phase, 'lost');
  assert.equal(game.state.steps, 19);
});

test('pause freezes clock and inputs and shifts step and stumble animation clocks', () => {
  const game = new GameEngine();
  game.start(100);
  game.step('left', 100);
  game.step('left', 400);
  game.pause(500);
  const timer = game.state.timeLeft;
  game.update(50000);
  assert.equal(game.state.timeLeft, timer);
  assert.equal(game.step('right', 50000).reason, 'paused');
  game.resume(5500);
  assert.equal(game.state.stepAt, 5400);
  assert.equal(game.state.stumbleUntil, 6000);
  assert.equal(game.state.timeLeft, timer);
  assert.equal(game.step('right', 5900).reason, 'stumbling');
  assert.equal(game.step('right', 6000).accepted, true);
  assert.ok(Math.abs(game.state.elapsed - 0.9) < 1e-8);
  game.update(15100);
  assert.equal(game.state.phase, 'lost');
});

test('pause cannot rescue a timed-out game and restart clears every prior attempt', () => {
  const game = new GameEngine();
  game.start(0);
  game.step('left', 0);
  game.step('left', 300);
  game.pause(10000);
  assert.equal(game.state.phase, 'lost');
  assert.equal(game.state.paused, false);
  game.start(20000);
  assert.equal(game.state.phase, 'playing');
  assert.equal(game.state.steps, 0);
  assert.equal(game.state.stumbles, 0);
  assert.equal(game.state.combo, 0);
  assert.equal(game.state.stumbleUntil, 0);
  assert.equal(game.state.lastFoot, null);
  assert.equal(game.state.timeLeft, 10);
  assert.equal(game.step('right', 20000).accepted, true);
});

test('every difficulty has its intended distance and deadline and is winnable', () => {
  for (const mode of Object.keys(MODES)) {
    const game = new GameEngine({ mode });
    assert.equal(game.state.duration, MODES[mode].duration);
    assert.equal(game.state.distance, MODES[mode].distance);
    game.start(0);
    for (let i = 0; i < 30 && game.state.phase === 'playing'; i += 1) {
      game.step(i % 2 ? 'right' : 'left', i * 220);
    }
    assert.equal(game.state.phase, 'won', mode);
    game.reset(mode);
    assert.equal(game.state.phase, 'ready');
    assert.equal(game.state.distance, MODES[mode].distance);
  }
  assert.equal(new GameEngine({ mode: 'unknown' }).state.mode, 'normal');
});

test('invalid input and backwards timestamps do not corrupt the model', () => {
  const game = new GameEngine();
  game.start(100);
  assert.equal(game.step('both', 200).reason, 'invalid-foot');
  assert.equal(game.step('left', NaN).reason, 'invalid-time');
  game.update(1100);
  game.update(300);
  assert.equal(game.state.elapsed, 1);
  game.step('left', 1100);
  assert.equal(game.step('right', 300).reason, 'too-fast');
  assert.equal(game.state.steps, 1);
});
