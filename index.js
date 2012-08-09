// this file loaded in background page

(function(g, w, d, _) {
  _.conf.__key_prefix_page = _.conf.__key_prefix;
  _.conf.__key_prefix = 'conf_';
  _.conf.__is_extension = true;
  _.conf.__init(
    (g.opera
     ? g.widget.preferences
     : (g.safari
        ? g.safari.extension.settings
        : g.localStorage // chrome
       ))
  );

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

  function create_response(msg) {
    if (msg.command == 'config') {
      return {command: msg.command, data: _.conf.__export(_.conf.__key_prefix_page)};
    } else if (msg.command == 'config-set') {
      _.conf[msg.data.section][msg.data.item] = msg.data.value;
    } else if (msg.command == 'config-import') {
      _.conf.__import(msg.data);
      return {command: msg.command, data: {status: 'complete'}};
    } else if (msg.command == 'open-options') {
      if (g.opera) {
        g.opera.extension.tabs.create({url: 'options.html', focused: true});
      }
    }
    return {command: msg.command, data: null};
  }
})(this, this.window, this.window.document, this.window.pixplus);
