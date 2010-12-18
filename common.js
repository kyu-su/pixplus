conf_schema.bookmark = {
  tag_order: [''],
  tag_aliases: ['']
};
var conf = {
  conv: {
    'string':  [String, String],
    'boolean': [function(s) { return s == 'true'; },
                function(v) { return v ? 'true' : 'false'; }],
    'number':  [parseFloat, String]
  },
  l: [{name:   'extension',
       label:  'Extension',
       path:   ['conf', 'extension'],
       schema: conf_schema.extension,
       keys:   []},
      {name:   'general',
       label:  'General',
       path:   ['conf'],
       schema: conf_schema,
       keys:   []},
      {name:   'popup',
       label:  'Popup',
       path:   ['conf', 'popup'],
       schema: conf_schema.popup,
       keys:   []},
      {name:   'bookmark',
       label:  'Bookmark',
       path:   ['conf', 'bookmark'],
       schema: conf_schema.bookmark,
       keys:   []}],
  map: {},
  get_conv: function(s, n) {
    return conf.conv[typeof conf.map[s].schema[n][0]];
  },
  get: function(s, n) {
    var value = widget.preferences.getItem(conf.map[s].path.join('_') + '_' + n);
    return value === null ? conf.map[s].schema[n][0] : conf.get_conv(s, n)[0](value);
  },
  set: function(s, n, v) {
    widget.preferences.setItem(conf.map[s].path.join('_') + '_' + n, conf.get_conv(s, n)[1](v));
  },
  remove: function(s, n) {
    conf.set(s, n, conf.map[s].schema[n][0]);
  },
  each: function(func_key, func_sec) {
    conf.l.forEach(
      function(sec) {
        if (func_sec) func_sec(sec);
        sec.keys.forEach(
          function(key) {
            func_key(sec, key);
          });
      });
  }
};
conf.l.forEach(
  function(sec) {
    conf.map[sec.name] = sec;
    for(var key in sec.schema) {
      conf.conv[typeof sec.schema[key][0]] && sec.keys.push(key);
    }
    sec.keys.sort();
  });
