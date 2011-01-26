if (window.opera) {
  opera.extension.onconnect = function(event){
    try {
      event.source.postMessage(JSON.stringify({command: 'config', data: create_config_map()}));
    } catch(ex) { }
  };
  opera.extension.onmessage = function(event) {
    create_response(JSON.parse(event.data));
  };

  (function() {
     var btn;
     update_button();
     window.addEventListener(
       'storage',
       function(ev) {
         if (ev.key == 'conf_extension_show_toolbar_icon') update_button();
       }, false);
     //opera.extension.tabs.addEventListener('focus', update_button, false);
     function update_button(ev) {
       //var tab = opera.extension.tabs.getFocused();
       //var show = tab && tab.url.match(/^http:\/\/www\.pixiv\.net\//) && conf.get('extension', 'show_toolbar_icon');
       var show = conf.get('extension', 'show_toolbar_icon');
       if (show) {
         if (!btn) {
           btn = opera.contexts.toolbar.createItem(
             {
               title: 'pixplus',
               icon:  'icons/64.png',
               popup: {
                 href:   'options.html',
                 width:  800,
                 height: 600
               }
             });
           opera.contexts.toolbar.addItem(btn);
         }
       } else if (btn) {
         opera.contexts.toolbar.removeItem(btn);
         btn = null;
       }
     }
   })();
} else if (window.chrome) {
  chrome.extension.onRequest.addListener(
    function(message, sender, func) {
      func(create_response(message));
    });
} else if (window.safari) {
  safari.application.addEventListener(
    'message',
    function(ev) {
      var res = create_response({command: ev.name, data: ev.message});
      ev.target.page.dispatchMessage(res.command, res.data);
    },false);
}

function create_config_map() {
  var data = {};
  conf.each(
    function(sec, key) {
      data[sec.name + '_' + key] = conf.get(sec.name, key);
    });
  return data;
}
function create_response(data) {
  if (data.command == 'config') {
    return {command: data.command, data: create_config_map()};
  } else if (data.command == 'config-set') {
    var section = data.data.section, key = data.data.key, value = data.data.value;
    conf.set(section, key, value);
  } else if (data.command == 'config-remove') {
    conf.remove(data.data.section, data.data.key);
  }
  return {command: data.command, data: null};
}
