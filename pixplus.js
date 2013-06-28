// ==UserScript==
// @name        pixplus.js
// @author      wowo
// @version     1.7.2
// @license     Apache License 2.0
// @description pixivをほげる。
// @icon        http://crckyl.ath.cx/pixplus/pixplus_48.png
// @icon64      http://crckyl.ath.cx/pixplus/pixplus_64.png
// @namespace   http://my.opera.com/crckyl/
// @updateURL   http://crckyl.ath.cx/pixplus/archive/latest/pixplus.user.js
// @include     http://www.pixiv.net/*
// @exclude     *pixivreader*
// @run-at      document-start
// ==/UserScript==

(function(entrypoint) {
  var w = window,
      g = this || window,
      unsafeWindow = g.unsafeWindow;

  if (w.location.href.indexOf('pixivreader') >= 0) {
    return;
  }

  var greasemonkey =
        /* __GREASEMONKEY_REMOVE__
         true;
         * __GREASEMONKEY_REMOVE__ */
      false; // __GREASEMONKEY_REMOVE__

  var inject = function(data) {
    var s = w.document.createElement('script'), d = w.document;
    s.setAttribute('type', 'text/javascript');
    s.textContent
      = ('(' + entrypoint.toString() + ')'
         + '(this || window,window,window.document,'
         + g.JSON.stringify(data) + ')');
    (d.body || d.documentElement || d).appendChild(s);
  };

  var send_message;

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
      send_message = function(command, data) {
        g.opera.extension.postMessage(g.JSON.stringify({command: command, data: data}));
      };

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
    send_message = function(command, data) {
      g.chrome.extension.sendRequest({command: command, data: data});
    };

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
    send_message = function(command, data) {
      g.safari.self.tab.dispatchMessage(command, data);
    };

  } else {
    inject(null);
  }

  if (send_message) {
    w.addEventListener('pixplusConfigSet', function(ev) {
      var data = {};
      ['section', 'item', 'value'].forEach(function(attr) {
        data[attr] = ev.target.getAttribute('data-pp-' + attr);
      });
      send_message('config-set', data);
    }, false);
  }
})(function(g, w, d, _extension_data) {

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

  _.extend(_, {
    version: function() {
      return _.changelog[0].version;
    },

    release_date: function() {
      return _.changelog[0].date;
    },

    strip: function(text) {
      return text ? text.replace(/(?:^\s+|\s+$)/g, '') : '';
    },

    escape_regex: function(text) {
      return text.replace(/([\.\?\*\+\|\(\)\[\]\\])/g, '\\$1');
    },

    q: function(query, context) {
      return (context || d).querySelector(query);
    },

    qa: function(query, context) {
      var list = (context || d).querySelectorAll(query);
      return g.Array.prototype.slice.call(list);
    },

    mod: function(obj) {
      for(var key in obj) {
        if (obj.hasOwnProperty(key) && obj[key] instanceof g.Function) {
          obj[key] = (function(orig) {
            return function() {
              return orig.apply(obj, arguments);
            };
          })(obj[key]);
        }
      }
      return obj;
    },

    listen: function(targets, events, listener, options) {
      var throttling_timer;

      if (!options) {
        options = {};
      }

      if (!g.Array.isArray(targets)) {
        targets = [targets];
      }

      if (!g.Array.isArray(events)) {
        events = [events];
      }

      var wrapper = function(ev) {
        if (options.async) {
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
            targets.forEach(function(target) {
              target.removeEventListener(event, wrapper, !!options.capture);
            });
          });
          connection.disconnected = true;
        }
      };

      events.forEach(function(event) {
        targets.forEach(function(target) {
          target.addEventListener(event, wrapper, !!options.capture);
        });
      });
      return connection;
    },

    onclick: function(context, listener, options) {
      return _.listen(context, 'click', function(ev, connection) {
        if (ev.button !== 0 || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.metaKey) {
          return false;
        }
        return listener(ev, connection);
      }, options);
    },

    onwheel: function(context, listener, options) {
      return _.listen(
        context,
        ['DOMMouseScroll', 'mousewheel'],
        function(ev, connection) {
          if (ev.ctrlKey || ev.shiftKey || ev.altKey || ev.metaKey) {
            return false;
          }
          return listener(ev, connection);
        },
        options
      );
    },

    send_click: function(elem) {
      _.debug('send click event');
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

    lazy_scroll: function (target, root, scroll, offset) {
      if (!target) {
        return;
      }
      offset = g.parseFloat(typeof(offset) === 'undefined' ? 0.2 : offset);

      if (!root || !scroll) {
        var p = target.parentNode;
        while(p && p !== d.body && p !== d.documentElement) {
          if (p.scrollHeight > p.offsetHeight) {
            root = scroll = p;
            break;
          }
          p = p.parentNode;
        }
      }

      if (!root) {
        root = d.compatMode === 'BackCompat' ? d.body : d.documentElement;
      }

      if (!scroll) {
        _.lazy_scroll(target, root, d.body, offset);
        scroll = d.documentElement;
      }

      var r_root   = root.getBoundingClientRect(),
          r_target = target.getBoundingClientRect(),
          bt       = g.Math.floor(g.Math.max(0, r_root.top) + root.clientHeight * offset),
          bb       = g.Math.floor(g.Math.max(0, r_root.top) + root.clientHeight * (1.0 - offset));
      if (r_target.top < bt) {
        scroll.scrollTop -= bt - r_target.top;
      } else if (r_target.bottom > bb) {
        scroll.scrollTop += r_target.bottom - bb;
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

    clear: function() {
      g.Array.prototype.forEach.call(arguments, function(elem) {
        while(elem.childNodes.length) {
          elem.removeChild(elem.childNodes[0]);
        }
      });
    },

    open: function(url) {
      if (url) {
        w.open(url);
      }
    },

    key_enabled: function(ev) {
      return !(ev.target instanceof w.HTMLTextAreaElement ||
               (ev.target instanceof w.HTMLInputElement &&
                (!ev.target.type ||
                 /^(?:text|search|tel|url|email|password|number)$/i.test(ev.target.type))));
    },

    parse_query: function(query) {
      var map = { };
      query.replace(/^.*?\?/, '').split('&').forEach(function(p) {
        var pair = p.split('=', 2).map(function(t) {
          return g.decodeURIComponent(t);
        });
        map[pair[0]] = pair[1] || '';
      });
      return map;
    },

    calculate_ratio: function(width, height) {
      return (width - height) / g.Math.min(width, height);
    }
  });

  ['log', 'error', 'debug', 'warn'].forEach(function(name) {
    if (g.console) {
      _[name] = function(msg) {
        if (name !== 'debug' || _.conf.general.debug) {
          g.console[name]('pixplus: [' + name + '] ' + msg);
        }
      };
    } else {
      _[name] = function() { };
    }
  });

  _.conf = _.mod({
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
              aliases[tag] = alias.replace(/(?:^\s+|\s+$)/g, '').split(/\s+/);
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
      var that = this;
      var storage = { };
      this.__schema.forEach(function(section) {
        section.items.forEach(function(item) {
          var value = that[section.name][item.key];
          var conv = that.__conv[section.name + '_' + item.key];
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
      var that = this;
      this.__schema.forEach(function(section) {
        section.items.forEach(function(item) {
          var key = section.name + '_' + item.key;
          var value = data[key];
          if (typeof(value) === 'undefined') {
            return;
          }

          var conv = that.__conv[key];
          if (conv) {
            value = conv.parse(value);
          } else if ((conv = that.__conv[typeof(item.value)])) {
            value = conv(value);
          }

          that[section.name][item.key] = value;
        });
      });
    },

    __key: function(section, item) {
      return this.__key_prefix + section + '_' + item;
    },

    __parse: function(section, item, value) {
      var conv = this.__conv[typeof(this.__defaults[section][item])];
      if (conv) {
        value = conv(value);
      }
      conv = this.__conv[section + '_' + item];
      if (conv) {
        value = conv.parse(value);
      }
      return value;
    },

    __dump: function(section, item, value) {
      var conv = this.__conv[section + '_' + item];
      if (conv) {
        return conv.dump(value);
      } else {
        return g.String(value);
      }
    },

    __wrap_storage: function(storage) {
      var that = this;
      return {
        get: function(section, item) {
          return storage.getItem(that.__key(section, item));
        },

        set: function(section, item, value) {
          storage.setItem(that.__key(section, item), value);
        }
      };
    },

    __init: function(storage) {
      var that = this;
      this.__defaults = { };
      this.__schema.forEach(function(section) {
        that.__defaults[section.name] = { };
        section.items.forEach(function(item) {
          that.__defaults[section.name][item.key] = item.value;
        });
      });

      this.__schema.forEach(function(section) {
        var conf_section = that[section.name] = { };

        section.items.forEach(function(item) {
          var value = storage.get(section.name, item.key);
          value = that.__parse(section.name, item.key, value === null ? item.value : value);

          conf_section.__defineGetter__(item.key, function() {
            return value;
          });

          conf_section.__defineSetter__(item.key, function(new_value) {
            value = new_value;
            storage.set(section.name, item.key, that.__dump(section.name, item.key, value));
          });
        });
      });
    }
  });

  _.xhr = _.mod({
    cache: { },

    remove_cache: function(url) {
      this.cache[url] = null;
    },

    request: function(method, url, headers, data, cb_success, cb_error) {
      if (!/^(?:(?:http)?:\/\/www\.pixiv\.net)?\/(?:member_illust|bookmark_add)\.php(?:\?|$)/.test(url)) {
        _.error('XHR: URL not allowed - ' + url);
        if (cb_error) {
          cb_error();
        }
        return;
      }

      var that = this;
      var xhr = new w.XMLHttpRequest();
      xhr.onload = function() {
        that.cache[url] = xhr.responseText;
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
      if (this.cache[url]) {
        cb_success(this.cache[url]);
        return;
      }
      this.request('GET', url, null, null, cb_success, cb_error);
    },

    post: function(form, cb_success, cb_error) {
      this.request(
        'POST',
        form.getAttribute('action'),
        [['Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8']],
        this.serialize(form),
        cb_success, cb_error
      );
    },

    serialize: function(form) {
      var data = '', data_map = { };
      if (form instanceof w.HTMLFormElement) {
        _.qa('input', form).forEach(function(input) {
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
  });

  _.key = _.mod({
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
          keys.push(this.encode_map[key] || key);
        }

      } else if (ev.keyIdentifier) {
        if (ev.keyIdentifier.lastIndexOf('U+', 0) === 0) {
          c = g.parseInt(ev.keyIdentifier.substring(2), 16);
          if (c <= 0) {
            // error
          } else if (c <= 0x20) {
            key = this.code_map[c] || ('_c' + String(c));
          } else if (c < 0x7f) {
            key = g.String.fromCharCode(c).toLowerCase();
          } else if (c === 0x7f) {
            key = 'Delete';
          } else {
            // not in ascii
          }
        } else {
          key = ev.keyIdentifier;
        }
        if (key) {
          keys.push(this.encode_map[key] || key);
        }

      } else if (ev.type === 'keypress') {
        var c = ev.keyCode || ev.charCode;
        if (c === ev.which && c > 0x20 && c < 0x7f) {
          key = g.String.fromCharCode(c).toLowerCase();
          keys.push(this.encode_map[key] || key);
        } else if (this.code_map[c]) {
          keys.push(this.code_map[c]);
        } else if (c > 0) {
          keys.push('_c' + g.String(c));
        }
      }

      if (keys.length < 1) {
        return null;
      }

      [
        [ev.ctrlKey, 'Control'],
        [ev.shiftKey, 'Shift'],
        [ev.altKey, 'Alt'],
        [ev.metaKey, 'Meta']
      ].forEach(function(p) {
        if (p[0] && keys.indexOf(p[1]) < 0) {
          keys.unshift(p[1]);
        }
      });

      return keys.join('+');
    },

    listen: function(context, listener, options) {
      var that = this;
      _.listen(context, ['keypress', 'keydown'], function(ev, connection) {
        var key = that.parse_event(ev);
        if (key) {
          _.debug('keyevent type=' + ev.type + ' key=' + key);
          var res = listener(key, ev, connection);
          if (res) {
            _.debug('  canceled');
          }
          return res;
        }
        return false;
      }, options);
    },

    init: function() {
      var that = this;

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
        that.code_map[code] = name;
        that.name_map[name] = code;
      });

      [
        ['+', 'plus'],
        [',', 'comma'],
        [' ', 'Space'],
        ['\t', 'Tab']
      ].forEach(function(p) {
        that.encode_map[p[0]] = p[1];
        that.decode_map[p[1]] = p[0];
      });
    }
  });

  _.ui = _.mod({
    slider: function(min, max, step) {
      var slider;

      if (!_.conf.general.debug) {
        slider = _.e('input', {type: 'range', min: min, max: max, step: step});
        if (slider.type === 'range') {
          return slider;
        }
      }

      var rail, knob;
      slider = _.e('div', {cls: 'pp-slider'});
      rail = _.e('div', {cls: 'pp-slider-rail'}, slider);
      knob = _.e('div', {cls: 'pp-slider-knob'}, rail);

      // if (_.conf.general.debug) {
      //   slider.classList.add('pp-debug');
      // }

      slider.__defineSetter__('value', function(value) {
        var pos;
        value = g.Math.max(min, g.Math.min(value, max));
        pos = (value - min) / (max - min);
        knob.style.left = (pos * 100) + '%';
      });

      slider.__defineGetter__('value', function(value) {
        return (max - min) * (knob.offsetLeft + 4) / rail.offsetWidth + min;
      });

      _.listen(knob, 'mousedown', function(ev) {
        var x, conn1, conn2;

        x = ev.screenX - (knob.offsetLeft + 4);
        slider.classList.add('pp-active');

        conn1= _.listen(w, 'mousemove', function(ev) {
          var pos = ev.screenX - x;
          pos = g.Math.max(0, g.Math.min(pos, rail.offsetWidth));
          knob.style.left = pos + 'px';

          ev = d.createEvent('Event');
          ev.initEvent('change', true, true);
          slider.dispatchEvent(ev);
        });

        conn2 = _.listen(w, 'mouseup', function(ev) {
          conn1.disconnect();
          conn2.disconnect();
          slider.classList.remove('pp-active');
        });
      });
      return slider;
    }
  });

  _.configui = _.mod({
    dom: { },
    shown: false,
    lng: null,
    root: null,
    menu: null,

    init: function(root, menu, extension_data) {
      if (!root) {
        return;
      }

      this.lng = _.lng;
      this.root = root;
      this.menu = menu;

      var that = this;
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
            that.toggle();
          }
          return true;
        });
        menu.insertBefore(btn.parentNode, menu.firstChild);
      }
    },

    create_tab_content: function(root, section) {
      var table = _.e('table', null, root);
      var lang_conf = this.lng.conf, last_mode;

      var that = this;
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
          _.e('button', {'text': that.lng.pref['default']}, row.insertCell(-1)),
          function() {
            _.conf[section.name][item.key] = item.value;
            control[control_propname] = item.value;
          }
        );
      });
    },

    create_tab_content_key: function(root, section) {
      this.create_tab_content(root, section);

      var that = this;
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
        _.onclick(_.e('button', {text: that.lng.pref.add}, add_line), function() {
          add(add_input.value);
          add_input.value = '';
          apply();
        });
        _.onclick(_.e('button', {text: that.lng.pref.close}, add_line), close_editor);

        row.parentNode.insertBefore(editor_row, row.nextSibling);
      }

      _.qa('tr', root).forEach(function(row) {
        var input = _.q('input', row);
        if (input) {
          _.listen(input, 'focus', function() {
            open_editor(row, input);
          });
        }
      });
    },

    create_tab_content_bookmark: function(root, section) {
      _.e('div', {text: this.lng.conf.bookmark.tag_order, css: 'white-space:pre'}, root);

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


      _.e('div', {text: this.lng.conf.bookmark.tag_aliases}, root);

      var tag_alias_table = _.e('table', {id: 'pp-config-bookmark-tag-aliases'}, root);
      _.onclick(_.e('button', {text: this.lng.pref.add}, root), function() {
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

      _.onclick(_.e('button', {text: this.lng.pref['export']}, toolbar), function() {
        textarea.value = JSON.stringify(_.conf.__export(''), null, 2);
      });

      _.onclick(_.e('button', {text: this.lng.pref['import']}, toolbar), function() {
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
        'http://crckyl.ath.cx/pixplus/',
        'http://crckyl.ath.cx/cgit/pixplus.git/',
        'http://my.opera.com/crckyl/',
        'http://twitter.com/crckyl'
      ];
      var dl = _.e('dl', null, root);
      [
        [this.lng.pref.about_name, 'pixplus'],
        [this.lng.pref.about_version, _.version() + ' - ' + _.release_date()],
        [this.lng.pref.about_web, function(dd) {
          var ul = _.e('ul', null, dd);
          urls.forEach(function(url) {
            _.e('a', {href: url, text: url}, _.e('li', null, ul));
          });
        }],
        [this.lng.pref.about_email,
         _.e('a', {text: 'crckyl@myopera.com', href: 'mailto:crckyl@myopera.com'})],
        [this.lng.pref.about_license, 'Apache License 2.0']
      ].forEach(function(p) {
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
      var that = this;
      var dl = _.e('dl', null, root);
      _.changelog.forEach(function(release) {
        var dt = _.e('dt', {text: release.version + ' - ' + release.date}, dl);
        if (release.releasenote) {
          dt.textContent += ' ';
          _.e('a', {href: release.releasenote, text: that.lng.pref.releasenote}, dt);
        }

        var ul = _.e('ul', null, _.e('dd', null, dl));
        (
          release.changes_i18n
            ? release.changes_i18n[that.lng.__name__]
            : release.changes
        ).forEach(function(change) {
          _.e('li', {text: change}, ul);
        });
      });
    },

    create_tab_content_debug: function(root) {
      var that = this;
      var langbar = _.e('div', {id: 'pp-config-langbar'}, root);
      ['en', 'ja'].forEach(function(name) {
        _.onclick(_.e('button', {text: name}, langbar), function() {
          that.lng = _.i18n[name];
          that.dom.root.parentNode.removeChild(that.dom.root);
          that.dom = { };
          that.shown = false;
          that.show();
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
      if (name === 'mypage') {
        return;
      }

      var that = this;
      var dom = this.dom;
      var label = _.e('label', {text: this.lng.pref[name], cls: 'pp-config-tab'}, dom.tabbar);
      var content = _.e('div', {id: 'pp-config-' + name + '-content', cls: 'pp-config-content'});

      (this['create_tab_content_' + name] || this.create_tab_content)(content, create_args);
      dom.content.appendChild(content);
      dom[name] = {label: label, content: content};
      _.onclick(label, function() {
        that.activate_tab(dom[name]);
        return true;
      });
    },

    create: function() {
      var that = this;
      var dom = this.dom;
      if (dom.created) {
        return;
      }

      dom.root    = _.e('div', {id: 'pp-config'}, this.root);
      dom.tabbar  = _.e('div', {id: 'pp-config-tabbar'});
      dom.content = _.e('div', {id: 'pp-config-content-wrapper'});

      if (this.menu) {
        _.onclick(
          _.e('label', {id: 'pp-config-close-button', text: '\u00d7'}, dom.tabbar),
          function() {
            that.hide();
            return true;
          }
        );
      }

      _.conf.__schema.forEach(function(section) {
        that.create_tab(section.name, section);
      });
      ['importexport', 'about', 'changelog'].forEach(this.create_tab);
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

    show: function() {
      this.create();
      this.dom.root.classList.add('pp-show');
      this.shown = true;
    },

    hide: function() {
      this.dom.root.classList.remove('pp-show');
      this.shown = false;
    },

    toggle: function() {
      if (this.shown) {
        this.hide();
      } else {
        this.show();
      }
    }
  });

  // __LIBRARY_END__

  _.extend(_, {
    redirect_jump_page: function(root) {
      if (_.conf.general.redirect_jump_page !== 2) {
        return;
      }
      _.qa('a[href*="jump.php"]', root).forEach(function(link) {
        var re;
        if ((re = /^(?:(?:http:\/\/www\.pixiv\.net)?\/)?jump\.php\?(.+)$/.exec(link.href))) {
          link.href = g.decodeURIComponent(re[1]);
        }
      });
    },

    modify_caption: function(caption, base_illust) {
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
    },

    reorder_tag_list: function(list, cb_get_tagname) {
      var list_parent = list.parentNode, lists = [list];

      var tags = _.qa('li', list), tag_map = { };
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

      for(var tag in tag_map) {
        if (!tag_map[tag]) {
          continue;
        }
        if (!all_list) {
          all_list = add_list();
        }
        all_list.insertBefore(tag_map[tag], all_list_before ? all_list_before.nextSibling : null);
      }

      return lists;
    }
  });

  _.fastxml = _.mod({
    ignore_elements: /^(?:script|style)$/,
    query_cache: {},

    parse: function(xml) {
      var dom, node, tags = xml.split(/<(\/?[a-zA-Z0-9]+)( [^<>]*?\/?)?>/);
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
        attrs = attrs.split(/\s([a-zA-Z0-9-]+)=\"([^\"]+)\"/);
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
        var terms = token.split(/([#\.])/);
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
        if (!tokens[tidx--](node)) {
          return false;
        }
        node = node.parent;
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
      this.q(root, selector, function(node) {
        nodes.push(node);
      });
      return nodes;
    },

    src: function(node, all) {
      if (!node || (!all && this.ignore_elements.test(node.tag))) {
        return '';
      }
      if (node.text) {
        return node.text;
      }
      var that = this;
      return node.raw_open + node.children.reduce(function(a, b) {
        return a + that.src(b, all);
      }, '') + (node.raw_close || '');
    },

    text: function(node, all) {
      if (!node || (!all && this.ignore_elements.test(node.tag))) {
        return '';
      }
      if (node.text) {
        return node.text;
      }
      return node.children.reduce(function(a, b) {
        return a + (b.text || '');
      }, '');
    }
  });

  _.illust = _.mod({
    root: null,
    last_link_count: 0,
    list: [ ],

    parse_image_url: function(url, allow_types) {
      if (!allow_types) {
        allow_types = ['_s', '_100', '_128x128', '_240ms', '_240mw'];
      }

      var re;
      if (!(re = /^(http:\/\/i\d+\.pixiv\.net\/img(\d+|-inf)\/img\/[^\/]+\/(?:(?:\d+\/){5})?)(?:mobile\/)?(\d+(?:_[\da-f]{10})?)(_[sm]|_100|_128x128|_240m[sw]|(?:_big)?_p\d+)(\.\w+(?:\?.*)?)$/.exec(url))) {
        return null;
      }

      if (allow_types.indexOf(re[4]) >= 0) {
        var id = g.parseInt(re[3], 10);
        if (id < 1) {
          return null;
        }

        if (re[2] === '-inf') {
          return {id: id};
        } else {
          var url_base = re[1] + re[3], url_suffix = re[5];
          return {
            id: id,
            image_url_base: url_base,
            image_url_suffix: url_suffix,
            image_url_medium: url_base + '_m' + url_suffix,
            image_url_big: url_base + url_suffix
          };
        }
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
      var illust, images = _.qa('img', link);

      for(var i = 0; i < images.length; ++i) {
        var p = this.parse_image_url(images[i].src, allow_types);
        if (!p && images[i].hasAttribute('data-src')) {
          // lazy load support
          p = this.parse_image_url(images[i].dataset.src, allow_types);
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

      _.extend(illust, this.create_from_id(illust.id), {
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

      _.listen(this.root, 'DOMNodeInserted', this.update, {async: true});
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
        var p = this.parse_image_url(img.attrs.src, '_m');
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
          question  = _.fastxml.q(work_info, '.questionnaire'),
          tags_tmpl = _.fastxml.q(root, '#template-work-tags'),
          tags      = _.fastxml.q(root, '.work-tags .tags-container');

      illust.title    = _.fastxml.text(_.fastxml.q(work_info, '.title'));
      illust.caption  = _.fastxml.src(_.fastxml.q(work_info, '.caption'));
      illust.taglist  = _.fastxml.src(tags_tmpl, true) + _.fastxml.src(tags);
      illust.rating   = _.fastxml.src(score);
      illust.question = _.fastxml.src(question, true);

      illust.tags = _.fastxml.qa(tags, '.tag .text').map(function(tag) {
        return _.strip(_.fastxml.text(tag));
      });

      var search_script = function(node, name) {
        var pattern = new g.RegExp('pixiv\\.context\\.' + name + '\\s*=\\s*(true|false)');
        var value = false;
        var script = _.fastxml.q(node, 'script', function(script) {
          var re = pattern.exec(_.fastxml.text(script, true));
          if (re) {
            _.debug('pixiv.context.' + name + ' = ' + re[1]);
            value = re[1] === 'true';
            return true;
          }
          return false;
        });
        if (!script) {
          _.warn('Requested definition script not found - pixiv.context.' + name);
        }
        return value;
      };

      illust.rated = search_script(score, 'rated');
      illust.answered = search_script(question, 'answered');

      var profile_area   = _.fastxml.q(root, '.profile-unit'),
          avatar         = _.fastxml.q(profile_area, 'img.user-image'),
          author_link    = _.fastxml.q(profile_area, 'a.user-link'),
          author_name    = _.fastxml.q(author_link, 'h1.user'),
          staccfeed_link = _.fastxml.q(root, '.extaraNavi p a', function(link) {
            return (link.attrs.href || '').indexOf('/stacc/') >= 0;
          });

      illust.author_fav   = !!_.fastxml.q(profile_area, '#favorite-button.following');
      illust.author_fav_m = !!_.fastxml.q(profile_area, '.user-relation .sprites-heart');
      illust.author_mypix = !!_.fastxml.q(profile_area, '#mypixiv-button.mypixiv');
      illust.author_image = avatar ? avatar.attrs.src : null;
      illust.author_name  = '[Error]';
      illust.author_url   = '';
      illust.author_id    = 0;
      if (author_name) {
        illust.author_name = _.fastxml.text(author_name);
      }
      if (author_link) {
        illust.author_url = author_link.attrs.href;
        if ((re = /\/member\.php\?id=(\d+)/.exec(illust.author_url))) {
          illust.author_id = g.parseInt(re[1], 10);
        }
      }
      illust.author_staccfeed = staccfeed_link ? staccfeed_link.attrs.href : null;

      if (!illust.author_id) {
        if ((re = /pixiv\.context\.userId\s*=\s*([\'\"])(\d+)\1;/.exec(html))) {
          illust.author_id = g.parseInt(re[2]);
        }
      }

      try {
        if (illust.author_id == w.pixiv.user.id) {
          illust.author_name  = '[Me]';
        }
      } catch(ex) { }

      var meta = _.fastxml.qa(work_info, '.meta li'),
          meta2 = _.fastxml.text(meta[1]);

      illust.datetime = _.fastxml.text(meta[0]);
      illust.repost = null;
      if ((re = /(\d{4})\u5e74(\d+)\u6708(\d+) (\d+):(\d\d) \u306b\u518d\u6295\u7a3f/.exec(html))) {
        illust.repost = {year: re[1], month: re[2], date: re[3], hour: re[4], minute: re[5]};
      }

      illust.size = null;
      illust.manga = {available: false, viewed: illust.manga ? !!illust.manga.viewed : false};
      if ((re = /^(\d+)\u00d7(\d+)$/.exec(meta2))) {
        illust.size = {width: g.parseInt(re[1], 10), height: g.parseInt(re[2], 10)};
      } else if ((re = /^[^ ]{1,10} (\d+)P$/.exec(meta2))) {
        illust.manga.page_count = g.parseInt(re[1], 10);
        illust.manga.available = illust.manga.page_count > 0;
      }

      illust.tools = _.fastxml.qa(work_info, '.meta .tools li').map(function(node) {
        return _.fastxml.text(node);
      });

      illust.bookmarked = !!_.fastxml.q(root, '.bookmark-container .bookmark-count');

      var response_to = _.fastxml.q(root, '.worksImageresponseInfo a');
      illust.has_image_response = !!_.fastxml.q(root, '.worksImageresponse .worksResponse');
      illust.image_response_to  = null;
      if (response_to) {
        var query = this.parse_illust_url(response_to.attrs.href);
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

      var comment_no_comment = _.fastxml.q(root, '.comment-no-comment');
      if (comment_no_comment) {
        illust.err_no_comment = _.fastxml.text(comment_no_comment);
      }
      return true;
    },

    load: function(illust) {
      if (illust.loaded) {
        _.popup.onload(illust);
        return;
      }

      var that = this;

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

        var err_on = statuses.html > 1;
        _.listen(image, 'error', function() {
          statuses[name] = -1;
          if (statuses[other] < 0 && err_on) {
            send_error('Failed to load image - ' + url);
          }
        });

        _.debug('trying to load image - ' + name + ':' + url);
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
        if (!that.parse_medium_html(illust, text)) {
          send_error();
          return;
        }

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

        if (_.conf.popup.preload && illust.manga.available) {
          that.load_manga_page(illust, 0);
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
      var that = this, pages = [], cnt = 0;

      var root = _.fastxml.parse(html);
      _.fastxml.qa(root, '.manga .item-container').forEach(function(page, pagenum) {
        var urls = [], urls_big = [];

        _.fastxml.qa(page, 'img').forEach(function(img) {
          if (img.attrs['data-filter'] !== 'manga-image') {
            return;
          }

          var url = img.attrs['data-src'] || img.attrs.src,
              url_big = url.replace(/(_p\d+\.\w+)(?=\?|$)/, '_big$1');

          ++cnt;
          if (html.indexOf('pixiv.context.pages[' + pagenum + '].unshift(' + cnt + ')') >= 0) {
            urls.unshift(url);
            urls_big.unshift(url_big);
          } else {
            urls.push(url);
            urls_big.push(url_big);
          }
        });

        if (urls.length) {
          pages.push({
            image_urls: urls,
            image_urls_big: urls_big,
            images: []
          });
        }
      });

      if (cnt !== illust.manga.page_count) {
        _.error('Manga page count mismatch!');
        return false;
      }

      illust.manga.pages = pages;
      return true;
    },

    load_manga_page: function(illust, page) {
      var that = this;

      if (!illust.manga.pages) {
        _.xhr.get(illust.url_manga, function(text) {
          if (that.parse_manga_html(illust, text)) {
            that.load_manga_page(illust, page);
          } else {
            _.popup.manga.onerror(illust, page);
          }
        }, function() {
          _.popup.manga.onerror(illust, page);
        });
        return;
      }

      if (page >= illust.manga.pages.length) {
        _.popup.manga.onerror(illust, page);
        return;
      }

      var big = _.conf.popup.big_image,
          page_data = illust.manga.pages[page],
          urls = big ? page_data.image_urls_big : page_data.image_urls,
          images = page_data.images;

      var error_sent = false;
      var send_error = function() {
        if (!error_sent) {
          _.popup.manga.onerror(illust, page);
          error_sent = true;
        }
      };

      var load_count = 0;
      var onload = function() {
        if (!error_sent && ++load_count === urls.length) {
          _.popup.manga.onload(illust, page, images);
        }
      };

      urls.forEach(function(url, idx) {
        if (images[idx]) {
          onload();
          return;
        }

        var img = new g.Image();

        img.onload = function() {
          images[idx] = img;
          onload();
        };

        img.onerror = function() {
          if (big) {
            big = false;
            img.src = page_data.image_urls[idx];
            _.warn('Big image for manga loading failed. Falling back to default image.');
          } else {
            send_error();
          }
        };

        img.src = url;
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
  });

  _.popup = _.mod({
    dom: { },
    images: [],
    saved_context: null,

    FIT_LONG:  0,
    FIT_SHORT: 1,
    ORIGINAL:  2,

    scrollbar_width:  0,
    scrollbar_height: 0,

    create: function() {
      var dom = this.dom;
      if (dom.created) {
        return;
      }

      var olc_icon = function(olc, next) {
        var svgns = 'http://www.w3.org/2000/svg',
            icon  = d.createElementNS(svgns, 'svg'),
            path  = d.createElementNS(svgns, 'path');
        icon.setAttribute('viewBox', '0 0 100 100');
        path.setAttribute('d', 'M 10 90 L 65 35 L 65 60 L 90 60 L 90 90 z');
        icon.appendChild(path);
        olc.appendChild(icon);
        return icon;
      };

      dom.root              = _.e('div', {id: 'pp-popup'});
      dom.title             = _.e('div', {id: 'pp-popup-title'}, dom.root);
      dom.rightbox          = _.e('div', {id: 'pp-popup-rightbox'}, dom.title);
      dom.status            = _.e('span', {id: 'pp-popup-status'}, dom.rightbox);
      dom.resize_mode       = _.e('a', {id: 'pp-popup-resize-mode'}, dom.rightbox);
      dom.button_manga      = _.e('a', {id: 'pp-popup-button-manga'}, dom.rightbox);
      dom.button_response   = _.e('a', {id: 'pp-popup-button-response', text: '[R]'}, dom.rightbox);
      dom.button_bookmark   = _.e('a', {id: 'pp-popup-button-bookmark', text: '[B]'}, dom.rightbox);
      dom.title_link        = _.e('a', null, dom.title);
      dom.title_clearfix    = _.e('div', {css: 'clear:both'}, dom.root);
      dom.header            = _.e('div', {id: 'pp-popup-header', cls: 'pp-hide'}, dom.root);
      dom.caption_wrapper   = _.e('div', {id: 'pp-popup-caption-wrapper'}, dom.header);
      dom.caption           = _.e('div', {id: 'pp-popup-caption'}, dom.caption_wrapper);
      dom.comment_wrapper   = _.e('div', {id: 'pp-popup-comment-wrapper'}, dom.caption_wrapper);
      dom.comment           = _.e('div', {id: 'pp-popup-comment'}, dom.comment_wrapper);
      dom.comment_form      = _.e('div', {id: 'pp-popup-comment-form'}, dom.comment);
      dom.comment_history   = _.e('div', {id: 'pp-popup-comment-history', cls: 'comment-area'}, dom.comment);
      dom.comment_err_empty = _.e('div', {cls: 'comment-no-comment pp-hide'}, dom.comment);
      dom.taglist           = _.e('div', {id: 'pp-popup-taglist', cls: 'work-tags'}, dom.header);
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
      dom.olc_prev          = _.e('div', {id: 'pp-popup-olc-prev', cls: 'pp-popup-olc'}, dom.image_scroller);
      dom.olc_prev_icon     = olc_icon(dom.olc_prev);
      dom.olc_next          = _.e('div', {id: 'pp-popup-olc-next', cls: 'pp-popup-olc'}, dom.image_scroller);
      dom.olc_next_icon     = olc_icon(dom.olc_next, true);
      dom.image_layout      = _.e('a', {id: 'pp-popup-image-layout'}, dom.image_scroller);
      dom.bookmark_wrapper  = _.e('div', {id: 'pp-popup-bookmark-wrapper'}, dom.root);
      dom.tagedit_wrapper   = _.e('div', {id: 'pp-popup-tagedit-wrapper'}, dom.root);

      if (!_.conf.popup.show_comment_form) {
        dom.comment_form.classList.add('pp-hide');
      }

      dom.comment_err_empty.textContent = 'Sorry, comments could not be found';

      this.input.init();

      var that = this;
      _.listen(w, 'resize', function() {
        if (that.running) {
          that.adjust();
        }
      }, {async: true});

      dom.created = true;
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

    layout_images: function(max_width, max_height, update_resize_mode) {
      if (!this.images || this.images.length < 1) {
        return;
      }

      var that = this;

      var natural_sizes, dom = this.dom;

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
          aspect_ratio = total_width / total_height;

      if (aspect_ratio < 1) {
        aspect_ratio = 1 / aspect_ratio;
      }
      this.aspect_ratio = aspect_ratio;

      if (total_width > max_width || total_height > max_height) {
        if (update_resize_mode && _.conf.popup.fit_short_threshold > 0) {
          if (aspect_ratio >= _.conf.popup.fit_short_threshold) {
            this.resize_mode = this.FIT_SHORT;
          } else {
            this.resize_mode = this.FIT_LONG;
          }
        }
        update_scale = true;
      }

      // update resize mode indicator

      dom.resize_mode.textContent = '[' + 'LSO'[this.resize_mode] + ']';
      if (this.resize_mode === this.FIT_LONG) {
        dom.resize_mode.classList.add('pp-hide');
      } else {
        dom.resize_mode.classList.remove('pp-hide');
      }

      if (update_scale) {
        if (this.resize_mode === this.FIT_LONG) {
          scale = g.Math.min(max_width / total_width, max_height / total_height, 1);

        } else {
          var scroll_x = false, scroll_y = false;
          this.update_scrollbar_size();

          if (this.resize_mode === this.FIT_SHORT) {
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
            }
            image_scroller.style.maxWidth  = max_width  + 'px';
            image_scroller.style.overflowX = 'auto';
            image_scroller.style['overflow-x'] = 'auto';
          }

          if (scroll_y) {
            if (total_width + this.scrollbar_width > max_width) {
              image_scroller.style.width = max_width + 'px';
            }
            image_scroller.style.maxHeight = max_height + 'px';
            image_scroller.style.overflowY = 'auto';
            image_scroller.style['overflow-y'] = 'auto';
          }
        }
      }

      // apply scale

      this.images.forEach(function(img, idx) {
        img.style.height = g.Math.round(natural_sizes[idx].height * scale) + 'px';
      });
      this.scale = scale;

      // centerize

      var height = g.Math.max.apply(g.Math, this.images.map(function(img) {
        return img.offsetHeight;
      }));

      this.images.forEach(function(img) {
        img.style.margin = g.Math.floor((height - img.offsetHeight) / 2) + 'px 0px 0px 0px';
      });

      // update info area

      var size_list, illust = this.illust;
      if (illust.size && !illust.manga.available && !this.manga.active) {
        size_list = [illust.size];
      } else {
        size_list = natural_sizes;
      }

      var size_text = size_list.map(function(size, idx) {
        var str = size.width + 'x' + size.height,
            more_info = [],
            img = that.images[idx],
            re;

        if (img.offsetWidth !== size.width) {
          more_info.push((g.Math.floor(img.offsetWidth * 100 / size.width) / 100) + 'x');
        }

        if (_.conf.general.debug) {
          more_info.push('ar:' + (g.Math.floor(_.calculate_ratio(size.width, size.height) * 100) / 100));
        }

        if ((re = /\.(\w+)(?:\?|$)/.exec(img.src))) {
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

      dom.size.textContent = size_text;
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

      if (olc.offsetHeight - size < olc.offsetWidth - size) {
        top = g.Math.floor((olc.offsetHeight  - size) / 2);
      } else {
        top = olc.offsetHeight - size - left;
      }

      if (next) {
        left = olc.offsetWidth - size - left;
      }

      icon.style.width  = size + 'px';
      icon.style.height = size + 'px';
      icon.style.left   = left + 'px';
      icon.style.top    = top  + 'px';
    },

    adjust: function(update_resize_mode) {
      if (!this.running) {
        return;
      }

      var dom = this.dom, root = dom.root, de = d.documentElement,
          max_size = this.calculate_max_content_size();

      root.style.left = '0px';
      root.style.top  = '0px';

      if (this.bookmark.active) {
        this.bookmark.adjust(max_size[0], max_size[1]);

      } else if (this.tagedit.active) {
        this.tagedit.adjust(max_size[0], max_size[1]);

      } else {
        dom.image_layout.style.margin = '0px';

        this.layout_images(max_size[0], max_size[1], update_resize_mode);

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

      root.style.left = g.Math.floor((de.clientWidth  - root.offsetWidth)  / 2) + 'px';
      root.style.top  = g.Math.floor((de.clientHeight - root.offsetHeight) / 2) + 'px';
    },

    clear: function() {
      var dom = this.dom;

      dom.button_manga.classList.add('pp-hide');
      dom.button_response.classList.add('pp-hide');
      dom.author_status.classList.add('pp-hide');
      dom.author_image.classList.add('pp-hide');

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

      this.resize_mode = this.FIT_LONG;

      this.bookmark.clear();
      this.manga.clear();
      this.question.clear();
      this.comment.clear();
      this.tagedit.clear();
    },

    set_images: function(images) {
      var dom = this.dom;
      this.images = images;
      _.clear(dom.image_layout);
      this.images.forEach(function(img) {
        dom.image_layout.appendChild(img);
      });
      this.dom.image_scroller.scrollTop = 0;
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

      this.clear();

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
        dom.button_response.href
          = '/member_illust.php?mode=medium&illust_id=' + illust.image_response_to;
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

      if (illust.err_no_comment) {
        dom.comment_err_empty.textContent = illust.err_no_comment;
      }

      dom.taglist.innerHTML = illust.taglist;
      _.onclick(
        _.e('a', {text: '[E]', href: '#', id: 'pp-popup-tagedit-button'}, dom.taglist),
        function() {
          that.tagedit.start();
          return true;
        }
      );

      dom.rating.innerHTML = illust.rating + illust.question;

      ['pixpedia', 'pixiv_comic'].forEach(function(name) {
        var f = _.conf.popup['remove_' + name];
        dom.taglist.classList[f ? 'add' : 'remove']('pp-no-' + name.replace('_', '-'));
      });

      if (_.conf.popup.author_status_icon) {
        [
          ['fav', 'pp-fav'],
          ['fav_m', 'pp-fav-m'],
          ['mypix', 'pp-mypix']
        ].forEach(function(p) {
          if (illust['author_' + p[0]]) {
            dom.author_status.classList.add(p[1]);
            dom.author_status.classList.remove('pp-hide');
          } else {
            dom.author_status.classList.remove(p[1]);
          }
        });
      }

      if (illust.author_image) {
        dom.author_image.src = illust.author_image;
        dom.author_image.classList.remove('pp-hide');
      }

      var datetime = illust.datetime;
      if (illust.repost) {
        var repost = _.lng.repost;
        for(var key in illust.repost) {
          repost = repost.replace('$' + key, illust.repost[key]);
        }
        datetime += repost;
      }
      dom.datetime.textContent = datetime;

      illust.tools.forEach(function(tool) {
        var url = '/search.php?word=' + g.encodeURIComponent(tool) + '&s_mode=s_tag';
        _.e('a', {href: url, text: tool}, dom.tools);
      });

      if (illust.author_id) {
        dom.author_profile.href = '/member.php?id=' + illust.author_id;
        dom.author_profile.innerHTML = illust.author_name;
        dom.author_works.href = '/member_illust.php?id=' + illust.author_id;
        dom.author_works.textContent = _.lng.author_works;
        dom.author_bookmarks.href = '/bookmark.php?id=' + illust.author_id;
        dom.author_bookmarks.textContent = _.lng.author_bookmarks;
      }
      if (illust.author_staccfeed) {
        dom.author_staccfeed.href = illust.author_staccfeed;
        dom.author_staccfeed.textContent = _.lng.author_staccfeed;
      }

      if (illust.manga.available) {
        dom.image_layout.href = illust.url_manga;
      } else {
        dom.image_layout.href = illust.image_url_big;
      }

      if ((_.conf.popup.big_image && illust.image_big) || !illust.image_medium) {
        this.set_images([illust.image_big]);
      } else {
        this.set_images([illust.image_medium]);
      }

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

      this.dom.header.classList.remove('pp-hide');

      this.set_status('');
      this.adjust(true);
    },

    onerror: function(illust) {
      if (illust !== this.illust || this.bookmark.active || this.tagedit.active) {
        return;
      }

      var msg = illust.error || 'Unknown error';
      _.error(msg);
      this.dom.image_layout.textContent = msg;
      this.set_status('Error');
      this.adjust();
    },

    set_status: function(text) {
      var dom = this.dom;
      if (text) {
        dom.status.textContent = text;
        if (text && dom.image_layout.childNodes.length < 1) {
          dom.image_layout.textContent = text;
        }
        dom.status.classList.remove('pp-hide');
      } else {
        dom.status.classList.add('pp-hide');
      }
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
      dom.header.style.opacity = _.conf.popup.caption_opacity;

      this.illust = illust;
      this.running = true;
      if (!dom.root.parentNode) {
        d.body.insertBefore(dom.root, d.body.firstChild);
      }
      this.set_status('Loading');
      this.adjust();
      _.illust.load(illust);
      _.lazy_scroll(illust.image_thumb);
    },

    hide: function() {
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
      this.dom.header.classList.add('pp-hide');
      this.running = false;
    },

    reload: function() {
      _.illust.unload(this.illust);
      this.show(this.illust);
    },

    show_caption: function() {
      this.dom.header.classList.add('pp-show');
    },

    hide_caption: function() {
      this.question.blur();
      this.dom.header.classList.remove('pp-show');
    },

    toggle_caption: function() {
      if (this.dom.header.classList.contains('pp-show')) {
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
        } catch(ex) { }
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
    }
  });

  _.popup.bookmark = _.mod({
    active: false,

    clear: function() {
      _.clear(_.popup.dom.bookmark_wrapper);
      _.popup.dom.root.classList.remove('pp-bookmark-mode');
      this.active = false;
      w.focus(); // for Firefox
    },

    adjust: function(w, h) {
      if (this.active) {
        _.bookmarkform.adjust(w, h);
      }
    },

    onload: function(illust, html) {
      if (illust !== _.popup.illust || !this.active) {
        return;
      }

      var root = _.fastxml.parse(html),
          body = _.fastxml.q(root, '.layout-body');

      var re, wrapper = _.popup.dom.bookmark_wrapper;

      wrapper.innerHTML = _.fastxml.src(body, true);

      (function(re) {
        if (!re) {
          return;
        }

        var tags = re[1].replace(/\\([\\\"])/g, '$1');

        w.pixiv.context.tags = tags;

        var load = w.pixiv.bookmarkTag.load;
        w.pixiv.bookmarkTag.load = function(){};
        w.pixiv.bookmarkTag.setup(_.q('.tag-cloud-container', wrapper));
        w.pixiv.bookmarkTag.load = load;

        w.pixiv.tag.setup();

        w.pixiv.bookmarkTag.data = g.JSON.parse(tags);
        w.pixiv.bookmarkTag.initialize();
        w.pixiv.bookmarkTag.show();
        w.pixiv.bookmarkTag.tagContainer.removeClass('loading-indicator');

      })(/>pixiv\.context\.tags\s*=\s*\'([^\']+)';/.exec(html));

      _.onclick(wrapper, function(ev) {
        if (ev.target.classList.contains('tag')) {
          w.pixiv.tag.toggle(ev.target.dataset.tag);
        }
      });

      var that = this;

      _.bookmarkform.setup(wrapper, !illust.bookmarked, function() {
        _.xhr.remove_cache(illust.url_bookmark);

        if (illust === _.popup.illust && _.popup.bookmark.active) {
          that.end();
          _.popup.reload();
        }
      });

      if (_.bookmarkform.dom.input_tag) {
        g.setTimeout(function() {
          _.bookmarkform.dom.input_tag.focus();
        }, 0);
      }

      _.popup.dom.root.classList.add('pp-bookmark-mode');
      _.popup.set_status('');
      _.popup.adjust();
    },

    start: function() {
      if (this.active) {
        return;
      }

      var that = this;

      var illust = _.popup.illust;
      this.active = true;
      _.popup.set_status('Loading');

      _.xhr.get(illust.url_bookmark, function(html) {
        that.onload(illust, html);
      }, function() {
        if (illust !== _.popup.illust || !that.active) {
          return;
        }

        that.active = false;
        _.popup.set_status('Error');
      });
    },

    submit: function() {
      if (!this.active) {
        return;
      }

      _.bookmarkform.dom.form.submit();
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
  });

  _.popup.manga = _.mod({
    active: false,
    page: -1,

    clear: function() {
      this.active = false;
      this.page = -1;
      this.update_button();
    },

    onload: function(illust, page, images) {
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

      _.popup.dom.image_layout.href = illust.url_manga + '#pp-manga-page-' + page;
      _.popup.set_images(images);
      _.popup.set_status('');
      _.popup.adjust(true);
    },

    onerror: function(illust, page) {
      if (illust !== _.popup.illust || !this.active || page !== this.page) {
        return;
      }
      if (illust.error) {
        _.popup.dom.image_layout.textContent = illust.error;
      }
      _.popup.set_status('Error');
      _.popup.adjust();
    },

    update_button: function() {
      var illust = _.popup.illust,
          pages = illust.manga.pages,
          page;

      if (this.page >= 0 && pages) {
        page = 1;
        for(var i = 0; i < this.page; ++i) {
          page += pages[i].image_urls.length;
        }

        var img_cnt = pages[this.page].image_urls.length;
        if (img_cnt > 1) {
          page = page + '-' + (page + img_cnt - 1);
        }

      } else {
        page = this.page + 1;
      }

      _.popup.dom.button_manga.textContent = '[M:' + page + '/' + illust.manga.page_count + ']';
      _.popup.dom.button_manga.classList[this.page >= 0 ? 'add' : 'remove']('pp-active');
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
      illust.manga.viewed = true;
      _.popup.set_status('Loading');
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
  });

  _.popup.question = _.mod({
    is_active: function() {
      return !!_.q('.questionnaire .list.visible,.questionnaire .stats.visible', _.popup.dom.rating);
    },

    clear: function() {
    },

    get_buttons: function() {
      return _.qa('.questionnaire .list ol input[type="button"]');
    },

    get_selected: function() {
      var active = d.activeElement;
      if (this.get_buttons().indexOf(active) >= 0) {
        return active;
      }
      return null;
    },

    blur: function() {
      var selected = this.get_selected();
      if (selected) {
        selected.blur();
      }
    },

    select_button: function(move) {
      var buttons;
      if (move === 0 || (buttons = this.get_buttons()).length < 1) {
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
      this.select_button(-1);
    },

    select_next : function() {
      this.select_button(1);
    },

    submit: function() {
      var selected = this.get_selected();
      if (selected) {
        _.send_click(selected);
      }
    },

    start: function() {
      var toggle = _.q('.questionnaire .toggle-list,.questionnaire .toggle-stats', _.popup.dom.rating);
      if (toggle) {
        _.popup.show_caption();
        _.send_click(toggle);
      }
    },

    end: function() {
      this.blur();
      _.qa('.questionnaire .list,.questionnaire .stats', _.popup.dom.rating).forEach(function(elem) {
        elem.classList.remove('visible');
      });
    }
  });

  _.popup.comment = _.mod({
    active: false,

    clear: function() {
      _.popup.dom.root.classList.remove('pp-comment-mode');
      _.clear(_.popup.dom.comment_form, _.popup.dom.comment_history);
      this.active = false;
    },

    scroll: function() {
      _.popup.dom.caption_wrapper.scrollTop = _.popup.dom.caption.offsetHeight;
    },

    onload: function(illust, html) {
      if (illust !== _.popup.illust || !this.active) {
        return;
      }
      _.popup.dom.comment_history.innerHTML = '<ul>' + html + '</ul>';
      _.popup.dom.comment_err_empty.classList[html ? 'add' : 'remove']('pp-hide');
      _.popup.adjust();
      this.scroll();
    },

    onerror: function(illust, message) {
      if (illust !== _.popup.illust || !this.active) {
        return;
      }
      _.popup.dom.comment_history.textContent = message || 'Error';
    },

    reload: function() {
      var illust = _.popup.illust;
      if (!illust.author_id) {
        this.onerror(illust, 'Author id not specified');
        return;
      }

      var that = this;
      try {
        w.pixiv.api.post('/rpc_comment_history.php', {
          i_id: illust.id,
          u_id: illust.author_id
        }, {
          ajaxSettings: {dataType: 'text'}
        }).done(function(data) {
          try {
            var obj  = g.JSON.parse(data),
                html = obj.data.html_array.join('');
            that.onload(illust, html);
          } catch(ex) {
            that.onerror(illust, g.String(ex));
          }
        }).fail(function(data) {
          that.onerror(illust, data);
        });
      } catch(ex) {
        this.onerror(illust);
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

      var that = this;

      var form  = _.e('form', {action: '/member_illust.php', method: 'POST'}, _.popup.dom.comment_form);
      var input = _.e('input', {name: 'comment'}, form);

      for(var name in data) {
        if (name === 'submit' || name === 'comment') {
          continue;
        }
        _.e('input', {type: 'hidden', name: name, value: data[name]}, form);
      }

      _.listen(form, 'submit', function() {
        _.xhr.post(form, function() {
          that.setup_form();
          that.reload();
        }, function() {
          g.alert('Error!');
        });
        input.setAttribute('disabled', '');
        return true;
      });
    },

    start: function() {
      if (this.active) {
        return;
      }
      this.active = true;
      this.setup_form();
      if (_.popup.dom.comment_history.childNodes.length < 1) {
        this.reload();
      }
      _.popup.dom.root.classList.add('pp-comment-mode');
      _.popup.show_caption();
      _.popup.adjust();
      this.scroll();
    },

    end: function() {
      if (!this.active) {
        return;
      }
      _.popup.dom.root.classList.remove('pp-comment-mode');
      this.active = false;
      _.popup.adjust();
      _.popup.dom.caption_wrapper.scrollTop = 0;
    },

    toggle: function() {
      if (this.active) {
        this.end();
      } else {
        this.start();
      }
    }
  });

  _.popup.tagedit = _.mod({
    active: false,

    clear: function() {
      _.popup.dom.root.classList.remove('pp-tagedit-mode');
      _.clear(_.popup.dom.tagedit_wrapper);
      this.active = false;
    },

    adjust: function(w, h) {
      var wrap  = _.popup.dom.tagedit_wrapper,
          twrap = _.q('#pp-popup-tagedit-table-wrapper', wrap);

      if (!twrap) {
        return;
      }

      h -= wrap.offsetHeight - twrap.offsetHeight;
      twrap.style.maxHeight = h + 'px';
    },

    onload: function(illust, html) {
      if (illust !== _.popup.illust || !this.active) {
        return;
      }
      _.clear(_.popup.dom.tagedit_wrapper);

      var c = _.e('div', {id: 'tag-editor', css: 'display:block'}, _.popup.dom.tagedit_wrapper);
      c.innerHTML = html;

      var table = _.q('table', c);
      if (table) {
        var tw = _.e('div', {id: 'pp-popup-tagedit-table-wrapper'});
        table.parentNode.replaceChild(tw, table);
        tw.appendChild(table);
      }

      _.popup.set_status('');
      _.popup.dom.root.classList.add('pp-tagedit-mode');
      _.popup.adjust();
    },

    onerror: function(illust, message) {
      if (illust !== _.popup.illust || !this.active) {
        return;
      }
      if (!_.popup.dom.root.classList.contains('pp-tagedit-mode')) {
        this.active = false;
      }
      _.popup.dom.tagedit_wrapper.textContent = message || 'Error';
      _.popup.set_status('Error');
    },

    reload: function() {
      var illust = _.popup.illust;
      if (!illust.author_id) {
        this.onerror(illust, 'Author id not specified');
        return;
      }

      var that = this;
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
            that.onload(illust, g.JSON.parse(data).html);
          } catch(ex) {
            that.onerror(illust, g.String(ex));
          }
        }).fail(function(data) {
          that.onerror(illust, data);
        });
      } catch(ex) {
        this.onerror(illust);
        return;
      }

      _.popup.set_status('Loading');
    },

    start: function() {
      if (this.active) {
        return;
      }
      this.active = true;
      this.reload();
      _.popup.adjust();
    },

    end: function() {
      if (!this.active) {
        return;
      }
      this.active = false;
      _.popup.dom.root.classList.remove('pp-tagedit-mode');
      _.popup.adjust();
    }
  });

  _.popup.input = _.mod((function(mod) {

    for(var i = 1; i <= 10; ++i) {
      mod['rate' + (i <= 9 ? '0' : '') + i] = (function(i) {
        return function() {
          if (_.conf.popup.rate_key) {
            _.popup.send_rate(i);
            return true;
          }
          return false;
        };
      })(i);
    }

    return mod;
  })({
    wheel_delta: 0,

    init: function() {
      var that = this;

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
        that[name] = value;
      });

      _.popup.key.init();
      _.popup.mouse.init();
    },

    /*
     * direction
     *   0: vertical
     *   1: horizontal
     *   2: vertical(prior) or horizontal
     */
    scroll: function(elem, direction, offset) {
      var prop, page, max, value;

      if (direction === 2) {
        if (elem.scrollHeight > elem.clientHeight) {
          direction = 0;
        } else if (elem.scrollWidth > elem.clientWidth) {
          direction = 1;
        } else {
          return false;
        }
      }

      if (direction === 0) {
        prop = 'scrollTop';
        page = elem.clientHeight;
        max = elem.scrollHeight - page;
      } else if (direction === 1) {
        prop = 'scrollLeft';
        page = elem.clientWidth;
        max = elem.scrollWidth - page;
      } else {
        return false;
      }

      if (offset > -1 && offset < 1) {
        offset = g.Math.floor(page * offset);
      }

      value = g.Math.min(g.Math.max(0, elem[prop] + offset), max);
      if (value !== elem[prop]) {
        elem[prop] = value;
        return true;
      }

      return false;
    },

    prev: function() {
      if (_.popup.manga.active) {
        _.popup.manga.show(_.popup.manga.page - 1);
      } else {
        _.popup.show(_.popup.illust[this.reverse ? 'next' : 'prev']);
      }
      return true;
    },

    next: function() {
      if (_.popup.manga.active) {
        _.popup.manga.show(_.popup.manga.page + 1);
      } else if (this.auto_manga && _.popup.illust.manga.available && !_.popup.illust.manga.viewed) {
        _.popup.manga.start();
      } else {
        _.popup.show(_.popup.illust[this.reverse ? 'prev' : 'next']);
      }
      return true;
    },

    prev_direction: function() {
      if (_.popup.manga.active) {
        _.popup.manga.show(_.popup.manga.page - 1);
      } else {
        _.popup.show(_.popup.illust.prev);
      }
      return true;
    },

    next_direction: function() {
      if (_.popup.manga.active) {
        _.popup.manga.show(_.popup.manga.page + 1);
      } else {
        _.popup.show(_.popup.illust.next);
      }
      return true;
    },

    first: function() {
      if (_.popup.manga.active) {
        _.popup.manga.show(0);
      } else {
        _.popup.show(_.illust.list[0]);
      }
      return true;
    },

    last: function() {
      if (_.popup.manga.active) {
        _.popup.manga.show(_.popup.illust.manga.pages.length - 1);
      } else {
        _.popup.show(_.illust.list[_.illust.list.length - 1]);
      }
      return true;
    },

    caption_scroll_up: function() {
      return this.scroll(_.popup.dom.caption_wrapper, 0, -_.conf.popup.scroll_height);
    },

    caption_scroll_down: function() {
      return this.scroll(_.popup.dom.caption_wrapper, 0, _.conf.popup.scroll_height);
    },

    illust_scroll_up: function() {
      return this.scroll(_.popup.dom.image_scroller, 0, -_.conf.popup.scroll_height);
    },

    illust_scroll_down: function() {
      return this.scroll(_.popup.dom.image_scroller, 0, _.conf.popup.scroll_height);
    },

    illust_scroll_left: function() {
      return this.scroll(_.popup.dom.image_scroller, 1, -_.conf.popup.scroll_height);
    },

    illust_scroll_right: function() {
      return this.scroll(_.popup.dom.image_scroller, 1, _.conf.popup.scroll_height);
    },

    illust_scroll_top: function() {
      if (_.popup.can_scroll()) {
        var el = _.popup.dom.image_scroller;
        el.scrollLeft = 0;
        el.scrollTop = 0;
        return true;
      }
      return false;
    },

    illust_scroll_bottom: function() {
      if (_.popup.can_scroll()) {
        var el = _.popup.dom.image_scroller;
        el.scrollLeft = el.scrollWidth;
        el.scrollTop = el.scrollHeight;
        return true;
      }
      return false;
    },

    illust_page_up: function() {
      return this.scroll(_.popup.dom.image_scroller, 2, -0.8);
    },

    illust_page_down: function() {
      return this.scroll(_.popup.dom.image_scroller, 2, 0.8);
    },

    switch_resize_mode: function() {
      var newval;
      if (_.popup.scale >= 1) {
        newval = _.popup.FIT_LONG;
      } else {
        var modes = ['FIT_LONG', 'FIT_SHORT', 'ORIGINAL'].map(function(name) {
          return _.popup[name];
        });

        var next = modes.indexOf(_.popup.resize_mode) + 1;
        if (next < 0 || next >= modes.length) {
          next = 0;
        }
        newval = modes[next];
      }
      if (newval !== _.popup.resize_mode) {
        _.popup.resize_mode = newval;
        _.popup.adjust();
        return true;
      }
      return false;
    },

    close: function() {
      _.popup.hide();
      return true;
    },

    open: function() {
      _.open(_.popup.illust.url_medium);
      return true;
    },

    open_big: function() {
      if (_.popup.illust.manga.available) {
        if (_.popup.manga.active) {
          var page = _.popup.illust.manga.pages[_.popup.manga.page];
          page.image_urls_big.forEach(function(url, idx) {
            _.open(url);
          });
        } else {
          _.open(_.popup.illust.url_manga);
        }
      } else {
        _.open(_.popup.illust.image_url_big);
      }
      return true;
    },

    open_profile: function() {
      _.open(_.popup.dom.author_profile.href);
      return true;
    },

    open_illust: function() {
      _.open(_.popup.dom.author_works.href);
      return true;
    },

    open_bookmark: function() {
      _.open(_.popup.dom.author_bookmarks.href);
      return true;
    },

    open_staccfeed: function() {
      _.open(_.popup.dom.author_staccfeed.href);
      return true;
    },

    open_response: function() {
      if (_.popup.illust.has_image_response || _.popup.illust.image_response_to) {
        _.open(_.popup.dom.button_response.href);
        return true;
      }
      return false;
    },

    open_bookmark_detail: function() {
      _.open(_.popup.illust.url_bookmark_detail);
      return true;
    },

    open_manga_thumbnail: function() {
      _.open(_.popup.illust.url_manga + '#pp-manga-thumbnail');
      return true;
    },

    reload: function() {
      _.popup.reload();
      return true;
    },

    caption_toggle: function() {
      _.popup.toggle_caption();
      return true;
    },

    comment_toggle: function() {
      _.popup.comment.toggle();
      return true;
    },

    // manga mode

    manga_start: function() {
      if (_.popup.illust.manga.available && !_.popup.manga.active) {
        _.popup.manga.start();
        return true;
      }
      return false;
    },

    manga_end: function() {
      if (_.popup.manga.active) {
        _.popup.manga.end();
        return true;
      }
      return false;
    },

    manga_open_page: function() {
      if (_.popup.manga.active) {
        var hash = '';
        if (_.popup.manga.active) {
          hash = '#pp-manga-page-' + _.popup.manga.page;
        }
        _.open(_.popup.illust.url_manga + hash);
        return true;
      }
      return false;
    },

    // question mode
    qrate_start: function() {
      if (!_.popup.question.is_active()) {
        _.popup.question.start();
        return true;
      }
      return false;
    },

    qrate_end: function() {
      if (_.popup.question.is_active()) {
        _.popup.question.end();
        return true;
      }
      return false;
    },

    qrate_submit: function() {
      if (_.popup.question.is_active()) {
        _.popup.question.submit();
        return true;
      }
      return false;
    },

    qrate_select_prev: function() {
      if (_.popup.question.is_active()) {
        _.popup.question.select_prev();
        return true;
      }
      return false;
    },

    qrate_select_next: function() {
      if (_.popup.question.is_active()) {
        _.popup.question.select_next();
        return true;
      }
      return false;
    },

    // bookmark mode

    bookmark_start: function() {
      _.popup.bookmark.start();
      return true;
    },

    bookmark_end: function() {
      if (_.popup.bookmark.active) {
        _.popup.bookmark.end();
        return true;
      }
      return false;
    },

    bookmark_submit: function() {
      if (_.popup.bookmark.active) {
        _.popup.bookmark.submit();
        return true;
      }
      return false;
    },

    // tag edit mode

    tag_edit_start: function() {
      if (!_.popup.tagedit.active) {
        _.popup.tagedit.start();
        return true;
      }
      return false;
    },

    tag_edit_end: function() {
      if (_.popup.tagedit.active) {
        _.popup.tagedit.end();
        return true;
      }
      return false;
    }
  }));

  _.popup.key = _.mod({
    keys: [
      'bookmark_submit',
      'bookmark_end',

      function() {
        return _.popup.bookmark.active;
      },

      'qrate_start',
      'qrate_end',
      'qrate_submit',
      'qrate_select_prev',
      'qrate_select_next',

      'illust_scroll_up',
      'illust_scroll_down',
      'illust_scroll_left',
      'illust_scroll_right',
      'illust_scroll_top',
      'illust_scroll_bottom',
      'illust_page_up',
      'illust_page_down',

      'prev',
      'next',
      'prev_direction',
      'next_direction',
      'first',
      'last',
      'caption_scroll_up',
      'caption_scroll_down',
      'switch_resize_mode',
      'close',

      'rate01',
      'rate02',
      'rate03',
      'rate04',
      'rate05',
      'rate06',
      'rate07',
      'rate08',
      'rate09',
      'rate10',

      'open',
      'open_big',
      'open_profile',
      'open_illust',
      'open_bookmark',
      'open_staccfeed',
      'open_response',
      'open_bookmark_detail',
      'open_manga_thumbnail',
      'bookmark_start',
      'reload',
      'caption_toggle',
      'comment_toggle',

      'manga_start',
      'manga_end',
      'manga_open_page',

      'tag_edit_start',
      'tag_edit_end'
    ],

    init: function(context) {
      var that = this;

      _.key.listen(context || w, function(key, ev, connection) {
        if (!_.popup.running || !_.key_enabled(ev)) {
          return false;
        }

        var cancel = false;

        for(var i = 0; i < that.keys.length; ++i) {
          var item = that.keys[i];

          if (item instanceof g.Function) {
            if (item()) {
              break;
            }
            continue;
          }

          if (_.conf.key['popup_' + item].split(',').indexOf(key) >= 0) {
            var action = _.popup.input[item];
            cancel = true;
            if (action()) {
              break;
            }
          }
        }

        return cancel;
      }, {capture: true});
    }
  });

  _.popup.mouse = _.mod({
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

      _.onclick(dom.resize_mode, function() {
        _.popup.input.switch_resize_mode();
        return true;
      });

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

      _.onwheel(dom.image_scroller, function(ev) {

        /* Firefox
         *   MouseScrollEvent::axis
         *     HORIZONTAL_AXIS = 1
         *     VERTICAL_AXIS   = 2
         *
         * https://developer.mozilla.org/en/docs/DOM/MouseScrollEvent
         */

        if (((ev.wheelDeltaX || ev.axis === 1) && _.popup.can_scroll_horizontally()) ||
            ((ev.wheelDeltaY || ev.axis === 2) && _.popup.can_scroll_vertically())) {
          ev.stopPropagation();
        }
        return false;
      });

      _.onclick(dom.comment_wrapper, function(ev) {
        if (/^(?:pp-popup-comment-wrapper|pp-popup-comment)$/.test(ev.target.id)) {
          dom.comment_form.classList.toggle('pp-hide');
          _.conf.popup.show_comment_form = !dom.comment_form.classList.contains('pp-hide');
        }
      });

      _.onclick(dom.tagedit_wrapper, function(ev) {
        var endbtn = ev.target;
        if (endbtn instanceof w.HTMLInputElement &&
            (endbtn.getAttribute('onclick') || '').indexOf('endTagEdit') >= 0) {
          _.popup.tagedit.end();
          return true;
        }
        return false;
      });
    }
  });

  _.bookmarkform = _.mod({
    dom: {},

    calc_tag_rect: function(group, rect, grect) {
      if (!grect) {
        grect = group.getBoundingClientRect();
      }
      return {top:    rect.top    - grect.top  + group.scrollTop,
              bottom: rect.bottom - grect.top  + group.scrollTop,
              left:   rect.left   - grect.left + group.scrollLeft,
              right:  rect.right  - grect.left + group.scrollLeft};
    },

    select_tag: function(gidx, idx, rect) {
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
        _.lazy_scroll(this.sel.tag, group, group);

      } else {
        this.sel.tag  = null;
        this.sel.rect = null;
      }
    },

    autoinput_tag: function() {
      if (!this.dom.input_tag) {
        return;
      }

      var illust_tags = _.qa('.work-tags-container .tag[data-tag]', this.dom.root).map(function(tag) {
        return tag.dataset.tag;
      });

      var tags_value = [];

      var aliases = _.conf.bookmark.tag_aliases;
      _.qa('.tag-container.tag-cloud-container .tag[data-tag]').forEach(function(tage) {
        var tag = tage.dataset.tag, pattern;

        pattern = new g.RegExp([tag].concat(aliases[tag] || []).map(_.escape_regex).join('|'));

        for(var i = 0; i < illust_tags.length; ++i) {
          if (pattern.test(illust_tags[i])) {
            tags_value.push(tag);
            break;
          }
        }
      });

      this.dom.input_tag.value = tags_value.join(' ');
      w.pixiv.tag.update();
    },

    setup_tag_order: function() {
      var mytags = _.q('.tag-container.tag-cloud-container .list-items', this.dom.root);
      if (!mytags || _.conf.bookmark.tag_order.length < 1) {
        return;
      }

      _.reorder_tag_list(mytags, function(tag) {
        return tag.querySelector('.tag').dataset.tag;
      });

      var opt = _.q('.list-option.tag-order', this.dom.root);
      if (opt) {
        opt.parentNode.removeChild(opt);
      }
    },

    select_nearest_tag: function(key) {
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

      var set = function(d, gidx, idx, rect, distance) {
        d.set      = true;
        d.gidx     = gidx;
        d.idx      = idx;
        d.rect     = rect;
        d.distance = distance;
      };

      dom.tag_groups.forEach(function(p, gidx) {
        var group = p[0], tags = p[1], grect;
        grect = group.getBoundingClientRect();

        tags.forEach(function(tag, idx) {
          if (tag === sel.tag) {
            return;
          }

          g.Array.prototype.map.call(tag.getClientRects(), function(r) {
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

    onkey: function(key, ev) {
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
        _.send_click(this.sel.tag);
        return true;

      } else if (key === 'Escape') {
        this.select_tag(-1);
        return true;
      }

      return this.select_nearest_tag(key);
    },

    setup_key: function() {
      var dom = this.dom;

      dom.tags = [];
      dom.tag_groups = [];
      dom.input_tag = _.q('input#input_tag', dom.root);

      _.qa('.tag-container', dom.root).forEach(function(g) {
        var tags = _.qa('.tag[data-tag]', g);
        if (tags.length) {
          dom.tags = dom.tags.concat(tags);
          dom.tag_groups.push([g, tags]);
        }
      });

      _.key.listen(dom.input_tag, this.onkey);
    },

    setup_alias_ui: function() {
      var that = this;

      var root = this.dom.root;
      var first_tag_list = _.q('.work-tags-container', root);
      if (!first_tag_list) {
        return;
      }

      var starter = _.e('button', {text: _.lng.associate_tags,
                                   cls: 'btn_type03', css: 'float:right'});
      first_tag_list.insertBefore(starter, first_tag_list.firstChild);

      var associate = function(tag1, tag2) {
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

      var select = function(tag, button) {
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

      this.dom.tag_groups.forEach(function(grp) {
        grp[1].forEach(function(tag) {
          var tag_t  = tag.dataset.tag,
              button = _.e('button', {cls: 'pp-tag-associate-button',
                                      text: tag_t, 'data-tag': tag_t});
          tag.parentNode.insertBefore(button, tag.nextSibling);
          _.onclick(button, function() {
            select(tag, button);
            return true;
          });
        });
      });

      var start = function() {
        starter.textContent = _.lng.cancel;
        root.classList.add('pp-associate-tag');
        tag1 = tag2 = null;
      };

      var end = function() {
        starter.textContent = _.lng.associate_tags;
        root.classList.remove('pp-associate-tag');
      };

      _.onclick(starter, function() {
        if (root.classList.contains('pp-associate-tag')) {
          end();
        } else {
          start();
        }
        return true;
      });
    },

    adjust: function(width, height) {
      if (!this.dom.root) {
        return;
      }

      var min = 80;

      _.debug('Max height: ' + height);

      var lists = _.qa('.tag-container', this.dom.root), last;
      lists = g.Array.prototype.filter.call(lists, function(l) {
        if (l.scrollHeight > min) {
          return true;
        }
        l.style.maxHeight = 'none';
        return false;
      });

      if (lists.length <= 0) {
        return;
      }

      height -= lists.reduce(function(h, l) {
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
      lists.forEach(function(l) {
        l.style.maxHeight = height + 'px';
        _.log('Adjust leading tag list: ' + l.style.maxHeight);
      });
    },

    setup: function(root, autoinput, cb_submit) {
      if (!root) {
        return;
      }

      var form = _.q('form[action="bookmark_add.php"]', root);
      if (!form) {
        return;
      }

      this.dom.root = root;
      this.dom.form = form;

      this.sel = {
        tag:  null,
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

      if (autoinput) {
        this.autoinput_tag();
      }

      form.setAttribute('action', '/bookmark_add.php');
      _.listen(form, 'submit', function() {
        _.xhr.post(form, function() {
          cb_submit();
        }, function() {
          g.alert('Error!');
        });

        _.qa('input[type="submit"]', form).forEach(function(btn) {
          btn.value = _.lng.sending;
          btn.setAttribute('disabled', '');
        });
        return true;
      });
    }
  });

  _.Floater = function(wrap, cont, ignore_elements) {
    this.wrap = wrap;
    this.cont = cont;
    this.floating = false;
    this.disable_float = false;
    this.disable_float_temp = false;
    this.use_placeholder = true;
    this.ignore_elements = ignore_elements || [];
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
        this.cont.style['overflow-x'] = 'hidden';
        this.cont.style.overflowY = 'auto';
        this.cont.style['overflow-y'] = 'auto';
      }
      this.update_height();
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
      this.disable_float_temp = false;
      if (this.cont) {
        var de = d.documentElement;
        var mh = de.clientHeight - (this.wrap.offsetHeight - this.cont.offsetHeight);
        this.ignore_elements.forEach(function(elem) {
          mh += elem.offsetHeight;
        });
        if (mh < 60) {
          this.disable_float_temp = true;
          this.unfloat();
          this.cont.style.maxHeight = 'none';
          return;
        }
        if (!this.floating) {
          mh -= this.wrap.getBoundingClientRect().top;
        }
        this.cont.style.maxHeight = mh + 'px';
      }
    },

    update_float: function () {
      if (this.disable_float || this.disable_float_temp) {
        return;
      }
      var de = d.documentElement;
      var rect = (this.placeholder || this.wrap).getBoundingClientRect();
      if (!this.floating && rect.top < 0) {
        this.scroll_save();
        if (this.use_placeholder) {
          this.placeholder = this.wrap.cloneNode(false);
          this.placeholder.style.width = this.wrap.offsetWidth + 'px';
          this.placeholder.style.height = this.wrap.offsetHeight + 'px';
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

      _.listen(w, 'scroll', _.Floater.update_float, {async: true});
      _.listen(w, 'resize', _.Floater.update_height, {async: true});
      _.Floater.initialized = true;
    },

    auto_run: function(func) {
      if (_.conf.general.float_tag_list === 0) {
        return;
      }

      func();
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

  _.mypage = _.mod({
    history_manager: _.mod({
      create: function() {
        if (this.dom) {
          return;
        }

        var that = this;

        this.dom = {};
        this.dom.root = _.e('div', {id: 'pp-layout-history-manager'});
        this.dom.header = _.e('header', null, this.dom.root);
        this.dom.error = _.e('p', {cls: 'pp-error-message'}, this.dom.root);
        this.dom.table = _.e('table', null, this.dom.root);

        _.onclick(_.e('span', {text: '\u00d7', css: 'cursor:pointer'}, this.dom.header), function() {
          that.hide();
        });
        _.e('h2', {text: _.lng.mypage_layout_history}, this.dom.header);

        var row = this.dom.table.insertRow(-1);
        this.dom.list = _.e('ul', {id: 'pp-layout-history'}, row.insertCell(-1));
        this.dom.preview = _.e('ul', {id: 'pp-layout-preview'}, row.insertCell(-1));

        _.e('p', {text: _.lng.mypage_layout_history_help}, this.dom.root);

        _.listen(w, 'resize', function() {
          if (!that.dom.root.parentNode) {
            return;
          }
          that.centerize();
        }, {async: true});

        _.key.listen(w, function(key, ev, connection) {
          if (!that.dom.root.parentNode) {
            return;
          }
          if (key === 'Escape') {
            that.hide();
          }
        });
      },

      preview: function(layout) {
        var that = this;

        _.clear(this.dom.preview);

        var name_map = {};
        _.qa('#item-container header h1').forEach(function(h, i) {
          var key = w.pixiv.mypage.order[i];
          name_map[key] = _.strip(h.textContent);
        });

        layout.split('').forEach(function(d) {
          var item = _.e('li', {text: name_map[d.toLowerCase()]}, that.dom.preview);
          if (d.toUpperCase() === d) {
            item.classList.add('pp-open');
          }
          _.e('div', null, item);
        });
      },

      refresh: function() {
        var that = this;

        this.create();

        _.clear(this.dom.list, this.dom.preview);

        var history = _.conf.mypage.layout_history;
        if (!history) {
          this.dom.error.textContent = _.lng.mypage_layout_history_empty;
          this.dom.root.classList.add('pp-error');
          return;
        } else {
          this.dom.root.classList.remove('pp-error');
        }

        history = history.split(',').map(function(entry) {
          return entry.split(':');
        });

        var last_active;
        history.forEach(function(entry, idx) {
          var layout = entry[0], text, item;

          if (entry[1]) {
            var date = new g.Date();
            date.setTime(g.parseInt(entry[1]));
            text = date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate();
          } else {
            text = layout;
          }

          item = _.e('li', {text: text}, that.dom.list);

          _.listen(item, 'mouseover', function() {
            if (item === last_active) {
              return;
            }
            if (last_active) {
              last_active.classList.remove('pp-active');
            }
            item.classList.add('pp-active');
            last_active = item;
            that.preview(layout);
          });

          _.onclick(item, function() {
            _.mypage.restore_layout(layout);
          });

          if (idx === 0) {
            item.classList.add('pp-active');
            that.preview(layout);
            last_active = item;
          }
        });
      },

      centerize: function() {
        var de  = d.documentElement;
        this.dom.root.style.left = g.Math.floor((de.clientWidth  - this.dom.root.offsetWidth)  / 2) + 'px';
        this.dom.root.style.top  = g.Math.floor((de.clientHeight - this.dom.root.offsetHeight) / 2) + 'px';
      },

      show: function() {
        this.refresh();

        if (!this.dom.root.parentNode) {
          d.body.appendChild(this.dom.root);
        }

        this.centerize();
      },

      hide: function() {
        if (this.dom && this.dom.root.parentNode) {
          this.dom.root.parentNode.removeChild(this.dom.root);
        }
      }
    }),

    setup_item_actions: function() {
      var that = this;
      _.qa('#item-container header .action').forEach(function(actions) {
        var li = _.e('li', {cls: 'pp-layout-history ui-tooltip',
                            'data-tooltip': _.lng.mypage_layout_history});
        actions.insertBefore(li, actions.firstChild);
        _.onclick(li, that.history_manager.show);
      });
    },

    save_layout: function() {
      var layout = '';
      w.pixiv.mypage.order.forEach(function(item) {
        if (!/^[a-z]$/.test(item)) {
          throw 'unknown pattern - ' + item;
        }
        if (w.pixiv.mypage.visible[item]) {
          item = item.toUpperCase();
        }
        layout += item;
      });

      if (!layout) {
        return;
      }

      var history = [];
      if (_.conf.mypage.layout_history) {
        history = _.conf.mypage.layout_history.split(',').map(function(entry) {
          return entry.split(':', 2);
        });
      }

      if (history.length && layout === history[0][0]) {
        return;
      }

      var new_history = [[layout, g.Date.now()]];
      history.forEach(function(entry) {
        if (entry[0] !== layout) {
          new_history.push(entry);
        }
      });
      _.conf.mypage.layout_history = new_history.slice(0, 10).map(function(entry) {
        return entry.join(':');
      }).join(',');
    },

    restore_layout: function(layout) {
      w.pixiv.mypage.order = layout.split('').map(function(d) {
        var lc = d.toLowerCase();
        w.pixiv.mypage.visible[lc] = d !== lc;
        return lc;
      });
      w.pixiv.mypage.update();
      w.location.reload();
    },

    run: function() {
      var that = this;

      this.setup_item_actions();

      try {
        this.save_layout();

        var pixiv_mypage_update = w.pixiv.mypage.update;
        w.pixiv.mypage.update = function() {
          pixiv_mypage_update.apply(this, arguments);
          that.save_layout();
        };
      } catch(ex) {
        _.log('mypage error - ' + g.String(ex));
      }
    }
  });

  _.pages = _.mod({
    run: function() {
      var re;
      re = /^\/(\w+)\./.exec(w.location.pathname);
      if (re && this[re[1]]) {
        this[re[1]].run(_.parse_query(w.location.search));
      }
    },

    fast_user_bookmark: function() {
      var favorite_button = _.q('.profile-unit .user-relation #favorite-button');
      if (!favorite_button) {
        _.warn('fast_user_bookmark: favorite-button not found');
        return;
      }

      _.onclick(favorite_button, function() {
        if (favorite_button.classList.contains('following') ||
            _.conf.general.fast_user_bookmark <= 0) {
          return;
        }

        g.setTimeout(function() {
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
              radio    = _.q('input[name="restrict"][value="' + restrict + '"]', form);

          if (!radio) {
            _.error('fast_user_bookmark: restrict input not found');
            return;
          }

          radio.checked = true;
          _.xhr.post(form, function() {
            favorite_button.classList.add('following');
          });
          _.send_click(_.q('.close', dialog));
        }, 10);
      });
    },

    mypage: _.mypage,

    member: _.mod({
      run: function(query) {
        _.pages.fast_user_bookmark();
      }
    }),

    member_illust: _.mod({
      run: function(query) {
        this.manga_thumbnail(query);
        this.manga_medium(query);
        _.pages.fast_user_bookmark();
      },

      manga_thumbnail: function() {
        var re;
        if (w.location.hash === '#pp-manga-thumbnail') {
          var toggle_thumbnail = _.q('#toggle-thumbnail');
          _.send_click(toggle_thumbnail);
        } else if ((re = /^#pp-manga-page-(\d+)$/.exec(w.location.hash))) {
          try {
            w.pixiv.manga.move(g.parseInt(re[1], 10));
          } catch(ex) { }
        }
      },

      manga_medium: function(query) {
        if (query.mode !== 'medium' || !query.illust_id) {
          return;
        }

        _.modify_caption(_.q('.work-info .caption'));

        var manga = _.q('.works_display a[href*="mode=manga"]');
        if (manga) {
          var illust = _.illust.create(
            _.q('.works_display a[href*="mode=manga"]'),
            ['_m'],
            function() {
              _.popup.manga.start();
            }
          );

          if (_.conf.popup.preload) {
            _.illust.load(illust);
          }
        }
      }
    }),

    bookmark: _.mod({
      run: function(query) {
        this.float_tag_list(query);
        this.float_action_menu(query);
      },

      float_tag_list: function(query) {
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

        var lists = _.reorder_tag_list(bookmark_list_ul, function(item) {
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

      },

      float_action_menu: function() {
        var form        = _.q('form[action*="bookmark_setting.php"]'),
            action_menu = _.q('.column-action-menu');
        if (form && action_menu) {
          _.Floater.auto_run(function() {
            action_menu.parentNode.removeChild(action_menu);
            form.insertBefore(action_menu, form.firstChild);
            action_menu.style.border = 'none';
            new _.Floater(action_menu);
          });
        }
      }
    }),

    search: _.mod({
      run: function(query) {
        var that = this;
        ['size', 'ratio'].forEach(function(name) {
          var inputs = _.qa('#search-option ul>li>label>input[name="' + name + '"]');
          if (!inputs.length) {
            return;
          }

          var ul = inputs[0].parentNode.parentNode.parentNode;

          var li    = _.e('li', {id: 'pp-search-' + name + '-custom'}, ul),
              radio = _.e('input', {type: 'radio', name: name}, _.e('label', null, li)),
              curr  = inputs.filter(function(i){return i.checked;})[0];

          if (!curr) {
            radio.checked = true;
          }

          inputs.push(radio);
          that[name](query, ul, li, radio, inputs);
        });

        var nav = _.qa('.column-label,.column-menu,.column-menu+.column-order-menu');
        if (nav.length > 0) {
          _.Floater.auto_run(function() {
            var wrapper = _.e('div', {id: 'pp-search-header'});
            nav[0].parentNode.insertBefore(wrapper, nav[0]);
            nav.forEach(function(nav) {
              nav.parentNode.removeChild(nav);
              wrapper.appendChild(nav);
            });
            new _.Floater(wrapper);
          });
        }

        this.set_default_options(query);
      },

      set_default_options: function(query) {
        var keys = ['s_mode', 'order', 'scd',
                    'wlt', 'hlt', 'wgt', 'hgt',
                    'ratio', 'r18'];

        var form = _.q('.header form[action="/search.php"]');

        keys.forEach(function(key) {
          if (!query.hasOwnProperty(key)) {
            return;
          }

          var input = _.q('input[name="' + key + '"]', form);
          if (!input) {
            input = _.e('input', {type: 'hidden', name: key}, form);
          }
          input.value = query[key];
        });

        _.qa('.column-related .tag a[href^="/search.php?"]').forEach(function(tag) {
          var params = _.parse_query(tag.href);

          keys.forEach(function(key) {
            if (query.hasOwnProperty(key)) {
              params[key] = query[key];
            }
          });

          tag.href = '/search.php?' + _.xhr.serialize(params);
        });
      },

      size: function(query, ul, li, radio, inputs) {
        w.pixiv.search.parseSizeOption = function(value) {
          var size = (value || '').split('-', 2).map(function(p) {
            return p.split('x');
          });

          var min = size[0] || [],
              max = size[1] || [],
              wlt = min[0] || null,
              hlt = min[1] || wlt,
              wgt = max[0] || null,
              hgt = max[1] || wgt;

          return {wlt: wlt, hlt: hlt, wgt: wgt, hgt: hgt};
        };

        var wlt = _.e('input', {type: 'text', cls: 'ui-tooltip', 'data-tooltip': _.lng.search_wlt}, li),
            hlt = _.e('input', {type: 'text', cls: 'ui-tooltip', 'data-tooltip': _.lng.search_hlt}, li),
            wgt = _.e('input', {type: 'text', cls: 'ui-tooltip', 'data-tooltip': _.lng.search_wgt}, li),
            hgt = _.e('input', {type: 'text', cls: 'ui-tooltip', 'data-tooltip': _.lng.search_hgt}, li);

        [[hlt, 'x'], [wgt, '-'], [hgt, 'x']].forEach(function(p) {
          p[0].parentNode.insertBefore(d.createTextNode(p[1]), p[0]);
        });

        var update = function() {
          radio.value = wlt.value + 'x' + hlt.value + '-' + wgt.value + 'x' + hgt.value;
        };

        wlt.value = query.wlt || '';
        hlt.value = query.hlt || '';
        wgt.value = query.wgt || '';
        hgt.value = query.hgt || '';
        update();

        _.listen([wlt, hlt, wgt, hgt], 'input', function() {
          update();
          radio.checked = true;
        });
      },

      ratio: function(query, ul, li, radio, inputs) {
        var min = -1.5, max = 1.5;
        var slider  = _.ui.slider(min, max, 0.01);
        li.appendChild(slider);

        var input   = _.e('input', {type: 'text', id: 'pp-search-ratio-custom-text'}, li),
            preview = _.e('div', {id: 'pp-search-ratio-custom-preview'}, li),
            pbox    = _.e('div', null, preview);

        _.listen(inputs, 'change', function() {
          preview.classList[radio.checked ? 'remove' : 'add']('pp-hide');
        });

        var update = function(ratio, set) {
          if (typeof(ratio) !== 'number') {
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
        slider.value = input.value = query.ratio || '';

        _.listen(slider, 'change', function() {
          update(g.parseFloat(slider.value));
          input.value = slider.value;
          radio.checked = true;
        });

        _.listen(input, 'input', function() {
          update(g.parseFloat(input.value));
          slider.value = input.value;
          radio.checked = true;
        });
      }
    })
  });

  _.setup_ready = function() {
    _.i18n.setup();

    _.redirect_jump_page();

    _.configui.init(_.q('body>header'), _.q('body>header nav.link-list ul'), _extension_data);

    if (_.conf.general.bookmark_hide) {
      _.qa('a[href*="bookmark.php"]').forEach(function(link) {
        var re;
        if ((re = /^(?:(?:http:\/\/www\.pixiv\.net)?\/)?bookmark\.php(\?.*)?$/.exec(link.href))) {
          if (re[1]) {
            var query = _.parse_query(re[1]);
            if (!query.id && !query.rest) {
              link.href += '&rest=hide';
            }
          } else {
            link.href += '?rest=hide';
          }
        }
      });
    }

    _.pages.run(_.parse_query(w.location.search));

    _.Floater.auto_run(function() {
      var wrap = _.q('.ui-layout-west');
      if (!wrap) {
        return;
      }
      var tag_list = _.q('#bookmark_list, .tagCloud', wrap);
      if (!tag_list) {
        return;
      }

      new _.Floater(wrap, tag_list, _.qa('#touch_introduction', wrap));
    });

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

        var msg = _.lng.rate_confirm.replace('$point', String(w.pixiv.rating.rate));
        var rate = w.pixiv.rating.rate; // workaround for firefox

        if (_.conf.general.rate_confirm) {
          waiting_confirmation = true; // workaround for chromium
          var confirmed = w.confirm(msg);
          waiting_confirmation = false; // workaround for chromium
          if (!confirmed) {
            _.debug('rating cancelled');
            return;
          }
        }

        _.debug('send rating');
        w.pixiv.rating.rate = rate; // workaround for firefox
        rate_apply.apply(w.pixiv.rating, arguments);
        _.illust.unload(_.popup.illust);
      };
    } catch(ex) {
      _.log('rating error - ' + g.String(ex));
    }
  };

  _.run = function() {
    if (!d.documentElement) {
      // for gecko
      g.setTimeout(_.run, 100);
      return;
    }

    if (_extension_data) {
      var config_set_data = _.e('div', {css: 'display:none'}, d.documentElement);

      _.conf.__init({
        get: function(section, item) {
          return _extension_data.conf[_.conf.__key(section, item)] || null;
        },

        set: function(section, item, value) {
          _extension_data.conf[_.conf.__key(section, item)] = value;

          var ev = d.createEvent('Event');
          ev.initEvent('pixplusConfigSet', true, true);
          config_set_data.setAttribute('data-pp-section', section);
          config_set_data.setAttribute('data-pp-item',    item);
          config_set_data.setAttribute('data-pp-value',   value);
          config_set_data.dispatchEvent(ev);
        }
      });
    } else {
      _.conf.__init(_.conf.__wrap_storage(g.localStorage));
    }

    if (_.conf.general.redirect_jump_page === 1 && w.location.pathname === '/jump.php') {
      w.location.href = g.decodeURIComponent(w.location.search.substring(1));
      return;
    }

    _.i18n.setup();
    _.key.init();

    _.e('style', {text: _.css}, d.documentElement);

    _.illust.setup(d.documentElement);

    _.Floater.init();
    w.addEventListener('load', _.Floater.update_height, false);

    if (d.readyState === 'loading') {
      w.addEventListener('DOMContentLoaded', _.setup_ready, false);
    } else {
      _.setup_ready();
    }
  };

  /* __DATA_BEGIN__ */

  _.css = '\
.pp-hide{display:none}\
.pp-sprite{background-image:url("http://source.pixiv.net/source/images/sprite-2nd.png?20120528")}\
input.pp-flat-input{border:none}\
input.pp-flat-input:not(:hover):not(:focus){background:transparent}\
\
/* ui */\
.pp-slider{display:inline-block;vertical-align:middle;padding:7px 4px}\
.pp-slider-rail{position:relative;width:160px;height:2px;background-color:#aaa}\
.pp-slider-knob{position:absolute;border:1px outset #ddd;background-color:#ccc;\
width:6px;height:14px;margin:-7px -4px}\
.pp-slider.pp-debug{outline:1px solid rgba(255,0,0,0.5)}\
.pp-slider.pp-debug .pp-slider-rail{background-color:#0f0}\
.pp-slider.pp-debug .pp-slider-knob{border:1px solid #f0f;background-color:#00f;opacity:0.5}\
\
/* popup */\
#pp-popup{position:fixed;border:2px solid #aaa;background-color:#fff;padding:0.2em;z-index:20000}\
#pp-popup-title a{font-size:120%;font-weight:bold;line-height:1em}\
#pp-popup-rightbox{float:right;font-size:80%}\
#pp-popup-rightbox a{margin-left:0.2em;font-weight:bold}\
#pp-popup-rightbox a.pp-active{color:#888;font-weight:normal}\
#pp-popup-resize-mode{cursor:pointer}\
#pp-popup-status{color:#888}\
#pp-popup-header{position:absolute;left:0px;right:0px;padding:0px 0.2em;\
background-color:#fff;line-height:1.1em;z-index:20001}\
#pp-popup-header:not(.pp-show):not(:hover){opacity:0 !important}\
.pp-popup-separator{border-top:1px solid #aaa;margin-top:0.1em;padding-top:0.1em}\
#pp-popup-caption-wrapper{overflow-y:auto}\
#pp-popup-comment{display:none;border-left:3px solid #ccc;margin-left:0.6em;padding-left:0.3em}\
#pp-popup.pp-comment-mode #pp-popup-comment{display:block}\
#pp-popup-comment-form input{width:80%}\
#pp-popup-taglist{margin:0px;padding:0px;background:none}\
#pp-popup-taglist ul{display:inline}\
#pp-popup-taglist li{display:inline;margin:0px 0.6em 0px 0px;padding:0px;\
border:0px;box-shadow:none;background:none}\
#pp-popup-taglist .no-item{color:#aaa;margin-right:0.6em}\
#pp-popup-taglist.pp-no-pixpedia a[href^="http://dic.pixiv.net/"]{display:none}\
#pp-popup-taglist.pp-no-pixiv-comic a[href^="http://comic.pixiv.net/"]{display:none}\
#pp-popup-rating *{margin:0px;padding:0px}\
#pp-popup-rating .score dl{display:inline}\
#pp-popup-rating .score dt{display:inline;margin-right:0.2em}\
#pp-popup-rating .score dd{display:inline;margin-right:0.6em}\
#pp-popup-rating .questionnaire{text-align:inherit}\
#pp-popup-info{padding-bottom:0.1em}\
#pp-popup-author-image{max-height:3.2em;float:left;border:1px solid #aaa;margin-right:0.2em}\
#pp-popup-author-image:hover{max-height:none}\
#pp-popup-author-status{position:absolute;left:2px;margin:2px}\
#pp-popup-author-status:not(.pp-hide){display:inline-block}\
#pp-popup-author-status.pp-fav{width:14px;height:14px;background-position:-200px -320px}\
#pp-popup-author-status.pp-fav-m{width:16px;height:14px;background-position:-200px -480px}\
#pp-popup-author-status.pp-mypix{width:14px;height:16px;background-position:0px -360px}\
#pp-popup-author-image:hover~#pp-popup-author-status{display:none}\
#pp-popup-tools{margin-left:0.6em}\
#pp-popup-tools a{margin-right:0.6em}\
#pp-popup-author-links a{margin-right:0.6em;font-weight:bold}\
#pp-popup-image-wrapper{line-height:0;border:1px solid #aaa;position:relative}\
#pp-popup-image-scroller{min-width:480px;min-height:360px}\
#pp-popup-image-layout{display:block}\
.pp-popup-olc{position:absolute;cursor:pointer;opacity:0;top:0px;height:100%;line-height:0px}\
.pp-popup-olc.pp-active:hover{opacity:0.6}\
.pp-popup-olc svg{position:relative}\
.pp-popup-olc svg path{fill:#ddd;stroke:#222;stroke-width:10;stroke-linejoin:round}\
#pp-popup-olc-prev{left:0px}\
#pp-popup-olc-next svg{transform:matrix(-1,0,0,1,0,0);-webkit-transform:matrix(-1,0,0,1,0,0)}\
#pp-popup-image-layout{display:inline-block;font-size:200%}\
\
/* bookmark */\
#pp-popup-bookmark-wrapper{display:none;border:1px solid #aaa}\
#pp-popup.pp-bookmark-mode #pp-popup-header{display:none}\
#pp-popup.pp-bookmark-mode #pp-popup-image-wrapper{display:none}\
#pp-popup.pp-bookmark-mode .pp-popup-olc{display:none}\
#pp-popup.pp-bookmark-mode #pp-popup-bookmark-wrapper{display:block}\
\
#pp-popup-bookmark-wrapper .layout-body{margin:0px;border:none}\
#pp-popup-bookmark-wrapper .bookmark-detail-unit{border-radius:0px;border:none}\
#pp-popup-bookmark-wrapper .bookmark-list-unit{border-radius:0px;border:none;margin:0px}\
#pp-popup-bookmark-wrapper .tag-container{overflow-y:auto}\
#pp-popup-bookmark-wrapper .list-container+.list-container{margin-top:0px}\
#pp-popup-bookmark-wrapper ._list-unit{padding-top:4px;padding-bottom:4px}\
#pp-popup-bookmark-wrapper .tag-cloud{padding:4px !important}\
\
#pp-popup-bookmark-wrapper iframe{width:100%;height:100%;border:none}\
.pp-bookmark-iframe{overflow:auto}\
.pp-bookmark-iframe>body>*:not(#wrapper){display:none}\
.pp-bookmark-iframe #wrapper>*:not(.layout-body){display:none}\
.pp-bookmark-iframe #wrapper{margin:0px}\
.pp-bookmark-iframe #wrapper .layout-body{margin:0px}\
.pp-bookmark-iframe #wrapper ._unit{margin-bottom:0px;border:none}\
.pp-bookmark-iframe .bookmark-detail-unit{border-radius:0px}\
.pp-bookmark-iframe .bookmark-list-unit{border-radius:0px}\
.pp-bookmark-iframe .tag-container{overflow-y:auto}\
.pp-bookmark-iframe .list-container+.list-container{margin-top:0px}\
.pp-bookmark-iframe ._list-unit{padding-top:4px;padding-bottom:4px}\
.pp-bookmark-iframe .tag-cloud{padding:4px !important}\
\
.pp-tag-select{outline:2px solid #0f0}\
.pp-tag-link{outline:2px solid #f00}\
.pp-tag-associate-button{display:none;background-color:#eee;\
border:1px solid #bbb;border-radius:0.4em;padding:0px 0.4em;color:#000}\
.pp-tag-associate-button.pp-active{background-color:#ddd}\
.pp-associate-tag .tag-container .list-items .tag{display:none}\
.pp-associate-tag .pp-tag-associate-button{display:inline}\
\
/* tagedit */\
#pp-popup-tagedit-button{color:#888;font-size:90%}\
#pp-popup-tagedit-wrapper{display:none;font-size:12px}\
#pp-popup.pp-tagedit-mode #pp-popup-header{display:none}\
#pp-popup.pp-tagedit-mode #pp-popup-image-wrapper{display:none}\
#pp-popup.pp-tagedit-mode .pp-popup-olc{display:none}\
#pp-popup.pp-tagedit-mode #pp-popup-tagedit-wrapper{display:block}\
#pp-popup-tagedit-wrapper #tag-editor>div{margin:0px !important}\
#pp-popup-tagedit-table-wrapper{overflow:auto}\
\
/* config ui */\
#pp-config{display:none;line-height:1.1em}\
#pp-config ul{list-style-type:none}\
header #pp-config{margin:0px auto 4px;width:970px}\
#pp-config.pp-show{display:block}\
#pp-config-tabbar{margin-bottom:-1px}\
#pp-config-tabbar label{cursor:pointer}\
#pp-config-close-button{padding:0.2em}\
#pp-config-tabbar .pp-config-tab{display:inline-block;padding:0.2em 0.4em;margin:1px 1px 0px 1px}\
#pp-config-tabbar .pp-config-tab.pp-active{\
margin:0px;border:solid #aaa;border-width:1px 1px 0px 1px;background-color:#fff}\
#pp-config-content-wrapper{border:1px solid #aaa;background-color:#fff;padding:0.2em}\
header #pp-config-content-wrapper{height:600px;overflow-y:auto}\
.pp-config-content{display:none}\
.pp-config-content.pp-active{display:block}\
.pp-config-content dt{font-weight:bold}\
.pp-config-content dd{margin-left:1em}\
.pp-config-content-header{border-bottom:1px solid #ccc;padding-bottom:0.1em;margin-bottom:0.2em}\
#pp-config-key-content td:not(.pp-config-key-modeline):first-child{padding-left:1em}\
.pp-config-key-modeline{font-weight:bold}\
#pp-config-bookmark-content textarea{width:100%;height:20em;\
box-sizing:border-box;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;margin-bottom:1em}\
#pp-config-bookmark-tag-aliases{width:100%}\
#pp-config-bookmark-tag-aliases td:last-child{width:100%}\
#pp-config-bookmark-tag-aliases td:last-child input{width:100%;\
box-sizing:border-box;-webkit-box-sizing:border-box;-moz-box-sizing:border-box}\
#pp-config-importexport-toolbar{margin-bottom:0.2em}\
#pp-config-importexport-toolbar button{margin-right:0.2em}\
#pp-config-importexport-content textarea{width:100%;height:30em;\
box-sizing:border-box;-webkit-box-sizing:border-box;-moz-box-sizing:border-box}\
#pp-config-langbar{margin-bottom:0.2em;padding-bottom:0.2em;border-bottom:1px solid #aaa}\
#pp-config-langbar button{margin-right:0.2em;padding:0.2em 0.4em}\
#pp-config-escaper{margin-bottom:0.2em;padding-bottom:0.2em;border-bottom:1px solid #aaa}\
#pp-config-escaper input{display:block;width:100%;box-sizing:border-box}\
#pp-config-debug-content td{border:1px solid #aaa;padding:0.1em 0.2em}\
\
/* key editor */\
.pp-config-key-editor ul button{padding:0px;margin-right:0.2em}\
.pp-config-key-editor-add-line{margin-top:0.2em}\
.pp-config-key-editor-add-line button{margin-left:0.2em}\
\
/* floater */\
.pp-float{position:fixed;top:0px;z-index:90}\
.column-action-menu.pp-float:not(:hover){opacity:0.6;}\
#pp-search-header{background-color:#fff}\
#pp-search-header.pp-float:not(:hover){opacity:0.6}\
\
/* mypage layout */\
#page-mypage #item-container header .action .pp-layout-history{background-image:url(\
data:image/gif;base64,R0lGODlhDAAMAMIAAP///////+Tk5Hl5ef///////////////yH5BAEKAAQALA\
AAAAAMAAwAAAMdSLHc2jBKKMYM1co8umac9y3Z0kWVOULnBT0TkQAAOw==) !important}\
#pp-layout-history-manager{position:fixed;border:1px solid #aaa;\
background-color:#fff;box-shadow:0px 0px 0.6em 0.4em rgba(0,0,0,0.4)}\
#pp-layout-history-manager .pp-error-message{display:none}\
#pp-layout-history-manager.pp-error .pp-error-message{display:block}\
#pp-layout-history-manager.pp-error table{display:none}\
#pp-layout-history-manager table td{vertical-align:top}\
#pp-layout-history-manager header{border-bottom:1px solid #aaa;padding:0.1em 0.2em;\
text-align:center;background-color:#eee}\
#pp-layout-history-manager header span{float:right}\
#pp-layout-history{margin:0.2em}\
#pp-layout-history li{cursor:pointer;padding:0px 0.3em}\
#pp-layout-history li.pp-active{background-color:#ddd}\
#pp-layout-preview{min-width:400px;min-height:300px}\
#pp-layout-preview li{border:1px solid #ccc;margin:0.2em;padding:0.1em 0.2em;color:#888}\
#pp-layout-preview li.pp-open{font-weight:bold;color:#444}\
#pp-layout-preview li div{display:none;border-top:1px solid #ccc;padding:0.6em;margin-top:0.1em}\
#pp-layout-preview li.pp-open div{display:block}\
\
/* search */\
#pp-search-size-custom input[type="text"]{\
width:3em;padding:0px;height:auto;border:1px solid #eee}\
#pp-search-ratio-custom-text{width:3em;padding:0px;height:auto}\
#pp-search-ratio-custom-preview{display:none}\
input[type="range"]:active~#pp-search-ratio-custom-preview{display:block}\
.pp-slider.pp-active~#pp-search-ratio-custom-preview{display:block}\
input[type="text"]:focus~#pp-search-ratio-custom-preview{display:block}\
#pp-search-ratio-custom-preview{position:absolute;margin-top:0.4em}\
#pp-search-ratio-custom-preview div{background-color:#ccc}\
\
.pp-bookmark-tag-list ul+ul:not(.tagCloud){border-top:2px solid #dae1e7}\
.pp-bookmark-tag-list ul+ul.tagCloud{border-bottom:2px solid #dae1e7}\
';

  _.conf.__schema = [
    // __CONFIG_BEGIN__
    {"name": "general", "items": [
      {"key": "debug", "value": false},
      {"key": "bookmark_hide", "value": false},
      {"key": "float_tag_list", "value": 1},
      {"key": "rate_confirm", "value": true},
      {"key": "disable_effect", "value": false},
      {"key": "fast_user_bookmark", "value": 0},
      {"key": "redirect_jump_page", "value": 1}
    ]},

    {"name": "popup", "items": [
      {"key": "preload", "value": true},
      {"key": "big_image", "value": false},
      {"key": "caption_height", "value": 0.4},
      {"key": "caption_minheight", "value": 160},
      {"key": "caption_opacity", "value": 0.9},
      {"key": "remove_pixpedia", "value": false},
      {"key": "remove_pixiv_comic", "value": false},
      {"key": "rate_key", "value": true},
      {"key": "font_size", "value": ""},
      {"key": "auto_manga", "value": 0},
      {"key": "auto_manga_regexp", "value": "/(?:bookmark_new_illust|member_illust|mypage|ranking|bookmark)\\.php"},
      {"key": "reverse", "value": 0},
      {"key": "reverse_regexp", "value": "/(?:bookmark_new_illust|member_illust|mypage)\\.php"},
      {"key": "overlay_control", "value": 0.3},
      {"key": "scroll_height", "value": 32},
      {"key": "author_status_icon", "value": true},
      {"key": "show_comment_form", "value": true},
      {"key": "mouse_wheel", "value": 2},
      {"key": "mouse_wheel_delta", "value": 1},
      {"key": "fit_short_threshold", "value": 4}
    ]},

    {"name": "mypage", "items": [
      {"key": "layout_history", "value": ""}
    ]},

    {"name": "key", "items": [
      {"key": "popup_prev", "value": "Backspace,a", "mode": "normal"},
      {"key": "popup_prev_direction", "value": "Left"},
      {"key": "popup_next", "value": "Space"},
      {"key": "popup_next_direction", "value": "Right"},
      {"key": "popup_first", "value": "Home"},
      {"key": "popup_last", "value": "End"},
      {"key": "popup_close", "value": "Escape,q"},
      {"key": "popup_caption_scroll_up", "value": "Up"},
      {"key": "popup_caption_scroll_down", "value": "Down"},
      {"key": "popup_caption_toggle", "value": "c"},
      {"key": "popup_comment_toggle", "value": "Shift+c"},
      {"key": "popup_illust_scroll_up", "value": "Up"},
      {"key": "popup_illust_scroll_down", "value": "Down"},
      {"key": "popup_illust_scroll_left", "value": "Left"},
      {"key": "popup_illust_scroll_right", "value": "Right"},
      {"key": "popup_illust_scroll_top", "value": "Home"},
      {"key": "popup_illust_scroll_bottom", "value": "End"},
      {"key": "popup_illust_page_up", "value": "PageUp,Backspace,a"},
      {"key": "popup_illust_page_down", "value": "PageDown,Space"},
      {"key": "popup_switch_resize_mode", "value": "w"},
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

  _.i18n = {
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
        about_name: 'Name',
        about_version: 'Version',
        about_web: 'Web page',
        about_email: 'Mail',
        about_license: 'License',
        changelog: 'Changelog',
        releasenote: 'Release note',
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
            hint: ['Disable', 'Enable']
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
          }
        },

        popup: {
          preload: 'Enable preloading',
          big_image: 'Use original size image',
          caption_height: 'Caption height(ratio)',
          caption_minheight: 'Caption minimum height(px)',
          caption_opacity: 'Caption opacity',
          remove_pixpedia: 'Remove pixiv encyclopedia(pixpedia) icon',
          remove_pixiv_comic: 'Remove pixiv comic icon',
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
          mouse_wheel_delta: 'Threshold for mouse wheel setting(if set negative value, invert direction)',
          fit_short_threshold: 'Aspect ratio threshold for switch resize mode(0:Disable)'
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
          popup_illust_scroll_up: 'Scroll illust up',
          popup_illust_scroll_down: 'Scroll illust down',
          popup_illust_scroll_left: 'Scroll illust left',
          popup_illust_scroll_right: 'Scroll illust right',
          popup_illust_scroll_top: 'Scroll illust to top',
          popup_illust_scroll_bottom: 'Scroll illust to bottom',
          popup_illust_page_up: 'Scroll illust up (PageUp)',
          popup_illust_page_down: 'Scroll illust down (PageDown)',
          popup_switch_resize_mode: 'Switch resize mode',
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
          tag_aliases: 'Tag association. Used for auto input. Separate by space.'
        }
      },

      cancel: 'Cancel',
      repost: ' (Re: $month/$date/$year $hour:$minute)',
      rate_confirm: 'Rate it?\n$pointpt',
      author_works: 'Works',
      author_bookmarks: 'Bookmarks',
      author_staccfeed: 'Staccfeed',
      sending: 'Sending',
      importing: 'Importing',
      associate_tags: 'Associate tags',
      mypage_layout_history: 'Layout history',
      mypage_layout_history_empty: 'Layout history is empty',
      mypage_layout_history_help: 'Click list item to restore layout.',
      search_wlt: 'Min width <=',
      search_hlt: 'Min height <=',
      search_wgt: '<= Max width',
      search_hgt: '<= Max height'
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
        about_name: '\u540d\u524d',
        about_version: '\u30d0\u30fc\u30b8\u30e7\u30f3',
        about_web: '\u30a6\u30a7\u30d6\u30b5\u30a4\u30c8',
        about_email: '\u30e1\u30fc\u30eb',
        about_license: '\u30e9\u30a4\u30bb\u30f3\u30b9',
        changelog: '\u66f4\u65b0\u5c65\u6b74',
        releasenote: '\u30ea\u30ea\u30fc\u30b9\u30ce\u30fc\u30c8',
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
            hint: ['\u7121\u52b9', '\u6709\u52b9']
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
          }
        },

        popup: {
          preload: '\u5148\u8aad\u307f\u3092\u4f7f\u7528\u3059\u308b',
          big_image: '\u539f\u5bf8\u306e\u753b\u50cf\u3092\u8868\u793a\u3059\u308b',
          caption_height: '\u30ad\u30e3\u30d7\u30b7\u30e7\u30f3\u306e\u9ad8\u3055(\u7387)',
          caption_minheight: '\u30ad\u30e3\u30d7\u30b7\u30e7\u30f3\u306e\u9ad8\u3055\u306e\u6700\u5c0f\u5024(px)',
          caption_opacity: '\u30ad\u30e3\u30d7\u30b7\u30e7\u30f3\u306e\u4e0d\u900f\u660e\u5ea6',
          remove_pixpedia: 'pixiv\u767e\u79d1\u4e8b\u5178(pixpedia)\u30a2\u30a4\u30b3\u30f3\u3092\u9664\u53bb\u3059\u308b',
          remove_pixiv_comic: 'pixiv\u30b3\u30df\u30c3\u30af\u30a2\u30a4\u30b3\u30f3\u3092\u9664\u53bb\u3059\u308b',
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
          mouse_wheel_delta: '\u30db\u30a4\u30fc\u30eb\u8a2d\u5b9a\u306e\u95be\u5024(\u8ca0\u6570\u306e\u5834\u5408\u306f\u65b9\u5411\u3092\u53cd\u8ee2)',
          fit_short_threshold: '\u30ea\u30b5\u30a4\u30ba\u30e2\u30fc\u30c9\u3092\u5207\u308a\u66ff\u3048\u308b\u7e26\u6a2a\u6bd4\u306e\u95be\u5024(0:\u7121\u52b9)'
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
          popup_illust_scroll_up: '\u30a4\u30e9\u30b9\u30c8\u3092\u4e0a\u306b\u30b9\u30af\u30ed\u30fc\u30eb\u3059\u308b',
          popup_illust_scroll_down: '\u30a4\u30e9\u30b9\u30c8\u3092\u4e0b\u306b\u30b9\u30af\u30ed\u30fc\u30eb\u3059\u308b',
          popup_illust_scroll_left: '\u30a4\u30e9\u30b9\u30c8\u3092\u5de6\u306b\u30b9\u30af\u30ed\u30fc\u30eb\u3059\u308b',
          popup_illust_scroll_right: '\u30a4\u30e9\u30b9\u30c8\u3092\u53f3\u306b\u30b9\u30af\u30ed\u30fc\u30eb\u3059\u308b',
          popup_illust_scroll_top: '\u30a4\u30e9\u30b9\u30c8\u3092\u4e0a\u7aef\u306b\u30b9\u30af\u30ed\u30fc\u30eb\u3059\u308b',
          popup_illust_scroll_bottom: '\u30a4\u30e9\u30b9\u30c8\u3092\u4e0b\u7aef\u306b\u30b9\u30af\u30ed\u30fc\u30eb\u3059\u308b',
          popup_illust_page_up: '\u30a4\u30e9\u30b9\u30c8\u3092\u4e0a\u306b\u30b9\u30af\u30ed\u30fc\u30eb\u3059\u308b (PageUp)',
          popup_illust_page_down: '\u30a4\u30e9\u30b9\u30c8\u3092\u4e0b\u306b\u30b9\u30af\u30ed\u30fc\u30eb\u3059\u308b (PageDown)',
          popup_switch_resize_mode: '\u30ea\u30b5\u30a4\u30ba\u30e2\u30fc\u30c9\u3092\u5207\u308a\u66ff\u3048\u308b',
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
          tag_aliases: '\u30bf\u30b0\u306e\u95a2\u9023\u4ed8\u3051\u3002\u81ea\u52d5\u5165\u529b\u306b\u4f7f\u7528\u3059\u308b\u3002\u30b9\u30da\u30fc\u30b9\u533a\u5207\u308a\u3002'
        }
      },

      cancel: '\u4e2d\u6b62',
      repost: ' (\u518d: $year\u5e74$month\u6708$date\u65e5 $hour:$minute)',
      rate_confirm: '\u8a55\u4fa1\u3057\u307e\u3059\u304b\uff1f\n$point\u70b9',
      author_works: '\u4f5c\u54c1',
      author_bookmarks: '\u30d6\u30c3\u30af\u30de\u30fc\u30af',
      author_staccfeed: '\u30b9\u30bf\u30c3\u30af\u30d5\u30a3\u30fc\u30c9',
      sending: '\u9001\u4fe1\u4e2d',
      importing: '\u30a4\u30f3\u30dd\u30fc\u30c8\u4e2d',
      associate_tags: '\u30bf\u30b0\u3092\u95a2\u9023\u4ed8\u3051\u308b',
      mypage_layout_history: '\u30ec\u30a4\u30a2\u30a6\u30c8\u306e\u5c65\u6b74',
      mypage_layout_history_empty: '\u5c65\u6b74\u304c\u7a7a\u3067\u3059',
      mypage_layout_history_help: '\u30ea\u30b9\u30c8\u3092\u30af\u30ea\u30c3\u30af\u3059\u308b\u3068\u30ec\u30a4\u30a2\u30a6\u30c8\u3092\u5fa9\u5143\u3057\u307e\u3059\u3002',
      search_wlt: '\u5e45\u306e\u6700\u5c0f\u5024 <=',
      search_hlt: '\u9ad8\u3055\u306e\u6700\u5c0f\u5024 <=',
      search_wgt: '<= \u5e45\u306e\u6700\u5927\u5024',
      search_hgt: '<= \u9ad8\u3055\u306e\u6700\u5927\u5024'
    },

    setup: function() {
      var lng;
      if (d.documentElement) {
        lng = _.i18n[d.documentElement.lang];
      }
      _.lng = (lng || _.i18n[g.navigator.language] || _.i18n.en);
    }
  };

  _.changelog = [
    {
      "date": "2013/xx/xx",
      "version": "1.7.2",
      "releasenote": "",
      "changes_i18n": {
        "en": [
        ],
        "ja": [
        ]
      }
    },

    // __CHANGELOG_BEGIN__
    {
      "date": "2013/06/26",
      "version": "1.7.1",
      "releasenote": "http://my.opera.com/crckyl/blog/2013/06/26/pixplus-1-7-1-greasemonkey",
      "changes_i18n": {
        "en": [
          "[Fix][Chrome] Greasemonkey version(.user.js) is not working on Chrome."
        ],
        "ja": [
          "[\u4fee\u6b63][Chrome] Greasemonkey\u7248\u304cChrome\u4e0a\u3067\u52d5\u4f5c\u3057\u306a\u3044\u30d0\u30b0\u3092\u4fee\u6b63\u3002"
        ]
      }
    },

    {
      "date": "2013/06/25",
      "version": "1.7.0",
      "releasenote": "http://my.opera.com/crckyl/blog/2013/06/25/pixplus-1-7-0",
      "changes_i18n": {
        "en": [
          "Improve boot performance.",
          "[Add] Added some features that extends \"Advanced Search\" dialog.",
          "[Remove] Remove \"Change 'Stacc feed' link\" option.",
          "[Remove] Remove \"Separator style for tag list\" option.",
          "[Fix] Fix manga mode always reports error.",
          "[Fix][Firefox] Fix bookmark mode is not working on Firefox ESR 17"
        ],
        "ja": [
          "\u8d77\u52d5\u3092\u9ad8\u901f\u5316\u3002",
          "[\u8ffd\u52a0] \u300c\u691c\u7d22\u30aa\u30d7\u30b7\u30e7\u30f3\u300d\u30c0\u30a4\u30a2\u30ed\u30b0\u306b\u3044\u304f\u3064\u304b\u306e\u30aa\u30d7\u30b7\u30e7\u30f3\u3092\u8ffd\u52a0\u3059\u308b\u6a5f\u80fd\u3092\u8ffd\u52a0\u3002",
          "[\u524a\u9664] \u300c\u30b9\u30bf\u30c3\u30af\u30d5\u30a3\u30fc\u30c9\u300d\u306e\u30ea\u30f3\u30af\u5148\u3092\u5909\u66f4\u3059\u308b\u30aa\u30d7\u30b7\u30e7\u30f3\u3092\u524a\u9664\u3002",
          "[\u524a\u9664] \u300c\u30bf\u30b0\u30ea\u30b9\u30c8\u306e\u30bb\u30d1\u30ec\u30fc\u30bf\u306e\u30b9\u30bf\u30a4\u30eb\u300d\u30aa\u30d7\u30b7\u30e7\u30f3\u3092\u524a\u9664\u3002",
          "[\u4fee\u6b63] \u30de\u30f3\u30ac\u30e2\u30fc\u30c9\u304c\u52d5\u4f5c\u3057\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002",
          "[\u4fee\u6b63][Firefox] Firefox ESR 17\u3067\u30d6\u30c3\u30af\u30de\u30fc\u30af\u30e2\u30fc\u30c9\u304c\u52d5\u4f5c\u3057\u3066\u3044\u306a\u304b\u3063\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002"
        ]
      }
    },

    {
      "date": "2013/05/26",
      "version": "1.6.3",
      "releasenote": "http://my.opera.com/crckyl/blog/2013/05/25/pixplus-1-6-3",
      "changes_i18n": {
        "en": [
          "[Fix] Support new bookmark page."
        ],
        "ja": [
          "[\u4fee\u6b63] \u65b0\u3057\u3044\u30d6\u30c3\u30af\u30de\u30fc\u30af\u30da\u30fc\u30b8\u3092\u30b5\u30dd\u30fc\u30c8\u3002"
        ]
      }
    },

    {
      "date": "2013/05/18",
      "version": "1.6.2",
      "releasenote": "http://my.opera.com/crckyl/blog/2013/05/18/pixplus-1-6-2",
      "changes_i18n": {
        "en": [
          "[Fix] Fix author status icon.",
          "[Fix] Bookmark button is always inactive, even though it is bookmarked.",
          "[Fix] Fix loading error on Firefox21"
        ],
        "ja": [
          "[\u4fee\u6b63] \u4f5c\u8005\u306e\u30b9\u30c6\u30fc\u30bf\u30b9\u30a2\u30a4\u30b3\u30f3\u304c\u8868\u793a\u3055\u308c\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002",
          "[\u4fee\u6b63] \u30d6\u30c3\u30af\u30de\u30fc\u30af\u3057\u3066\u3082\u30d6\u30c3\u30af\u30de\u30fc\u30af\u30dc\u30bf\u30f3\u306e\u8868\u793a\u304c\u5909\u5316\u3057\u306a\u3044\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002",
          "[\u4fee\u6b63] Firefox21\u3067\u8aad\u307f\u8fbc\u307f\u30a8\u30e9\u30fc\u304c\u767a\u751f\u3059\u308b\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002"
        ]
      }
    },

    {
      "date": "2013/03/13",
      "version": "1.6.1",
      "releasenote": "http://my.opera.com/crckyl/blog/2013/03/13/pixplus-1-6-1",
      "changes_i18n": {
        "en": [
          "[Change] Change \"Click area\" design.",
          "[Fix] Minor fix for pixiv's change."
        ],
        "ja": [
          "[\u5909\u66f4] \u79fb\u52d5\u7528\u30af\u30ea\u30c3\u30af\u30a4\u30f3\u30bf\u30fc\u30d5\u30a7\u30fc\u30b9\u306e\u30c7\u30b6\u30a4\u30f3\u3092\u5909\u66f4\u3002",
          "[\u4fee\u6b63] pixiv\u306e\u5909\u66f4\u306b\u5bfe\u5fdc\u3002"
        ]
      }
    },

    {
      "date": "2013/02/23",
      "version": "1.6.0",
      "releasenote": "http://my.opera.com/crckyl/blog/2013/02/23/pixplus-1-6-0",
      "changes_i18n": {
        "en": [
          "[Add] Add resize mode settings and key bindings.",
          "[Fix] Fix author does not shown properly in popup."
        ],
        "ja": [
          "[\u8ffd\u52a0] \u30ea\u30b5\u30a4\u30ba\u30e2\u30fc\u30c9\u306e\u8a2d\u5b9a\u3068\u30ad\u30fc\u30d0\u30a4\u30f3\u30c9\u3092\u8ffd\u52a0\u3002",
          "[\u4fee\u6b63] \u30dd\u30c3\u30d7\u30a2\u30c3\u30d7\u306b\u4f5c\u8005\u304c\u8868\u793a\u3055\u308c\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002"
        ]
      }
    },

    {
      "date": "2013/02/10",
      "version": "1.5.0",
      "releasenote": "http://my.opera.com/crckyl/blog/2013/02/09/pixplus-1-5-0",
      "changes_i18n": {
        "en": [
          "[Add] Add top-page layout history manager.",
          "[Fix][Extension] Fix can't save settings in General section."
        ],
        "ja": [
          "[\u8ffd\u52a0] \u30c8\u30c3\u30d7\u30da\u30fc\u30b8\u306e\u30ec\u30a4\u30a2\u30a6\u30c8\u306e\u5909\u66f4\u5c65\u6b74\u3092\u7ba1\u7406\u3059\u308b\u6a5f\u80fd\u3092\u8ffd\u52a0\u3002",
          "[\u4fee\u6b63][\u30a8\u30af\u30b9\u30c6\u30f3\u30b7\u30e7\u30f3] \u300c\u5168\u822c\u300d\u30bb\u30af\u30b7\u30e7\u30f3\u306e\u8a2d\u5b9a\u304c\u4fdd\u5b58\u3055\u308c\u306a\u3044\u30d0\u30b0\u3092\u4fee\u6b63\u3002"
        ]
      }
    },

    {
      "date": "2013/02/02",
      "version": "1.4.0",
      "releasenote": "http://my.opera.com/crckyl/blog/2013/02/02/pixplus-1-4-0",
      "changes_i18n": {
        "en": [
          "[Add] Add tag association ui to bookmark mode.",
          "[Fix] Fix author does not shown properly in popup.",
          "[Fix] Fix comment view in popup.",
          "[Fix] Fix \"Add favorite user by one-click\" is not working."
        ],
        "ja": [
          "[\u8ffd\u52a0] \u30d6\u30c3\u30af\u30de\u30fc\u30af\u30e2\u30fc\u30c9\u306b\u30bf\u30b0\u3092\u95a2\u9023\u4ed8\u3051\u308bUI\u3092\u8ffd\u52a0\u3002",
          "[\u4fee\u6b63] \u30dd\u30c3\u30d7\u30a2\u30c3\u30d7\u306b\u4f5c\u8005\u304c\u8868\u793a\u3055\u308c\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002",
          "[\u4fee\u6b63] \u30dd\u30c3\u30d7\u30a2\u30c3\u30d7\u3067\u30b3\u30e1\u30f3\u30c8\u304c\u95b2\u89a7\u51fa\u6765\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002",
          "[\u4fee\u6b63] \u304a\u6c17\u306b\u5165\u308a\u30e6\u30fc\u30b6\u30fc\u306e\u8ffd\u52a0\u3092\u30ef\u30f3\u30af\u30ea\u30c3\u30af\u3067\u884c\u3046\u8a2d\u5b9a\u304c\u52d5\u4f5c\u3057\u3066\u3044\u306a\u304b\u3063\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002"
        ]
      }
    },

    {
      "date": "2012/12/16",
      "version": "1.3.0",
      "releasenote": "http://my.opera.com/crckyl/blog/2012/12/16/pixplus-1-3-0",
      "changes_i18n": {
        "en": [
          "[Add] Add option to remove pixiv comic icon.",
          "[Change] Improve bookmark mode layout.",
          "[Change] Improve key navigation feature in bookmark mode.",
          "[Change] Improve tag edit mode layout.",
          "[Fix] Fix tag edit mode is not working.",
          "[Fix] Can not open preferences in UserJS/Greasemonkey version."
        ],
        "ja": [
          "[\u8ffd\u52a0] pixiv\u30b3\u30df\u30c3\u30af\u30a2\u30a4\u30b3\u30f3\u3092\u9664\u53bb\u3059\u308b\u30aa\u30d7\u30b7\u30e7\u30f3\u3092\u8ffd\u52a0\u3002",
          "[\u5909\u66f4] \u30d6\u30c3\u30af\u30de\u30fc\u30af\u30e2\u30fc\u30c9\u306e\u30ec\u30a4\u30a2\u30a6\u30c8\u3092\u6539\u5584\u3002",
          "[\u5909\u66f4] \u30d6\u30c3\u30af\u30de\u30fc\u30af\u30e2\u30fc\u30c9\u306e\u30ad\u30fc\u64cd\u4f5c\u3092\u6539\u5584\u3002",
          "[\u5909\u66f4] \u30bf\u30b0\u7de8\u96c6\u30e2\u30fc\u30c9\u306e\u30ec\u30a4\u30a2\u30a6\u30c8\u3092\u6539\u5584\u3002",
          "[\u4fee\u6b63] \u30bf\u30b0\u7de8\u96c6\u30e2\u30fc\u30c9\u304c\u52d5\u304b\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002",
          "[\u4fee\u6b63] UserJS/Greasemonkey\u7248\u3067\u8a2d\u5b9a\u753b\u9762\u3092\u958b\u3051\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002"
        ]
      }
    },

    {
      "date": "2012/12/06",
      "version": "1.2.2",
      "releasenote": "http://my.opera.com/crckyl/blog/2012/12/06/pixplus-1-2-2",
      "changes_i18n": {
        "en": [
          "[Fix] Fix manga layout is broken.",
          "[Fix] Fix tag list layout.",
          "[Fix] Fix fail to load access-restricted illust.",
          "[Fix] Fix broken tag list with no tags."
        ],
        "ja": [
          "[\u4fee\u6b63] \u30de\u30f3\u30ac\u306e\u30ec\u30a4\u30a2\u30a6\u30c8\u304c\u5d29\u308c\u308b\u30d0\u30b0\u3092\u4fee\u6b63\u3002",
          "[\u4fee\u6b63] \u30bf\u30b0\u30ea\u30b9\u30c8\u306e\u30ec\u30a4\u30a2\u30a6\u30c8\u3092\u4fee\u6b63\u3002",
          "[\u4fee\u6b63] \u30a2\u30af\u30bb\u30b9\u304c\u5236\u9650\u3055\u308c\u305f\u4f5c\u54c1\u3092\u95b2\u89a7\u51fa\u6765\u306a\u3044\u30d0\u30b0\u3092\u4fee\u6b63\u3002",
          "[\u4fee\u6b63] \u30a4\u30e9\u30b9\u30c8\u306b\u30bf\u30b0\u304c\u767b\u9332\u3055\u308c\u3066\u3044\u306a\u3044\u6642\u306b\u8868\u793a\u304c\u58ca\u308c\u308b\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002"
        ]
      }
    },

    {
      "date": "2012/09/29",
      "version": "1.2.1",
      "releasenote": "http://my.opera.com/crckyl/blog/2012/09/29/pixplus-1-2-1",
      "changes_i18n": {
        "en": [
          "[Fix] Minor fix for pixiv's update."
        ],
        "ja": [
          "[\u4fee\u6b63] pixiv\u306e\u5909\u66f4\u306b\u5bfe\u5fdc\u3002"
        ]
      }
    },

    {
      "date": "2012/08/27",
      "version": "1.2.0",
      "releasenote": "http://my.opera.com/crckyl/blog/2012/08/27/pixplus-1-2-0",
      "changes_i18n": {
        "en": [
          "[Add] Add \"Redirect jump.php\" setting.",
          "[Fix] Fix control key support for DOM3Events.",
          "[Fix] Improve auto-manga-mode feature.",
          "[Fix] Support \"new Staccfeed\" page."
        ],
        "ja": [
          "[\u8ffd\u52a0] \"jump.php\u3092\u30ea\u30c0\u30a4\u30ec\u30af\u30c8\u3059\u308b\"\u8a2d\u5b9a\u3092\u8ffd\u52a0\u3002",
          "[\u4fee\u6b63] DOM3Event\u306eControl\u30ad\u30fc\u30b5\u30dd\u30fc\u30c8\u3092\u4fee\u6b63\u3002",
          "[\u4fee\u6b63] \u81ea\u52d5\u30de\u30f3\u30ac\u30e2\u30fc\u30c9\u306e\u6319\u52d5\u3092\u6539\u5584\u3002",
          "[\u4fee\u6b63] \u300c\u65b0\u3057\u3044\u30b9\u30bf\u30c3\u30af\u30d5\u30a3\u30fc\u30c9\u300d\u3092\u30b5\u30dd\u30fc\u30c8\u3002"
        ]
      }
    },

    {
      "date": "2012/08/14",
      "version": "1.1.1",
      "releasenote": "http://my.opera.com/crckyl/blog/2012/08/14/pixplus-1-1-1",
      "changes_i18n": {
        "en": [
          "[Fix] Header area hidden by click navigator.",
          "[Fix] \"Reverse\" setting applied in manga mode.",
          "[Fix] Can't read old manga if \"Use original size image\" is enabled.",
          "[Fix] Can't add or modify bookmark in staccfeed page.",
          "[Change] Change default value for some preferences.",
          "[Fix][WebKit] Status field layout is broken while loading."
        ],
        "ja": [
          "[\u4fee\u6b63] \u30af\u30ea\u30c3\u30af\u30ca\u30d3\u30b2\u30fc\u30b7\u30e7\u30f3\u306eUI\u3067\u30d8\u30c3\u30c0\u9818\u57df\u304c\u96a0\u308c\u3066\u3057\u307e\u3046\u30d0\u30b0\u3092\u4fee\u6b63\u3002",
          "[\u4fee\u6b63] \"\u79fb\u52d5\u65b9\u5411\u3092\u53cd\u5bfe\u306b\u3059\u308b\"\u8a2d\u5b9a\u304c\u30de\u30f3\u30ac\u30e2\u30fc\u30c9\u306b\u3082\u9069\u7528\u3055\u308c\u3066\u3044\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002",
          "[\u4fee\u6b63] \"\u539f\u5bf8\u306e\u753b\u50cf\u3092\u8868\u793a\u3059\u308b\"\u304c\u6709\u52b9\u306b\u306a\u3063\u3066\u3044\u308b\u3068\u53e4\u3044\u30de\u30f3\u30ac\u4f5c\u54c1\u3092\u95b2\u89a7\u51fa\u6765\u306a\u3044\u30d0\u30b0\u3092\u4fee\u6b63\u3002",
          "[\u4fee\u6b63] \u30b9\u30bf\u30c3\u30af\u30d5\u30a3\u30fc\u30c9\u30da\u30fc\u30b8\u3067\u30d6\u30c3\u30af\u30de\u30fc\u30af\u306e\u8ffd\u52a0\u30fb\u7de8\u96c6\u304c\u51fa\u6765\u306a\u3044\u30d0\u30b0\u3092\u4fee\u6b63\u3002",
          "[\u5909\u66f4] \u3044\u304f\u3064\u304b\u306e\u8a2d\u5b9a\u9805\u76ee\u306e\u30c7\u30d5\u30a9\u30eb\u30c8\u5024\u3092\u5909\u66f4\u3002",
          "[\u4fee\u6b63][WebKit] \u30ed\u30fc\u30c9\u4e2d\u306e\u30b9\u30c6\u30fc\u30bf\u30b9\u8868\u793a\u306e\u30ec\u30a4\u30a2\u30a6\u30c8\u304c\u5909\u306b\u306a\u308b\u306e\u3092\u4fee\u6b63\u3002"
        ]
      }
    },

    {
      "date": "2012/08/09",
      "version": "1.1.0",
      "releasenote": "http://my.opera.com/crckyl/blog/2012/08/09/pixplus-1-1-0",
      "changes_i18n": {
        "en": [
          "[Add] Open popup from illust link in caption(author comment).",
          "[Add] Add tag edit mode.",
          "[Fix] Don't open popup from image-response list in illust page.",
          "[Fix] Improve error handling.",
          "[Fix] Displaying html entity in title and author name.",
          "[Fix] Can' t move to another illust when in bookmark mode.",
          "[Fix] Various minor bug fixes.",
          "[Fix][Firefox] Can't send rating if \"Show confirmation dialog when rating\" option is on.",
          "[Fix][Firefox] Popup don't works on ranking page."
        ],
        "ja": [
          "[\u8ffd\u52a0] \u30ad\u30e3\u30d7\u30b7\u30e7\u30f3\u5185\u306e\u30ea\u30f3\u30af\u304b\u3089\u30dd\u30c3\u30d7\u30a2\u30c3\u30d7\u3092\u958b\u304f\u6a5f\u80fd\u3092\u8ffd\u52a0\u3002",
          "[\u8ffd\u52a0] \u30bf\u30b0\u7de8\u96c6\u6a5f\u80fd\u3092\u8ffd\u52a0\u3002",
          "[\u4fee\u6b63] \u30a4\u30e9\u30b9\u30c8\u30da\u30fc\u30b8\u5185\u306e\u30a4\u30e1\u30fc\u30b8\u30ec\u30b9\u30dd\u30f3\u30b9\u4e00\u89a7\u304b\u3089\u30dd\u30c3\u30d7\u30a2\u30c3\u30d7\u304c\u958b\u304b\u306a\u3044\u30d0\u30b0\u3092\u4fee\u6b63\u3002",
          "[\u4fee\u6b63] \u30a8\u30e9\u30fc\u51e6\u7406\u3092\u6539\u5584\u3002",
          "[\u4fee\u6b63] \u30bf\u30a4\u30c8\u30eb\u3068\u30e6\u30fc\u30b6\u30fc\u540d\u306bHTML\u30a8\u30f3\u30c6\u30a3\u30c6\u30a3\u304c\u8868\u793a\u3055\u308c\u3066\u3044\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002",
          "[\u4fee\u6b63] \u30d6\u30c3\u30af\u30de\u30fc\u30af\u30e2\u30fc\u30c9\u306e\u6642\u306b\u4ed6\u306e\u30a4\u30e9\u30b9\u30c8\u306b\u79fb\u52d5\u51fa\u6765\u306a\u3044\u30d0\u30b0\u3092\u4fee\u6b63\u3002",
          "[\u4fee\u6b63] \u4ed6\u7d30\u304b\u306a\u30d0\u30b0\u4fee\u6b63\u3002",
          "[\u4fee\u6b63][Firefox] \u300c\u30a4\u30e9\u30b9\u30c8\u3092\u8a55\u4fa1\u3059\u308b\u6642\u306b\u78ba\u8a8d\u3092\u3068\u308b\u300d\u30aa\u30d7\u30b7\u30e7\u30f3\u3092\u6709\u52b9\u306b\u3057\u3066\u3044\u308b\u3068\u8a55\u4fa1\u3067\u304d\u306a\u3044\u30d0\u30b0\u3092\u4fee\u6b63\u3002",
          "[\u4fee\u6b63][Firefox] \u30e9\u30f3\u30ad\u30f3\u30b0\u30da\u30fc\u30b8\u3067\u30dd\u30c3\u30d7\u30a2\u30c3\u30d7\u304c\u958b\u304b\u306a\u3044\u30d0\u30b0\u3092\u4fee\u6b63\u3002"
        ]
      }
    },

    {
      "date": "2012/08/08",
      "version": "1.0.0",
      "releasenote": "http://my.opera.com/crckyl/blog/2012/08/08/pixplus-1-0-0",
      "changes_i18n": {
        "en": [
          "Rewrite whole of source code.",
          "[Add] Add preference to specify minimum height of caption area.",
          "[Remove] Remove tag edit feature.",
          "[Remove] Remove some dead preferences.",
          "[Remove] Remove zoom feature.",
          "[Fix] Fix multilingual support."
        ],
        "ja": [
          "\u5168\u4f53\u7684\u306b\u66f8\u304d\u76f4\u3057\u3002",
          "[\u8ffd\u52a0] \u30ad\u30e3\u30d7\u30b7\u30e7\u30f3\u306e\u9ad8\u3055\u306e\u6700\u5c0f\u5024\u3092\u6307\u5b9a\u3059\u308b\u8a2d\u5b9a\u3092\u8ffd\u52a0\u3002",
          "[\u524a\u9664] \u30bf\u30b0\u7de8\u96c6\u6a5f\u80fd\u3092\u524a\u9664\u3002",
          "[\u524a\u9664] \u6a5f\u80fd\u3057\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u3044\u304f\u3064\u304b\u306e\u8a2d\u5b9a\u9805\u76ee\u3092\u524a\u9664\u3002",
          "[\u524a\u9664] \u30ba\u30fc\u30e0\u6a5f\u80fd\u3092\u524a\u9664\u3002",
          "[\u4fee\u6b63] \u591a\u8a00\u8a9e\u30b5\u30dd\u30fc\u30c8\u3092\u4fee\u6b63\u3002"
        ]
      }
    },

    {
      "date": "2012/08/05",
      "version": "0.9.4",
      "releasenote": "http://my.opera.com/crckyl/blog/2012/08/05/pixplus-0-9-4",
      "changes_i18n": {
        "en": [
          "[Fix] Rating feature don't works."
        ],
        "ja": [
          "[\u4fee\u6b63] \u8a55\u4fa1\u6a5f\u80fd\u304c\u52d5\u304b\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u306e\u3092\u4fee\u6b63\u3002"
        ]
      }
    },

    {
      "date": "2012/08/03",
      "version": "0.9.3",
      "releasenote": "http://my.opera.com/crckyl/blog/2012/08/03/pixplus-0-9-3-2",
      "changes_i18n": {
        "en": [
          "[Fix] Support pixiv's update."
        ],
        "ja": [
          "[\u4fee\u6b63] pixiv\u306e\u4ed5\u69d8\u5909\u66f4\u306b\u5bfe\u5fdc\u3002"
        ]
      }
    },

    {
      "date": "2012/06/29",
      "version": "0.9.2",
      "releasenote": "http://my.opera.com/crckyl/blog/2012/06/29/pixplus-0-9-2",
      "changes_i18n": {
        "en": [
          "[Fix] If conf.popup.big_image=0, \"S\" key (conf.key.popup_open_big) opens medium image."
        ],
        "ja": [
          "[\u4fee\u6b63] conf.popup.big_image=0\u306e\u6642\u3001\"S\"\u30ad\u30fc(conf.key.popup_open_big)\u3067medium\u306e\u753b\u50cf\u3092\u958b\u3044\u3066\u3044\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002"
        ]
      }
    },

    {
      "date": "2012/06/26",
      "version": "0.9.1",
      "releasenote": "http://my.opera.com/crckyl/blog/2012/06/25/pixplus-0-9-1",
      "changes_i18n": {
        "en": [
          "[Fix] Corresponds to pixiv's spec changes.",
          "[Fix] In reposted illust, pixplus shows first version."
        ],
        "ja": [
          "[\u4fee\u6b63] pixiv\u306e\u4ed5\u69d8\u5909\u66f4\u306b\u5bfe\u5fdc\u3002",
          "[\u4fee\u6b63] \u30a4\u30e9\u30b9\u30c8\u304c\u518d\u6295\u7a3f\u3055\u308c\u3066\u3044\u308b\u5834\u5408\u306b\u53e4\u3044\u753b\u50cf\u3092\u8868\u793a\u3057\u3066\u3044\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002"
        ]
      }
    },

    {
      "date": "2012/02/17",
      "version": "0.9.0",
      "releasenote": "http://my.opera.com/crckyl/blog/2012/02/17/pixplus-0-9-0",
      "changes_i18n": {
        "en": [
          "[New] Added a setting to change mouse wheel operation. (conf.popup.mouse_wheel)",
          "[Fix] External links in author comment were broken."
        ],
        "ja": [
          "[\u8ffd\u52a0] \u30de\u30a6\u30b9\u30db\u30a4\u30fc\u30eb\u306e\u52d5\u4f5c\u3092\u5909\u66f4\u3059\u308b\u8a2d\u5b9a(conf.popup.mouse_wheel)\u3092\u8ffd\u52a0\u3002",
          "[\u4fee\u6b63] \u30ad\u30e3\u30d7\u30b7\u30e7\u30f3\u5185\u306e\u5916\u90e8\u30ea\u30f3\u30af\u304c\u58ca\u308c\u3066\u3044\u305f\u306e\u3092\u4fee\u6b63\u3002"
        ]
      }
    },

    {
      "date": "2012/02/11",
      "version": "0.8.3",
      "releasenote": "http://my.opera.com/crckyl/blog/2012/02/11/pixplus-0-8-3",
      "changes": [
        "\u65b0\u7740\u30a4\u30e9\u30b9\u30c8\u30da\u30fc\u30b8\u3067\u4e0a\u624b\u304f\u52d5\u4f5c\u3057\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002",
        "\u30b9\u30bf\u30c3\u30af\u30d5\u30a3\u30fc\u30c9\u3067\u4e0a\u624b\u304f\u52d5\u4f5c\u3057\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002",
        "\u30bf\u30b0\u30ea\u30b9\u30c8\u306e\u30d5\u30ed\u30fc\u30c8\u8868\u793a\u306e\u52d5\u4f5c\u3092\u4fee\u6b63\u3002"
      ]
    },

    {
      "date": "2011/10/27",
      "version": "0.8.2",
      "releasenote": "http://my.opera.com/crckyl/blog/2011/10/27/pixplus-0-8-2",
      "changes": [
        "\u30a2\u30f3\u30b1\u30fc\u30c8\u306b\u56de\u7b54\u3059\u308b\u3068\u30a8\u30e9\u30fc\u30c0\u30a4\u30a2\u30ed\u30b0\u304c\u51fa\u308b\u3088\u3046\u306b\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002",
        "\u30c8\u30c3\u30d7\u30da\u30fc\u30b8(mypage.php)\u3067\u4e0a\u624b\u304f\u52d5\u4f5c\u3057\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002"
      ]
    },

    {
      "date": "2011/09/17",
      "version": "0.8.1",
      "releasenote": "http://my.opera.com/crckyl/blog/2011/09/17/pixplus-0-8-1",
      "changes": [
        "pixiv\u306e\u5909\u66f4\u3067\u30a2\u30f3\u30b1\u30fc\u30c8\u306a\u3069\u306e\u52d5\u4f5c\u304c\u304a\u304b\u3057\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002",
        "conf.key.popup_manga_open_page\u306e\u30c7\u30d5\u30a9\u30eb\u30c8\u5024\u304c\u5909\u3060\u3063\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002"
      ]
    },

    {
      "date": "2011/09/03",
      "version": "0.8.0",
      "releasenote": "http://my.opera.com/crckyl/blog/2011/09/03/pixplus-0-8-0",
      "changes": [
        "\u30d6\u30c3\u30af\u30de\u30fc\u30af\u7ba1\u7406\u30da\u30fc\u30b8\u3067\u3001\u95b2\u89a7\u51fa\u6765\u306a\u304f\u306a\u3063\u305f\u30a4\u30e9\u30b9\u30c8\u306b\u4e00\u62ec\u3067\u30c1\u30a7\u30c3\u30af\u3092\u5165\u308c\u308b\u6a5f\u80fd\u3092\u8ffd\u52a0\u3002",
        "\u30b3\u30e1\u30f3\u30c8\u3092\u6295\u7a3f\u3059\u308b\u3068\u30b3\u30e1\u30f3\u30c8\u30d5\u30a9\u30fc\u30e0\u304c\u6d88\u3048\u3066\u3057\u307e\u3046\u30d0\u30b0\u3092\u4fee\u6b63\u3002",
        "\u30d6\u30c3\u30af\u30de\u30fc\u30af\u30d5\u30a9\u30fc\u30e0\u3067\u30a8\u30e9\u30fc\u304c\u51fa\u308b\u3088\u3046\u306b\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002",
        "\u8a00\u8a9e\u30b5\u30dd\u30fc\u30c8\u3092\u6539\u5584\u3002",
        "AutoPatchWork\u7b49\u306e\u30b5\u30dd\u30fc\u30c8\u3092\u6539\u5584\u3002"
      ]
    },

    {
      "date": "2011/08/21",
      "version": "0.7.0",
      "releasenote": "http://my.opera.com/crckyl/blog/2011/08/21/pixplus-0-7-0",
      "changes": [
        "\u30e9\u30f3\u30ad\u30f3\u30b0\u30da\u30fc\u30b8\u306b\u304a\u3044\u3066AutoPatchWork\u306a\u3069\u3067\u7d99\u304e\u8db3\u3057\u305f\u4e8c\u30da\u30fc\u30b8\u76ee\u4ee5\u964d\u306e\u753b\u50cf\u304c\u8868\u793a\u3055\u308c\u306a\u3044\u306e\u3092\u662f\u6b63\u3059\u308b\u6a5f\u80fd\u3092\u8ffd\u52a0\u3002",
        "\u304a\u3059\u3059\u3081\u30a4\u30e9\u30b9\u30c8\u3092\u30da\u30fc\u30b8\u306e\u53f3\u5074\u306b\u8868\u793a\u3059\u308b\u6a5f\u80fd(conf.locate_recommend_right)\u3092\u524a\u9664\u3002",
        "\u5730\u57df\u30e9\u30f3\u30ad\u30f3\u30b0(/ranking_area.php)\u306e\u65b0\u30c7\u30b6\u30a4\u30f3\u306b\u5bfe\u5fdc\u3002"
      ]
    },

    {
      "date": "2011/07/24",
      "version": "0.6.3",
      "releasenote": "http://my.opera.com/crckyl/blog/2011/07/24/pixplus-0-6-3",
      "changes": [
        "\u30b9\u30bf\u30c3\u30af\u30d5\u30a3\u30fc\u30c9\u3067\u30d6\u30c3\u30af\u30de\u30fc\u30af\u3057\u3088\u3046\u3068\u3059\u308b\u3068\u30a8\u30e9\u30fc\u304c\u51fa\u308b\u30d0\u30b0\u3092\u4fee\u6b63\u3002",
        "\u300c\u30b9\u30e9\u30a4\u30c9\u30e2\u30fc\u30c9\u300d\u8a2d\u5b9a\u306e\u6642\u3001\u30de\u30f3\u30ac\u3092\u95b2\u89a7\u51fa\u6765\u306a\u3044\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002",
        "\u30e9\u30f3\u30ad\u30f3\u30b0\u3067\u4e0a\u624b\u304f\u52d5\u4f5c\u3057\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002"
      ]
    },

    {
      "date": "2011/06/26",
      "version": "0.6.2",
      "releasenote": "http://my.opera.com/crckyl/blog/2011/06/26/pixplus-0-6-2",
      "changes": [
        "\u8a2d\u5b9a\u753b\u9762\u3078\u306e\u30ea\u30f3\u30af\u304c\u8868\u793a\u3055\u308c\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002",
        "\u30a4\u30d9\u30f3\u30c8\u306e\u7279\u8a2d\u30da\u30fc\u30b8(e.g. /event_starfestival2011.php)\u3067\u52d5\u4f5c\u3057\u3066\u3044\u306a\u304b\u3063\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002"
      ]
    },

    {
      "date": "2011/05/21",
      "version": "0.6.1",
      "releasenote": "http://my.opera.com/crckyl/blog/2011/05/21/pixplus-0-6-1",
      "changes": [
        "Opera10.1x\u3067\u52d5\u4f5c\u3057\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002",
        "\u30bf\u30b0\u691c\u7d22(ex. /tags.php?tag=pixiv)\u3067\u52d5\u4f5c\u3057\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002",
        "\u30a8\u30e9\u30fc\u8868\u793a\u306e\u52d5\u4f5c\u304c\u5909\u3060\u3063\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002",
        "conf.popup_ranking_log\u3092\u524a\u9664\u3002",
        "\u65b0\u7740\u30da\u30fc\u30b8\u3067\u52d5\u4f5c\u3057\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002",
        "conf.locate_recommend_right\u304c\u52d5\u4f5c\u3057\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002"
      ]
    },

    {
      "date": "2011/05/13",
      "version": "0.6.0",
      "releasenote": "http://my.opera.com/crckyl/blog/2011/05/13/pixplus-0-5-1",
      "changes": [
        "\u30ad\u30fc\u30d0\u30a4\u30f3\u30c9\u306e\u30ab\u30b9\u30bf\u30de\u30a4\u30ba\u6a5f\u80fd\u3092\u8ffd\u52a0\u3002",
        "\u30a4\u30e9\u30b9\u30c8\u30da\u30fc\u30b8\u3067\u30d6\u30c3\u30af\u30de\u30fc\u30af\u306e\u51e6\u7406\u304c\u52d5\u4f5c\u3057\u3066\u3044\u306a\u304b\u3063\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002",
        "\u30e9\u30a4\u30bb\u30f3\u30b9\u3092Apache License 2.0\u306b\u5909\u66f4\u3002",
        "Webkit\u3067\u30d6\u30c3\u30af\u30de\u30fc\u30af\u30d5\u30a9\u30fc\u30e0\u306e\u8868\u793a\u304c\u5909\u3060\u3063\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002",
        "\u30c8\u30c3\u30d7\u30da\u30fc\u30b8\u306e\u30ec\u30a4\u30a2\u30a6\u30c8\u3092\u30d0\u30c3\u30af\u30a2\u30c3\u30d7\u3059\u308b\u6a5f\u80fd\u3092\u8ffd\u52a0(\u5fa9\u6d3b)\u3002",
        "Chrome\u3067\u30bb\u30f3\u30bf\u30fc\u30af\u30ea\u30c3\u30af\u306b\u3082\u53cd\u5fdc\u3057\u3066\u3044\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002",
        "Webkit\u3067\u306e\u30ad\u30fc\u64cd\u4f5c\u3092\u6539\u5584\u3002",
        "\u30d6\u30c3\u30af\u30de\u30fc\u30af\u30d5\u30a9\u30fc\u30e0\u306a\u3069\u306e\u52d5\u4f5c\u304c\u5909\u306b\u306a\u3063\u3066\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002",
        "\u691c\u7d22\u30da\u30fc\u30b8\u3067\u52d5\u304b\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002"
      ]
    },

    {
      "date": "2011/03/26",
      "version": "0.5.1",
      "releasenote": "http://my.opera.com/crckyl/blog/2011/03/26/pixplus-0-5-1",
      "changes": [
        "\u304a\u3059\u3059\u3081\u30a4\u30e9\u30b9\u30c8\u304c\u975e\u8868\u793a\u306e\u6642\u3082conf.locate_recommend_right\u304c\u52d5\u4f5c\u3057\u3066\u3057\u307e\u3046\u30d0\u30b0\u3092\u4fee\u6b63\u3002",
        "conf.extagedit\u3092\u5ec3\u6b62\u3057\u3066conf.bookmark_form\u306b\u5909\u66f4\u3002",
        "pixiv\u306e\u8a00\u8a9e\u8a2d\u5b9a\u304c\u65e5\u672c\u8a9e\u4ee5\u5916\u306e\u6642\u306b\u30de\u30f3\u30ac\u304c\u95b2\u89a7\u3067\u304d\u306a\u304b\u3063\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002",
        "\u30de\u30f3\u30ac\u306e\u898b\u958b\u304d\u8868\u793a\u3092\u4fee\u6b63\u3002",
        "Firefox4\u3067\u30d6\u30c3\u30af\u30de\u30fc\u30af\u7de8\u96c6\u753b\u9762\u3067\u30bf\u30b0\u3092\u9078\u629e\u3067\u304d\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002",
        "\u30d6\u30c3\u30af\u30de\u30fc\u30af\u6e08\u307f\u306e\u30a4\u30e9\u30b9\u30c8\u3067\u30d6\u30c3\u30af\u30de\u30fc\u30af\u30dc\u30bf\u30f3\u304c\u8868\u793a\u3055\u308c\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002"
      ]
    },

    {
      "date": "2011/02/15",
      "version": "0.5.0",
      "releasenote": "http://my.opera.com/crckyl/blog/pixplus-0-5-0",
      "changes": [
        "conf.extension\u3092\u5ec3\u6b62\u3002Opera\u62e1\u5f35\u7248\u306e\u30c4\u30fc\u30eb\u30d0\u30fc\u30a2\u30a4\u30b3\u30f3\u3092\u524a\u9664\u3002",
        "Firefox\u3067\u30b3\u30e1\u30f3\u30c8\u8868\u793a\u6a5f\u80fd\u304c\u52d5\u4f5c\u3057\u3066\u3044\u306a\u304b\u3063\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002",
        "Firefox\u3067\u30d6\u30c3\u30af\u30de\u30fc\u30af\u7de8\u96c6\u30d5\u30a9\u30fc\u30e0\u3067\u30a2\u30ed\u30fc\u30ad\u30fc\u3067\u30bf\u30b0\u9078\u629e\u3092\u884c\u3046\u6642\u306b\u5165\u529b\u5c65\u6b74\u304c\u8868\u793a\u3055\u308c\u308b\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002",
        "\u30dd\u30c3\u30d7\u30a2\u30c3\u30d7\u306e\u30bf\u30b0\u7de8\u96c6\u306eUI\u3092\u30d6\u30c3\u30af\u30de\u30fc\u30af\u7de8\u96c6\u3068\u540c\u3058\u306b\u5909\u66f4\u3002",
        "\u30dd\u30c3\u30d7\u30a2\u30c3\u30d7\u3067\u30d6\u30c3\u30af\u30de\u30fc\u30af\u7de8\u96c6\u30e2\u30fc\u30c9\u306e\u307e\u307e\u4ed6\u306e\u30a4\u30e9\u30b9\u30c8\u306b\u79fb\u52d5\u3059\u308b\u3068\u30ad\u30e3\u30d7\u30b7\u30e7\u30f3\u304c\u8868\u793a\u3055\u308c\u306a\u304f\u306a\u308b\u30d0\u30b0\u3092\u4fee\u6b63\u3002",
        "\u30de\u30f3\u30ac\u30e2\u30fc\u30c9\u3067\u3082\u53ef\u80fd\u306a\u3089\u539f\u5bf8\u306e\u753b\u50cf\u3092\u4f7f\u7528\u3059\u308b\u3088\u3046\u306b\u5909\u66f4\u3002",
        "\u30e1\u30f3\u30d0\u30fc\u30a4\u30e9\u30b9\u30c8\u30da\u30fc\u30b8\u306a\u3069\u3092\u958b\u3044\u305f\u6642\u306b\u8a55\u4fa1\u306a\u3069\u304c\u51fa\u6765\u306a\u3044\u5834\u5408\u304c\u3042\u308b\u30d0\u30b0\u3092\u4fee\u6b63\u3002",
        "\u8a2d\u5b9a\u753b\u9762\u306e\u30c7\u30b6\u30a4\u30f3\u3092\u5909\u66f4\u3002",
        "Opera10.1x\u3067\u30dd\u30c3\u30d7\u30a2\u30c3\u30d7\u3092\u958b\u3044\u305f\u6642\u306b\u753b\u50cf\u304c\u8868\u793a\u3055\u308c\u306a\u3044\u30d0\u30b0\u3092\u4fee\u6b63\u3002",
        "\u5c0f\u8aac\u30da\u30fc\u30b8\u3067\u8a55\u4fa1\u3067\u304d\u306a\u304b\u3063\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002",
        "conf.expand_novel\u3092\u524a\u9664\u3002",
        "\u4ed6\u30e6\u30fc\u30b6\u30fc\u306e\u30d6\u30c3\u30af\u30de\u30fc\u30af\u30da\u30fc\u30b8\u3067\u52d5\u304b\u306a\u304f\u306a\u3063\u3066\u305f\u306e\u3092\u4fee\u6b63\u3002"
      ]
    },

    {
      "date": "2011/02/04",
      "version": "0.4.0",
      "releasenote": "http://my.opera.com/crckyl/blog/2011/02/04/pixplus-0-4-0",
      "changes": [
        "pixivreader\u3068\u885d\u7a81\u3059\u308b\u3089\u3057\u3044\u306e\u3067\u3001exclude\u306b\u8ffd\u52a0\u3002",
        "\u8a2d\u5b9a\u307e\u308f\u308a\u3092\u4f5c\u308a\u76f4\u3057\u3002Chrome/Safari\u62e1\u5f35\u7248\u306b\u30aa\u30d7\u30b7\u30e7\u30f3\u30da\u30fc\u30b8\u8ffd\u52a0\u3002\u8a2d\u5b9a\u304c\u5f15\u304d\u7d99\u304c\u308c\u306a\u3044\u3002",
        "OperaExtension\u7248\u3067\u52d5\u4f5c\u3057\u306a\u3044\u5834\u5408\u304c\u3042\u308b\u30d0\u30b0\u3092\u305f\u3076\u3093\u4fee\u6b63\u3002",
        "\u95b2\u89a7\u3067\u304d\u306a\u3044\u30de\u30f3\u30ac\u304c\u3042\u3063\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002",
        "\u30ba\u30fc\u30e0\u6a5f\u80fd\u3067Firefox\u3092\u30b5\u30dd\u30fc\u30c8\u3002",
        "\u4f01\u753b\u76ee\u9332\u95a2\u9023\u30da\u30fc\u30b8\u306b\u5bfe\u5fdc\u3002",
        "\u30de\u30f3\u30ac\u30da\u30fc\u30b8\u306e\u5909\u66f4(\u898b\u958b\u304d\u8868\u793a\u306a\u3069)\u306b\u5bfe\u5fdc\u3002\u305d\u308c\u306b\u4f34\u3063\u3066conf.default_manga_type\u3068conf.popup_manga_tb\u3092\u524a\u9664\u3002",
        "\u4f5c\u54c1\u7ba1\u7406\u30da\u30fc\u30b8\u3067\u52d5\u4f5c\u3057\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002",
        "Chrome/Safari\u3067AutoPatchWork\u306b\u5bfe\u5fdc\u3002"
      ]
    },

    {
      "date": "2011/01/15",
      "version": "0.3.2",
      "releasenote": "http://my.opera.com/crckyl/blog/2011/01/14/pixplus-0-3-2",
      "changes": [
        "\u30d6\u30c3\u30af\u30de\u30fc\u30af\u7ba1\u7406\u30da\u30fc\u30b8\u3067\u4e0a\u624b\u304f\u52d5\u4f5c\u3057\u3066\u3044\u306a\u304b\u3063\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002"
      ]
    },

    {
      "date": "2011/01/14",
      "version": "0.3.1",
      "releasenote": "http://my.opera.com/crckyl/blog/2011/01/14/pixplus-0-3-1",
      "changes": [
        "Opera\u4ee5\u5916\u306e\u30d6\u30e9\u30a6\u30b6\u306b\u304a\u3044\u3066\u4e00\u90e8\u306e\u30da\u30fc\u30b8\u3067\u8a55\u4fa1\u3084\u30b3\u30e1\u30f3\u30c8\u8868\u793a\u306a\u3069\u306e\u6a5f\u80fd\u306e\u52d5\u4f5c\u304c\u5909\u3060\u3063\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002",
        "conf.popup.rate_key=true\u306e\u6642\u3001Shift\u30ad\u30fc\u306a\u3057\u3067\u8a55\u4fa1\u3067\u304d\u3066\u3044\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002",
        "ChromeExtension/SafariExtension\u7248\u3067\u81ea\u52d5\u30a2\u30c3\u30d7\u30c7\u30fc\u30c8\u306b\u5bfe\u5fdc\u3002",
        "OperaExtension\u7248\u306e\u30aa\u30d7\u30b7\u30e7\u30f3\u30da\u30fc\u30b8\u3067\u6570\u5024\u304cNaN\u306b\u306a\u308b\u5834\u5408\u304c\u3042\u308b\u30d0\u30b0\u3092\u305f\u3076\u3093\u4fee\u6b63\u3002"
      ]
    },

    {
      "date": "2010/12/26",
      "version": "0.3.0",
      "releasenote": "http://my.opera.com/crckyl/blog/2010/12/26/pixplus-0-3-0",
      "changes": [
        "conf.fast_user_bookmark\u8ffd\u52a0\u3002",
        "\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb\u753b\u50cf\u306e\u5de6\u4e0a\u306b\u30a2\u30a4\u30b3\u30f3(\u30c1\u30a7\u30c3\u30af:\u304a\u6c17\u306b\u5165\u308a/\u30cf\u30fc\u30c8:\u76f8\u4e92/\u65d7:\u30de\u30a4\u30d4\u30af)\u3092\u8868\u793a\u3059\u308b\u6a5f\u80fd(conf.popup.author_status_icon)\u8ffd\u52a0\u3002",
        "\u30b3\u30e1\u30f3\u30c8\u8868\u793a\u6a5f\u80fd\u3092\u8ffd\u52a0\u3002",
        "\u30a2\u30f3\u30b1\u30fc\u30c8\u7d50\u679c\u306e\u8868\u793a\u3092\u5909\u66f4\u3002",
        "\u95b2\u89a7\u30fb\u8a55\u4fa1\u30fb\u30b3\u30e1\u30f3\u30c8\u5c65\u6b74\u30da\u30fc\u30b8\u306b\u5bfe\u5fdc\u3002",
        "\u30ad\u30fc\u30d0\u30a4\u30f3\u30c9\u3092\u5909\u66f4\u3002Shift+c:\u30b3\u30e1\u30f3\u30c8\u8868\u793a/d:\u30a2\u30f3\u30b1\u30fc\u30c8/a:\u623b\u308b",
        "\u30dd\u30c3\u30d7\u30a2\u30c3\u30d7\u306e\u30a4\u30d9\u30f3\u30c8API\u3092Popup.on*\u306e\u307f\u306b\u5909\u66f4\u3002",
        "conf.expand_novel\u8ffd\u52a0\u3002",
        "\u30e9\u30f3\u30ad\u30f3\u30b0\u30ab\u30ec\u30f3\u30c0\u30fc\u306b\u5bfe\u5fdc\u3002conf.popup_ranking_log\u8ffd\u52a0\u3002",
        "\u30a4\u30d9\u30f3\u30c8\u8a73\u7d30/\u53c2\u52a0\u8005\u30da\u30fc\u30b8\u306b\u5bfe\u5fdc\u3002",
        "Extension\u7248\u306b\u30c4\u30fc\u30eb\u30d0\u30fc\u30dc\u30bf\u30f3\u3068\u8a2d\u5b9a\u753b\u9762\u3092\u8ffd\u52a0\u3002conf.extension.*\u8ffd\u52a0\u3002",
        "\u30bf\u30b0\u306e\u4e26\u3079\u66ff\u3048\u3092\u8a2d\u5b9a\u3057\u3066\u3044\u306a\u3044\u6642\u3001\u30d6\u30c3\u30af\u30de\u30fc\u30af\u7de8\u96c6\u306e\u52d5\u4f5c\u304c\u304a\u304b\u3057\u304b\u3063\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002"
      ]
    },

    {
      "date": "2010/12/01",
      "version": "0.2.0",
      "releasenote": "http://my.opera.com/crckyl/blog/2010/12/01/pixplus-0-2-0",
      "changes": [
        "Extension\u7248\u3067\u30a2\u30f3\u30b1\u30fc\u30c8\u306b\u7b54\u3048\u3089\u308c\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002",
        "\u30c8\u30c3\u30d7\u30da\u30fc\u30b8\u306e\u30ec\u30a4\u30a2\u30a6\u30c8\u3092\u30d0\u30c3\u30af\u30a2\u30c3\u30d7\u3059\u308b\u6a5f\u80fd\u8ffd\u52a0\u3002",
        "Extension\u7248\u306e\u81ea\u52d5\u30a2\u30c3\u30d7\u30c7\u30fc\u30c8\u306b\u5bfe\u5fdc\u3002",
        "\u4e0a\u4e0b\u30ad\u30fc\u3067\u30ad\u30e3\u30d7\u30b7\u30e7\u30f3\u3092\u30b9\u30af\u30ed\u30fc\u30eb\u3059\u308b\u3088\u3046\u306b\u5909\u66f4\u3002conf.popup.scroll_height\u8ffd\u52a0\u3002",
        "\u753b\u50cf\u3092\u62e1\u5927/\u7e2e\u5c0f\u3059\u308b\u30ad\u30fc\u3092o/i\u304b\u3089+/-\u306b\u5909\u66f4\u3002",
        "d\u30ad\u30fc(\u524d\u306e\u30a4\u30e9\u30b9\u30c8\u306b\u623b\u308b)\u3092\u30ad\u30fc\u30d0\u30a4\u30f3\u30c9\u306b\u8ffd\u52a0\u3002"
      ]
    },

    {
      "date": "2010/11/14",
      "version": "0.1.2",
      "releasenote": "http://my.opera.com/crckyl/blog/2010/11/14/pixplus-0-1-2",
      "changes": [
        "\u4e00\u90e8\u306e\u30da\u30fc\u30b8\u3067\u30a2\u30f3\u30b1\u30fc\u30c8\u7d50\u679c\u3092\u8868\u793a\u51fa\u6765\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002",
        "\u30a2\u30f3\u30b1\u30fc\u30c8\u306b\u7b54\u3048\u305f\u5f8c\u3001\u9078\u629e\u80a2\u304c\u8868\u793a\u3055\u308c\u305f\u307e\u307e\u306b\u306a\u3063\u3066\u3044\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002",
        "\u30b9\u30bf\u30c3\u30af\u30d5\u30a3\u30fc\u30c9\u4e0a\u3067\u8a55\u4fa1\u3084\u30bf\u30b0\u7de8\u96c6\u304c\u51fa\u6765\u306a\u304b\u3063\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002",
        "\u30de\u30a6\u30b9\u64cd\u4f5c\u7528UI\u306e\u8868\u793a\u3092\u5909\u66f4\u3002",
        "conf.popup.overlay_control\u8ffd\u52a0\u3002",
        "\u30de\u30f3\u30ac\u30da\u30fc\u30b8(mode=manga)\u3067\u6539\u30da\u30fc\u30b8\u51fa\u6765\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002",
        "\u8a55\u4fa1\u51fa\u6765\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002"
      ]
    },

    {
      "date": "2010/11/02",
      "version": "0.1.1",
      "releasenote": "http://my.opera.com/crckyl/blog/2010/11/02/pixplus-0-1-1",
      "changes": [
        "\u30a4\u30d9\u30f3\u30c8\u30da\u30fc\u30b8(e.g. http://www.pixiv.net/event_halloween2010.php)\u7528\u306e\u6c4e\u7528\u30b3\u30fc\u30c9\u8ffd\u52a0\u3002",
        "conf.locate_recommend_right\u304c2\u306e\u6642\u3001\u4e0a\u624b\u304f\u52d5\u4f5c\u3057\u306a\u3044\u5834\u5408\u304c\u3042\u308b\u30d0\u30b0\u3092\u4fee\u6b63\u3002",
        "pixiv\u306e\u5909\u66f4(\u8a55\u4fa1\u3001\u30e9\u30f3\u30ad\u30f3\u30b0\u3001etc)\u306b\u5bfe\u5fdc\u3002"
      ]
    },

    {
      "date": "2010/10/27",
      "version": "0.1.0",
      "releasenote": "http://my.opera.com/crckyl/blog/2010/10/27/pixplus-0-1-0",
      "changes": [
        "Opera11\u306eExtension\u306b\u5bfe\u5fdc\u3002",
        "\u30d6\u30c3\u30af\u30de\u30fc\u30af\u7ba1\u7406\u30da\u30fc\u30b8\u3067\u30ec\u30b3\u30e1\u30f3\u30c9\u3092\u53f3\u5074\u306b\u4e26\u3079\u308b\u6a5f\u80fd\u304c\u52d5\u4f5c\u3057\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u306e\u3092\u4fee\u6b63\u3002",
        "AutoPatchWork\u306b\u5bfe\u5fdc\u3002"
      ]
    }
    // __CHANGELOG_END__
  ];

  /* __DATA_END__ */

  _.run();
});
