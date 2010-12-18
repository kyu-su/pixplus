opera.extension.onconnect = function(event){
  var data = {};
  conf.each(
    function(sec, key) {
      data[sec.name + '_' + key] = conf.get_conv(sec.name, key)[1](conf.get(sec.name, key));
    });
  event.source.postMessage(JSON.stringify({'command': 'config', 'data': data}));
};

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
