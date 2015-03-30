_.ui = {
  slider: function(min, max, step, attrs) {
    var slider;

    if (!_.conf.general.debug) {
      slider = _.e('input', _.extend({type: 'range', min: min, max: max, step: step}, attrs));
      if (slider.type === 'range') {
        slider.set_value = function(value) {
          slider.value = value;
        };
        return slider;
      }
    }

    var rail, knob;
    slider = _.e('div', _.extend({cls: 'pp-slider'}, attrs));
    rail = _.e('div', {cls: 'pp-slider-rail'}, slider);
    knob = _.e('div', {cls: 'pp-slider-knob'}, rail);

    // if (_.conf.general.debug) {
    //   slider.classList.add('pp-debug');
    // }

    // div.__define[GS]etter__ are not works on FirefoxESR...

    slider.set_value = function(value) {
      var pos;
      value = g.Math.max(min, g.Math.min(g.parseFloat(value), max));
      pos = (value - min) / (max - min);
      knob.style.left = (pos * 100) + '%';
      return slider.value = value;
    };

    _.listen(knob, 'mousedown', function(ev) {
      var x, conn1, conn2;

      x = ev.screenX - (knob.offsetLeft + 4);
      slider.classList.add('pp-active');

      conn1= _.listen(w, 'mousemove', function(ev) {
        var pos = ev.screenX - x;
        pos = g.Math.max(0, g.Math.min(pos, rail.offsetWidth));
        knob.style.left = pos + 'px';
        slider.value = (max - min) * pos / rail.offsetWidth + min;

        ev = d.createEvent('Event');
        ev.initEvent('change', true, true);
        slider.dispatchEvent(ev);
      });

      conn2 = _.listen(w, 'mouseup', function(ev) {
        conn1.disconnect();
        conn2.disconnect();
        slider.classList.remove('pp-active');
      });

      return true;
    });
    return slider;
  }
};

_.modal = {
  suspend: false,
  dialog: null,

  centerize: function() {
    var dlg = this.dialog;
    while(dlg) {
      var options = dlg.options,
          container = dlg.container;

      var de = d.documentElement, x, y;

      x = (de.clientWidth  - container.offsetWidth)  / 2;
      y = (de.clientHeight - container.offsetHeight) / 2;

      if (/^(?:both|horizontal)$/i.test(options.centerize)) {
        container.style.left = g.Math.floor(x) + 'px';
      }
      if (/^(?:both|vertical)$/i.test(options.centerize)) {
        container.style.top  = g.Math.floor(y) + 'px';
      }

      if (options.top_left_of) {
        var rect = options.top_left_of.getBoundingClientRect();
        container.style.left = (rect.left - container.offsetWidth) + 'px';
        container.style.top = rect.top + 'px';
      }

      dlg = dlg.parent;
    }
  },

  begin: function(container, options) {
    if (this.dialog && container === this.dialog.container) {
      return;
    }

    var that = this;

    while(this.dialog && this.dialog.container !== options.parent) {
      this.close();
    }

    try {
      w.pixiv.ui.modal.close();
    } catch(ex) {
      _.error(ex);
    }

    _.debug('Begin modal');

    this.dialog = {
      parent: this.dialog,
      container: container,
      options: options || { }
    };

    this.centerize();
    this.set_event_listeners();

    this.suspend = true;
    g.setTimeout(function() {
      that.suspend = false;
    }, 100);
  },

  close: function() {
    if (!this.dialog) {
      return;
    }
    _.debug('End modal');
    if (this.dialog.options && this.dialog.options.onclose) {
      this.dialog.options.onclose(this.dialog.container);
    }
    this.dialog = this.dialog.parent;
    if (!this.dialog) {
      this.unset_event_listeners();
    }
  },

  end: function(target) {
    while(this.dialog) {
      var end = this.dialog.container === target;
      this.close();
      if (end) {
        break;
      }
    }
  },

  set_event_listeners: function() {
    var that = this;
    if (!this.conn_key) {
      this.conn_key = _.key.listen(w, function(key, ev) {
        if (that.dialog.options.onkey) {
          if (that.dialog.options.onkey(key, ev)) {
            return true;
          }
        }

        if (!that.suspend && _.conf.key.popup_close.split(',').indexOf(key) >= 0) {
          that.close();
          return true;
        }
        return false;
      });
    }

    if (!this.conn_click) {
      this.conn_click = _.onclick(d, function(ev) {
        if (that.suspend || !d.body.contains(ev.target)) {
          return;
        }

        var members = [that.dialog.container].concat(that.dialog.options.members || []);
        for(var i = 0; i < members.length; ++i) {
          if (ev.target === members[i] || members[i].contains(ev.target)) {
            return;
          }
        }

        that.close();
      });
    }

    if (!this.conn_resize) {
      this.conn_resize = _.listen(w, 'resize', this.centerize.bind(this), {async: true});
    }

    if (!this.conn_pixiv_modal_open) {
      var on_modal_open = function() {
        that.end();
      };
      try {
        w.colon.d.on('uimodalopen', on_modal_open);
      } catch(ex) {
        _.error(ex);
      }
      this.conn_pixiv_modal_open = {
        disconnect: function() {
          try {
            w.colon.d.off('uimodalopen', on_modal_open);
          } catch(ex) {
            _.error(ex);
          }
        }
      };
    }
  },

  unset_event_listeners: function() {
    var that = this;
    ['key', 'click', 'resize', 'pixiv_modal_open'].forEach(function(name) {
      if (that['conn_' + name]) {
        that['conn_' + name].disconnect();
        that['conn_' + name] = null;
      }
    });
  }
};

_.PopupMenu = function(button, parent) {
  this.dom = { };
  this.dom.root = _.e('div', {cls: 'pp-popup-menu pp-toplevel'});
  this.dom.list = _.e('ol', {cls: 'pp-popup-menu-items'}, this.dom.root);
  this.button = button;
  this.onopen = [];
  this.parent = parent;

  var that = this;
  _.onclick(button, function() {
    that.open(button);
  });
};

_.extend(_.PopupMenu.prototype, {
  add: function(name, text, options) {
    if (!options) {
      options = { };
    }

    if (options.key) {
      text = _.i18n.key_subst(text, options.key);
    }

    var that = this;

    var li = _.e('li', {
      cls: 'pp-popup-menu-item',
      'data-name': name,
      'data-type': options.type || 'normal'
    }, this.dom.list);

    if (options.type === 'link') {
      var link = _.e('a', {text: text, href: options.url || ''}, li);
      if (options.get_url) {
        this.onopen.push(function() {
          link.href = options.get_url();
        });
      }

    } else {
      var label = _.e('label', null, li);

      if (options.type === 'checkbox') {
        var check = _.e('input', {type: 'checkbox'}, label);

        label.appendChild(d.createTextNode(text));
        if (options.checked) {
          check.checked = true;
        }

        _.listen(check, 'change', function(ev) {
          if (options.callback) {
            options.callback(name, check.checked);
          }
          that.close();
        });

      } else {
        label.textContent = text;

        _.onclick(li, function(ev) {
          if (options.callback) {
            options.callback(name);
          }
          that.close();
        });
      }
    }
  },

  add_conf_item: function(section, item, callback) {
    var options = { };
    var value = _.conf[section][item];

    if (typeof(value) === 'boolean') {
      options.type = 'checkbox';
      options.checked = value;
      options.callback = function(name, checked) {
        _.conf[section][item] = checked;
        if (callback) {
          callback(checked);
        }
      };


    } else {
      return;
    }

    this.add(section + '_' + item, _.lng.conf[section][item], options);
  },

  open: function(button) {
    var that = this, root = this.dom.root;

    if (root.parentNode) {
      return;
    }

    this.onopen.forEach(function(handler) {
      handler.call(that);
    });

    d.body.appendChild(root);

    var options = {
      onclose: function() {
        if (that.button) {
          root.parentNode.removeChild(root);
          that.button.classList.remove('pp-active');
        }
      },
      parent: this.parent
    };

    if (button) {
      var rect = button.getBoundingClientRect(), de = d.documentElement;
      var x, y;

      x = g.Math.max(g.Math.min(rect.left, de.clientWidth - root.offsetWidth), 0);
      y = g.Math.max(g.Math.min(rect.bottom, de.clientHeight - root.offsetHeight), 0);

      root.style.left = x + 'px';
      root.style.top = y + 'px';
    } else {
      options.centerize = 'both';
    }

    _.modal.begin(root, options);

    if (this.button) {
      this.button.classList.add('pp-active');
    }
  },

  close: function() {
    if (this.dom.root.parentNode) {
      _.modal.end(this.dom.root);
    }
  }
});

_.Dialog = function(options) {
  if (!options) {
    options = {};
  }

  var dom = this.dom = {};

  dom.root = _.e('div', {cls: 'pp-toplevel pp-dialog ' + (options.cls || '')});

  if (options.title) {
    _.e('div', {cls: 'pp-dialog-title', text: options.title}, dom.root);
  }

  dom.content = _.e('div', {cls: 'pp-dialog-content'}, dom.root);
};

_.extend(_.Dialog.prototype, {
  default_actions: {
    close: function() {
      this.close();
    },
    cancel: function() {
      this.close();
    }
  },

  add_action: function(name, options) {
    var that = this, dom = this.dom;

    if (!options) {
      options = {};
    }

    if (!options.text && _.lng.dialog[name]) {
      options.text = _.lng.dialog[name];
    }

    if (!dom.actions) {
      dom.actions = _.e('div', {cls: 'pp-dialog-actions'}, dom.root);
    }

    var btn = _.e('button', {text: options.text}), ret = btn;

    if (options.type === 'link') {
      ret = _.e('a', null, dom.actions);
      ret.appendChild(btn);
    } else {
      dom.actions.appendChild(btn);
    }

    ret.className = 'pp-dialog-action pp-dialog-action-' + name;

    if (!options.callback) {
      options.callback = this.default_actions[name];
    }

    if (options.callback) {
      _.listen(btn, 'click', function() {
        options.callback.call(that, name);
      });
    }

    return ret;
  },

  onclose: function() {
    if (this.dom.root.parentNode) {
      this.dom.root.parentNode.removeChild(this.dom.root);
    }
  },

  open: function(parent, options) {
    d.body.appendChild(this.dom.root);
    _.modal.begin(this.dom.root, _.extend({
      onclose: this.onclose.bind(this),
      parent: parent
    }, options));
  },

  close: function() {
    _.modal.end(this.dom.root);
  }
});
