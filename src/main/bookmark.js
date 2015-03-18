_.popup.bookmark = {
  active: false,

  init: function() {
    if (this.initialized) {
      return;
    }
    this.initialized = true;

    _.onclick(_.popup.dom.bookmark_wrapper, function(ev) {
      if (ev.target.classList.contains('tag')) {
        w.pixiv.tag.toggle(ev.target.dataset.tag);
      }
    });
  },

  clear: function() {
    _.clear(_.popup.dom.bookmark_wrapper);
    _.popup.dom.root.classList.remove('pp-bookmark-mode');
    this.active = false;
    w.focus(); // for Firefox
  },

  adjust: function(w, h) {
    if (this.active) {
      _.bookmarkform.adjust(w, h);
    }
  },

  onload: function(illust, html) {
    if (illust !== _.popup.illust || !this.active) {
      return;
    }

    this.init();

    var root = _.fastxml.parse(html),
        body = _.fastxml.q(root, '.layout-body');

    var re, wrapper = _.popup.dom.bookmark_wrapper;

    wrapper.innerHTML = _.fastxml.html(body, true);

    (function(re) {
      if (!re) {
        _.error('Failed to detect pixiv.context.tags declaration');
        return;
      }

      var tags, tags_data;

      try {
        tags = g.JSON.parse(re[1]); // eval(re[1])
        tags_data = g.JSON.parse(tags);
      } catch(ex) {
        _.error('Failed to parse pixiv.context.tags json', ex);
        return;
      }

      w.pixiv.context.tags = tags;

      var load = w.pixiv.bookmarkTag.load;
      w.pixiv.bookmarkTag.load = function(){};
      w.pixiv.bookmarkTag.setup(_.q('.tag-cloud-container', wrapper));
      w.pixiv.bookmarkTag.load = load;

      w.pixiv.tag.setup();

      w.pixiv.bookmarkTag.data = tags_data;
      w.pixiv.bookmarkTag.initialize();
      w.pixiv.bookmarkTag.show();
      w.pixiv.bookmarkTag.tagContainer.removeClass('loading-indicator');

    })(/>pixiv\.context\.tags\s*=\s*(\"[^\"]+\");/.exec(html));

    var that = this;

    _.bookmarkform.setup(wrapper, {
      autoinput: !illust.bookmarked,
      submit: function() {
        _.popup.status_loading();
      },
      success: function() {
        _.popup.status_complete();

        _.xhr.remove_cache(illust.url_bookmark);

        if (illust === _.popup.illust && _.popup.bookmark.active) {
          that.end();
          _.popup.reload();
        }
      },
      error: function() {
        _.popup.status_error();
        g.alert('Error!');
      }
    });

    if (_.bookmarkform.dom.input_tag) {
      g.setTimeout(function() {
        _.bookmarkform.dom.input_tag.focus();
      }, 0);
    }

    _.popup.dom.root.classList.add('pp-bookmark-mode');
    _.popup.status_complete();
    _.popup.adjust();
  },

  start: function() {
    if (this.active) {
      return;
    }

    var that = this;

    var illust = _.popup.illust;
    this.active = true;
    _.popup.status_loading();

    _.xhr.get(illust.url_bookmark, function(html) {
      that.onload(illust, html);
    }, function() {
      if (illust !== _.popup.illust || !that.active) {
        return;
      }

      that.active = false;
      _.popup.status_error();
    });
  },

  submit: function() {
    if (!this.active) {
      return;
    }
    _.bookmarkform.submit();
  },

  end: function() {
    if (!this.active) {
      return;
    }
    this.clear();
    _.popup.show(_.popup.illust);
  },

  toggle: function() {
    if (this.active) {
      this.end();
    } else {
      this.start();
    }
  }
};
