opera.extension.onconnect = function(event){
  var data = {};
  conf.each(
    function(sec, key) {
      data[sec.name + '_' + key] = conf.get_conv(sec.name, key)[1](conf.get(sec.name, key));
    });
  event.source.postMessage(JSON.stringify({'command': 'config', 'data': data}));
};
opera.extension.onmessage = function(event) {
  var data = JSON.parse(event.data);
  if (data.command == 'config-set') {
    var section = data.data.section, key = data.data.key, value = data.data.value;
    conf.set(section, key, conf.get_conv(section, key)[0](value));
  } else if (data.command == 'config-remove') {
    conf.remove(data.data.section, data.data.key);
  }
};

if (conf.get('extension', 'show_toolbar_icon')) {
  var btn = opera.contexts.toolbar.createItem(
    {
      title: 'pixplus',
      icon:  'icons/pixplus_64.png',
      popup: {
        href:   'options.html',
        width:  800,
        height: 600
      }
    });
  opera.contexts.toolbar.addItem(btn);
}
