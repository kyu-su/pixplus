// ==UserScript==
// @name        pixplus.js
// @author      wowo
// @version     1.2.0
// @license     Apache License 2.0
// @description pixivをほげる。
// @namespace   http://my.opera.com/crckyl/
// @include     http://www.pixiv.net/*
// @exclude     *pixivreader*
// ==/UserScript==

(function(g, w, unsafeWindow, entrypoint) {
  if (w.location.href.indexOf('pixivreader') >= 0) {
    return;
  }

  var greasemonkey =
         true;

  var inject = function(data) {
    var s = w.document.createElement('script');
    s.setAttribute('type', 'text/javascript');
    s.textContent
      = ('(' + entrypoint.toString() + ')'
         + '(this,this.window,this.window.document,'
         + g.JSON.stringify(data) + ')');
    w.document.body.appendChild(s);
  };

  if (g.opera || unsafeWindow) {
    if (g.opera && g.opera.extension) {
      var open_options = function() {
        g.opera.extension.postMessage(g.JSON.stringify({command: 'open-options'}));
      };
      g.opera.extension.onmessage = function(ev){
        var data = g.JSON.parse(ev.data);
        if (data.command === 'config') {
          entrypoint(g, w, w.document, {conf: data.data, open_options: open_options});
        }
      };
      g.opera.extension.postMessage(g.JSON.stringify({command: 'config'}));
    } else {
      entrypoint(g, unsafeWindow || w, (unsafeWindow || w).document);
    }
  } else if (greasemonkey) {
    inject(null);
  } else if (g.chrome) {
    var base_uri = g.chrome.extension.getURL('/');
    g.chrome.extension.sendRequest({command: 'config'}, function(msg) {
      if (msg.command === 'config') {
        inject({base_uri: base_uri, conf: msg.data});
      }
    });
  } else if (g.safari) {
    g.safari.self.addEventListener('message', function(ev) {
      if (ev.name === 'config') {
        inject({
          base_uri: g.safari.extension.baseURI,
          conf:     ev.message
        });
      }
    }, false);
    g.safari.self.tab.dispatchMessage('config', null);
  } else {
    inject(null);
  }
})(this, this.window, this.unsafeWindow, function(g, w, d, _extension_data) {

  if (w.pixplus) {
    return;
  }

  // __LIBRARY_BEGIN__

  var _ = w.pixplus = {
    extend: function(base) {
      g.Array.prototype.slice.call(arguments, 1).forEach(function(extract) {
        for(var key in extract) {
          base[key] = extract[key];
        }
      });
      return base;
    }
  };

  _.conf = {
    __key_prefix: '__pixplus_',
    __is_extension: false,

    __conv: {
      'string': function(value) {
        return g.String(value);
      },
      'number': function(value) {
        return g.parseFloat(value) || 0;
      },
      'boolean': function(value) {
        return g.String(value).toLowerCase() === 'true';
      },

      bookmark_tag_order: {
        parse: function(str) {
          var ary = [], ary_ary = [], lines = str.split(/[\r\n]+/);
          for(var i = 0; i < lines.length; ++i) {
            var tag = lines[i];
            if (tag === '-') {
              if (ary_ary.length) {
                ary.push(ary_ary);
              }
              ary_ary = [];
            } else if (tag === '*') {
              ary_ary.push(null);
            } else if (tag) {
              ary_ary.push(tag);
            }
          }
          if (ary_ary.length) {
            ary.push(ary_ary);
          }
          return ary;
        },

        dump: function(bm_tag_order) {
          var str = '';
          if (!bm_tag_order) {
            return str;
          }
          for(var i = 0; i < bm_tag_order.length; ++i) {
            var ary = bm_tag_order[i];
            for(var j = 0; j < ary.length; ++j) {
              if (ary[j] === null) {
                ary[j] = '*';
              }
            }
            if (i) {
              str += '-\n';
            }
            str += ary.join('\n') + '\n';
          }
          return str;
        }
      },

      bookmark_tag_aliases: {
        parse: function(str) {
          var aliases = {};
          var lines = str.split(/[\r\n]+/);
          for(var i = 0; i < Math.floor(lines.length / 2); ++i) {
            var tag = lines[i * 2], alias = lines[i * 2 + 1];
            if (tag && alias) {
              aliases[tag] = alias.split(/\s+/);
            }
          }
          return aliases;
        },

        dump: function(bm_tag_aliases) {
          var str = '';
          for(var key in bm_tag_aliases) {
            str += key + '\n' + bm_tag_aliases[key].join(' ') + '\n';
          }
          return str;
        }
      }
    },

    __export: function(key_prefix) {
      var storage = { };
      _.conf.__schema.forEach(function(section) {
        section.items.forEach(function(item) {
          var value = _.conf[section.name][item.key];
          var conv = _.conf.__conv[section.name + '_' + item.key];
          if (conv) {
            value = conv.dump(value);
          } else {
            value = g.String(value);
          }
          storage[key_prefix + section.name + '_' + item.key] = value;
        });
      });
      return storage;
    },

    __import: function(data) {
      _.conf.__schema.forEach(function(section) {
        section.items.forEach(function(item) {
          var key = section.name + '_' + item.key;
          var value = data[key];
          if (typeof(value) === 'undefined') {
            return;
          }

          var conv = _.conf.__conv[key];
          if (conv) {
            value = conv.parse(value);
          } else if ((conv = _.conf.__conv[typeof(item.value)])) {
            value = conv(value);
          }

          _.conf[section.name][item.key] = value;
        });
      });
    },

    __set_item: function(storage, key, section, item, value) {
      storage.setItem(key, value);
    },

    __init: function(storage) {
      _.conf.__defaults = { };
      _.conf.__schema.forEach(function(section) {
        _.conf.__defaults[section.name] = { };
        section.items.forEach(function(item) {
          _.conf.__defaults[section.name][item.key] = item.value;
        });
      });

      _.conf.__schema.forEach(function(section) {
        var conf_section = _.conf[section.name] = { }, value_cache = { };
        var section_key = _.conf.__key_prefix;
        if (!_.conf.__is_extension || section.name !== 'general') {
          // for compatibility
          section_key += section.name + '_';
        }

        section.items.forEach(function(item) {
          var key = section_key + item.key;
          
          var value = storage.getItem(key), conv;
          if (value === null) {
            value = item.value;
          } else {
            conv = _.conf.__conv[typeof(item.value)];
            if (conv) {
              value = conv(value);
            }
          }

          conv = _.conf.__conv[section.name + '_' + item.key];
          if (conv) {
            value = conv.parse(value);
          }

          value_cache[item.key] = value;

          conf_section.__defineGetter__(item.key, function() {
            return value_cache[item.key];
          });

          conf_section.__defineSetter__(item.key, function(value) {
            value_cache[item.key] = value;

            var conv = _.conf.__conv[section.name + '_' + item.key];
            if (conv) {
              value = conv.dump(value);
            } else {
              value = g.String(value);
            }
            _.conf.__set_item(storage, key, section.name, item.key, value);
          });
        });
      });
    }
  };

  _.extend(_, {
    version: function() {
      return _.changelog[0].version;
    },

    release_date: function() {
      return _.changelog[0].date;
    },

    format: function(fmt) {
      if (arguments.length < 1) {
        return '';
      } else if (arguments.length === 1) {
        return g.String(fmt);
      }

      var res = '', i, j, arg, arg_idx = 1,
          last_arg = arguments[arguments.length - 1],
          f_flag = false, f_pad;

      var add_with_pad = function(str) {
        if (f_pad) {
          while(f_pad[1] > str.length) {
            res += f_pad[0];
            f_pad[1] -= 1;
          }
        }
        res += str;
      };

      for(i = 0; i < fmt.length; ++i) {
        if (f_flag) {
          switch(fmt[i]) {
          case '%':
            res += '%';
            f_flag = false;
            break;
          case 's':
            res += g.String(arguments[arg_idx++]);
            f_flag = false;
            break;
          case 'd':
            add_with_pad(arguments[arg_idx++].toString(10));
            f_flag = false;
            break;
          case 'x':
            add_with_pad(arguments[arg_idx++].toString(16));
            f_flag = false;
            break;

          case '0':
            for(j = ++i; j < fmt.length && /\d/.test(fmt[j]); ++j) ;
            if (j < fmt.length) {
              f_pad = ['0', g.parseInt(fmt.substring(i, j), 10)];
            } else {
              return res + ' [[FORMAT ERROR: Invalid format]]';
            }
            break;

          default:
            return res + ' [[FORMAT ERROR: Invalid format]]';
          }
        } else if (fmt[i] === '%') {
          f_flag = true;
          f_pad = null;
        } else {
          res += fmt[i];
        }
      }
      return res;
    },

    log: function() {
      if (g.console) {
        g.console.log('pixplus: ' + _.format.apply(this, arguments));
      }
    },

    trim: function(text) {
      return text ? text.replace(_.re.trim, '') : '';
    },

    as_array: function(obj) {
      if (!obj) {
        return [];
      }
      return g.Array.prototype.slice.call(obj);
    },

    uniq: function(list) {
      var new_list = [];
      for(var i = 0; i < list.length; ++i) {
        if (new_list.indexOf(list[i]) < 0) {
          new_list.push(list[i]);
        }
      }
      return new_list;
    },

    tag: function(tag, context) {
      return _.as_array((context || d).getElementsByTagName(tag));
    },

    q: function(query, context) {
      return (context || d).querySelector(query);
    },

    qa: function(query, context) {
      return _.as_array((context || d).querySelectorAll(query));
    },

    xhr: {
      cache: { },

      remove_cache: function(url) {
        _.xhr.cache[url] = null;
      },

      request: function(method, url, headers, data, cb_success, cb_error) {
        var xhr = new w.XMLHttpRequest();
        xhr.onload = function() {
          _.xhr.cache[url] = xhr.responseText;
          cb_success(xhr.responseText);
        };
        if (cb_error) {
          xhr.onerror = function() {
            cb_error();
          };
        }
        xhr.open(method, url, true);
        if (headers) {
          headers.forEach(function(p) {
            xhr.setRequestHeader(p[0], p[1]);
          });
        }
        xhr.send(data);
      },

      get: function(url, cb_success, cb_error) {
        if (_.xhr.cache[url]) {
          cb_success(_.xhr.cache[url]);
          return;
        }
        _.xhr.request('GET', url, null, null, cb_success, cb_error);
      },

      post: function(form, cb_success, cb_error) {
        _.xhr.request(
          'POST',
          form.getAttribute('action'),
          [['Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8']],
          _.xhr.serialize(form),
          cb_success, cb_error
        );
      },

      serialize: function(form) {
        var data = '', data_map = { };
        if (form instanceof w.HTMLFormElement) {
          _.tag('input', form).forEach(function(input) {
            switch((input.type || '').toLowerCase()) {
            case 'reset':
            case 'submit':
              break;
            case 'checkbox':
            case 'radio':
              if (!input.checked) {
                break;
              }
            default:
              data_map[input.name] = input.value;
              break;
            }
          });
        } else {
          data_map = form;
        }
        for(var key in data_map) {
          if (data) {
            data += '&';
          }
          data += g.encodeURIComponent(key) + '=' + g.encodeURIComponent(data_map[key]);
        }
        return data;
      }
    },

    listen: function(context, events, listener, throttling) {
      var throttling_timer;

      if (!g.Array.isArray(events)) {
        events = [events];
      }

      var wrapper = function(ev) {
        if (throttling) {
          if (throttling_timer) {
            return;
          }
          throttling_timer = g.setTimeout(function() {
            listener(ev, connection);
            throttling_timer = 0;
          }, 50);
          return;
        }

        if (listener(ev, connection)) {
          ev.preventDefault();
          ev.stopPropagation();
        }
      };

      var connection = {
        disconnected: false,
        disconnect: function() {
          if (connection.disconnected) {
            return;
          }
          events.forEach(function(event) {
            context.removeEventListener(event, wrapper, false);
          });
          connection.disconnected = true;
        }
      };

      events.forEach(function(event) {
        context.addEventListener(event, wrapper, false);
      });
      return connection;
    },

    onclick: function(context, listener) {
      return _.listen(context, 'click', function(ev, connection) {
        if (ev.button !== 0 || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.metaKey) {
          return false;
        }
        return listener(ev, connection);
      });
    },

    onwheel: function(context, listener) {
      return _.listen(
        context,
        ['DOMMouseScroll', 'mousewheel'],
        function(ev, connection) {
          if (ev.ctrlKey || ev.shiftKey || ev.altKey || ev.metaKey) {
            return false;
          }
          return listener(ev, connection);
        }
      );
    },

    send_click: function(elem) {
      if (_.conf.general.debug) {
        _.log('send click event');
      }
      var doc  = elem.ownerDocument || d,
          ev   = doc.createEvent('MouseEvent'),
          view = doc.defaultView;
      ev.initMouseEvent(
        'click', // type
        true,    // canBubble
        true,    // cancelable
        view,    // view
        1,       // detail
        0,       // screenX
        0,       // screenY
        0,       // clientX
        0,       // clientY
        false,   // ctrlKey
        false,   // altKey
        false,   // shiftKey
        false,   // metaKey
        0,       // button
        elem     // relatedTarget
      );
      elem.dispatchEvent(ev);
    },

    lazy_scroll: function (elem, offset, root, scroll) {
      if (!elem) {
        return;
      }
      offset = g.parseFloat(typeof(offset) === 'undefined' ? 0.2 : offset);

      // if (!root || !scroll) {
      //   var p = elem.parentNode;
      //   while(p && p !== d.body && p !== d.documentElement) {
      //     if (p.scrollHeight > p.offsetHeight) {
      //       root = scroll = p;
      //       break;
      //     }
      //     p = p.parentNode;
      //   }
      // }

      if (!root) {
        root = d.compatMode === 'BackCompat' ? d.body : d.documentElement;
      }
      if (!scroll) {
        _.lazy_scroll(elem, offset, root, d.body);
        scroll = d.documentElement;
      }

      var rect = elem.getBoundingClientRect();
      var bt = g.Math.floor(root.clientHeight * offset),
          bb = g.Math.floor(root.clientHeight * (1.0 - offset));
      if (rect.top < bt) {
        scroll.scrollTop -= bt - rect.top;
      } else if (rect.bottom > bb) {
        scroll.scrollTop += rect.bottom - bb;
      }
    },

    e: function(name, options, parent) {
      var elem = d.createElement(name);
      if (options) {
        for(var key in options) {
          if (key === 'text') {
            elem.textContent = options[key];
          } else if (key === 'css') {
            elem.style.cssText = options[key];
          } else if (key === 'cls') {
            elem.className = options[key];
          } else {
            elem.setAttribute(key, options[key]);
          }
        }
      }
      if (parent) {
        parent.appendChild(elem);
      }
      return elem;
    },

    clear: function(element) {
      while(element.childNodes.length) {
        element.removeChild(element.childNodes[0]);
      }
    },

    open: function(url) {
      if (url) {
        w.open(url);
      }
    },

    key_enabled: function(ev) {
      return !(ev.target instanceof w.HTMLTextAreaElement
               || (ev.target instanceof w.HTMLInputElement
                   && (!ev.target.type || _.re.input_type_text.test(ev.target.type))));
    },

    redirect_jump_page: function(root) {
      if (_.conf.general.redirect_jump_page !== 2) {
        return;
      }
      _.qa('a[href*="jump.php"]', root).forEach(function(link) {
        var re;
        if ((re = _.re.url_jump.exec(link.href))) {
          link.href = g.decodeURIComponent(re[1]);
        }
      });
    },

    url: {
      sprite: 'http://source.pixiv.net/source/images/sprite.png?20120528',
      bookmark_add_css: 'http://source.pixiv.net/source/css/bookmark_add.css?20100720',

      parse_query: function(query) {
        var map = { };
        query.substring(1).split('&').forEach(function(p) {
          var pair = p.split('=', 2).map(function(t) {
            return g.decodeURIComponent(t);
          });
          map[pair[0]] = pair[1] || '';
        });
        return map;
      }
    },

    re: {
      trim: /(?:^\s+|\s+$)/g,
      image: /^(http:\/\/i\d+\.pixiv\.net\/img\d+\/img\/[^\/]+\/)(?:mobile\/)?(\d+)(?:_[\da-f]{10})?(_[sm]|_100|_128x128|_240ms|(?:_big)?_p\d+)(\.\w+(?:\?.*)?)$/,
      xml_tag: /<(\/?[a-zA-Z0-9]+)( [^<>]*?\/?)?>/,
      xml_attr: /\s([a-zA-Z0-9-]+)=\"([^\"]+)\"/,
      xml_comment: /<!--.*?-->/g,
      selector_token: /([#\.])/,
      author_profile: /\/member\.php\?id=(\d+)/,
      meta_size: /^(\d+)\u00d7(\d+)$/,
      meta_manga: /^[^ ]{1,10} (\d+)P$/,
      manga_page: /pixiv\.context\.images\[(\d+)\]\.(push|unshift)\('([^']*)'\)/,
      manga_image_suffix: /(_p\d+\.\w+)(?=\?|$)/,
      hash_manga_page: /^#pp-manga-page-(\d+)$/,
      url_extension: /\.(\w+)(?:\?|$)/,
      repost: /(\d{4})\u5e74(\d+)\u6708(\d+) (\d+):(\d\d) \u306b\u518d\u6295\u7a3f/,
      url_bookmark: /^(?:(?:http:\/\/www\.pixiv\.net)?\/)?bookmark\.php(\?.*)?$/,
      url_member_illust: /^(?:(?:http:\/\/www\.pixiv\.net)?\/)?member_illust\.php(\?.*)?$/,
      url_jump: /^(?:(?:http:\/\/www\.pixiv\.net)?\/)?jump\.php\?(.+)$/,
      input_type_text: /^(?:text|search|tel|url|email|password|number)$/i
    },

    workaround: {
      OPERA1250_REDRAWFIX: 0x80
    }
  });

  _.key = {
    code_map: { },
    name_map: { },
    encode_map: {Spacebar: 'Space', Esc: 'Escape'},
    decode_map: { },

    parse_event: function(ev) {
      var keys = [], key;

      if (ev.key) {
        if (ev.char.length === 1 && ev.char === ev.key) {
          if (ev.char.charCodeAt(0) > 0x20) {
            key = ev.char.toLowerCase();
          } else if (ev.keyCode > 0x20 && ev.keyCode < 0x7f) {
            key = g.String.fromCharCode(ev.keyCode).toLowerCase();
          }
        } else {
          key = ev.key;
        }

        if (key) {
          keys.push(_.key.encode_map[key] || key);
        }

      } else if (ev.keyIdentifier) {
        if (ev.keyIdentifier.lastIndexOf('U+', 0) === 0) {
          c = g.parseInt(ev.keyIdentifier.substring(2), 16);
          if (c <= 0) {
            // error
          } else if (c <= 0x20) {
            key = _.key.code_map[c] || ('_c' + String(c));
          } else if (c < 0x7f) {
            key = g.String.fromCharCode(c).toLowerCase();
          } else if (c === 0x7f) {
            key = _.key.DELETE;
          } else {
            // not in ascii
          }
        } else {
          key = ev.keyIdentifier;
        }
        if (key) {
          keys.push(_.key.encode_map[key] || key);
        }

      } else if (ev.type === 'keypress') {
        var c = ev.keyCode || ev.charCode;
        if (c === ev.which && c > 0x20 && c < 0x7f) {
          key = g.String.fromCharCode(c).toLowerCase();
          keys.push(_.key.encode_map[key] || key);
        } else if (_.key.code_map[c]) {
          keys.push(_.key.code_map[c]);
        } else if (c > 0) {
          keys.push('_c' + g.String(c));
        }
      }

      if (keys.length < 1) {
        return null;
      }

      if (ev.ctrlKey) {
        keys.unshift('Control');
      }
      if (ev.shiftKey) {
        keys.unshift('Shift');
      }
      if (ev.altKey) {
        keys.unshift('Alt');
      }
      if (ev.metaKey) {
        keys.unshift('Meta');
      }

      return _.uniq(keys).join('+');
    },

    listen: function(context, listener) {
      _.listen(context, ['keypress', 'keydown'], function(ev, connection) {
        var key = _.key.parse_event(ev);
        if (key) {
          if (_.conf.general.debug) {
            _.log('keyevent type=%s key=%s', ev.type, key);
          }
          var res = listener(key, ev, connection);
          if (res && _.conf.general.debug) {
            _.log('  canceled');
          }
          return res;
        }
        return false;
      });
    },

    init: function() {
      var keys = [
        [8, 'Backspace'], [9, 'Tab'], [13, 'Enter'], [27, 'Escape'],
        [32, 'Space'], [33, 'PageUp'], [34, 'PageDown'], [35, 'End'],
        [36, 'Home'], [37, 'Left'], [38, 'Up'], [39, 'Right'],
        [40, 'Down'], [45, 'Insert'], [46, 'Delete']
      ];

      for(var i = 1; i < 13; ++i) {
        keys.push([111 + i, 'F' + i.toString(10)]);
      }

      keys.forEach(function(p) {
        var code = p[0], name = p[1];
        _.key[name.toUpperCase()] = name;
        _.key.code_map[code] = name;
        _.key.name_map[name] = code;
      });

      [
        ['+', 'plus'],
        [',', 'comma'],
        [' ', 'Space'],
        ['\t', 'Tab']
      ].forEach(function(p) {
        _.key.encode_map[p[0]] = p[1];
        _.key.decode_map[p[1]] = p[0];
      });
    }
  };

  _.configui = {
    dom: { },
    shown: false,
    lng: null,
    root: null,
    menu: null,

    bitfield: {
      general: {
        workaround: _.workaround
      },

      setup: function(input, field_map) {
        var list = _.e('ul', {cls: 'pp-config-bitfield-list'}), items = [ ];

        var update = function() {
          var value = g.parseInt(input.value, 10) || 0;
          items.forEach(function(item) {
            item[2].classList[(value & item[1]) === item[1] ? 'add' : 'remove']('pp-active');
          });
        };

        for(var key in field_map) {
          var value = field_map[key], li = _.e('li');
          _.e('span', {text: _.format('0x%04x', value), css: 'float:right;margin-left:1em'}, li);
          li.appendChild(d.createTextNode(key));
          _.e('div', {css: 'clear:both'}, li);
          items.push([key, value, li]);
        }
        items.sort(function(a, b) {
          return a[1] - b[1];
        });

        items.forEach(function(item) {
          var flags = item[1];

          _.listen(item[2], 'mousedown', function() {
            var value = g.parseInt(input.value, 10) || 0;
            if ((value & flags) === flags) {
              value &= ~flags;
            } else {
              value |= flags;
            }
            input.value = value;

            var ev = d.createEvent('Event');
            ev.initEvent('input', true, true);
            input.dispatchEvent(ev);

            update();
            return true;
          });

          list.appendChild(item[2]);
        });

        var show = function() {
          if (list.parentNode) {
            return;
          }
          update();
          input.parentNode.appendChild(list);
        };

        var hide = function() {
          if (!list.parentNode) {
            return;
          }
          list.parentNode.removeChild(list);
        };

        _.listen(input, 'focus', show);
        _.listen(input, 'blur', hide);
      }
    },

    init: function(root, menu, extension_data) {
      if (!root) {
        return;
      }

      _.configui.lng = _.lang.current;
      _.configui.root = root;
      _.configui.menu = menu;

      if (menu) {
        var btn = _.e('a', {text: 'pixplus', 'href': '#'}, _.e('li'));
        _.onclick(btn, function() {
          if (extension_data) {
            if (extension_data.open_options) {
              extension_data.open_options();
            } else if (extension_data.base_uri) {
              _.open(extension_data.base_uri + 'options.html');
            }
          } else {
            _.configui.toggle();
          }
          return true;
        });
        menu.insertBefore(btn, menu.firstChild);
      }
    },

    create_tab_content: function(root, section) {
      var table = _.e('table', null, root);
      var lang_conf = _.configui.lng.conf, last_mode;

      section.items.forEach(function(item) {
        if (!_.conf.general.debug && item.hidden) {
          return;
        }

        var type = typeof(item.value);
        var info = lang_conf[section.name][item.key] || '[Error]';

        // key tab
        if (section.name === 'key') {
          var mode = item.mode || item.end_mode;
          if (mode && mode !== last_mode) {
            var mode_line = table.insertRow(-1).insertCell(-1);
            mode_line.className = 'pp-config-key-modeline';
            mode_line.setAttribute('colspan', '3');
            mode_line.textContent = lang_conf.mode[mode];
            last_mode = mode;
          }
          if (item.start_mode) {
            info = lang_conf.key.mode_start.replace(
              '$mode',
              lang_conf.mode[item.start_mode]
            );
          } else if (item.end_mode) {
            info = lang_conf.key.mode_end.replace(
              '$mode',
              lang_conf.mode[item.end_mode]
            );
          }
        }

        var row  = table.insertRow(-1);
        var desc = row.insertCell(-1);
        var control, control_propname;

        if (type === 'boolean') {
          var label = _.e('label', null, desc);
          control = _.e('input', {type: 'checkbox'}, label);
          control_propname = 'checked';
          label.appendChild(d.createTextNode(info.desc || info));
          desc.setAttribute('colspan', '2');
        } else {
          var value = row.insertCell(-1);
          desc.textContent = info.desc || info;
          if (info.hint) {
            control = _.e('select', {}, value);
            info.hint.forEach(function(hint, idx) {
              var ovalue = hint.value || idx;
              var opt = _.e('option', {text: hint.desc || hint, value: ovalue}, control);
            });
          } else {
            control = _.e('input', null, value);

            var field_map = (_.configui.bitfield[section.name] || { })[item.key];
            if (field_map) {
              _.configui.bitfield.setup(control, field_map);
            }
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
          _.e('button', {'text': _.configui.lng.pref['default']}, row.insertCell(-1)),
          function() {
            _.conf[section.name][item.key] = item.value;
            control[control_propname] = item.value;
          }
        );
      });
    },

    create_tab_content_key: function(root, section) {
      _.configui.create_tab_content(root, section);

      var editor_row;

      function close_editor(row, input) {
        if (editor_row) {
          editor_row.parentNode.removeChild(editor_row);
          editor_row = null;
        }
      }

      function open_editor(row, input) {
        close_editor();
        editor_row = _.e('tr');

        var cell = _.e('td', {cls: 'pp-config-key-editor', 'colspan': '3'}, editor_row);
        var root = _.e('div', null, cell);
        var list = _.e('ul', null, root);

        function reset() {
          _.clear(list);
          if (input.value) {
            input.value.split(',').forEach(add);
          }
        }

        function add(key) {
          var li = _.e('li', null, list);
          _.onclick(_.e('button', {text: '\u00d7'}, li), function() {
            list.removeChild(li);
            apply();
          });
          _.e('label', {text: key}, li);
        }

        function apply() {
          var keys = [];
          _.qa('li label', list).forEach(function(key) {
            keys.push(key.textContent);
          });
          input.value = keys.join(',');

          var ev = d.createEvent('Event');
          ev.initEvent('input', true, true);
          input.dispatchEvent(ev);
        }

        reset();

        var add_line = _.e('div', {cls: 'pp-config-key-editor-add-line'}, root);
        var add_input = _.e('input', {'placeholder': 'Grab key'}, add_line);
        _.key.listen(add_input, function(key) {
          add_input.value = key;
          return true;
        });
        _.onclick(_.e('button', {text: _.configui.lng.pref.add}, add_line), function() {
          add(add_input.value);
          add_input.value = '';
          apply();
        });
        _.onclick(_.e('button', {text: _.configui.lng.pref.close}, add_line), close_editor);

        row.parentNode.insertBefore(editor_row, row.nextSibling);
      }

      _.qa('tr', root).forEach(function(row) {
        var input = _.tag('input', row)[0];
        if (input) {
          _.listen(input, 'focus', function() {
            open_editor(row, input);
          });
        }
      });
    },

    create_tab_content_bookmark: function(root, section) {
      _.e('div', {text: _.configui.lng.conf.bookmark.tag_order, css: 'white-space:pre'}, root);

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


      _.e('div', {text: _.configui.lng.conf.bookmark.tag_aliases}, root);

      var tag_alias_table = _.e('table', {id: 'pp-config-bookmark-tag-aliases'}, root);
      _.onclick(_.e('button', {text: _.configui.lng.pref.add}, root), function() {
        add_row();
      });

      function save() {
        var aliases = { };
        g.Array.prototype.forEach.call(tag_alias_table.rows, function(row) {
          var inputs = _.tag('input', row);
          if (inputs.length === 2 && inputs[0].value) {
            aliases[inputs[0].value] = inputs[1].value.split(/\s+/);
          }
        });
        _.conf.bookmark.tag_aliases = aliases;
      }

      function add_row(tag, list) {
        var row = tag_alias_table.insertRow(-1);
        _.onclick(_.e('button', {text: '\u00d7'}, row.insertCell(-1)), function() {
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

    create_tab_content_importexport: function(root) {
      var toolbar  = _.e('div', {id: 'pp-config-importexport-toolbar'}, root);
      var textarea = _.e('textarea', null, root);

      _.onclick(_.e('button', {text: _.configui.lng.pref['export']}, toolbar), function() {
        textarea.value = JSON.stringify(_.conf.__export(''), null, 2);
      });

      _.onclick(_.e('button', {text: _.configui.lng.pref['import']}, toolbar), function() {
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

    create_tab_content_about: function(root) {
      var urls = [
        'http://crckyl.pa.land.to/pixplus/',
        'http://crckyl.ath.cx:8088/pixplus/',
        'http://crckyl.ath.cx:8088/svn/repos/pixplus/',
        'http://my.opera.com/crckyl/',
        'http://twitter.com/crckyl'
      ];
      var dl = _.e('dl', null, root);
      [['Name', 'pixplus'],
       ['Version', _.version() + ' - ' + _.release_date()],
       ['Web', function(dd) {
         var ul = _.e('ul', null, dd);
         urls.forEach(function(url) {
           _.e('a', {href: url, text: url}, _.e('li', null, ul));
         });
       }],
       ['Mail', _.e('a', {text: 'crckyl@myopera.com', href: 'mailto:crckyl@myopera.com'})],
       ['License', 'Apache License 2.0']].forEach(function(p) {
         var label = p[0], content = p[1];
         _.e('dt', {text: label}, dl);
         var dd = _.e('dd', null, dl);
         if (content instanceof w.HTMLElement) {
           dd.appendChild(content);
         } else if (content.call) {
           content(dd);
         } else {
           dd.textContent = content;
         }
       });
    },

    create_tab_content_changelog: function(root) {
      var dl = _.e('dl', null, root);
      _.changelog.forEach(function(release) {
        _.e('dt', {text: release.version + ' - ' + release.date}, dl);
        var ul = _.e('ul', null, _.e('dd', null, dl));
        (
          release.changes_i18n
            ? release.changes_i18n[_.configui.lng.__name__]
            : release.changes
        ).forEach(function(change) {
          _.e('li', {text: change}, ul);
        });
      });
    },

    create_tab_content_debug: function(root) {
      var langbar = _.e('div', {id: 'pp-config-langbar'}, root);
      ['en', 'ja'].forEach(function(name) {
        _.onclick(_.e('button', {text: name}, langbar), function() {
          _.configui.lng = _.lang[name];
          _.configui.dom.root.parentNode.removeChild(_.configui.dom.root);
          _.configui.dom = { };
          _.configui.shown = false;
          _.configui.show();
        });
      });

      var input_line = _.e('div', null, root);
      var input      = _.e('input', null, input_line);
      var cancel_l   = _.e('label', null, input_line);
      var cancel     = _.e('input', {type: 'checkbox', css: 'margin-left:4px;', checked: true}, cancel_l);
      var console_l  = _.e('label', null, input_line);
      var console    = _.e('input', {type: 'checkbox', css: 'margin-left:4px;', checked: true}, console_l);
      var logger     = _.e('table', {border: 1, css: 'margin-top:4px;'}, root);

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
        if (console.checked && g.console) {
          g.console.log(ev);
        }
      }

      clear();
      _.onclick(_.e('button', {text: 'Clear', css: 'margin-left:4px;'}, input_line), clear);
      input.addEventListener('keydown', log, false);
      input.addEventListener('keypress', log, false);
    },

    create_tab: function(name, create_args) {
      var dom = _.configui.dom;
      var label = _.e('label', {text: _.configui.lng.pref[name], cls: 'pp-config-tab'}, dom.tabbar);
      var content = _.e('div', {id: 'pp-config-' + name + '-content', cls: 'pp-config-content'});
      (_.configui['create_tab_content_' + name] || _.configui.create_tab_content)(content, create_args);
      dom.content.appendChild(content);
      dom[name] = {label: label, content: content};
      _.onclick(label, function() {
        _.configui.activate_tab(dom[name]);
        return true;
      });
    },

    create: function() {
      var dom = _.configui.dom;
      if (dom.created) {
        return;
      }

      dom.root    = _.e('div', {id: 'pp-config'}, _.configui.root);
      dom.tabbar  = _.e('div', {id: 'pp-config-tabbar'});
      dom.content = _.e('div', {id: 'pp-config-content-wrapper'});

      if (_.configui.menu) {
        _.onclick(
          _.e('label', {id: 'pp-config-close-button', text: '\u00d7'}, dom.tabbar),
          function() {
            _.configui.hide();
            return true;
          }
        );
      }

      _.conf.__schema.forEach(function(section) {
        _.configui.create_tab(section.name, section);
      });
      ['importexport', 'about', 'changelog'].forEach(_.configui.create_tab);
      if (_.conf.general.debug) {
        _.configui.create_tab('debug');
      }

      dom.root.appendChild(dom.tabbar);
      dom.root.appendChild(dom.content);

      dom.created = true;

      _.configui.activate_tab(dom.general);
    },

    activate_tab: function(tab) {
      var lasttab = _.configui.dom.lasttab;
      if (lasttab) {
        lasttab.label.classList.remove('pp-active');
        lasttab.content.classList.remove('pp-active');
      }
      tab.label.classList.add('pp-active');
      tab.content.classList.add('pp-active');
      _.configui.dom.lasttab = tab;
    },

    show: function() {
      _.configui.create();
      _.configui.dom.root.classList.add('pp-show');
      _.configui.shown = true;
    },

    hide: function() {
      _.configui.dom.root.classList.remove('pp-show');
      _.configui.shown = false;
    },

    toggle: function() {
      if (_.configui.shown) {
        _.configui.hide();
      } else {
        _.configui.show();
      }
    }
  };

  // __LIBRARY_END__

  _.reorder_tag_list = function(list, cb_get_tagname) {
    var list_parent = list.parentNode, lists = [list];

    var tags = _.tag('li', list), tag_map = { };
    tags.forEach(function(tag) {
      var tagname = cb_get_tagname(tag);
      if (tagname) {
        tag_map[tagname] = tag;
        tag.parentNode.removeChild(tag);
      }
    });

    var all_list, all_list_before;

    var add_list = function() {
      var new_list = list.cloneNode(false);
      list_parent.insertBefore(new_list, list.nextSibling);
      list = new_list;
      lists.push(list);
      return list;
    };

    _.conf.bookmark.tag_order.forEach(function(tag_order, idx) {
      if (idx > 0) {
        add_list();
      }
      tag_order.forEach(function(tag) {
        if (tag) {
          if (tag_map[tag]) {
            list.appendChild(tag_map[tag]);
            tag_map[tag] = null;
          }
        } else {
          all_list = list;
          all_list_before = list.lastChild;
        }
      });
    });

    if (!all_list) {
      all_list = add_list();
    }

    for(var tag in tag_map) {
      if (tag_map[tag]) {
        all_list.insertBefore(tag_map[tag], all_list_before ? all_list_before.nextSibling : null);
      }
    }

    return lists;
  };

  _.fastxml = {
    ignore_elements: /^(?:script|style)$/,

    parse: function(xml) {
      var dom, node, tags = xml.replace(_.re.xml_cmment, '').split(_.re.xml_tag);
      for(var i = 0; i + 2 < tags.length; i += 3) {
        var text = tags[i], tag = tags[i + 1].toLowerCase(),
            attrs = tags[i + 2] || '', raw = '<' + tag + attrs + '>';
        if (text && node) {
          node.children.push({text: text});
        }

        if (tag[0] === '/') {
          tag = tag.substring(1);
          if (node) {
            var target = node;
            while(target) {
              if (target.tag === tag) {
                target.raw_close = raw;
                node = target.parent;
                break;
              }
              target = target.parent;
            }
            if (!node) {
              break;
            }
          }
          continue;
        }

        var attr_map = { };
        attrs = attrs.split(_.re.xml_attr);
        for(var j = 1; j + 1 < attrs.length; j += 3) {
          attr_map[attrs[j]] = attrs[j + 1];
        }

        if (node || tag === 'body') {
          var newnode = {
            parent:   node,
            tag:      tag,
            attrs:    attr_map,
            children: [],
            raw_open: raw
          };
          if (node) {
            node.children.push(newnode);
            node = newnode;
          } else {
            dom = node = newnode;
          }

          if (attrs[attrs.length - 1] === '/') {
            if (!(node = node.parent)) {
              break;
            }
          }
        }
      }
      return dom;
    },

    q: function(root, selector, callback) {
      if (!root) {
        return null;
      }

      var tokens = selector.split(' ').map(function(token) {
        var terms = token.split(_.re.selector_token);
        return function(node) {
          if (terms[0] && node.tag != terms[0]) {
            return false;
          }
          if (terms.length > 1 && !node.attrs) {
            return false;
          }

          var class_list = (node.attrs['class'] || '').split(/\s+/);
          for(var i = 1; i + 1 < terms.length; i += 2) {
            var v = terms[i + 1];
            if (terms[i] === '#') {
              if (v && v !== node.attrs.id) {
                return false;
              }
            } else if (terms[i] === '.') {
              if (v && class_list.indexOf(v) < 0) {
                return false;
              }
            }
          }
          return true;
        };
      });

      var test = function(node) {
        var tidx = tokens.length - 1;
        while(tidx >= 0 && node) {
          if (tokens[tidx](node)) {
            --tidx;
          }
          node = node.parent;
        }
        return tidx < 0;
      };

      var find = function(node) {
        if (test(node)) {
          if (!callback || callback(node)) {
            return node;
          }
        }
        if (!node.children) {
          return null;
        }
        for(var i = 0; i < node.children.length; ++i) {
          var r = find(node.children[i]);
          if (r) {
            return r;
          }
        }
        return null;
      };

      return find(root);
    },

    qa: function(root, selector) {
      var nodes = [];
      _.fastxml.q(root, selector, function(node) {
        nodes.push(node);
      });
      return nodes;
    },

    src: function(node, all) {
      if (!node || (!all && _.fastxml.ignore_elements.test(node.tag))) {
        return '';
      }
      if (node.text) {
        return node.text;
      }
      return node.raw_open + node.children.reduce(function(a, b) {
        return a + _.fastxml.src(b, all);
      }, '') + (node.raw_close || '');
    },

    text: function(node, all) {
      if (!node || (!all && _.fastxml.ignore_elements.test(node.tag))) {
        return '';
      }
      if (node.text) {
        return node.text;
      }
      return node.children.reduce(function(a, b) {
        return a + (b.text || '');
      }, '');
    }
  };

  _.illust = {
    root: null,
    last_link_count: 0,
    list: [ ],

    parse_image_url: function(url, allow_types) {
      if (!allow_types) {
        allow_types = ['_s', '_100', '_240ms', '_128x128'];
      }

      var re;
      if (!(re = _.re.image.exec(url))) {
        return null;
      }

      if (allow_types.indexOf(re[3]) >= 0) {
        var id = g.parseInt(re[2], 10), url_base = re[1] + re[2], url_suffix = re[4];
        if (id < 1) {
          return null;
        }

        return {
          id: id,
          image_url_base: url_base,
          image_url_suffix: url_suffix,
          image_url_medium: url_base + '_m' + url_suffix,
          image_url_big: url_base + url_suffix
        };
      }
      return null;
    },

    create_from_id: function(id) {
      return {
        id:                  id,
        url_medium:          '/member_illust.php?mode=medium&illust_id=' + id,
        url_bookmark:        '/bookmark_add.php?type=illust&illust_id=' + id,
        url_bookmark_detail: '/bookmark_detail.php?illust_id=' + id,
        url_manga:           '/member_illust.php?mode=manga&illust_id=' + id,
        url_response:        '/response.php?illust_id=' + id,
        manga:               { }
      };
    },

    create: function(link, allow_types, cb_onshow) {
      var illust, images = _.tag('img', link);

      for(var i = 0; i < images.length; ++i) {
        var p = _.illust.parse_image_url(images[i].src, allow_types);
        if (!p && images[i].hasAttribute('data-src')) {
          // lazy load support
          p = _.illust.parse_image_url(images[i].getAttribute('data-src'), allow_types);
        }
        if (!p) {
          continue;
        }
        if (illust) {
          return null;
        }

        illust = p;
        illust.image_thumb = images[i];
      }

      if (!illust) {
        return null;
      }

      _.extend(illust, _.illust.create_from_id(illust.id), {
        link: link,
        next: null
      });

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
      var links = _.qa('a[href*="member_illust.php?mode=medium"]', _.illust.root);
      if (links.length === _.illust.last_link_count) {
        return;
      }
      _.illust.last_link_count = links.length;

      if (_.conf.general.debug) {
        _.log('updating illust list');
      }

      var extract = function(link) {
        var list = _.illust.list;
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
          illust = _.illust.create(link);
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

      _.illust.list.forEach(function(illust) {
        illust.connection.disconnect();
      });
      _.illust.list = new_list;

      if (new_list.length < 1) {
        _.illust.last_link_count = 0;
      }

      if (_.conf.general.debug) {
        _.log('illust list updated - %d', new_list.length);
      }
    },

    setup: function(root) {
      if (!root) {
        _.log('root of illust list not specified');
        return;
      }
      _.illust.root = root;
      _.illust.update();
      _.listen(_.illust.root, 'DOMNodeInserted', _.illust.update, true);
    },

    parse_medium_html: function(illust, html) {
      var root = _.fastxml.parse(html), re;

      var error = _.fastxml.q(root, '.error strong');
      if (error) {
        illust.error = _.fastxml.text(error);
        return false;
      }

      var img = _.fastxml.q(root, '.works_display a img');
      if (img) {
        var p = _.illust.parse_image_url(img.attrs.src, '_m');
        if (p) {
          if (p.id !== illust.id) {
            illust.error = 'Invalid medium image url';
            return false;
          }
          _.extend(illust, p);
        } else if (!illust.image_url_base) {
          illust.error = 'Failed to parse medium image url';
          return false;
        }
      } else if (!illust.image_url_base) {
        illust.error = 'Medium image not found';
        return false;
      }

      var work_info = _.fastxml.q(root, '.work-info'),
          score     = _.fastxml.q(work_info, '.score'),
          question  = _.fastxml.q(work_info, '.questionnaire');

      illust.title    = _.fastxml.text(_.fastxml.q(work_info, '.title'));
      illust.caption  = _.fastxml.src(_.fastxml.q(work_info, '.caption'));
      illust.taglist  = _.fastxml.src(_.fastxml.q(root, '.works_tag #tags'));
      illust.rating   = _.fastxml.src(score);
      illust.question = _.fastxml.src(question, true);

      var search_script = function(node, name) {
        var pattern = new g.RegExp('pixiv\\.context\\.' + name + '\\s*=\\s*(true|false)');
        var value = false;
        var script = _.fastxml.q(node, 'script', function(script) {
          var re = pattern.exec(_.fastxml.text(script, true));
          if (re) {
            if (_.conf.general.debug) {
              _.log('pixiv.context.%s = %s', name, re[1]);
            }
            value = re[1] === 'true';
            return true;
          }
          return false;
        });
        if (!script) {
          _.log('[Error] Requested definition script not found - pixiv.context.%s', name);
        }
        return value;
      };

      illust.rated = search_script(score, 'rated');
      illust.answered = search_script(question, 'answered');

      var profile_area   = _.fastxml.q(root, '.profile_area'),
          avatar         = _.fastxml.q(profile_area, '.avatar_m img'),
          author_link    = _.fastxml.q(profile_area, 'h2 .avatar_m'),
          staccfeed_link = _.fastxml.q(root, '.extaraNavi p a', function(link) {
            return (link.attrs.href || '').indexOf('/stacc/') >= 0;
          });

      illust.author_fav   = !!_.fastxml.q(profile_area, '#favorite-button.added');
      illust.author_fav_m = !!_.fastxml.q(profile_area, '.list_fav');
      illust.author_mypix = !!_.fastxml.q(profile_area, '#mypixiv-button.added');
      illust.author_image = avatar ? avatar.attrs.src : null;
      illust.author_name  = '[Error]';
      illust.author_url   = '';
      illust.author_id    = 0;
      if (author_link) {
        illust.author_name = _.fastxml.text(author_link);
        illust.author_url = author_link.attrs.href;
        if ((re = _.re.author_profile.exec(illust.author_url))) {
          illust.author_id = g.parseInt(re[1], 10);
        }
      }
      illust.author_staccfeed = staccfeed_link ? staccfeed_link.attrs.href : null;

      var meta = _.fastxml.qa(work_info, '.meta li'),
          meta2 = _.fastxml.text(meta[1]);

      illust.datetime = _.fastxml.text(meta[0]);
      illust.repost = null;
      if ((re = _.re.repost.exec(html))) {
        illust.repost = {year: re[1], month: re[2], date: re[3], hour: re[4], minute: re[5]};
      }

      illust.size = null;
      illust.manga = {enable: false, viewed: illust.manga ? !!illust.manga.viewed : false};
      if ((re = _.re.meta_size.exec(meta2))) {
        illust.size = [g.parseInt(re[1], 10), g.parseInt(re[2], 10)];
      } else if ((re = _.re.meta_manga.exec(meta2))) {
        illust.manga.page_count = g.parseInt(re[1], 10);
        illust.manga.enable = illust.manga.page_count > 0;
      }

      illust.tools = _.fastxml.qa(work_info, '.meta .tools li').map(function(node) {
        return _.fastxml.text(node);
      });

      illust.bookmarked = !!_.fastxml.q(root, '.action .bookmark a', function(node) {
        return (node.attrs.href || '').indexOf('bookmark_detail.php') >= 0;
      });

      var response_to = _.fastxml.q(root, '.worksImageresponseInfo a');
      illust.has_image_response = !!_.fastxml.q(root, '.worksImageresponse .worksResponse');
      illust.image_response_to  = null;
      if (response_to) {
        var query = _.illust.parse_illust_url(response_to.attrs.href);
        if (query && query.mode === 'medium' && query.illust_id) {
          illust.image_response_to = query.illust_id;
        }
      }

      var comment_form_data = _.fastxml.qa(root, '.worksOption form input');
      if (comment_form_data.length > 0) {
        illust.comment_form_data = { };
        comment_form_data.forEach(function(input) {
          var name = input.attrs.name, value = input.attrs.value;
          if (name && value) {
            illust.comment_form_data[name] = value;
          }
        });
      }
      return true;
    },

    load: function(illust) {
      if (illust.loaded) {
        _.popup.onload(illust);
        return;
      }

      var error_sent = false;
      var send_error = function(msg) {
        if (!error_sent) {
          if (msg) {
            illust.error = msg;
          }
          _.popup.onerror(illust);
          error_sent = true;
        }
      };

      /* -1: error
       *  0: waiting
       *  1: loading
       *  2: complete
       */
      var statuses = {
        html:   0,
        medium: 0,
        big:    0
      };

      var image_medium, image_big;

      var load_image = function(name, url, other) {
        if (statuses[name] !== 0) {
          return null;
        }
        statuses[name] = 1;

        var image = new w.Image();

        _.listen(image, 'load', function() {
          illust['image_' + name] = image;
          statuses[name] = 2;
          if (statuses.html > 1) {
            illust.loaded = true;
            _.popup.onload(illust);
          }
        });

        _.listen(image, 'error', function() {
          statuses[name] = -1;
          if (statuses[other] < 0 && statuses.html > 1) {
            send_error('Failed to load image - ' + url);
          }
        });

        image.src = url;
        return image;
      };

      var start_images = function() {
        image_medium = load_image('medium', illust.image_url_medium, 'big');
        if (_.conf.popup.big_image) {
          image_big = load_image('big', illust.image_url_big, 'medium');
        } else {
          statuses.big = -1;
        }
      };

      if (illust.image_url_base) {
        start_images();
      }

      _.xhr.get(illust.url_medium, function(text) {
        if (_.illust.parse_medium_html(illust, text)) {
          statuses.html = 2;
          if (statuses.medium === 0) {
            start_images();
          } else {
            if (statuses.medium > 1 || statuses.big > 1) {
              illust.loaded = true;
              _.popup.onload(illust);
            }

            if (statuses.medium <= 1 && statuses.big <= 1
                && image_medium.src.split('?')[0] !== illust.image_url_medium.split('?')[0]) {
              _.log('reloading medium image with new url');
              statuses.medium = 1;
              image_medium.src = illust.image_url_medium;
            }

            if (_.conf.popup.big_image && statuses.big <= 1
                && image_big.src.split('?')[0] !== illust.image_url_big.split('?')[0]) {
              _.log('reloading big image with new url');
              statuses.big = 1;
              image_big.src = illust.image_url_big;
            }

            if (statuses.medium < 0 && statuses.big < 0) {
              send_error('Failed to load image');
            }
          }
        } else {
          send_error();
        }
      }, function() {
        send_error('Failed to load medium html');
      });
    },

    unload: function(illust) {
      if (!illust) {
        return;
      }
      illust.loaded = false;
      _.xhr.remove_cache(illust.url_medium);
    },

    parse_manga_html: function(illust, html) {
      var terms = html.split(_.re.manga_page), pages = [], pages_big = [], count = 0;
      for(var i = 1; i + 2 < terms.length; i += 4) {
        var page = g.parseInt(terms[i], 10), url = terms[i + 2];
        var url_big = url.replace(_.re.manga_image_suffix, '_big$1');

        if (page > pages.length) {
          return false;
        }
        if (page === pages.length) {
          pages.push([]);
          pages_big.push([]);
        }

        if (pages.length > 0 && page === pages.length - 1) {
          pages[page][terms[i + 1]](url);
          pages_big[page][terms[i + 1]](url_big);
          ++count;
        } else {
          return false;
        }
      }

      if (count !== illust.manga.page_count) {
        return false;
      }

      illust.manga.pages = pages;
      illust.manga.pages_big = pages_big;
      return true;
    },

    load_manga_page: function(illust, page) {
      if (!illust.manga.pages) {
        _.xhr.get(illust.url_manga, function(text) {
          if (_.illust.parse_manga_html(illust, text)) {
            _.illust.load_manga_page(illust, page);
          } else {
            _.popup.manga.onerror(illust, page);
          }
        }, function() {
          _.popup.manga.onerror(illust, page);
        });
        return;
      }

      var prefer_big = _.conf.popup.big_image;
      var pages = prefer_big ? illust.manga.pages_big : illust.manga.pages;
      if (page >= pages.length) {
        _.popup.manga.onerror(illust, page);
        return;
      }

      var error_sent = false;
      var send_error = function() {
        if (!error_sent) {
          _.popup.manga.onerror(illust, page);
          error_sent = true;
        }
      };

      var images = pages[page].slice(), load_count = 0;
      var onload = function() {
        if (!error_sent && ++load_count === images.length) {
          _.popup.manga.onload(illust, page, images);
        }
      };

      pages[page].forEach(function(obj, idx) {
        if (obj instanceof w.HTMLImageElement) {
          onload();
          return;
        }

        var img = new g.Image(), big = prefer_big;
        img.onload = function() {
          images[idx] = img;
          pages[page][idx] = img;
          onload();
        };
        img.onerror = function() {
          if (big) {
            big = false;
            img.src = illust.manga.pages[page][idx];
            if (_.conf.general.debug) {
              _.log('[Warn] big image for manga loading failed. falling back to default image.');
            }
          } else {
            send_error();
          }
        };
        img.src = obj;
      });
    },

    parse_illust_url: function(url) {
      var re;
      if (!(re = _.re.url_member_illust.exec(url))) {
        return null;
      }
      var query = _.url.parse_query(re[1]);
      if (query.illust_id) {
        query.illust_id = g.parseInt(query.illust_id, 10);
      }
      return query;
    }
  };

  _.process_caption = function(caption, base_illust) {
    if (!caption) {
      return;
    }

    var last = null;
    _.qa('a[href*="mode=medium"]', caption).forEach(function(link) {
      var query = _.illust.parse_illust_url(link.href);
      if (query && query.mode === 'medium' && query.illust_id) {
        var illust = _.illust.create_from_id(query.illust_id);
        illust.link = link;
        illust.connection = _.onclick(illust.link, function() {
          _.popup.show(illust);
          return true;
        });
        illust.prev = last || base_illust;
        if (last) {
          last.next = illust;
        }
        last = illust;
      }
    });

    if (last) {
      last.next = base_illust;
    }
  };

  _.popup = {
    dom: { },
    images: [],
    saved_context: null,

    create: function() {
      var dom = _.popup.dom;
      if (dom.created) {
        return;
      }

      dom.root              = _.e('div', {id: 'pp-popup'});
      dom.title             = _.e('div', {id: 'pp-popup-title'}, dom.root);
      dom.rightbox          = _.e('div', {id: 'pp-popup-rightbox'}, dom.title);
      dom.status            = _.e('span', {id: 'pp-popup-status'}, dom.rightbox);
      dom.button_manga      = _.e('a', {id: 'pp-popup-button-manga'}, dom.rightbox);
      dom.button_response   = _.e('a', {id: 'pp-popup-button-response', text: '[R]'}, dom.rightbox);
      dom.button_bookmark   = _.e('a', {id: 'pp-popup-button-bookmark', text: '[B]'}, dom.rightbox);
      dom.title_link        = _.e('a', null, dom.title);
      dom.title_clearfix    = _.e('div', {css: 'clear:both'}, dom.root);
      dom.header            = _.e('div', {id: 'pp-popup-header'}, dom.root);
      dom.caption_wrapper   = _.e('div', {id: 'pp-popup-caption-wrapper'}, dom.header);
      dom.caption           = _.e('div', {id: 'pp-popup-caption'}, dom.caption_wrapper);
      dom.comment_wrapper   = _.e('div', {id: 'pp-popup-comment-wrapper'}, dom.caption_wrapper);
      dom.comment           = _.e('div', {id: 'pp-popup-comment'}, dom.comment_wrapper);
      dom.comment_form      = _.e('div', {id: 'pp-popup-comment-form'}, dom.comment);
      dom.comment_history   = _.e('div', {id: 'pp-popup-comment-history'}, dom.comment);
      dom.taglist           = _.e('div', {id: 'pp-popup-taglist'}, dom.header);
      dom.rating            = _.e('div', {id: 'pp-popup-rating', cls: 'pp-popup-separator'}, dom.header);
      dom.info              = _.e('div', {id: 'pp-popup-info', cls: 'pp-popup-separator'}, dom.header);
      dom.author_image      = _.e('img', {id: 'pp-popup-author-image'}, dom.info);
      dom.author_status     = _.e('img', {id: 'pp-popup-author-status'}, dom.info);
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
      dom.olc_prev          = _.e('div', {id: 'pp-popup-olc-prev', cls: 'pp-popup-olc'}, dom.root);
      dom.olc_next          = _.e('div', {id: 'pp-popup-olc-next', cls: 'pp-popup-olc'}, dom.root);
      dom.image_wrapper     = _.e('a', {id: 'pp-popup-image-wrapper'}, dom.root);
      dom.image_layout      = _.e('div', {id: 'pp-popup-image-layout'}, dom.image_wrapper);
      dom.bookmark_wrapper  = _.e('div', {id: 'pp-popup-bookmark-wrapper'}, dom.root);
      dom.tagedit_wrapper   = _.e('div', {id: 'pp-popup-tagedit-wrapper'}, dom.root);

      if (!_.conf.popup.show_comment_form) {
        dom.comment_form.style.display = 'none';
      }

      _.popup.input.init();

      _.listen(w, 'resize', function() {
        if (_.popup.running) {
          _.popup.adjust();
        }
      }, true);

      dom.created = true;
    },

    layout_images: function(max_width, max_height) {
      if (!_.popup.images || _.popup.images.length < 1) {
        return;
      }

      var scale = 1, natural_sizes;

      natural_sizes = _.popup.images.map(function(img) {
        return [img.naturalWidth, img.naturalHeight];
      });

      var total_size = natural_sizes.reduce(function(a, b) {
        return [a[0] + b[0], g.Math.max(a[1], b[1])];
      }, [0, 0]);
      if (total_size[0] > max_width || total_size[1] > max_height) {
        scale = g.Math.min(max_width / total_size[0], max_height / total_size[1]);
      }
      _.popup.images.forEach(function(img, idx) {
        img.style.height = g.Math.floor(natural_sizes[idx][1] * scale) + 'px';
      });

      var height = g.Math.max.apply(g.Math, _.popup.images.map(function(img) {
        return img.offsetHeight;
      }));
      _.popup.images.forEach(function(img) {
        img.style.margin = g.Math.floor((height - img.offsetHeight) / 2) + 'px 0px 0px 0px';
      });

      var size_list, illust = _.popup.illust;
      if (illust.size && !illust.manga.enable && !_.popup.manga.enable) {
        size_list = [illust.size];
      } else {
        size_list = natural_sizes;
      }

      _.popup.dom.size.textContent = size_list.map(function(size, idx) {
        var str = size.join('x'), more_info = [], re, img = _.popup.images[idx];
        if (img.offsetWidth !== size[0]) {
          more_info.push((g.Math.floor(img.offsetWidth * 100 / size[0]) / 100) + 'x');
        }
        if ((re = _.re.url_extension.exec(img.src))) {
          more_info.push(re[1]);
        }
        if (more_info) {
          str += '(' + more_info.join('/') + ')';
        }
        return str;
      }).join('/');
    },

    adjust: function() {
      if (!_.popup.running) {
        return;
      }

      var dom = _.popup.dom, root = dom.root, de = d.documentElement;
      _.popup.layout_images(
        g.Math.max(480, de.clientWidth  - (root.offsetWidth  - dom.image_wrapper.clientWidth)  - 20),
        g.Math.max(320, de.clientHeight - (root.offsetHeight - dom.image_wrapper.clientHeight) - 20)
      );

      dom.image_layout.style.marginLeft = '0px';
      dom.image_layout.style.marginTop = '0px';
      dom.image_layout.style.marginLeft
        = g.Math.floor((dom.image_wrapper.clientWidth - dom.image_layout.offsetWidth) / 2) + 'px';
      dom.image_layout.style.marginTop
        = g.Math.floor((dom.image_wrapper.clientHeight - dom.image_layout.offsetHeight) / 2) + 'px';

      if (!_.popup.bookmark.enable && !_.popup.tagedit.enable) {
        var base_width = dom.image_wrapper.offsetWidth;
        dom.header.style.width = base_width + 'px';

        var header_height = dom.image_wrapper.offsetHeight;
        if (!_.popup.comment.enable) {
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

        var olc_width = _.conf.popup.overlay_control;
        [dom.olc_prev, dom.olc_next].forEach(function(olc) {
          olc.classList[_.conf.popup.overlay_control ? 'add' : 'remove']('pp-active');
          olc.style.width = (_.conf.popup.overlay_control < 1 ? base_width * olc_width : olc_width) + 'px';
          olc.style.height = dom.image_wrapper.offsetHeight + 'px';
        });
      }

      root.style.left = g.Math.floor((de.clientWidth  - root.offsetWidth)  / 2) + 'px';
      root.style.top  = g.Math.floor((de.clientHeight - root.offsetHeight) / 2) + 'px';

      if (_.conf.general.workaround & _.workaround.OPERA1250_REDRAWFIX) {
        root.style.borderColor = '#aaaaab';
        g.setTimeout(function() {
          root.style.borderColor = '';
        }, 0);
      }
    },

    clear: function() {
      var dom = _.popup.dom;

      _.clear(dom.title_link);

      dom.button_manga.style.display = 'none';
      dom.button_response.style.display = 'none';

      _.clear(dom.caption);
      _.clear(dom.taglist);
      _.clear(dom.rating);

      dom.author_status.style.display = 'none';
      dom.author_image.style.display = 'none';

      _.clear(dom.datetime);
      _.clear(dom.tools);

      _.clear(dom.author_profile);
      _.clear(dom.author_works);
      _.clear(dom.author_bookmarks);
      _.clear(dom.author_staccfeed);

      _.clear(dom.image_layout);

      _.popup.bookmark.clear();
      _.popup.manga.clear();
      _.popup.question.clear();
      _.popup.comment.clear();
      _.popup.tagedit.clear();
    },

    set_images: function(images) {
      var dom = _.popup.dom;
      _.popup.images = images;
      _.clear(dom.image_layout);
      _.popup.images.forEach(function(img) {
        dom.image_layout.appendChild(img);
      });
    },

    onload: function(illust) {
      var dom = _.popup.dom;
      if (illust !== _.popup.illust || _.popup.bookmark.enable || _.popup.tagedit.enable) {
        return;
      }
      if (_.conf.popup.preload) {
        if (illust.manga.enable) {
          _.illust.load_manga_page(illust, 0);
        }
        if (illust.prev) {
          _.illust.load(illust.prev);
        }
        if (illust.next) {
          _.illust.load(illust.next);
        }
      }

      _.popup.clear();

      dom.title_link.innerHTML = illust.title;
      dom.title_link.href = illust.url_medium;

      dom.button_bookmark.href = illust.url_bookmark;
      dom.button_bookmark.className = illust.bookmarked ? 'pp-active' : '';

      if (illust.has_image_response) {
        dom.button_response.classList.remove('pp-active');
        dom.button_response.href = illust.url_response;
        dom.button_response.style.display = '';
      } else if (illust.image_response_to) {
        dom.button_response.classList.add('pp-active');
        dom.button_response.href
          = '/member_illust.php?mode=medium&illust_id=' + illust.image_response_to;
        dom.button_response.style.display = '';
      }

      if (illust.manga.enable) {
        dom.button_manga.href = illust.url_manga + '#pp-manga-thumbnail';
        _.popup.manga.update_button();
        dom.button_manga.style.display = '';
      }

      dom.caption.innerHTML = illust.caption;
      _.process_caption(dom.caption, illust);
      _.redirect_jump_page(dom.caption);

      dom.taglist.innerHTML = illust.taglist.replace(/\u3000/g, '');
      _.onclick(
        _.e('a', {text: '[E]', href: '#', id: 'pp-popup-tagedit-button'}, dom.taglist),
        function() {
          _.popup.tagedit.start();
          return true;
        }
      );

      dom.rating.innerHTML = illust.rating + illust.question;

      if (_.conf.popup.remove_pixpedia) {
        _.qa('a[href*="dic.pixiv.net"]', dom.taglist).forEach(function(pixpedia) {
          pixpedia.parentNode.removeChild(pixpedia);
        });
      }

      if (_.conf.popup.author_status_icon) {
        [
          ['fav', 'pp-fav'],
          ['fav_m', 'pp-fav-m'],
          ['mypix', 'pp-mypix']
        ].forEach(function(p) {
          if (illust['author_' + p[0]]) {
            dom.author_status.className = p[1];
            dom.author_status.style.display = '';
          }
        });
      }

      if (illust.author_image) {
        dom.author_image.src = illust.author_image;
        dom.author_image.style.display = '';
      }

      var datetime = illust.datetime;
      if (illust.repost) {
        var repost = _.lang.current.repost;
        for(var key in illust.repost) {
          repost = repost.replace('$' + key, illust.repost[key]);
        }
        datetime += repost;
      }
      dom.datetime.textContent = datetime;

      illust.tools.forEach(function(tool) {
        _.e(
          'a',
          {href: '/search.php?word=' + g.encodeURIComponent(tool) + '&s_mode=s_tag', text: tool},
          dom.tools
        );
      });

      if (illust.author_id) {
        var lng = _.lang.current;
        dom.author_profile.href = '/member.php?id=' + illust.author_id;
        dom.author_profile.innerHTML = illust.author_name;
        dom.author_works.href = '/member_illust.php?id=' + illust.author_id;
        dom.author_works.textContent = lng.author_works;
        dom.author_bookmarks.href = '/bookmark.php?id=' + illust.author_id;
        dom.author_bookmarks.textContent = lng.author_bookmarks;
      }
      if (illust.author_staccfeed) {
        dom.author_staccfeed.href = illust.author_staccfeed;
        dom.author_staccfeed.textContent = lng.author_staccfeed;
      }

      if (illust.manga.enable) {
        dom.image_wrapper.href = illust.url_manga;
      } else {
        dom.image_wrapper.href = illust.image_url_big;
      }
      _.popup.set_images([(_.conf.popup.big_image && illust.image_big) || !illust.image_medium
                          ? illust.image_big
                          : illust.image_medium]);

      try {
        w.pixiv.context.illustId = illust.id;
        w.pixiv.context.userId = illust.author_id;
        w.pixiv.context.rated = illust.rated;
        if (illust.rating && !illust.rated) {
          w.pixiv.rating.setup();
        }
        if (illust.question) {
          w.pixiv.context.hasQuestionnaire = true;
          w.pixiv.context.answered = illust.answered;
          w.pixiv.questionnaire.setup();
        } else {
          w.pixiv.context.hasQuestionnaire = false;
        }
      } catch(ex) { }

      _.popup.set_status('');
      _.popup.adjust();
    },

    onerror: function(illust) {
      if (illust !== _.popup.illust || _.popup.bookmark.enable || _.popup.tagedit.enable) {
        return;
      }
      var msg = illust.error || 'Unknown error';
      _.log('[Error] %s', msg);
      _.popup.dom.image_layout.textContent = msg;
      _.popup.set_status('Error');
      _.popup.adjust();
    },

    set_status: function(text) {
      var dom = _.popup.dom;
      dom.status.style.display = 'none';
      if (text) {
        dom.status.textContent = text;
        dom.status.style.display = 'inline';
        if (text && dom.image_layout.childNodes.length < 1) {
          dom.image_layout.textContent = text;
        }
      }
    },

    show: function(illust) {
      if (!_.popup.saved_context) {
        if (_.conf.general.debug) {
          _.log('saving pixiv.context');
        }
        _.popup.saved_context = w.pixiv.context;
        w.pixiv.context = _.extend({ }, w.pixiv.context);
      }

      if (!illust) {
        _.popup.hide();
        return;
      }

      if (_.popup.bookmark.enable) {
        _.popup.bookmark.end();
      }
      if (_.popup.tagedit.enable) {
        _.popup.tagedit.end();
      }

      var dom = _.popup.dom;
      _.popup.create();
      dom.root.style.fontSize = _.conf.popup.font_size;
      dom.header.style.opacity = _.conf.popup.caption_opacity;

      _.popup.illust = illust;
      _.popup.running = true;
      if (!dom.root.parentNode) {
        d.body.insertBefore(dom.root, d.body.firstChild);
      }
      _.popup.set_status('Loading');
      _.popup.adjust();
      _.illust.load(illust);
      _.lazy_scroll(illust.image_thumb);
    },

    hide: function() {
      if (!_.popup.running) {
        return;
      }

      if (_.popup.saved_context) {
        if (_.conf.general.debug) {
          _.log('restoring pixiv.context');
        }
        w.pixiv.context = _.popup.saved_context;
      } else {
        _.log('[Error] pixiv.context not saved (bug)');
      }

      var dom = _.popup.dom;
      if (dom.root.parentNode) {
        dom.root.parentNode.removeChild(dom.root);
      }
      _.popup.clear();
      _.popup.running = false;
    },

    reload: function() {
      _.illust.unload(_.popup.illust);
      _.popup.show(_.popup.illust);
    },

    show_caption: function() {
      _.popup.dom.header.classList.add('pp-show');
    },

    hide_caption: function() {
      _.popup.question.blur();
      _.popup.dom.header.classList.remove('pp-show');
    },

    toggle_caption: function() {
      if (_.popup.dom.header.classList.contains('pp-show')) {
        _.popup.hide_caption();
      } else {
        _.popup.show_caption();
      }
    },

    send_rate: function(score) {
      if (_.popup.illust.rating && !_.popup.illust.rated) {
        try {
          w.pixiv.rating.rate = score;
          w.pixiv.rating.apply();
        } catch(ex) { }
      }
    }
  };

  _.popup.bookmark = {
    enable: false,

    clear: function() {
      _.clear(_.popup.dom.bookmark_wrapper);
      _.popup.dom.root.classList.remove('pp-bookmark-mode');
      _.popup.bookmark.enable = false;
    },

    start: function() {
      if (_.popup.bookmark.enable) {
        return;
      }

      var illust = _.popup.illust;
      _.popup.bookmark.enable = true;
      _.popup.set_status('Loading');

      _.xhr.remove_cache(illust.url_bookmark);
      _.xhr.get(illust.url_bookmark, function(html) {
        if (illust !== _.popup.illust || !_.popup.bookmark.enable) {
          return;
        }

        var root = _.fastxml.parse(html);
        var form = _.fastxml.q(root, 'form', function(form) {
          return form.attrs.action === 'bookmark_add.php';
        });
        if (form) {
          _.popup.dom.bookmark_wrapper.innerHTML = _.fastxml.src(form);
          _.popup.dom.root.classList.add('pp-bookmark-mode');
          _.bookmarkform.setup(
            _.tag('form', _.popup.dom.bookmark_wrapper)[0],
            !illust.bookmarked,
            function() {
              if (illust === _.popup.illust && _.popup.bookmark.enable) {
                _.popup.bookmark.clear();
                _.popup.reload();
              }
            }
          );

          _.popup.set_status('');
          _.popup.adjust();
        } else {
          _.popup.set_status('Error');
        }
      }, function() {
        if (illust === _.popup.illust && _.popup.bookmark.enable) {
          _.popup.set_status('Error');
        }
      });
    },

    submit: function() {
      if (!_.popup.bookmark.enable) {
        return;
      }

      var form = _.tag('form', _.popup.bookmark.dom.bookmark_wrapper)[0];
      if (form) {
        form.submit();
      }
    },

    end: function() {
      if (!_.popup.bookmark.enable) {
        return;
      }
      _.popup.bookmark.clear();
      _.popup.show(_.popup.illust);
      _.popup.adjust();
    },

    toggle: function() {
      if (_.popup.bookmark.enable) {
        _.popup.bookmark.end();
      } else {
        _.popup.bookmark.start();
      }
    }
  };

  _.popup.manga = {
    enable: false,
    page: -1,

    clear: function() {
      _.popup.manga.enable = false;
      _.popup.manga.page = -1;
      _.popup.manga.update_button();
    },

    onload: function(illust, page, images) {
      if (illust !== _.popup.illust
          || !_.popup.manga.enable
          || page !== _.popup.manga.page) {
        return;
      }

      if (_.conf.popup.preload) {
        if (_.popup.manga.page > 0) {
          _.illust.load_manga_page(illust, _.popup.manga.page - 1);
        }
        if (_.popup.manga.page + 1 < illust.manga.pages.length) {
          _.illust.load_manga_page(illust, _.popup.manga.page + 1);
        }
      }

      _.popup.dom.image_wrapper.href = illust.url_manga + '#pp-manga-page-' + page;
      _.popup.set_images(images);
      _.popup.manga.update_button();
      _.popup.set_status('');
      _.popup.adjust();
    },

    onerror: function(illust, page) {
      if (illust !== _.popup.illust
          || !_.popup.manga.enable
          || page !== _.popup.manga.page) {
        return;
      }
      if (illust.error) {
        _.popup.dom.image_layout.textContent = illust.error;
      }
      _.popup.set_status('Error');
      _.popup.adjust();
    },

    update_button: function() {
      var page, illust = _.popup.illust, pages = illust.manga.pages;
      if (_.popup.manga.page >= 0 && pages) {
        page = 1;
        for(var i = 0; i < _.popup.manga.page; ++i) {
          page += pages[i].length;
        }
        if (pages[_.popup.manga.page].length > 1) {
          page = page + '-' + (page + pages[_.popup.manga.page].length - 1);
        }
      } else {
        page = _.popup.manga.page + 1;
      }
      _.popup.dom.button_manga.textContent = '[M:' + page + '/' + illust.manga.page_count + ']';
      _.popup.dom.button_manga.classList[_.popup.manga.page >= 0 ? 'add' : 'remove']('pp-active');
    },

    show: function(page) {
      var illust = _.popup.illust;
      if (!illust.manga.enable) {
        return;
      }
      if (page < 0 || (illust.manga.pages && page >= illust.manga.pages.length)) {
        _.popup.manga.end();
        return;
      }
      _.popup.manga.enable = true;
      _.popup.manga.page = page;
      _.popup.manga.update_button();
      illust.manga.viewed = true;
      _.popup.set_status('Loading');
      _.illust.load_manga_page(illust, _.popup.manga.page);
    },

    start: function() {
      if (_.popup.manga.enable) {
        return;
      }
      _.popup.manga.show(0);
    },

    end: function() {
      if (!_.popup.manga.enable) {
        return;
      }
      _.popup.manga.clear();
      _.popup.show(_.popup.illust);
    },

    toggle: function() {
      if (_.popup.manga.enable) {
        _.popup.manga.end();
      } else {
        _.popup.manga.start();
      }
    }
  };

  _.popup.question = {
    enabled: function() {
      return !!_.q('.questionnaire .list.visible, .questionnaire .stats.visible',
                   _.popup.dom.rating);
    },

    clear: function() {
    },

    get_buttons: function() {
      return _.qa('.questionnaire .list ol input[type="button"]');
    },

    get_selected: function() {
      var active = d.activeElement;
      if (_.popup.question.get_buttons().indexOf(active) >= 0) {
        return active;
      }
      return null;
    },

    blur: function() {
      var selected = _.popup.question.get_selected();
      if (selected) {
        selected.blur();
      }
    },

    select_button: function(move) {
      var buttons;
      if (move === 0 || (buttons = _.popup.question.get_buttons()).length < 1) {
        return;
      }

      var selected = buttons.indexOf(d.activeElement);
      move %= buttons.length;
      if (selected < 0) {
        if (move > 0) {
          --move;
        }
      } else {
        move += selected;
      }
      if (move < 0) {
        move += buttons.length;
      } else if (move >= buttons.length) {
        move -= buttons.length;
      }
      buttons[move].focus();
    },

    select_prev: function() {
      _.popup.question.select_button(-1);
    },

    select_next : function() {
      _.popup.question.select_button(1);
    },

    submit: function() {
      var selected = _.popup.question.get_selected();
      if (selected) {
        _.send_click(selected);
      }
    },

    start: function() {
      var toggle = _.q('.questionnaire .toggle-list, .questionnaire .toggle-stats',
                       _.popup.dom.rating);
      if (toggle) {
        _.popup.show_caption();
        _.send_click(toggle);
      }
    },

    end: function() {
      _.popup.question.blur();
      _.qa(
        '.questionnaire .list, .questionnaire .stats',
        _.popup.dom.rating
      ).forEach(function(elem) {
        elem.classList.remove('visible');
      });
    }
  };

  _.popup.comment = {
    enable: false,

    clear: function() {
      _.popup.dom.root.classList.remove('pp-comment-mode');
      _.clear(_.popup.dom.comment_form);
      _.clear(_.popup.dom.comment_history);
      _.popup.comment.enable = false;
    },

    scroll: function() {
      _.popup.dom.caption_wrapper.scrollTop = _.popup.dom.caption.offsetHeight;
    },

    onload: function(illust, html) {
      if (illust !== _.popup.illust || !_.popup.comment.enable) {
        return;
      }
      _.popup.dom.comment_history.innerHTML = html;
      _.popup.adjust();
      _.popup.comment.scroll();
    },

    onerror: function(illust, message) {
      if (illust !== _.popup.illust || !_.popup.comment.enable) {
        return;
      }
      _.popup.dom.comment_history.textContent = message || 'Error';
    },

    reload: function() {
      var illust = _.popup.illust;
      if (!illust.author_id) {
        _.popup.comment.onerror('Author id not specified');
        return;
      }

      try {
        w.pixiv.api.post('/rpc_comment_history.php', {
	  i_id: illust.id,
	  u_id: illust.author_id
	}, {
	  ajaxSettings: {dataType: 'text'}
	}).done(function(data) {
          _.popup.comment.onload(illust, data);
	}).fail(function(data) {
          _.popup.comment.onerror(illust, data);
        });
      } catch(ex) {
        _.popup.comment.onerror(illust);
        return;
      }
      _.popup.dom.comment_history.textContent = 'Loading';
    },

    setup_form: function() {
      var data = _.popup.illust.comment_form_data;
      _.clear(_.popup.dom.comment_form);
      if (!data) {
        return;
      }

      var form  = _.e('form',
                      {action: '/member_illust.php', method: 'POST'},
                      _.popup.dom.comment_form);
      var input = _.e('input', {name: 'comment'}, form);
      for(var name in data) {
        if (name === 'submit' || name === 'comment') {
          continue;
        }
        _.e('input', {type: 'hidden', name: name, value: data[name]}, form);
      }
      _.listen(form, 'submit', function() {
        _.xhr.post(form, function() {
          _.popup.comment.setup_form();
          _.popup.comment.reload();
        }, function() {
          g.alert('Error!');
        });
        input.setAttribute('disabled', '');
        return true;
      });
    },

    start: function() {
      if (_.popup.comment.enable) {
        return;
      }
      _.popup.comment.enable = true;
      _.popup.comment.setup_form();
      if (_.popup.dom.comment_history.childNodes.length < 1) {
        _.popup.comment.reload();
      }
      _.popup.dom.root.classList.add('pp-comment-mode');
      _.popup.show_caption();
      _.popup.adjust();
      _.popup.comment.scroll();
    },

    end: function() {
      if (!_.popup.comment.enable) {
        return;
      }
      _.popup.dom.root.classList.remove('pp-comment-mode');
      _.popup.comment.enable = false;
      _.popup.adjust();
      _.popup.dom.caption_wrapper.scrollTop = 0;
    },

    toggle: function() {
      if (_.popup.comment.enable) {
        _.popup.comment.end();
      } else {
        _.popup.comment.start();
      }
    }
  };

  _.popup.tagedit = {
    enable: false,

    clear: function() {
      _.popup.dom.root.classList.remove('pp-tagedit-mode');
      _.clear(_.popup.dom.tagedit_wrapper);
      _.popup.tagedit.enable = false;
    },

    onload: function(illust, html) {
      if (illust !== _.popup.illust || !_.popup.tagedit.enable) {
        return;
      }
      _.clear(_.popup.dom.tagedit_wrapper);
      _.e('div', {id: 'tag_edit'}, _.popup.dom.tagedit_wrapper).innerHTML = html;
      _.popup.adjust();
    },

    onerror: function(illust, message) {
      if (illust !== _.popup.illust || !_.popup.tagedit.enable) {
        return;
      }
      _.popup.dom.tagedit_wrapper.textContent = message || 'Error';
    },

    reload: function() {
      var illust = _.popup.illust;
      if (!illust.author_id) {
        _.popup.tagedit.onerror('Author id not specified');
        return;
      }

      try {
        w.pixiv.api.post('/rpc_tag_edit.php', {
          mode: 'first',
	  i_id: illust.id,
	  u_id: illust.author_id,
	  e_id: w.pixiv.user.id
	}, {
	  ajaxSettings: {dataType: 'text'}
	}).done(function(data) {
          try {
            _.popup.tagedit.onload(illust, g.JSON.parse(data).html.join(''));
          } catch(ex) {
            _.popup.tagedit.onerror(illust, g.String(ex));
          }  
	}).fail(function(data) {
          _.popup.tagedit.onerror(illust, data);
        });
      } catch(ex) {
        _.popup.tagedit.onerror(illust);
        return;
      }
      _.popup.dom.tagedit_wrapper.textContent = 'Loading';
    },

    start: function() {
      if (_.popup.tagedit.enable) {
        return;
      }
      _.popup.tagedit.enable = true;
      _.popup.tagedit.reload();
      _.popup.dom.root.classList.add('pp-tagedit-mode');
      _.popup.adjust();
    },

    end: function() {
      if (!_.popup.tagedit.enable) {
        return;
      }
      _.popup.dom.root.classList.remove('pp-tagedit-mode');
      _.popup.tagedit.enable = false;
      _.popup.adjust();
    }
  };

  _.popup.input = {
    wheel_delta: 0,

    init: function() {
      ['auto_manga', 'reverse'].forEach(function(name) {
        var mode = _.conf.popup[name], value;
        if (mode === 2) {
          var pattern = _.conf.popup[name + '_regexp'];
          if (pattern) {
            value = (new g.RegExp(pattern)).test(w.location.href);
          } else {
            value = false;
          }
        } else {
          value = mode === 1;
        }
        _.popup.input[name] = value;
      });

      _.popup.key.init();
      _.popup.mouse.init();
    },

    prev: function() {
      if (_.popup.manga.enable) {
        _.popup.manga.show(_.popup.manga.page - 1);
        return;
      }
      _.popup.show(_.popup.illust[_.popup.input.reverse ? 'next' : 'prev']);
    },

    next: function() {
      if (_.popup.manga.enable) {
        _.popup.manga.show(_.popup.manga.page + 1);
        return;
      } else if (_.popup.input.auto_manga
                 && _.popup.illust.manga.enable
                 && !_.popup.illust.manga.viewed) {
        _.popup.manga.start();
        return;
      }
      _.popup.show(_.popup.illust[_.popup.input.reverse ? 'prev' : 'next']);
    },

    prev_direction: function() {
      if (_.popup.manga.enable) {
        _.popup.manga.show(_.popup.manga.page - 1);
        return;
      }
      _.popup.show(_.popup.illust.prev);
    },

    next_direction: function() {
      if (_.popup.manga.enable) {
        _.popup.manga.show(_.popup.manga.page + 1);
        return;
      }
      _.popup.show(_.popup.illust.next);
    },

    caption_scroll_up: function() {
      _.popup.dom.caption_wrapper.scrollTop -= _.conf.popup.scroll_height;
    },

    caption_scroll_down: function() {
      _.popup.dom.caption_wrapper.scrollTop += _.conf.popup.scroll_height;
    },

    first: function() {
      if (_.popup.manga.enable) {
        _.popup.manga.show(0);
      } else {
        _.popup.show(_.illust.list[0]);
      }
    },

    last: function() {
      if (_.popup.manga.enable) {
        _.popup.manga.show(_.popup.illust.manga.pages.length - 1);
      } else {
        _.popup.show(_.illust.list[_.illust.list.length - 1]);
      }
    },

    open_profile: function() {
      _.open(_.popup.dom.author_profile.href);
    },

    open_illust: function() {
      _.open(_.popup.dom.author_works.href);
    },

    open_bookmark: function() {
      _.open(_.popup.dom.author_bookmarks.href);
    },

    open_staccfeed: function() {
      _.open(_.popup.dom.author_staccfeed.href);
    },

    open_response: function() {
      if (_.popup.illust.has_image_response || _.popup.illust.image_response_to) {
        _.open(_.popup.dom.button_response.href);
      }
    },

    open_bookmark_detail: function() {
      _.open(_.popup.illust.url_bookmark_detail);
    },

    open: function() {
      _.open(_.popup.illust.url_medium);
    },

    open_big: function() {
      if (_.popup.illust.manga.enable) {
        if (_.popup.manga.enable) {
          _.popup.illust.manga.pages_big[_.popup.manga.page].forEach(function(img) {
            _.open(img.src || img);
          });
        } else {
          _.open(_.popup.illust.url_manga);
        }
      } else {
        _.open(_.popup.illust.image_url_big);
      }
    },

    open_manga_thumbnail: function() {
      _.open(_.popup.illust.url_manga + '#pp-manga-thumbnail');
    },

    // manga mode

    manga_open_page: function() {
      var hash = '';
      if (_.popup.manga.enable) {
        hash = '#pp-manga-page-' + _.popup.manga.page;
      }
      _.open(_.popup.illust.url_manga + hash);
    }
  };

  _.popup.key = {
    maps: [
      {
        cond: function() {
          return _.popup.bookmark.enable;
        },
        stop: true,
        keys: [
          ['bookmark_submit', _.popup.bookmark.submit],
          ['bookmark_end', _.popup.bookmark.end]
        ]
      }, {
        cond: function() {
          return _.popup.manga.enable;
        },
        keys: [
          'manga_open_page',
          ['manga_end', _.popup.manga.end]
        ]
      }, {
        cond: function() {
          return _.popup.illust.manga.enable && !_.popup.manga.enable;
        },
        keys: [
          ['manga_start', _.popup.manga.start]
        ]
      }, {
        cond: function() {
          return !_.popup.question.enabled();
        },
        keys: [
          ['qrate_start', _.popup.question.start]
        ]
      }, {
        cond: _.popup.question.enabled,
        keys: [
          ['qrate_select_prev', _.popup.question.select_prev],
          ['qrate_select_next', _.popup.question.select_next],
          ['qrate_submit', _.popup.question.submit],
          ['qrate_end', _.popup.question.end]
        ]
      }, {
        cond: function() {
          return !_.popup.tagedit.enable;
        },
        keys: [
          ['tag_edit_start', _.popup.tagedit.start]
        ]
      }, {
        cond: function() {
          return _.popup.tagedit.enable;
        },
        keys: [
          ['tag_edit_end', _.popup.tagedit.end]
        ]
      }, {
        cond: function() {
          return _.conf.popup.rate_key;
        },
        keys: [
          ['rate01', _.popup.send_rate, 1],
          ['rate02', _.popup.send_rate, 2],
          ['rate03', _.popup.send_rate, 3],
          ['rate04', _.popup.send_rate, 4],
          ['rate05', _.popup.send_rate, 5],
          ['rate06', _.popup.send_rate, 6],
          ['rate07', _.popup.send_rate, 7],
          ['rate08', _.popup.send_rate, 8],
          ['rate09', _.popup.send_rate, 9],
          ['rate10', _.popup.send_rate, 10]
        ]
      }, {
        cond: function() {
          return true;
        },
        keys: [
          'prev',
          'next',
          'prev_direction',
          'next_direction',
          'caption_scroll_up',
          'caption_scroll_down',
          'first',
          'last',
          ['close', _.popup.hide],
          'open_profile',
          'open_illust',
          'open_bookmark',
          'open_staccfeed',
          'open_response',
          ['bookmark_start', _.popup.bookmark.start],
          'open_bookmark_detail',
          'open',
          'open_big',
          ['reload', _.popup.reload],
          ['caption_toggle', _.popup.toggle_caption],
          ['comment_toggle', _.popup.comment.toggle],
          'open_manga_thumbnail'
        ]
      }
    ],

    init: function() {
      var maps = _.popup.key.maps;
      _.key.listen(w, function(key, ev, connection) {
        if (!_.popup.running || !_.key_enabled(ev)) {
          return false;
        }

        for(var i = 0; i < maps.length; ++i) {
          if (!maps[i].cond()) {
            continue;
          }
          var keys = maps[i].keys;

          for(var j = 0; j < keys.length; ++j) {
            var action = keys[j], name, args = [];
            if (g.Array.isArray(action)) {
              args = action.slice(2);
              name = action[0];
              action = action[1];
            } else {
              name = action;
              action = _.popup.input[name];
            }
            if (_.conf.key['popup_' + name].split(',').indexOf(key) >= 0) {
              action.apply(null, args);
              return true;
            }
          }

          if (maps[i].stop) {
            break;
          }
        }

        return false;
      });
    }
  };

  _.popup.mouse = {
    init: function() {
      _.onwheel(w, function(ev) {
        if (!_.popup.running || _.conf.popup.mouse_wheel === 0) {
          return false;
        }

        var node = ev.target;
        while(node && node.nodeType === w.Node.ELEMENT_NODE) {
          if (node === d.body || node === d.documentElement) {
            break;
          }
          if (node.scrollHeight > node.offsetHeight) {
            return false;
          }
          node = node.parentNode;
        }

        var action;
        _.popup.input.wheel_delta += ev.wheelDelta || -ev.detail || 0;
        if (_.conf.popup.mouse_wheel_delta < 0) {
          if (_.popup.input.wheel_delta <= _.conf.popup.mouse_wheel_delta) {
            action = 'prev';
          } else if (_.popup.input.wheel_delta >= -_.conf.popup.mouse_wheel_delta) {
            action = 'next';
          }
        } else {
          if (_.popup.input.wheel_delta >= _.conf.popup.mouse_wheel_delta) {
            action = 'prev';
          } else if (_.popup.input.wheel_delta <= -_.conf.popup.mouse_wheel_delta) {
            action = 'next';
          }
        }
        if (action) {
          if (_.conf.popup.mouse_wheel === 1) {
            action += '_direction';
          }
          _.popup.input[action]();
          _.popup.input.wheel_delta = 0;
        }
        return true;
      });

      var dom = _.popup.dom;

      _.onclick(dom.button_bookmark, function() {
        _.popup.bookmark.toggle();
        return true;
      });

      _.onclick(dom.button_manga, function() {
        _.popup.manga.toggle();
        return true;
      });

      _.onclick(dom.image_wrapper, function() {
        _.popup.hide();
        return true;
      });

      _.onclick(dom.olc_prev, function() {
        _.popup.input.prev_direction();
        return true;
      });

      _.onclick(dom.olc_next, function() {
        _.popup.input.next_direction();
        return true;
      });

      _.onclick(dom.comment_wrapper, function(ev) {
        if (ev.target === dom.comment_wrapper || ev.target === dom.comment) {
          var visible = dom.comment_form.style.display === 'none';
          dom.comment_form.style.display = visible ? '' : 'none';
          _.conf.popup.show_comment_form = visible;
        }
      });

      _.onclick(dom.tagedit_wrapper, function(ev) {
        var endbtn = ev.target;
        if (endbtn instanceof w.HTMLInputElement
            && (endbtn.getAttribute('onclick') || '').indexOf('endTagEdit') >= 0) {
          _.popup.tagedit.end();
          return true;
        }
        return false;
      });
    }
  };

  _.bookmarkform = {
    select_tag: function(tag, last_selected) {
      if (last_selected) {
        last_selected.classList.remove('pp-tag-select');
      }
      if (tag) {
        tag.classList.add('pp-tag-select');
      }
      return tag;
    },

    setup_autoinput: function(form) {
      var illust_tags = _.qa(
        '.bookmark_recommend_tag ul:not(#myBookmarkTags) li a.tag[data-tag]',
        form
      ).map(function(tag) {
        return tag.getAttribute('data-tag');
      });

      var aliases = _.conf.bookmark.tag_aliases;
      _.qa('#myBookmarkTags li[jsatagname]').map(function(tag) {
        var tags = [tag.getAttribute('jsatagname')], alist;
        alist = aliases[tags[0]];
        if (alist) {
          tags = tags.concat(alist);
        }
        for(var i = 0; i < tags.length; ++i) {
          for(var j = 0; j < illust_tags.length; ++j) {
            if (illust_tags[j].indexOf(tags[i]) >= 0) {
              _.send_click(_.q('a', tag));
              return;
            }
          }
        }
      });
    },

    setup_tag_order: function(form) {
      var mytags = _.q('#myBookmarkTags', form);
      if (!mytags || _.conf.bookmark.tag_order.length < 1) {
        return;
      }
      _.reorder_tag_list(mytags, function(tag) {
        return tag.getAttribute('jsatagname');
      });
    },

    setup_key: function(form) {
      var tags = _.qa('a.tag', form), selected_tag;
      var input_tag = _.q('input#input_tag', form);
      if (!input_tag) {
        return;
      }

      input_tag.focus();
      _.key.listen(input_tag, function(key, ev) {
        if (!selected_tag) {
          if (key === _.key.DOWN) {
            selected_tag = _.bookmarkform.select_tag(tags[0], selected_tag);
            return true;
          } else if (key === _.key.ESCAPE) {
            input_tag.blur();
            return true;
          }
          return false;
        }

        if (key === _.key.SPACE) {
          _.send_click(selected_tag);
          return true;
        } else if (key === _.key.ESCAPE) {
          selected_tag = _.bookmarkform.select_tag(null, selected_tag);
          return true;
        }

        if (key === _.key.DOWN || key === _.key.UP) {
          var rect = _.as_array(selected_tag.getClientRects()).reduce(function(a, b) {
            return a.width > b.width ? a : b;
          });
          var x = (rect.left + rect.right) / 2, t = rect.top, b = rect.bottom;
          var yscore = function(rect) {
            return key === _.key.DOWN ? rect.top - b : t - rect.bottom;
          };
          var score = function(node) {
            if (node === selected_tag) {
              return g.Infinity;
            }
            return g.Math.min.apply(
              g.Math,
              _.as_array(node.getClientRects()).map(function(rect) {
                var y = yscore(rect);
                return (y < 0
                        ? g.Infinity
                        : g.Math.max(x - rect.right, rect.left - x) + y * 10000);
              })
            );
          };
          selected_tag = _.bookmarkform.select_tag(tags.map(function(node) {
            var s = score(node);
            //_.log('tag=%s score=%s', node.getAttribute('data-tag'), s);
            return [s, node];
          }).sort(function(a, b) {
            return a[0] - b[0];
          })[0][1], selected_tag);
          return true;
        }

        var idx = tags.indexOf(selected_tag);
        if (key === _.key.LEFT) {
          idx = idx <= 0 ? tags.length - 1 : idx - 1;
        } else if (key === _.key.RIGHT) {
          idx = idx < 0 ? 0 : (idx >= tags.length - 1 ? 0 : idx + 1);
        } else {
          return false;
        }

        selected_tag = _.bookmarkform.select_tag(tags[idx], selected_tag);
        return true;
      });
    },

    setup: function(form, autoinput, cb_submit) {
      if (!form) {
        return;
      }

      form.setAttribute('action', '/bookmark_add.php');

      try {
        w.bookmarkTagSort.sortedTag = {
          name: { asc: [], desc: [] },
          num:  { asc: [], desc: [] }
        };
        w.bookmarkTagSort.tag = [];
      } catch(ex) { }

      try {
        w.pixiv.tag.setup();
      } catch(ex) { }

      if (_.conf.general.bookmark_hide) {
        var hide_radio = _.q('input#res1', _.popup.dom.bookmark_wrapper);
        hide_radio.checked = true;
      }

      _.qa('.box_main_bookmark br, .bookmark_bottom br', form).forEach(function(br) {
        var text_found = false;
        [br.previousSibling, br.nextSibling].forEach(function(sibling) {
          if (sibling.nodeType === w.Node.TEXT_NODE && _.trim(sibling.nodeValue)) {
            text_found = true;
            sibling.parentNode.removeChild(sibling);
          }
        });
        if (text_found) {
          br.parentNode.removeChild(br);
        }
      });

      if (autoinput) {
        _.bookmarkform.setup_autoinput(form);
      }

      _.bookmarkform.setup_tag_order(form);
      _.bookmarkform.setup_key(form);

      _.listen(form, 'submit', function() {
        _.xhr.post(form, function() {
          cb_submit();
        }, function() {
          g.alert('Error!');
        });
        _.qa('input[type="submit"]', form).forEach(function(btn) {
          btn.value = _.lang.current.sending;
          btn.setAttribute('disabled', '');
        });
        return true;
      });
    }
  };

  _.pager = {
    loaded: false,
    callbacks: [],

    load: function() {
      if (_.pager.loaded) {
        return;
      }
      _.pager.loaded = true;
      _.pager.callbacks.forEach(function(func) {
        func();
      });
      _.pager.callbacks = [];
    },

    check: function() {
      if (_.pager.loaded) {
        return true;
      }
      if (w.AutoPagerize || w.AutoPatchWork || _.q('#AutoPatchWork-Bar')) {
        _.pager.load();
        return true;
      }
      return false;
    },

    wait: function(callback) {
      if (_.pager.check()) {
        callback();
        return;
      }
      _.pager.callbacks.push(callback);
    },

    init: function() {
      if (_.pager.check()) {
        return;
      }

      _.listen(
        w,
        ['GM_AutoPagerizeLoaded', 'AutoPatchWork.initialized'],
        function(ev, connection) {
          _.pager.load();
          connection.disconnect();
        }
      );
    }
  };

  _.Floater = function(wrap, cont) {
    this.wrap = wrap;
    this.cont = cont;
    this.floating = false;
    this.disable_float = false;
    this.use_placeholder = true;
    this.ignore_elements = [];
    _.Floater.instances.push(this);
    if (_.Floater.initialized) {
      this.init();
    }
  };

  _.Floater.prototype = {
    init: function() {
      this.wrap.style.boxSizing = 'border-box';
      this.wrap.style.webkitBoxSizing = 'border-box';
      this.wrap.style.MozBoxSizing = 'border-box';
      this.wrap.style.width = this.wrap.offsetWidth + 'px';
      if (this.cont) {
        this.cont.style.display = 'block';
        this.cont.style.overflowX = 'hidden';
        this.cont.style.overflowY = 'auto';
      }
      this.update_float();
    },

    unfloat: function () {
      if (this.placeholder) {
        this.placeholder.parentNode.removeChild(this.placeholder);
        this.placeholder = null;
      }
      this.scroll_save();
      this.wrap.classList.remove('pp-float');
      this.scroll_restore();
      this.floating = false;
    },

    update_height: function () {
      if (this.cont) {
        var de = d.documentElement;
        var mh = de.clientHeight - (this.wrap.offsetHeight - this.cont.offsetHeight);
        this.ignore_elements.forEach(function(elem) {
          mh += elem.offsetHeight;
        });
        if (mh < 60) {
          this.disable_float = true;
          this.unfloat();
          this.cont.style.maxHeight = '';
          return;
        }
        if (!this.floating) {
          mh -= this.wrap.getBoundingClientRect().top;
        }
        this.cont.style.maxHeight = mh + 'px';
      }
    },

    update_float: function () {
      if (this.disable_float) {
        return;
      }
      var de = d.documentElement;
      var rect = (this.placeholder || this.wrap).getBoundingClientRect();
      if (!this.floating && rect.top < 0) {
        this.scroll_save();
        if (this.use_placeholder) {
          this.placeholder = this.wrap.cloneNode(false);
          this.placeholder.style.width = this.wrap.offsetWidth + 'px';
          this.placeholder.style.height = '0px';
          this.wrap.parentNode.insertBefore(this.placeholder, this.wrap);
        }
        this.wrap.classList.add('pp-float');
        if (this.use_placeholder) {
          this.placeholder.style.height
            = Math.min(this.wrap.offsetHeight, de.clientHeight) + 'px';
        }
        this.scroll_restore();
        this.floating = true;
      } else if (this.floating && rect.top > 0) {
        this.unfloat();
      }
      this.update_height();
    },

    scroll_save: function () {
      if (this.cont) {
        this.scroll_pos = this.cont.scrollTop;
      }
    },

    scroll_restore: function () {
      if (this.cont) {
        this.cont.scrollTop = this.scroll_pos;
      }
    },

    add_ignore_element: function(elem) {
      this.ignore_elements.push(elem);
    }
  };

  _.extend(_.Floater, {
    instances: [],
    initialized: false,

    init: function() {
      if (_.Floater.initialized) {
        return;
      }
      _.Floater.instances.forEach(function(inst) {
        inst.init();
      });

      _.listen(w, 'scroll', _.Floater.update_float, true);
      _.listen(w, 'resize', _.Floater.update_height, true);
      _.Floater.initialized = true;
    },

    auto_run: function(func) {
      if (_.conf.general.float_tag_list === 1) {
        func();
      } else if (_.conf.general.float_tag_list === 2) {
        _.pager.wait(func);
      }
    },

    update_float: function() {
      _.Floater.instances.forEach(function(inst) {
        inst.update_float();
      });
    },

    update_height: function() {
      _.Floater.instances.forEach(function(inst) {
        inst.update_height();
      });
    }
  });

  _.page_procs = {
    '/member_illust.php': [
      function() {
        var re;
        if (w.location.hash === '#pp-manga-thumbnail') {
          var toggle_thumbnail = _.q('#toggle-thumbnail');
          _.send_click(toggle_thumbnail);
        } else if ((re = _.re.hash_manga_page.exec(w.location.hash))) {
          try {
            w.pixiv.manga.move(g.parseInt(re[1], 10));
          } catch(ex) { }
        }
      },

      function(query) {
        if (query.mode !== 'medium' || !query.illust_id) {
          return;
        }

        _.process_caption(_.q('.work-info .caption'));

        var manga = _.q('.works_display a[href*="mode=manga"]');
        if (manga) {
          var illust = _.illust.create(
            _.q('.works_display a[href*="mode=manga"]'),
            ['_m'],
            function() {
              _.popup.manga.start();
            }
          );
          _.illust.load(illust);
        }
      }
    ],

    '/bookmark.php': [
      function(query) {
        var bookmark_list;
        if (_.conf.bookmark.tag_order.length < 1
            || query.id
            || !(bookmark_list = _.q('#bookmark_list ul'))) {
          return;
        }

        var first_list, items = _.tag('li', bookmark_list);
        first_list = bookmark_list.cloneNode(false);
        items[0].parentNode.removeChild(items[0]);
        items[1].parentNode.removeChild(items[1]);
        first_list.appendChild(items[0]);
        first_list.appendChild(items[1]);
        bookmark_list.parentNode.insertBefore(first_list, bookmark_list);

        var lists = _.reorder_tag_list(bookmark_list, function(item) {
          var a = _.tag('a', item)[0];
          if (!a || !a.firstChild || a.firstChild.nodeType !== w.Node.TEXT_NODE) {
            return null;
          }
          return a.firstChild.nodeValue;
        });

        lists.forEach(function(list, idx) {
          list.style.cssText += _.conf.general.tag_separator_style;
        });

        if (!first_list) {
          first_list = lists[0];
        }

        try {
          var _bookmarkToggle = w.bookmarkToggle;
          w.bookmarkToggle = function() {
            _bookmarkToggle.apply(this, arguments);
            lists.forEach(function(list) {
              list.className = first_list.className;
            });
          };

          if (!first_list.classList.contains('tagCloud')) {
            w.bookmarkToggle('bookmark_list', 'cloud');
            w.bookmarkToggle('bookmark_list', 'flat');
          }
        } catch(ex) { }

      }, function(query) {
        var form          = _.q('form[action*="bookmark_setting.php"]'),
            msgbox_bottom = _.q('.msgbox_bottom');
        if (form && msgbox_bottom) {
          _.Floater.auto_run(function() {
            msgbox_bottom.parentNode.removeChild(msgbox_bottom);
            form.insertBefore(msgbox_bottom, form.firstChild);
            msgbox_bottom.style.border = 'none';
            new _.Floater(msgbox_bottom);
          });
        }
      }
    ]
  };

  _.run = function() {
    _.run = function() { };

    if (_extension_data) {
      _.conf.__init({
        getItem: function(key) {
          return _extension_data.conf[key] || null;
        },

        setItem: function(key, value) {
          _extension_data.conf[key] = value;
        }
      });
    } else {
      _.conf.__init(g.localStorage);
    }

    _.log('version=%s', _.version());
    if (_.q('#login-block')) {
      _.log('not logged in');
      return;
    }

    _.lang.current = (
      _.lang[d.documentElement.getAttribute('lang')]
        || _.lang[g.navigator.language]
        || _.lang.en
    );
    _.key.init();

    _.e('style', {text: _.css}, d.body);
    _.configui.init(_.q('#global-header'), _.q('#global-header nav.site-menu ul'), _extension_data);

    if (_.conf.general.redirect_jump_page === 1 && w.location.pathname === '/jump.php') {
      w.location.href = g.decodeURIComponent(w.location.search.substring(1));
      return;
    }
    _.redirect_jump_page();

    if (_.conf.general.bookmark_hide) {
      _.qa('a[href*="bookmark.php"]').forEach(function(link) {
        var re;
        if ((re = _.re.url_bookmark.exec(link.href))) {
          if (re[1]) {
            var query = _.url.parse_query(re[1]);
            if (!query.id && !query.rest) {
              link.href += '&rest=hide';
            }
          } else {
            link.href += '?rest=hide';
          }
        }
      });
    }

    if (_.conf.general.stacc_link && _.conf.general.stacc_link !== 'nochange') {
      var stacc_anc;
      if (['all', 'mypixiv', 'favorite', 'self'].indexOf(_.conf.general.stacc_link) < 0) {
        _.log('[Error] Invalid value - conf.genera.stacc_link=' + _.conf.general.stacc_link);
      } else if ((stacc_anc = _.q('.global-menu li.stacc a'))) {
        stacc_anc.href = '/stacc/my/home/' + _.conf.general.stacc_link + '/all';
      }
    }

    var user_bookmark = _.q('.person_menu #favorite-container #favorite-button');
    if (user_bookmark) {
      _.onclick(user_bookmark, function() {
        if (user_bookmark.classList.contains('added') || _.conf.general.fast_user_bookmark <= 0) {
          return;
        }
        g.setTimeout(function() {
          var dialog = _.q('.person_menu #favorite-container #favorite-preference');
          if (!dialog) {
            return;
          }
          var form = _.tag('form', dialog)[0];
          if (!form) {
            return;
          }
          var radio = _.q('input[name="restrict"][value="'
                          + (_.conf.general.fast_user_bookmark - 1) + '"]',
                          form);
          if (!radio) {
            return;
          }
          radio.checked = true;
          _.xhr.post(form, function() {
            user_bookmark.classList.remove('open');
            user_bookmark.classList.add('added');
          });
          _.send_click(_.q('.close', dialog));
        }, 10);
      });
    }

    if (_.page_procs[w.location.pathname]) {
      var query = _.url.parse_query(w.location.search);
      _.page_procs[w.location.pathname].forEach(function(func) {
        func(query);
      });
    }

    _.Floater.auto_run(function() {
      var wrap = _.q('.ui-layout-west');
      if (!wrap) {
        return;
      }
      var tag_list = _.q('#bookmark_list, .tagCloud', wrap);
      if (!tag_list) {
        return;
      }

      var floater = new _.Floater(wrap, tag_list);
      floater.ignore_elements = _.qa('#touch_introduction', wrap);
    });

    _.e('link', {href: _.url.bookmark_add_css, rel: 'stylesheet'}, d.body);

    if (_.conf.general.disable_effect) {
      try {
        w.jQuery.fx.off = true;
      } catch(ex) { }
    }

    try {
      var rate_apply = w.pixiv.rating.apply, waiting_confirmation;
      w.pixiv.rating.apply = function() {
        if (waiting_confirmation) { // workaround for chromium
          return;
        }

        var msg = _.lang.current.rate_confirm.replace('$point', String(w.pixiv.rating.rate));
        var rate = w.pixiv.rating.rate; // workaround for firefox

        if (_.conf.general.rate_confirm) {
          waiting_confirmation = true; // workaround for chromium
          var confirmed = w.confirm(msg);
          waiting_confirmation = false; // workaround for chromium
          if (!confirmed) {
            if (_.conf.general.debug) {
              _.log('rating cancelled');
            }
            return;
          }
        }

        if (_.conf.general.debug) {
          _.log('send rating');
        }
        w.pixiv.rating.rate = rate; // workaround for firefox
        rate_apply.apply(w.pixiv.rating, arguments);
        _.illust.unload(_.popup.illust);
      };
    } catch(ex) {
      _.log('rating error - %s', g.String(ex));
    }

    _.illust.setup(_.q('#wrapper'));

    _.pager.init();
    _.Floater.init();
  };

  /* __DATA_BEGIN__ */

  _.css = [
    // popup
    '#pp-popup{position:fixed;border:2px solid #aaa;background-color:#fff;padding:0.2em;z-index:20000}',
    '#pp-popup-title a{font-size:120%;font-weight:bold;line-height:1em}',
    '#pp-popup-rightbox{float:right;font-size:80%}',
    '#pp-popup-rightbox a{margin-left:0.2em;font-weight:bold}',
    '#pp-popup-rightbox a.pp-active{color:#888;font-weight:normal}',
    '#pp-popup-status{color:#888}',
    '#pp-popup-header{position:absolute;background-color:#fff;line-height:1.1em;z-index:20001}',
    '#pp-popup-header:not(.pp-show):not(:hover){opacity:0 !important}',
    '.pp-popup-separator{border-top:1px solid #aaa;margin-top:0.1em;padding-top:0.1em}',
    '#pp-popup-caption-wrapper{overflow-y:auto}',
    '#pp-popup-comment{display:none;border-left:3px solid #ccc;margin-left:0.6em;padding-left:0.3em}',
    '#pp-popup.pp-comment-mode #pp-popup-comment{display:block}',
    '#pp-popup-comment-form input{width:80%}',
    '#pp-popup-taglist a[href*="dic.pixiv.net"]{margin-left:0.6em;}',
    '#pp-popup-rating *{margin:0px;padding:0px}',
    '#pp-popup-rating .score dl{display:inline}',
    '#pp-popup-rating .score dt{display:inline;margin-right:0.2em}',
    '#pp-popup-rating .score dd{display:inline;margin-right:0.6em}',
    '#pp-popup-rating .questionnaire{text-align:inherit}',
    '#pp-popup-info{padding-bottom:0.1em}',
    '#pp-popup-author-image{max-height:3.2em;float:left;border:1px solid #aaa;margin-right:0.2em}',
    '#pp-popup-author-image:hover{max-height:none}',
    '#pp-popup-author-status{position:absolute;left:2px;margin-top:2px;display:inline-block;',
    'background-image:url("', _.url.sprite, '")}',
    '#pp-popup-author-status.pp-fav{width:14px;height:14px;background-position:-1701px -547px}',
    '#pp-popup-author-status.pp-fav-m{width:16px;height:14px;background-position:-1701px -480px}',
    '#pp-popup-author-status.pp-mypix{width:14px;height:16px;background-position:-1701px -1px}',
    '#pp-popup-author-image:hover~#pp-popup-author-status{display:none}',
    '#pp-popup-tools{margin-left:0.6em}',
    '#pp-popup-tools a{margin-right:0.6em}',
    '#pp-popup-author-links a{margin-right:0.6em;font-weight:bold}',
    '#pp-popup-image-wrapper{display:block;border:1px solid #aaa;line-height:0;',
    'min-width:480px;min-height:360px}',
    '.pp-popup-olc{position:absolute;cursor:pointer;opacity:0;background-color:#ccc}',
    '.pp-popup-olc.pp-active:hover{opacity:0.6}',
    '#pp-popup-olc-prev{left:0}',
    '#pp-popup-olc-next{right:0}',
    '#pp-popup-image-layout{display:inline-block;font-size:200%}',

    // bookmark
    '#pp-popup-bookmark-wrapper{display:none}',
    '#pp-popup.pp-bookmark-mode #pp-popup-header{display:none}',
    '#pp-popup.pp-bookmark-mode #pp-popup-image-wrapper{display:none}',
    '#pp-popup.pp-bookmark-mode .pp-popup-olc{display:none}',
    '#pp-popup.pp-bookmark-mode #pp-popup-bookmark-wrapper{display:block}',
    '#pp-popup-bookmark-wrapper .bookmain_title{padding:0.2em}',
    '#pp-popup-bookmark-wrapper .box_one_body{padding:0px}',
    '#pp-popup-bookmark-wrapper .box_main_bookmark{margin-top:0px;padding:0.2em}',
    '#pp-popup-bookmark-wrapper .bookmark_recommend_tag{margin:0px 0.2em 0.2em}',
    '#pp-popup-bookmark-wrapper .bookmark_bottom{padding-bottom:0.2em}',

    // tagedit
    '#pp-popup-tagedit-button{color:#888;font-size:90%;margin-left:0.4em}',
    '#pp-popup-tagedit-wrapper{display:none;font-size:12px}',
    '#pp-popup.pp-tagedit-mode #pp-popup-header{display:none}',
    '#pp-popup.pp-tagedit-mode #pp-popup-image-wrapper{display:none}',
    '#pp-popup.pp-tagedit-mode .pp-popup-olc{display:none}',
    '#pp-popup.pp-tagedit-mode #pp-popup-tagedit-wrapper{display:block}',
    '#pp-popup-tagedit-wrapper #tag_edit>div{margin:0px !important}',

    // config ui
    '#pp-config{display:none;line-height:1.1em}',
    '#pp-config ul{list-style-type:none}',
    '#global-header #pp-config{margin:0px auto 4px;width:970px}',
    '#pp-config.pp-show{display:block}',
    '#pp-config-tabbar{margin-bottom:-1px}',
    '#pp-config-tabbar label{cursor:pointer}',
    '#pp-config-close-button{padding:0.2em}',
    '#pp-config-tabbar .pp-config-tab{display:inline-block;padding:0.2em 0.4em;margin:1px 1px 0px 1px}',
    '#pp-config-tabbar .pp-config-tab.pp-active{',
    'margin:0px;border:solid #aaa;border-width:1px 1px 0px 1px;background-color:#fff}',
    '#pp-config-content-wrapper{border:1px solid #aaa;background-color:#fff;padding:0.2em}',
    '#global-header #pp-config-content-wrapper{height:600px;overflow-y:auto}',
    '.pp-config-content{display:none}',
    '.pp-config-content.pp-active{display:block}',
    '.pp-config-content dt{font-weight:bold}',
    '.pp-config-content dd{margin-left:1em}',
    '#pp-config-key-content td:not(.pp-config-key-modeline):first-child{padding-left:1em}',
    '.pp-config-key-modeline{font-weight:bold}',
    '#pp-config-bookmark-content textarea{width:100%;height:20em;',
    'box-sizing:border-box;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;margin-bottom:1em}',
    '#pp-config-bookmark-tag-aliases{width:100%}',
    '#pp-config-bookmark-tag-aliases td:last-child{width:100%}',
    '#pp-config-bookmark-tag-aliases td:last-child input{width:100%;',
    'box-sizing:border-box;-webkit-box-sizing:border-box;-moz-box-sizing:border-box}',
    '#pp-config-importexport-toolbar{margin-bottom:0.2em}',
    '#pp-config-importexport-toolbar button{margin-right:0.2em}',
    '#pp-config-importexport-content textarea{width:100%;height:30em;',
    'box-sizing:border-box;-webkit-box-sizing:border-box;-moz-box-sizing:border-box}',
    '#pp-config-langbar{margin-bottom:0.2em;padding-bottom:0.2em;border-bottom:1px solid #aaa}',
    '#pp-config-langbar button{margin-right:0.2em;padding:0.2em 0.4em}',
    '.pp-config-bitfield-list{position:absolute;border:1px solid #888;background-color:#fff}',
    '.pp-config-bitfield-list li{padding:0.2em 0.4em;cursor:pointer}',
    '.pp-config-bitfield-list li.pp-active{background-color:#ddf;font-weight:bold}',

    // key editor
    '.pp-config-key-editor ul button{padding:0px;margin-right:0.2em}',
    '.pp-config-key-editor-add-line{margin-top:0.2em}',
    '.pp-config-key-editor-add-line button{margin-left:0.2em}',

    // bookmark form
    '.pp-tag-select{outline:2px solid #0f0}',

    // floater
    '.pp-float{position:fixed;top:0px}',
    '.msgbox_bottom.pp-float{z-index:90;opacity:0.6}',
    '.msgbox_bottom.pp-float:hover{opacity:1;}'
  ].join('');

  _.conf.__schema = [
    // __CONFIG_BEGIN__
    {"name": "general", "items": [
      {"key": "debug", "value": false},
      {"key": "bookmark_hide", "value": false},
      {"key": "float_tag_list", "value": 2},
      {"key": "tag_separator_style", "value": "border-top:2px solid #dae1e7;"},
      {"key": "stacc_link", "value": ""},
      {"key": "rate_confirm", "value": true},
      {"key": "disable_effect", "value": false},
      {"key": "fast_user_bookmark", "value": 0},
      {"key": "redirect_jump_page", "value": 1},
      {"key": "workaround", "value": 0, "hidden": true}
    ]},
    {"name": "popup", "items": [
      {"key": "preload", "value": true},
      {"key": "big_image", "value": false},
      {"key": "caption_height", "value": 0.4},
      {"key": "caption_minheight", "value": 160},
      {"key": "caption_opacity", "value": 0.9},
      {"key": "remove_pixpedia", "value": false},
      {"key": "rate_key", "value": true},
      {"key": "font_size", "value": ""},
      {"key": "auto_manga", "value": 0},
      {"key": "auto_manga_regexp", "value": "/(?:bookmark_new_illust|member_illust|mypage|ranking|bookmark)\\.php"},
      {"key": "reverse", "value": 0},
      {"key": "reverse_regexp", "value": "/(?:bookmark_new_illust|member_illust|mypage)\\.php"},
      {"key": "overlay_control", "value": 0},
      {"key": "scroll_height", "value": 32},
      {"key": "author_status_icon", "value": true},
      {"key": "show_comment_form", "value": true},
      {"key": "mouse_wheel", "value": 2},
      {"key": "mouse_wheel_delta", "value": 1}
    ]},
    {"name": "key", "items": [
      {"key": "popup_prev", "value": "Backspace,a", "mode": "normal"},
      {"key": "popup_prev_direction", "value": "Left"},
      {"key": "popup_next", "value": "Space"},
      {"key": "popup_next_direction", "value": "Right"},
      {"key": "popup_first", "value": "Home"},
      {"key": "popup_last", "value": "End"},
      {"key": "popup_close", "value": "Escape"},
      {"key": "popup_caption_scroll_up", "value": "Up"},
      {"key": "popup_caption_scroll_down", "value": "Down"},
      {"key": "popup_caption_toggle", "value": "c"},
      {"key": "popup_comment_toggle", "value": "Shift+c"},
      {"key": "popup_open", "value": "Shift+f"},
      {"key": "popup_open_big", "value": "f"},
      {"key": "popup_open_profile", "value": "e"},
      {"key": "popup_open_illust", "value": "r"},
      {"key": "popup_open_bookmark", "value": "t"},
      {"key": "popup_open_staccfeed", "value": "y"},
      {"key": "popup_open_response", "value": "Shift+r"},
      {"key": "popup_reload", "value": "g"},
      {"key": "popup_open_bookmark_detail", "value": "Shift+b"},
      {"key": "popup_open_manga_thumbnail", "value": "Shift+v"},
      {"key": "popup_rate01", "value": "Shift+0,Shift+~"},
      {"key": "popup_rate02", "value": "Shift+9,Shift+)"},
      {"key": "popup_rate03", "value": "Shift+8,Shift+("},
      {"key": "popup_rate04", "value": "Shift+7,Shift+'"},
      {"key": "popup_rate05", "value": "Shift+6,Shift+&"},
      {"key": "popup_rate06", "value": "Shift+5,Shift+%"},
      {"key": "popup_rate07", "value": "Shift+4,Shift+$"},
      {"key": "popup_rate08", "value": "Shift+3,Shift+#"},
      {"key": "popup_rate09", "value": "Shift+2,Shift+\""},
      {"key": "popup_rate10", "value": "Shift+1,Shift+!"},
      {"key": "popup_bookmark_start", "value": "b", "start_mode": "bookmark"},
      {"key": "popup_manga_start", "value": "v", "start_mode": "manga"},
      {"key": "popup_qrate_start", "value": "d", "start_mode": "question"},
      {"key": "popup_tag_edit_start", "value": "", "start_mode": "tagedit"},
      {"key": "popup_bookmark_submit", "value": "Enter,Space", "mode": "bookmark"},
      {"key": "popup_bookmark_end", "value": "Escape", "end_mode": "bookmark"},
      {"key": "popup_manga_open_page", "value": "Shift+f", "mode": "manga"},
      {"key": "popup_manga_end", "value": "v,Escape", "end_mode": "manga"},
      {"key": "popup_qrate_select_prev", "value": "Up", "mode": "question"},
      {"key": "popup_qrate_select_next", "value": "Down", "mode": "question"},
      {"key": "popup_qrate_submit", "value": "Enter,Space", "mode": "question"},
      {"key": "popup_qrate_end", "value": "Escape,d", "end_mode": "question"},
      {"key": "popup_tag_edit_end", "value": "Escape", "end_mode": "tagedit"}
    ]},
    {"name": "bookmark", "items": [
      {"key": "tag_order", "value": ""},
      {"key": "tag_aliases", "value": ""}
    ]}
    // __CONFIG_END__
  ];

  _.lang = {
    en: {
      __name__: 'en',

      pref: {
        general: 'General',
        popup: 'Popup',
        key: 'Key',
        bookmark: 'Tags',
        importexport: 'Import/Export',
        'export': 'Export',
        'import': 'Import',
        about: 'About',
        changelog: 'Changelog',
        debug: 'Debug',
        'default': 'Default',
        add: 'Add',
        close: 'Close'
      },

      conf: {
        general: {
          debug: 'Debug mode',
          bookmark_hide: 'Make private bookmark by default',
          float_tag_list: {
            desc: 'Enable float view for tag list',
            hint: ['Disable', 'Enable', 'Pager']
          },
          tag_separator_style: 'Separator style for tag list',
          stacc_link: {
            desc: 'Change \'Stacc feed\' link',
            hint: [{value: 'nochange', desc: 'Do not change'},
                   {value: 'all', desc: 'All'},
                   {value: 'favorite', desc: 'Favorite'},
                   {value: 'mypixiv', desc: 'MyPixiv'},
                   {value: 'self', desc: 'Self'}]
          },
          rate_confirm: 'Show confirmation dialog when rating',
          disable_effect: 'Disable UI animation',
          fast_user_bookmark: {
            desc: 'Add favorite user by one-click',
            hint: ['Disable', 'Enable(public)', 'Enable(private)']
          },
          redirect_jump_page: {
            desc: 'Redirect jump.php',
            hint: ['Disable', 'Open target', 'Modify link']
          },
          workaround: 'Workaround (debug mode only)'
        },

        popup: {
          preload: 'Enable preloading',
          big_image: 'Use original size image',
          caption_height: 'Caption height(ratio)',
          caption_minheight: 'Caption minimum height(px)',
          caption_opacity: 'Caption opacity',
          remove_pixpedia: 'Remove pixpedia icon',
          rate_key: 'Enable rate keys',
          font_size: 'Font size(e.g. 10px)',
          auto_manga: {
            desc: 'Switch manga-mode automatically',
            hint: ['Disable', 'Enable', 'Specify pages by regexp']
          },
          auto_manga_regexp: 'Regular expression for "Switch manga..." setting.',
          reverse: {
            desc: 'Reverse move direction',
            hint: ['Disable', 'Enable', 'Specify pages by regexp']
          },
          reverse_regexp: 'Regular expression for "Reverse..." setting.',
          overlay_control: 'Click area width(0:Disable/<1:Ratio/>1:Pixel)',
          scroll_height: 'Scroll step for caption',
          author_status_icon: 'Show icon on profile image',
          show_comment_form: 'Show comment posting form',
          mouse_wheel: {
            desc: 'Mouse wheel operation',
            hint: ['Do nothing', 'Move to prev/next illust', 'Move to prev/next illust(respect "reverse" setting)']
          },
          mouse_wheel_delta: 'Threshold for mouse wheel setting(if set negative value, invert direction)'
        },

        key: {
          popup_prev: 'Move to previous illust',
          popup_prev_direction: 'Move to previous illust(ignore conf.popup.reverse)',
          popup_next: 'Move to next illust',
          popup_next_direction: 'Move to next illust(ignore conf.popup.reverse)',
          popup_first: 'Move to first illust',
          popup_last: 'Move to last illust',
          popup_close: 'Close',
          popup_caption_scroll_up: 'Scroll caption up',
          popup_caption_scroll_down: 'Scroll caption down',
          popup_caption_toggle: 'Toggle caption display',
          popup_comment_toggle: 'Toggle comment',
          popup_open: 'Open illust page',
          popup_open_big: 'Open image',
          popup_open_profile: 'Open profile',
          popup_open_illust: 'Open works',
          popup_open_bookmark: 'Open bookmark',
          popup_open_staccfeed: 'Open staccfeed',
          popup_open_response: 'Open image response',
          popup_reload: 'Reload',
          popup_open_bookmark_detail: 'Open bookmark information page',
          popup_open_manga_thumbnail: 'Open manga thumbnail page',
          popup_rate01: 'Rate(1pt)',
          popup_rate02: 'Rate(2pt)',
          popup_rate03: 'Rate(3pt)',
          popup_rate04: 'Rate(4pt)',
          popup_rate05: 'Rate(5pt)',
          popup_rate06: 'Rate(6pt)',
          popup_rate07: 'Rate(7pt)',
          popup_rate08: 'Rate(8pt)',
          popup_rate09: 'Rate(9pt)',
          popup_rate10: 'Rate(10pt)',
          popup_bookmark_submit: 'Send',
          popup_manga_open_page: 'Open manga page',
          popup_qrate_select_prev: 'Select previous item',
          popup_qrate_select_next: 'Select next item',
          popup_qrate_submit: 'Send',
          mode_start: 'Start $mode',
          mode_end: 'End $mode'
        },

        mode: {
          normal: 'Normal',
          bookmark: 'Bookmark mode',
          manga: 'Manga mode',
          question: 'Questionnaire mode',
          tagedit: 'Tag edit mode'
        },

        bookmark: {
          tag_order: 'Reorder tags. 1 tag per line.\n-: Separator\n*: Others',
          tag_aliases: 'Tag aliases. Used for auto input. Separated by space.'
        }
      },

      repost: ' (Re: $month/$date/$year $hour:$minute)',
      rate_confirm: 'Rate it?\n$pointpt',
      author_works: 'Works',
      author_bookmarks: 'Bookmarks',
      author_staccfeed: 'Staccfeed',
      sending: 'Sending',
      importing: 'Importing'
    },

    ja: {
      __name__: 'ja',

      pref: {
        general: '\u5168\u822c',
        popup: '\u30dd\u30c3\u30d7\u30a2\u30c3\u30d7',
        key: '\u30ad\u30fc',
        bookmark: '\u30bf\u30b0',
        importexport: '\u30a4\u30f3\u30dd\u30fc\u30c8/\u30a8\u30af\u30b9\u30dd\u30fc\u30c8',
        'export': '\u30a8\u30af\u30b9\u30dd\u30fc\u30c8',
        'import': '\u30a4\u30f3\u30dd\u30fc\u30c8',
        about: '\u60c5\u5831',
        changelog: '\u66f4\u65b0\u5c65\u6b74',
        debug: '\u30c7\u30d0\u30c3\u30b0',
        'default': '\u30c7\u30d5\u30a9\u30eb\u30c8',
        add: '\u8ffd\u52a0',
        close: '\u9589\u3058\u308b'
      },

      conf: {
        general: {
          debug: '\u30c7\u30d0\u30c3\u30b0\u30e2\u30fc\u30c9',
          bookmark_hide: '\u30d6\u30c3\u30af\u30de\u30fc\u30af\u975e\u516c\u958b\u3092\u30c7\u30d5\u30a9\u30eb\u30c8\u306b\u3059\u308b',
          float_tag_list: {
            desc: '\u30bf\u30b0\u30ea\u30b9\u30c8\u3092\u30d5\u30ed\u30fc\u30c8\u8868\u793a\u3059\u308b',
            hint: ['\u7121\u52b9', '\u6709\u52b9', '\u30da\u30fc\u30b8\u30e3']
          },
          tag_separator_style: '\u30bf\u30b0\u30ea\u30b9\u30c8\u306e\u30bb\u30d1\u30ec\u30fc\u30bf\u306e\u30b9\u30bf\u30a4\u30eb',
          stacc_link: {
            desc: '\u4e0a\u90e8\u30e1\u30cb\u30e5\u30fc\u306e\u300c\u30b9\u30bf\u30c3\u30af\u30d5\u30a3\u30fc\u30c9\u300d\u306e\u30ea\u30f3\u30af\u5148',
            hint: [{value: 'nochange', desc: '\u5909\u66f4\u3057\u306a\u3044'},
                   {value: 'all', desc: '\u3059\u3079\u3066'},
                   {value: 'favorite', desc: '\u304a\u6c17\u306b\u5165\u308a'},
                   {value: 'mypixiv', desc: '\u30de\u30a4\u30d4\u30af'},
                   {value: 'self', desc: '\u3042\u306a\u305f'}]
          },
          rate_confirm: '\u30a4\u30e9\u30b9\u30c8\u3092\u8a55\u4fa1\u3059\u308b\u6642\u306b\u78ba\u8a8d\u3092\u3068\u308b',
          disable_effect: '\u30a2\u30cb\u30e1\u30fc\u30b7\u30e7\u30f3\u306a\u3069\u306e\u30a8\u30d5\u30a7\u30af\u30c8\u3092\u7121\u52b9\u5316\u3059\u308b',
          fast_user_bookmark: {
            desc: '\u304a\u6c17\u306b\u5165\u308a\u30e6\u30fc\u30b6\u30fc\u306e\u8ffd\u52a0\u3092\u30ef\u30f3\u30af\u30ea\u30c3\u30af\u3067\u884c\u3046',
            hint: ['\u7121\u52b9', '\u6709\u52b9(\u516c\u958b)', '\u6709\u52b9(\u975e\u516c\u958b)']
          },
          redirect_jump_page: {
            desc: 'jump.php\u3092\u30ea\u30c0\u30a4\u30ec\u30af\u30c8\u3059\u308b',
            hint: ['\u7121\u52b9', '\u30da\u30fc\u30b8\u3092\u958b\u304f', '\u30ea\u30f3\u30af\u3092\u5909\u66f4']
          },
          workaround: '\u30ef\u30fc\u30af\u30a2\u30e9\u30a6\u30f3\u30c9 (\u30c7\u30d0\u30c3\u30b0\u30e2\u30fc\u30c9\u306e\u307f)'
        },

        popup: {
          preload: '\u5148\u8aad\u307f\u3092\u4f7f\u7528\u3059\u308b',
          big_image: '\u539f\u5bf8\u306e\u753b\u50cf\u3092\u8868\u793a\u3059\u308b',
          caption_height: '\u30ad\u30e3\u30d7\u30b7\u30e7\u30f3\u306e\u9ad8\u3055(\u7387)',
          caption_minheight: '\u30ad\u30e3\u30d7\u30b7\u30e7\u30f3\u306e\u9ad8\u3055\u306e\u6700\u5c0f\u5024(px)',
          caption_opacity: '\u30ad\u30e3\u30d7\u30b7\u30e7\u30f3\u306e\u4e0d\u900f\u660e\u5ea6',
          remove_pixpedia: '\u30bf\u30b0\u306epixpedia\u30a2\u30a4\u30b3\u30f3\u3092\u9664\u53bb\u3059\u308b',
          rate_key: '\u8a55\u4fa1\u306e\u30ad\u30fc\u30d0\u30a4\u30f3\u30c9\u3092\u6709\u52b9\u306b\u3059\u308b',
          font_size: '\u30d5\u30a9\u30f3\u30c8\u30b5\u30a4\u30ba(\u4f8b: 10px)',
          auto_manga: {
            desc: '\u81ea\u52d5\u7684\u306b\u30de\u30f3\u30ac\u30e2\u30fc\u30c9\u3092\u958b\u59cb\u3059\u308b',
            hint: ['\u7121\u52b9', '\u6709\u52b9', '\u30da\u30fc\u30b8\u3092\u6b63\u898f\u8868\u73fe\u3067\u6307\u5b9a']
          },
          auto_manga_regexp: '"\u81ea\u52d5\u7684\u306b\u30de\u30f3\u30ac\u30e2\u30fc\u30c9\u3092\u958b\u59cb\u3059\u308b"\u3067\u4f7f\u7528\u3059\u308b\u6b63\u898f\u8868\u73fe',
          reverse: {
            desc: '\u79fb\u52d5\u65b9\u5411\u3092\u53cd\u5bfe\u306b\u3059\u308b',
            hint: ['\u7121\u52b9', '\u6709\u52b9', '\u30da\u30fc\u30b8\u3092\u6b63\u898f\u8868\u73fe\u3067\u6307\u5b9a']
          },
          reverse_regexp: '"\u79fb\u52d5\u65b9\u5411\u3092\u53cd\u5bfe\u306b\u3059\u308b"\u3067\u4f7f\u7528\u3059\u308b\u6b63\u898f\u8868\u73fe',
          overlay_control: '\u79fb\u52d5\u7528\u30af\u30ea\u30c3\u30af\u30a4\u30f3\u30bf\u30fc\u30d5\u30a7\u30fc\u30b9\u306e\u5e45(0:\u4f7f\u7528\u3057\u306a\u3044/<1:\u753b\u50cf\u306b\u5bfe\u3059\u308b\u5272\u5408/>1:\u30d4\u30af\u30bb\u30eb)',
          scroll_height: '\u4e0a\u4e0b\u30ad\u30fc\u3067\u30ad\u30e3\u30d7\u30b7\u30e7\u30f3\u3092\u30b9\u30af\u30ed\u30fc\u30eb\u3059\u308b\u9ad8\u3055',
          author_status_icon: '\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb\u753b\u50cf\u306e\u5de6\u4e0a\u306b\u30a2\u30a4\u30b3\u30f3\u3092\u8868\u793a\u3059\u308b',
          show_comment_form: '\u30b3\u30e1\u30f3\u30c8\u306e\u6295\u7a3f\u30d5\u30a9\u30fc\u30e0\u3092\u8868\u793a\u3059\u308b',
          mouse_wheel: {
            desc: '\u30de\u30a6\u30b9\u30db\u30a4\u30fc\u30eb\u306e\u52d5\u4f5c',
            hint: ['\u4f55\u3082\u3057\u306a\u3044', '\u524d/\u6b21\u306e\u30a4\u30e9\u30b9\u30c8\u306b\u79fb\u52d5', '\u524d/\u6b21\u306e\u30a4\u30e9\u30b9\u30c8\u306b\u79fb\u52d5(\u53cd\u8ee2\u306e\u8a2d\u5b9a\u306b\u5f93\u3046)']
          },
          mouse_wheel_delta: '\u30db\u30a4\u30fc\u30eb\u8a2d\u5b9a\u306e\u95be\u5024(\u8ca0\u6570\u306e\u5834\u5408\u306f\u65b9\u5411\u3092\u53cd\u8ee2)'
        },

        key: {
          popup_prev: '\u524d\u306e\u30a4\u30e9\u30b9\u30c8\u306b\u79fb\u52d5',
          popup_prev_direction: '\u524d\u306e\u30a4\u30e9\u30b9\u30c8\u306b\u79fb\u52d5(conf.popup.reverse\u306e\u5f71\u97ff\u3092\u53d7\u3051\u306a\u3044)',
          popup_next: '\u6b21\u306e\u30a4\u30e9\u30b9\u30c8\u306b\u79fb\u52d5',
          popup_next_direction: '\u6b21\u306e\u30a4\u30e9\u30b9\u30c8\u306b\u79fb\u52d5(conf.popup.reverse\u306e\u5f71\u97ff\u3092\u53d7\u3051\u306a\u3044)',
          popup_first: '\u6700\u521d\u306e\u30a4\u30e9\u30b9\u30c8\u306b\u79fb\u52d5',
          popup_last: '\u6700\u5f8c\u306e\u30a4\u30e9\u30b9\u30c8\u306b\u79fb\u52d5',
          popup_close: '\u9589\u3058\u308b',
          popup_caption_scroll_up: '\u30ad\u30e3\u30d7\u30b7\u30e7\u30f3\u3092\u4e0a\u306b\u30b9\u30af\u30ed\u30fc\u30eb\u3059\u308b',
          popup_caption_scroll_down: '\u30ad\u30e3\u30d7\u30b7\u30e7\u30f3\u3092\u4e0b\u306b\u30b9\u30af\u30ed\u30fc\u30eb\u3059\u308b',
          popup_caption_toggle: '\u30ad\u30e3\u30d7\u30b7\u30e7\u30f3\u306e\u5e38\u6642\u8868\u793a/\u81ea\u52d5\u8868\u793a\u3092\u5207\u308a\u66ff\u3048\u308b',
          popup_comment_toggle: '\u30b3\u30e1\u30f3\u30c8\u8868\u793a\u3092\u5207\u308a\u66ff\u3048',
          popup_open: '\u30a4\u30e9\u30b9\u30c8\u30da\u30fc\u30b8\u3092\u958b\u304f',
          popup_open_big: '\u30a4\u30e9\u30b9\u30c8\u753b\u50cf\u3092\u958b\u304f',
          popup_open_profile: '\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb\u3092\u958b\u304f',
          popup_open_illust: '\u4f5c\u54c1\u4e00\u89a7\u3092\u958b\u304f',
          popup_open_bookmark: '\u30d6\u30c3\u30af\u30de\u30fc\u30af\u3092\u958b\u304f',
          popup_open_staccfeed: '\u30b9\u30bf\u30c3\u30af\u30d5\u30a3\u30fc\u30c9\u3092\u958b\u304f',
          popup_open_response: '\u30a4\u30e1\u30fc\u30b8\u30ec\u30b9\u30dd\u30f3\u30b9\u4e00\u89a7\u3092\u958b\u304f',
          popup_reload: '\u30ea\u30ed\u30fc\u30c9',
          popup_open_bookmark_detail: '\u30d6\u30c3\u30af\u30de\u30fc\u30af\u8a73\u7d30\u30da\u30fc\u30b8\u3092\u958b\u304f',
          popup_open_manga_thumbnail: '\u30de\u30f3\u30ac\u30b5\u30e0\u30cd\u30a4\u30eb\u30da\u30fc\u30b8\u3092\u958b\u304f',
          popup_rate01: '\u8a55\u4fa1\u3059\u308b(1\u70b9)',
          popup_rate02: '\u8a55\u4fa1\u3059\u308b(2\u70b9)',
          popup_rate03: '\u8a55\u4fa1\u3059\u308b(3\u70b9)',
          popup_rate04: '\u8a55\u4fa1\u3059\u308b(4\u70b9)',
          popup_rate05: '\u8a55\u4fa1\u3059\u308b(5\u70b9)',
          popup_rate06: '\u8a55\u4fa1\u3059\u308b(6\u70b9)',
          popup_rate07: '\u8a55\u4fa1\u3059\u308b(7\u70b9)',
          popup_rate08: '\u8a55\u4fa1\u3059\u308b(8\u70b9)',
          popup_rate09: '\u8a55\u4fa1\u3059\u308b(9\u70b9)',
          popup_rate10: '\u8a55\u4fa1\u3059\u308b(10\u70b9)',
          popup_bookmark_submit: '\u9001\u4fe1',
          popup_manga_open_page: '\u8868\u793a\u3057\u3066\u3044\u308b\u30da\u30fc\u30b8\u3092\u958b\u304f\u3002',
          popup_qrate_select_prev: '\u524d\u306e\u9078\u629e\u80a2\u3092\u9078\u629e',
          popup_qrate_select_next: '\u6b21\u306e\u9078\u629e\u80a2\u3092\u9078\u629e',
          popup_qrate_submit: '\u9001\u4fe1',
          mode_start: '$mode\u958b\u59cb',
          mode_end: '$mode\u7d42\u4e86'
        },

        mode: {
          normal: '\u901a\u5e38',
          bookmark: '\u30d6\u30c3\u30af\u30de\u30fc\u30af\u7de8\u96c6\u30e2\u30fc\u30c9',
          manga: '\u30de\u30f3\u30ac\u30e2\u30fc\u30c9',
          question: '\u30a2\u30f3\u30b1\u30fc\u30c8\u30e2\u30fc\u30c9',
          tagedit: '\u30bf\u30b0\u7de8\u96c6\u30e2\u30fc\u30c9'
        },

        bookmark: {
          tag_order: '\u30d6\u30c3\u30af\u30de\u30fc\u30af\u30bf\u30b0\u306e\u4e26\u3079\u66ff\u3048\u3068\u30b0\u30eb\u30fc\u30d4\u30f3\u30b0\u30021\u884c1\u30bf\u30b0\u3002\n-: \u30bb\u30d1\u30ec\u30fc\u30bf\n*: \u6b8b\u308a\u5168\u90e8',
          tag_aliases: '\u30bf\u30b0\u306e\u30a8\u30a4\u30ea\u30a2\u30b9\u3002\u81ea\u52d5\u5165\u529b\u306b\u4f7f\u7528\u3059\u308b\u3002\u30b9\u30da\u30fc\u30b9\u533a\u5207\u308a\u3002'
        }
      },

      repost: ' (\u518d: $year\u5e74$month\u6708$date\u65e5 $hour:$minute)',
      rate_confirm: '\u8a55\u4fa1\u3057\u307e\u3059\u304b\uff1f\n$point\u70b9',
      author_works: '\u4f5c\u54c1',
      author_bookmarks: '\u30d6\u30c3\u30af\u30de\u30fc\u30af',
      author_staccfeed: '\u30b9\u30bf\u30c3\u30af\u30d5\u30a3\u30fc\u30c9',
      sending: '\u9001\u4fe1\u4e2d',
      importing: '\u30a4\u30f3\u30dd\u30fc\u30c8\u4e2d'
    }
  };

  _.changelog = [{
    date: '2012/08/27', version: '1.2.0', changes_i18n: {
      en: [
        '[Add] Add "Redirect jump.php" setting.',
        '[Fix] Fix control key support for DOM3Events.',
        '[Fix] Improve auto-manga-mode feature.',
        '[Fix] Support "new Staccfeed" page.'
      ],
      ja: [
        '[\u8ffd\u52a0] "jump.php\u3092\u30ea\u30c0\u30a4\u30ec\u30af\u30c8\u3059\u308b"\u8a2d\u5b9a\u3092\u8ffd\u52a0\u3002',
        '[\u4fee\u6b63] DOM3Event\u306eControl\u30ad\u30fc\u30b5\u30dd\u30fc\u30c8\u3092\u4fee\u6b63\u3002',
        '[\u4fee\u6b63] \u81ea\u52d5\u30de\u30f3\u30ac\u30e2\u30fc\u30c9\u306e\u6319\u52d5\u3092\u6539\u5584\u3002',
        '[\u4fee\u6b63] \u300c\u65b0\u3057\u3044\u30b9\u30bf\u30c3\u30af\u30d5\u30a3\u30fc\u30c9\u300d\u3092\u30b5\u30dd\u30fc\u30c8\u3002'
      ]
    }

  }, {
    date: '2012/08/14', version: '1.1.1', changes_i18n: {
      en: [
        '[Fix] Header area hidden by click navigator.',
        '[Fix] "Reverse" setting applied in manga mode.',
        '[Fix] Can\'t read old manga if "Use original size image" is enabled.',
        '[Fix] Can\'t add or modify bookmark in staccfeed page.',
        '[Change] Change default value for some preferences.',
        '[Fix][WebKit] Status field layout is broken while loading.'
      ],
      ja: [
        '[\u4fee\u6b63] \u30af\u30ea\u30c3\u30af\u30ca\u30d3\u30b2\u30fc\u30b7\u30e7\u30f3\u306eUI\u3067\u30d8\u30c3\u30c0\u9818\u57df\u304c\u96a0\u308c\u3066\u3057\u307e\u3046\u30d0\u30b0\u3092\u4fee\u6b63\u3002',
        '[\u4fee\u6b63] "\u79fb\u52d5\u65b9\u5411\u3092\u53cd\u5bfe\u306b\u3059\u308b"\u8a2d\u5b9a\u304c\u30de\u30f3\u30ac\u30e2\u30fc\u30c9\u306b\u3082\u9069\u7528\u3055\u308c\u3066\u3044\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002',
        '[\u4fee\u6b63] "\u539f\u5bf8\u306e\u753b\u50cf\u3092\u8868\u793a\u3059\u308b"\u304c\u6709\u52b9\u306b\u306a\u3063\u3066\u3044\u308b\u3068\u53e4\u3044\u30de\u30f3\u30ac\u4f5c\u54c1\u3092\u95b2\u89a7\u51fa\u6765\u306a\u3044\u30d0\u30b0\u3092\u4fee\u6b63\u3002',
        '[\u4fee\u6b63] \u30b9\u30bf\u30c3\u30af\u30d5\u30a3\u30fc\u30c9\u30da\u30fc\u30b8\u3067\u30d6\u30c3\u30af\u30de\u30fc\u30af\u306e\u8ffd\u52a0\u30fb\u7de8\u96c6\u304c\u51fa\u6765\u306a\u3044\u30d0\u30b0\u3092\u4fee\u6b63\u3002',
        '[\u5909\u66f4] \u3044\u304f\u3064\u304b\u306e\u8a2d\u5b9a\u9805\u76ee\u306e\u30c7\u30d5\u30a9\u30eb\u30c8\u5024\u3092\u5909\u66f4\u3002',
        '[\u4fee\u6b63][WebKit] \u30ed\u30fc\u30c9\u4e2d\u306e\u30b9\u30c6\u30fc\u30bf\u30b9\u8868\u793a\u306e\u30ec\u30a4\u30a2\u30a6\u30c8\u304c\u5909\u306b\u306a\u308b\u306e\u3092\u4fee\u6b63\u3002'
      ]
    }

  }, {
    date: '2012/08/09', version: '1.1.0', changes_i18n: {
      en: [
        '[Add] Open popup from illust link in caption(author comment).',
        '[Add] Add tag edit mode.',
        '[Fix] Don\'t open popup from image-response list in illust page.',
        '[Fix] Improve error handling.',
        '[Fix] Displaying html entity in title and author name.',
        '[Fix] Can\' t move to another illust when in bookmark mode.',
        '[Fix] Various minor bug fixes.',
        '[Fix][Firefox] Can\'t send rating if "Show confirmation dialog when rating" option is on.',
        '[Fix][Firefox] Popup don\'t works on ranking page.'
      ],
      ja: [
        '[\u8ffd\u52a0] \u30ad\u30e3\u30d7\u30b7\u30e7\u30f3\u5185\u306e\u30ea\u30f3\u30af\u304b\u3089\u30dd\u30c3\u30d7\u30a2\u30c3\u30d7\u3092\u958b\u304f\u6a5f\u80fd\u3092\u8ffd\u52a0\u3002',
        '[\u8ffd\u52a0] \u30bf\u30b0\u7de8\u96c6\u6a5f\u80fd\u3092\u8ffd\u52a0\u3002',
        '[\u4fee\u6b63] \u30a4\u30e9\u30b9\u30c8\u30da\u30fc\u30b8\u5185\u306e\u30a4\u30e1\u30fc\u30b8\u30ec\u30b9\u30dd\u30f3\u30b9\u4e00\u89a7\u304b\u3089\u30dd\u30c3\u30d7\u30a2\u30c3\u30d7\u304c\u958b\u304b\u306a\u3044\u30d0\u30b0\u3092\u4fee\u6b63\u3002',
        '[\u4fee\u6b63] \u30a8\u30e9\u30fc\u51e6\u7406\u3092\u6539\u5584\u3002',
        '[\u4fee\u6b63] \u30bf\u30a4\u30c8\u30eb\u3068\u30e6\u30fc\u30b6\u30fc\u540d\u306bHTML\u30a8\u30f3\u30c6\u30a3\u30c6\u30a3\u304c\u8868\u793a\u3055\u308c\u3066\u3044\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002',
        '[\u4fee\u6b63] \u30d6\u30c3\u30af\u30de\u30fc\u30af\u30e2\u30fc\u30c9\u306e\u6642\u306b\u4ed6\u306e\u30a4\u30e9\u30b9\u30c8\u306b\u79fb\u52d5\u51fa\u6765\u306a\u3044\u30d0\u30b0\u3092\u4fee\u6b63\u3002',
        '[\u4fee\u6b63] \u4ed6\u7d30\u304b\u306a\u30d0\u30b0\u4fee\u6b63\u3002',
        '[\u4fee\u6b63][Firefox] \u300c\u30a4\u30e9\u30b9\u30c8\u3092\u8a55\u4fa1\u3059\u308b\u6642\u306b\u78ba\u8a8d\u3092\u3068\u308b\u300d\u30aa\u30d7\u30b7\u30e7\u30f3\u3092\u6709\u52b9\u306b\u3057\u3066\u3044\u308b\u3068\u8a55\u4fa1\u3067\u304d\u306a\u3044\u30d0\u30b0\u3092\u4fee\u6b63\u3002',
        '[\u4fee\u6b63][Firefox] \u30e9\u30f3\u30ad\u30f3\u30b0\u30da\u30fc\u30b8\u3067\u30dd\u30c3\u30d7\u30a2\u30c3\u30d7\u304c\u958b\u304b\u306a\u3044\u30d0\u30b0\u3092\u4fee\u6b63\u3002'
      ]
    }

  }, {
    date: '2012/08/08', version: '1.0.0', changes_i18n: {
      en: [
        'Rewrite whole of source code.',
        '[Add] Add preference to specify minimum height of caption area.',
        '[Remove] Remove tag edit feature.',
        '[Remove] Remove some dead preferences.',
        '[Remove] Remove zoom feature.',
        '[Fix] Fix multilingual support.'
      ],
      ja: [
        '\u5168\u4f53\u7684\u306b\u66f8\u304d\u76f4\u3057\u3002',
        '[\u8ffd\u52a0] \u30ad\u30e3\u30d7\u30b7\u30e7\u30f3\u306e\u9ad8\u3055\u306e\u6700\u5c0f\u5024\u3092\u6307\u5b9a\u3059\u308b\u8a2d\u5b9a\u3092\u8ffd\u52a0\u3002',
        '[\u524a\u9664] \u30bf\u30b0\u7de8\u96c6\u6a5f\u80fd\u3092\u524a\u9664\u3002',
        '[\u524a\u9664] \u6a5f\u80fd\u3057\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u3044\u304f\u3064\u304b\u306e\u8a2d\u5b9a\u9805\u76ee\u3092\u524a\u9664\u3002',
        '[\u524a\u9664] \u30ba\u30fc\u30e0\u6a5f\u80fd\u3092\u524a\u9664\u3002',
        '[\u4fee\u6b63] \u591a\u8a00\u8a9e\u30b5\u30dd\u30fc\u30c8\u3092\u4fee\u6b63\u3002'
      ]
    }

  }, {
    date: '2012/08/05', version: '0.9.4', changes_i18n: {
      en: [
        '[Fix] Rating feature don\'t works.'
      ],
      ja: [
        '[\u4fee\u6b63] \u8a55\u4fa1\u6a5f\u80fd\u304c\u52d5\u304b\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u306e\u3092\u4fee\u6b63\u3002'
      ]
    }

  }, {
    date: '2012/08/03', version: '0.9.3', changes_i18n: {
      en: [
        '[Fix] Support pixiv\'s update.'
      ],
      ja: [
        '[\u4fee\u6b63] pixiv\u306e\u4ed5\u69d8\u5909\u66f4\u306b\u5bfe\u5fdc\u3002'
      ]
    }

  }, {
    date: '2012/06/29', version: '0.9.2', changes_i18n: {
      en: [
        '[Fix] If conf.popup.big_image=0, "S" key (conf.key.popup_open_big) opens medium image.'
      ],
      ja: [
        '[\u4fee\u6b63] conf.popup.big_image=0\u306e\u6642\u3001"S"\u30ad\u30fc(conf.key.popup_open_big)\u3067medium\u306e\u753b\u50cf\u3092\u958b\u3044\u3066\u3044\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002'
      ]
    }

  }, {
    date: '2012/06/26', version: '0.9.1', changes_i18n: {
      en: [
        '[Fix] Corresponds to pixiv\'s spec changes.',
        '[Fix] In reposted illust, pixplus shows first version.'
      ],
      ja: [
        '[\u4fee\u6b63] pixiv\u306e\u4ed5\u69d8\u5909\u66f4\u306b\u5bfe\u5fdc\u3002',
        '[\u4fee\u6b63] \u30a4\u30e9\u30b9\u30c8\u304c\u518d\u6295\u7a3f\u3055\u308c\u3066\u3044\u308b\u5834\u5408\u306b\u53e4\u3044\u753b\u50cf\u3092\u8868\u793a\u3057\u3066\u3044\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002'
      ]
    }

  }, {
    date: '2012/02/17', version: '0.9.0', changes_i18n: {
      en: [
        '[New] Added a setting to change mouse wheel operation. (conf.popup.mouse_wheel)',
        '[Fix] External links in author comment were broken.'
      ],
      ja: [
        '[\u8ffd\u52a0] \u30de\u30a6\u30b9\u30db\u30a4\u30fc\u30eb\u306e\u52d5\u4f5c\u3092\u5909\u66f4\u3059\u308b\u8a2d\u5b9a(conf.popup.mouse_wheel)\u3092\u8ffd\u52a0\u3002',
        '[\u4fee\u6b63] \u30ad\u30e3\u30d7\u30b7\u30e7\u30f3\u5185\u306e\u5916\u90e8\u30ea\u30f3\u30af\u304c\u58ca\u308c\u3066\u3044\u305f\u306e\u3092\u4fee\u6b63\u3002'
      ]
    }

  }, {
    date: '2012/02/11', version: '0.8.3', changes: [
      '\u65b0\u7740\u30a4\u30e9\u30b9\u30c8\u30da\u30fc\u30b8\u3067\u4e0a\u624b\u304f\u52d5\u4f5c\u3057\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002',
      '\u30b9\u30bf\u30c3\u30af\u30d5\u30a3\u30fc\u30c9\u3067\u4e0a\u624b\u304f\u52d5\u4f5c\u3057\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002',
      '\u30bf\u30b0\u30ea\u30b9\u30c8\u306e\u30d5\u30ed\u30fc\u30c8\u8868\u793a\u306e\u52d5\u4f5c\u3092\u4fee\u6b63\u3002'
    ]
  }, {
    date: '2011/10/27', version: '0.8.2', changes: [
      '\u30a2\u30f3\u30b1\u30fc\u30c8\u306b\u56de\u7b54\u3059\u308b\u3068\u30a8\u30e9\u30fc\u30c0\u30a4\u30a2\u30ed\u30b0\u304c\u51fa\u308b\u3088\u3046\u306b\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002',
      '\u30c8\u30c3\u30d7\u30da\u30fc\u30b8(mypage.php)\u3067\u4e0a\u624b\u304f\u52d5\u4f5c\u3057\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002'
    ]
  }, {
    date: '2011/09/17', version: '0.8.1', changes: [
      'pixiv\u306e\u5909\u66f4\u3067\u30a2\u30f3\u30b1\u30fc\u30c8\u306a\u3069\u306e\u52d5\u4f5c\u304c\u304a\u304b\u3057\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002',
      'conf.key.popup_manga_open_page\u306e\u30c7\u30d5\u30a9\u30eb\u30c8\u5024\u304c\u5909\u3060\u3063\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002'
    ]
  }, {
    date: '2011/09/03', version: '0.8.0', changes: [
      '\u30d6\u30c3\u30af\u30de\u30fc\u30af\u7ba1\u7406\u30da\u30fc\u30b8\u3067\u3001\u95b2\u89a7\u51fa\u6765\u306a\u304f\u306a\u3063\u305f\u30a4\u30e9\u30b9\u30c8\u306b\u4e00\u62ec\u3067\u30c1\u30a7\u30c3\u30af\u3092\u5165\u308c\u308b\u6a5f\u80fd\u3092\u8ffd\u52a0\u3002',
      '\u30b3\u30e1\u30f3\u30c8\u3092\u6295\u7a3f\u3059\u308b\u3068\u30b3\u30e1\u30f3\u30c8\u30d5\u30a9\u30fc\u30e0\u304c\u6d88\u3048\u3066\u3057\u307e\u3046\u30d0\u30b0\u3092\u4fee\u6b63\u3002',
      '\u30d6\u30c3\u30af\u30de\u30fc\u30af\u30d5\u30a9\u30fc\u30e0\u3067\u30a8\u30e9\u30fc\u304c\u51fa\u308b\u3088\u3046\u306b\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002',
      '\u8a00\u8a9e\u30b5\u30dd\u30fc\u30c8\u3092\u6539\u5584\u3002',
      'AutoPatchWork\u7b49\u306e\u30b5\u30dd\u30fc\u30c8\u3092\u6539\u5584\u3002'
    ]

  }, {
    date: '2011/08/21', version: '0.7.0', changes: [
      '\u30e9\u30f3\u30ad\u30f3\u30b0\u30da\u30fc\u30b8\u306b\u304a\u3044\u3066AutoPatchWork\u306a\u3069\u3067\u7d99\u304e\u8db3\u3057\u305f\u4e8c\u30da\u30fc\u30b8\u76ee\u4ee5\u964d\u306e\u753b\u50cf\u304c\u8868\u793a\u3055\u308c\u306a\u3044\u306e\u3092\u662f\u6b63\u3059\u308b\u6a5f\u80fd\u3092\u8ffd\u52a0\u3002',
      '\u304a\u3059\u3059\u3081\u30a4\u30e9\u30b9\u30c8\u3092\u30da\u30fc\u30b8\u306e\u53f3\u5074\u306b\u8868\u793a\u3059\u308b\u6a5f\u80fd(conf.locate_recommend_right)\u3092\u524a\u9664\u3002',
      '\u5730\u57df\u30e9\u30f3\u30ad\u30f3\u30b0(/ranking_area.php)\u306e\u65b0\u30c7\u30b6\u30a4\u30f3\u306b\u5bfe\u5fdc\u3002'
    ]

  }, {
    date: '2011/07/24', version: '0.6.3', changes: [
      '\u30b9\u30bf\u30c3\u30af\u30d5\u30a3\u30fc\u30c9\u3067\u30d6\u30c3\u30af\u30de\u30fc\u30af\u3057\u3088\u3046\u3068\u3059\u308b\u3068\u30a8\u30e9\u30fc\u304c\u51fa\u308b\u30d0\u30b0\u3092\u4fee\u6b63\u3002',
      '「\u30b9\u30e9\u30a4\u30c9\u30e2\u30fc\u30c9」\u8a2d\u5b9a\u306e\u6642\u3001\u30de\u30f3\u30ac\u3092\u95b2\u89a7\u51fa\u6765\u306a\u3044\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002',
      '\u30e9\u30f3\u30ad\u30f3\u30b0\u3067\u4e0a\u624b\u304f\u52d5\u4f5c\u3057\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002'
    ]
  }, {
    date: '2011/06/26', version: '0.6.2', changes: [
      '\u8a2d\u5b9a\u753b\u9762\u3078\u306e\u30ea\u30f3\u30af\u304c\u8868\u793a\u3055\u308c\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002',
      '\u30a4\u30d9\u30f3\u30c8\u306e\u7279\u8a2d\u30da\u30fc\u30b8(e.g. /event_starfestival2011.php)\u3067\u52d5\u4f5c\u3057\u3066\u3044\u306a\u304b\u3063\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002'
    ]
  }, {
    date: '2011/05/21', version: '0.6.1', changes: [
      'Opera10.1x\u3067\u52d5\u4f5c\u3057\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002',
      '\u30bf\u30b0\u691c\u7d22(ex. /tags.php?tag=pixiv)\u3067\u52d5\u4f5c\u3057\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002',
      '\u30a8\u30e9\u30fc\u8868\u793a\u306e\u52d5\u4f5c\u304c\u5909\u3060\u3063\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002',
      'conf.popup_ranking_log\u3092\u524a\u9664\u3002',
      '\u65b0\u7740\u30da\u30fc\u30b8\u3067\u52d5\u4f5c\u3057\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002',
      'conf.locate_recommend_right\u304c\u52d5\u4f5c\u3057\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002'
    ]

  }, {
    date: '2011/05/13', version: '0.6.0', changes: [
      '\u30ad\u30fc\u30d0\u30a4\u30f3\u30c9\u306e\u30ab\u30b9\u30bf\u30de\u30a4\u30ba\u6a5f\u80fd\u3092\u8ffd\u52a0\u3002',
      '\u30a4\u30e9\u30b9\u30c8\u30da\u30fc\u30b8\u3067\u30d6\u30c3\u30af\u30de\u30fc\u30af\u306e\u51e6\u7406\u304c\u52d5\u4f5c\u3057\u3066\u3044\u306a\u304b\u3063\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002',
      '\u30e9\u30a4\u30bb\u30f3\u30b9\u3092Apache License 2.0\u306b\u5909\u66f4\u3002',
      'Webkit\u3067\u30d6\u30c3\u30af\u30de\u30fc\u30af\u30d5\u30a9\u30fc\u30e0\u306e\u8868\u793a\u304c\u5909\u3060\u3063\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002',
      '\u30c8\u30c3\u30d7\u30da\u30fc\u30b8\u306e\u30ec\u30a4\u30a2\u30a6\u30c8\u3092\u30d0\u30c3\u30af\u30a2\u30c3\u30d7\u3059\u308b\u6a5f\u80fd\u3092\u8ffd\u52a0(\u5fa9\u6d3b)\u3002',
      'Chrome\u3067\u30bb\u30f3\u30bf\u30fc\u30af\u30ea\u30c3\u30af\u306b\u3082\u53cd\u5fdc\u3057\u3066\u3044\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002',
      'Webkit\u3067\u306e\u30ad\u30fc\u64cd\u4f5c\u3092\u6539\u5584\u3002',
      '\u30d6\u30c3\u30af\u30de\u30fc\u30af\u30d5\u30a9\u30fc\u30e0\u306a\u3069\u306e\u52d5\u4f5c\u304c\u5909\u306b\u306a\u3063\u3066\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002',
      '\u691c\u7d22\u30da\u30fc\u30b8\u3067\u52d5\u304b\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002'
    ]

  }, {
    date: '2011/03/26', version: '0.5.1', changes: [
      '\u304a\u3059\u3059\u3081\u30a4\u30e9\u30b9\u30c8\u304c\u975e\u8868\u793a\u306e\u6642\u3082conf.locate_recommend_right\u304c\u52d5\u4f5c\u3057\u3066\u3057\u307e\u3046\u30d0\u30b0\u3092\u4fee\u6b63\u3002',
      'conf.extagedit\u3092\u5ec3\u6b62\u3057\u3066conf.bookmark_form\u306b\u5909\u66f4\u3002',
      'pixiv\u306e\u8a00\u8a9e\u8a2d\u5b9a\u304c\u65e5\u672c\u8a9e\u4ee5\u5916\u306e\u6642\u306b\u30de\u30f3\u30ac\u304c\u95b2\u89a7\u3067\u304d\u306a\u304b\u3063\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002',
      '\u30de\u30f3\u30ac\u306e\u898b\u958b\u304d\u8868\u793a\u3092\u4fee\u6b63\u3002',
      'Firefox4\u3067\u30d6\u30c3\u30af\u30de\u30fc\u30af\u7de8\u96c6\u753b\u9762\u3067\u30bf\u30b0\u3092\u9078\u629e\u3067\u304d\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002',
      '\u30d6\u30c3\u30af\u30de\u30fc\u30af\u6e08\u307f\u306e\u30a4\u30e9\u30b9\u30c8\u3067\u30d6\u30c3\u30af\u30de\u30fc\u30af\u30dc\u30bf\u30f3\u304c\u8868\u793a\u3055\u308c\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002'
    ]
  }, {
    date: '2011/02/15', version: '0.5.0', changes: [
      'conf.extension\u3092\u5ec3\u6b62\u3002Opera\u62e1\u5f35\u7248\u306e\u30c4\u30fc\u30eb\u30d0\u30fc\u30a2\u30a4\u30b3\u30f3\u3092\u524a\u9664\u3002',
      'Firefox\u3067\u30b3\u30e1\u30f3\u30c8\u8868\u793a\u6a5f\u80fd\u304c\u52d5\u4f5c\u3057\u3066\u3044\u306a\u304b\u3063\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002',
      'Firefox\u3067\u30d6\u30c3\u30af\u30de\u30fc\u30af\u7de8\u96c6\u30d5\u30a9\u30fc\u30e0\u3067\u30a2\u30ed\u30fc\u30ad\u30fc\u3067\u30bf\u30b0\u9078\u629e\u3092\u884c\u3046\u6642\u306b\u5165\u529b\u5c65\u6b74\u304c\u8868\u793a\u3055\u308c\u308b\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002',
      '\u30dd\u30c3\u30d7\u30a2\u30c3\u30d7\u306e\u30bf\u30b0\u7de8\u96c6\u306eUI\u3092\u30d6\u30c3\u30af\u30de\u30fc\u30af\u7de8\u96c6\u3068\u540c\u3058\u306b\u5909\u66f4\u3002',
      '\u30dd\u30c3\u30d7\u30a2\u30c3\u30d7\u3067\u30d6\u30c3\u30af\u30de\u30fc\u30af\u7de8\u96c6\u30e2\u30fc\u30c9\u306e\u307e\u307e\u4ed6\u306e\u30a4\u30e9\u30b9\u30c8\u306b\u79fb\u52d5\u3059\u308b\u3068\u30ad\u30e3\u30d7\u30b7\u30e7\u30f3\u304c\u8868\u793a\u3055\u308c\u306a\u304f\u306a\u308b\u30d0\u30b0\u3092\u4fee\u6b63\u3002',
      '\u30de\u30f3\u30ac\u30e2\u30fc\u30c9\u3067\u3082\u53ef\u80fd\u306a\u3089\u539f\u5bf8\u306e\u753b\u50cf\u3092\u4f7f\u7528\u3059\u308b\u3088\u3046\u306b\u5909\u66f4\u3002',
      '\u30e1\u30f3\u30d0\u30fc\u30a4\u30e9\u30b9\u30c8\u30da\u30fc\u30b8\u306a\u3069\u3092\u958b\u3044\u305f\u6642\u306b\u8a55\u4fa1\u306a\u3069\u304c\u51fa\u6765\u306a\u3044\u5834\u5408\u304c\u3042\u308b\u30d0\u30b0\u3092\u4fee\u6b63\u3002',
      '\u8a2d\u5b9a\u753b\u9762\u306e\u30c7\u30b6\u30a4\u30f3\u3092\u5909\u66f4\u3002',
      'Opera10.1x\u3067\u30dd\u30c3\u30d7\u30a2\u30c3\u30d7\u3092\u958b\u3044\u305f\u6642\u306b\u753b\u50cf\u304c\u8868\u793a\u3055\u308c\u306a\u3044\u30d0\u30b0\u3092\u4fee\u6b63\u3002',
      '\u5c0f\u8aac\u30da\u30fc\u30b8\u3067\u8a55\u4fa1\u3067\u304d\u306a\u304b\u3063\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002',
      'conf.expand_novel\u3092\u524a\u9664\u3002',
      '\u4ed6\u30e6\u30fc\u30b6\u30fc\u306e\u30d6\u30c3\u30af\u30de\u30fc\u30af\u30da\u30fc\u30b8\u3067\u52d5\u304b\u306a\u304f\u306a\u3063\u3066\u305f\u306e\u3092\u4fee\u6b63\u3002'
    ]

  }, {
    date: '2011/02/04', version: '0.4.0', changes: [
      'pixivreader\u3068\u885d\u7a81\u3059\u308b\u3089\u3057\u3044\u306e\u3067\u3001exclude\u306b\u8ffd\u52a0\u3002',
      '\u8a2d\u5b9a\u307e\u308f\u308a\u3092\u4f5c\u308a\u76f4\u3057\u3002Chrome/Safari\u62e1\u5f35\u7248\u306b\u30aa\u30d7\u30b7\u30e7\u30f3\u30da\u30fc\u30b8\u8ffd\u52a0\u3002\u8a2d\u5b9a\u304c\u5f15\u304d\u7d99\u304c\u308c\u306a\u3044\u3002',
      'OperaExtension\u7248\u3067\u52d5\u4f5c\u3057\u306a\u3044\u5834\u5408\u304c\u3042\u308b\u30d0\u30b0\u3092\u305f\u3076\u3093\u4fee\u6b63\u3002',
      '\u95b2\u89a7\u3067\u304d\u306a\u3044\u30de\u30f3\u30ac\u304c\u3042\u3063\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002',
      '\u30ba\u30fc\u30e0\u6a5f\u80fd\u3067Firefox\u3092\u30b5\u30dd\u30fc\u30c8\u3002',
      '\u4f01\u753b\u76ee\u9332\u95a2\u9023\u30da\u30fc\u30b8\u306b\u5bfe\u5fdc\u3002',
      '\u30de\u30f3\u30ac\u30da\u30fc\u30b8\u306e\u5909\u66f4(\u898b\u958b\u304d\u8868\u793a\u306a\u3069)\u306b\u5bfe\u5fdc\u3002\u305d\u308c\u306b\u4f34\u3063\u3066conf.default_manga_type\u3068conf.popup_manga_tb\u3092\u524a\u9664\u3002',
      '\u4f5c\u54c1\u7ba1\u7406\u30da\u30fc\u30b8\u3067\u52d5\u4f5c\u3057\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002',
      'Chrome/Safari\u3067AutoPatchWork\u306b\u5bfe\u5fdc\u3002'
    ]

  }, {
    date: '2011/01/15', version: '0.3.2', changes: [
      '\u30d6\u30c3\u30af\u30de\u30fc\u30af\u7ba1\u7406\u30da\u30fc\u30b8\u3067\u4e0a\u624b\u304f\u52d5\u4f5c\u3057\u3066\u3044\u306a\u304b\u3063\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002'
    ]
  }, {
    date: '2011/01/14', version: '0.3.1', changes: [
      'Opera\u4ee5\u5916\u306e\u30d6\u30e9\u30a6\u30b6\u306b\u304a\u3044\u3066\u4e00\u90e8\u306e\u30da\u30fc\u30b8\u3067\u8a55\u4fa1\u3084\u30b3\u30e1\u30f3\u30c8\u8868\u793a\u306a\u3069\u306e\u6a5f\u80fd\u306e\u52d5\u4f5c\u304c\u5909\u3060\u3063\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002',
      'conf.popup.rate_key=true\u306e\u6642\u3001Shift\u30ad\u30fc\u306a\u3057\u3067\u8a55\u4fa1\u3067\u304d\u3066\u3044\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002',
      'ChromeExtension/SafariExtension\u7248\u3067\u81ea\u52d5\u30a2\u30c3\u30d7\u30c7\u30fc\u30c8\u306b\u5bfe\u5fdc\u3002',
      'OperaExtension\u7248\u306e\u30aa\u30d7\u30b7\u30e7\u30f3\u30da\u30fc\u30b8\u3067\u6570\u5024\u304cNaN\u306b\u306a\u308b\u5834\u5408\u304c\u3042\u308b\u30d0\u30b0\u3092\u305f\u3076\u3093\u4fee\u6b63\u3002'
    ]
  }, {
    date: '2010/12/26', version: '0.3.0', changes: [
      'conf.fast_user_bookmark\u8ffd\u52a0\u3002',
      '\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb\u753b\u50cf\u306e\u5de6\u4e0a\u306b\u30a2\u30a4\u30b3\u30f3(\u30c1\u30a7\u30c3\u30af:\u304a\u6c17\u306b\u5165\u308a/\u30cf\u30fc\u30c8:\u76f8\u4e92/\u65d7:\u30de\u30a4\u30d4\u30af)\u3092\u8868\u793a\u3059\u308b\u6a5f\u80fd(conf.popup.author_status_icon)\u8ffd\u52a0\u3002',
      '\u30b3\u30e1\u30f3\u30c8\u8868\u793a\u6a5f\u80fd\u3092\u8ffd\u52a0\u3002',
      '\u30a2\u30f3\u30b1\u30fc\u30c8\u7d50\u679c\u306e\u8868\u793a\u3092\u5909\u66f4\u3002',
      '\u95b2\u89a7\u30fb\u8a55\u4fa1\u30fb\u30b3\u30e1\u30f3\u30c8\u5c65\u6b74\u30da\u30fc\u30b8\u306b\u5bfe\u5fdc\u3002',
      '\u30ad\u30fc\u30d0\u30a4\u30f3\u30c9\u3092\u5909\u66f4\u3002Shift+c:\u30b3\u30e1\u30f3\u30c8\u8868\u793a/d:\u30a2\u30f3\u30b1\u30fc\u30c8/a:\u623b\u308b',
      '\u30dd\u30c3\u30d7\u30a2\u30c3\u30d7\u306e\u30a4\u30d9\u30f3\u30c8API\u3092Popup.on*\u306e\u307f\u306b\u5909\u66f4\u3002',
      'conf.expand_novel\u8ffd\u52a0\u3002',
      '\u30e9\u30f3\u30ad\u30f3\u30b0\u30ab\u30ec\u30f3\u30c0\u30fc\u306b\u5bfe\u5fdc\u3002conf.popup_ranking_log\u8ffd\u52a0\u3002',
      '\u30a4\u30d9\u30f3\u30c8\u8a73\u7d30/\u53c2\u52a0\u8005\u30da\u30fc\u30b8\u306b\u5bfe\u5fdc\u3002',
      'Extension\u7248\u306b\u30c4\u30fc\u30eb\u30d0\u30fc\u30dc\u30bf\u30f3\u3068\u8a2d\u5b9a\u753b\u9762\u3092\u8ffd\u52a0\u3002conf.extension.*\u8ffd\u52a0\u3002',
      '\u30bf\u30b0\u306e\u4e26\u3079\u66ff\u3048\u3092\u8a2d\u5b9a\u3057\u3066\u3044\u306a\u3044\u6642\u3001\u30d6\u30c3\u30af\u30de\u30fc\u30af\u7de8\u96c6\u306e\u52d5\u4f5c\u304c\u304a\u304b\u3057\u304b\u3063\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002'
    ]

  }, {
    date: '2010/12/01', version: '0.2.0', changes: [
      'Extension\u7248\u3067\u30a2\u30f3\u30b1\u30fc\u30c8\u306b\u7b54\u3048\u3089\u308c\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002',
      '\u30c8\u30c3\u30d7\u30da\u30fc\u30b8\u306e\u30ec\u30a4\u30a2\u30a6\u30c8\u3092\u30d0\u30c3\u30af\u30a2\u30c3\u30d7\u3059\u308b\u6a5f\u80fd\u8ffd\u52a0\u3002',
      'Extension\u7248\u306e\u81ea\u52d5\u30a2\u30c3\u30d7\u30c7\u30fc\u30c8\u306b\u5bfe\u5fdc\u3002',
      '\u4e0a\u4e0b\u30ad\u30fc\u3067\u30ad\u30e3\u30d7\u30b7\u30e7\u30f3\u3092\u30b9\u30af\u30ed\u30fc\u30eb\u3059\u308b\u3088\u3046\u306b\u5909\u66f4\u3002conf.popup.scroll_height\u8ffd\u52a0\u3002',
      '\u753b\u50cf\u3092\u62e1\u5927/\u7e2e\u5c0f\u3059\u308b\u30ad\u30fc\u3092o/i\u304b\u3089+/-\u306b\u5909\u66f4\u3002',
      'd\u30ad\u30fc(\u524d\u306e\u30a4\u30e9\u30b9\u30c8\u306b\u623b\u308b)\u3092\u30ad\u30fc\u30d0\u30a4\u30f3\u30c9\u306b\u8ffd\u52a0\u3002'
    ]

  }, {
    date: '2010/11/14', version: '0.1.2', changes: [
      '\u4e00\u90e8\u306e\u30da\u30fc\u30b8\u3067\u30a2\u30f3\u30b1\u30fc\u30c8\u7d50\u679c\u3092\u8868\u793a\u51fa\u6765\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002',
      '\u30a2\u30f3\u30b1\u30fc\u30c8\u306b\u7b54\u3048\u305f\u5f8c\u3001\u9078\u629e\u80a2\u304c\u8868\u793a\u3055\u308c\u305f\u307e\u307e\u306b\u306a\u3063\u3066\u3044\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002',
      '\u30b9\u30bf\u30c3\u30af\u30d5\u30a3\u30fc\u30c9\u4e0a\u3067\u8a55\u4fa1\u3084\u30bf\u30b0\u7de8\u96c6\u304c\u51fa\u6765\u306a\u304b\u3063\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002',
      '\u30de\u30a6\u30b9\u64cd\u4f5c\u7528UI\u306e\u8868\u793a\u3092\u5909\u66f4\u3002',
      'conf.popup.overlay_control\u8ffd\u52a0\u3002',
      '\u30de\u30f3\u30ac\u30da\u30fc\u30b8(mode=manga)\u3067\u6539\u30da\u30fc\u30b8\u51fa\u6765\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002',
      '\u8a55\u4fa1\u51fa\u6765\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002'
    ]
  }, {
    date: '2010/11/02', version: '0.1.1', changes: [
      '\u30a4\u30d9\u30f3\u30c8\u30da\u30fc\u30b8(e.g. http://www.pixiv.net/event_halloween2010.php)\u7528\u306e\u6c4e\u7528\u30b3\u30fc\u30c9\u8ffd\u52a0\u3002',
      'conf.locate_recommend_right\u304c2\u306e\u6642\u3001\u4e0a\u624b\u304f\u52d5\u4f5c\u3057\u306a\u3044\u5834\u5408\u304c\u3042\u308b\u30d0\u30b0\u3092\u4fee\u6b63\u3002',
      'pixiv\u306e\u5909\u66f4(\u8a55\u4fa1\u3001\u30e9\u30f3\u30ad\u30f3\u30b0\u3001etc)\u306b\u5bfe\u5fdc\u3002'
    ]
  }, {
    date: '2010/10/27', version: '0.1.0', changes: [
      'Opera11\u306eExtension\u306b\u5bfe\u5fdc\u3002',
      '\u30d6\u30c3\u30af\u30de\u30fc\u30af\u7ba1\u7406\u30da\u30fc\u30b8\u3067\u30ec\u30b3\u30e1\u30f3\u30c9\u3092\u53f3\u5074\u306b\u4e26\u3079\u308b\u6a5f\u80fd\u304c\u52d5\u4f5c\u3057\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u306e\u3092\u4fee\u6b63\u3002',
      'AutoPatchWork\u306b\u5bfe\u5fdc\u3002'
    ]
  }];

  /* __DATA_END__ */

  if (g.opera && d.readyState === 'loading') {
    w.addEventListener('DOMContentLoaded', _.run, false);
  } else {
    _.run();
  }
});