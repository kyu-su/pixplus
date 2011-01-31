var pref = {
  service: Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefBranch),
  getBoolPref: function(key) {
    return pref.service.getBoolPref('extensions.pixplus.' + key);
  },
  setBoolPref: function(key, val) {
    return pref.service.setBoolPref('extensions.pixplus.' + key, !!val);
  },
  getCharPref: function(key) {
    return decodeURIComponent(escape(pref.service.getCharPref('extensions.pixplus.' + key)));
  },
  setCharPref: function(key, val) {
    return pref.service.setCharPref('extensions.pixplus.' + key, unescape(encodeURIComponent(String(val))));
  }
};