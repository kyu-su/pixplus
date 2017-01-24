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

    _.xhr.post_data(
      '/rpc_rating.php',
      {
        mode: 'save',
        i_id: illust.id,
        u_id: uid,
        qr: 1,
        score: score,
        tt: illust.token
      },
      function(res) {
        try {
          var data = JSON.parse(res);
          that.update(parseInt(data.put_score));
          that.rating.classList.add('rated');
        } catch(ex) {
          that.set_error();
          _.error('Failed to update rating status', ex);
          alert('Error!');
        }
      },
      function() {
        that.set_error();
        alert('Error!');
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
    _.listen(this.rating, 'mousemove', this.onmousemove.bind(this));
    _.listen(this.rating, 'mouseleave', this.onmouseleave.bind(this));
    _.onclick(this.rating, this.onclick.bind(this));
  }
};
