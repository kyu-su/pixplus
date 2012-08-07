(function(g, _) {
  _.conf.__key_prefix_page = _.conf.__key_prefix;
  _.conf.__key_prefix = 'conf_';
  _.conf.__is_extension = true;
  _.conf.__init(g.opera
                ? g.widget.preferences
                : (g.safari && g.safari.extension
                   ? g.safari.extension.settings
                   : g.localStorage));
  _.lang.current = _.lang[g.navigator.language] || _.lang.en;
})(this, this.window.pixplus);
