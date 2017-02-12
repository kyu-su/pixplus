_.popup.bookmark = {
  active: false,

  init: function() {
    if (this.initialized) {
      return;
    }
    this.initialized = true;

    _.onclick(_.popup.dom.bookmark_wrapper, function(ev) {
      if (ev.target.classList.contains('tag')) {
        _.bookmarkform.toggle(ev.target.dataset.tag);
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

    var doc = _.parse_html(html);
    var body = _.q('.layout-body', doc);

    var re, wrapper = _.popup.dom.bookmark_wrapper;

    wrapper.innerHTML = body.outerHTML;

    (function(re) {
      if (!re) {
        _.error('Failed to detect pixiv.context.tags declaration');
        return;
      }

      var tags, tags_data;

      try {
        tags = JSON.parse(re[1]); // eval(re[1])
        tags_data = JSON.parse(tags);
      } catch(ex) {
        _.error('Failed to parse pixiv.context.tags json', ex);
        return;
      }

      var items = [];
      for(var tag in tags_data) {
        var item = tags_data[tag];
        item.name = tag;
        items.push(item);
      }
      items.sort(function(a, b) {
        return a.lev - b.lev;
      });
      console.log(items);

      var cont = _.q('.tag-cloud-container ul.tag-cloud', wrapper);
      cont.classList.remove('loading-indicator');
      items.forEach(function(item) {
        var li = _.e('li', null, cont),
            span = _.e('span', null, li);
        span.dataset.tag = item.name;
        span.className = 'tag c' + item.lev;
        span.textContent = item.name;
      });

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
    }, function(msg) {
      if (illust !== _.popup.illust || !that.active) {
        return;
      }

      that.active = false;
      _.popup.status_error(msg);
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
