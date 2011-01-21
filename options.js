document.addEventListener('DOMContentLoaded', init, false);

function init() {
  if (window.safari) {
    safari.self.addEventListener(
      'message',
      function(ev) {
        if (ev.name == 'config') {
          conf.get = function(s, n) {
            return ev.message[s + '_' + n];
          };
          conf.set = function(s, n, v) {
            safari.self.tab.dispatchMessage('config-set', {section: s, key: n, value: v});
          };
          conf.remove = function(s, n) {
            safari.self.tab.dispatchMessage('config-remove', {section: s, key: n});
          };
          init_real();
        }
      }, false);
    safari.self.tab.dispatchMessage('config', null);
  } else {
    init_real();
  }
}

function init_real() {
  new ConfigUI(document.getElementById('options-root'), conf, true);
}
