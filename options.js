// this file loaded in option page

(function(g, w, d, _) {
  var send_message = function(command, data) {
    if (g.opera) {
      g.opera.extension.postMessage(g.JSON.stringify({command: command, data: data}));
    } else if (g.chrome) {
      g.chrome.extension.sendRequest({command: command, data: data}, function(msg) {
        process_message(msg);
      });
    } else if (g.safari) {
      g.safari.self.tab.dispatchMessage(command, data);
    }
  };

  var init = function(storage) {
    _.conf.__import = function(data) {
      send_message('config-import', data);

      var import_message = _.q('#import-message');
      if (import_message) {
        _.configui.hide();
        import_message.textContent = _.lng.importing;
        import_message.style.display = '';
      }
    };

    _.conf.__init({
      get: function(section, item) {
        return storage[_.conf.__key(section, item)] || null;
      },

      set: function(section, item, value) {
        storage[_.conf.__key(section, item)] = value;
        send_message('config-set', {section: section, item: item, value: value});
      }
    });

    _.configui.init(_.q('#options-root'));
    _.configui.show();
  };

  var process_message = function(msg) {
    if (msg.command === 'config') {
      init(msg.data);
    } else if (msg.command === 'config-import') {
      if (msg.data.status === 'complete') {
        w.location.reload();
      }
    }
  };

  if (g.opera) {
    g.opera.extension.onmessage = function(ev){
      process_message(g.JSON.parse(ev.data));
    };
    send_message('config');
  } else if (g.chrome) {
    g.chrome.extension.sendRequest({command: 'config'}, function(msg) {
      process_message(msg);
    });
  } else if (g.safari) {
    g.safari.self.addEventListener('message', function(ev) {
      process_message({command: ev.name, data: ev.message});
    }, false);
    send_message('config');
  }

  _.key.init();
  _.e('style', {text: _.css}, d.body);
})(this, this.window, this.window.document, this.window.pixplus);
