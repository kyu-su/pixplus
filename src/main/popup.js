_.popup = {
  dom: { },
  images: [],
  saved_context: null,

  RM_AUTO:      -1,
  RM_FIT_LONG:   0,
  RM_FIT_SHORT:  1,
  RM_ORIGINAL:   2,

  scrollbar_width:  0,
  scrollbar_height: 0,

  resize_mode:      -1,
  resize_mode_next: -1,

  create: function() {
    var that = this;
    var dom = this.dom;
    if (dom.created) {
      return;
    }

    dom.root              = _.e('div', {id: 'pp-popup'});
    dom.title             = _.e('div', {id: 'pp-popup-title'}, dom.root);
    dom.rightbox          = _.e('div', {id: 'pp-popup-rightbox'}, dom.title);
    dom.status            = _.e('span', {id: 'pp-popup-status'}, dom.rightbox);
    dom.ugoira_status     = _.e('span', {id: 'pp-popup-ugoira-status'}, dom.rightbox);
    dom.resize_mode       = _.e('a', {id: 'pp-popup-button-resize-mode', cls: 'pp-hide'}, dom.rightbox);
    dom.button_manga      = _.e('a', {id: 'pp-popup-button-manga', cls: 'pp-hide'}, dom.rightbox);
    dom.button_response   = _.e('a', {id: 'pp-popup-button-response', text: '[R]', cls: 'pp-hide'}, dom.rightbox);
    dom.button_bookmark   = _.e('a', {id: 'pp-popup-button-bookmark', text: '[B]'}, dom.rightbox);
    dom.title_link        = _.e('a', null, dom.title);
    dom.title_clearfix    = _.e('div', {css: 'clear:both'}, dom.root);
    dom.header            = _.e('div', {id: 'pp-popup-header'}, dom.root);
    dom.caption_wrapper   = _.e('div', {id: 'pp-popup-caption-wrapper'}, dom.header);
    dom.caption           = _.e('div', {id: 'pp-popup-caption'}, dom.caption_wrapper);
    dom.comment_wrapper   = _.e('div', {id: 'pp-popup-comment-wrapper'}, dom.caption_wrapper);
    dom.comment_toolbar   = _.e('div', {id: 'pp-popup-comment-toolbar'}, dom.comment_wrapper);
    dom.comment_form_btn  = _.e('button', {id: 'pp-popup-comment-form-btn', cls: 'pp-popup-comment-btn'}, dom.comment_toolbar);
    dom.comment_conf_btn  = _.e('button', {id: 'pp-popup-comment-config-btn', cls: 'pp-popup-comment-btn'}, dom.comment_toolbar);
    dom.comment           = _.e('div', {id: 'pp-popup-comment'}, dom.comment_wrapper);
    dom.taglist           = _.e('div', {id: 'pp-popup-taglist'}, dom.header);
    dom.rating            = _.e('div', {id: 'pp-popup-rating', cls: 'pp-popup-separator'}, dom.header);
    dom.info              = _.e('div', {id: 'pp-popup-info', cls: 'pp-popup-separator'}, dom.header);
    dom.author_image      = _.e('img', {id: 'pp-popup-author-image'}, dom.info);
    dom.author_status     = _.e('img', {id: 'pp-popup-author-status', cls: 'pp-sprite'}, dom.info);
    dom.datetime          = _.e('div', {id: 'pp-popup-date'}, dom.info);
    dom.size_tools        = _.e('div', {id: 'pp-popup-size-tools'}, dom.info);
    dom.size              = _.e('span', {id: 'pp-popup-size'}, dom.info);
    dom.tools             = _.e('span', {id: 'pp-popup-tools'}, dom.info);
    dom.author_links      = _.e('div', {id: 'pp-popup-author-links'}, dom.info);
    dom.author_profile    = _.e('a', {id: 'pp-popup-author-profile'}, dom.author_links);
    dom.author_works      = _.e('a', {id: 'pp-popup-author-works'}, dom.author_links);
    dom.author_bookmarks  = _.e('a', {id: 'pp-popup-author-bookmarks'}, dom.author_links);
    dom.author_staccfeed  = _.e('a', {id: 'pp-popup-author-staccfeed'}, dom.author_links);
    dom.info_clearfix     = _.e('div', {css: 'clear:both'}, dom.info);
    dom.image_wrapper     = _.e('div', {id: 'pp-popup-image-wrapper'}, dom.root);
    dom.image_scroller    = _.e('div', {id: 'pp-popup-image-scroller'}, dom.image_wrapper);
    dom.image_layout      = _.e('a', {id: 'pp-popup-image-layout'}, dom.image_scroller);
    dom.olc_prev          = _.e('div', {id: 'pp-popup-olc-prev', cls: 'pp-popup-olc'}, dom.image_scroller);
    dom.olc_prev_icon     = this.create_olc_icon(dom.olc_prev);
    dom.olc_next          = _.e('div', {id: 'pp-popup-olc-next', cls: 'pp-popup-olc'}, dom.image_scroller);
    dom.olc_next_icon     = this.create_olc_icon(dom.olc_next);
    dom.bookmark_wrapper  = _.e('div', {id: 'pp-popup-bookmark-wrapper'}, dom.root);
    dom.tagedit_wrapper   = _.e('div', {id: 'pp-popup-tagedit-wrapper'}, dom.root);

    (function() {
      var svg = _.e('svg', {viewBox: '0 0 24 24'}, dom.ugoira_status);
      dom.ugoira_progress_svg = svg;
      dom.ugoira_progress_clip = _.e('path', null, _.e('clipPath', {id: 'pp-popup-ugoira-progress-clip'}, _.e('defs', null, svg)));
      _.e('path', {d: 'M 22,12 A 10,10 0 1 1 2,12 10,10 0 1 1 22,12 z', 'clip-path': 'url(#pp-popup-ugoira-progress-clip)', style: 'fill:none;stroke:#000;stroke-width:2'}, svg);
      _.e('path', {d: 'M 8,6 8,18 19,12 z', style: 'fill:none;stroke:#000;stroke-width:2', id: 'pp-popup-ugoira-playing'}, svg);
      _.e('path', {d: 'M 7,7 10,7 10,17 7,18 z M 14,7 17,7 17,17 14,17 z', style: 'fill:none;stroke:#000;stroke-width:2', id: 'pp-popup-ugoira-paused'}, svg);
    })();

    dom.multipage_icon = (function() {
      var svg = _.e('svg', {id: 'pp-popup-multipage-icon',
                            width: '160', height: '160',
                            viewBox: '0 0 100 100'}, dom.image_scroller);

      var grad = _.e('linearGradient',
                     {id: 'pp-popup-multipage-icon-grad',
                      x1: '50%', y1: '50%', x2: '100%', y2: '100%'},
                     _.e('defs', null, svg));
      _.e('stop', {offset: '0%', style: 'stop-color:black;stop-opacity:0'}, grad);
      _.e('stop', {offset: '100%', style: 'stop-color:black;stop-opacity:1'}, grad);

      _.e('rect', {x: '0', y: '0', width: '100', height: '100', id: 'pp-popup-multipage-icon-bg'}, svg);

      var g = _.e('g', null, svg);
      _.e('rect', {x: '64', y: '58', width: '18', height: '24', fill: 'white'}, g);
      _.e('path', {d: 'M 84 63 l 3 0 l 0 24 l -18 0 l 0 -3 l 15 0 z', fill: 'white'}, g);
      _.e('path', {d: 'M 89 68 l 3 0 l 0 24 l -18 0 l 0 -3 l 15 0 z', fill: 'white'}, g);

      return svg;
    })();


    this.comment_conf_menu = new _.PopupMenu(dom.comment_conf_btn, this.dom.root);
    this.comment_conf_menu.add_conf_item('popup', 'show_comment_form', function(checked) {
      if (checked) {
        that.comment.show_form();
      }
    });
    this.comment_conf_menu.add_conf_item('popup', 'hide_stamp_comments', function(checked) {
      that.comment.update_hide_stamp_comments();
    });



    this.ugoira_menu = new _.PopupMenu(dom.ugoira_progress_svg, this.dom.root);

    this.ugoira_menu.add(
      'play-pause', _.lng.ugoira_play_pause,
      {callback: this.ugoira_play_pause.bind(this),
       key: _.conf.key.popup_ugoira_play_pause}
    );
    this.ugoira_menu.add(
      'next-frame', _.lng.ugoira_next_frame,
      {callback: this.ugoira_next_frame.bind(this),
       key: _.conf.key.popup_ugoira_next_frame}
    );
    this.ugoira_menu.add(
      'prev-frame', _.lng.ugoira_prev_frame,
      {callback: this.ugoira_prev_frame.bind(this),
       key: _.conf.key.popup_ugoira_prev_frame}
    );

    this.ugoira_menu.add(
      'gen-apng', _.lng.ugoira_generate_apng,
      {callback: this.ugoira_generate_apng.bind(this)}
    );

    this.ugoira_menu.add('dl-zip', _.lng.ugoira_download_zip, {
      type: 'link',
      get_url: function() {
        return (that.illust.ugoira_big || that.illust.ugoira_small).src;
      }
    });

    this.ugoira_menu.add('gen-tc', _.lng.ugoira_generate_timecode, {
      callback: function() {
        // http://www.bunkus.org/videotools/mkvtoolnix/doc/mkvmerge.html#mkvmerge.external_timecode_files
        var data = '# timecode format v2\r\n' + that.illust.ugoira.progress.join('\r\n') + '\r\n';
        w.open('data:text/plain,' + w.encodeURIComponent(data));
      }
    });

    this.ugoira_menu.add('help', _.lng.ugoira_how_to_use, {
      callback: function() {
        var text = [
          '$ unzip downloaded_file.zip',
          '$ ffmpeg -i "%06d.jpg" -vcodec mjpeg -qscale 0 test.avi',
          '$ mkvmerge --timecodes 0:generated_timecode.txt test.avi -o test2.mkv',
          '$ mplayer -loop 0 test2.mkv',
          "$ echo 'yay!'",
        ].join('\r\n');
        w.open('data:text/plain,' + w.encodeURIComponent(text));
      }
    });



    _.observe_domnodeinserted(dom.comment, this.comment.update.bind(this.comment));

    this.input.init();

    dom.created = true;
  },

  create_olc_icon: function(parent) {
    var icon = _.e('svg', {viewBox: '0 0 100 100'}, parent);
    _.e('path', {'d': 'M 10 50 l 45 -45 l 0 30 l 35 0 l 0 30 l -35 0 l 0 30 z'}, icon);
    return icon;
  },

  update_scrollbar_size: function() {
    var that = this;
    g.setTimeout(function() {
      var scroller = that.dom.image_scroller,
          sw       = scroller.offsetWidth  - scroller.clientWidth,
          sh       = scroller.offsetHeight - scroller.clientHeight,
          change   = false;

      if (sw > 0 && sw !== that.scrollbar_width) {
        that.scrollbar_width = sw;
        change = true;
      }

      if (sh > 0 && sh !== that.scrollbar_height) {
        that.scrollbar_height = sh;
        change = true;
      }

      if (change) {
        that.adjust();
      }
    }, 0);
  },

  layout_images: function(max_width, max_height) {
    var that = this;

    var natural_sizes, dom = this.dom;

    if (!this.images || this.images.length <= 0) {
      dom.image_layout.style.width  = 'auto';
      dom.image_layout.style.height = 'auto';
      return;
    }

    natural_sizes = this.images.map(function(img) {
      return {width: img.naturalWidth, height: img.naturalHeight};
    });

    var total_width = 0, total_height = 0;
    natural_sizes.forEach(function(size) {
      total_width += size.width;
      total_height = g.Math.max(total_height, size.height);
    });

    // initialize

    var image_scroller = dom.image_scroller;
    image_scroller.style.cssText = '';

    // calculate scale

    var scale = 1,
        update_scale = false,
        aspect_ratio = total_width / total_height,
        resize_mode = this.resize_mode,
        update_resize_mode = (resize_mode === this.RM_AUTO);

    if (aspect_ratio < 1) {
      aspect_ratio = 1 / aspect_ratio;
    }
    this.aspect_ratio = aspect_ratio;

    if (update_resize_mode) {
      resize_mode = this.RM_FIT_LONG;
    }

    this.resize_mode_next = this.RM_FIT_LONG;
    if (total_width > max_width || total_height > max_height) {
      if (update_resize_mode && _.conf.popup.fit_short_threshold > 0) {
        if (aspect_ratio >= _.conf.popup.fit_short_threshold) {
          resize_mode = this.RM_FIT_SHORT;
        } else {
          resize_mode = this.RM_FIT_LONG;
        }
      }
      if (resize_mode === this.RM_FIT_LONG) {
        this.resize_mode_next = this.RM_FIT_SHORT;
      } else if (resize_mode === this.RM_FIT_SHORT) {
        if (total_width > max_width && total_height > max_height) {
          this.resize_mode_next = this.RM_ORIGINAL;
        }
      }
      update_scale = true;
    } else {
      resize_mode = this.RM_FIT_LONG;
    }

    // update resize mode indicator

    dom.resize_mode.textContent = '[' + 'LSO'[resize_mode] + ']';
    if (resize_mode === this.RM_FIT_LONG) {
      dom.resize_mode.classList.add('pp-hide');
    } else {
      dom.resize_mode.classList.remove('pp-hide');
    }

    if (update_scale) {
      if (resize_mode === this.RM_FIT_LONG) {
        scale = g.Math.min(max_width / total_width, max_height / total_height, 1);

      } else {
        var scroll_x = false, scroll_y = false;
        this.update_scrollbar_size();

        if (resize_mode === this.RM_FIT_SHORT) {
          var sw = max_width / total_width,
              sh = max_height / total_height;

          if (sw < sh) {
            scroll_x = true;
            scale = g.Math.min((max_height - this.scrollbar_height) / total_height, 1);
          } else {
            scroll_y = true;
            scale = g.Math.min((max_width - this.scrollbar_width) / total_width, 1);
          }

        } else {
          // original
          if (total_width > max_width) {
            scroll_x = true;
          }
          if (total_height > max_height) {
            scroll_y = true;
          }
        }

        image_scroller.style.maxWidth  = max_width  + 'px';
        image_scroller.style.maxHeight = max_height + 'px';

        if (scroll_x) {
          if (total_height + this.scrollbar_height > max_height) {
            image_scroller.style.height = max_height + 'px';
          } else {
            image_scroller.style.height = (total_height + this.scrollbar_height) + 'px';
          }
          image_scroller.style.maxWidth  = max_width  + 'px';
          image_scroller.style.overflowX = 'auto';
          image_scroller.style['overflow-x'] = 'auto';
        }

        if (scroll_y) {
          if (total_width + this.scrollbar_width > max_width) {
            image_scroller.style.width = max_width + 'px';
          } else {
            image_scroller.style.width = (total_width + this.scrollbar_width) + 'px';
          }
          image_scroller.style.maxHeight = max_height + 'px';
          image_scroller.style.overflowY = 'auto';
          image_scroller.style['overflow-y'] = 'auto';
        }
      }
    }

    // apply scale

    var layout_height = 0, layout_width = 0, image_height = [];
    this.images.forEach(function(img, idx) {
      var nsize  = natural_sizes[idx],
          width  = g.Math.round(nsize.width  * scale),
          height = g.Math.round(nsize.height * scale);
      img.style.width = width + 'px';
      img.style.height = height + 'px';
      if (height > layout_height) {
        layout_height = height;
      }
      layout_width += img.parentNode ? img.offsetWidth : g.Math.round(nsize.width * scale);
      image_height.push(height);
    });

    this.images.forEach(function(img, idx) {
      var mtop = g.Math.floor((layout_height - image_height[idx]) / 2);
      img.style.margin = mtop + 'px 0px 0px 0px';
    });

    dom.image_layout.style.width  = layout_width + 'px';
    dom.image_layout.style.height = layout_height + 'px';

    this.scale = scale;
  },

  calculate_max_content_size: function(content) {
    var c, dom = this.dom, root = dom.root, de = d.documentElement;
    if (this.bookmark.active) {
      c = dom.bookmark_wrapper;
    } else if (this.tagedit.active) {
      c = dom.tagedit_wrapper;
    } else {
      c = dom.image_wrapper;
    }
    return [
      de.clientWidth  - 20 - (root.offsetWidth  - c.clientWidth),
      de.clientHeight - 20 - (root.offsetHeight - c.clientHeight)
    ];
  },

  adjust_olc_icon: function(icon, next) {
    var olc  = icon.parentNode,
        size = g.Math.min(g.Math.floor(g.Math.min(olc.offsetWidth, olc.offsetHeight) * 0.8), 200),
        left = g.Math.min(g.Math.floor((olc.offsetWidth  - size) / 2), 50),
        top;

    // if (olc.offsetHeight - size < olc.offsetWidth - size) {
    //   top = g.Math.floor((olc.offsetHeight  - size) / 2);
    // } else {
    //   top = olc.offsetHeight - size - left;
    // }

    top = g.Math.floor((olc.offsetHeight  - size) / 2);

    if (next) {
      left = olc.offsetWidth - size - left;
    }

    icon.style.width  = size + 'px';
    icon.style.height = size + 'px';
    icon.style.left   = left + 'px';
    icon.style.top    = top  + 'px';
  },

  adjust: function() {
    if (!this.running) {
      return;
    }

    _.debug('popup: adjust');

    var dom = this.dom, root = dom.root, de = d.documentElement,
        max_size = this.calculate_max_content_size();

    if (this.bookmark.active) {
      this.bookmark.adjust(max_size[0], max_size[1]);

    } else if (this.tagedit.active) {
      this.tagedit.adjust(max_size[0], max_size[1]);

    } else {
      this.layout_images(max_size[0], max_size[1]);

      dom.image_layout.style.margin = '0px';
      var mh = dom.image_scroller.clientWidth  - dom.image_layout.offsetWidth,
          mv = dom.image_scroller.clientHeight - dom.image_layout.offsetHeight;
      dom.image_layout.style.marginLeft = g.Math.max(g.Math.floor(mh / 2), 0) + 'px';
      dom.image_layout.style.marginTop  = g.Math.max(g.Math.floor(mv / 2), 0) + 'px';

      var header_height = dom.image_wrapper.offsetHeight;
      if (!this.comment.active) {
        header_height = g.Math.floor(header_height * _.conf.popup.caption_height);
      }

      dom.caption_wrapper.style.height = 'auto';
      var caption_height = header_height - (dom.header.offsetHeight - dom.caption_wrapper.offsetHeight);
      if (caption_height < _.conf.popup.caption_minheight) {
        caption_height = _.conf.popup.caption_minheight;
      }
      if (dom.caption_wrapper.offsetHeight > caption_height) {
        dom.caption_wrapper.style.height = caption_height + 'px';
      }

      var width = _.conf.popup.overlay_control;
      if (width <= 0) {
        dom.olc_prev.classList.remove('pp-active');
        dom.olc_next.classList.remove('pp-active');
      } else {
        if (width < 1) {
          width = g.Math.floor(dom.image_scroller.clientWidth * width);
        }

        // avoid overlap with scrollbar

        var height = dom.image_scroller.clientHeight;

        dom.olc_prev.style.width  = width  + 'px';
        dom.olc_next.style.width  = width  + 'px';
        dom.olc_prev.style.height = height + 'px';
        dom.olc_next.style.height = height + 'px';

        dom.olc_next.style.right = this.scrollbar_width + 'px';

        this.adjust_olc_icon(dom.olc_prev_icon);
        this.adjust_olc_icon(dom.olc_next_icon, true);

        dom.olc_prev.classList.add('pp-active');
        dom.olc_next.classList.add('pp-active');
      }
    }

    this.update_info();
    _.modal.centerize();
  },

  update_info: function() {
    var that = this;

    var size_list, illust = this.illust;
    if (illust.size && !illust.manga.available && !this.manga.active) {
      size_list = [illust.size];
    } else {
      size_list = this.images.map(function(img) {
        return {width: img.naturalWidth, height: img.naturalHeight};
      });
    }

    var size_text = size_list.map(function(size, idx) {
      var str = size.width + 'x' + size.height,
          more_info = [],
          img = that.images[idx],
          re;

      if (img && img.offsetWidth !== size.width) {
        more_info.push((g.Math.floor(img.offsetWidth * 100 / size.width) / 100) + 'x');
      }

      if (_.conf.general.debug) {
        more_info.push('ar:' + (g.Math.floor(_.calculate_ratio(size.width, size.height) * 100) / 100));
      }

      if (img && (re = /\.(\w+)(?:\?|$)/.exec(img.src))) {
        more_info.push(re[1]);
      }

      if (more_info.length > 0) {
        str += '(' + more_info.join('/') + ')';
      }

      return str;
    }).join('/');

    if (_.conf.general.debug) {
      size_text += ' ar:' + (g.Math.floor(this.aspect_ratio * 100) / 100);
    }

    this.dom.size.textContent = size_text;
  },

  update_ugoira_progress: function(frame_number) {
    if (!this.running || !this.illust.ugoira) {
      return;
    }

    var data, prog;
    data = this.illust.ugoira;
    prog = data.progress[frame_number] / data.duration;

    var path = ['12,12', '12,-4', '28,-4'];
    if (prog >= 0.25) {
      path.push('28,28');
    }
    if (prog >= 0.5) {
      path.push('-4,28');
    }
    if (prog >= 0.75) {
      path.push('-4, -4');
    }

    var x, y, rad;
    rad = g.Math.PI * 2 * (prog - 0.25);
    x = g.Math.cos(rad) * 12 + 12;
    y = g.Math.sin(rad) * 12 + 12;
    path.push(x + ',' + y);

    this.dom.ugoira_progress_clip.setAttribute('d', 'M ' + path.join(' ') + ' z');
    this.dom.ugoira_progress_svg.style.width = this.dom.ugoira_progress_svg.style.height =
      this.dom.button_bookmark.offsetHeight + 'px';
  },

  clear: function() {
    var dom = this.dom;

    dom.button_manga.classList.add('pp-hide');
    dom.button_response.classList.add('pp-hide');
    dom.author_status.classList.add('pp-hide');
    dom.author_image.classList.add('pp-hide');
    dom.root.classList.remove('pp-frontpage-new');

    _.clear(
      dom.title_link,
      dom.caption,
      dom.taglist,
      dom.rating,
      dom.datetime,
      dom.tools,
      dom.author_profile,
      dom.author_works,
      dom.author_bookmarks,
      dom.author_staccfeed,
      dom.image_layout
    );

    this.images = [];

    if (this.illust && this.illust.ugoira_player) {
      this.illust.ugoira_player.pause();
    }

    this.clear_submod();
  },

  clear_submod: function() {
    this.bookmark.clear();
    this.manga.clear();
    this.question.clear();
    this.comment.clear();
    this.tagedit.clear();
  },

  set_images: function(images) {
    var dom = this.dom;
    this.images = images;
    this.adjust();
    if (dom.image_layout.childElementCount === images.length) {
      this.images.forEach(function(img, idx) {
        dom.image_layout.replaceChild(img, dom.image_layout.children[idx]);
      });
    } else {
      _.clear(dom.image_layout);
      this.images.forEach(function(img) {
        dom.image_layout.appendChild(img);
      });
    }
    this.dom.image_scroller.scrollTop = 0;
    this.adjust();
  },

  onload: function(illust) {
    if (illust !== this.illust || this.bookmark.active || this.tagedit.active) {
      return;
    }

    var that = this;
    var dom = this.dom;

    if (_.conf.popup.preload) {
      if (illust.prev) {
        _.illust.load(illust.prev);
      }
      if (illust.next) {
        _.illust.load(illust.next);
      }
    }

    this.clear_submod();
    dom.button_manga.classList.add('pp-hide');
    dom.button_response.classList.add('pp-hide');
    dom.author_status.classList.add('pp-hide');
    dom.author_image.classList.add('pp-hide');

    dom.root.classList[illust.is_manga ? 'add' : 'remove']('pp-mangawork');
    dom.root.classList[illust.ugoira ? 'add' : 'remove']('pp-ugoira');

    if (illust.manga.available) {
      dom.root.classList.add('pp-multipage');
      dom.root.classList.add('pp-frontpage');
      dom.root.classList.add(illust.new_url_pattern ? 'pp-frontpage-new' : 'pp-frontpage-old');
    } else {
      dom.root.classList.remove('pp-multipage');
      dom.root.classList.remove('pp-frontpage');
      dom.root.classList.remove('pp-frontpage-new');
      dom.root.classList.remove('pp-frontpage-old');
    }

    if (illust.manga.book_mode) {
      dom.root.classList.add('pp-book');
      if (illust.manga.book_mode === 'rtl') {
        dom.root.classList.add('pp-book-rtl');
      } else if (illust.manga.book_mode === 'ltr') {
        dom.root.classList.add('pp-book-ltr');
      }
    } else {
      dom.root.classList.remove('pp-book');
      dom.root.classList.remove('pp-book-rtl');
      dom.root.classList.remove('pp-book-ltr');
    }

    dom.title_link.innerHTML = illust.title;
    dom.title_link.href = illust.url_medium;

    dom.button_bookmark.href = illust.url_bookmark;
    if (illust.bookmarked) {
      dom.button_bookmark.classList.add('pp-active');
    } else {
      dom.button_bookmark.classList.remove('pp-active');
    }

    if (illust.has_image_response) {
      dom.button_response.classList.remove('pp-active');
      dom.button_response.classList.remove('pp-hide');
      dom.button_response.href = illust.url_response;
    } else if (illust.image_response_to) {
      dom.button_response.classList.add('pp-active');
      dom.button_response.href = illust.url_response_to;
      dom.button_response.classList.remove('pp-hide');
    }

    if (illust.manga.available) {
      dom.button_manga.href = illust.url_manga + '#pp-manga-thumbnail';
      this.manga.update_button();
      dom.button_manga.classList.remove('pp-hide');
    }

    dom.caption.innerHTML = illust.caption;
    _.modify_caption(dom.caption, illust);
    _.redirect_jump_page(dom.caption);

    dom.taglist.innerHTML = illust.taglist;
    _.onclick(
      _.e('a', {text: '[E]', href: '#', id: 'pp-popup-tagedit-button'}, dom.taglist),
      function() {
        that.tagedit.start();
        return true;
      }
    );

    dom.rating.innerHTML = illust.rating + illust.question;

    ['pixpedia', 'pixiv_comic', 'booth'].forEach(function(name) {
      var f = _.conf.popup['remove_' + name];
      dom.taglist.classList[f ? 'add' : 'remove']('pp-no-' + name.replace('_', '-'));
    });

    if (_.conf.popup.author_status_icon) {
      [
        ['favorite', 'pp-fav'],
        ['mutual_favorite', 'pp-fav-m'],
        ['mypixiv', 'pp-mypix']
      ].forEach(function(p) {
        if (illust['author_' + [p[0]]]) {
          dom.author_status.classList.add(p[1]);
          dom.author_status.classList.remove('pp-hide');
        } else {
          dom.author_status.classList.remove(p[1]);
        }
      });
    }

    if (illust.author_image_url) {
      dom.author_image.src = illust.author_image_url;
      dom.author_image.classList.remove('pp-hide');
    }

    dom.datetime.textContent = illust.datetime;

    _.clear(dom.tools);
    illust.tools.forEach(function(tool) {
      var url = '/search.php?word=' + g.encodeURIComponent(tool) + '&s_mode=s_tag';
      _.e('a', {href: url, text: tool}, dom.tools);
    });

    if (illust.author_id) {
      dom.author_profile.href = illust.url_author_profile;
      if (illust.author_is_me) {
        dom.author_profile.innerHTML = '[Me]';
      } else {
        dom.author_profile.innerHTML = illust.author_name || '[Error]';
      }
      dom.author_works.href = illust.url_author_works;
      dom.author_works.textContent = _.lng.author_works;
      dom.author_bookmarks.href = illust.url_author_bookmarks;
      dom.author_bookmarks.textContent = _.lng.author_bookmarks;
    }
    if (illust.url_author_staccfeed) {
      dom.author_staccfeed.href = illust.url_author_staccfeed;
      dom.author_staccfeed.textContent = _.lng.author_staccfeed;
    }

    if (illust.manga.available) {
      dom.image_layout.href = illust.url_manga;
    } else {
      dom.image_layout.href = illust.image_url_big;
    }

    try {
      if (_.stampSeries) {
        w.pixiv.context.stampSeries = _.stampSeries;
      }
      if (_.emojiSeries) {
        w.pixiv.context.emojiSeries = _.emojiSeries;
      }
    } catch(ex) {
      _.error(ex);
    }

    _.popup.comment.setup(illust.comment);

    try {
      w.pixiv.context.illustId = illust.id;
      w.pixiv.context.userId = illust.author_id;
      w.pixiv.context.rated = illust.rated;
    } catch(ex) {
      _.error(ex);
    }

    try {
      if (illust.rating && !illust.rated) {
        w.pixiv.rating.setup();
      }
    } catch(ex) {
      _.error(ex);
    }

    try {
      if (illust.question) {
        w.pixiv.context.hasQuestionnaire = true;
        w.pixiv.context.answered = illust.answered;
        w.pixiv.questionnaire.setup();
      } else {
        w.pixiv.context.hasQuestionnaire = false;
      }
    } catch(ex) {
      _.error(ex);
    }

    if (illust.ugoira_canvas) {
      this.ugoira_replay();
      this.ugoira_play();
    }

    if (illust.ugoira_canvas) {
      this.set_images([illust.ugoira_canvas]);
    } else if (illust.image_big && !(illust.manga.available && illust.image_medium)) {
      this.set_images([illust.image_big]);
    } else {
      this.set_images([illust.image_medium]);
    }

    this.status_complete();
  },

  onerror: function(illust) {
    if (illust !== this.illust || this.bookmark.active || this.tagedit.active) {
      return;
    }

    this.status_error(illust.error || 'Unknown error');
    this.adjust();
  },

  set_status_text: function(text) {
    var dom = this.dom;
    if (text) {
      dom.status.textContent = text;
      dom.status.classList.remove('pp-hide');
    } else {
      dom.status.classList.add('pp-hide');
    }
  },

  set_status_tooltip: function(text) {
    if (text) {
      this.dom.status.classList.add('_ui-tooltip');
      this.dom.status.setAttribute('data-tooltip', text);
    } else {
      this.dom.status.classList.remove('_ui-tooltip');
    }
  },

  status_loading: function() {
    this.dom.root.classList.add('pp-loading');
    this.dom.root.classList.remove('pp-error');
    this.set_status_text('Loading');
    this.set_status_tooltip();
  },

  status_complete: function() {
    this.dom.root.classList.remove('pp-loading');
    this.dom.root.classList.remove('pp-error');
    this.set_status_text('');
    this.set_status_tooltip();
  },

  status_error: function(message) {
    this.dom.root.classList.remove('pp-loading');
    this.dom.root.classList.add('pp-error');
    this.set_status_text('Error');
    this.set_status_tooltip(message);
    if (message) {
      _.error(message);
    }
  },

  onclose: function() {
    if (!this.running) {
      return;
    }

    if (this.saved_context) {
      _.debug('restoring pixiv.context');
      w.pixiv.context = this.saved_context;
    } else {
      _.error('pixiv.context not saved (bug)');
    }

    var dom = this.dom;
    if (dom.root.parentNode) {
      dom.root.parentNode.removeChild(dom.root);
    }
    this.clear();
    this.dom.header.classList.remove('pp-hide');
    this.dom.header.classList.remove('pp-show');
    this.running = false;
  },

  show: function(illust) {
    if (!this.saved_context) {
      _.debug('saving pixiv.context');
      this.saved_context = w.pixiv.context;
      w.pixiv.context = _.extend({ }, w.pixiv.context);
    }

    if (!illust) {
      this.hide();
      return;
    }

    if (this.bookmark.active) {
      this.bookmark.end();
    }
    if (this.tagedit.active) {
      this.tagedit.end();
    }

    var dom = this.dom;
    this.create();
    dom.root.style.fontSize = _.conf.popup.font_size;
    dom.header.style.backgroundColor = 'rgba(255,255,255,' + _.conf.popup.caption_opacity + ')';

    if (this.illust && this.illust.ugoira_player) {
      this.illust.ugoira_player.pause();
    }

    if (illust !== this.illust && illust.manga &&
        !_.conf.popup.manga_viewed_flags) {
      illust.manga.viewed = false;
    }

    this.illust = illust;
    this.running = true;
    if (!dom.root.parentNode) {
      d.body.insertBefore(dom.root, d.body.firstChild);

      _.modal.end();
      _.modal.begin(
        this.dom.root,
        {
          onclose: this.onclose.bind(this),
          onkey: this.key.onkey.bind(this.key),
          centerize: 'both'
        }
      );
    }

    this.resize_mode = this.RM_AUTO;
    if (illust.loaded) {
      this.status_complete();
      this.onload(illust);
    } else {
      this.status_loading();
      this.adjust();
      _.illust.load(illust);
    }

    _.lazy_scroll(illust.image_thumb || illust.link);

    // On Opera 12.10+, this will breaks down <a href> path resolution. Looks like a bug...
    if (!w.opera && _.conf.popup.mark_visited && illust.link && w.history.replaceState) {
      var url = w.location.href;
      w.history.replaceState({}, '', illust.link.href);
      w.history.replaceState({}, '', url);
    }
  },

  hide: function() {
    _.modal.end(this.dom.root);
  },

  reload: function() {
    _.illust.unload(this.illust);
    this.show(this.illust);
  },

  show_caption: function() {
    this.dom.header.classList.add('pp-show');
    this.dom.header.classList.remove('pp-hide');
  },

  hide_caption: function() {
    this.question.blur();

    var h = this.dom.header;
    h.classList.remove('pp-show');
    if (this.is_caption_visible()) {
      h.classList.add('pp-hide');
    }
  },

  is_caption_visible: function() {
    var h = this.dom.header;
    return (!h.classList.contains('pp-hide') &&
            (h.classList.contains('pp-show') ||
             (h.oMatchesSelector && h.oMatchesSelector(':hover')) ||
             (h.mozMatchesSelector && h.mozMatchesSelector(':hover')) ||
             (h.webkitMatchesSelector && h.webkitMatchesSelector(':hover'))));
  },

  toggle_caption: function() {
    if (this.is_caption_visible()) {
      this.hide_caption();
    } else {
      this.show_caption();
    }
  },

  send_rate: function(score) {
    if (this.illust.rating && !this.illust.rated) {
      try {
        w.pixiv.rating.rate = score;
        w.pixiv.rating.apply();
      } catch(ex) {
        _.error(ex);
      }
    }
  },

  can_scroll: function() {
    return this.can_scroll_vertically() || this.can_scroll_horizontally();
  },

  can_scroll_vertically: function() {
    return this.dom.image_scroller.scrollHeight > this.dom.image_scroller.clientHeight;
  },

  can_scroll_horizontally: function() {
    return this.dom.image_scroller.scrollWidth > this.dom.image_scroller.clientWidth;
  },

  ugoira_current_frame: function() {
    return this.illust.ugoira_player.getCurrentFrame();
  },

  ugoira_frame_count: function() {
    return this.illust.ugoira_player.getFrameCount();
  },

  ugoira_play: function() {
    if (!this.illust.ugoira_player) {
      return false;
    }

    this.illust.ugoira_player.play();
    this.dom.root.classList.add('pp-ugoira-playing');
    this.dom.root.classList.remove('pp-ugoira-paused');

    return true;
  },

  ugoira_replay: function() {
    if (!this.illust.ugoira_player) {
      return false;
    }
    this.illust.ugoira_player.rewind();
    return this.ugoira_play();
  },

  ugoira_pause: function() {
    if (!this.illust.ugoira_player) {
      return false;
    }

    this.illust.ugoira_player.pause();
    this.dom.root.classList.remove('pp-ugoira-playing');
    this.dom.root.classList.add('pp-ugoira-paused');

    return true;
  },

  ugoira_play_pause: function() {
    if (!this.illust.ugoira_player) {
      return false;
    }
    if (this.illust.ugoira_player._paused) {
      return this.ugoira_play();
    } else {
      return this.ugoira_pause();
    }
  },

  ugoira_prev_frame: function() {
    if (!this.ugoira_pause()) {
      return false;
    }

    var player = this.illust.ugoira_player;
    if (--player._frame < 0) {
      player._frame = player.getFrameCount() - 1;
    }
    player._displayFrame();
    return true;
  },

  ugoira_next_frame: function() {
    if (!this.ugoira_pause()) {
      return false;
    }
    this.illust.ugoira_player._nextFrame();
    return true;
  },

  ugoira_generate_apng: function() {
    if (!this.illust || !this.illust.ugoira_player) {
      return;
    }

    var that = this;
    var dialog = new _.apng.Dialog(
      that.illust,
      function() {
        var player = that.illust.ugoira_player;
        if (!player._frameImages || player._frameImages.length !== that.illust.ugoira.frames.length) {
          return null;
        }

        return that.illust.ugoira.frames.map(function(frm, idx) {
          return {
            delay: frm.delay,
            image: player._frameImages[idx]
          };
        });
      }
    );

    dialog.open(this.dom.root, {centerize: 'both'});
  }
};
