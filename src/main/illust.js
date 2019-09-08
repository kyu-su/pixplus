_.illust = {
    root: null,
    last_link_count: 0,
    list: [],

    try_guessed_big_image_urls: function (illust) {
        if (illust && illust.image_url_big_guess && illust.image_url_big_guess.length) {
            illust.image_url_big = illust.image_url_big_guess[0];
            illust.image_url_big_alt = illust.image_url_big_guess.slice(1);
        }
    },

    // todo
    parse_image_url: function (url, opt) {
        if (!opt) {
            opt = {};
        }

        var allow_types = opt.allow_types || ['_s', '_100', '_128x128', '_240ms', '_240mw', '_480mw'];
        var allow_sizes = opt.allow_sizes || ['100x100', '128x128', '150x150', '240x240', '240x480', '600x600', '480x960'];

        var re, server, size, dir, id, rest, p0, suffix, prefix, inf, type, page, ret;
        if ((re = /^(https?:\/\/(?:i\d+\.pixiv\.net|i\.pximg\.net)\/)(?:c\/(\d+x\d+)\/)?img-master\/(img\/(?:\d+\/){6})(\d+)(-[0-9a-f]{32})?(_p\d+)?_(?:master|square)1200(\.\w+(?:\?.*)?)$/.exec(url))) {

            server = re[1];
            size = re[2];
            dir = re[3];
            id = re[4];
            rest = re[5] || ''; // access restriction
            page = re[6] || '';
            suffix = re[7];

            if (size && allow_sizes.indexOf(size) < 0) {
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

        } else if ((re = /^(https?:\/\/i\d+\.pixiv\.net\/img(\d+|-inf)\/img\/[^\/]+\/(?:(?:\d+\/){5})?)(?:mobile\/)?(\d+)(_[\da-f]{10}|-[\da-f]{32})?(?:(_[sm]|_100|_128x128|_240m[sw]|_480mw)|(?:_big)?(_p\d+))(\.\w+(?:\?.*)?)$/.exec(url))) {

            prefix = re[1];
            inf = re[2];
            id = re[3];
            rest = re[4] || ''; // access restriction
            type = re[5] || '';
            page = re[6] || '';
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

    create_from_id: function (id) {
        return {
            id: id,
            url_medium: '/member_illust.php?mode=medium&illust_id=' + id,
            url_big: '/member_illust.php?mode=big&illust_id=' + id,
            url_author_profile: null,
            url_author_works: null,
            url_author_bookmarks: null,
            url_author_staccfeed: null,
            url_bookmark: '/bookmark_add.php?type=illust&illust_id=' + id,
            url_bookmark_detail: '/bookmark_detail.php?illust_id=' + id,
            url_manga: '/member_illust.php?mode=manga&illust_id=' + id,
            url_response: '/response.php?illust_id=' + id,
            url_response_to: null,
            manga: {}
        };
    },

    update_urls: function (illust) {
        if (illust.author_id) {
            illust.url_author_profile = '/member.php?id=' + illust.author_id;
            illust.url_author_works = '/member_illust.php?id=' + illust.author_id;
            illust.url_author_bookmarks = '/bookmark.php?id=' + illust.author_id;
        } else {
            illust.url_author_profile = null;
            illust.url_author_works = null;
            illust.url_author_bookmarks = null;
        }

        if (illust.image_response_to) {
            illust.url_response_to =
                '/member_illust.php?mode=medium&illust_id=' + illust.image_response_to;
        } else {
            illust.url_response_to = null;
        }
    },

    create: function (link, illust_details, cb_onshow) {
        let illust, images = _.qa('img,*[data-filter*="lazy-image"]', link).concat([link]);

        if (link.children.length == 0) {
            return;
        }

        const params = new URLSearchParams(link.search)

        let illust_id = params.get('illust_id');
        let illust_detail = illust_details[illust_id];

        illust = {
            id: illust_id,
            image_url_medium : illust_detail.url['240mw'],
            image_url_big : illust_detail.url['big'],
            new_url_pattern: true
        };
        illust.illust_detail = illust_detail;

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

        // _.debug(illust.link);
        illust.connection = _.onclick(illust.link, function (ev) {
            for (var p = ev.target; p; p = p.parentNode) {
                if (p instanceof Element &&
                    (p.classList.contains('thumbnail-menu') ||
                        p.classList.contains('_ab-test-one-click-bookmark') ||
                        (p.hasAttribute('data-click-action') &&
                            p.getAttribute('data-click-action') !== 'ClickToIllust'))) {
                    return false;
                }
            }
            _.popup.show(illust);
            if (cb_onshow) {
                cb_onshow();
            }
            return true;
        }, {capture: true});
        return illust;
    },

    update: async function () {
        var links = _.qa('a[href*="member_illust.php?mode=medium"]', this.root);
        if (links.length === this.last_link_count) {
            return;
        }
        this.last_link_count = links.length;

        _.debug('updating illust list');

        var that = this;

        var extract = function (link) {
            var list = that.list;
            for (var i = 0; i < list.length; ++i) {
                var illust = list[i];
                if (illust.link === link) {
                    list.splice(i, 1);
                    return illust;
                }
            }
            return null;
        };

        var new_list = [], last = null;

        // illust_ids
        var illust_ids = [];
        links.forEach(function (link) {
            const params = new URLSearchParams(link.search)

            var illust_id = params.get('illust_id');
            if (illust_id !== null) {
                illust_ids.push(illust_id);
            }
        });

        var that = this;

        let json;
        try {
            let response = await _.xhr.getIllustDetailByIds("/rpc/index.php?mode=get_illust_detail_by_ids&illust_ids=" + illust_ids.join(','));
            json = await response.json();
        } catch (err) {
            _.debug('Failed to get_illust_detail_by_ids');
        }

        let detail_by_ids = json.body;

        links.forEach(function (link) {
            var illust = extract(link);
            if (!illust) {
                illust = that.create(link, detail_by_ids);
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

        this.list.forEach(function (illust) {
            illust.connection.disconnect();
        });
        this.list = new_list;

        if (new_list.length < 1) {
            this.last_link_count = 0;
        }

        _.debug('illust list updated - ' + new_list.length);
    },

    setup: function (root) {
        if (!root) {
            _.error('Illust list root not specified');
            return;
        }

        this.root = root;
        this.update();

        _.observe_domnodeinserted(this.root, this.update.bind(this));
    },

    parse_medium_html: function (illust, html) {
        var doc = _.parse_html(html), re, re2;

        re = /token: *"([0-9a-f]{10,})"/.exec(html);
        if (re) {

        } else {
            _.error('Failed to detect pixiv.context.token');
        }

        re = /pixiv\.context\.ugokuIllustData *= *(\{[^;]*?\});/.exec(html);
        re2 = /pixiv\.context\.ugokuIllustFullscreenData *= *(\{[^;]*?\});/.exec(html);

        // ugoira判定
        if (re || re2) {
            var err;

            if (re) {
                try {
                    illust.ugoira_small = JSON.parse(re[1]);
                } catch (ex) {
                    err = 'Failed to parse pixiv.context.ugokuIllustData JSON';
                    _.error(err, ex);
                    illust.ugoira_small = null;
                }
            }

            if (re2) {
                try {
                    illust.ugoira_big = JSON.parse(re2[1]);
                } catch (ex) {
                    err = 'Failed to parse pixiv.context.ugokuIllustFullscreenData JSON';
                    _.error(err, ex);
                    illust.ugoira_big = null;
                }
            }

            if (!illust.ugoira_small && !illust.ugoira_big) {
                illust.error = err;
                return false;
            }

            [illust.ugoira_small, illust.ugoira_big].forEach(function (ugoira) {
                if (!ugoira) {
                    return;
                }
                ugoira.duration = 0;
                ugoira.progress = [];
                ugoira.frames.forEach(function (frame) {
                    ugoira.progress.push(ugoira.duration);
                    ugoira.duration += frame.delay;
                });
            });

        }

        // error check end
        // error check end
        const script = doc.scripts[5].innerText.match(/}\)\(({.+,})\);/);
        const obj = (new Function("return " + script[1]))();
        const info = obj.preload.illust[illust.id];

        var title = info.title,
            caption = info.description,
            tags = info.tags.tags;

        illust.title = title ? _.strip(title) : '';
        illust.caption = caption;
        illust.tags = [];
        if (tags) {
            tags.forEach((tag) => {
                illust.tags.push(tag.tag);
            });
        }

        illust.vote = {available: false};

        illust.author_id = info.userId;
        illust.author_name = info.userName;
        illust.author_image_url = illust.illust_detail.profile_img;
        illust.author_is_me = null;

        illust.datetime = info.uploadDate;

        illust.is_manga = info.pageCount > 1;

        illust.size = {width: g.parseInt(info.width, 10), height: g.parseInt(info.height, 10)};
        illust.manga = {
            available: illust.is_manga,
            book_mode: null, // 'ltr' or 'rtl' or null
            viewed: illust.manga ? !!illust.manga.viewed : false,
            page_count: info.pageCount
        };

        if (illust.manga.available && illust.manga.page_count < 1) {
            _.debug('It seems manga but page count not detected');
        }

        illust.bookmarked = illust.illust_detail.bookmarked;

        _.illust.update_urls(illust);
        return true;
    },

    // parhaps cb_success() will called 2 times or more
    load_images: function (page, load_big_image, cb_success, cb_error) {
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

        var load = function (name, other_name, retry) {
            if (/^(?:loading|complete)$/.test(page.load_statuses[name])) {
                return;
            }

            var img, url = page['image_url_' + name];
            if (!url) {
                return;
            }
            images[name] = img = new w.Image();

            img.addEventListener('load', function () {
                _.debug('Successfully loaded ' + name + ' image: ' + url);
                page['image_' + name] = img;
                --page.loading_count;
                page.load_statuses[name] = 'complete';
                cb_success(page);
            }, false);

            img.addEventListener('error', function () {
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

    load: function (illust, load_big_image) {
        if (!load_big_image) {
            load_big_image = _.conf.popup.big_image;
        }

        if (!illust.load_statuses) {
            illust.load_statuses = {};
        }

        if (illust.load_statuses.html === 'complete' &&
            ((illust.image_medium && !load_big_image) || illust.image_big)) {
            _.popup.onload(illust);
            return;
        }

        illust.error = null;

        var error_sent = false;
        var send_error = function (msg) {
            if (!error_sent) {
                if (msg && !illust.error) {
                    illust.error = msg;
                }
                _.popup.onerror(illust);
                error_sent = true;
            }
        };

        var that = this;
        var load_images = function () {
            that.load_images(illust, load_big_image, function () {
                if (illust.load_statuses.html === 'complete') {
                    _.popup.onload(illust);
                }
            }, function () {
                send_error('Failed to load images');
            });
        };

        if (illust.image_url_medium || (load_big_image && illust.image_url_big)) {
            load_images();
        }

        var load_ugoira_player = function () {
            if (illust.ugoira_player) {
                illust.ugoira_player.stop();
            }

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

            illust.ugoira_player._displayFrame = function () {
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
        };

        if (!/^(?:loading|complete)$/.test(illust.load_statuses.html)) {
            _.debug('Start loading medium html...');

            illust.load_statuses.html = 'loading';
            illust.loading_count = (illust.loading_count || 0) + 1;

            _.xhr.get(illust.url_medium, function (text) {
                _.debug('Medium html loaded!');

                --illust.loading_count;

                if (!that.parse_medium_html(illust, text)) {
                    illust.load_statuses.html = 'error';
                    send_error('Failed to parse medium html');
                    return;
                }

                illust.load_statuses.html = 'complete';

                if (illust.ugoira_big || illust.ugoira_small) {

                    if (load_big_image && illust.ugoira_big) {
                        illust.ugoira = illust.ugoira_big;
                        illust.load_statuses.big = 'complete';
                    } else {
                        illust.ugoira = illust.ugoira_small;
                        illust.load_statuses.medium = 'complete';
                    }

                    if (!illust.ugoira_player) {
                        illust.ugoira_canvas = _.e('canvas');
                        try {
                            load_ugoira_player();
                        } catch (ex) {
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
                    _.debug('Attempting to preload manga page');
                    that.load_manga_page(illust, 0);
                }

            }, function () {
                illust.load_statuses.html = 'error';
                --illust.loading_count;
                send_error('Failed to load medium html');
            });

        } else if (load_big_image && illust.ugoira_player && illust.ugoira === illust.ugoira_small) {
            illust.ugoira = illust.ugoira_big;
            illust.load_statuses.big = 'complete';
            try {
                load_ugoira_player();
            } catch (ex) {
                send_error(String(ex));
                return;
            }
            _.popup.onload(illust);
        }
    },

    unload: function (illust) {
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

    create_manga_page: function (page, medium, big, pagenum) {
        if (medium) {
            page.image_url_medium = medium;
        }
        if (big) {
            page.image_url_big = big;
        }
        page.url_manga_big = '/member_illust.php?mode=manga_big&illust_id=' + page.id + '&page=' + pagenum;
        return page;
    },

    parse_book_html: function (illust, html) {
        var images = [], images_big = [], page_count = 0;

        var terms = html.split(/pixiv\.context\.(images|originalImages)\[(\d+)\] *= *(\"[^\"]+\")/);
        for (var i = 1; i + 1 < terms.length; i += 4) {
            var type = terms[i],
                num = g.parseInt(terms[i + 1]),
                url = terms[i + 2];
            page_count = g.Math.max(num + 1, page_count);
            _.log(type + ':' + num + ' ' + url);
            try {
                (type === 'originalImages' ? images_big : images)[num] = JSON.parse(url);
            } catch (ex) {
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
        for (i = 0; i < page_count; ++i) {
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

    parse_manga_html: function (illust, html) {
        illust.manga.book = /pixiv\.context\.bound *= *true/.test(html);
        if (illust.manga.book) {
            return this.parse_book_html(illust, html);
        }

        var that = this, page_pairs = [], cnt = 0;
        var doc = _.parse_html(html);

        // var containers = _.qa('.manga .item-container', doc);
        // for (var i = 0; i < containers.length; ++i) {
        //
            var pages = [];
        //     var images = _.qa('img', containers[i]);

            for (var j = 0; j < illust.manga.page_count; ++j) {
                var p = _.illust.parse_image_url(illust.image_url_medium, {
                    allow_types: null,
                    allow_sizes: null,
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
        // }

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

    load_manga_page: function (illust, page, load_big_image) {
        var that = this;

        if (!illust.manga.pages) {
            _.debug('Start loading manga html...');
            _.xhr.get(illust.url_manga, function (text) {
                _.debug('Manga html loaded!');
                if (that.parse_manga_html(illust, text)) {
                    that.load_manga_page(illust, page, load_big_image);
                } else {
                    _.debug('Failed to parse manga html');
                    _.popup.manga.onerror(illust, page);
                }
            }, function () {
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
        var send_error = function () {
            if (!error_sent) {
                _.popup.manga.onerror(illust, page);
                error_sent = true;
            }
        };

        var onload = function () {
            if (error_sent) {
                return;
            }
            for (var i = 0; i < pages.length; ++i) {
                if (!(pages[i].image_medium || pages[i].image_big)) {
                    return;
                }
            }
            _.popup.manga.onload(illust, page);
        };

        pages.forEach(function (page) {
            that.load_images(page, load_big_image, onload, send_error);
        });
    },

    parse_illust_url: function (url) {
        let params = new URLSearchParams(url);
        params.illust_id = params.get('illust_id');
        if (params.illust_id) {
            params.illust_id = g.parseInt(params.illust_id, 10);
        }
        return params;
    }
};
