conf.u = true;
if (window.chrome || window.safari) conf.l.shift();
conf.s = (window.opera
          ? widget.preferences
          : (window.chrome
             ? localStorage
             : (window.safari && safari.extension
                ? safari.extension.settings
                : null
               )));
conf.get = function(s, n) {
  var value = conf.s.getItem(conf.map[s].path.join('_') + '_' + n);
  if (typeof value === 'undefined' || value === null) value = conf.map[s].schema[n][0];
  return typeof value !== 'string' ? value : conf.get_conv(s, n)[0](value);
};
conf.set = function(s, n, v) {
  if (!window.safari || typeof v !== 'boolean') v = conf.get_conv(s, n)[1](v);
  conf.s.setItem(conf.map[s].path.join('_') + '_' + n, v);
};
conf.remove = function(s, n) {
  //conf.s.removeItem(conf.map[s].path.join('_') + '_' + n);
  conf.set(s, n, conf.map[s].schema[n][0]);
};
conf.init_map();
