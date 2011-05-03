LS.u = true;
LS.s = (window.opera
        ? widget.preferences
        : (window.chrome
           ? localStorage
           : (window.safari && safari.extension
              ? safari.extension.settings
              : null
             )));
LS.get = function(s, n) {
  var value = LS.s.getItem(create_name(s, n));
  if (typeof value === 'undefined' || value === null) value = LS.map[s].map[n].value;
  return typeof value !== 'string' ? value : LS.get_conv(s, n)[0](value);
};
LS.set = function(s, n, v) {
  if (!window.safari || typeof v !== 'boolean') v = LS.get_conv(s, n)[1](v);
  LS.s.setItem(create_name(s, n), v);
};
LS.remove = function(s, n) {
  //LS.s.removeItem(create_name(s, n));
  LS.set(s, n, LS.map[s].map[n].value);
};
function create_name(s, n) {
  return 'conf_' + (s === 'general' ? '' : s + '_') + n; // for compatibility
}
LS.init_map();
