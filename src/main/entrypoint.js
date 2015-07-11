_.setup_ready = function() {
  _.redirect_jump_page();
  _.config_button.init();

  if (_.conf.general.bookmark_hide) {
    _.qa('a[href*="bookmark.php"]').forEach(function(link) {
      var re;
      if ((re = /^(?:(?:http:\/\/www\.pixiv\.net)?\/)?bookmark\.php(\?.*)?$/.exec(link.href))) {
        if (re[1]) {
          var query = _.parse_query(re[1]);
          if (!query.id && !query.rest) {
            link.href += '&rest=hide';
          }
        } else {
          link.href += '?rest=hide';
        }
      }
    });
  }

  _.pages.run(_.parse_query(w.location.search));

  _.Floater.auto_run(function() {
    var wrap = _.q('.ui-layout-west');
    if (!wrap) {
      return;
    }
    var tag_list = _.q('#bookmark_list, .tagCloud', wrap);
    if (!tag_list) {
      return;
    }

    new _.Floater(wrap, tag_list, _.qa('#touch_introduction', wrap));
  });

  if (_.conf.general.disable_effect) {
    try {
      w.jQuery.fx.off = true;
    } catch(ex) {
      _.error(ex);
    }
  }

  try {
    var rate_apply = w.pixiv.rating.apply, waiting_confirmation;
    w.pixiv.rating.apply = function() {
      if (waiting_confirmation) { // workaround for chromium
        return;
      }

      var msg = _.lng.rate_confirm.replace('$point', String(w.pixiv.rating.rate));
      var rate = w.pixiv.rating.rate; // workaround for firefox

      if (_.conf.general.rate_confirm) {
        waiting_confirmation = true; // workaround for chromium
        var confirmed = w.confirm(msg);
        waiting_confirmation = false; // workaround for chromium
        if (!confirmed) {
          _.debug('rating cancelled');
          return;
        }
      }

      _.debug('send rating');
      w.pixiv.rating.rate = rate; // workaround for firefox
      rate_apply.apply(w.pixiv.rating, arguments);
      _.illust.unload(_.popup.illust);
    };
  } catch(ex) {
    _.error('Failed to setup filter of pixiv.rating.apply', ex);
  }

  try {
    var req = w.pixiv.api.request;
    w.pixiv.api.request = function() {
      var args = g.Array.prototype.slice.call(arguments);
      _.debug('pixiv.api.request', args[1]);
      if (/^(?:\.\/)?(?:rpc_tag_edit\.php|rpc_rating\.php)(?:\?|$)/.test(args[1])) {
        args[1] = '/' + args[1];
      }
      return req.apply(this, args);
    };
  } catch(ex) {
    _.error('Failed to setup filter of pixiv.api.request', ex);
  }
};

_.run = function() {
  if (_extension_data) {
    var config_set_data = _.e('div', {css: 'display:none'}, d.documentElement);

    _.conf.__init({
      get: function(section, item) {
        return _extension_data.conf[_.conf.__key(section, item)] || null;
      },

      set: function(section, item, value) {
        _extension_data.conf[_.conf.__key(section, item)] = value;

        var ev = d.createEvent('Event');
        ev.initEvent('pixplusConfigSet', true, true);
        config_set_data.setAttribute('data-pp-section', section);
        config_set_data.setAttribute('data-pp-item',    item);
        config_set_data.setAttribute('data-pp-value',   value);
        config_set_data.dispatchEvent(ev);
      }
    });
  } else {
    _.conf.__init(_.conf.__wrap_storage(g.localStorage));
  }

  if (_.conf.general.redirect_jump_page === 1 && w.location.pathname === '/jump.php') {
    w.location.href = g.decodeURIComponent(w.location.search.substring(1));
    return;
  }

  _.i18n.setup();
  _.key.init();

  _.e('style', {text: _.css}, d.documentElement);

  _.illust.setup(d.documentElement);

  _.Floater.init();
  w.addEventListener('load', _.Floater.update_height.bind(_.Floater), false);

  if (/^(?:uninitialized|loading)$/.test(d.readyState)) {
    w.addEventListener('DOMContentLoaded', _.setup_ready, false);
  } else {
    _.setup_ready();
  }
};
