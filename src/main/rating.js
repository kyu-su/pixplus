_.popup.rating = {
  update: function(score) {
    var cl;
    if (!this.rating || (cl = this.rating.classList).contains('rated') || cl.contains('pp-error')) {
      return;
    }

    var cls = this.rating.className.split(/\s+/).filter(function(c) {
      return !(/^rate-\d+$/.test(c));
    });
    if (score) {
      cls.push('rate-' + score);
    }
    this.rating.className = cls.join(' ');
  },

  calc_score: function(ev) {
    if (!this.rating) {
      return 0;
    }
    var x = ev.clientX - this.rating.getBoundingClientRect().left;
    if (x >= 0 && x < 260) {
      return Math.floor(x / 26) + 1;
    }
    return 0;
  },

  onclick: function(ev) {
    var score = this.calc_score(ev);
    if (score > 0) {
      this.rate(score);
    }
  },

  onmousemove: function(ev) {
    var score = this.calc_score(ev);
    if (score > 0) {
      this.update(score);
    }
  },

  onmouseleave: function() {
    this.update(0);
  },

  set_error: function() {
    if (!this.rating) {
      return;
    }
    this.rating.classList.remove('pp-error');
    this.update(0);
    this.rating.classList.add('pp-error');
  },

  rate: function(score) {
    if (!this.rating) {
      return;
    }

    // rpc_rating.php
    //
    // {mode: 'save', i_id: '1234567890', u_id: '12345', qr: '1', score: '10',
    //  tt: '90113f6a7bc932164119e4bcbedecbdc'}
    // => {score: '10', rating_flg: 0, put_score: '10', re_sess: true, qr: 1}
    //
    // Set class: .rate-10.rated


    if (_.conf.popup.rate_confirm) {
      var msg = _.lng.rate_confirm.replace('$point', score);
      if (!confirm(msg)) {
        _.debug('rating cancelled');
        return;
      }
    }

    var that = this;
    _.popup.status_loading();
    _.popup.api.call(
      '/rpc_rating.php',
      {
        mode: 'save',
        i_id: _.popup.illust.id,
        u_id: _.popup.api.uid,
        qr: 1,
        score: score,
        tt: _.popup.api.token
      },
      function(data) {
        that.update(parseInt(data.put_score));
        that.rating.classList.add('rated');
        _.popup.status_complete();
      },
      function() {
        that.set_error();
      }
    );
  },

  setup: function() {
    var dom = _.popup.dom;
    this.rating = _.q('.rating', dom.rating);
    if (!this.rating) {
      return;
    }
    this.rating.style.position = 'relative';
    this.rating.appendChild(_.svg.rating_error(d));
    _.listen(this.rating, 'mousemove', this.onmousemove.bind(this));
    _.listen(this.rating, 'mouseleave', this.onmouseleave.bind(this));
    _.onclick(this.rating, this.onclick.bind(this));
  }
};
