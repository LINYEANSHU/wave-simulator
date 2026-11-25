(function (root) {
  'use strict';

  const key = 'wavelab.experiment';
  const range = (value, min, max) => Number.isFinite(value) && value >= min && value <= max;
  const point = value => value && range(value.nx, 0, 1) && range(value.ny, 0, 1);
  const validMotion = motion => motion === null || (motion &&
    range(motion.ux, -1, 1) && range(motion.uy, -1, 1) &&
    range(motion.minX, 0, 1) && range(motion.maxX, motion.minX, 1));
  const validSource = source => point(source) &&
    range(source.freq, 0.5, 8) && range(source.amp, 0.1, 1.5) &&
    [0, 1].includes(source.type) && range(source.phase0, 0, 2 * Math.PI) &&
    typeof source.on === 'boolean' && validMotion(source.motion);

  function decode(text) {
    const { version, ...setup } = JSON.parse(text) || {};
    if (version !== 1 ||
        typeof setup.scene !== 'string' || !setup.scene ||
        !['source', 'pulse', 'wall', 'erase', 'probe'].includes(setup.tool) ||
        typeof setup.paused !== 'boolean' || ![0.25, 0.5, 1, 2].includes(setup.speed) ||
        !Number.isInteger(setup.brush) || !range(setup.brush, 3, 20) ||
        !range(setup.newFreq, 0.5, 8) || !range(setup.newAmp, 0.1, 1.5) ||
        !range(setup.C, 0.08, 0.70) || !range(setup.gain, 0.3, 4) ||
        ![0, 1].includes(setup.view) || ![0, 1, 2].includes(setup.pal) ||
        ![0, 1].includes(setup.bound) || ![0, 1].includes(setup.wallMat) ||
        !setup.screen || !range(setup.screen.nx, 0.35, 0.95) || typeof setup.screen.on !== 'boolean' ||
        (setup.probe !== null && !point(setup.probe)) ||
        !Array.isArray(setup.sources) || setup.sources.length > 8 || !setup.sources.every(validSource) ||
        typeof setup.mask !== 'string' || setup.mask.length > 4500000 ||
        !/^data:image\/png;base64,[a-z0-9+/]+={0,2}$/i.test(setup.mask)) {
      throw new Error('Invalid WaveLab experiment');
    }
    return setup;
  }

  function encode(setup) {
    const text = JSON.stringify({ ...setup, version: 1 });
    decode(text);
    return text;
  }

  const experiment = { key, encode, decode };
  if (typeof module !== 'undefined' && module.exports) module.exports = experiment;
  else root.WL.experiment = experiment;
})(globalThis);
