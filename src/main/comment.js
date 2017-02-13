_.popup.comment = {
  active: false,
  ready: false,

  clear: function() {
    var show_form = _.conf.popup.show_comment_form;
    _.popup.dom.root.classList.remove('pp-comment-mode');
    _.popup.dom.root.classList[show_form ? 'add' : 'remove']('pp-show-comment-form');
    this.update_hide_stamp_comments();
    this.active = false;
  },

  update_hide_stamp_comments: function() {
    var hide_stamps = _.conf.popup.hide_stamp_comments;
    _.popup.dom.root.classList[hide_stamps ? 'add' : 'remove']('pp-hide-stamp-comments');
    _.popup.adjust();
  },

  update: function() {
    if (_.emoji_series) {
      if (!_.emoji_map) {
        _.emoji_map = {};
        _.emoji_series.forEach(function(item) {
          _.emoji_map[item.name] = item;
        });
      }
      if (!_.emoji_re) {
        var pat = _.emoji_series.map(function(item) { return _.escape_regex(item.name); }).join('|');
        _.emoji_re = new RegExp('\\((' + pat + ')\\)', 'g');
      }
    }

    _.qa('._comment-item', _.popup.dom.comment).forEach(this.update_comment_item.bind(this));
    _.popup.adjust();
  },

  update_comment_item: function(item) {
    if (_.q('.sticker-container', item)) {
      item.classList.add('pp-stamp-comment');
    }

    _.qa('img[data-src]', item).forEach(function(img) {
      img.src = img.dataset.src;
    });

    if (_.emoji_re) {
      var body = _.q('.body p', item);
      if (body) {
        var html;
        html = body.innerHTML.replace(_.emoji_re, function(all, name) {
          var emoji = _.emoji_map[name];
          if (!emoji) {
            return all;
          }
          return '<img src="' + emoji.url + '" class="emoji-text" width="28" height="28">';
        });
        if (html !== body.innerHTML) {
          body.innerHTML = html;
        }
      }
    }
  },

  scroll: function() {
    _.popup.dom.caption_wrapper.scrollTop = _.popup.dom.caption.offsetHeight;
  },

  show_form: function() {
    if (_.popup.dom.root.classList.add('pp-show-comment-form')) {
      this.form.comment_textarea.focus();
    }
  },

  hide_form: function() {
    _.popup.dom.root.classList.remove('pp-show-comment-form');
  },

  toggle_form: function() {
    _.popup.dom.root.classList.toggle('pp-show-comment-form');
  },

  setup: function(html) {
    var dom = _.popup.dom;
    dom.comment.innerHTML = html;
    this.ready = false;
    if (this.active) {
      this.setup_real();
    }
  },

  delete_comment: function(item) {
  },

  get_comment_item: function(target) {
    for(var p = target.parentNode; p; p = p.parentNode) {
      if (p.classList.contains('_comment-item')) {
        return p;
      }
    }
    return null;
  },

  setup_real: function() {
    if (this.ready) {
      return;
    }
    this.ready = true;

    var dom = _.popup.dom;
    _.onclick(_.q('.more-comment', dom.comment), function(ev) {
      w.pixiv.comment.more(ev);
    });

    this.form_cont = _.e('div', {id: 'pp-popup-comment-form-cont'});
    dom.comment.insertBefore(this.form_cont, dom.comment.firstChild);
    this.form = new _.CommentForm(this.form_cont, _.popup.illust);

    var that = this;
    this.form.onsent = function(html) {
      var items = _.q('._comment-items', dom.comment);
      if (items) {
        items.insertAdjacentHTML('afterbegin', html);
        that.update_comment_item(items.firstElementChild);
        that.hide_form();
      } else {
        _.popup.reload();
      }
    };

    _.onclick(dom.comment, function(ev) {
      var t = ev.target, p;

      if (t.classList.contains('delete-comment')) {
        if ((p = that.get_comment_item(t))) {
          that.delete_comment(p);
          return true;
        }

      } else if (t.classList.contains('reply')) {
        if ((p = that.get_comment_item(t))) {
          that.form.set_reply_to(p.dataset.id);
        }

      } else if (t.classList.contains('reply-to')) {
        that.form.set_reply_to(t.dataset.id);
      }

      return false;
    }, {capture: true});
  },

  start: function() {
    if (this.active) {
      return;
    }

    this.active = true;
    this.setup_real();
    _.popup.dom.root.classList.add('pp-comment-mode');
    _.popup.show_caption();
    _.popup.adjust();
    this.scroll();
  },

  end: function() {
    if (!this.active) {
      return;
    }
    _.popup.dom.root.classList.remove('pp-comment-mode');
    this.active = false;
    _.popup.adjust();
    _.popup.dom.caption_wrapper.scrollTop = 0;
  },

  toggle: function() {
    if (this.active) {
      this.end();
    } else {
      this.start();
    }
  }
};
