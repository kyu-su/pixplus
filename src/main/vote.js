(function() {
  var svgid = 0;

  var VoteDialog = _.class.create(_.Dialog.prototype, {
    colors: ['#3465a4', '#73d216', '#cc0000', '#f57900', '#75507b', '#555753'],

    init: function(illust, get_frames) {
      VoteDialog.super.init.call(this, {title: _.lng.vote.title, cls: 'pp-vote-dialog'});
      this.data = illust.vote;
      this.setup_list();
      this.setup_chart();
    },

    setup_list: function() {
      if (this.data.answered) {
        return;
      }

      var that = this;
      var list = _.e('ul', {}, this.dom.content);
      this.data.items.forEach(function(item) {
        var label = item[0], key = item[1];
        _.onclick(_.e('button', {text: label, 'data-pp-key': key}, _.e('li', {}, list)), function() {
          alert(label);
        });
      });
    },

    point: function(rad, r) {
      return [Math.cos(rad)*(r||300)+350, Math.sin(rad)*(r||300)+200];
    },

    pointstr: function(rad, r) {
      return this.point(rad, r).join(',');
    },

    setup_chart: function() {
      var that = this;

      var svg = _.e('svg', {}, _.e('div', {cls: 'pp-vote-chart'}, this.dom.content)),
          defs = _.e('defs', {}, svg);
      svg.setAttribute('width', '700');
      svg.setAttribute('height', '400');

      var tot = this.data.stats.reduce(function(a, b) { return a + b[1]; }, 0),
          ps = 0;
      this.data.stats.slice().sort(function(a, b) { return b[1] - a[1]; }).forEach(function(item, i) {
        var label = item[0], votes = item[1];

        var color    = that.colors[i % that.colors.length],
            clipid   = 'pp-vote-pie-clip-' + (++svgid),
            clippath = _.e('path', {}, _.e('clipPath', {id: clipid}, defs)),
            pie      = _.e('circle', {ns: 'svg', cx: 350, cy: 200, r: 170,
                                      fill: color, 'clip-path': 'url(#'+clipid+')'});

        svg.insertBefore(pie, defs.nextSibling);

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
        _.e('path', {d: 'M350,200 L' + that.pointstr(pz), stroke: '#fff',
                     'stroke-width': '3', 'stroke-linecap': 'round'}, svg);

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
