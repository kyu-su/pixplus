// this file loaded in both of background page and option page

(function(g, _) {
  _.lang.current = _.lang[g.navigator.language] || _.lang.en;
})(this, this.window.pixplus);
