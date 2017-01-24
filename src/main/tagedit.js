_.popup.tagedit = {
  active: false,

  clear: function() {
    _.popup.dom.root.classList.remove('pp-tagedit-mode');
    _.clear(_.popup.dom.tagedit_wrapper);
    this.active = false;
  },

  adjust: function(w, h) {
    var wrap  = _.popup.dom.tagedit_wrapper,
        twrap = _.q('#pp-popup-tagedit-table-wrapper', wrap);

    if (!twrap) {
      return;
    }

    h -= wrap.offsetHeight - twrap.offsetHeight;
    twrap.style.maxHeight = h + 'px';
  },

  onload: function(illust, html) {
    if (illust !== _.popup.illust || !this.active) {
      return;
    }

    var that = this;
    _.clear(_.popup.dom.tagedit_wrapper);

    var c = _.e('div', {id: 'tag-editor', css: 'display:block'}, _.popup.dom.tagedit_wrapper);
    c.innerHTML = html;

    var add_tag = _.q('input[onclick="addTag()"]', c);
    if (add_tag) {
      add_tag.removeAttribute('onclick');
      add_tag.classList.add('pp-add-tag');
      _.onclick(add_tag, this.add_tag.bind(this));
    }
    this.input = _.q('#add_tag', c);

    _.qa('input[onclick^="delTag("]').forEach(function(btn) {
      var re = /delTag\((\d+),/.exec(btn.getAttribute('onclick'));
      if (re) {
        var tag = _.q('#tag' + re[1], c);
        if (tag) {
          btn.removeAttribute('onclick');
          btn.classList.add('pp-remove-tag');
          btn.setAttribute('data-pp-tag-id', re[1]);
          _.onclick(btn, function() {
            that.remove_tag(tag.textContent);
          });
          return;
        }
      }
      btn.setAttribute('disabled');
    });

    var table = _.q('table', c);
    if (table) {
      var tw = _.e('div', {id: 'pp-popup-tagedit-table-wrapper'});
      table.parentNode.replaceChild(tw, table);
      tw.appendChild(table);
    }

    _.popup.status_complete();
    _.popup.dom.root.classList.add('pp-tagedit-mode');
    _.popup.adjust();
  },

  onerror: function(illust, message) {
    if (illust !== _.popup.illust || !this.active) {
      return;
    }
    if (!_.popup.dom.root.classList.contains('pp-tagedit-mode')) {
      this.active = false;
    }
    _.popup.dom.tagedit_wrapper.textContent = message || 'Error';
    _.popup.status_error();
  },

  reload: function() {
    var illust = _.popup.illust;
    if (!illust.author_id) {
      this.onerror(illust, 'Author id not specified');
      return;
    }

    var that = this,
        uid;
    try {
      uid = w.pixiv.user.id;
    } catch(ex) {
      this.onerror('Failed to get user id');
      return;
    }

    _.xhr.post_data(
      '/rpc_tag_edit.php', {
        mode: 'first',
        i_id: illust.id,
        u_id: illust.author_id,
        e_id: uid
      },
      function(data) {
        try {
          // console.log(JSON.parse(data));
          that.onload(illust, JSON.parse(data).html);
        } catch(ex) {
          _.error(ex);
          that.onerror(illust, String(ex));
        }
      },
      function() {
        that.onerror(illust);
      }
    );

    _.popup.status_loading();
  },

  add_tag: function() {
    var tag = this.input.value;

    var that = this,
        illust = _.popup.illust,
        uid;
    try {
      uid = w.pixiv.user.id;
    } catch(ex) {
      _.error('Failed to get user id', ex);
      alert('Error! - Failed to get your member id');
      return;
    }

    if (!illust.token) {
      _.error('Stop rating because pixplus failed to detect security token');
      alert('Error! - Failed to detect security token');
      return;
    }

    _.popup.status_loading();
    _.xhr.post_data(
      '/rpc_tag_edit.php',
      {
        mode: 'add_tag',
        i_id: illust.id,
        u_id: illust.author_id,
        e_id: uid,
        value: tag,
        tt: illust.token
      },
      function(res) {
        try {
          var data = JSON.parse(res);
          _.popup.status_complete();
          that.end();
          _.popup.reload();
        } catch(ex) {
          _.popup.status_complete();
          _.error('Failed to update tag editor form', ex);
          alert('Error!');
          that.end();
        }
      },
      function() {
        _.popup.status_complete();
        alert('Error!');
        that.end();
      }
    );
  },

  remove_tag: function(tag) {
    if (!confirm(_.lng.delete_tag_confirm)) {
      return;
    }

    var that = this,
        illust = _.popup.illust,
        uid;
    try {
      uid = w.pixiv.user.id;
    } catch(ex) {
      _.error('Failed to get user id', ex);
      alert('Error! - Failed to get your member id');
      return;
    }

    if (!illust.token) {
      _.error('Stop rating because pixplus failed to detect security token');
      alert('Error! - Failed to detect security token');
      return;
    }

    _.popup.status_loading();
    _.xhr.post_data(
      '/rpc_tag_edit.php',
      {
        mode: 'del_tag',
        i_id: illust.id,
        u_id: illust.author_id,
        e_id: uid,
        tag: tag,
        tt: illust.token
      },
      function(res) {
        try {
          var data = JSON.parse(res);
          _.popup.status_complete();
          that.end();
          _.popup.reload();
        } catch(ex) {
          _.popup.status_complete();
          _.error('Failed to update tag editor form', ex);
          alert('Error!');
          that.end();
        }
      },
      function() {
        _.popup.status_complete();
        alert('Error!');
        that.end();
      }
    );
  },

  start: function() {
    if (this.active) {
      return;
    }
    this.active = true;
    this.reload();
    _.popup.adjust();
  },

  end: function() {
    if (!this.active) {
      return;
    }
    this.active = false;
    _.popup.dom.root.classList.remove('pp-tagedit-mode');
    _.popup.adjust();
  }
};
