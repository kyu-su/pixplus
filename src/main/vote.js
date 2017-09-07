(function() {
  var svgid = 0;

  var VoteDialog = _.class.create(_.Dialog.prototype, {
    colors: ['#3465a4', '#73d216', '#cc0000', '#f57900', '#75507b', '#555753'],

    init: function(illust, get_frames) {
      var title = _.lng.vote[illust.vote.answered ? 'title_result' : 'title_vote'];
      VoteDialog.super.init.call(this, {
        title: title,
        cls: 'pp-vote-dialog',
        keys: [
          [_.conf.key.popup_qrate_end,         'close'],
          [_.conf.key.popup_qrate_submit,      'send_selected'],
          [_.conf.key.popup_qrate_select_prev, 'select_prev'],
          [_.conf.key.popup_qrate_select_next, 'select_next']
        ]
      });

      this.illust = illust;
      this.data = illust.vote;

      var q = 'Q: ' + (illust.vote.question || 'Error');
      _.e('h2', {cls: 'pp-vote-question', text: q}, this.dom.content);

      this.setup_list();
      this.setup_chart();
    },

    setup_list: function() {
      if (this.data.answered) {
        return;
      }

      var that = this;
      var list = _.e('ul', {}, this.dom.content);
      this.buttons = [];
      this.data.items.forEach(function(item, idx) {
        var label = item[0], key = item[1];
        var btn = _.e('button', {text: label, 'data-pp-key': key}, _.e('li', {}, list));
        _.onclick(btn, function() {
          that.vote(idx);
        });
        that.buttons.push(btn);
      });
    },

    setup_chart: function() {
      var chart = this.create_chart();
      if (this.data.answered) {
        this.dom.content.appendChild(chart);
      } else {
        var exp = _.ui.expander(_.lng.vote.view_result, {
          ontoggle: function(active) {
            if (active) {
              _.modal.centerize();
            }
          }
        });
        exp[1].appendChild(chart);
        exp[0].classList.add('pp-vote-result-expander');
        this.dom.content.appendChild(exp[0]);
      }
    },

    point: function(rad, r) {
      return [Math.cos(rad)*(r||300)+350, Math.sin(rad)*(r||300)+200];
    },

    pointstr: function(rad, r) {
      return this.point(rad, r).join(',');
    },

    create_chart: function() {
      var that = this;

      var svg = _.e('svg', {}, _.e('div', {cls: 'pp-vote-chart'})),
          defs = _.e('defs', {}, svg),
          maskid = 'pp-vote-chart-mask-' + (++svgid),
          mask = _.e('mask', {id: maskid}, defs);
      svg.setAttribute('width', '700');
      svg.setAttribute('height', '400');
      _.e('rect', {x: 0, y: 0, width: 700, height: 400, fill: '#fff'}, mask);

      var tot = this.data.stats.reduce(function(a, b) { return a + b[1]; }, 0),
          ps = 0;
      this.data.stats.slice().sort(function(a, b) { return b[1] - a[1]; }).forEach(function(item, i) {
        var label = item[0], votes = item[1];

        var color    = that.colors[i % that.colors.length],
            clipid   = 'pp-vote-pie-clip-' + (++svgid),
            clippath = _.e('path', {}, _.e('clipPath', {id: clipid}, defs)),
            pie      = _.e('circle', {cx: 350, cy: 200, r: 170, fill: color,
                                      'clip-path': 'url(#'+clipid+')',
                                      mask: 'url(#'+maskid+')'}, svg);

        var p0 =             ps/tot * 2*Math.PI - Math.PI/2,
            pz = (ps + votes)/tot * 2*Math.PI - Math.PI/2,
            pp = [p0];

        for(var j = 1; j < 8; ++j) {
          var p = j/4*Math.PI - Math.PI/2;
          if (p0 < p && p < pz) {
            pp.push(p);
          }
        }
        pp.push(pz);


        var d = ['M350,200'].concat(pp.map(function(p) {
          return 'L' + that.pointstr(p);
        })).join(' ') + 'z';


        // _.e('path', {d: d, fill: color}, svg);
        clippath.setAttribute('d', d);
        _.e('path', {d: 'M350,200 L' + that.pointstr(pz), stroke: '#000',
                     'stroke-width': '3', 'stroke-linecap': 'round'}, mask);

        var pc = (ps + votes/2)/tot * 2*Math.PI - Math.PI/2,
            l1 = that.point(pc, 160),
            l2 = that.point(pc, 180),
            lr = l2[0] > 350,
            l3 = [l2[0] + (lr ? 1 : -1)*20, l2[1]];

        var l = label + ' (' + Math.round(votes/tot*100) + '%; ' + votes + '/' + tot + ')';

        var text = _.e('text', {text: l,
                                'text-anchor': lr ? 'start' : 'end',
                                'alignment-baseline': 'central',
                                x: l3[0] + (lr ? 1 : -1)*4,
                                y: l3[1] + 3}, svg);

        d = [l1, l2, l3].map(function(xy, i) {
          return (i ? 'L' : 'M') + xy.join(',');
        }).join(' ');
        _.e('path', {d: d, stroke: color, fill: 'none', 'stroke-width': '2'}, svg);

        ps += votes;
      });

      return svg;
    },

    vote: function(idx) {
      if (this.sent) {
        return;
      }

      var btn = this.buttons[idx],
          label = btn.textContent,
          key   = btn.getAttribute('data-pp-key');

      this.buttons.forEach(function(btn) {
        btn.setAttribute('disabled', '1');
        btn.blur();
      });

      this.sent = true;

      var that = this;
      _.popup.status_loading();
      btn.textContent = 'Sending...';
      _.popup.api.post(
        '/rpc_rating.php',
        {
          mode: 'save2',
          i_id: that.illust.id,
          u_id: _.api.uid,
          qr: 1,
          num: btn.getAttribute('data-pp-key'),
          tt: _.api.token
        },
        function(res) {
          that.close();
          _.popup.reload();
        },
        function() {
          btn.textContent = 'Error!';
        }
      );
    },

    select_btn: function(off) {
      var curr = this.buttons.indexOf(d.activeElement);
      off %= this.buttons.length;

      if (curr < 0) {
        curr = (off < 0 ? this.buttons.length : -1) + off;
      } else {
        curr += off;
      }

      if (curr < 0) {
        curr += this.buttons.length;
      } else if (curr >= this.buttons.length) {
        curr -= this.buttons.length;
      }

      this.buttons[curr].focus();
    },

    onkey_select_prev: function() {
      this.select_btn(-1);
      return true;
    },

    onkey_select_next: function() {
      this.select_btn(1);
      return true;
    },

    onkey_send_selected: function() {
      var idx = this.buttons.indexOf(d.activeElement);
      if (idx >= 0) {
        this.vote(idx);
        return true;
      }
      return false;
    }
  });

  _.vote = {
    VoteDialog: VoteDialog,

    run: function(illust, parent) {
      if (this.dialog) {
        this.dialog.close();
      }

      if (!illust.vote.available) {
        _.debug('pixplus.vote.run(): illust.vote.available === false');
        return;
      }

      this.dialog = new VoteDialog(illust);
      this.dialog.open(parent, {centerize: 'both'});
    }
  };
})();
