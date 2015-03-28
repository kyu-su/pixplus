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

    var that = this;
    try {
      w.pixiv.api.post('/rpc_tag_edit.php', {
        mode: 'first',
        i_id: illust.id,
        u_id: illust.author_id,
        e_id: w.pixiv.user.id
      }, {
        ajaxSettings: {dataType: 'text'}
      }).done(function(data) {
        try {
          that.onload(illust, JSON.parse(data).html);
        } catch(ex) {
          that.onerror(illust, g.String(ex));
        }
      }).fail(function(data) {
        that.onerror(illust, data);
      });
    } catch(ex) {
      this.onerror(illust);
      return;
    }

    _.popup.status_loading();
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
