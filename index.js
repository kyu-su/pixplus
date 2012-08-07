(function(g, w, d, _) {
  if (g.opera) {
    g.opera.extension.onmessage = function(event) {
      var res = create_response(g.JSON.parse(event.data));
      if (res.data) {
        event.source.postMessage(JSON.stringify(res));
      }
    };
  } else if (g.chrome) {
    g.chrome.extension.onRequest.addListener(function(message, sender, func) {
      func(create_response(message));
    });
  } else if (g.safari) {
    g.safari.application.addEventListener('message', function(ev) {
      var res = create_response({command: ev.name, data: ev.message});
      if (res.data) {
        ev.target.page.dispatchMessage(res.command, res.data);
      }
    },false);
  }

  function create_response(data) {
    if (data.command == 'config') {
      var storage = { };
      _.conf.__load();
      storage[_.conf.__key_prefix_page + 'prefs'] = g.JSON.stringify(_.conf.__prefs_obj);
      storage[_.conf.__key_prefix_page + 'version'] = _.conf.__prefs_obj;
      return {command: data.command, data: storage};
    } else if (data.command == 'open-options') {
      if (g.opera) {
        g.opera.extension.tabs.create({url: 'options.html', focused: true});
      }
    }
    return {command: data.command, data: null};
  }
})(this, this.window, this.window.document, this.window.pixplus);
