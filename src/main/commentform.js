_.CommentForm = _.class.create({
  init: function(wrap, illust) {
    this.illust = illust;

    var dom = this.dom = {};

    dom.wrap = wrap;
    dom.illust = illust;

    dom.root            = _.e('div', {cls: 'pp-commform-root'}, wrap);
    dom.overlay         = _.e('div', {cls: 'pp-commform-overlay'}, dom.root);
    dom.overlay_message = _.e('div', {cls: 'pp-commform-overlay-message'}, dom.overlay);
    dom.tabbar          = _.e('div', {cls: 'pp-commform-tabbar pp-commform-tabbar-top'}, dom.root);

    dom.overlay.appendChild(dom.icon_loading = _.svg.comment_loading(d));
    dom.overlay.appendChild(dom.icon_error   = _.svg.comment_error(d));

    var that = this;
    this.tabs.forEach(function(name) {
      var text = _.lng.commform['tab_' + name],
          tab  = _.e('div', {cls: 'pp-commform-tab', text: text}, dom.tabbar),
          cont = _.e('div', {cls: 'pp-commform-cont pp-commform-cont-' + name}, dom.root);

      _.onclick(tab, function() {
        that.select_tab(name);
      });

      dom['tab_' + name]  = tab;
      dom['cont_' + name] = cont;

      that['tab_' + name](cont);
    });

    this.select_tab(_.conf.general.commform_default_tab);
  },



  set_reply_to: function(id) {
    this.parent = id;
  },



  onsent: function(html) {
    // override this function
  },



  set_error: function(msg) {
    this.dom.overlay.classList.add('pp-error');
    this.dom.overlay.classList.remove('pp-loading');
    this.dom.overlay_message.textContent = msg || 'Unknown error';
    _.error.apply(_, arguments);
  },

  set_loading: function() {
    this.dom.overlay.classList.remove('pp-error');
    this.dom.overlay.classList.add('pp-loading');
    this.dom.overlay_message.textContent = 'Loading';
  },

  set_complete: function() {
    this.dom.overlay.classList.remove('pp-error');
    this.dom.overlay.classList.remove('pp-loading');
  },



  send: function(data) {
    if (this.parent) {
      data.parent_id = this.parent;
    }

    var that = this;
    this.set_loading();
    _.api.post(
      '/rpc/post_comment.php',
      this.illust,
      data,
      function(data) {
        if (data.error) {
          that.set_error(data.message || 'Unknown error');
        } else {
          that.onsent(data.body.html);
          that.set_complete();
        }
      },
      function(msg) {
        that.set_error(msg);
      }
    );
  },

  send_stamp: function(id) {
    this.send({
      type: 'stamp',
      illust_id: this.illust.id,
      author_user_id: this.illust.author_id,
      stamp_id: id,
      tt: _.api.token
    });
  },

  send_comment: function() {
    this.send({
      type: 'comment',
      illust_id: this.illust.id,
      author_user_id: this.illust.author_id,
      comment: this.comment_textarea.value,
      tt: _.api.token
    });
  },

  insert_text: function(text) {
    var ta = this.comment_textarea,
        s = ta.selectionStart,
        e = ta.selectionEnd;
    ta.value = ta.value.substring(0, s) + text + ta.value.substring(e);
    ta.setSelectionRange(s + text.length, s + text.length);
    w.setTimeout(function() {
      ta.focus();
    }, 0);
  },

  insert_emoji: function(emoji) {
    this.insert_text('(' + emoji.name + ')');
  },



  select_tab: function(name) {
    if (this.tabs.indexOf(name) < 0) {
      this.select_tab(this.tabs[0]);
      return;
    }

    var that = this;
    this.tabs.forEach(function(_n) {
      var tab  = that.dom['tab_' + _n],
          cont = that.dom['cont_' + _n];
      tab.classList[_n === name ? 'add' : 'remove']('pp-active');
      cont.classList[_n === name ? 'add' : 'remove']('pp-active');
    });

    _.conf.general.commform_default_tab = name;
  },

  tab_comment: function(cont) {
    var textarea  = _.e('textarea', {placeholder: _.lng.commform.comment_placeholder}, cont),
        emoji     = _.e('div', {cls: 'pp-commform-emoji'}, cont),
        toolbar   = _.e('div', {cls: 'pp-commform-toolbar'}, cont),
        btn_emoji = _.e('button', {cls: 'pp-commform-button-flat', text: _.lng.commform.btn_emoji}, toolbar),
        btn_send  = _.e('button', {cls: 'pp-commform-button-blue pp-commform-send', text: _.lng.commform.btn_send}, toolbar);

    var that = this;
    emoji.classList.add('pp-hide');
    _.onclick(btn_emoji, function() {
      emoji.classList.toggle('pp-hide');
    });
    _.onclick(btn_send, function() {
      that.send_comment();
    });

    this.comment_textarea = textarea;



    if (_.emoji_series) {
      var row;
      _.emoji_series.forEach(function(item, i) {
        var img = new w.Image();
        img.src = item.url;
        _.onclick(img, function() {
          that.insert_emoji(item);
        });

        if (i % 8 === 0) {
          row = _.e('div', null, emoji);
        }
        row.appendChild(img);
      });
    } else {
      emoji.textContent = 'Error';
    }
  },

  tab_stamp: function(cont) {
    if (!_.stamp_series) {
      cont.textContent = 'Error';
      return;
    }

    var stamps = _.e('div', {cls: 'pp-commform-stamp-groups'}, cont),
        tabbar = _.e('div', {cls: ['pp-commform-tabbar',
                                   'pp-commform-tabbar-bottom',
                                   'pp-commform-tabbar-center'].join(' ')}, cont);

    var that = this, tabs = [], grp_wraps = [];
    _.stamp_series.forEach(function(grp, n) {
      var tab  = _.e('div', {cls: 'pp-commform-tab'}, tabbar),
          wrap = _.e('div', {cls: 'pp-commform-stamp-group'}, stamps),
          img  = new w.Image();
      img.src = '//source.pixiv.net/common/images/stamp/main/' + grp.slug + '.png';
      tab.appendChild(img);
      tabs.push(tab);
      grp_wraps.push(wrap);
      _.onclick(tab, function() {
        tabs.forEach(function(t) {
          t.classList[t === tab ? 'add' : 'remove']('pp-active');
        });
        grp_wraps.forEach(function(wr) {
          wr.classList[wr === wrap ? 'add' : 'remove']('pp-active');
        });
      });

      if (n === 0) {
        tab.classList.add('pp-active');
        wrap.classList.add('pp-active');
      }

      var row;
      grp.stamps.forEach(function(id, i) {
        var img  = new w.Image();
        img.src = '//source.pixiv.net/common//images/stamp/stamps/' + id + '_s.jpg';
        _.onclick(img, function() {
          that.send_stamp(id);
        });

        if (i % 5 === 0) {
          row = _.e('div', null, wrap);
        }
        row.appendChild(img);
      });
    });
  },

  tabs: ['comment', 'stamp']
});
