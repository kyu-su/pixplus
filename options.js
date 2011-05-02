document.addEventListener('DOMContentLoaded', init, false);

function init() {
  if (window.safari) {
    safari.self.addEventListener('message', function(ev) {
      if (ev.name == 'config') {
        LS.get = function(s, n) {
          return ev.message[s + '_' + n];
        };
        LS.set = function(s, n, v) {
          safari.self.tab.dispatchMessage('config-set', {section: s, key: n, value: v});
        };
        LS.remove = function(s, n) {
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
  $c('style', document.body, {text: ConfigUI.css});
  new ConfigUI(document.getElementById('options-root'), true,
               window.chrome ? chrome.i18n.getMessage : null);
}
