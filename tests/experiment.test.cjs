const assert = require('node:assert/strict');
const { test } = require('node:test');
const experiment = require('../js/experiment.js');

const setup = {
  scene: 'waveguide', tool: 'wall', paused: true, speed: 0.5, brush: 8,
  newFreq: 5, newAmp: 0.5, C: 0.62, gain: 2.5, view: 1, pal: 2, bound: 1, wallMat: 1,
  screen: { nx: 0.7, on: true }, probe: { nx: 0.2, ny: 0.4 },
  sources: [{ nx: 0.18, ny: 0.5, type: 0, freq: 3, amp: 0.5, phase0: 0, on: false,
    motion: { ux: 0.075, uy: 0, minX: 0.16, maxX: 0.84 } }],
  mask: 'data:image/png;base64,aW1hZ2U=',
};

test('experiment snapshot preserves materials, moving source settings and measurement positions', () => {
  assert.deepEqual(experiment.decode(experiment.encode(setup)), setup);
});

test('experiment decoder rejects unsafe wall sources and invalid model parameters', () => {
  const encode = overrides => JSON.stringify({ version: 1, ...setup, ...overrides });
  assert.throws(() => experiment.decode(encode({ mask: 'https://example.com/walls.png' })));
  assert.throws(() => experiment.decode(encode({ C: 0.71 })));
  assert.throws(() => experiment.decode(encode({ sources: [{ ...setup.sources[0], amp: null }] })));
});
