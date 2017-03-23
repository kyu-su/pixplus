_.popup.manga = {
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
        page;

    if (this.page >= 0 && pages) {
      page = 1;
      for(var i = 0; i < this.page; ++i) {
        page += pages[i].length;
      }

      var img_cnt = pages[this.page].length;
      if (img_cnt > 1) {
        // page = page + '-' + (page + img_cnt - 1);
        page = page + img_cnt - 1;
      }

    } else {
      page = this.page + 1;
    }

    var svg  = _.popup.dom.manga_progress_svg;
    _.ui.indicator.set_progress(svg, page / illust.manga.page_count);
    _.ui.indicator.set_number(svg, illust.manga.page_count - page);
    svg.style.width = svg.style.height = _.popup.dom.button_bookmark.offsetHeight + 'px';
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
