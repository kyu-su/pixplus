_.configui = {
    editor: {
        open: function (input, type, lang, opts) {
            (new this[type](input, lang, opts)).open(_.configui.dom.root, {members: [input], top_left_of: input});
        },

        register: function (input, type, lang, opts) {
            var that = this;
            _.listen(input, 'focus', function (ev) {
                that.open.call(that, input, type, lang, opts);
            });
        }
    },

    tabs: {
        __default: function (root, section, lang) {
            var tbody = _.e('tbody', null, _.e('table', null, root)), subsection;

            section.items.forEach(function (item) {
                if (!_.conf.general.debug && item.hide) {
                    return;
                }

                if (item.subsection && item.subsection !== subsection) {
                    _.e('div', {text: lang.pref[section.name + '_' + item.subsection] || item.subsection},
                        _.e('td', {colspan: 3}, _.e('tr', {cls: 'pp-config-subsection-title'}, tbody)));
                    subsection = item.subsection;
                }

                var type = typeof (item.value),
                    info = (lang.conf[section.name] || {})[item.key] || item.label || item.key,
                    row = _.e('tr', null, tbody),
                    desc = _.e('td', null, row),
                    input_id = 'pp-config-' + section.name + '-' + item.key.replace(/_/g, '-'),
                    control, control_propname;

                if (type === 'boolean') {
                    var label = _.e('label', null, desc);
                    control = _.e('input', {type: 'checkbox', id: input_id}, label);
                    control_propname = 'checked';
                    label.appendChild(d.createTextNode(info.desc || info));
                    desc.setAttribute('colspan', '2');
                } else {
                    var value = _.e('td', null, row);
                    desc.textContent = info.desc || info;
                    if (info.hint) {
                        control = _.e('select', {id: input_id}, value);
                        info.hint.forEach(function (hint, idx) {
                            var ovalue = hint.value || idx;
                            var opt = _.e('option', {text: hint.desc || hint, value: ovalue}, control);
                        });
                    } else {
                        control = _.e('input', {id: input_id}, value);
                    }
                    control_propname = 'value';
                }

                control[control_propname] = _.conf[section.name][item.key];
                _.listen(control, ['change', 'input'], function () {
                    var value = control[control_propname];
                    if (typeof (item.value) === 'number') {
                        value = g.parseFloat(value);
                    }
                    _.conf[section.name][item.key] = value;
                });

                _.onclick(
                    _.e('button', {text: lang.pref['default'], id: input_id + '-default'}, row.insertCell(-1)),
                    function () {
                        _.conf[section.name][item.key] = item.value;
                        control[control_propname] = item.value;
                    }
                );

                var editor = item.editor || section.editor;
                if (editor) {
                    _.configui.editor.register(control, editor, lang, item.editor_opts);
                }
            });
        },

        bookmark: function (root, section, lang) {
            _.e('div', {text: lang.conf.bookmark.tag_order, css: 'white-space:pre'}, root);

            var tag_order_textarea = _.e('textarea', null, root);
            tag_order_textarea.value = _.conf.bookmark.tag_order.map(function (a) {
                return a.map(function (tag) {
                    return tag || '*';
                }).join('\n');
            }).join('\n-\n');

            _.listen(tag_order_textarea, 'input', function () {
                var tag_order = [[]];
                tag_order_textarea.value.split(/[\r\n]+/).forEach(function (line) {
                    if (!line) {
                        return;
                    }
                    if (line === '-') {
                        tag_order.push([]);
                    } else {
                        tag_order[tag_order.length - 1].push(line === '*' ? null : line);
                    }
                });
                _.conf.bookmark.tag_order = tag_order;
            });


            _.e('div', {text: lang.conf.bookmark.tag_aliases}, root);

            var tag_alias_table = _.e('table', {id: 'pp-config-bookmark-tag-aliases'}, root);
            _.onclick(_.e('button', {text: lang.pref.add}, root), function () {
                add_row();
            });

            function save() {
                var aliases = {};
                g.Array.prototype.forEach.call(tag_alias_table.rows, function (row) {
                    var inputs = _.qa('input', row);
                    if (inputs.length === 2 && inputs[0].value) {
                        aliases[inputs[0].value] = inputs[1].value.split(/\s+/);
                    }
                });
                _.conf.bookmark.tag_aliases = aliases;
            }

            function add_row(tag, list) {
                var row = tag_alias_table.insertRow(-1);
                _.onclick(_.e('button', {text: '\u2715'}, row.insertCell(-1)), function () {
                    row.parentNode.removeChild(row);
                    save();
                });

                var i_tag = _.e('input', {value: tag || ''}, row.insertCell(-1)),
                    i_atags = _.e('input', {value: list ? list.join(' ') : ''}, row.insertCell(-1));
                _.listen(i_tag, 'input', save);
                _.listen(i_atags, 'input', save);
            }

            var aliases = _.conf.bookmark.tag_aliases;
            for (var key in aliases) {
                add_row(key, aliases[key]);
            }
        },

        importexport: function (root, section, lang) {
            var toolbar = _.e('div', {id: 'pp-config-importexport-toolbar'}, root);
            var textarea = _.e('textarea', null, root);

            _.onclick(_.e('button', {text: lang.pref['export']}, toolbar), function () {
                textarea.value = JSON.stringify(_.conf.__export(''), null, 2);
            });

            _.onclick(_.e('button', {text: lang.pref['import']}, toolbar), function () {
                var data;
                try {
                    data = JSON.parse(textarea.value);
                } catch (ex) {
                    g.alert(ex);
                    return;
                }
                _.conf.__import(data);
            });
        },

        about: function (root, section, lang) {
            var urls = [
                'https://github.com/kyu-su/pixplusPlus',
            ];

            _.e('p', {text: 'pixplusPlus ' + _.version() + ' - ' + _.release_date()}, root);

            var info = _.e('dl', null, root);
            [
                [lang.pref.about_web, function (dd) {
                    var ul = _.e('ul', null, dd);
                    urls.forEach(function (url) {
                        _.e('a', {href: url, text: url}, _.e('li', null, ul));
                    });
                }],
                [lang.pref.about_email,
                    _.e('a', {text: 'crckyl@gmail.com', href: 'mailto:crckyl@gmail.com'})],
                [lang.pref.about_license, 'The MIT License']
            ].forEach(function (p) {
                var label = p[0], content = p[1];
                _.e('dt', {text: label}, info);
                var dd = _.e('dd', null, info);
                if (content.nodeName) {
                    dd.appendChild(content);
                } else if (content.call) {
                    content(dd);
                } else {
                    dd.textContent = content;
                }
            });

            var changelog = _.e('dl', null, root);
            _.changelog.forEach(function (release) {
                var dt = _.e('dt', {text: release.version + ' - ' + release.date}, changelog);
                if (release.releasenote) {
                    dt.textContent += ' ';
                    _.e('a', {href: release.releasenote, text: lang.pref.releasenote}, dt);
                }

                var ul = _.e('ul', null, _.e('dd', null, changelog));

                var changes;
                if (release.changes_i18n) {
                    changes = release.changes_i18n[lang.__name__] || release.changes_i18n.en;
                } else {
                    changes = release.changes;
                }
                changes.forEach(function (change) {
                    _.e('li', {text: change}, ul);
                });
            });
        },

        debug: function (root, sections, lang) {
            var that = this;
            var make_section = function (name, label) {
                var wrapper = _.e('div', {id: 'pp-config-debug-' + name, cls: 'pp-config-debug-section'}, root),
                    title = _.e('div', {cls: 'pp-config-subsection-title'}, wrapper);
                _.e('div', {text: label}, title);
                return _.e('div', {cls: 'pp-config-debug-section-content'}, wrapper);
            };

            sections.forEach(function (section) {
                that.__default(make_section(section.name, section.name), section, lang);
            });

            [
                {
                    name: 'lang',
                    label: 'Switch UI language',
                    func: function (content) {
                        ['en', 'ja'].forEach(function (name) {
                            _.onclick(_.e('button', {text: name}, content), function () {
                                _.configui.lng = _.i18n[name];
                                _.configui.dom.root.parentNode.removeChild(_.configui.dom.root);
                                _.configui.dom = {};
                                _.configui.show();
                            });
                        });
                    }
                },

                {
                    name: 'key',
                    label: 'Key',
                    func: function (content) {
                        var input_line = _.e('div', null, content);
                        var input = _.e('input', null, input_line);
                        var cancel_l = _.e('label', null, input_line);
                        var cancel = _.e('input', {type: 'checkbox', css: 'margin-left:4px;', checked: true}, cancel_l);
                        var console_l = _.e('label', null, input_line);
                        var console = _.e('input', {
                            type: 'checkbox',
                            css: 'margin-left:4px;',
                            checked: true
                        }, console_l);
                        var logger = _.e('table', {css: 'margin-top:4px;border:1px solid #aaa'}, content);

                        cancel_l.appendChild(d.createTextNode('Cancel'));
                        console_l.appendChild(d.createTextNode('Console'));

                        var log_attrs = [
                            'type',
                            'keyCode',
                            'charCode',
                            'key',
                            'char',
                            'keyIdentifier',
                            'which',
                            'eventPhase',
                            'detail',
                            'timeStamp'
                        ];

                        function clear() {
                            input.value = '';
                            logger.innerHTML = '';
                            var row = logger.insertRow(0);
                            row.insertCell(-1).textContent = 'Key';
                            log_attrs.forEach(function (attr) {
                                row.insertCell(-1).textContent = attr;
                            });
                        }

                        function log(ev) {
                            var row = logger.insertRow(1);
                            var key = _.key.parse_event(ev) || 'None';
                            row.insertCell(-1).textContent = key;
                            log_attrs.forEach(function (attr) {
                                row.insertCell(-1).textContent = ev[attr];
                            });
                            if (cancel.checked && key) {
                                ev.preventDefault();
                            }
                            if (console.checked) {
                                _.debug(ev);
                            }
                        }

                        clear();
                        _.onclick(_.e('button', {text: 'Clear', css: 'margin-left:4px;'}, input_line), clear);
                        input.addEventListener('keydown', log, false);
                        input.addEventListener('keypress', log, false);
                    }
                }
            ].forEach(function (section) {
                section.func(make_section(section.name, section.label));
            });
        }
    },

    dom: {},
    lng: null,
    container: null,
    toggle_btn: null,

    init: function (container, toggle_btn) {
        if (!container) {
            return;
        }

        this.lng = _.lng;
        this.container = container;
        this.toggle_btn = toggle_btn;
    },

    create_tab: function (name, create_args) {
        var that = this, dom = this.dom, label, content;

        label = _.e('label', {
            text: this.lng.pref[name] || name, cls: 'pp-config-tab',
            id: 'pp-config-tab-' + name
        }, dom.tabbar);
        content = _.e('div', {id: 'pp-config-' + name + '-content', cls: 'pp-config-content'});

        (this.tabs[name] || this.tabs.__default).call(this.tabs, content, create_args, this.lng);
        dom.content.appendChild(content);
        dom[name] = {label: label, content: content};
        _.onclick(label, function () {
            that.activate_tab(dom[name]);
            return true;
        });
    },

    create: function () {
        var that = this, dom = this.dom;
        if (dom.created) {
            return;
        }

        dom.root = _.e('div', {id: 'pp-config', cls: 'pp-toplevel'}, this.container);
        dom.tabbar = _.e('div', {id: 'pp-config-tabbar'});
        dom.content = _.e('div', {id: 'pp-config-content-wrapper'});

        var hidden_sections = [];
        _.conf.__schema.forEach(function (section) {
            if (section.hide) {
                hidden_sections.push(section);
                return;
            }
            that.create_tab(section.name, section);
        });
        ['importexport', 'about'].forEach(this.create_tab.bind(this));
        if (_.conf.general.debug) {
            that.create_tab('debug', hidden_sections);
        }

        dom.root.appendChild(dom.tabbar);
        dom.root.appendChild(dom.content);

        dom.created = true;

        this.activate_tab(dom.general);
    },

    activate_tab: function (tab) {
        var lasttab = this.dom.lasttab;
        if (lasttab) {
            lasttab.label.classList.remove('pp-active');
            lasttab.content.classList.remove('pp-active');
        }
        tab.label.classList.add('pp-active');
        tab.content.classList.add('pp-active');
        this.dom.lasttab = tab;
    },

    is_active: function () {
        return !!this.dom.root && this.dom.root.classList.contains('pp-show');
    },

    show: function (center) {
        this.create();
        this.dom.root.classList.add('pp-show');
        if (this.toggle_btn) {
            this.toggle_btn.classList.add('pp-active');

            var el = this.dom.content, de = d.documentElement, h;
            h = de.clientHeight - (center ? 0 : el.getBoundingClientRect().top);
            el.style.height = Math.floor(h * 0.7) + 'px';
        }
    },

    hide: function () {
        this.dom.root.classList.remove('pp-show');
        if (this.toggle_btn) {
            this.toggle_btn.classList.remove('pp-active');
        }
    },

    toggle: function () {
        if (this.is_active()) {
            this.hide();
        } else {
            this.show();
        }
    }
};

(function () {
    var Base = _.class.create(_.Dialog.prototype, {
        init: function (src_input, lang, type) {
            Base.super.init.call(this, {cls: 'pp-config-editor pp-config-' + type + '-editor'});
            this.src_input = src_input;
            this.lang = lang;
            this.setup();
            this.update(src_input.value);
        },

        open: function () {
            this.src_input.classList.add('pp-active');
            Base.super.open.apply(this, arguments);
        },

        close: function () {
            this.src_input.classList.remove('pp-active');
            Base.super.close.apply(this, arguments);
        },

        update: function (value) {
        },

        change: function (value) {
            this.src_input.value = value;

            var ev = d.createEvent('Event');
            ev.initEvent('input', true, true);
            this.src_input.dispatchEvent(ev);
        }
    });

    var Key = _.class.create(Base.prototype, {
        init: function (src_input, lang) {
            Key.super.init.call(this, src_input, lang, 'key');
        },

        setup: function () {
            var that = this, dom = this.dom;

            dom.list = _.e('ul', null, dom.content);

            dom.add_input = _.e('input', {'placeholder': 'Grab key', cls: 'pp-config-key-editor-grab'}, dom.content);
            _.key.listen(dom.add_input, function (key) {
                dom.add_input.value = key;
                return true;
            });

            this.add_action('add', {
                callback: function () {
                    that.add(dom.add_input.value);
                    dom.add_input.value = '';
                    that.apply();
                }
            });

            this.add_action('close');
        },

        update: function (value) {
            _.clear(this.dom.list);
            value.split(',').forEach(this.add.bind(this));
        },

        add: function (key) {
            var that = this;
            var li = _.e('li', null, this.dom.list);
            _.onclick(_.e('button', {text: '\u2715'}, li), function () {
                li.parentNode.removeChild(li);
                that.apply();
            });
            _.e('label', {text: key}, li);
        },

        apply: function () {
            var keys = [];
            _.qa('li label', this.dom.list).forEach(function (key) {
                keys.push(key.textContent);
            });
            this.change(keys.join(','));
        }
    });

    var Regexp = _.class.create(Base.prototype, {
        paths: [
            '/',
            '/new_illust.php',
            '/bookmark_new_illust.php',
            '/mypixiv_new_illust.php',
            '/ranking.php?mode=daily',
            '/ranking_area.php',
            '/stacc/p/activity',
            '/stacc/p/activity?mode=unify',
            '/user_event.php',
            '/bookmark.php',
            '/bookmark.php?rest=hide',
            '/bookmark.php?id=11',
            '/member.php?id=11',
            '/member_illust.php',
            '/member_illust.php?id=11',
            '/member_illust.php?mode=medium&illust_id=11437736',
            '/response.php?illust_id=11437736',
            '/tags.php?tag=pixiv',
            '/search.php?s_mode=s_tag&word=pixiv',
            '/cate_r18.php',
            '/new_illust_r18.php',
            '/user_event.php?type=r18',
            '/questionnaire_illust.php',
            '/search_user.php'
        ],

        init: function (src_input, lang) {
            Regexp.super.init.call(this, src_input, lang, 'regexp');
        },

        setup: function () {
            var that = this, dom = this.dom;

            dom.textarea = _.e('textarea', {cls: 'pp-config-regexp-editor-textarea'}, dom.content);
            _.listen(dom.textarea, 'input', function () {
                that.change(dom.textarea.value);
                that.check(dom.textarea.value);
            });

            dom.list = _.e('ul', null, dom.content);
            dom.status = _.e('li', {cls: 'pp-config-regexp-editor-status'}, dom.list);

            dom.pagecheck_table = _.e('table', null, dom.content);

            this.paths.forEach(function (path) {
                var row = dom.pagecheck_table.insertRow(-1);
                _.e('a', {href: path, text: path, target: '_blank'}, row.insertCell(-1));

                var cell = row.insertCell(-1);
                cell.className = 'pp-config-regexp-editor-status';
                cell.setAttribute('data-path', path);
            });
        },

        update: function (value) {
            this.dom.textarea.value = value;
            this.check(value);
        },

        check: function (value) {
            var valid = true;
            try {
                new g.RegExp(value);
            } catch (ex) {
                valid = false;
            }

            var dom = this.dom;
            dom.status.classList[valid ? 'add' : 'remove']('pp-yes');
            dom.status.classList[valid ? 'remove' : 'add']('pp-no');
            dom.status.textContent = valid ? this.lang.pref.regex_valid : this.lang.pref.regex_invalid;

            _.qa('*[data-path]', dom.pagecheck_table).forEach(function (status) {
                var yes = valid && (new g.RegExp(value)).test('https://www.pixiv.net' + status.dataset.path);
                status.classList[yes ? 'add' : 'remove']('pp-yes');
                status.classList[yes ? 'remove' : 'add']('pp-no');
                status.textContent = yes ? '\u25cb' : '\u2715';
            });
        }
    });

    var Checklist = _.class.create(Base.prototype, {
        init: function (src_input, lang, opts) {
            this.valid_values = opts.valid_values;
            Checklist.super.init.call(this, src_input, lang, 'checklist');
        },

        setup: function () {
            var that = this, dom = this.dom;

            this.checkboxes = [];
            dom.list = _.e('ul', null, dom.content);
            this.valid_values.forEach(function (url) {
                var li = _.e('li', null, dom.list),
                    label = _.e('label', null, li),
                    check = _.e('input', {type: 'checkbox'}, label),
                    text = _.e('span', {text: url}, label);
                _.listen(check, 'change', that.apply.bind(that));
                that.checkboxes.push({
                    url: url,
                    checkbox: check
                });
            });
        },

        update: function (value) {
            var urls = value.split(',');
            this.checkboxes.forEach(function (item) {
                item.checkbox.checked = urls.indexOf(item.url) >= 0;
            });
        },

        apply: function () {
            var active_values = this.checkboxes.filter(function (item) {
                return item.checkbox.checked;
            }).map(function (item) {
                return item.url;
            });

            this.change(this.valid_values.filter(function (url) {
                return active_values.indexOf(url) >= 0;
            }).join(','));
        }
    });

    _.configui.editor.Base = Base;
    _.configui.editor.Key = Key;
    _.configui.editor.Regexp = Regexp;
    _.configui.editor.Checklist = Checklist;
})();
