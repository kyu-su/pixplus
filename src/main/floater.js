_.Floater = _.class.create({
  init: function(wrap, cont, ignore_elements) {
    this.wrap = wrap;
    this.cont = cont;
    this.floating = false;
    this.disable_float = false;
    this.disable_float_temp = false;
    this.use_placeholder = true;
    this.ignore_elements = ignore_elements || [];
    _.Floater.instances.push(this);
    if (_.Floater.initialized) {
      this.setup();
    }
  },

  setup: function() {
    this.wrap.style.boxSizing = 'border-box';
    this.wrap.style.webkitBoxSizing = 'border-box';
    this.wrap.style.MozBoxSizing = 'border-box';
    this.wrap.style.width = this.wrap.offsetWidth + 'px';
    if (this.cont) {
      this.cont.style.display = 'block';
      this.cont.style.overflowX = 'hidden';
      this.cont.style['overflow-x'] = 'hidden';
      this.cont.style.overflowY = 'auto';
      this.cont.style['overflow-y'] = 'auto';
    }
    this.update_height();
    this.update_float();
  },

  unfloat: function () {
    if (this.placeholder) {
      this.placeholder.parentNode.removeChild(this.placeholder);
      this.placeholder = null;
    }
    this.scroll_save();
    this.wrap.classList.remove('pp-float');
    this.scroll_restore();
    this.floating = false;
  },

  update_height: function () {
    this.disable_float_temp = false;
    if (this.cont) {
      var de = d.documentElement;
      var top = this.wrap.getBoundingClientRect().top;
      var mh = de.clientHeight - top - (this.wrap.offsetHeight - this.cont.offsetHeight);
      this.ignore_elements.forEach(function(elem) {
        mh += elem.offsetHeight;
      });
      if (mh < 60) {
        this.disable_float_temp = true;
        this.unfloat();
        this.cont.style.maxHeight = 'none';
        return;
      }
      this.cont.style.maxHeight = mh + 'px';
    }
  },

  update_float: function () {
    if (this.disable_float || this.disable_float_temp) {
      return;
    }
    var de = d.documentElement;
    var rect = (this.placeholder || this.wrap).getBoundingClientRect();
    if (!this.floating && rect.top < 0) {
      this.scroll_save();
      if (this.use_placeholder) {
        this.placeholder = this.wrap.cloneNode(false);
        this.placeholder.style.width = this.wrap.offsetWidth + 'px';
        this.placeholder.style.height = this.wrap.offsetHeight + 'px';
        this.wrap.parentNode.insertBefore(this.placeholder, this.wrap);
      }
      this.wrap.classList.add('pp-float');
      if (this.use_placeholder) {
        this.placeholder.style.height
          = Math.min(this.wrap.offsetHeight, de.clientHeight) + 'px';
      }
      this.scroll_restore();
      this.floating = true;
    } else if (this.floating && rect.top > 0) {
      this.unfloat();
    }
    this.update_height();
  },

  scroll_save: function () {
    if (this.cont) {
      this.scroll_pos = this.cont.scrollTop;
    }
  },

  scroll_restore: function () {
    if (this.cont) {
      this.cont.scrollTop = this.scroll_pos;
    }
  },

  add_ignore_element: function(elem) {
    this.ignore_elements.push(elem);
  }
});

_.extend(_.Floater, {
  instances: [],
  initialized: false,

  init: function() {
    if (_.Floater.initialized) {
      return;
    }
    _.Floater.instances.forEach(function(inst) {
      inst.init();
    });

    _.listen(w, 'scroll', _.Floater.update_float.bind(_.Floater), {async: true});
    _.listen(w, 'resize', _.Floater.update_height.bind(_.Floater), {async: true});
    _.Floater.initialized = true;
  },

  auto_run: function(func) {
    if (_.conf.general.float_tag_list === 0) {
      return;
    }

    func();
  },

  update_float: function() {
    _.Floater.instances.forEach(function(inst) {
      inst.update_float();
    });
  },

  update_height: function() {
    _.Floater.instances.forEach(function(inst) {
      inst.update_height();
    });
  }
});
