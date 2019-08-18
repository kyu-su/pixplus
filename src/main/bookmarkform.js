_.bookmarkform = {
    dom: {},

    calc_tag_rect: function (group, rect, grect) {
        if (!grect) {
            grect = group.getBoundingClientRect();
        }
        return {
            top: rect.top - grect.top + group.scrollTop,
            bottom: rect.bottom - grect.top + group.scrollTop,
            left: rect.left - grect.left + group.scrollLeft,
            right: rect.right - grect.left + group.scrollLeft
        };
    },

    select_tag: function (gidx, idx, rect) {
        if (this.sel.tag) {
            this.sel.tag.classList.remove('pp-tag-select');
        }

        if (gidx >= 0) {
            var group = this.dom.tag_groups[gidx][0];

            this.sel.gidx = gidx;
            this.sel.idx = idx;
            this.sel.tag = this.dom.tag_groups[gidx][1][idx];
            this.sel.rect = rect;

            if (!rect) {
                this.sel.rect = this.calc_tag_rect(group, this.sel.tag.getClientRects()[0]);
            }

            this.sel.tag.classList.add('pp-tag-select');
            _.lazy_scroll(this.sel.tag);

        } else {
            this.sel.tag = null;
            this.sel.rect = null;
        }
    },

    autoinput_tag: function () {
        if (!this.dom.input_tag) {
            return;
        }

        var illust_tags = _.qa('.work-tags-container .tag[data-tag]', this.dom.root).map(function (tag) {
            return tag.dataset.tag;
        });

        var tags_value = [];

        var aliases = _.conf.bookmark.tag_aliases;
        _.qa('.tag-container.tag-cloud-container .tag[data-tag]').forEach(function (tage) {
            var tag = tage.dataset.tag, pattern;

            pattern = new g.RegExp([tag].concat(aliases[tag] || []).map(_.escape_regex).join('|'));

            for (var i = 0; i < illust_tags.length; ++i) {
                if (pattern.test(illust_tags[i])) {
                    tags_value.push(tag);
                    break;
                }
            }
        });

        this.dom.input_tag.value = tags_value.join(' ');
        this.update();
    },

    setup_tag_order: function () {
        var mytags = _.q('.tag-container.tag-cloud-container .list-items', this.dom.root);
        if (!mytags || _.conf.bookmark.tag_order.length < 1) {
            return;
        }

        _.reorder_tag_list(mytags, function (tag) {
            return tag.querySelector('.tag').dataset.tag;
        });

        var opt = _.q('.list-option.tag-order', this.dom.root);
        if (opt) {
            opt.parentNode.removeChild(opt);
        }
    },

    select_nearest_tag: function (key) {
        var that = this;

        var dom = this.dom,
            sel = this.sel;

        var gidx = sel.gidx, idx = sel.idx;
        if (key === 'Right') {
            if (idx >= dom.tag_groups[sel.gidx][1].length - 1) {
                if (gidx >= dom.tag_groups.length - 1) {
                    gidx = 0;
                } else {
                    ++gidx;
                }
                idx = 0;
            } else {
                ++idx;
            }
            this.select_tag(gidx, idx);
            return true;
        } else if (key === 'Left') {
            if (idx <= 0) {
                if (gidx <= 0) {
                    gidx = dom.tag_groups.length - 1;
                } else {
                    --gidx;
                }
                idx = dom.tag_groups[gidx][1].length - 1;
            } else {
                --idx;
            }
            this.select_tag(gidx, idx);
            return true;
        }

        var down = key === 'Down';
        if (!down && key !== 'Up') {
            return false;
        }

        var x = (sel.rect.left + sel.rect.right) / 2,
            t_top = {}, t_near = {}, t_bottom = {};

        var set = function (d, gidx, idx, rect, distance) {
            d.set = true;
            d.gidx = gidx;
            d.idx = idx;
            d.rect = rect;
            d.distance = distance;
        };

        dom.tag_groups.forEach(function (p, gidx) {
            var group = p[0], tags = p[1], grect;
            grect = group.getBoundingClientRect();

            tags.forEach(function (tag, idx) {
                if (tag === sel.tag) {
                    return;
                }

                g.Array.prototype.map.call(tag.getClientRects(), function (r) {
                    var rect, distance;
                    rect = that.calc_tag_rect(group, r, grect);
                    distance = g.Math.max(rect.left - x, x - rect.right);

                    if (!t_top.set || gidx < t_top.gidx ||
                        (gidx === t_top.gidx &&
                            (rect.bottom < t_top.rect.top ||
                                (rect.top < t_top.rect.bottom && distance < t_top.distance)))) {
                        set(t_top, gidx, idx, rect, distance);
                    }

                    if (!t_bottom.set || gidx > t_bottom.gidx ||
                        (gidx === t_bottom.gidx &&
                            (rect.top > t_bottom.rect.bottom ||
                                (rect.bottom > t_bottom.rect.top && distance < t_bottom.distance)))) {
                        set(t_bottom, gidx, idx, rect, distance);
                    }

                    if (down) {
                        if ((gidx > sel.gidx || (gidx === sel.gidx && rect.top > sel.rect.bottom)) &&
                            (!t_near.set || gidx < t_near.gidx ||
                                (gidx === t_near.gidx &&
                                    (rect.bottom < t_near.rect.top ||
                                        (rect.top < t_near.rect.bottom && distance < t_near.distance))))) {
                            set(t_near, gidx, idx, rect, distance);
                        }
                    } else {
                        if ((gidx < sel.gidx || (gidx === sel.gidx && rect.bottom < sel.rect.top)) &&
                            (!t_near.set || gidx > t_near.gidx ||
                                (gidx === t_near.gidx &&
                                    (rect.top > t_near.rect.bottom ||
                                        (rect.bottom > t_near.rect.top && distance < t_near.distance))))) {
                            set(t_near, gidx, idx, rect, distance);
                        }
                    }
                });
            });
        });

        if (!t_near.set) {
            t_near = down ? t_top : t_bottom;
        }
        that.select_tag(t_near.gidx, t_near.idx, t_near.rect);
        return true;
    },

    onkey: function (key, ev) {
        if (!this.sel.tag) {
            if (key === 'Down') {
                this.select_tag(this.dom.tag_groups.length - 1, 0);
                return true;
            } else if (key === 'Escape') {
                this.dom.input_tag.blur();
                return true;
            }
            return false;
        }

        if (key === 'Space') {
            this.toggle(this.sel.tag.dataset.tag);
            return true;

        } else if (key === 'Escape') {
            this.select_tag(-1);
            return true;
        }

        return this.select_nearest_tag(key);
    },

    toggle: function (tag) {
        var tags = this.dom.input_tag.value.split(/\s+/).filter(function (a) {
            return !!a;
        });
        if (tags.indexOf(tag) >= 0) {
            tags = tags.filter(function (t) {
                return t !== tag;
            });
        } else {
            tags.push(tag);
        }
        this.dom.input_tag.value = tags.join(' ');
        this.update();
    },

    update: function () {
        var tags = this.dom.input_tag.value.split(/\s+/);
        _.qa('.tag[data-tag]', this.dom.root).forEach(function (tag) {
            var on = tags.indexOf(tag.dataset.tag) >= 0;
            tag.classList[on ? 'add' : 'remove']('on');
            tag.classList[on ? 'add' : 'remove']('selected');
        });
    },

    setup_key: function () {
        var dom = this.dom;

        dom.tags = [];
        dom.tag_groups = [];
        dom.input_tag = _.q('input#input_tag', dom.root);

        _.qa('.tag-container', dom.root).forEach(function (g) {
            var tags = _.qa('.tag[data-tag]', g);
            if (tags.length) {
                dom.tags = dom.tags.concat(tags);
                dom.tag_groups.push([g, tags]);
            }
        });

        _.key.listen(dom.input_tag, this.onkey.bind(this));
        dom.input_tag.setAttribute('autocomplete', 'off');

        _.listen(dom.input_tag, 'input', this.update.bind(this), {capture: true});
    },

    setup_alias_ui: function () {
        var that = this;

        var root = this.dom.root;
        var first_tag_list = _.q('.work-tags-container', root);
        if (!first_tag_list) {
            return;
        }

        var starter = _.e('button', {
            text: _.lng.associate_tags,
            cls: 'pp-tag-association-toggle btn_type03',
            css: 'float:right'
        });
        first_tag_list.insertBefore(starter, first_tag_list.firstChild);

        var associate = function (tag1, tag2) {
            _.send_click(tag2);

            tag1 = tag1.dataset.tag;
            tag2 = tag2.dataset.tag;

            _.log('tag alias: ' + tag1 + ' => ' + tag2);

            var aliases = _.conf.bookmark.tag_aliases;
            if (!aliases[tag2]) {
                aliases[tag2] = [];
            }
            aliases[tag2].push(tag1);
            _.conf.bookmark.tag_aliases = aliases;
        };

        var tag1, tag2;

        var select = function (tag, button) {
            var first = that.dom.tag_groups[0][1].indexOf(tag) >= 0;

            if (first) {
                if (tag1) {
                    tag1[1].classList.remove('pp-active');
                }
                tag1 = [tag, button];
                if (tag2) {
                    associate(tag1[0], tag2[0]);
                    end();
                } else {
                    tag1[1].classList.add('pp-active');
                }

            } else {
                if (tag2) {
                    tag2[1].classList.remove('pp-active');
                }
                tag2 = [tag, button];
                if (tag1) {
                    associate(tag1[0], tag2[0]);
                    end();
                } else {
                    tag2[1].classList.add('pp-active');
                }
            }
        };

        this.dom.tag_groups.forEach(function (grp) {
            grp[1].forEach(function (tag) {
                var tag_t = tag.dataset.tag,
                    button = _.e('button', {
                        cls: 'pp-tag-associate-button',
                        text: tag_t, 'data-pp-tag': tag_t
                    });
                tag.parentNode.insertBefore(button, tag.nextSibling);
                _.onclick(button, function () {
                    select(tag, button);
                    return true;
                });
            });
        });

        var start = function () {
            starter.textContent = _.lng.cancel;
            root.classList.add('pp-associate-tag');
            tag1 = tag2 = null;
        };

        var end = function () {
            starter.textContent = _.lng.associate_tags;
            root.classList.remove('pp-associate-tag');
        };

        _.onclick(starter, function () {
            if (root.classList.contains('pp-associate-tag')) {
                end();
            } else {
                start();
            }
            return true;
        });
    },

    adjust: function (width, height) {
        if (!this.dom.root) {
            return;
        }

        var min = 80;

        _.debug('Max height: ' + height);

        var lists = _.qa('.tag-container', this.dom.root), last;
        lists = g.Array.prototype.filter.call(lists, function (l) {
            if (l.scrollHeight > min) {
                return true;
            }
            l.style.maxHeight = 'none';
            return false;
        });

        if (lists.length <= 0) {
            return;
        }

        height -= lists.reduce(function (h, l) {
            return h - l.offsetHeight;
        }, this.dom.root.offsetHeight);

        if (height < min * lists.length) {
            height = min * lists.length;
        }

        _.debug('Lists height: ' + height);

        last = lists.pop();
        if (height - last.scrollHeight < min * lists.length) {
            last.style.maxHeight = (height - (min * lists.length)) + 'px';
            _.debug('Adjust last tag list: ' + last.style.maxHeight);
        } else {
            last.style.maxHeight = 'none';
        }
        height -= last.offsetHeight;

        height = g.Math.floor(height / lists.length);
        lists.forEach(function (l) {
            l.style.maxHeight = height + 'px';
            _.log('Adjust leading tag list: ' + l.style.maxHeight);
        });
    },

    submit: function () {
        this.options.submit();

        var that = this;
        _.xhr.post(this.dom.form, function () {
            that.options.success();
        }, function () {
            that.options.error();
        });

        _.qa('input[type="submit"]', this.dom.form).forEach(function (btn) {
            btn.value = _.lng.sending;
            btn.setAttribute('disabled', '');
        });
        return true;
    },

    setup: function (root, options) {
        if (!root) {
            return;
        }

        var form = _.q('form[action^="bookmark_add.php"]', root);
        if (!form) {
            _.error('bookmark: form not found');
            return;
        }

        this.dom.root = root;
        this.dom.form = form;

        this.options = options;

        this.sel = {
            tag: null,
            rect: null
        };

        if (_.conf.general.bookmark_hide) {
            var hide_radio = _.q('.privacy input[name="restrict"][value="1"]', form);
            if (hide_radio) {
                hide_radio.checked = true;
            }
        }

        this.setup_tag_order(root);
        this.setup_key(root);
        this.setup_alias_ui(root);

        if (options.autoinput) {
            this.autoinput_tag();
        }

        form.setAttribute('action', '/bookmark_add.php');
        _.listen(form, 'submit', this.submit.bind(this));
    }
};
