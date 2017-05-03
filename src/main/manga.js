_.popup.manga = {
  indicator: {
    set_text: function(svg, text, maxchars) {
      var g = _.q('.pp-icon-indicator-text', svg);
      if (g) {
        _.clear(g);
      } else {
        g = _.e('g', {cls: 'pp-icon-indicator-text'}, svg);
      }


      var pad = 10, offset = 0;

      if (maxchars) {
        offset = (maxchars - text.length)*10 / 2;
      }


      text.split('').forEach(function(chr, idx) {
        var glyph = _.q('*[data-pp-char="' + chr + '"]', svg);
        if (!glyph) {
          return;
        }
        glyph = glyph.cloneNode(true);

        var xoff = idx * 10 + 5 + pad + offset;
        glyph.setAttribute('transform', 'matrix(1.8,0,0,1.8,'+xoff+',20)');
        g.appendChild(glyph);
      });


      var width = (maxchars || text.length) * 10 + (pad * 2);
      svg.setAttribute('width', width);
      svg.setAttribute('height', '24');
      svg.setAttribute('viewBox', '0 0 ' + width + ' 24');
      svg.style.width = 'calc(1em*' + (width/24) + ')';
      svg.style.height = '1em';
      _.q('.pp-icon-manga-frame', svg).setAttribute('width', width - 2);
    },

    set_progress: function(svg, progress) {
      var box = _.q('.pp-icon-manga-progress', svg),
          mw = parseInt(_.q('.pp-icon-manga-frame', svg).getAttribute('width')) - 2;
      box.setAttribute('width', mw * progress);
    }
  },

  active: false,
  page: -1,

  clear: function() {
    this.active = false;
    this.page = -1;
    this.update_button();
  },

  onload: function(illust, page) {
    if (illust !== _.popup.illust || !this.active || page !== this.page) {
      return;
    }

    if (_.conf.popup.preload) {
      if (this.page > 0) {
        _.illust.load_manga_page(illust, this.page - 1);
      }
      if (this.page + 1 < illust.manga.pages.length) {
        _.illust.load_manga_page(illust, this.page + 1);
      }
    }

    this.update_button();

    var page_data = illust.manga.pages[page];

    _.popup.dom.root.classList.remove('pp-frontpage');
    _.popup.dom.root.classList.remove('pp-frontpage-new');
    _.popup.dom.root.classList.remove('pp-frontpage-old');
    _.popup.dom.image_layout.href = illust.url_manga + '#pp-manga-page-' + page;
    _.popup.status_complete();
    _.popup.set_images(illust.manga.pages[page].map(function(page) {
      return page.image_big || page.image_medium;
    }));
  },

  onerror: function(illust, page) {
    if (illust !== _.popup.illust || !this.active || page !== this.page) {
      return;
    }
    if (illust.error) {
      _.popup.dom.image_layout.textContent = illust.error;
    }
    _.popup.status_error();
    _.popup.adjust();
  },

  update_button: function() {
    var illust = _.popup.illust,
        pages = illust.manga.pages,
        page_count = illust.manga.page_count,
        label, prog, maxchars;

    if (pages) {
      if (!illust.manga.indicator_labels) {
        illust.manga.indicator_labels = pages.reduce(function(v, pp) {
          var l = v[1];
          if (pp.length >= 2) {
            l += '-' + (l + pp.length - 1);
          }
          l += '/' + page_count;
          v[0].push([l, v[1] + pp.length - 1]);
          return [v[0], v[1] + pp.length];
        }, [[], 1])[0];
      }

      if (this.page >= 0) {
        var lp = illust.manga.indicator_labels[this.page];
        label = lp[0];
        prog = lp[1];
      } else {
        label = (prog = 0) + '/' + page_count;
      }
      maxchars = Math.max.apply(Math, illust.manga.indicator_labels.map(function(l) { return l[0].length; }));
    } else {
      label = String(prog = this.page + 1);
    }

    var svg  = _.popup.dom.manga_progress_svg;
    this.indicator.set_text(svg, label, maxchars);
    this.indicator.set_progress(svg, prog / page_count);

    _.popup.dom.button_manga.classList[this.page >= 0 ? 'add' : 'remove']('pp-active');
    _.ui.tooltip.set(
      svg,
      _.lng.tooltip[this.page >= 0 ? 'manga_mode_off' : 'manga_mode_on'],
      _.conf.key[this.page >= 0 ? 'popup_manga_end' : 'popup_manga_start']
    );
  },

  show: function(page) {
    var illust = _.popup.illust;
    if (!illust.manga.available) {
      return;
    }
    if (page < 0 || (illust.manga.pages && page >= illust.manga.pages.length)) {
      this.end();
      return;
    }
    this.active = true;
    this.page = page;
    this.update_button();
    _.popup.resize_mode = _.popup.RM_AUTO;
    illust.manga.viewed = true;
    _.popup.status_loading();
    _.illust.load_manga_page(illust, this.page);
  },

  start: function() {
    if (this.active) {
      return;
    }
    this.show(0);
  },

  end: function() {
    if (!this.active) {
      return;
    }
    this.clear();
    _.popup.show(_.popup.illust);
  },

  toggle: function() {
    if (this.active) {
      this.end();
    } else {
      this.start();
    }
  }
};
