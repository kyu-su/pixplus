_.configui = {
  editor: {
    regexp_paths: [
      '/mypage.php',
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

    close: function() {
      if (this.wrapper) {
        this.wrapper.parentNode.removeChild(this.wrapper);
        this.wrapper = null;
      }
      if (this.current_target) {
        this.current_target.classList.remove('pp-active');
        this.current_target = null;
      }
    },

    open: function(input, type, lang) {
      var args = g.Array.prototype.slice.call(arguments, 3);

      var wrapper = _.e('div', {cls: 'pp-config-editor-wrapper'}, null);
      input.parentNode.insertBefore(wrapper, input);

      var editor = _.e('div', {cls: 'pp-dialog pp-config-editor pp-config-' + type + '-editor'}, wrapper);

      var close = function() {
        _.modal.end(editor);
      };

      var data = this[type].apply(this, [editor, input, close, lang].concat(args)) || {};

      if (data.update) {
        data.update(input.value);
      }

      if (data.input) {
        _.listen(data.input, 'input', function() {
          input.value = data.input.value;
          if (data.update) {
            data.update(input.value);
          }
        });
      }

      if (data.input || data.update) {
        _.listen(input, 'input', function() {
          if (data.input) {
            data.input.value = input.value;
          }
          if (data.update) {
            data.update(input.value);
          }
        });
      }

      _.modal.begin(editor, {
        onclose: this.close.bind(this),
        parent: _.configui.dom.root,
        members: [input]
      });

      this.wrapper = wrapper;
      input.classList.add('pp-active');
      this.current_target = input;
    },

    register: function(input) {
      var that = this, args = g.Array.prototype.slice.call(arguments);
      _.listen(input, 'focus', function(ev) {
        that.open.apply(that, args);
      });
    },

    key: function(root, input, close, lang) {
      var list = _.e('ul', null, root);

      var reset = function() {
        _.clear(list);
        if (input.value) {
          input.value.split(',').forEach(add);
        }
      };

      var add = function(key) {
        var li = _.e('li', null, list);
        _.onclick(_.e('button', {text: '\u2715'}, li), function() {
          list.removeChild(li);
          apply();
        });
        _.e('label', {text: key}, li);
      };

      var apply = function() {
        var keys = [];
        _.qa('li label', list).forEach(function(key) {
          keys.push(key.textContent);
        });
        input.value = keys.join(',');
        input.focus();

        var ev = d.createEvent('Event');
        ev.initEvent('input', true, true);
        input.dispatchEvent(ev);
      };

      reset();

      var toolbar = _.e('div', {cls: 'pp-config-key-editor-toolbar'}, root);
      var add_input = _.e('input', {'placeholder': 'Grab key', cls: 'pp-config-key-editor-grab'}, toolbar);
      _.key.listen(add_input, function(key) {
        add_input.value = key;
        return true;
      });

      var btn_add = _.e('button', {text: lang.pref.add, cls: 'pp-config-key-editor-add'}, toolbar);
      _.onclick(btn_add, function() {
        add(add_input.value);
        add_input.value = '';
        apply();
      });

      var btn_close = _.e('button', {text: lang.pref.close, cls: 'pp-config-key-editor-close'}, toolbar);
      _.onclick(btn_close, close);
    },

    regexp: function(root, input, close, lang, pagecheck) {
      var textarea = _.e('textarea', {cls: 'pp-config-regexp-editor-textarea'}, root);
      textarea.value = input.value;

      var ul = _.e('ul', null, root);
      var status = _.e('li', {cls: 'pp-config-regexp-editor-status'}, ul);

      if (pagecheck) {
        var table = _.e('table', null, root);

        this.regexp_paths.forEach(function(path) {
          var row = table.insertRow(-1);
          _.e('a', {href: path, text: path, target: '_blank'}, row.insertCell(-1));

          var cell = row.insertCell(-1);
          cell.className = 'pp-config-regexp-editor-status';
          cell.setAttribute('data-path', path);
        });
      }

      return {input: textarea, update: function(value) {
        var valid = true;
        try {
          new g.RegExp(value);
        } catch(ex) {
          valid = false;
        }

        status.classList[valid ? 'add' : 'remove']('pp-yes');
        status.classList[valid ? 'remove' : 'add']('pp-no');
        status.textContent = valid ? lang.pref.regex_valid : lang.pref.regex_invalid;

        if (pagecheck) {
          _.qa('*[data-path]', table).forEach(function(status) {
            var yes = valid && (new g.RegExp(value)).test('http://www.pixiv.net' + status.dataset.path);
            status.classList[yes ? 'add' : 'remove']('pp-yes');
            status.classList[yes ? 'remove' : 'add']('pp-no');
            status.textContent = yes ? '\u25cb' : '\u2715';
          });
        }
      }};
    }
  },

  tabs: {
    __default: function(root, section, lang) {
      var tbody = _.e('tbody', null, _.e('table', null, root)), subsection;

      section.items.forEach(function(item) {
        if (!_.conf.general.debug && item.hidden) {
          return;
        }

        if (item.subsection && item.subsection !== subsection) {
          _.e('div', {text: lang.pref[section.name + '_' + item.subsection]},
              _.e('td', {colspan: 3}, _.e('tr', {cls: 'pp-config-subsection-title'}, tbody)));
          subsection = item.subsection;
        }

        var type = typeof(item.value),
            info = lang.conf[section.name][item.key] || '[Error]',
            row  = _.e('tr', null, tbody),
            desc = _.e('td', null, row),
            input_id = 'pp-config-' + section.name + '-' + item.key.replace(/_/g, '-'),
            control, control_propname;
        if (info === '[Error]') {
          alert(item.key);
        }

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
            info.hint.forEach(function(hint, idx) {
              var ovalue = hint.value || idx;
              var opt = _.e('option', {text: hint.desc || hint, value: ovalue}, control);
            });
          } else {
            control = _.e('input', {id: input_id}, value);
          }
          control_propname = 'value';
        }

        control[control_propname] = _.conf[section.name][item.key];
        _.listen(control, ['change', 'input'], function() {
          var value = control[control_propname];
          if (typeof(item.value) === 'number') {
            value = g.parseFloat(value);
          }
          _.conf[section.name][item.key] = value;
        });

        _.onclick(
          _.e('button', {text: lang.pref['default'], id: input_id + '-default'}, row.insertCell(-1)),
          function() {
            _.conf[section.name][item.key] = item.value;
            control[control_propname] = item.value;
          }
        );
      });
    },

    popup: function(root, section, lang) {
      this.__default(root, section, lang);

      _.qa('input[id$="-regexp"]', root).forEach(function(input) {
        _.configui.editor.register(input, 'regexp', lang, true);
      });
    },

    key: function(root, section, lang) {
      this.__default(root, section, lang);

      _.qa('input', root).forEach(function(input) {
        _.configui.editor.register(input, 'key', lang);
      });
    },

    bookmark: function(root, section, lang) {
      _.e('div', {text: lang.conf.bookmark.tag_order, css: 'white-space:pre'}, root);

      var tag_order_textarea = _.e('textarea', null, root);
      tag_order_textarea.value = _.conf.bookmark.tag_order.map(function(a) {
        return a.map(function(tag) {
          return tag || '*';
        }).join('\n');
      }).join('\n-\n');

      _.listen(tag_order_textarea, 'input', function() {
        var tag_order = [[]];
        tag_order_textarea.value.split(/[\r\n]+/).forEach(function(line) {
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
      _.onclick(_.e('button', {text: lang.pref.add}, root), function() {
        add_row();
      });

      function save() {
        var aliases = { };
        g.Array.prototype.forEach.call(tag_alias_table.rows, function(row) {
          var inputs = _.qa('input', row);
          if (inputs.length === 2 && inputs[0].value) {
            aliases[inputs[0].value] = inputs[1].value.split(/\s+/);
          }
        });
        _.conf.bookmark.tag_aliases = aliases;
      }

      function add_row(tag, list) {
        var row = tag_alias_table.insertRow(-1);
        _.onclick(_.e('button', {text: '\u2715'}, row.insertCell(-1)), function() {
          row.parentNode.removeChild(row);
          save();
        });

        var i_tag = _.e('input', {value: tag || ''}, row.insertCell(-1)),
            i_atags = _.e('input', {value: list ? list.join(' ') : ''}, row.insertCell(-1));
        _.listen(i_tag, 'input', save);
        _.listen(i_atags, 'input', save);
      }

      var aliases = _.conf.bookmark.tag_aliases;
      for(var key in aliases) {
        add_row(key, aliases[key]);
      }
    },

    importexport: function(root, section, lang) {
      var toolbar  = _.e('div', {id: 'pp-config-importexport-toolbar'}, root);
      var textarea = _.e('textarea', null, root);

      _.onclick(_.e('button', {text: lang.pref['export']}, toolbar), function() {
        textarea.value = JSON.stringify(_.conf.__export(''), null, 2);
      });

      _.onclick(_.e('button', {text: lang.pref['import']}, toolbar), function() {
        var data;
        try {
          data = JSON.parse(textarea.value);
        } catch(ex) {
          g.alert(ex);
          return;
        }
        _.conf.__import(data);
      });
    },

    about: function(root, section, lang) {
      var urls = [
        'http://ccl4.info/pixplus/',
        'https://github.com/crckyl/pixplus',
        'http://ccl4.info/cgit/pixplus.git/',
        'http://crckyl.hatenablog.com/',
        'http://twitter.com/crckyl'
      ];

      _.e('p', {text: 'pixplus ' + _.version() + ' - ' + _.release_date()}, root);

      var info = _.e('dl', null, root);
      [
        [lang.pref.about_web, function(dd) {
          var ul = _.e('ul', null, dd);
          urls.forEach(function(url) {
            _.e('a', {href: url, text: url}, _.e('li', null, ul));
          });
        }],
        [lang.pref.about_email,
         _.e('a', {text: 'crckyl@gmail.com', href: 'mailto:crckyl@gmail.com'})],
        [lang.pref.about_license, 'The MIT License']
      ].forEach(function(p) {
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
      _.changelog.forEach(function(release) {
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
        changes.forEach(function(change) {
          _.e('li', {text: change}, ul);
        });
      });
    },

    debug: function(root, section, lang) {
      var langbar = _.e('div', {id: 'pp-config-langbar'}, root);
      ['en', 'ja'].forEach(function(name) {
        _.onclick(_.e('button', {text: name}, langbar), function() {
          _.configui.lng = _.i18n[name];
          _.configui.dom.root.parentNode.removeChild(_.configui.dom.root);
          _.configui.dom = { };
          _.configui.show();
        });
      });

      var escaper = _.e('div', {id: 'pp-config-escaper'}, root), escaper_e;
      _.listen(_.e('input', null, escaper), 'input', function(ev) {
        escaper_e.value = ev.target.value.split('').map(function(c) {
          var b = c.charCodeAt(0);

          if (b >= 0x20 && b <= 0x7e) {
            return c;
          }

          c = b.toString(16);
          while(c.length < 4) {
            c = '0' + c;
          }
          return '\\u' + c;
        }).join('');
      });
      escaper_e = _.e('input', null, escaper);

      var input_line = _.e('div', null, root);
      var input      = _.e('input', null, input_line);
      var cancel_l   = _.e('label', null, input_line);
      var cancel     = _.e('input', {type: 'checkbox', css: 'margin-left:4px;', checked: true}, cancel_l);
      var console_l  = _.e('label', null, input_line);
      var console    = _.e('input', {type: 'checkbox', css: 'margin-left:4px;', checked: true}, console_l);
      var logger     = _.e('table', {css: 'margin-top:4px;border:1px solid #aaa'}, root);

      cancel_l.appendChild(d.createTextNode('Cancel'));
      console_l.appendChild(d.createTextNode('Console'));

      var log_attrs  = [
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
        log_attrs.forEach(function(attr) {
          row.insertCell(-1).textContent = attr;
        });
      }

      function log(ev) {
        var row = logger.insertRow(1);
        var key = _.key.parse_event(ev) || 'None';
        row.insertCell(-1).textContent = key;
        log_attrs.forEach(function(attr) {
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
  },

  dom: { },
  lng: null,
  container: null,
  toggle_btn: null,

  init: function(container, toggle_btn) {
    if (!container) {
      return;
    }

    this.lng = _.lng;
    this.container = container;
    this.toggle_btn = toggle_btn;
  },

  create_tab: function(name, create_args) {
    if (name === 'mypage') {
      return;
    }

    var that = this, dom = this.dom, label, content;

    label = _.e('label', {text: this.lng.pref[name], cls: 'pp-config-tab',
                          id: 'pp-config-tab-' + name}, dom.tabbar);
    content = _.e('div', {id: 'pp-config-' + name + '-content', cls: 'pp-config-content'});

    (this.tabs[name] || this.tabs.__default).call(this.tabs, content, create_args, this.lng);
    dom.content.appendChild(content);
    dom[name] = {label: label, content: content};
    _.onclick(label, function() {
      that.activate_tab(dom[name]);
      return true;
    });
  },

  create: function() {
    var that = this, dom = this.dom;
    if (dom.created) {
      return;
    }

    dom.root    = _.e('div', {id: 'pp-config'}, this.container);
    dom.tabbar  = _.e('div', {id: 'pp-config-tabbar'});
    dom.content = _.e('div', {id: 'pp-config-content-wrapper'});

    _.conf.__schema.forEach(function(section) {
      that.create_tab(section.name, section);
    });
    ['importexport', 'about'].forEach(this.create_tab.bind(this));
    if (_.conf.general.debug) {
      that.create_tab('debug');
    }

    dom.root.appendChild(dom.tabbar);
    dom.root.appendChild(dom.content);

    dom.created = true;

    this.activate_tab(dom.general);
  },

  activate_tab: function(tab) {
    var lasttab = this.dom.lasttab;
    if (lasttab) {
      lasttab.label.classList.remove('pp-active');
      lasttab.content.classList.remove('pp-active');
    }
    tab.label.classList.add('pp-active');
    tab.content.classList.add('pp-active');
    this.dom.lasttab = tab;
  },

  is_active: function() {
    return !!this.dom.root && this.dom.root.classList.contains('pp-show');
  },

  show: function() {
    this.create();
    this.dom.root.classList.add('pp-show');
    if (this.toggle_btn) {
      this.toggle_btn.classList.add('pp-active');

      var el = this.dom.content, de = d.documentElement;
      el.style.height = g.Math.floor((de.clientHeight - el.getBoundingClientRect().top) * 0.7) + 'px';
    }
  },

  hide: function() {
    this.dom.root.classList.remove('pp-show');
    if (this.toggle_btn) {
      this.toggle_btn.classList.remove('pp-active');
    }
  },

  toggle: function() {
    if (this.is_active()) {
      this.hide();
    } else {
      this.show();
    }
  }
};
