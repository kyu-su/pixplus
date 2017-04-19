// ==UserScript==
// @name        pixplus.js
// @author      wowo
// @version     @VERSION@
// @license     The MIT License
// @description hogehoge
// @icon        http://ccl4.info/pixplus/pixplus_48.png
// @icon64      http://ccl4.info/pixplus/pixplus_64.png
// @namespace   http://my.opera.com/crckyl/
// @include     http://www.pixiv.net/*
// @include     https://www.pixiv.net/*
// @run-at      document-start
// @downloadURL https://ccl4.info/cgit/pixplus.git/plain/autoupdate/1/pixplus.user.js
// @grant       none
// ==/UserScript==

(function(entrypoint) {
  var w = window, g = this || window;

  if (/pixivreader/.test(w.location.href) || w !== w.top) {
    return;
  }

  var greasemonkey =
        /* __OPERA_USERJS_REMOVE__
         false;
         * __OPERA_USERJS_REMOVE__ */
      true; // __OPERA_USERJS_REMOVE__

  var inject = function(data) {
    var d = w.document;
    if (!(d.body || d.documentElement)) {
      // for scriptish
      window.setTimeout(function() {
        inject(data);
      }, 100);
      return;
    }
    var s = w.document.createElement('script');
    s.setAttribute('type', 'text/javascript');
    s.textContent
      = ('(' + entrypoint.toString() + ')'
         + '(this || window,window,window.document,'
         + g.JSON.stringify(data) + ')');
    (d.body || d.documentElement).appendChild(s);
  };

  var send_message;

  if (g.opera) {
    if (g.opera && g.opera.extension) {
      g.opera.extension.onmessage = function(ev){
        var data = g.JSON.parse(ev.data);
        if (data.command === 'config') {
          // entrypoint(g, w, w.document, {conf: data.data});
          inject({conf: data.data});
        }
      };
      g.opera.extension.postMessage(g.JSON.stringify({command: 'config'}));
      send_message = function(command, data) {
        g.opera.extension.postMessage(g.JSON.stringify({command: command, data: data}));
      };

    } else {
      entrypoint(g, w, w.document);
    }

  } else if (greasemonkey) {
    inject(null);

  } else if (g.chrome) {
    var base_uri = g.chrome.extension.getURL('/');
    g.chrome.extension.sendRequest({command: 'config'}, function(msg) {
      if (msg.command === 'config') {
        inject({base_uri: base_uri, conf: msg.data});
      }
    });
    send_message = function(command, data) {
      g.chrome.extension.sendRequest({command: command, data: data});
    };

  } else if (g.safari) {
    g.safari.self.addEventListener('message', function(ev) {
      if (ev.name === 'config') {
        inject({
          base_uri: g.safari.extension.baseURI,
          conf:     ev.message
        });
      }
    }, false);
    g.safari.self.tab.dispatchMessage('config', null);
    send_message = function(command, data) {
      g.safari.self.tab.dispatchMessage(command, data);
    };

  } else {
    inject(null);
  }

  if (send_message) {
    w.addEventListener('pixplusConfigSet', function(ev) {
      var data = {};
      ['section', 'item', 'value'].forEach(function(attr) {
        data[attr] = ev.target.getAttribute('data-pp-' + attr);
      });
      send_message('config-set', data);
    }, false);
  }
})(function(g, w, d, _extension_data) {

  if (w.pixplus || w !== w.top) {
    return;
  }

  // __SRC__

  _.run();
});
