_.illust = {
  root: null,
  last_link_count: 0,
  list: [ ],

  try_guessed_big_image_urls: function(illust) {
    if (illust && illust.image_url_big_guess && illust.image_url_big_guess.length) {
      illust.image_url_big = illust.image_url_big_guess[0];
      illust.image_url_big_alt = illust.image_url_big_guess.slice(1);
    }
  },

  parse_image_url: function(url, opt) {
    if (!opt) {
      opt = {};
    }

    var allow_types = opt.allow_types || ['_s', '_100', '_128x128', '_240ms', '_240mw'];
    var allow_sizes = opt.allow_sizes || ['100x100', '128x128', '150x150', '240x240', '240x480', '600x600'];

    var re, server, size, dir, id, rest, p0, suffix, prefix, inf, type, page, ret;
    if ((re = /^(http:\/\/i\d+\.pixiv\.net\/)c\/(\d+x\d+)\/img-master\/(img\/(?:\d+\/){6})(\d+)(-[0-9a-f]{32})?(_p\d+)?_(?:master|square)1200(\.\w+(?:\?.*)?)$/.exec(url))) {

      server = re[1];
      size   = re[2];
      dir    = re[3];
      id     = re[4];
      rest   = re[5] || ''; // access restriction
      page   = re[6] || '';
      suffix = re[7];

      if (allow_sizes.indexOf(size) < 0) {
        return null;
      }

      id = g.parseInt(id, 10);
      if (id < 1) {
        return null;
      }

      if (!page) {
        // maybe, it's ugoira
        return {id: id};
      }

      var orig = server + 'img-original/' + dir + id + rest + page;

      ret = {
        id: id,
        image_url_medium: server + 'c/600x600/img-master/' + dir + id + rest + page + '_master1200' + suffix,
        image_url_big_guess: [orig + '.jpg', orig + '.png', orig + '.gif'],
        new_url_pattern: true
      };

    } else if ((re = /^(http:\/\/i\d+\.pixiv\.net\/img(\d+|-inf)\/img\/[^\/]+\/(?:(?:\d+\/){5})?)(?:mobile\/)?(\d+)(_[\da-f]{10}|-[\da-f]{32})?(?:(_[sm]|_100|_128x128|_240m[sw])|(?:_big)?(_p\d+))(\.\w+(?:\?.*)?)$/.exec(url))) {

      prefix = re[1];
      inf    = re[2];
      id     = re[3];
      rest   = re[4] || ''; // access restriction
      type   = re[5] || '';
      page   = re[6] || '';
      suffix = re[7];

      if (allow_types.indexOf(type) < 0) {
        return null;
      }

      id = g.parseInt(id, 10);
      if (id < 1) {
        return null;
      }

      if ((!inf /* ugoira */) || (inf === '-inf' /* all jpg */)) {
        return {id: id};
      } else {
        var url_base = prefix + id;
        ret = {
          id: id,
          image_url_medium: url_base + rest + (page || '_m') + suffix,
          image_url_big: url_base + rest + (page ? '_big' + page : '') + suffix
        };
      }
    }

    if (opt.manga_page) {
      this.try_guessed_big_image_urls(ret);
    }

    return ret || null;
  },

  create_from_id: function(id) {
    return {
      id:                   id,
      url_medium:           '/member_illust.php?mode=medium&illust_id=' + id,
      url_big:              '/member_illust.php?mode=big&illust_id=' + id,
      url_author_profile:   null,
      url_author_works:     null,
      url_author_bookmarks: null,
      url_author_staccfeed: null,
      url_bookmark:         '/bookmark_add.php?type=illust&illust_id=' + id,
      url_bookmark_detail:  '/bookmark_detail.php?illust_id=' + id,
      url_manga:            '/member_illust.php?mode=manga&illust_id=' + id,
      url_response:         '/response.php?illust_id=' + id,
      url_response_to:      null,
      manga:                { }
    };
  },

  update_urls: function(illust) {
    if (illust.author_id) {
      illust.url_author_profile   = '/member.php?id=' + illust.author_id;
      illust.url_author_works     = '/member_illust.php?id=' + illust.author_id;
      illust.url_author_bookmarks = '/bookmark.php?id=' + illust.author_id;
    } else {
      illust.url_author_profile   = null;
      illust.url_author_works     = null;
      illust.url_author_bookmarks = null;
    }

    if (illust.image_response_to) {
      illust.url_response_to =
        '/member_illust.php?mode=medium&illust_id=' + illust.image_response_to;
    } else {
      illust.url_response_to = null;
    }
  },

  create: function(link, allow_types, cb_onshow) {
    var illust, images = _.qa('img,*[data-filter*="lazy-image"]', link).concat([link]);

    for(var i = 0; i < images.length; ++i) {
      var img = images[i], src;

      if (/(?:^|\s)lazy-image(?:\s|$)/.test(img.dataset.filter)) {
        src = img.dataset.src;
      } else if (/^img$/i.test(img.tagName)) {
        src = img.src;
      } else {
        continue;
      }

      var p = this.parse_image_url(src, {allow_types: allow_types});

      if (!p) {
        continue;
      }

      // if multiple thumbails found...
      if (illust) {
        return null;
      }

      illust = p;
      illust.image_thumb = img;
    }

    if (!illust) {
      return null;
    }

    _.extend(illust, this.create_from_id(illust.id), {
      link: link,
      next: null
    });

    var query = _.illust.parse_illust_url(link.href);
    if (query && query.uarea) {
      illust.url_medium += '&uarea=' + query.uarea;
    }

    illust.connection = _.onclick(illust.link, function() {
      _.popup.show(illust);
      if (cb_onshow) {
        cb_onshow();
      }
      return true;
    });
    return illust;
  },

  update: function() {
    var links = _.qa('a[href*="member_illust.php?mode=medium"]', this.root);
    if (links.length === this.last_link_count) {
      return;
    }
    this.last_link_count = links.length;

    _.debug('updating illust list');

    var that = this;

    var extract = function(link) {
      var list = that.list;
      for(var i = 0; i < list.length; ++i) {
        var illust = list[i];
        if (illust.link === link) {
          list.splice(i, 1);
          return illust;
        }
      }
      return null;
    };

    var new_list = [], last = null;
    links.forEach(function(link) {
      var illust = extract(link);
      if (!illust) {
        illust = that.create(link);
      }
      if (!illust) {
        return;
      }

      illust.prev = last;
      illust.next = null;
      if (last) {
        last.next = illust;
      }
      last = illust;

      new_list.push(illust);
    });

    this.list.forEach(function(illust) {
      illust.connection.disconnect();
    });
    this.list = new_list;

    if (new_list.length < 1) {
      this.last_link_count = 0;
    }

    _.debug('illust list updated - ' + new_list.length);
  },

  setup: function(root) {
    if (!root) {
      _.error('Illust list root not specified');
      return;
    }

    this.root = root;
    this.update();

    _.observe_domnodeinserted(this.root, this.update.bind(this));
  },

  parse_medium_html: function(illust, html) {
    var doc = _.parse_html(html), re, re2;

    var error = _.q('.one_column_body .error', doc);
    if (error) {
      illust.error = error.textContent;
      _.error('pixiv reported error: ' + illust.error);
      return false;
    }

    re = /pixiv\.context\.ugokuIllustData *= *(\{[^;]*?\});/.exec(html);
    re2 = /pixiv\.context\.ugokuIllustFullscreenData *= *(\{[^;]*?\});/.exec(html);

    if (re || re2) {
      var err;

      if (re) {
        try {
          illust.ugoira_small = JSON.parse(re[1]);
        } catch(ex) {
          err = 'Failed to parse pixiv.context.ugokuIllustData JSON';
          _.error(err, ex);
          illust.ugoira_small = null;
        }
      }

      if (re2) {
        try {
          illust.ugoira_big = JSON.parse(re2[1]);
        } catch(ex) {
          err = 'Failed to parse pixiv.context.ugokuIllustFullscreenData JSON';
          _.error(err, ex);
          illust.ugoira_big = null;
        }
      }

      if (!illust.ugoira_small && !illust.ugoira_big) {
        illust.error = err;
        return false;
      }

      [illust.ugoira_small, illust.ugoira_big].forEach(function(ugoira) {
        if (!ugoira) {
          return;
        }
        ugoira.duration = 0;
        ugoira.progress = [];
        ugoira.frames.forEach(function(frame) {
          ugoira.progress.push(ugoira.duration);
          ugoira.duration += frame.delay;
        });
      });

    } else {
      var med = _.q('.works_display img', doc);
      if (med) {
        var p = this.parse_image_url(
          med.getAttribute('src'),
          {allow_types: ['_m'], allow_sizes: ['600x600']}
        );
        if (p) {
          if (p.id !== illust.id) {
            illust.error = 'Invalid medium image url';
            return false;
          }
          _.extend(illust, p);
        } else if (!illust.image_url_medium) {
          illust.error = 'Failed to parse medium image url';
          return false;
        }
      } else if (!illust.image_url_medium) {
        illust.error = 'Medium image not found';
        return false;
      }

      var big = _.q('img.original-image', doc);
      var big_src;
      if (big) {
        big_src = big.getAttribute('src') || big.getAttribute('data-src');
      }
      if (big_src) {
        _.debug('Big image found: ' + big_src);
        illust.image_url_big = big_src;
      } else {
        _.debug('Big image not found. Retrying with guessed urls.');
        _.illust.try_guessed_big_image_urls(illust);
      }
    }

    // error check end

    var work_info = _.q('.work-info', doc),
        title     = work_info ? _.q('.title', work_info) : null,
        caption   = work_info ? _.q('.caption', work_info) : null,
        score     = work_info ? _.q('.score', work_info) : null,
        question  = work_info ? _.q('.questionnaire', work_info) : null,
        tags_tmpl = _.q('#template-work-tags', doc),
        tags      = _.q('.work-tags .tags-container', doc);

    illust.title = title ? _.strip(title.textContent) : '';
    illust.caption = caption ? caption.innerHTML : '';
    illust.tags = [];
    if (tags) {
      illust.tags = _.qa('.tag .text', tags).map(function(tag) {
        return _.strip(tag.textContent);
      });
    }
    illust.score = {};
    if (score) {
      ['view', 'rated', 'score'].forEach(function(name) {
        var node = _.q('.' + name + '-count', score);
        if (node) {
          illust.score[name] = g.parseInt(_.strip(node.textContent));
        }
      });
    }

    illust.taglist  = (tags_tmpl ? tags_tmpl.outerHTML : '') + (tags ? tags.outerHTML : '');
    illust.rating   = score ? score.outerHTML : '';
    illust.question = question ? question.outerHTML : '';

    illust.rated = score ? !!_.q('.rating.rated', score) : false;
    illust.answered = null;
    if (question) {
      illust.answered = !_.q('.list', question);
    }

    var profile_area   = _.q('.profile-unit', doc),
        avatar         = profile_area ? _.q('img.user-image', profile_area) : null,
        author_link    = profile_area ? _.q('a.user-link', profile_area) : null,
        author_name    = author_link ? _.q('h1.user', author_link) : null,
        staccfeed_link = _.qa('.column-header .tabs a', doc).filter(function(link) {
          return /^(?:(?:http:\/\/www\.pixiv\.net)?\/)?stacc\//.test(link.getAttribute('href'));
        })[0];

    illust.author_id              = null;
    illust.author_name            = author_name ? author_name.textContent : null;
    illust.author_favorite        = !!(profile_area && _.q('#favorite-button.following', profile_area));
    illust.author_mutual_favorite = !!(profile_area && _.q('.user-relation .sprites-heart', profile_area));
    illust.author_mypixiv         = !!(profile_area && _.q('#mypixiv-button.mypixiv', profile_area));
    illust.author_image_url       = avatar ? avatar.getAttribute('src') : null;
    illust.author_is_me           = null;

    if (author_link && (re = /\/member\.php\?id=(\d+)/.exec(author_link.getAttribute('href')))) {
      illust.author_id = g.parseInt(re[1], 10);
    }

    if (!illust.author_id) {
      if ((re = /pixiv\.context\.userId\s*=\s*([\'\"])(\d+)\1;/.exec(html))) {
        illust.author_id = g.parseInt(re[2]);
      }
    }

    try {
      illust.author_is_me = illust.author_id === w.pixiv.user.id;
    } catch(ex) {
      _.error(ex);
    }

    illust.url_author_staccfeed = null;
    if (staccfeed_link) {
      illust.url_author_staccfeed =
        staccfeed_link.getAttribute('href').replace(/^http:\/\/www.pixiv.net(?=\/)/, '');
    }

    var meta = work_info ? _.qa('.meta li', work_info) : [],
        meta2 = meta[1] ? meta[1].textContent : '';

    illust.datetime = meta[0] ? meta[0].textContent : '';

    illust.is_manga = !!_.q('._work.manga', doc);

    illust.size = null;
    illust.manga = {
      available: false,
      book_mode: null, // 'ltr' or 'rtl' or null
      viewed: illust.manga ? !!illust.manga.viewed : false,
      page_count: 0
    };

    if (_.q('.works_display ._work.multiple', doc)) {
      illust.manga.available = true;
    }

    if (_.q('._work.rtl', doc)) {
      illust.manga.book_mode = 'rtl';
    } else if (_.q('._work.ltr', doc)) {
      illust.manga.book_mode = 'ltr';
    }

    if ((re = /^(\d+)\u00d7(\d+)$/.exec(meta2))) {
      illust.size = {width: g.parseInt(re[1], 10), height: g.parseInt(re[2], 10)};
    } else if ((re = /^[^ ]{1,10} (\d+)P$/.exec(meta2))) {
      illust.manga.available = true;
      illust.manga.page_count = g.parseInt(re[1], 10);
    }

    if (illust.manga.available && illust.manga.page_count < 1) {
      _.debug('It seems manga but page count not detected');
    }

    if (work_info) {
      illust.tools = _.qa('.meta .tools li', work_info).map(function(node) {
        return _.strip(node.textContent);
      });
    }

    illust.bookmarked = !!_.q('.bookmark-container .bookmark-count', doc);

    illust.has_image_response = !!_.q('.worksImageresponse .worksResponse', doc);
    illust.image_response_to  = null;
    _.qa('.worksImageresponseInfo a', doc).forEach(function(link) {
      if (illust.image_response_to) {
        return;
      }
      re = /^\/member_illust\.php\?.*&(?:amp;)?illust_id=(\d+).*&(?:amp;)?uarea=response_out(?:&|$)/.exec(link.getAttribute('href'));
      if (re) {
        illust.image_response_to = g.parseInt(re[1]);
      }
    });

    var comment = _.q('#one_comment .layout-column-1', doc);
    if (comment) {
      _.qa('.worksImageresponse', comment).forEach(function(node) {
        node.parentNode.removeChild(node);
      });
    }
    illust.comment = (comment ? comment.innerHTML : '') || 'Error';

    if (!_.stampSeries) {
      re = /pixiv\.context\.stampSeries *= *(\[[^;]*?\]);/.exec(html);
      if (re) {
        _.stampSeries = JSON.parse(re[1]);
      } else {
        _.error('pixiv.context.stampSeries not detected');
      }
    }

    if (!_.emojiSeries) {
      re = /pixiv\.context\.emojiSeries *= *(\[[^;]*?\]);/.exec(html);
      if (re) {
        _.emojiSeries = JSON.parse(re[1]);
      } else {
        _.error('pixiv.context.emojiSeries not detected');
      }
    }

    _.illust.update_urls(illust);
    return true;
  },

  // parhaps cb_success() will called 2 times or more
  load_images: function(page, load_big_image, cb_success, cb_error) {
    if (!load_big_image) {
      load_big_image = _.conf.popup.big_image;
    }

    if (!page.load_statuses) {
      page.load_statuses = {};
    }

    if (page.image_medium || page.image_big) {
      cb_success(page);
    }

    var images = {};

    var load = function(name, other_name, retry) {
      if (/^(?:loading|complete)$/.test(page.load_statuses[name])) {
        return;
      }

      var img, url = page['image_url_' + name];
      if (!url) {
        return;
      }
      images[name] = img = new w.Image();

      img.addEventListener('load', function() {
        _.debug('Successfully loaded ' + name + ' image: ' + url);
        page['image_' + name] = img;
        --page.loading_count;
        page.load_statuses[name] = 'complete';
        cb_success(page);
      }, false);

      img.addEventListener('error', function() {
        --page.loading_count;
        page.load_statuses[name] = 'error';

        _.debug('Failed to load ' + name + ' image: ' + url);

        var alt = page['image_url_' + name + '_alt'];
        if (alt && alt.length > 0) {
          url = alt.shift();
          _.debug('Retrying to load ' + name + ' image with new url: ' + url);
          page['image_url_' + name] = url;
          load(name, other_name, true);
        } else if (!/^(?:loading|complete)$/.test(page.load_statuses[other_name])) {
          cb_error();
        }
      }, false);

      if (!retry) {
        _.debug('Trying to load ' + name + ' image: ' + url);
      }
      img.src = url;
      page.load_statuses[name] = 'loading';
      page.loading_count = (page.loading_count || 0) + 1;
    };

    load('medium', 'big');
    if (load_big_image) {
      load('big', 'medium');
    }
  },

  load: function(illust, load_big_image) {
    if (!load_big_image) {
      load_big_image = _.conf.popup.big_image;
    }

    if (!illust.load_statuses) {
      illust.load_statuses = {};
    }

    if (illust.load_statuses.html === 'complete' &&
        ((!load_big_image && illust.image_medium) || illust.image_big)) {
      _.popup.onload(illust);
      return;
    }

    illust.error = null;

    var error_sent = false;
    var send_error = function(msg) {
      if (!error_sent) {
        if (msg && !illust.error) {
          illust.error = msg;
        }
        _.popup.onerror(illust);
        error_sent = true;
      }
    };

    var that = this;
    var load_images = function() {
      that.load_images(illust, load_big_image, function() {
        if (illust.load_statuses.html === 'complete') {
          _.popup.onload(illust);
        }
      }, function() {
        send_error('Failed to load images');
      });
    };

    if (illust.image_url_medium || (load_big_image && illust.image_url_big)) {
      load_images();
    }

    if (!/^(?:loading|complete)$/.test(illust.load_statuses.html)) {
      _.debug('Start loading medium html...');

      illust.load_statuses.html = 'loading';
      illust.loading_count = (illust.loading_count || 0) + 1;

      _.xhr.get(illust.url_medium, function(text) {
        _.debug('Medium html loaded!');

        --illust.loading_count;

        if (!that.parse_medium_html(illust, text)) {
          illust.load_statuses.html = 'error';
          send_error('Failed to parse medium html');
          return;
        }

        illust.load_statuses.html = 'complete';

        if (illust.ugoira_big || illust.ugoira_small) {

          illust.loaded = true;

          if (load_big_image && illust.ugoira_big) {
            illust.ugoira = illust.ugoira_big;
          } else {
            illust.ugoira = illust.ugoira_small;
          }

          if (!illust.ugoira_player) {
            illust.ugoira_canvas = _.e('canvas');

            try {

              illust.ugoira_player = new w.ZipImagePlayer({
                canvas: illust.ugoira_canvas,
                source: illust.ugoira.src,
                metadata: illust.ugoira,
                chunkSize: 3e5,
                loop: true,
                autoStart: false,
                debug: false,
                autosize: true
              });

              illust.ugoira_player._displayFrame = function() {
                var ret;

                ret = w.ZipImagePlayer.prototype._displayFrame.apply(this, arguments);

                if (_.popup.running && _.popup.illust === illust) {
                  var canvas = illust.ugoira_canvas;

                  if (canvas.width !== canvas.naturalWidth ||
                      canvas.height !== canvas.naturalHeight) {
                    canvas.naturalWidth = canvas.width;
                    canvas.naturalHeight = canvas.height;
                    _.popup.adjust();
                  }

                  _.popup.update_ugoira_progress(this.getCurrentFrame());
                }

                return ret;
              };

            } catch(ex) {
              send_error(g.String(ex));
              return;
            }
            _.popup.onload(illust);
          }
          return;
        }

        if (illust.image_medium || illust.image_big) {
          _.popup.onload(illust);
          if (illust.image_url_big && !illust.image_big) {
            load_images();
          }
        } else {
          load_images();
        }

        if (_.conf.popup.preload && illust.manga.available) {
          that.load_manga_page(illust, 0);
        }

      }, function() {
        illust.load_statuses.html = 'error';
        --illust.loading_count;
        send_error('Failed to load medium html');
      });
    }
  },

  unload: function(illust) {
    if (!illust) {
      return;
    }
    illust.load_statuses.html = null;
    if (illust.ugoira_player) {
      illust.ugoira_player.stop();
      illust.ugoira_player = null;
      illust.ugoira_canvas = null;
    }
    _.xhr.remove_cache(illust.url_medium);
  },

  create_manga_page: function(page, medium, big, pagenum) {
    if (medium) {
      page.image_url_medium = medium;
    }
    if (big) {
      page.image_url_big = big;
    }
    page.url_manga_big = '/member_illust.php?mode=manga_big&illust_id=' + page.id + '&page=' + pagenum;
    return page;
  },

  parse_book_html: function(illust, html) {
    var images = [], images_big = [], page_count = 0;

    var terms = html.split(/pixiv\.context\.(images|originalImages)\[(\d+)\] *= *(\"[^\"]+\")/);
    for(var i = 1; i + 1 < terms.length; i += 4) {
      var type = terms[i],
          num  = g.parseInt(terms[i + 1]),
          url  = terms[i + 2];
      page_count = g.Math.max(num + 1, page_count);
      _.log(type + ':' + num + ' ' + url);
      try {
        (type === 'originalImages' ? images_big : images)[num] = JSON.parse(url);
      } catch(ex) {
        _.warn('Failed to parse pixiv.context.images json', ex);
      }
    }

    if (illust.manga.page_count === 0) {
      _.warn('illust.manga.page_count not declared');
    } else if (page_count !== illust.manga.page_count) {
      _.error('Manga page count mismatch!');
      return false;
    }

    var page_pairs = [];

    var rtl = !(/pixiv\.context\.rtl *= *false/.test(html)); // make default to true
    for(i = 0; i < page_count; ++i) {
      if (!(images[i] && images_big[i])) {
        _.error('Could not detect manga image url for page idx ' + 1);
        return false;
      }

      if (i === 0 || (i + 1) === page_count) {
        page_pairs.push([this.create_manga_page({id: illust.id}, images[i], images_big[i], i)]);

      } else {
        if (!(images[i + 1] && images_big[i + 1])) {
          _.error('Could not detect manga image url for page idx ' + (i + 1));
          return false;
        }

        if (rtl) {
          page_pairs.push([
            this.create_manga_page({id: illust.id}, images[i + 1], images_big[i + 1], i + 1),
            this.create_manga_page({id: illust.id}, images[i], images_big[i], i)
          ]);
        } else {
          page_pairs.push([
            this.create_manga_page({id: illust.id}, images[i], images_big[i], i),
            this.create_manga_page({id: illust.id}, images[i + 1], images_big[i + 1], i + 1)
          ]);
        }

        ++i;
      }
    }

    illust.manga.pages = page_pairs;
    illust.manga.page_count = page_count;
    return true;
  },

  parse_manga_html: function(illust, html) {
    illust.manga.book = /pixiv\.context\.bound *= *true/.test(html);
    if (illust.manga.book) {
      return this.parse_book_html(illust, html);
    }

    var that = this, page_pairs = [], cnt = 0;
    var doc = _.parse_html(html);

    var containers = _.qa('.manga .item-container', doc);
    for(var i = 0; i < containers.length; ++i) {

      var pages = [];
      var images = _.qa('img', containers[i]);

      for(var j = 0; j < images.length; ++j) {
        var img = images[j];

        if (img.getAttribute('data-filter') !== 'manga-image') {
          continue;
        }

        var src = img.getAttribute('data-src') || img.getAttribute('src');
        var p = _.illust.parse_image_url(src, {
          allow_types: [''],
          allow_sizes: ['1200x1200'],
          manga_page: true
        });

        if (p && p.image_url_medium) {
          pages.push(this.create_manga_page(p, null, null, cnt));
          ++cnt;
        } else {
          _.error('Failed to parse manga page image url');
          return false;
        }
      }

      page_pairs.push(pages);
    }

    if (illust.manga.page_count === 0) {
      _.warn('illust.manga.page_count not declared');
    } else if (cnt !== illust.manga.page_count) {
      _.error('Multiple illust page count mismatch!');
      return false;
    }

    illust.manga.pages = page_pairs;
    illust.manga.page_count = cnt;
    return true;
  },

  load_manga_page: function(illust, page, load_big_image) {
    var that = this;

    if (!illust.manga.pages) {
      _.debug('Start loading manga html...');
      _.xhr.get(illust.url_manga, function(text) {
        _.debug('Manga html loaded!');
        if (that.parse_manga_html(illust, text)) {
          that.load_manga_page(illust, page, load_big_image);
        } else {
          _.debug('Failed to parse manga html');
          _.popup.manga.onerror(illust, page);
        }
      }, function() {
        _.debug('Failed to load manga html');
        _.popup.manga.onerror(illust, page);
      });
      return;
    }

    if (page >= illust.manga.pages.length) {
      _.popup.manga.onerror(illust, page);
      return;
    }

    var pages = illust.manga.pages[page];

    var error_sent = false;
    var send_error = function() {
      if (!error_sent) {
        _.popup.manga.onerror(illust, page);
        error_sent = true;
      }
    };

    var onload = function() {
      if (error_sent) {
        return;
      }
      for(var i = 0; i < pages.length; ++i) {
        if (!(pages[i].image_medium || pages[i].image_big)) {
          return;
        }
      }
      _.popup.manga.onload(illust, page);
    };

    pages.forEach(function(page) {
      _.illust.load_images(page, load_big_image, onload, send_error);
    });
  },

  parse_illust_url: function(url) {
    var re;
    if (!(re = /^(?:(?:http:\/\/www\.pixiv\.net)?\/)?member_illust\.php(\?.*)?$/.exec(url))) {
      return null;
    }
    var query = _.parse_query(re[1]);
    if (query.illust_id) {
      query.illust_id = g.parseInt(query.illust_id, 10);
    }
    return query;
  }
};
