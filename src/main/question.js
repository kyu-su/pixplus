_.popup.question = {
  is_active: function() {
    return false;
    return !!_.q('.questionnaire .list.visible,.questionnaire .stats.visible', _.popup.dom.rating);
  },

  clear: function() {
  },

  get_buttons: function() {
    return _.qa('.questionnaire .list ol input[type="button"]');
  },

  get_selected: function() {
    var active = d.activeElement;
    if (this.get_buttons().indexOf(active) >= 0) {
      return active;
    }
    return null;
  },

  blur: function() {
    var selected = this.get_selected();
    if (selected) {
      selected.blur();
    }
  },

  select_button: function(move) {
    var buttons;
    if (move === 0 || (buttons = this.get_buttons()).length < 1) {
      return;
    }

    var selected = buttons.indexOf(d.activeElement);
    move %= buttons.length;
    if (selected < 0) {
      if (move > 0) {
        --move;
      }
    } else {
      move += selected;
    }
    if (move < 0) {
      move += buttons.length;
    } else if (move >= buttons.length) {
      move -= buttons.length;
    }
    buttons[move].focus();
  },

  select_prev: function() {
    this.select_button(-1);
  },

  select_next : function() {
    this.select_button(1);
  },

  submit: function() {
    var selected = this.get_selected();
    if (selected) {
      _.send_click(selected);
    }
  },

  send: function(btn) {
    var that = this;
    btn.setAttribute('disabled', 'true');
    _.popup.status_loading();
    _.popup.api.post(
      '/rpc_rating.php',
      {
        mode: 'save2',
        i_id: _.popup.illust.id,
        u_id: _.api.uid,
        qr: 1,
        num: btn.dataset.key,
        tt: _.api.token
      },
      function(res) {
        that.end();
        _.popup.reload();
      },
      function() {
        btn.value = 'Error';
      }
    );
  },

  setup: function() {
    return;
    var root = _.q('.questionnaire', _.popup.dom.rating);

    this.dom = {
      root:    root,
      toggle:  _.q('.toggle-list,.toggle-stats', root),
      list:    _.q('.list,.stats', root)
    };

    _.onclick(this.dom.toggle, this.toggle.bind(this));

    var that = this;
    _.qa('input[type="button"][data-key]', this.dom.list).forEach(function(btn) {
      _.onclick(btn, function() {
        that.send(btn);
      });
    });
  },

  toggle: function() {
    this.dom.list.classList.toggle('visible');
  },

  start: function() {
    this.dom.list.classList.add('visible');
    if (!_.popup.is_caption_visible()) {
      _.popup.show_caption();
    }
  },

  end: function() {
    this.blur();
    this.dom.list.classList.remove('visible');
  }
};
