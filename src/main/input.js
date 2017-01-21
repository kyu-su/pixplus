_.popup.input = (function(mod) {

  for(var i = 1; i <= 10; ++i) {
    mod['rate' + (i <= 9 ? '0' : '') + i] = (function(i) {
      return function() {
        if (_.conf.popup.rate_key) {
          _.popup.rating.rate(i);
          return true;
        }
        return false;
      };
    })(i);
  }

  return mod;
})({
  wheel_delta: 0,

  init: function() {
    var that = this;

    ['auto_manga', 'reverse'].forEach(function(name) {
      var mode = _.conf.popup[name], value;
      if (mode === 2) {
        var pattern = _.conf.popup[name + '_regexp'];
        if (pattern) {
          try {
            value = (new g.RegExp(pattern)).test(w.location.href);
          } catch(ex) {
            value = false;
          }
        } else {
          value = false;
        }
      } else {
        value = mode === 1;
      }
      that[name] = value;
    });

    _.popup.mouse.init();
  },

  /*
   * direction
   *   0: vertical
   *   1: horizontal
   *   2: vertical(prior) or horizontal
   */
  scroll: function(elem, direction, offset) {
    var prop, page, max, value;

    if (direction === 2) {
      if (elem.scrollHeight > elem.clientHeight) {
        direction = 0;
      } else if (elem.scrollWidth > elem.clientWidth) {
        direction = 1;
      } else {
        return false;
      }
    }

    if (direction === 0) {
      prop = 'scrollTop';
      page = elem.clientHeight;
      max = elem.scrollHeight - page;
    } else if (direction === 1) {
      prop = 'scrollLeft';
      page = elem.clientWidth;
      max = elem.scrollWidth - page;
    } else {
      return false;
    }

    if (offset > -1 && offset < 1) {
      offset = g.Math.floor(page * offset);
    }

    value = g.Math.min(g.Math.max(0, elem[prop] + offset), max);
    if (value !== elem[prop]) {
      elem[prop] = value;
      return true;
    }

    return false;
  },

  prev: function() {
    if (_.popup.manga.active) {
      _.popup.manga.show(_.popup.manga.page - 1);
    } else {
      _.popup.show(_.popup.illust[this.reverse ? 'next' : 'prev']);
    }
    return true;
  },

  next: function() {
    if (_.popup.manga.active) {
      _.popup.manga.show(_.popup.manga.page + 1);
    } else if (this.auto_manga && _.popup.illust.manga.available && !_.popup.illust.manga.viewed) {
      _.popup.manga.start();
    } else {
      _.popup.show(_.popup.illust[this.reverse ? 'prev' : 'next']);
    }
    return true;
  },

  prev_direction: function() {
    if (_.popup.manga.active) {
      _.popup.manga.show(_.popup.manga.page - 1);
    } else {
      _.popup.show(_.popup.illust.prev);
    }
    return true;
  },

  next_direction: function() {
    if (_.popup.manga.active) {
      _.popup.manga.show(_.popup.manga.page + 1);
    } else {
      _.popup.show(_.popup.illust.next);
    }
    return true;
  },

  first: function() {
    if (_.popup.manga.active) {
      _.popup.manga.show(0);
    } else {
      _.popup.show(_.illust.list[0]);
    }
    return true;
  },

  last: function() {
    if (_.popup.manga.active) {
      _.popup.manga.show(_.popup.illust.manga.pages.length - 1);
    } else {
      _.popup.show(_.illust.list[_.illust.list.length - 1]);
    }
    return true;
  },

  caption_scroll_up: function() {
    return this.scroll(_.popup.dom.caption_wrapper, 0, -_.conf.popup.scroll_height);
  },

  caption_scroll_down: function() {
    return this.scroll(_.popup.dom.caption_wrapper, 0, _.conf.popup.scroll_height);
  },

  illust_scroll_up: function() {
    return this.scroll(_.popup.dom.image_scroller, 0, -_.conf.popup.scroll_height);
  },

  illust_scroll_down: function() {
    return this.scroll(_.popup.dom.image_scroller, 0, _.conf.popup.scroll_height);
  },

  illust_scroll_left: function() {
    return this.scroll(_.popup.dom.image_scroller, 1, -_.conf.popup.scroll_height);
  },

  illust_scroll_right: function() {
    return this.scroll(_.popup.dom.image_scroller, 1, _.conf.popup.scroll_height);
  },

  illust_scroll_top: function() {
    if (_.popup.can_scroll()) {
      var el = _.popup.dom.image_scroller;
      el.scrollLeft = 0;
      el.scrollTop = 0;
      return true;
    }
    return false;
  },

  illust_scroll_bottom: function() {
    if (_.popup.can_scroll()) {
      var el = _.popup.dom.image_scroller;
      el.scrollLeft = el.scrollWidth;
      el.scrollTop = el.scrollHeight;
      return true;
    }
    return false;
  },

  illust_page_up: function() {
    return this.scroll(_.popup.dom.image_scroller, 2, -_.conf.popup.scroll_height_page);
  },

  illust_page_down: function() {
    return this.scroll(_.popup.dom.image_scroller, 2, _.conf.popup.scroll_height_page);
  },

  switch_resize_mode: function() {
    _.popup.resize_mode = _.popup.resize_mode_next;
    _.popup.adjust();

    if (_.popup.manga.active) {
      var page_data = _.popup.illust.manga.pages[_.popup.manga.page];
      if (page_data.filter(function(p){return !p.image_big;}).length >= 1) {
        if (_.popup.resize_mode === _.popup.RM_FIT_LONG) {
          _.popup.resize_mode = _.popup.RM_AUTO;
        }
        _.popup.status_loading();
        _.illust.load_manga_page(_.popup.illust, _.popup.manga.page, true);
      }
    } else {
      if (!_.popup.illust.image_big) {
        if (_.popup.resize_mode === _.popup.RM_FIT_LONG) {
          _.popup.resize_mode = _.popup.RM_AUTO;
        }
        _.popup.status_loading();
        _.illust.load(_.popup.illust, true);
      }
    }
    return true;
  },

  open: function() {
    _.open(_.popup.illust.url_medium);
    return true;
  },

  open_big: function() {
    if (_.popup.illust.manga.available) {
      if (_.popup.manga.active) {
        _.popup.illust.manga.pages[_.popup.manga.page].forEach(function(p) {
          _.open(p.image_big
                 ? p.image_big.src
                 : (p.image_url_big_alt ? p.url_manga_big : p.image_url_big));
        });
      } else {
        _.open(_.popup.illust.url_manga);
      }
    } else {
      _.open(_.popup.illust.image_url_big || _.popup.illust.url_medium);
    }
    return true;
  },

  open_profile: function() {
    _.open(_.popup.illust.url_author_profile);
    return true;
  },

  open_illust: function() {
    _.open(_.popup.illust.url_author_works);
    return true;
  },

  open_bookmark: function() {
    _.open(_.popup.illust.url_author_bookmarks);
    return true;
  },

  open_staccfeed: function() {
    _.open(_.popup.illust.url_author_staccfeed);
    return true;
  },

  open_response: function() {
    if (_.popup.illust.has_image_response) {
      _.open(_.popup.illust.url_response);
      return true;
    }

    if (_.popup.illust.image_response_to) {
      _.open(_.popup.illust.url_response_to);
    }

    return false;
  },

  open_bookmark_detail: function() {
    _.open(_.popup.illust.url_bookmark_detail);
    return true;
  },

  open_manga_thumbnail: function() {
    _.open(_.popup.illust.url_manga + '#pp-manga-thumbnail');
    return true;
  },

  reload: function() {
    _.popup.reload();
    return true;
  },

  caption_toggle: function() {
    _.popup.toggle_caption();
    return true;
  },

  comment_toggle: function() {
    _.popup.comment.toggle();
    return true;
  },

  // manga mode

  manga_start: function() {
    if (_.popup.illust.manga.available && !_.popup.manga.active) {
      _.popup.manga.start();
      return true;
    }
    return false;
  },

  manga_end: function() {
    if (_.popup.manga.active) {
      _.popup.manga.end();
      return true;
    }
    return false;
  },

  manga_open_page: function() {
    if (_.popup.manga.active) {
      var hash = '';
      if (_.popup.manga.active) {
        hash = '#pp-manga-page-' + _.popup.manga.page;
      }
      _.open(_.popup.illust.url_manga + hash);
      return true;
    }
    return false;
  },

  // question mode
  qrate_start: function() {
    if (!_.popup.question.is_active()) {
      _.popup.question.start();
      return true;
    }
    return false;
  },

  qrate_end: function() {
    if (_.popup.question.is_active()) {
      _.popup.question.end();
      return true;
    }
    return false;
  },

  qrate_submit: function() {
    if (_.popup.question.is_active()) {
      _.popup.question.submit();
      return true;
    }
    return false;
  },

  qrate_select_prev: function() {
    if (_.popup.question.is_active()) {
      _.popup.question.select_prev();
      return true;
    }
    return false;
  },

  qrate_select_next: function() {
    if (_.popup.question.is_active()) {
      _.popup.question.select_next();
      return true;
    }
    return false;
  },

  // bookmark mode

  bookmark_start: function() {
    _.popup.bookmark.start();
    return true;
  },

  bookmark_end: function() {
    if (_.popup.bookmark.active) {
      _.popup.bookmark.end();
      return true;
    }
    return false;
  },

  bookmark_submit: function() {
    if (_.popup.bookmark.active) {
      _.popup.bookmark.submit();
      return true;
    }
    return false;
  },

  // tag edit mode

  tag_edit_start: function() {
    if (!_.popup.tagedit.active) {
      _.popup.tagedit.start();
      return true;
    }
    return false;
  },

  tag_edit_end: function() {
    if (_.popup.tagedit.active) {
      _.popup.tagedit.end();
      return true;
    }
    return false;
  },

  // ugoira

  ugoira_play_pause: function() {
    return _.popup.ugoira_play_pause();
  },

  ugoira_prev_frame: function() {
    return _.popup.ugoira_prev_frame();
  },

  ugoira_next_frame: function() {
    return _.popup.ugoira_next_frame();
  }
});
