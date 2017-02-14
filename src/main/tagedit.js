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

    this.input = _.q('#add_tag', c);

    var add_tag = _.q('input[onclick="addTag()"]', c);
    if (add_tag) {
      add_tag.removeAttribute('onclick');
      add_tag.classList.add('pp-add-tag');
      _.onclick(add_tag, function() {
        that.add_tag(that.input.value, add_tag);
      });
    }

    _.qa('input[onclick^="delTag("]').forEach(function(btn) {
      var re = /delTag\((\d+),/.exec(btn.getAttribute('onclick'));
      if (re) {
        var tag = _.q('#tag' + re[1], c);
        if (tag) {
          btn.removeAttribute('onclick');
          btn.classList.add('pp-remove-tag');
          btn.setAttribute('data-pp-tag-id', re[1]);
          _.onclick(btn, function() {
            that.remove_tag(tag.textContent, btn);
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

  reload: function() {
    var that = this, illust = _.popup.illust;
    _.popup.status_loading();
    _.popup.api.post(
      '/rpc_tag_edit.php',
      {
        mode: 'first',
        i_id: illust.id,
        u_id: illust.author_id,
        e_id: _.api.uid
      },
      function(data) {
        that.onload(illust, data.html);
      },
      function() {
        if (illust === _.popup.illust) {
          that.end();
        }
      }
    );
  },

  add_tag: function(tag, btn) {
    var that = this, illust = _.popup.illust;
    btn.setAttribute('disabled', 'true');
    _.popup.status_loading();
    _.popup.api.post(
      '/rpc_tag_edit.php',
      {
        mode: 'add_tag',
        i_id: illust.id,
        u_id: illust.author_id,
        e_id: _.api.uid,
        value: tag,
        tt: _.api.token
      },
      function(data) {
        that.end();
        _.popup.reload();
      },
      function() {
        btn.value = 'Error';
      }
    );
  },

  remove_tag: function(tag, btn) {
    if (!confirm(_.lng.delete_tag_confirm)) {
      return;
    }

    var that = this, illust = _.popup.illust;
    btn.setAttribute('disabled', 'true');
    _.popup.status_loading();
    _.popup.api.post(
      '/rpc_tag_edit.php',
      {
        mode: 'del_tag',
        i_id: illust.id,
        u_id: illust.author_id,
        e_id: _.api.uid,
        tag: tag,
        tt: _.api.token
      },
      function(data) {
        that.end();
        _.popup.reload();
      },
      function() {
        btn.value = 'Error';
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
