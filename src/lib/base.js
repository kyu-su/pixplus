var _ = w.pixplus = {
  extend: function(base) {
    g.Array.prototype.slice.call(arguments, 1).forEach(function(extract) {
      for(var key in extract) {
        base[key] = extract[key];
      }
    });
    return base;
  },

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

  throttle_wrap: function(func) {
    var throttling_timer;
    return function() {
      if (throttling_timer) {
        return;
      }
      var that = this;
      var args = Array.prototype.slice.call(arguments);
      throttling_timer = g.setTimeout(function() {
        func.apply(that, args);
        throttling_timer = 0;
      }, 50);
    };
  },

  listen: function(targets, events, listener, options) {
    var throttling_timer;

    if (!options) {
      options = {};
    }

    if (!targets) {
      targets = [];
    } else if (!g.Array.isArray(targets)) {
      targets = [targets];
    }

    if (!g.Array.isArray(events)) {
      events = [events];
    }

    // _.debug('listen: ' + targets.join(',') + ' ' + events.join(',') + ' capture:' + !!options.capture);

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

  observe_domnodeinserted: function(target, callback) {
    if (w.MutationObserver) {
      var observer = new w.MutationObserver(_.throttle_wrap(callback));
      observer.observe(target, {childList: true, subtree: true});
    } else {
      _.listen(target, 'DOMNodeInserted', callback, {async: true});
    }
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

  lazy_scroll: function(target, scroll) {
    var de     = d.documentElement,
        margin = g.Math.floor(de.clientHeight * 0.2);

    if (!target) {
      return;
    }
    if (!scroll) {
      scroll = target.parentElement;
    }

    var r_scroll = scroll.getBoundingClientRect(),
        r_target = target.getBoundingClientRect(),
        bt       = g.Math.max(margin, r_scroll.top + margin),
        bb       = g.Math.min(r_scroll.bottom - margin, de.clientHeight - margin),
        change   = 0;

    if (r_target.top < bt) {
      change = r_target.top - bt;
    } else if (r_target.bottom > bb) {
      change = r_target.bottom - bb;
    }

    if (scroll === de) {
      w.scrollBy(0, change);
    } else {
      var style = w.getComputedStyle(scroll);
      if (scroll.scrollHeight > scroll.clientHeight) {
        scroll.scrollTop += change;
      }
      if (scroll.parentElement && !/^fixed$/i.test(style.position)) {
        _.lazy_scroll(target, scroll.parentElement);
      }
    }
  },

  e: function(name, options, parent) {
    if (!options) {
      options = { };
    }

    var elem, nsuri;

    if (options.ns) {
      nsuri = _.namespaces[options.ns] || options.ns;
      delete options.ns;
    } else if (_.namespaces[name]) {
      nsuri = _.namespaces[name];
    } else if (parent) {
      nsuri = parent.namespaceURI;
    }

    if (nsuri) {
      elem = d.createElementNS(nsuri, name);
    } else {
      elem = d.createElement(name);
    }

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

    if (parent) {
      parent.appendChild(elem);
    }
    return elem;
  },

  namespaces: {
    svg: 'http://www.w3.org/2000/svg'
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
    return !(/^textarea$/i.test(ev.target.nodeName) ||
             (/^input$/i.test(ev.target.nodeName) &&
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
  },

  parse_html: function(html) {
    var doc = d.implementation.createHTMLDocument('');
    doc.documentElement.innerHTML = html;
    return doc;
  },

  class: {
    create: function() {
      var constructor = function() {
        this.init.apply(this, arguments);
      };
      _.extend.apply(_, [constructor.prototype].concat(
        g.Array.prototype.slice.call(arguments)));
      if (arguments.length >= 2) {
        constructor.super = arguments[0];
      }
      return constructor;
    }
  }
};

['log', 'error', 'debug', 'warn'].forEach(function(name) {
  if (g.console) {
    _[name] = function(msg) {
      if (name !== 'debug' || _.conf.general.debug) {
        var args = g.Array.prototype.slice.call(arguments);
        if (typeof(args[0]) === 'string') {
          args[0] = 'pixplus: [' + name + '] ' + args[0];
        }
        (g.console[name] || g.console.log).apply(g.console, args);
      }
    };
  } else {
    _[name] = function() { };
  }
});
