_.pages = {
    run: function () {
        var re;
        re = /^\/(\w+)\./.exec(w.location.pathname);
        if (re && this[re[1]]) {
            this[re[1]].run(_.parse_query(w.location.search));
        }
    },

    fast_user_bookmark: function () {
        var favorite_button = _.q('.profile-unit .user-relation #favorite-button');
        if (!favorite_button) {
            _.warn('fast_user_bookmark: favorite-button not found');
            return;
        }

        _.onclick(favorite_button, function () {
            if (favorite_button.classList.contains('following') ||
                _.conf.general.fast_user_bookmark <= 0) {
                return;
            }

            g.setTimeout(function () {
                var dialog = _.q('.profile-unit .user-relation #favorite-preference');
                if (!dialog) {
                    _.error('fast_user_bookmark: favorite-preference not found');
                    return;
                }

                var form = _.q('form', dialog);
                if (!form) {
                    _.error('fast_user_bookmark: form not found');
                    return;
                }

                var restrict = _.conf.general.fast_user_bookmark - 1,
                    radio = _.q('input[name="restrict"][value="' + restrict + '"]', form);

                if (!radio) {
                    _.error('fast_user_bookmark: restrict input not found');
                    return;
                }

                radio.checked = true;
                _.xhr.post(form, function () {
                    favorite_button.classList.add('following');
                });
                _.send_click(_.q('.close', dialog));
            }, 10);
        });
    },

    member: {
        run: function (query) {
            _.pages.fast_user_bookmark();
        }
    },

    member_illust: {
        run: function (query) {
            this.manga_thumbnail(query);
            this.manga_medium(query);
            _.pages.fast_user_bookmark();
        },

        manga_thumbnail: function () {
            var re;
            if (w.location.hash === '#pp-manga-thumbnail') {
                var toggle_thumbnail = _.q('.toggle-thumbnail');
                _.send_click(toggle_thumbnail);
            } else if ((re = /^#pp-manga-page-(\d+)$/.exec(w.location.hash))) {
                try {
                    w.pixiv.mangaViewer.listView.move(g.parseInt(re[1], 10));
                } catch (ex) {
                    _.error(ex);
                }
            }
        },

        manga_medium: function (query) {
            if (query.mode !== 'medium' || !query.illust_id) {
                return;
            }

            _.modify_caption(_.q('.work-info .caption'));

            if (_.conf.popup.manga_page_action) {
                var manga = _.q('.works_display a[href*="mode=manga"]');
                if (manga) {
                    var illust = _.illust.create(
                        manga,
                        ['_m'],
                        function () {
                            if (_.conf.popup.manga_page_action === 2) {
                                _.popup.manga.start();
                            }
                        }
                    );

                    if (_.conf.popup.preload) {
                        _.illust.load(illust);
                    }
                }
            }
        }
    },

    bookmark: {
        run: function (query) {
            this.float_tag_list(query);
        },

        float_tag_list: function (query) {
            var bookmark_list, bookmark_list_ul;
            if (_.conf.bookmark.tag_order.length < 1 ||
                query.id ||
                !(bookmark_list = _.q('#bookmark_list')) ||
                !(bookmark_list_ul = _.q('ul', bookmark_list))) {
                return;
            }

            bookmark_list.classList.add('pp-bookmark-tag-list');

            var first_list, items = _.qa('li', bookmark_list_ul);
            first_list = bookmark_list_ul.cloneNode(false);
            items[0].parentNode.removeChild(items[0]);
            items[1].parentNode.removeChild(items[1]);
            first_list.appendChild(items[0]);
            first_list.appendChild(items[1]);
            bookmark_list_ul.parentNode.insertBefore(first_list, bookmark_list_ul);

            var lists = _.reorder_tag_list(bookmark_list_ul, function (item) {
                var a = _.q('a', item);
                if (!a || !a.firstChild || a.firstChild.nodeType !== w.Node.TEXT_NODE) {
                    return null;
                }
                return a.firstChild.nodeValue;
            });

            if (!first_list) {
                first_list = lists[0];
            }

            try {
                var _bookmarkToggle = w.bookmarkToggle;
                w.bookmarkToggle = function () {
                    _bookmarkToggle.apply(this, arguments);
                    lists.forEach(function (list) {
                        list.className = first_list.className;
                    });
                };

                if (!first_list.classList.contains('tagCloud')) {
                    w.bookmarkToggle('bookmark_list', 'cloud');
                    w.bookmarkToggle('bookmark_list', 'flat');
                }
            } catch (ex) {
                _.error(ex);
            }

        }
    },

    search: {
        run: function (query) {
            var that = this;
            [
                // 'size',
                'ratio'
            ].forEach(function (name) {
                var inputs = _.qa('#search-option ul>li>label>input[name="' + name + '"]');
                if (!inputs.length) {
                    return;
                }

                var ul = inputs[0].parentNode.parentNode.parentNode;

                var li = _.e('li', {id: 'pp-search-' + name + '-custom'}, ul),
                    radio = _.e('input', {type: 'radio', name: name}, _.e('label', null, li)),
                    curr = inputs.filter(function (i) {
                        return i.checked;
                    })[0];

                if (!curr) {
                    radio.checked = true;
                }

                inputs.push(radio);
                that[name](query, ul, li, radio, inputs);
            });

            this.set_default_options(query);
        },

        set_default_options: function (query) {
            var keys = ['s_mode', 'order', 'scd',
                'wlt', 'hlt', 'wgt', 'hgt',
                'ratio', 'r18'];

            var form = _.q('.header form[action="/search.php"]');

            keys.forEach(function (key) {
                if (!query.hasOwnProperty(key)) {
                    return;
                }

                var input = _.q('input[name="' + key + '"]', form);
                if (!input) {
                    input = _.e('input', {type: 'hidden', name: key}, form);
                }
                input.value = query[key];
            });

            _.qa('.column-related .tag a[href^="/search.php?"]').forEach(function (tag) {
                var params = _.parse_query(tag.href);

                keys.forEach(function (key) {
                    if (query.hasOwnProperty(key)) {
                        params[key] = query[key];
                    }
                });

                tag.href = '/search.php?' + _.xhr.serialize(params);
            });
        },

        // size: function(query, ul, li, radio, inputs) {
        //   w.pixiv.search.parseSizeOption = function(value) {
        //     var size = (value || '').split('-', 2).map(function(p) {
        //       return p.split('x');
        //     });

        //     var min = size[0] || [],
        //         max = size[1] || [],
        //         wlt = min[0] || null,
        //         hlt = min[1] || null,
        //         wgt = max[0] || null,
        //         hgt = max[1] || null;

        //     return {wlt: wlt, hlt: hlt, wgt: wgt, hgt: hgt};
        //   };

        //   var e = ['wlt', 'hlt', 'wgt', 'hgt'].map(function(n) {
        //     return _.e('input', {
        //       id: 'pp-search-size-custom-' + n,
        //       type: 'text',
        //       cls: '_ui-tooltip',
        //       'data-tooltip': _.lng['search_' + n]
        //     }, li);
        //   });

        //   var wlt = e[0], hlt = e[1], wgt = e[2], hgt = e[3];

        //   [[hlt, 'x'], [wgt, '-'], [hgt, 'x']].forEach(function(p) {
        //     p[0].parentNode.insertBefore(d.createTextNode(p[1]), p[0]);
        //   });

        //   var update = function() {
        //     radio.value = wlt.value + 'x' + hlt.value + '-' + wgt.value + 'x' + hgt.value;
        //   };

        //   wlt.value = query.wlt || '';
        //   hlt.value = query.hlt || '';
        //   wgt.value = query.wgt || '';
        //   hgt.value = query.hgt || '';
        //   update();

        //   _.listen([wlt, hlt, wgt, hgt], 'input', function() {
        //     update();
        //     radio.checked = true;
        //   });
        // },

        ratio: function (query, ul, li, radio, inputs) {
            var min = -1.5, max = 1.5;
            var slider = _.ui.slider(min, max, 0.01, {id: 'pp-search-ratio-custom-slider'});
            li.appendChild(slider);

            var input = _.e('input', {type: 'text', id: 'pp-search-ratio-custom-text'}, li),
                preview = _.e('div', {id: 'pp-search-ratio-custom-preview'}, li),
                pbox = _.e('div', null, preview);

            _.listen(inputs, 'change', function () {
                preview.classList[radio.checked ? 'remove' : 'add']('pp-hide');
            });

            var update = function (ratio, set) {
                if (typeof (ratio) !== 'number') {
                    return;
                }

                var width = 80, height = 80;

                // ratio = (width - height) / min(width, height)
                if (ratio > 0) {
                    // landscape
                    height = width / (ratio + 1);
                } else {
                    // portrait
                    width = height / (1 - ratio);
                }

                preview.style.marginLeft = slider.offsetLeft + 'px';

                var pos = g.Math.max(0, g.Math.min((ratio - min) / (max - min), 1)) * slider.clientWidth;
                pbox.style.width = width + 'px';
                pbox.style.height = height + 'px';
                pbox.style.marginLeft = pos - g.Math.floor(width / 2) + 'px';

                radio.value = ratio;
            };

            update(g.parseFloat(query.ratio));
            slider.set_value(input.value = query.ratio || '0');

            _.listen(slider, ['change', 'input'], function () {
                update(g.parseFloat(slider.value));
                input.value = slider.value;
                radio.checked = true;
            });

            _.listen(input, 'input', function () {
                update(g.parseFloat(input.value));
                slider.set_value(input.value);
                radio.checked = true;
            });
        }
    }
};

_.config_button = {
    init: function () {
        var found = false;

        for (var i = 0; i < this.buttons.length; ++i) {
            var btn = this.buttons[i];
            var container = _.q(btn.container);
            if (container) {
                found = true;
                this.button = btn;
                btn.func(container);
                break;
            }
        }

        if (!found) {
            this.button = this.fallback;
            this.fallback.func();
        }

        var that = this;
        if (w.location.hash === '#pp-config') {
            that.button.show();
        }
        _.listen(w, 'hashchange', function () {
            if (w.location.hash === '#pp-config') {
                that.button.show();
            }
        });
    },

    buttons: [

        {
            container: 'body>header .layout-wrapper .notifications',
            func: function (container) {
                var li = _.e('li', {id: 'pp-config-btn1-wrapper'}, container),
                    btn = _.e('a', {id: 'pp-config-btn1', cls: 'notification-button'}, li);
                _.onclick(btn, this.show.bind(this));
                _.configui.init(li, btn);
            },
            show: function () {
                _.configui.show();
                _.modal.begin(_.configui.dom.root, {
                    onclose: _.configui.hide.bind(_.configui)
                });
            }
        }

        // new
        // , {
        //   container: '._header .notification-container>ul',
        //   func: function(container) {
        //     var li  = _.e('li', {id: 'pp-config-btn2-wrapper'}, container),
        //         btn = _.e('a', {href: '#pp-config'}, li);
        //     _.e('i', {id: 'pp-config-btn2', cls: '_icon'}, btn);
        //     _.onclick(btn, this.show.bind(this));
        //     _.configui.init(li, btn);
        //   },
        //   show: function() {
        //     _.configui.show();
        //     _.modal.begin(_.configui.root, {
        //       onclose: _.configui.hide.bind(_.configui),
        //       centerize: 'horizontal'
        //     });
        //   }
        // }

    ],

    fallback: {
        func: function () {
            var wrapper = _.e('div', {id: 'pp-config-btn-fallback-wrapper'}, d.body);
            var btn = _.e('div', {id: 'pp-config-btn-fallback'}, wrapper);
            _.onclick(btn, this.show.bind(this));
            _.configui.init(wrapper, btn);
        },
        show: function () {
            _.configui.show(true);
            _.modal.begin(_.configui.dom.root, {
                onclose: _.configui.hide.bind(_.configui),
                centerize: 'both'
            });
        }
    }
};
