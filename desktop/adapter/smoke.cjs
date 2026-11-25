const assert = require('node:assert/strict');

module.exports = async ({ evaluate, wait }) => {
  await wait("window.WL?.ui?.ready && document.querySelector('#fatal[hidden]')");
  await evaluate("document.querySelector('#btnPause').click()");
  assert.ok(await evaluate("window.WL.ui.state.paused"));
  await evaluate("document.querySelector('.tool-btn[data-tool=probe]').click()");
  assert.ok(await evaluate("document.querySelector('.tool-btn[data-tool=probe]').classList.contains('on') || window.WL.ui.state.tool === 'probe'"));
};
