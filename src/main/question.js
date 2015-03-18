_.popup.question = {
  is_active: function() {
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

  start: function() {
    var toggle = _.q('.questionnaire .toggle-list,.questionnaire .toggle-stats', _.popup.dom.rating);
    if (toggle) {
      _.popup.show_caption();
      _.send_click(toggle);
    }
  },

  end: function() {
    this.blur();
    _.qa('.questionnaire .list,.questionnaire .stats', _.popup.dom.rating).forEach(function(elem) {
      elem.classList.remove('visible');
    });
  }
};
