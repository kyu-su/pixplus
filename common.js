LS.u = true;
LS.s = (window.opera
        ? widget.preferences
        : (window.chrome
           ? localStorage
           : (window.safari && safari.extension
              ? safari.extension.settings
              : (window.Components
                 ? Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefBranch)
                 : null
                ))));
LS.get = function(s, n) {
  var key = create_name(s, n), value;
  if (window.Components) {
    if (typeof LS.map[s].map[n].value === 'boolean') {
      return LS.s.getBoolPref('extensions.pixplus.' + key);
    } else {
      value = decodeURIComponent(escape(LS.s.getCharPref('extensions.pixplus.' + key)));
    }
  } else {
    value = LS.s.getItem(key);
    if (typeof value === 'undefined' || value === null) value = LS.map[s].map[n].value;
  }
  return typeof value !== 'string' ? value : LS.get_conv(s, n)[0](value);
};
LS.set = function(s, n, v) {
  var key = create_name(s, n);
  if ((!window.safari && !window.Components) || typeof v !== 'boolean') v = LS.get_conv(s, n)[1](v);
  if (window.Components) {
    if (typeof v === 'boolean') {
      LS.s.setBoolPref('extensions.pixplus.' + key, v);
    } else {
      LS.s.setCharPref('extensions.pixplus.' + key, unescape(encodeURIComponent(v)));
    }
  } else {
    LS.s.setItem(key, v);
  }
};
LS.remove = function(s, n) {
  //LS.s.removeItem(create_name(s, n));
  LS.set(s, n, LS.map[s].map[n].value);
};
function create_name(s, n) {
  return 'conf_' + (s === 'general' ? '' : s + '_') + n; // for compatibility
}
LS.init_map();
