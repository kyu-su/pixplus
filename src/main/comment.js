_.popup.comment = {
  active: false,
  ready: false,

  clear: function() {
    _.popup.dom.root.classList.remove('pp-comment-mode');
    this.update_hide_stamp_comments();
    this.active = false;
  },

  update_hide_stamp_comments: function() {
    var hide_stamps = _.conf.popup.hide_stamp_comments;
    _.popup.dom.root.classList[hide_stamps ? 'add' : 'remove']('pp-hide-stamp-comments');
    _.popup.adjust();
  },

  update: function() {
    _.qa('._comment-item', _.popup.dom.comment).forEach(function(item) {
      if (_.q('.sticker-container', item)) {
        item.classList.add('pp-stamp-comment');
      }
    });
    _.popup.adjust();
  },

  scroll: function() {
    _.popup.dom.caption_wrapper.scrollTop = _.popup.dom.caption.offsetHeight;
  },

  setup: function(html) {
    var dom = _.popup.dom;
    dom.comment.innerHTML = html;
    this.ready = false;
    if (this.active) {
      this.setup_real();
    }
  },

  setup_real: function() {
    if (this.ready) {
      return;
    }
    this.ready = true;

    var dom = _.popup.dom;
    _.qa('img[data-src]', dom.comment).forEach(function(img) {
      img.src = img.dataset.src;
    });

    _.onclick(_.q('.more-comment', dom.comment), function(ev) {
      w.pixiv.comment.more(ev);
    });

    _.qa('form[action="member_illust.php"]', dom.comment).forEach(function(form) {
      form.setAttribute('action', '/member_illust.php');
    });
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
