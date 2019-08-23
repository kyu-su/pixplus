// ==UserScript==
// @name        pixplusPlus
// @author      kyusu
// @version     1.19.4
// @license     The MIT License
// @description hogehoge
// @icon        http://ccl4.info/pixplus/pixplus_48.png
// @icon64      http://ccl4.info/pixplus/pixplus_64.png
// @namespace   http://my.opera.com/crckyl/
// @include     http://www.pixiv.net/*
// @include     https://www.pixiv.net/*
// @run-at      document-start
// @downloadURL https://ccl4.info/cgit/pixplus.git/plain/autoupdate/1/pixplus.user.js
// @grant       none
// ==/UserScript==

(function (entrypoint) {
    var w = window, g = this || window;

    if (/pixivreader/.test(w.location.href) || w !== w.top) {
        return;
    }

    var greasemonkey = true;

    var inject = function () {
        var d = w.document;
        if (!(d.body || d.documentElement)) {
            // for scriptish
            window.setTimeout(function () {
                inject();
            }, 100);
            return;
        }
        var s = w.document.createElement('script');
        s.setAttribute('type', 'text/javascript');
        s.textContent
            = ('(' + entrypoint.toString() + ')'
            + '(this || window,window,window.document)');
        (d.body || d.documentElement).appendChild(s);
    };

    inject();
})(function (g, w, d, _extension_data) {

    if (w.pixplus || w !== w.top) {
        return;
    }

// generated from:
//   src/lib/base.js
//   src/lib/base64.js
//   src/lib/crc32.js
//   src/lib/conf.js
//   src/lib/xhr.js
//   src/lib/key.js
//   src/lib/ui.js
//   src/lib/configui.js
var _ = w.pixplus = {
    extend: function (base) {
        g.Array.prototype.slice.call(arguments, 1).forEach(function (extract) {
            for (var key in extract) {
                base[key] = extract[key];
            }
        });
        return base;
    },

    version: function () {
        return _.changelog[0].version;
    },

    release_date: function () {
        return _.changelog[0].date;
    },

    strip: function (text) {
        return text ? text.replace(/(?:^\s+|\s+$)/g, '') : '';
    },

    escape_regex: function (text) {
        return text.replace(/([\.\?\*\+\|\(\)\[\]\\])/g, '\\$1');
    },

    q: function (query, context) {
        return (context || d).querySelector(query);
    },

    qa: function (query, context) {
        var list = (context || d).querySelectorAll(query);
        return g.Array.prototype.slice.call(list);
    },

    throttle_wrap: function (func) {
        var throttling_timer;
        return function () {
            if (throttling_timer) {
                return;
            }
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            throttling_timer = g.setTimeout(function () {
                func.apply(that, args);
                throttling_timer = 0;
            }, 50);
        };
    },

    listen: function (targets, events, listener, options) {
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

        var wrapper = function (ev) {
            if (options.async) {
                if (throttling_timer) {
                    return;
                }
                throttling_timer = g.setTimeout(function () {
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
            disconnect: function () {
                if (connection.disconnected) {
                    return;
                }
                events.forEach(function (event) {
                    targets.forEach(function (target) {
                        target.removeEventListener(event, wrapper, !!options.capture);
                    });
                });
                connection.disconnected = true;
            }
        };

        events.forEach(function (event) {
            targets.forEach(function (target) {
                target.addEventListener(event, wrapper, !!options.capture);
            });
        });
        return connection;
    },

    observe_domnodeinserted: function (target, callback) {
        if (w.MutationObserver) {
            var observer = new w.MutationObserver(_.throttle_wrap(callback));
            observer.observe(target, {childList: true, subtree: true});
        } else {
            _.listen(target, 'DOMNodeInserted', callback, {async: true});
        }
    },

    onclick: function (context, listener, options) {
        return _.listen(context, 'click', function (ev, connection) {
            if (ev.button !== 0 || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.metaKey) {
                return false;
            }
            return listener(ev, connection);
        }, options);
    },

    onwheel: function (context, listener, options) {
        return _.listen(
            context,
            ['DOMMouseScroll', 'mousewheel'],
            function (ev, connection) {
                if (ev.ctrlKey || ev.shiftKey || ev.altKey || ev.metaKey) {
                    return false;
                }
                return listener(ev, connection);
            },
            options
        );
    },

    send_click: function (elem) {
        _.debug('send click event');
        var doc = elem.ownerDocument || d,
            ev = doc.createEvent('MouseEvent'),
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

    lazy_scroll: function (target, scroll) {
        var de = d.documentElement,
            margin = g.Math.floor(de.clientHeight * 0.2);

        if (!target) {
            return;
        }
        if (!scroll) {
            scroll = target.parentElement;
        }

        var r_scroll = scroll.getBoundingClientRect(),
            r_target = target.getBoundingClientRect(),
            bt = g.Math.max(margin, r_scroll.top + margin),
            bb = g.Math.min(r_scroll.bottom - margin, de.clientHeight - margin),
            change = 0;

        if (r_target.top < bt) {
            change = r_target.top - bt;
        } else if (r_target.bottom > bb) {
            change = r_target.bottom - bb;
        } else {
            return;
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

    e: function (name, options, parent) {
        if (!options) {
            options = {};
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

        for (var key in options) {
            var val = options[key];
            if (key === 'tooltip' || key === 'key') {
                continue;
            } else if (key === 'svg') {
                if (typeof (val) === 'string') {
                    val = [val];
                }
                val.forEach(function (name) {
                    elem.appendChild(_.svg[name](d));
                });
                continue;
            }

            if (key === 'text') {
                elem.textContent = val;
            } else if (key === 'css') {
                elem.style.cssText = val;
            } else if (key === 'cls') {
                elem.setAttribute('class', val);
            } else {
                elem.setAttribute(key, val);
            }
        }

        if (options.tooltip) {
            _.ui.tooltip.set(elem, _.lng.tooltip[val], options.key);
        }

        if (parent) {
            parent.appendChild(elem);
        }
        return elem;
    },

    namespaces: {
        svg: 'http://www.w3.org/2000/svg'
    },

    clear: function () {
        g.Array.prototype.forEach.call(arguments, function (elem) {
            while (elem.childNodes.length) {
                elem.removeChild(elem.childNodes[0]);
            }
        });
    },

    open: function (url) {
        if (url) {
            w.open(url);
        }
    },

    key_enabled: function (ev) {
        return !(/^textarea$/i.test(ev.target.nodeName) ||
            (/^input$/i.test(ev.target.nodeName) &&
                (!ev.target.type ||
                    /^(?:text|search|tel|url|email|password|number)$/i.test(ev.target.type))));
    },

    parse_query: function (query) {
        var map = {};
        query.replace(/^.*?\?/, '').split('&').forEach(function (p) {
            var pair = p.split('=', 2).map(function (t) {
                return g.decodeURIComponent(t);
            });
            map[pair[0]] = pair[1] || '';
        });
        return map;
    },

    calculate_ratio: function (width, height) {
        return (width - height) / g.Math.min(width, height);
    },

    parse_html: function (html) {
        var doc = d.implementation.createHTMLDocument('');
        doc.documentElement.innerHTML = html;
        return doc;
    },

    class: {
        create: function () {
            var constructor = function () {
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

['log', 'error', 'debug', 'warn'].forEach(function (name) {
    if (g.console) {
        _[name] = function (msg) {
            if (name !== 'debug' || _.conf.general.debug) {
                var args = g.Array.prototype.slice.call(arguments);
                if (typeof (args[0]) === 'string') {
                    args[0] = 'pixplus: [' + name + '] ' + args[0];
                }
                if (name === 'debug') {
                    g.console.log.apply(g.console, args)
                } else {
                    (g.console[name] || g.console.log).apply(g.console, args);
                }
            }
        };
    } else {
        _[name] = function () {
        };
    }
});
_.base64 = (function (gen) {
    var base64 = gen();
    base64.__mod_generator = gen;
    return base64;
})(function () {
    return {
        make_table: function () {
            if (this.table) {
                return;
            }

            var that = this;
            this.table_dec = {};
            this.table_enc = [];
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('').forEach(function (c, i) {
                that.table_dec[c] = i;
                that.table_enc.push(c);
            });
        },

        dec: function (b64str) {
            this.make_table();

            b64str = b64str.replace(/=+$/, '');

            var length = Math.floor(b64str.length * 3 / 4),
                remains = b64str.length % 4;
            if (remains === 1) {
                throw 'Invalid base64 length';
            } else if (remains === 2) {
                ++length;
            } else if (remains === 3) {
                length += 2;
            }

            var data = new Uint8Array(length);

            for (var idx = 0, wi = 0; idx < b64str.length; ++idx) {
                var c = this.table_dec[b64str[idx]];
                if (typeof (c) === 'undefined') {
                    throw 'Invalid character for base64 - ' + b64str[idx];
                }
                if ((idx % 4) === 0) {
                    data[wi++] = (c << 2) & 0xfc;
                } else if ((idx % 4) === 1) {
                    data[wi - 1] |= (c >> 4) & 0x3;
                    data[wi++] = (c << 4) & 0xf0;
                } else if ((idx % 4) === 2) {
                    data[wi - 1] |= (c >> 2) & 0xf;
                    data[wi++] = (c << 6) & 0xc0;
                } else if ((idx % 4) === 3) {
                    data[wi - 1] |= c & 0x3f;
                }
            }

            return data;
        },

        enc: function (bytesary) {
            this.make_table();

            var b64 = [];

            var that = this;
            var add = function (sixbits) {
                var c = that.table_enc[sixbits];
                if (!c) {
                    throw 'Base64 encode table has no entry for - 0x' + sixbits.toString(16);
                }
                b64.push(c);
            };

            var idx = 0, p = -1;
            for (var i = 0; i < bytesary.length; ++i) {
                var bytes = bytesary[i];
                for (var j = 0; j < bytes.length; ++j) {
                    if (idx % 3 === 0) {
                        add((bytes[j] >> 2) & 0x3f);
                        p = (bytes[j] << 4) & 0x30;
                    } else if (idx % 3 === 1) {
                        add(p | ((bytes[j] >> 4) & 0xf));
                        p = (bytes[j] << 2) & 0x3c;
                    } else if (idx % 3 === 2) {
                        add(p | ((bytes[j] >> 6) & 0x3));
                        add(bytes[j] & 0x3f);
                    }
                    ++idx;
                }
            }

            if (p >= 0) {
                add(p);
            }

            while ((b64.length % 4) !== 0) {
                b64.push('=');
            }

            return b64.join('');
        }
    };
});
_.crc32 = (function (gen) {
    var crc32 = gen();
    crc32.__mod_generator = gen;
    return crc32;
})(function () {
    return {
        table: [
            0, 1996959894, 3993919788, 2567524794, 124634137, 1886057615, 3915621685, 2657392035,
            249268274, 2044508324, 3772115230, 2547177864, 162941995, 2125561021, 3887607047, 2428444049,
            498536548, 1789927666, 4089016648, 2227061214, 450548861, 1843258603, 4107580753, 2211677639,
            325883990, 1684777152, 4251122042, 2321926636, 335633487, 1661365465, 4195302755, 2366115317,
            997073096, 1281953886, 3579855332, 2724688242, 1006888145, 1258607687, 3524101629, 2768942443,
            901097722, 1119000684, 3686517206, 2898065728, 853044451, 1172266101, 3705015759, 2882616665,
            651767980, 1373503546, 3369554304, 3218104598, 565507253, 1454621731, 3485111705, 3099436303,
            671266974, 1594198024, 3322730930, 2970347812, 795835527, 1483230225, 3244367275, 3060149565,
            1994146192, 31158534, 2563907772, 4023717930, 1907459465, 112637215, 2680153253, 3904427059,
            2013776290, 251722036, 2517215374, 3775830040, 2137656763, 141376813, 2439277719, 3865271297,
            1802195444, 476864866, 2238001368, 4066508878, 1812370925, 453092731, 2181625025, 4111451223,
            1706088902, 314042704, 2344532202, 4240017532, 1658658271, 366619977, 2362670323, 4224994405,
            1303535960, 984961486, 2747007092, 3569037538, 1256170817, 1037604311, 2765210733, 3554079995,
            1131014506, 879679996, 2909243462, 3663771856, 1141124467, 855842277, 2852801631, 3708648649,
            1342533948, 654459306, 3188396048, 3373015174, 1466479909, 544179635, 3110523913, 3462522015,
            1591671054, 702138776, 2966460450, 3352799412, 1504918807, 783551873, 3082640443, 3233442989,
            3988292384, 2596254646, 62317068, 1957810842, 3939845945, 2647816111, 81470997, 1943803523,
            3814918930, 2489596804, 225274430, 2053790376, 3826175755, 2466906013, 167816743, 2097651377,
            4027552580, 2265490386, 503444072, 1762050814, 4150417245, 2154129355, 426522225, 1852507879,
            4275313526, 2312317920, 282753626, 1742555852, 4189708143, 2394877945, 397917763, 1622183637,
            3604390888, 2714866558, 953729732, 1340076626, 3518719985, 2797360999, 1068828381, 1219638859,
            3624741850, 2936675148, 906185462, 1090812512, 3747672003, 2825379669, 829329135, 1181335161,
            3412177804, 3160834842, 628085408, 1382605366, 3423369109, 3138078467, 570562233, 1426400815,
            3317316542, 2998733608, 733239954, 1555261956, 3268935591, 3050360625, 752459403, 1541320221,
            2607071920, 3965973030, 1969922972, 40735498, 2617837225, 3943577151, 1913087877, 83908371,
            2512341634, 3803740692, 2075208622, 213261112, 2463272603, 3855990285, 2094854071, 198958881,
            2262029012, 4057260610, 1759359992, 534414190, 2176718541, 4139329115, 1873836001, 414664567,
            2282248934, 4279200368, 1711684554, 285281116, 2405801727, 4167216745, 1634467795, 376229701,
            2685067896, 3608007406, 1308918612, 956543938, 2808555105, 3495958263, 1231636301, 1047427035,
            2932959818, 3654703836, 1088359270, 936918000, 2847714899, 3736837829, 1202900863, 817233897,
            3183342108, 3401237130, 1404277552, 615818150, 3134207493, 3453421203, 1423857449, 601450431,
            3009837614, 3294710456, 1567103746, 711928724, 3020668471, 3272380065, 1510334235, 755167117
        ],

        calc: function (bytesary) {
            var crc = 0xffffffff;
            for (var i = 0; i < bytesary.length; ++i) {
                var data = bytesary[i];
                for (var j = 0; j < data.length; ++j) {
                    crc = (this.table[((crc ^ data[j]) >>> 0) & 0xff] ^ (crc >>> 8)) >>> 0;
                }
            }
            crc = (crc ^ 0xffffffff) >>> 0;
            return crc;
        }
    };
});
_.conf = {
    __key_prefix: '__pixplus_',
    __is_extension: false,

    __conv: {
        'string': function (value) {
            return g.String(value);
        },
        'number': function (value) {
            return g.parseFloat(value) || 0;
        },
        'boolean': function (value) {
            return g.String(value).toLowerCase() === 'true';
        },

        bookmark_tag_order: {
            parse: function (str) {
                var ary = [], ary_ary = [], lines = str.split(/[\r\n]+/);
                for (var i = 0; i < lines.length; ++i) {
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

            dump: function (bm_tag_order) {
                var str = '';
                if (!bm_tag_order) {
                    return str;
                }
                for (var i = 0; i < bm_tag_order.length; ++i) {
                    var ary = bm_tag_order[i];
                    for (var j = 0; j < ary.length; ++j) {
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
            parse: function (str) {
                var aliases = {};
                var lines = str.split(/[\r\n]+/);
                for (var i = 0; i < Math.floor(lines.length / 2); ++i) {
                    var tag = lines[i * 2], alias = lines[i * 2 + 1];
                    if (tag && alias) {
                        aliases[tag] = alias.replace(/(?:^\s+|\s+$)/g, '').split(/\s+/);
                    }
                }
                return aliases;
            },

            dump: function (bm_tag_aliases) {
                var str = '';
                for (var key in bm_tag_aliases) {
                    str += key + '\n' + bm_tag_aliases[key].join(' ') + '\n';
                }
                return str;
            }
        },

        debug_xhr_block_urls: {
            parse: function (str) {
                return str.split(',');
            },

            dump: function (urls) {
                return urls.join(',');
            }
        }
    },

    __export: function (key_prefix) {
        var that = this;
        var storage = {};
        this.__schema.forEach(function (section) {
            section.items.forEach(function (item) {
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

    __import: function (data) {
        var that = this;
        this.__schema.forEach(function (section) {
            section.items.forEach(function (item) {
                var key = section.name + '_' + item.key;
                var value = data[key];
                if (typeof (value) === 'undefined') {
                    return;
                }

                var conv = that.__conv[key];
                if (conv) {
                    value = conv.parse(value);
                } else if ((conv = that.__conv[typeof (item.value)])) {
                    value = conv(value);
                }

                that[section.name][item.key] = value;
            });
        });
    },

    __key: function (section, item) {
        return this.__key_prefix + section + '_' + item;
    },

    __parse: function (section, item, value) {
        var conv = this.__conv[typeof (this.__defaults[section][item])];
        if (conv) {
            value = conv(value);
        }
        conv = this.__conv[section + '_' + item];
        if (conv) {
            value = conv.parse(value);
        }
        return value;
    },

    __dump: function (section, item, value) {
        var conv = this.__conv[section + '_' + item];
        if (conv) {
            return conv.dump(value);
        } else {
            return g.String(value);
        }
    },

    __wrap_storage: function (storage) {
        var that = this;
        return {
            get: function (section, item) {
                return storage.getItem(that.__key(section, item));
            },

            set: function (section, item, value) {
                storage.setItem(that.__key(section, item), value);
            }
        };
    },

    __init: function (storage) {
        var that = this;
        this.__defaults = {};
        this.__schema.forEach(function (section) {
            that.__defaults[section.name] = {};
            section.items.forEach(function (item) {
                that.__defaults[section.name][item.key] = item.value;
            });
        });

        this.__schema.forEach(function (section) {
            var conf_section = that[section.name] = {};

            section.items.forEach(function (item) {
                var value = storage.get(section.name, item.key);
                value = that.__parse(section.name, item.key, value === null ? item.value : value);

                conf_section.__defineGetter__(item.key, function () {
                    return value;
                });

                conf_section.__defineSetter__(item.key, function (new_value) {
                    value = new_value;
                    storage.set(section.name, item.key, that.__dump(section.name, item.key, value));
                });
            });
        });
    }
};
_.xhr = {
    cache: {},

    remove_cache: function (url) {
        this.cache[url] = null;
    },

    request: async function (method, url, headers, data, cb_success, cb_error) {
        var msg;

        var re = url.match(/^(?:(?:https?:)?\/\/www\.pixiv\.net)?(\/[a-z/_]+\.php)(?:\?|$)/),
            path = re ? re[1] : '';
        if (_.conf.xhr.allow_urls.indexOf(path) < 0) {
            msg = 'URL not allowed - ' + url;
            _.error(msg);
            if (cb_error) {
                cb_error(msg);
            }
            return;
        }

        var that = this;
        var xhr = new w.XMLHttpRequest();

        xhr.onerror = function () {
            msg = 'XHR communication error';
            _.error(msg);
            if (cb_error) {
                cb_error(msg);
            }
        };

        const send = async function () {
            await fetch(url, {
                method: method
            }).then(response => {
                if (response.ok && response.status === 200) {
                    return response.text();
                } else {
                    msg = response.status + ' ' + response.statusText;
                    _.error(msg);
                    if (cb_error) {
                        cb_error(msg);
                    }
                }
            }).catch(err => {
                xhr.onerror();
            });
        };

        if (_.conf.xhr.delay) {
            w.setTimeout(send, _.conf.xhr.delay * 1000);
        } else {
            send().then(json => {
                _.debug(json);
            });

        }
    },

    get: function (url, cb_success, cb_error, is_sync) {
        if (this.cache[url]) {
            cb_success(this.cache[url]);
            return;
        }
        this.request('GET', url, null, null, cb_success, cb_error, is_sync);
    },

    post_data: function (url, data, cb_success, cb_error) {
        this.request(
            'POST',
            url,
            [['Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8']],
            this.serialize(data),
            cb_success, cb_error
        );
    },

    post: function (form, cb_success, cb_error) {
        this.request(
            'POST',
            form.getAttribute('action'),
            [['Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8']],
            this.serialize(form),
            cb_success, cb_error
        );
    },

    serialize: function (form) {
        var data = '', data_map = {};
        if (/^form$/i.test(form.nodeName)) {
            _.qa('input', form).forEach(function (input) {
                switch ((input.type || '').toLowerCase()) {
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
        for (var key in data_map) {
            if (data) {
                data += '&';
            }
            data += g.encodeURIComponent(key) + '=' + g.encodeURIComponent(data_map[key]);
        }
        return data;
    }
};
_.key = {
    keycode_map: {},
    canonical_map: {
        Spacebar: 'Space',
        Esc: 'Escape',
        '+': 'plus',
        ',': 'comma',
        ' ': 'Space',
        '\t': 'Tab'
    },

    parse_event: function (ev) {
        var keys = [], key, chr = ev['char'];

        var k = ev.keyCode, c = ev.charCode;
        if (c >= 0x20 && c < 0x7f) {
            key = g.String.fromCharCode(c).toLowerCase();
        } else {
            key = this.keycode_map[k];
        }

        if (!key) {
            return null;
        }

        keys.push(this.canonical_map[key] || key);

        [
            [ev.ctrlKey, 'Control'],
            [ev.shiftKey, 'Shift'],
            [ev.altKey, 'Alt'],
            [ev.metaKey, 'Meta']
        ].forEach(function (p) {
            if (p[0] && keys.indexOf(p[1]) < 0) {
                keys.unshift(p[1]);
            }
        });

        return keys.join('+');
    },

    listen: function (context, listener, options) {
        var that = this, suspend = null;
        return _.listen(context, ['keydown', 'keypress'], function (ev, connection) {
            var key = that.parse_event(ev);
            if (!key) {
                return false;
            }

            if (suspend === key && ev.type === 'keypress') {
                return true;
            }

            _.debug('keyevent type=' + ev.type + ' key=' + key);
            var res = !!listener(key, ev, connection);
            if (res) {
                _.debug('  canceled');
                if (ev.type === 'keydown') {
                    suspend = key;
                }
            }
            return res;
        }, options);
    },

    init: function () {
        var that = this;

        [

            // http://www.w3.org/TR/DOM-Level-3-Events/#legacy-key-models
            // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent

            [8, 'Backspace'], [9, 'Tab'], [13, 'Enter'], [16, 'Shift'], [17, 'Control'], [18, 'Alt'],
            [27, 'Escape'], [32, 'Space'], [33, 'PageUp'], [34, 'PageDown'], [35, 'End'], [36, 'Home'],
            [37, 'Left'], [38, 'Up'], [39, 'Right'], [40, 'Down'], [45, 'Insert'], [46, 'Delete'],

            // The following punctuation characters MAY change virtual codes
            // between keyboard layouts, but reporting these values will likely
            // be more compatible with legacy content expecting US-English
            // keyboard layout

            // From MDN
            // [188, ','], [190, '.'], [191, '/'], [192, '`'],
            // [219, '['], [220, '\\'], [221, ']'], [222, "'"],

            // Semicolon              ';' 186
            // Colon                  ':' 186
            // Equals sign            '=' 187
            // Plus                   '+' 187
            // Comma                  ',' 188
            // Less than sign         '<' 188
            // Minus                  '-' 189
            // Underscore             '_' 189
            // Period                 '.' 190
            // Greater than sign      '>' 190
            // Forward slash          '/' 191
            // Question mark          '?' 191
            // Backtick               '`' 192
            // Tilde                  '~' 192
            // Opening square bracket '[' 219
            // Opening curly brace    '{' 219
            // Backslash              '\' 220
            // Pipe                   '|' 220
            // Closing square bracket ']' 221
            // Closing curly brace    '}' 221
            // Single quote           ''' 222
            // Double quote           '"' 222

            // ASCII
            [48, '0'], [49, '1'], [50, '2'], [51, '3'], [52, '4'], [53, '5'], [54, '6'], [55, '7'],
            [56, '8'], [57, '9'], [58, ':'], [59, ';'], [60, '<'], [61, '='], [62, '>'], [63, '?'],
            [64, '@'], [65, 'a'], [66, 'b'], [67, 'c'], [68, 'd'], [69, 'e'], [70, 'f'], [71, 'g'],
            [72, 'h'], [73, 'i'], [74, 'j'], [75, 'k'], [76, 'l'], [77, 'm'], [78, 'n'], [79, 'o'],
            [80, 'p'], [81, 'q'], [82, 'r'], [83, 's'], [84, 't'], [85, 'u'], [86, 'v'], [87, 'w'],
            [88, 'x'], [89, 'y'], [90, 'z'],

            // From MDN
            [96, '0'], [97, '1'], [98, '2'], [99, '3'], [100, '4'], [101, '5'], [102, '6'], [103, '7'],
            [104, '8'], [105, '9'], [106, '*'], [107, '+'], [108, ','],
            [109, '-'], [110, '.'], [111, '/'], [112, 'F1'], [113, 'F2'], [114, 'F3'], [115, 'F4'],
            [116, 'F5'], [117, 'F6'], [118, 'F7'], [119, 'F8'], [120, 'F9'], [121, 'F10'], [122, 'F11'],
            [123, 'F12'], [124, 'F13'], [125, 'F14'], [126, 'F15'], [127, 'F16'], [128, 'F17'], [129, 'F18'],
            [130, 'F19'], [131, 'F20'], [132, 'F21'], [133, 'F22'], [134, 'F23'], [135, 'F24'], [160, '^'],
            [161, '!'], [162, '"'], [163, '#'], [164, '$'], [165, '%'], [166, '&'], [167, '_'], [168, '('],
            [169, ')'], [170, '*'], [171, '+'], [172, '|'], [173, '-'], [174, '{'], [175, '}'], [176, '~']

        ].forEach(function (p) {
            var code = p[0], name = p[1];
            that.keycode_map[code] = name;
        });
    }
};
_.ui = {
    expander: function (title, options) {
        var expander = _.e('div', {cls: 'pp-expander'}),
            header = _.e('div', {cls: 'pp-expander-header'}, expander),
            content = _.e('div', {cls: 'pp-expander-content'}, expander);
        header.appendChild(_.svg.triangle(d));
        _.e('span', {text: title, cls: 'pp-expander-title'}, header);
        _.onclick(header, function () {
            expander.classList.toggle('pp-active');

            var open = expander.classList.contains('pp-active');
            if (options.ontoggle) {
                options.ontoggle(open);
            }
            if (open) {
                header.style.minWidth = header.offsetWidth + 'px';
            }
        });
        return [expander, content];
    },

    slider: function (min, max, step, attrs) {
        var slider;

        if (!_.conf.general.debug) {
            slider = _.e('input', _.extend({type: 'range', min: min, max: max, step: step}, attrs));
            if (slider.type === 'range') {
                slider.set_value = function (value) {
                    slider.value = value;
                };
                return slider;
            }
        }

        var rail, knob;
        slider = _.e('div', _.extend({cls: 'pp-slider'}, attrs));
        rail = _.e('div', {cls: 'pp-slider-rail'}, slider);
        knob = _.e('div', {cls: 'pp-slider-knob'}, rail);

        // if (_.conf.general.debug) {
        //   slider.classList.add('pp-debug');
        // }

        // div.__define[GS]etter__ are not works on FirefoxESR...

        slider.set_value = function (value) {
            var pos;
            value = g.Math.max(min, g.Math.min(g.parseFloat(value), max));
            pos = (value - min) / (max - min);
            knob.style.left = (pos * 100) + '%';
            return slider.value = value;
        };

        _.listen(knob, 'mousedown', function (ev) {
            var x, conn1, conn2;

            x = ev.screenX - (knob.offsetLeft + 4);
            slider.classList.add('pp-active');

            conn1 = _.listen(w, 'mousemove', function (ev) {
                var pos = ev.screenX - x;
                pos = g.Math.max(0, g.Math.min(pos, rail.offsetWidth));
                knob.style.left = pos + 'px';
                slider.value = (max - min) * pos / rail.offsetWidth + min;

                ev = d.createEvent('Event');
                ev.initEvent('change', true, true);
                slider.dispatchEvent(ev);
            });

            conn2 = _.listen(w, 'mouseup', function (ev) {
                conn1.disconnect();
                conn2.disconnect();
                slider.classList.remove('pp-active');
            });

            return true;
        });
        return slider;
    },

    tooltip: {
        dom: {},

        set: function (target, text, key) {
            [target].concat(_.qa('svg', target)).forEach(function (target) {
                if (text) {
                    if (key) {
                        text = _.i18n.key_subst(text, key);
                    }
                    target.setAttribute('data-pp-tooltip', text);
                } else {
                    target.removeAttribute('data-pp-tooltip');
                }
            });
        },

        show: function (text, target) {
            var dom = this.dom;
            if (!dom.root) {
                dom.root = _.e('div', {cls: 'pp-tooltip'});
            }
            dom.root.textContent = text;
            d.body.appendChild(dom.root);

            var rect = target.getBoundingClientRect();

            console.log(rect, dom.root.offsetHeight);
            if (rect.top - dom.root.offsetHeight < 10) {
                dom.root.style.top = (rect.bottom + 4) + 'px';
            } else {
                dom.root.style.top = (rect.top - dom.root.offsetHeight - 4) + 'px';
            }

            var maxleft = d.documentElement.clientWidth - dom.root.offsetWidth - 10,
                left = (rect.left + rect.right - dom.root.offsetWidth) / 2;
            dom.root.style.left = (Math.min(Math.max(10, left), maxleft)) + 'px';
        },

        hide: function () {
            var dom = this.dom;
            if (dom.root && dom.root.parentNode) {
                dom.root.parentNode.removeChild(dom.root);
            }
        },

        init: function () {
            var that = this;

            _.listen(d.documentElement, 'mouseover', function (ev) {
                var target = ev.target;
                if (!target.hasAttribute('data-pp-tooltip')) {
                    return;
                }

                var text = target.getAttribute('data-pp-tooltip');
                if (!text) {
                    return;
                }

                that.show(text, target);

                var conn = _.listen(target, 'mouseleave', function (ev) {
                    that.hide();
                    conn.disconnect();
                });
            });
        }
    }
};

_.modal = {
    suspend: false,
    dialog: null,

    centerize: function () {
        var dlg = this.dialog;
        while (dlg) {
            var options = dlg.options,
                container = dlg.container;

            var de = d.documentElement, x, y;

            x = (de.clientWidth - container.offsetWidth) / 2;
            y = (de.clientHeight - container.offsetHeight) / 2;

            if (/^(?:both|horizontal)$/i.test(options.centerize)) {
                container.style.left = g.Math.floor(x) + 'px';
            }
            if (/^(?:both|vertical)$/i.test(options.centerize)) {
                container.style.top = g.Math.floor(y) + 'px';
            }

            if (options.top_left_of) {
                var rect = options.top_left_of.getBoundingClientRect();
                container.style.left = (rect.left - container.offsetWidth) + 'px';
                container.style.top = rect.top + 'px';
            }

            dlg = dlg.parent;
        }
    },

    begin: function (container, options) {
        var that = this;

        if (this.dialog && container === this.dialog.container) {
            return;
        }

        if (!options) {
            options = {};
        }

        while (this.dialog && this.dialog.container !== options.parent) {
            this.close();
        }

        // try {
        //   w.pixiv.ui.modal.close();
        // } catch(ex) {
        //   _.error(ex);
        // }

        _.debug('Begin modal');

        this.dialog = {
            parent: this.dialog,
            container: container,
            options: options
        };

        this.centerize();
        this.set_event_listeners();

        this.suspend = true;
        g.setTimeout(function () {
            that.suspend = false;
        }, 100);
    },

    close: function () {
        if (!this.dialog) {
            return;
        }
        _.debug('End modal');
        if (this.dialog.options && this.dialog.options.onclose) {
            this.dialog.options.onclose(this.dialog.container);
        }
        this.dialog = this.dialog.parent;
        if (!this.dialog) {
            this.unset_event_listeners();
        }
    },

    end: function (target) {
        while (this.dialog) {
            var end = this.dialog.container === target;
            this.close();
            if (end) {
                break;
            }
        }
    },

    set_event_listeners: function () {
        var that = this;
        if (!this.conn_key) {
            this.conn_key = _.key.listen(w, function (key, ev) {
                if (that.dialog.options.onkey) {
                    if (that.dialog.options.onkey(key, ev)) {
                        return true;
                    }
                }

                if (!that.suspend &&
                    _.key_enabled(ev) &&
                    _.conf.key.popup_close.split(',').indexOf(key) >= 0) {
                    that.close();
                    return true;
                }
                return false;
            }, {capture: true});
        }

        if (!this.conn_click) {
            this.conn_click = _.onclick(d, function (ev) {
                if (that.suspend || !d.body.contains(ev.target) || that.dialog.options.dont_close_by_click) {
                    return;
                }

                var members = [that.dialog.container].concat(that.dialog.options.members || []);
                for (var i = 0; i < members.length; ++i) {
                    if (ev.target === members[i] || members[i].contains(ev.target)) {
                        return;
                    }
                }

                that.close();
            });
        }

        if (!this.conn_resize) {
            this.conn_resize = _.listen(w, 'resize', this.centerize.bind(this), {async: true});
        }

        // if (!this.conn_pixiv_modal_open) {
        //   var on_modal_open = function() {
        //     that.end();
        //   };
        //   try {
        //     w.colon.d.on('uimodalopen', on_modal_open);
        //   } catch(ex) {
        //     _.error(ex);
        //   }
        //   this.conn_pixiv_modal_open = {
        //     disconnect: function() {
        //       try {
        //         w.colon.d.off('uimodalopen', on_modal_open);
        //       } catch(ex) {
        //         _.error(ex);
        //       }
        //     }
        //   };
        // }
    },

    unset_event_listeners: function () {
        var that = this;
        ['key', 'click', 'resize', 'pixiv_modal_open'].forEach(function (name) {
            if (that['conn_' + name]) {
                that['conn_' + name].disconnect();
                that['conn_' + name] = null;
            }
        });
    }
};

_.PopupMenu = _.class.create({
    init: function (button, parent) {
        this.dom = {};
        this.dom.root = _.e('div', {cls: 'pp-popup-menu pp-toplevel'});
        this.dom.list = _.e('ol', {cls: 'pp-popup-menu-items'}, this.dom.root);
        this.button = button;
        this.onopen = [];
        this.parent = parent;

        var that = this;
        _.onclick(button, function () {
            that.open(button);
        });
    },

    add: function (name, text, options) {
        if (!options) {
            options = {};
        }

        if (options.key) {
            text = _.i18n.key_subst(text, options.key);
        }

        var that = this;

        var li = _.e('li', {
            cls: 'pp-popup-menu-item',
            'data-name': name,
            'data-type': options.type || 'normal'
        }, this.dom.list);

        if (options.type === 'link') {
            var link = _.e('a', {text: text, href: options.url || ''}, li);
            if (options.get_url) {
                this.onopen.push(function () {
                    link.href = options.get_url();
                });
            }

        } else {
            var label = _.e('label', null, li);

            if (options.type === 'checkbox') {
                var check = _.e('input', {type: 'checkbox'}, label);

                label.appendChild(d.createTextNode(text));
                if (options.checked) {
                    check.checked = true;
                }

                _.listen(check, 'change', function (ev) {
                    if (options.callback) {
                        options.callback(name, check.checked);
                    }
                    that.close();
                });

            } else {
                label.textContent = text;

                _.onclick(li, function (ev) {
                    if (options.callback) {
                        options.callback(name);
                    }
                    that.close();
                });
            }
        }
    },

    add_conf_item: function (section, item, callback) {
        var options = {};
        var value = _.conf[section][item];

        if (typeof (value) === 'boolean') {
            options.type = 'checkbox';
            options.checked = value;
            options.callback = function (name, checked) {
                _.conf[section][item] = checked;
                if (callback) {
                    callback(checked);
                }
            };


        } else {
            return;
        }

        this.add(section + '_' + item, _.lng.conf[section][item], options);
    },

    open: function (button) {
        var that = this, root = this.dom.root;

        if (root.parentNode) {
            return;
        }

        this.onopen.forEach(function (handler) {
            handler.call(that);
        });

        d.body.appendChild(root);

        var options = {
            onclose: function () {
                if (that.button) {
                    root.parentNode.removeChild(root);
                    that.button.classList.remove('pp-active');
                }
            },
            parent: this.parent
        };

        if (button) {
            var rect = button.getBoundingClientRect(), de = d.documentElement;
            var x, y;

            x = g.Math.max(g.Math.min(rect.left, de.clientWidth - root.offsetWidth), 0);
            y = g.Math.max(g.Math.min(rect.bottom, de.clientHeight - root.offsetHeight), 0);

            root.style.left = x + 'px';
            root.style.top = y + 'px';
        } else {
            options.centerize = 'both';
        }

        _.modal.begin(root, options);

        if (this.button) {
            this.button.classList.add('pp-active');
        }
    },

    close: function () {
        if (this.dom.root.parentNode) {
            _.modal.end(this.dom.root);
        }
    }
});

_.Dialog = _.class.create({
    init: function (options) {
        this.options = options;

        if (!options) {
            options = {};
        }

        var dom = this.dom = {};

        dom.root = _.e('div', {cls: 'pp-toplevel pp-dialog ' + (options.cls || '')});

        if (options.title) {
            var title = _.e('div', {cls: 'pp-dialog-title'}, dom.root);
            _.e('span', {cls: 'pp-dialog-title-text', text: options.title}, title);

            var rightbox = _.e('span', {cls: 'pp-dialog-title-rightbox'}, title),
                btn_close = _.svg.cross(d);
            rightbox.appendChild(btn_close);
            _.onclick(btn_close, this.close.bind(this));
        }

        dom.content = _.e('div', {cls: 'pp-dialog-content'}, dom.root);
    },

    default_actions: {
        close: function () {
            this.close();
        },
        cancel: function () {
            this.close();
        }
    },

    add_action: function (name, options) {
        var that = this, dom = this.dom;

        if (!options) {
            options = {};
        }

        if (!options.text && _.lng.dialog[name]) {
            options.text = _.lng.dialog[name];
        }

        if (!dom.actions) {
            dom.actions = _.e('div', {cls: 'pp-dialog-actions'}, dom.root);
        }

        var btn = _.e('button', {text: options.text}), ret = btn;

        if (options.type === 'link') {
            ret = _.e('a', null, dom.actions);
            ret.appendChild(btn);
        } else {
            dom.actions.appendChild(btn);
        }

        ret.className = 'pp-dialog-action pp-dialog-action-' + name;

        if (!options.callback) {
            options.callback = this.default_actions[name];
        }

        if (options.callback) {
            _.listen(btn, 'click', function () {
                options.callback.call(that, name);
            });
        }

        return ret;
    },

    onclose: function () {
        if (this.dom.root.parentNode) {
            this.dom.root.parentNode.removeChild(this.dom.root);
            this.running = false;
        }
    },

    open: function (parent, options) {
        this.running = true;
        d.body.appendChild(this.dom.root);
        _.modal.begin(this.dom.root, _.extend({
            onclose: this.onclose.bind(this),
            parent: parent,
            onkey: this.onkey.bind(this)
        }, options));
    },

    close: function () {
        if (this.running) {
            _.modal.end(this.dom.root);
        }
    },

    onkey_close: function () {
        this.close();
        return true;
    },

    onkey: function (key, ev) {
        if (this.options.keys) {
            for (var i = 0; i < this.options.keys.length; ++i) {
                var item = this.options.keys[i],
                    keys = item[0].split(','),
                    name = item[1];
                if (keys.indexOf(key) >= 0) {
                    return this['onkey_' + name]();
                }
            }
        }

        return false;
    }
});
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
// generated from:
//   src/main/util.js
//   src/main/illust.js
//   src/main/popup.js
//   src/main/api.js
//   src/main/comment.js
//   src/main/bookmark.js
//   src/main/manga.js
//   src/main/question.js
//   src/main/tagedit.js
//   src/main/input.js
//   src/main/key.js
//   src/main/mouse.js
//   src/main/bookmarkform.js
//   src/main/commentform.js
//   src/main/commentform2.js
//   src/main/floater.js
//   src/main/pages.js
//   src/main/entrypoint.js
//   src/main/apng.js
//   src/main/vote.js
_.extend(_, {
    redirect_jump_page: function (root) {
        if (_.conf.general.redirect_jump_page !== 2) {
            return;
        }
        _.qa('a[href*="jump.php"]', root).forEach(function (link) {
            var re;
            if ((re = /^(?:(?:http:\/\/www\.pixiv\.net)?\/)?jump\.php\?(.+)$/.exec(link.href))) {
                link.href = g.decodeURIComponent(re[1]);
            }
        });
    },

    modify_caption: function (caption, base_illust) {
        if (!caption) {
            return;
        }

        var last = null;
        _.qa('a[href*="mode=medium"]', caption).forEach(function (link) {
            var query = _.illust.parse_illust_url(link.href);
            if (query && query.mode === 'medium' && query.illust_id) {
                var illust = _.illust.create_from_id(query.illust_id);
                illust.link = link;
                illust.connection = _.onclick(illust.link, function () {
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

    reorder_tag_list: function (list, cb_get_tagname) {
        var list_parent = list.parentNode, lists = [list];

        var tags = _.qa('li', list), tag_map = {};
        tags.forEach(function (tag) {
            var tagname = cb_get_tagname(tag);
            if (tagname) {
                tag_map[tagname] = tag;
                tag.parentNode.removeChild(tag);
            }
        });

        var all_list, all_list_before;

        var add_list = function () {
            var new_list = list.cloneNode(false);
            list_parent.insertBefore(new_list, list.nextSibling);
            list = new_list;
            lists.push(list);
            return list;
        };

        _.conf.bookmark.tag_order.forEach(function (tag_order, idx) {
            if (idx > 0) {
                add_list();
            }
            tag_order.forEach(function (tag) {
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

        for (var tag in tag_map) {
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

    create: function (link, allow_types, cb_onshow) {
        _.debug("create");
        var illust, images = _.qa('img,*[data-filter*="lazy-image"]', link).concat([link]);

        if (link.children.length == 0) {
            return;
        }

        const params = new URLSearchParams(link.search)

        var illust_id = params.get('illust_id');

        var that = this;
        _.xhr.get("/rpc/index.php?mode=get_illust_detail_by_ids&illust_ids=" + illust_id, function (text) {
            let illust_detail = JSON.parse(text);

            illust = {
                id: illust_id,
                image_url_medium : illust_detail.body[illust_id].url['240mw'],
                image_url_big : illust_detail.body[illust_id].url['big'],
                new_url_pattern: true
            };
        }, function () {
            _.debug('Failed to get_illust_detail_by_ids');
        }, false);

        //var p = this.parse_image_url(src, {allow_types: allow_types});

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

        _.debug(illust.link);
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

    update: function () {
        console.trace();
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
        var detail_by_ids;
        _.xhr.get("/rpc/index.php?mode=get_illust_detail_by_ids&illust_ids=" + illust_ids.join(','), function (text) {
            json = JSON.parse(text);

            detail_by_ids = json.body;
        }, function () {
            _.debug('Failed to get_illust_detail_by_ids');
        }, false);

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

        var error = _.q('.one_column_body .error', doc);
        if (error) {
            illust.error = error.textContent;
            _.error('pixiv reported error: ' + illust.error);
            return false;
        }

        re = /token: *"([0-9a-f]{10,})"/.exec(html);
        if (re) {
            illust.token = re[1];
        } else {
            _.error('Failed to detect pixiv.context.token');
        }

        re = /pixiv\.context\.ugokuIllustData *= *(\{[^;]*?\});/.exec(html);
        re2 = /pixiv\.context\.ugokuIllustFullscreenData *= *(\{[^;]*?\});/.exec(html);

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
            title = work_info ? _.q('.title', work_info) : null,
            caption = work_info ? _.q('.caption', work_info) : null,
            score = work_info ? _.q('.score', work_info) : null,
            question = work_info ? _.q('.questionnaire', work_info) : null,
            tags_tmpl = _.q('#template-work-tags', doc),
            tags = _.q('.work-tags .tags-container', doc),
            prof_img = _.q('#js-mount-point-comment-module[data-profile-image]', doc);

        illust.title = title ? _.strip(title.textContent) : '';
        illust.caption = caption ? caption.innerHTML : '';
        illust.tags = [];
        if (tags) {
            illust.tags = _.qa('.tag .text', tags).map(function (tag) {
                return _.strip(tag.textContent);
            });
        }
        illust.score = {};
        if (score) {
            ['view', 'rated'].forEach(function (name) {
                var node = _.q('.' + name + '-count', score);
                if (node) {
                    illust.score[name] = g.parseInt(_.strip(node.textContent));
                }
            });
        }

        illust.taglist = (tags_tmpl ? tags_tmpl.outerHTML : '') + (tags ? tags.outerHTML : '');

        illust.rated = score ? !!_.q('._nice-button.rated, .js-nice-button.rated', score) : false;

        illust.vote = {available: !!question};
        if (question) {
            illust.vote.answered = !_.q('.list', question);

            illust.vote.items = _.qa('.list input[data-key]', question).map(function (item) {
                return [item.value, item.dataset.key];
            });

            var stats = _.q('.stats table', question);
            if (stats) {
                illust.vote.stats = Array.prototype.map.call(stats.rows, function (row) {
                    return [row.cells[0].textContent, parseInt(_.q('*[class^="answer-"]', row).textContent)];
                });
            }

            var vote_q = _.q('.list h1, .stats h1', question);
            if (vote_q) {
                illust.vote.question = vote_q.textContent;
            }
        }

        if (prof_img) {
            illust.my_prof_img = prof_img.dataset.profileImage;
        }

        var profile_area = _.q('.profile', doc),
            author_icon = profile_area ? _.q('._user-icon', profile_area) : null,
            author_link = profile_area ? _.q('.user-name', profile_area) : null,
            staccfeed_link = _.qa('.column-header .tabs a', doc).filter(function (link) {
                return /^(?:(?:https:\/\/www\.pixiv\.net)?\/)?stacc\//.test(link.getAttribute('href'));
            })[0];

        illust.author_id = null;
        illust.author_name = author_link ? author_link.textContent : null;
        illust.author_favorite = !!(profile_area && _.q('#favorite-button.following', profile_area));
        illust.author_mutual_favorite = !!(profile_area && _.q('.user-relation .sprites-heart', profile_area));
        illust.author_mypixiv = !!(profile_area && _.q('#mypixiv-button.mypixiv', profile_area));
        illust.author_image_url = null;
        illust.author_is_me = null;

        if (author_icon && (re = /background-image:\s*url\(([\'\"]?)(.*)\1\)/.exec(author_icon.style.cssText))) {
            illust.author_image_url = re[2];
        }

        if (author_link && (re = /\/member\.php\?id=(\d+)/.exec(author_link.getAttribute('href')))) {
            illust.author_id = g.parseInt(re[1], 10);
        }

        if (!illust.author_id) {
            if ((re = /pixiv\.context\.userId\s*=\s*([\'\"])(\d+)\1;/.exec(html))) {
                illust.author_id = g.parseInt(re[2]);
            }
        }

        try {
            illust.author_is_me = /pixiv\.context\.self\s*=\s*true/.test(html);
        } catch (ex) {
            _.error(ex);
        }

        illust.url_author_staccfeed = null;
        if (staccfeed_link) {
            illust.url_author_staccfeed =
                staccfeed_link.getAttribute('href').replace(/^https:\/\/www.pixiv.net(?=\/)/, '');
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
            illust.tools = _.qa('.meta .tools li', work_info).map(function (node) {
                return _.strip(node.textContent);
            });
        }

        illust.bookmarked = !!_.q('.bookmark-container .bookmark-count', doc);

        illust.has_image_response = !!_.q('.worksImageresponse .worksResponse', doc);
        illust.image_response_to = null;
        _.qa('.worksImageresponseInfo a', doc).forEach(function (link) {
            if (illust.image_response_to) {
                return;
            }
            // TODO: /novel/show.php?id=******&uarea=response_out
            re = /^\/member_illust\.php\?.*&(?:amp;)?illust_id=(\d+).*&(?:amp;)?uarea=response_out(?:&|$)/.exec(link.getAttribute('href'));
            if (re) {
                illust.image_response_to = g.parseInt(re[1]);
            }
        });

        var comment = _.q('#one_comment .layout-column-1', doc);
        if (comment) {
            _.qa('.worksImageresponse', comment).forEach(function (node) {
                node.parentNode.removeChild(node);
            });
        }
        illust.comment = (comment ? comment.innerHTML : '') || 'Error';


        // if (!_.stamp_series) {
        //     re = /pixiv\.context\.stampSeries *= *(\[[^;]*?\]);/.exec(html);
        //     if (re) {
        //         try {
        //             _.stamp_series = JSON.parse(re[1]);
        //         } catch (ex) {
        //             _.stamp_series = null;
        //             _.error('Failed to parse pixiv.context.stampSeries', ex);
        //         }
        //     } else {
        //         _.error('pixiv.context.stampSeries not detected');
        //     }
        // }
        //
        //
        // if (!_.emoji_series) {
        //     re = /pixiv\.context\.emojiSeries *= *(\[[^;]*?\]);/.exec(html);
        //     if (re) {
        //         try {
        //             _.emoji_series = JSON.parse(re[1]);
        //             _.emoji_series.forEach(function (item) {
        //                 item.url = '//source.pixiv.net/common/images/emoji/' + item.id + '.png';
        //             });
        //         } catch (ex) {
        //             _.emoji_series = null;
        //             _.error('Failed to parse pixiv.context.emojiSeries', ex);
        //         }
        //     } else {
        //         _.error('pixiv.context.emojiSeries not detected');
        //     }
        // }


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

        var containers = _.qa('.manga .item-container', doc);
        for (var i = 0; i < containers.length; ++i) {

            var pages = [];
            var images = _.qa('img', containers[i]);

            for (var j = 0; j < images.length; ++j) {
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
        var re;
        if (!(re = /^(?:(?:https:\/\/www\.pixiv\.net)?\/)?member_illust\.php(\?.*)?$/.exec(url))) {
            return null;
        }
        var query = _.parse_query(re[1]);
        if (query.illust_id) {
            query.illust_id = g.parseInt(query.illust_id, 10);
        }
        return query;
    }
};
_.popup = {
    dom: {},
    images: [],
    saved_context: null,

    RM_AUTO: -1,
    RM_FIT_LONG: 0,
    RM_FIT_SHORT: 1,
    RM_ORIGINAL: 2,

    scrollbar_width: 0,
    scrollbar_height: 0,

    resize_mode: -1,
    resize_mode_next: -1,

    create: function () {
        var that = this;
        var dom = this.dom;
        if (dom.created) {
            return;
        }

        dom.root = _.e('div', {id: 'pp-popup'});
        dom.title = _.e('div', {id: 'pp-popup-title'}, dom.root);
        dom.title_link = _.e('a', null, dom.title);
        dom.rightbox = _.e('div', {id: 'pp-popup-rightbox'}, dom.title);
        dom.status = _.e('span', {id: 'pp-popup-status'}, dom.rightbox);
        dom.status_text = _.e('span', {id: 'pp-popup-status-text'}, dom.status);
        dom.ugoira_status = _.e('span', {id: 'pp-popup-ugoira-status'}, dom.rightbox);
        dom.button_manga = _.e('a', {id: 'pp-popup-button-manga', cls: 'pp-hide'}, dom.rightbox);
        dom.resize_mode = _.e('span',
            {
                id: 'pp-popup-button-resize-mode',
                svg: ['rm_fit_short', 'rm_fit_long', 'rm_original'],
                key: _.conf.key.popup_switch_resize_mode,
                tooltip: 'resize_mode'
            },
            dom.rightbox);
        dom.button_response = _.e('a',
            {
                id: 'pp-popup-button-response',
                svg: 'response',
                key: _.conf.key.popup_open_response,
                tooltip: 'image_response'
            },
            dom.rightbox);
        dom.button_comment = _.e('span',
            {
                id: 'pp-popup-button-comment',
                svg: 'comments',
                key: _.conf.key.popup_comment_toggle,
                tooltip: 'comments'
            },
            dom.rightbox);
        dom.button_vote = _.e('span',
            {
                id: 'pp-popup-button-vote',
                svg: ['vote_off', 'vote_on']
            },
            dom.rightbox);
        dom.button_like = _.e('span',
            {
                id: 'pp-popup-button-like',
                svg: ['like_off', 'like_on']
            },
            dom.rightbox);
        dom.button_bookmark = _.e('a',
            {
                id: 'pp-popup-button-bookmark',
                svg: ['star_white', 'star_black']
            },
            dom.rightbox);
        dom.header_wrapper = _.e('div', {id: 'pp-popup-header-wrapper'}, dom.root);
        dom.header = _.e('div', {id: 'pp-popup-header'}, dom.header_wrapper);
        dom.caption_wrapper = _.e('div', {id: 'pp-popup-caption-wrapper'}, dom.header);
        dom.caption = _.e('div', {id: 'pp-popup-caption'}, dom.caption_wrapper);
        dom.comment_wrapper = _.e('div', {id: 'pp-popup-comment-wrapper'}, dom.caption_wrapper);
        dom.comment_toolbar = _.e('div', {id: 'pp-popup-comment-toolbar'}, dom.comment_wrapper);
        dom.comment_form_btn = _.e('button',
            {
                id: 'pp-popup-comment-form-btn',
                cls: 'pp-popup-comment-btn',
                svg: ['pencil', 'pencil_off']
            },
            dom.comment_toolbar);
        dom.comment_conf_btn = _.e('button',
            {
                id: 'pp-popup-comment-config-btn',
                cls: 'pp-popup-comment-btn',
                svg: 'cogwheel'
            },
            dom.comment_toolbar);
        dom.comment = _.e('div', {id: 'pp-popup-comment'}, dom.comment_wrapper);
        dom.taglist = _.e('div', {id: 'pp-popup-taglist'}, dom.header);
        dom.info = _.e('div', {id: 'pp-popup-info', cls: 'pp-popup-separator'}, dom.header);
        dom.author_image = _.e('img', {id: 'pp-popup-author-image'}, dom.info);
        dom.author_status = _.e('div',
            {
                id: 'pp-popup-author-status',
                svg: ['following', 'heart', 'mypixiv']
            },
            dom.info);
        dom.datetime = _.e('div', {id: 'pp-popup-date'}, dom.info);
        dom.size_tools = _.e('div', {id: 'pp-popup-size-tools'}, dom.info);
        dom.size = _.e('span', {id: 'pp-popup-size'}, dom.info);
        dom.tools = _.e('span', {id: 'pp-popup-tools'}, dom.info);
        dom.author_links = _.e('div', {id: 'pp-popup-author-links'}, dom.info);
        dom.author_profile = _.e('a', {id: 'pp-popup-author-profile'}, dom.author_links);
        dom.author_works = _.e('a', {id: 'pp-popup-author-works'}, dom.author_links);
        dom.author_bookmarks = _.e('a', {id: 'pp-popup-author-bookmarks'}, dom.author_links);
        dom.author_staccfeed = _.e('a', {id: 'pp-popup-author-staccfeed'}, dom.author_links);
        dom.info_clearfix = _.e('div', {css: 'clear:both'}, dom.info);
        dom.image_wrapper = _.e('div', {id: 'pp-popup-image-wrapper', cls: 'pp-popup-content'}, dom.root);
        dom.image_scroller = _.e('div', {id: 'pp-popup-image-scroller', svg: 'multipage'}, dom.image_wrapper);
        dom.image_layout = _.e('a', {id: 'pp-popup-image-layout'}, dom.image_scroller);
        dom.olc_prev = _.e('div',
            {id: 'pp-popup-olc-prev', cls: 'pp-popup-olc', svg: 'olc_arrow'},
            dom.image_scroller);
        dom.olc_next = _.e('div',
            {id: 'pp-popup-olc-next', cls: 'pp-popup-olc', svg: 'olc_arrow'},
            dom.image_scroller);
        dom.bookmark_wrapper = _.e('div', {id: 'pp-popup-bookmark-wrapper', cls: 'pp-popup-content'}, dom.root);
        dom.tagedit_wrapper = _.e('div', {id: 'pp-popup-tagedit-wrapper', cls: 'pp-popup-content'}, dom.root);

        dom.ugoira_status.appendChild(dom.ugoira_progress_svg = _.svg.ugoira(d));
        dom.button_manga.appendChild(dom.manga_progress_svg = _.svg.manga(d));


        this.comment_conf_menu = new _.PopupMenu(dom.comment_conf_btn, this.dom.root);
        this.comment_conf_menu.add_conf_item('popup', 'show_comment_form', function (checked) {
            if (checked) {
                that.comment.show_form();
            }
        });
        this.comment_conf_menu.add_conf_item('popup', 'hide_stamp_comments', function (checked) {
            that.comment.update_hide_stamp_comments();
        });


        this.ugoira_menu = new _.PopupMenu(dom.ugoira_progress_svg, this.dom.root);

        this.ugoira_menu.add(
            'play-pause', _.lng.ugoira_play_pause,
            {
                callback: this.ugoira_play_pause.bind(this),
                key: _.conf.key.popup_ugoira_play_pause
            }
        );
        this.ugoira_menu.add(
            'next-frame', _.lng.ugoira_next_frame,
            {
                callback: this.ugoira_next_frame.bind(this),
                key: _.conf.key.popup_ugoira_next_frame
            }
        );
        this.ugoira_menu.add(
            'prev-frame', _.lng.ugoira_prev_frame,
            {
                callback: this.ugoira_prev_frame.bind(this),
                key: _.conf.key.popup_ugoira_prev_frame
            }
        );

        this.ugoira_menu.add(
            'gen-apng', _.lng.ugoira_generate_apng,
            {callback: this.ugoira_generate_apng.bind(this)}
        );

        this.ugoira_menu.add('dl-zip', _.lng.ugoira_download_zip, {
            type: 'link',
            get_url: function () {
                return (that.illust.ugoira_big || that.illust.ugoira_small).src;
            }
        });

        this.ugoira_menu.add('gen-tc', _.lng.ugoira_generate_timecode, {
            callback: function () {
                // http://www.bunkus.org/videotools/mkvtoolnix/doc/mkvmerge.html#mkvmerge.external_timecode_files
                var data = '# timecode format v2\r\n' + that.illust.ugoira.progress.join('\r\n') + '\r\n';
                w.open('data:text/plain,' + w.encodeURIComponent(data));
            }
        });

        this.ugoira_menu.add('help', _.lng.ugoira_how_to_use, {
            callback: function () {
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


        // _.observe_domnodeinserted(dom.comment, this.comment.update.bind(this.comment));

        this.input.init();

        _.listen(w, 'resize', function () {
            if (that.running) {
                that.adjust();
            }
        }, {async: true});

        dom.created = true;
    },

    update_scrollbar_size: function () {
        var that = this;
        g.setTimeout(function () {
            var scroller = that.dom.image_scroller,
                sw = scroller.offsetWidth - scroller.clientWidth,
                sh = scroller.offsetHeight - scroller.clientHeight,
                change = false;

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

    layout_images: function (max_width, max_height) {
        var that = this;

        var dom = this.dom;

        if (!this.images || this.images.length <= 0) {
            dom.image_layout.style.width = 'auto';
            dom.image_layout.style.height = 'auto';
            return;
        }

        var total_height = g.Math.max.apply(
            g.Math, this.images.map(function (img) {
                return img.naturalHeight;
            })
        );

        var natural_sizes = this.images.map(function (img) {
            return {
                width: g.Math.floor(img.naturalWidth * total_height / img.naturalHeight),
                height: total_height
            };
        });

        var total_width;
        var calc_total_width = function () {
            total_width = natural_sizes.reduce(function (w, size) {
                return w + size.width;
            }, 0);
        };
        calc_total_width();


        // initialize

        var image_scroller = dom.image_scroller;
        image_scroller.style.cssText = '';


        // enlarge

        this.resize_mode_next = this.RM_FIT_LONG;

        if (_.conf.popup.minimum_size !== 0 &&
            !(this.illust.manga.available && !this.manga.active)) {
            var cv = _.conf.popup.minimum_size, th_w, th_h;

            if (cv < 0) {
                if (max_width > 3000) {
                    cv = -cv;
                } else {
                    cv = 0;
                }
            }

            if (cv <= 1) {
                th_w = Math.floor(max_width * cv);
                th_h = Math.floor(max_height * cv);
            } else {
                th_w = th_h = cv;
            }

            if (total_width < th_w || total_height < th_h) {
                if (this.resize_mode === this.RM_AUTO) {
                    var r = Math.max(th_w / total_width, th_h / total_height);
                    _.debug('Resize to minimum size: ratio=' + r);
                    natural_sizes.map(function (item) {
                        item.width = Math.floor(item.width * r);
                        item.height = Math.floor(item.height * r);
                    });
                    total_height = Math.floor(total_height * r);
                    calc_total_width();
                    // update_resize_mode = false;
                } else {
                    this.resize_mode_next = this.RM_AUTO;
                }
            }
        }


        // minify

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

        dom.resize_mode.setAttribute('data-pp-resize-mode', 'LSO'[resize_mode]);
        if (update_scale) {
            dom.resize_mode.classList.remove('pp-hide');
        } else {
            dom.resize_mode.classList.add('pp-hide');
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

                image_scroller.style.maxWidth = max_width + 'px';
                image_scroller.style.maxHeight = max_height + 'px';

                if (scroll_x) {
                    if (total_height + this.scrollbar_height > max_height) {
                        image_scroller.style.height = max_height + 'px';
                    } else {
                        image_scroller.style.width = '100%';
                    }
                    image_scroller.style.maxWidth = max_width + 'px';
                    image_scroller.style.overflowX = 'auto';
                    image_scroller.style['overflow-x'] = 'auto';
                }

                if (scroll_y) {
                    if (total_width + this.scrollbar_width > max_width) {
                        image_scroller.style.width = max_width + 'px';
                    } else {
                        image_scroller.style.width = '100%';
                    }
                    image_scroller.style.maxHeight = max_height + 'px';
                    image_scroller.style.overflowY = 'auto';
                    image_scroller.style['overflow-y'] = 'auto';
                }
            }
        }

        image_scroller.style.minWidth = Math.min(600, max_width) + 'px';
        image_scroller.style.minHeight = Math.min(600, max_height) + 'px';


        // apply scale

        var layout_height = 0, layout_width = 0, image_height = [];
        this.images.forEach(function (img, idx) {
            var nsize = natural_sizes[idx],
                width = g.Math.round(nsize.width * scale),
                height = g.Math.round(nsize.height * scale);
            img.style.width = width + 'px';
            img.style.height = height + 'px';
            if (height > layout_height) {
                layout_height = height;
            }
            layout_width += img.parentNode ? img.offsetWidth : g.Math.round(nsize.width * scale);
            image_height.push(height);
        });

        this.images.forEach(function (img, idx) {
            var mtop = g.Math.floor((layout_height - image_height[idx]) / 2);
            img.style.margin = mtop + 'px 0px 0px 0px';
        });

        dom.image_layout.style.width = layout_width + 'px';
        dom.image_layout.style.height = layout_height + 'px';

        this.scale = scale;
    },

    calculate_max_content_size: function (content) {
        var c, dom = this.dom, root = dom.root, de = d.documentElement;
        if (this.bookmark.active) {
            c = dom.bookmark_wrapper;
        } else if (this.tagedit.active) {
            c = dom.tagedit_wrapper;
        } else {
            c = dom.image_wrapper;
        }
        return [
            de.clientWidth - (root.offsetWidth - c.clientWidth),
            de.clientHeight - (root.offsetHeight - c.clientHeight)
        ];
    },

    adjust_olc_icon: function (icon, olc_width, olc_height, next) {
        var bsize = g.Math.min(olc_width, olc_height),
            size = g.Math.min(g.Math.floor(bsize * 0.8), 200),
            left = g.Math.min(g.Math.floor((olc_width - size) / 2), 50),
            top;

        top = g.Math.floor((olc_height - size) / 2);

        if (next) {
            left = olc_width - size - left;
        }

        icon.style.width = size + 'px';
        icon.style.height = size + 'px';
        icon.style.margin = g.Math.floor((bsize - size) / 2) + 'px';
        icon.style.marginLeft = left + 'px';
        icon.style.marginTop = top + 'px';
    },

    adjust: function () {
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
            var mh = dom.image_scroller.clientWidth - dom.image_layout.offsetWidth,
                mv = dom.image_scroller.clientHeight - dom.image_layout.offsetHeight;
            dom.image_layout.style.marginLeft = g.Math.max(g.Math.floor(mh / 2), 0) + 'px';
            dom.image_layout.style.marginTop = g.Math.max(g.Math.floor(mv / 2), 0) + 'px';

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

                // avoid overlap on scrollbar

                var height = dom.image_scroller.clientHeight;

                dom.olc_prev.style.height = height + 'px';
                dom.olc_next.style.height = height + 'px';

                dom.olc_next.style.right = this.scrollbar_width + 'px';

                this.adjust_olc_icon(_.q('svg', dom.olc_prev), width, height);
                this.adjust_olc_icon(_.q('svg', dom.olc_next), width, height, true);

                dom.olc_prev.classList.add('pp-active');
                dom.olc_next.classList.add('pp-active');
            }
        }

        this.update_info();
        _.modal.centerize();
    },

    update_info: function () {
        var that = this;

        var size_list, illust = this.illust;
        if (illust.size && !illust.manga.available && !this.manga.active) {
            size_list = [illust.size];
        } else {
            size_list = this.images.map(function (img) {
                return {width: img.naturalWidth, height: img.naturalHeight};
            });
        }

        var size_text = size_list.map(function (size, idx) {
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

    update_ugoira_progress: function (frame_number) {
        if (!this.running || !this.illust.ugoira) {
            return;
        }

        var svg = this.dom.ugoira_progress_svg,
            data = this.illust.ugoira,
            progress = data.progress[frame_number] / data.duration;


        var path = ['12,12', '12,-4', '28,-4'];
        if (progress >= 0.25) {
            path.push('28,28');
        }
        if (progress >= 0.5) {
            path.push('-4,28');
        }
        if (progress >= 0.75) {
            path.push('-4, -4');
        }

        var x, y, rad;
        rad = g.Math.PI * 2 * (progress - 0.25);
        x = g.Math.cos(rad) * 12 + 12;
        y = g.Math.sin(rad) * 12 + 12;
        path.push(x + ',' + y);

        var clip_path = _.q('.pp-indicator-progress path', svg);
        clip_path.setAttribute('d', 'M ' + path.join(' ') + ' z');
    },

    clear: function () {
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

    clear_submod: function () {
        this.bookmark.clear();
        this.manga.clear();
        this.question.clear();
        this.comment.clear();
        this.tagedit.clear();
    },

    set_images: function (images) {
        var dom = this.dom;
        this.images = images;
        // this.adjust();
        if (dom.image_layout.childElementCount === images.length) {
            this.images.forEach(function (img, idx) {
                dom.image_layout.replaceChild(img, dom.image_layout.children[idx]);
            });
        } else {
            _.clear(dom.image_layout);
            this.images.forEach(function (img) {
                dom.image_layout.appendChild(img);
            });
        }
        this.dom.image_scroller.scrollTop = 0;
        this.adjust();
    },

    onload: function (illust) {
        if (illust !== this.illust || this.bookmark.active || this.tagedit.active) {
            return;
        }

        if (this.illust_real && this.manga.active && this.illust_real === illust) {
            return;
        }

        this.illust_real = illust;

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
        dom.root.classList[illust.vote.available ? 'add' : 'remove']('pp-vote');

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

        dom.button_vote.classList[illust.vote.answered ? 'add' : 'remove']('pp-active');
        _.ui.tooltip.set(dom.button_vote,
            _.lng.tooltip[illust.vote.answered ? 'vote_on' : 'vote_off'],
            _.conf.key.popup_qrate_start);

        dom.button_like.classList[illust.rated ? 'add' : 'remove']('pp-active');
        _.ui.tooltip.set(dom.button_like,
            _.lng.tooltip[illust.rated ? 'like_on' : 'like_off'],
            _.conf.key.popup_rate10);

        dom.button_bookmark.href = illust.url_bookmark;
        dom.button_bookmark.classList[illust.bookmarked ? 'add' : 'remove']('pp-active');
        _.ui.tooltip.set(dom.button_bookmark,
            _.lng.tooltip[illust.bookmarked ? 'bookmark_on' : 'bookmark_off'],
            _.conf.key.popup_bookmark_start);

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
            _.e('span',
                {
                    id: 'pp-popup-tagedit-button',
                    svg: 'pencil',
                    tooltip: 'tagedit'
                },
                dom.taglist),
            function () {
                that.tagedit.start();
                return true;
            }
        );

        ['pixpedia', 'pixiv_comic', 'booth'].forEach(function (name) {
            var f = _.conf.popup['remove_' + name];
            dom.taglist.classList[f ? 'add' : 'remove']('pp-no-' + name.replace('_', '-'));
        });

        if (_.conf.popup.author_status_icon) {
            [
                ['favorite', 'pp-fav'],
                ['mutual_favorite', 'pp-fav-m'],
                ['mypixiv', 'pp-mypix']
            ].forEach(function (p) {
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

        dom.datetime.textContent = illust.datetime +
            ' ' + ['view', 'rated'].map(function (n) {
                return _.lng['score_' + n] + ':' + illust.score[n];
            }).join(' ');

        _.clear(dom.tools);
        illust.tools.forEach(function (tool) {
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

        if (illust.question) {
            this.question.setup();
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

    onerror: function (illust) {
        if (illust !== this.illust || this.bookmark.active || this.tagedit.active) {
            return;
        }

        this.status_error(illust.error || 'Unknown error');
        this.adjust();
    },

    set_status_text: function (text) {
        this.dom.status_text.textContent = text || '';
    },

    set_status_message: function (text) {
        _.ui.tooltip.set(this.dom.status_text, text);
    },

    status_loading: function () {
        this.dom.root.classList.add('pp-loading');
        this.dom.root.classList.remove('pp-error');
        this.set_status_text('Loading');
        this.set_status_message();
    },

    status_complete: function () {
        this.dom.root.classList.remove('pp-loading');
        this.dom.root.classList.remove('pp-error');
        this.set_status_text();
        this.set_status_message();
    },

    status_error: function (message) {
        this.dom.root.classList.remove('pp-loading');
        this.dom.root.classList.add('pp-error');
        this.set_status_text('Error');
        this.set_status_message(message);
        if (message) {
            _.error.apply(_, arguments);
        }
    },

    onclose: function () {
        if (!this.running) {
            return;
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

    show: function (illust) {
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
                    centerize: 'both',
                    dont_close_by_click: true
                }
            );
        }

        this.resize_mode = this.RM_AUTO;
        var st = illust.load_statuses;
        if (st && st.html === 'complete' && (st.big === 'complete' || st.medium === 'complete')) {
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

    hide: function () {
        _.modal.end(this.dom.root);
    },

    reload: function () {
        _.illust.unload(this.illust);
        this.show(this.illust);
    },

    show_caption: function () {
        this.dom.header.classList.add('pp-show');
        this.dom.header.classList.remove('pp-hide');
    },

    hide_caption: function () {
        this.question.blur();

        var h = this.dom.header;
        h.classList.remove('pp-show');
        if (this.is_caption_visible()) {
            h.classList.add('pp-hide');
        }
    },

    is_caption_visible: function () {
        var h = this.dom.header;
        return (!h.classList.contains('pp-hide') &&
            (h.classList.contains('pp-show') ||
                (h.matches && h.matches(':hover')) ||
                (h.oMatchesSelector && h.oMatchesSelector(':hover')) ||
                (h.mozMatchesSelector && h.mozMatchesSelector(':hover')) ||
                (h.webkitMatchesSelector && h.webkitMatchesSelector(':hover'))));
    },

    toggle_caption: function () {
        if (this.is_caption_visible()) {
            this.hide_caption();
        } else {
            this.show_caption();
        }
    },

    can_scroll: function () {
        return this.can_scroll_vertically() || this.can_scroll_horizontally();
    },

    can_scroll_vertically: function () {
        return this.dom.image_scroller.scrollHeight > this.dom.image_scroller.clientHeight;
    },

    can_scroll_horizontally: function () {
        return this.dom.image_scroller.scrollWidth > this.dom.image_scroller.clientWidth;
    },

    ugoira_current_frame: function () {
        return this.illust.ugoira_player.getCurrentFrame();
    },

    ugoira_frame_count: function () {
        return this.illust.ugoira_player.getFrameCount();
    },

    ugoira_play: function () {
        if (!this.illust.ugoira_player) {
            return false;
        }

        this.illust.ugoira_player.play();
        this.dom.root.classList.add('pp-ugoira-playing');
        this.dom.root.classList.remove('pp-ugoira-paused');

        return true;
    },

    ugoira_replay: function () {
        if (!this.illust.ugoira_player) {
            return false;
        }
        this.illust.ugoira_player.rewind();
        return this.ugoira_play();
    },

    ugoira_pause: function () {
        if (!this.illust.ugoira_player) {
            return false;
        }

        this.illust.ugoira_player.pause();
        this.dom.root.classList.remove('pp-ugoira-playing');
        this.dom.root.classList.add('pp-ugoira-paused');

        return true;
    },

    ugoira_play_pause: function () {
        if (!this.illust.ugoira_player) {
            return false;
        }
        if (this.illust.ugoira_player._paused) {
            return this.ugoira_play();
        } else {
            return this.ugoira_pause();
        }
    },

    ugoira_prev_frame: function () {
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

    ugoira_next_frame: function () {
        if (!this.ugoira_pause()) {
            return false;
        }
        this.illust.ugoira_player._nextFrame();
        return true;
    },

    ugoira_generate_apng: function () {
        if (!this.illust || !this.illust.ugoira_player) {
            return;
        }

        var that = this;
        var dialog = new _.apng.Dialog(
            that.illust,
            function () {
                var player = that.illust.ugoira_player;
                if (!player._frameImages || player._frameImages.length !== that.illust.ugoira.frames.length) {
                    return null;
                }

                return that.illust.ugoira.frames.map(function (frm, idx) {
                    return {
                        delay: frm.delay,
                        image: player._frameImages[idx]
                    };
                });
            }
        );

        dialog.open(this.dom.root, {centerize: 'both'});
    },

    send_like: function () {
        var that = this;
        this.status_loading();
        _.popup.api.post(
            '/rpc_rating.php',
            {
                mode: 'save',
                i_id: this.illust.id,
                u_id: _.api.uid,
                qr: 0,
                score: '10',
                tt: _.api.token
            },
            function (data) {
                that.reload();
            },
            function (message) {
                that.status_error(message);
            }
        );
        this.reload();
    },

    open_vote_dialog: function () {
        _.vote.run(this.illust, this.dom.root);
    }
};
_.api = {
    request: function (method, url, illust, data, onsuccess, onerror) {
        for (var key in data) {
            if (typeof (data[key]) === 'function') {
                var err = false;
                data[key] = data[key](illust, function () {
                    if (onerror) {
                        onerror.apply(w, arguments);
                    }
                    err = true;
                });
                if (err) {
                    return;
                }
            }
        }

        var onsuc = function (res) {
            var data;
            try {
                data = JSON.parse(res);
            } catch (ex) {
                if (onerror) {
                    onerror('JSON parse error', ex);
                }
                return;
            }
            onsuccess(data);
        };

        var onerr = function (message) {
            if (onerror) {
                onerror('XHR error: ' + message);
            }
        };

        if (method === 'post') {
            _.xhr.post_data(url, data, onsuc, onerr);
        } else if (method === 'get') {
            _.xhr.request('GET', url + '?' + _.xhr.serialize(data), null, null, onsuc, onerr);
        } else {
            if (onerror) {
                onerror('Invalid method - ' + method);
            }
        }
    },

    post: function (url, illust, data, onsuccess, onerror) {
        this.request('post', url, illust, data, onsuccess, onerror);
    },

    get: function (url, illust, data, onsuccess, onerror) {
        this.request('get', url, illust, data, onsuccess, onerror);
    },

    token: function (illust, error) {
        if (illust && illust.token) {
            return illust.token;
        } else {
            error('Failed to detect security token needed to call APIs');
        }
        return null;
    },

    uid: function (illust, error) {
        try {
            return w.pixiv.user.id;
        } catch (ex) {
            error('Failed to get user id', ex);
        }
        return null;
    }
};

_.popup.api = {
    post: function (url, data, onsuccess, onerror) {
        _.api.post(url, _.popup.illust, data, onsuccess, function () {
            _.popup.status_error.apply(_.popup, arguments);
            onerror.call(w, arguments);
        });
    },
    get: function (url, data, onsuccess, onerror) {
        _.api.get(url, _.popup.illust, data, onsuccess, function () {
            _.popup.status_error.apply(_.popup, arguments);
            onerror.call(w, arguments);
        });
    }
};
_.popup.comment = {
    active: false,
    loaded: false,
    offset: 0,

    clear: function () {
        var show_form = _.conf.popup.show_comment_form;
        _.popup.dom.root.classList.remove('pp-comment-mode');
        _.popup.dom.root.classList[show_form ? 'add' : 'remove']('pp-show-comment-form');
        this.update_hide_stamp_comments();
        this.active = false;
        this.loaded = false;
        this.offset = 0;
    },

    update_hide_stamp_comments: function () {
        var hide = _.conf.popup.hide_stamp_comments;
        _.popup.dom.root.classList[hide ? 'add' : 'remove']('pp-hide-stamp-comments');
        _.popup.adjust();
    },

    set_comment_text: function (node, text) {
        if (_.emoji_series) {
            if (!_.emoji_map) {
                _.emoji_map = {};
                _.emoji_series.forEach(function (item) {
                    _.emoji_map[item.name] = item;
                });
            }
            if (!_.emoji_re) {
                var pat = _.emoji_series.map(function (item) {
                    return _.escape_regex(item.name);
                }).join('|');
                _.emoji_re = new RegExp('\\((' + pat + ')\\)', 'g');
            }
        }

        text.split(_.emoji_re).forEach(function (fragment, idx) {
            if (idx % 2) {
                _.e('img', {src: _.emoji_map[fragment].url, cls: 'pp-popup-comment-emoji'}, node);
            } else {
                node.appendChild(document.createTextNode(fragment));
            }
        });
    },

    scroll: function () {
        _.popup.dom.caption_wrapper.scrollTop = _.popup.dom.caption.offsetHeight;
    },

    show_form: function () {
        if (_.popup.dom.root.classList.add('pp-show-comment-form')) {
            var that = this;
            w.setTimeout(function () {
                that.form.comment_textarea.focus();
            }, 0);
        }
    },

    hide_form: function () {
        _.popup.dom.root.classList.remove('pp-show-comment-form');
    },

    toggle_form: function () {
        _.popup.dom.root.classList.toggle('pp-show-comment-form');
    },

    delete_comment: function (id, elem) {
        if (!confirm(_.lng.delete_comment_confirm)) {
            return;
        }

        _.popup.status_loading();
        _.popup.api.post(
            '/rpc_delete_comment.php',
            {
                i_id: _.popup.illust.id,
                del_id: id,
                tt: _.api.token
            },
            function (data) {
                if (data.error) {
                    _.popup.status_error(data.message);
                } else {
                    elem.parentNode.removeChild(elem);
                    _.popup.status_complete();
                }
            }
        );
    },

    load: function (illust) {
        if (this.loaded) {
            return;
        }

        _.clear(_.popup.dom.comment);

        this.form_cont = _.e('div', {id: 'pp-popup-comment-form-cont'}, _.popup.dom.comment);
        this.form = new _.CommentForm(this.form_cont, _.popup.illust);
        this.form.onstatuschange = function (status, message) {
            _.popup['status_' + status](message);
        };

        var that = this;
        this.form.onsent = function (item) {
            that.add_comments([item], that.body, true);
        };


        var body = this.body = _.e('div', {id: 'pp-popup-comment-comments'}, _.popup.dom.comment);
        _.popup.status_loading();

        _.popup.api.get(
            '/ajax/illusts/comments/roots',
            {
                illust_id: _.popup.illust.id,
                offset: this.offset,
                limit: 20,
                tt: _.api.token
            },
            function (data) {
                if (data.error) {
                    _.popup.status_error(data.message);
                } else {
                    this.offset += data.body.comments.length;
                    that.add_comments(data.body.comments, body);
                    _.popup.status_complete();
                    that.loaded = true;
                }
            }
        );
    },

    load_replies: function (id, parent, btn) {
        var that = this;
        _.popup.status_loading();
        _.popup.api.get(
            '/ajax/illusts/comments/replies',
            {
                comment_id: id,
                page: 1,
                tt: _.api.token
            },
            function (data) {
                if (data.error) {
                    _.popup.status_error(data.message);
                } else {
                    that.add_comments(data.body.comments, parent);
                    _.popup.status_complete();
                    btn.style.display = 'none';
                }
            }
        );
    },

    add_comments: function (comments, parent, ontop) {
        var that = this;
        var ul = _.q('ul', parent) || _.e('ul', null, parent),
            before = ontop ? ul.firstChild : null;
        comments.forEach(function (item) {
            var li = _.e('li', {cls: 'pp-popup-comment-item'}),
                imgw = _.e('div', {cls: 'pp-popup-comment-user-image-wrapper'}, li),
                img = _.e('a', {cls: 'pp-popup-comment-user-image ui-profile-popup'}, imgw),
                body = _.e('div', {cls: 'pp-popup-comment-body'}, li),
                name = _.e('a', {cls: 'pp-popup-comment-user-name'}, body),
                info = _.e('div', {cls: 'pp-popup-comment-info'}, body);

            img.href = 'https://www.pixiv.net/member.php?id=' + item.userId;
            img.style.backgroundImage = 'url(' + item.img + ')';
            img.setAttribute('data-user-id', item.userId);
            img.setAttribute('data-user-name', item.img);
            img.setAttribute('data-src', item.userName);
            name.textContent = item.userName;
            name.href = img.href;

            if (!item.stampId) {
                var text = _.e('div', {cls: 'pp-popup-comment-text'});
                that.set_comment_text(text, item.comment);
                body.insertBefore(text, info);
            } else {
                var stamp = _.e('img', {cls: 'pp-popup-comment-stamp'});
                stamp.src = 'https://source.pixiv.net/common/images/stamp/stamps/' + item.stampId + '_s.jpg';
                body.insertBefore(stamp, info);
            }

            info.textContent = item.commentDate;

            if (item.editable) {
                _.onclick(_.e('span', {cls: 'pp-popup-comment-delete', text: _.lng.delete_comment}, info),
                    that.delete_comment.bind(that, item.id, li));
            } else {
                _.onclick(_.e('span', {cls: 'pp-popup-comment-reply', text: _.lng.reply_comment}, info),
                    function () {
                        that.show_form();
                        that.form.set_reply_to(item.id);
                    });
            }

            if (item.stampId) {
                li.classList.add('pp-popup-comment-item-stamp');
            }

            if (item.hasReplies) {
                var d_rep = _.e('div',
                    {
                        cls: 'pp-popup-comment-display-replies',
                        text: _.lng.display_replies
                    },
                    body);
                _.onclick(d_rep, function () {
                    that.load_replies(item.id, body, d_rep);
                });
            }

            ul.insertBefore(li, before);
        });
        _.popup.adjust();
    },

    start: function () {
        if (this.active) {
            return;
        }

        this.active = true;
        this.load(_.popup.illust);
        _.popup.dom.root.classList.add('pp-comment-mode');
        _.popup.show_caption();
        _.popup.adjust();
    },

    end: function () {
        if (!this.active) {
            return;
        }
        _.popup.dom.root.classList.remove('pp-comment-mode');
        this.active = false;
        _.popup.adjust();
        _.popup.dom.caption_wrapper.scrollTop = 0;
    },

    toggle: function () {
        if (this.active) {
            this.end();
        } else {
            this.start();
        }
    }
};
_.popup.bookmark = {
    active: false,

    init: function () {
        if (this.initialized) {
            return;
        }
        this.initialized = true;

        _.onclick(_.popup.dom.bookmark_wrapper, function (ev) {
            if (ev.target.classList.contains('tag')) {
                _.bookmarkform.toggle(ev.target.dataset.tag);
            }
        });
    },

    clear: function () {
        _.clear(_.popup.dom.bookmark_wrapper);
        _.popup.dom.root.classList.remove('pp-bookmark-mode');
        this.active = false;
        w.focus(); // for Firefox
    },

    adjust: function (w, h) {
        if (this.active) {
            _.bookmarkform.adjust(w, h);
        }
    },

    onload: function (illust, html) {
        if (illust !== _.popup.illust || !this.active) {
            return;
        }

        this.init();

        var doc = _.parse_html(html);
        var body = _.q('.layout-body', doc);

        var re, wrapper = _.popup.dom.bookmark_wrapper;

        wrapper.innerHTML = body.outerHTML;

        (function (re) {
            if (!re) {
                _.error('Failed to detect pixiv.context.tags declaration');
                return;
            }

            var tags, tags_data;

            try {
                tags = JSON.parse(re[1]); // eval(re[1])
                tags_data = JSON.parse(tags);
            } catch (ex) {
                _.error('Failed to parse pixiv.context.tags json', ex);
                return;
            }

            var items = [];
            for (var tag in tags_data) {
                var item = tags_data[tag];
                item.name = tag;
                items.push(item);
            }
            items.sort(function (a, b) {
                return a.lev - b.lev;
            });
            console.log(items);

            var cont = _.q('.tag-cloud-container ul.tag-cloud', wrapper);
            cont.classList.remove('loading-indicator');
            items.forEach(function (item) {
                var li = _.e('li', null, cont),
                    span = _.e('span', null, li);
                span.dataset.tag = item.name;
                span.className = 'tag c' + item.lev;
                span.textContent = item.name;
            });

        })(/>pixiv\.context\.tags\s*=\s*(\"[^\"]+\");/.exec(html));

        var that = this;

        _.bookmarkform.setup(wrapper, {
            autoinput: !illust.bookmarked,
            submit: function () {
                _.popup.status_loading();
            },
            success: function () {
                _.popup.status_complete();

                _.xhr.remove_cache(illust.url_bookmark);

                if (illust === _.popup.illust && _.popup.bookmark.active) {
                    that.end();
                    _.popup.reload();
                }
            },
            error: function () {
                _.popup.status_error();
                g.alert('Error!');
            }
        });

        if (_.bookmarkform.dom.input_tag) {
            g.setTimeout(function () {
                _.bookmarkform.dom.input_tag.focus();
            }, 0);
        }

        _.popup.dom.root.classList.add('pp-bookmark-mode');
        _.popup.status_complete();
        _.popup.adjust();
    },

    start: function () {
        if (this.active) {
            return;
        }

        var that = this;

        var illust = _.popup.illust;
        this.active = true;
        _.popup.status_loading();

        _.xhr.get(illust.url_bookmark, function (html) {
            that.onload(illust, html);
        }, function (msg) {
            if (illust !== _.popup.illust || !that.active) {
                return;
            }

            that.active = false;
            _.popup.status_error(msg);
        });
    },

    submit: function () {
        if (!this.active) {
            return;
        }
        _.bookmarkform.submit();
    },

    end: function () {
        if (!this.active) {
            return;
        }
        this.clear();
        _.popup.show(_.popup.illust);
    },

    toggle: function () {
        if (this.active) {
            this.end();
        } else {
            this.start();
        }
    }
};
_.popup.manga = {
    indicator: {
        set_text: function (svg, text, maxchars) {
            var g = _.q('.pp-icon-indicator-text', svg);
            if (g) {
                _.clear(g);
            } else {
                g = _.e('g', {cls: 'pp-icon-indicator-text'}, svg);
            }


            var pad = 10, offset = 0;

            if (maxchars) {
                offset = (maxchars - text.length) * 10 / 2;
            }


            text.split('').forEach(function (chr, idx) {
                var glyph = _.q('*[data-pp-char="' + chr + '"]', svg);
                if (!glyph) {
                    return;
                }
                glyph = glyph.cloneNode(true);

                var xoff = idx * 10 + 5 + pad + offset;
                glyph.setAttribute('transform', 'matrix(1.8,0,0,1.8,' + xoff + ',20)');
                g.appendChild(glyph);
            });


            var width = (maxchars || text.length) * 10 + (pad * 2);
            svg.setAttribute('width', width);
            svg.setAttribute('height', '24');
            svg.setAttribute('viewBox', '0 0 ' + width + ' 24');
            svg.style.width = 'calc(1em*' + (width / 24) + ')';
            svg.style.height = '1em';
            _.q('.pp-icon-manga-frame', svg).setAttribute('width', width);
            _.q('.pp-icon-manga-frame-mask-1', svg).setAttribute('width', width);
            _.q('.pp-icon-manga-frame-mask-2', svg).setAttribute('width', width - 4);
        },

        set_progress: function (svg, progress) {
            var box = _.q('.pp-icon-manga-progress', svg),
                mw = parseInt(_.q('.pp-icon-manga-frame-mask-2', svg).getAttribute('width'));
            box.setAttribute('width', mw * progress);
        }
    },

    active: false,
    page: -1,

    clear: function () {
        this.active = false;
        this.page = -1;
        this.update_button();
    },

    onload: function (illust, page) {
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

        var page_data = illust.manga.pages[page];

        _.popup.dom.root.classList.remove('pp-frontpage');
        _.popup.dom.root.classList.remove('pp-frontpage-new');
        _.popup.dom.root.classList.remove('pp-frontpage-old');
        _.popup.dom.image_layout.href = illust.url_manga + '#pp-manga-page-' + page;
        _.popup.status_complete();
        _.popup.set_images(illust.manga.pages[page].map(function (page) {
            return page.image_big || page.image_medium;
        }));
    },

    onerror: function (illust, page) {
        if (illust !== _.popup.illust || !this.active || page !== this.page) {
            return;
        }
        if (illust.error) {
            _.popup.dom.image_layout.textContent = illust.error;
        }
        _.popup.status_error();
        _.popup.adjust();
    },

    update_button: function () {
        var illust = _.popup.illust,
            pages = illust.manga.pages,
            page_count = illust.manga.page_count,
            label, prog, maxchars;

        if (pages) {
            if (!illust.manga.indicator_labels) {
                illust.manga.indicator_labels = pages.reduce(function (v, pp) {
                    var l = v[1];
                    if (pp.length >= 2) {
                        l += '-' + (l + pp.length - 1);
                    }
                    l += '/' + page_count;
                    v[0].push([l, v[1] + pp.length - 1]);
                    return [v[0], v[1] + pp.length];
                }, [[], 1])[0];
            }

            if (this.page >= 0) {
                var lp = illust.manga.indicator_labels[this.page];
                label = lp[0];
                prog = lp[1];
            } else {
                label = (prog = 0) + '/' + page_count;
            }
            maxchars = Math.max.apply(Math, illust.manga.indicator_labels.map(function (l) {
                return l[0].length;
            }));
        } else {
            label = String(prog = this.page + 1);
        }

        var svg = _.popup.dom.manga_progress_svg;
        this.indicator.set_text(svg, label, maxchars);
        this.indicator.set_progress(svg, prog / page_count);

        _.popup.dom.button_manga.classList[this.page >= 0 ? 'add' : 'remove']('pp-active');
        _.ui.tooltip.set(
            svg,
            _.lng.tooltip[this.page >= 0 ? 'manga_mode_off' : 'manga_mode_on'],
            _.conf.key[this.page >= 0 ? 'popup_manga_end' : 'popup_manga_start']
        );
    },

    show: function (page) {
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
        _.popup.resize_mode = _.popup.RM_AUTO;
        illust.manga.viewed = true;
        _.popup.status_loading();
        _.illust.load_manga_page(illust, this.page);
    },

    start: function () {
        if (this.active) {
            return;
        }
        this.show(0);
    },

    end: function () {
        if (!this.active) {
            return;
        }
        this.clear();
        _.popup.show(_.popup.illust);
    },

    toggle: function () {
        if (this.active) {
            this.end();
        } else {
            this.start();
        }
    }
};
_.popup.question = {
    is_active: function () {
        return false;
        return !!_.q('.questionnaire .list.visible,.questionnaire .stats.visible', _.popup.dom.rating);
    },

    clear: function () {
    },

    get_buttons: function () {
        return _.qa('.questionnaire .list ol input[type="button"]');
    },

    get_selected: function () {
        var active = d.activeElement;
        if (this.get_buttons().indexOf(active) >= 0) {
            return active;
        }
        return null;
    },

    blur: function () {
        var selected = this.get_selected();
        if (selected) {
            selected.blur();
        }
    },

    select_button: function (move) {
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

    select_prev: function () {
        this.select_button(-1);
    },

    select_next: function () {
        this.select_button(1);
    },

    submit: function () {
        var selected = this.get_selected();
        if (selected) {
            _.send_click(selected);
        }
    },

    send: function (btn) {
        var that = this;
        btn.setAttribute('disabled', 'true');
        _.popup.status_loading();
        _.popup.api.post(
            '/rpc_rating.php',
            {
                mode: 'save2',
                i_id: _.popup.illust.id,
                u_id: _.api.uid,
                qr: 1,
                num: btn.dataset.key,
                tt: _.api.token
            },
            function (res) {
                that.end();
                _.popup.reload();
            },
            function () {
                btn.value = 'Error';
            }
        );
    },

    setup: function () {
        return;
        var root = _.q('.questionnaire', _.popup.dom.rating);

        this.dom = {
            root: root,
            toggle: _.q('.toggle-list,.toggle-stats', root),
            list: _.q('.list,.stats', root)
        };

        _.onclick(this.dom.toggle, this.toggle.bind(this));

        var that = this;
        _.qa('input[type="button"][data-key]', this.dom.list).forEach(function (btn) {
            _.onclick(btn, function () {
                that.send(btn);
            });
        });
    },

    toggle: function () {
        this.dom.list.classList.toggle('visible');
    },

    start: function () {
        this.dom.list.classList.add('visible');
        if (!_.popup.is_caption_visible()) {
            _.popup.show_caption();
        }
    },

    end: function () {
        this.blur();
        this.dom.list.classList.remove('visible');
    }
};
_.popup.tagedit = {
    active: false,

    clear: function () {
        _.popup.dom.root.classList.remove('pp-tagedit-mode');
        _.clear(_.popup.dom.tagedit_wrapper);
        this.active = false;
    },

    adjust: function (w, h) {
        var wrap = _.popup.dom.tagedit_wrapper,
            twrap = _.q('#pp-popup-tagedit-table-wrapper', wrap);

        if (!twrap) {
            return;
        }

        h -= wrap.offsetHeight - twrap.offsetHeight;
        twrap.style.maxHeight = h + 'px';
    },

    onload: function (illust, html) {
        if (illust !== _.popup.illust || !this.active) {
            return;
        }

        var that = this;
        _.clear(_.popup.dom.tagedit_wrapper);

        var c = _.e('div', {id: 'tag-editor', css: 'display:block'}, _.popup.dom.tagedit_wrapper);
        c.innerHTML = html;

        this.input = _.q('#add_tag', c);

        var add_tag = _.q('input[onclick="addTag()"]', c);
        if (add_tag) {
            add_tag.removeAttribute('onclick');
            add_tag.classList.add('pp-add-tag');
            _.onclick(add_tag, function () {
                that.add_tag(that.input.value, add_tag);
            });
        }

        _.qa('input[onclick^="delTag("]').forEach(function (btn) {
            var re = /delTag\((\d+),/.exec(btn.getAttribute('onclick'));
            if (re) {
                var tag = _.q('#tag' + re[1], c);
                if (tag) {
                    btn.removeAttribute('onclick');
                    btn.classList.add('pp-remove-tag');
                    btn.setAttribute('data-pp-tag-id', re[1]);
                    _.onclick(btn, function () {
                        that.remove_tag(tag.textContent, btn);
                    });
                    return;
                }
            }
            btn.setAttribute('disabled');
        });

        var table = _.q('table', c);
        if (table) {
            var tw = _.e('div', {id: 'pp-popup-tagedit-table-wrapper'});
            table.parentNode.replaceChild(tw, table);
            tw.appendChild(table);
        }

        _.popup.status_complete();
        _.popup.dom.root.classList.add('pp-tagedit-mode');
        _.popup.adjust();
    },

    reload: function () {
        var that = this, illust = _.popup.illust;
        _.popup.status_loading();
        _.popup.api.post(
            '/rpc_tag_edit.php',
            {
                mode: 'first',
                i_id: illust.id,
                u_id: illust.author_id,
                e_id: _.api.uid,
                tt: _.api.token
            },
            function (data) {
                that.onload(illust, data.html);
            },
            function () {
                if (illust === _.popup.illust) {
                    that.end();
                }
            }
        );
    },

    add_tag: function (tag, btn) {
        var that = this, illust = _.popup.illust;
        btn.setAttribute('disabled', 'true');
        _.popup.status_loading();
        _.popup.api.post(
            '/rpc_tag_edit.php',
            {
                mode: 'add_tag',
                i_id: illust.id,
                u_id: illust.author_id,
                e_id: _.api.uid,
                value: tag,
                tt: _.api.token
            },
            function (data) {
                that.end();
                _.popup.reload();
            },
            function () {
                btn.value = 'Error';
            }
        );
    },

    remove_tag: function (tag, btn) {
        if (!confirm(_.lng.delete_tag_confirm)) {
            return;
        }

        var that = this, illust = _.popup.illust;
        btn.setAttribute('disabled', 'true');
        _.popup.status_loading();
        _.popup.api.post(
            '/rpc_tag_edit.php',
            {
                mode: 'del_tag',
                i_id: illust.id,
                u_id: illust.author_id,
                e_id: _.api.uid,
                tag: tag,
                tt: _.api.token
            },
            function (data) {
                that.end();
                _.popup.reload();
            },
            function () {
                btn.value = 'Error';
            }
        );
    },

    start: function () {
        if (this.active) {
            return;
        }
        this.active = true;
        this.reload();
        _.popup.adjust();
    },

    end: function () {
        if (!this.active) {
            return;
        }
        this.active = false;
        _.popup.dom.root.classList.remove('pp-tagedit-mode');
        _.popup.adjust();
    }
};
_.popup.input = {
    wheel_delta: 0,

    init: function () {
        var that = this;

        ['auto_manga', 'reverse'].forEach(function (name) {
            var mode = _.conf.popup[name], value;
            if (mode === 2) {
                var pattern = _.conf.popup[name + '_regexp'];
                if (pattern) {
                    try {
                        value = (new g.RegExp(pattern)).test(w.location.href);
                    } catch (ex) {
                        value = false;
                    }
                } else {
                    value = false;
                }
            } else {
                value = mode === 1;
            }
            that[name] = value;
        });

        _.popup.mouse.init();
    },

    /*
     * direction
     *   0: vertical
     *   1: horizontal
     *   2: vertical(prior) or horizontal
     */
    scroll: function (elem, direction, offset) {
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

    prev: function () {
        if (_.popup.manga.active) {
            _.popup.manga.show(_.popup.manga.page - 1);
        } else {
            _.popup.show(_.popup.illust[this.reverse ? 'next' : 'prev']);
        }
        return true;
    },

    next: function () {
        if (_.popup.manga.active) {
            _.popup.manga.show(_.popup.manga.page + 1);
        } else if (this.auto_manga && _.popup.illust.manga.available && !_.popup.illust.manga.viewed) {
            _.popup.manga.start();
        } else {
            _.popup.show(_.popup.illust[this.reverse ? 'prev' : 'next']);
        }
        return true;
    },

    prev_direction: function () {
        if (_.popup.manga.active) {
            _.popup.manga.show(_.popup.manga.page - 1);
        } else {
            _.popup.show(_.popup.illust.prev);
        }
        return true;
    },

    next_direction: function () {
        if (_.popup.manga.active) {
            _.popup.manga.show(_.popup.manga.page + 1);
        } else {
            _.popup.show(_.popup.illust.next);
        }
        return true;
    },

    first: function () {
        if (_.popup.manga.active) {
            _.popup.manga.show(0);
        } else {
            _.popup.show(_.illust.list[0]);
        }
        return true;
    },

    last: function () {
        if (_.popup.manga.active) {
            _.popup.manga.show(_.popup.illust.manga.pages.length - 1);
        } else {
            _.popup.show(_.illust.list[_.illust.list.length - 1]);
        }
        return true;
    },

    caption_scroll_up: function () {
        return this.scroll(_.popup.dom.caption_wrapper, 0, -_.conf.popup.scroll_height);
    },

    caption_scroll_down: function () {
        return this.scroll(_.popup.dom.caption_wrapper, 0, _.conf.popup.scroll_height);
    },

    illust_scroll_up: function () {
        return this.scroll(_.popup.dom.image_scroller, 0, -_.conf.popup.scroll_height);
    },

    illust_scroll_down: function () {
        return this.scroll(_.popup.dom.image_scroller, 0, _.conf.popup.scroll_height);
    },

    illust_scroll_left: function () {
        return this.scroll(_.popup.dom.image_scroller, 1, -_.conf.popup.scroll_height);
    },

    illust_scroll_right: function () {
        return this.scroll(_.popup.dom.image_scroller, 1, _.conf.popup.scroll_height);
    },

    illust_scroll_top: function () {
        if (_.popup.can_scroll()) {
            var el = _.popup.dom.image_scroller;
            el.scrollLeft = 0;
            el.scrollTop = 0;
            return true;
        }
        return false;
    },

    illust_scroll_bottom: function () {
        if (_.popup.can_scroll()) {
            var el = _.popup.dom.image_scroller;
            el.scrollLeft = el.scrollWidth;
            el.scrollTop = el.scrollHeight;
            return true;
        }
        return false;
    },

    illust_page_up: function () {
        return this.scroll(_.popup.dom.image_scroller, 2, -_.conf.popup.scroll_height_page);
    },

    illust_page_down: function () {
        return this.scroll(_.popup.dom.image_scroller, 2, _.conf.popup.scroll_height_page);
    },

    switch_resize_mode: function () {
        _.popup.resize_mode = _.popup.resize_mode_next;
        _.popup.adjust();

        var illust = _.popup.illust;

        if (_.popup.manga.active) {
            var page_data = illust.manga.pages[_.popup.manga.page];
            if (page_data.filter(function (p) {
                return !p.image_big;
            }).length >= 1) {
                if (_.popup.resize_mode === _.popup.RM_FIT_LONG) {
                    _.popup.resize_mode = _.popup.RM_AUTO;
                }
                _.popup.status_loading();
                _.illust.load_manga_page(illust, _.popup.manga.page, true);
            }

        } else {
            if ((!illust.ugoira_player && !illust.image_big) ||
                (illust.ugoira_player && illust.ugoira === illust.ugoira_small)) {
                if (_.popup.resize_mode === _.popup.RM_FIT_LONG) {
                    _.popup.resize_mode = _.popup.RM_AUTO;
                }
                _.popup.status_loading();
                _.illust.load(_.popup.illust, true);
            }
        }
        return true;
    },

    open: function () {
        _.open(_.popup.illust.url_medium);
        return true;
    },

    open_big: function () {
        if (_.popup.illust.manga.available) {
            if (_.popup.manga.active) {
                _.popup.illust.manga.pages[_.popup.manga.page].forEach(function (p) {
                    _.open(p.image_big
                        ? p.image_big.src
                        : (p.image_url_big_alt ? p.url_manga_big : p.image_url_big));
                });
            } else {
                _.open(_.popup.illust.url_manga);
            }
        } else {
            _.open(_.popup.illust.image_url_big || _.popup.illust.url_medium);
        }
        return true;
    },

    open_profile: function () {
        _.open(_.popup.illust.url_author_profile);
        return true;
    },

    open_illust: function () {
        _.open(_.popup.illust.url_author_works);
        return true;
    },

    open_bookmark: function () {
        _.open(_.popup.illust.url_author_bookmarks);
        return true;
    },

    open_staccfeed: function () {
        _.open(_.popup.illust.url_author_staccfeed);
        return true;
    },

    open_response: function () {
        if (_.popup.illust.has_image_response) {
            _.open(_.popup.illust.url_response);
            return true;
        }

        if (_.popup.illust.image_response_to) {
            _.open(_.popup.illust.url_response_to);
        }

        return false;
    },

    open_bookmark_detail: function () {
        _.open(_.popup.illust.url_bookmark_detail);
        return true;
    },

    open_manga_thumbnail: function () {
        _.open(_.popup.illust.url_manga + '#pp-manga-thumbnail');
        return true;
    },

    reload: function () {
        _.popup.reload();
        return true;
    },

    caption_toggle: function () {
        _.popup.toggle_caption();
        return true;
    },

    comment_toggle: function () {
        _.popup.comment.toggle();
        return true;
    },

    // manga mode

    manga_start: function () {
        if (_.popup.illust.manga.available && !_.popup.manga.active) {
            _.popup.manga.start();
            return true;
        }
        return false;
    },

    manga_end: function () {
        if (_.popup.manga.active) {
            _.popup.manga.end();
            return true;
        }
        return false;
    },

    manga_open_page: function () {
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
    qrate_start: function () {
        _.popup.open_vote_dialog();
        return true;
    },

    qrate_end: function () {
        if (_.popup.question.is_active()) {
            _.popup.question.end();
            return true;
        }
        return false;
    },

    qrate_submit: function () {
        if (_.popup.question.is_active()) {
            _.popup.question.submit();
            return true;
        }
        return false;
    },

    qrate_select_prev: function () {
        if (_.popup.question.is_active()) {
            _.popup.question.select_prev();
            return true;
        }
        return false;
    },

    qrate_select_next: function () {
        if (_.popup.question.is_active()) {
            _.popup.question.select_next();
            return true;
        }
        return false;
    },

    // bookmark mode

    bookmark_start: function () {
        _.popup.bookmark.start();
        return true;
    },

    bookmark_end: function () {
        if (_.popup.bookmark.active) {
            _.popup.bookmark.end();
            return true;
        }
        return false;
    },

    bookmark_submit: function () {
        if (_.popup.bookmark.active) {
            _.popup.bookmark.submit();
            return true;
        }
        return false;
    },

    // tag edit mode

    tag_edit_start: function () {
        if (!_.popup.tagedit.active) {
            _.popup.tagedit.start();
            return true;
        }
        return false;
    },

    tag_edit_end: function () {
        if (_.popup.tagedit.active) {
            _.popup.tagedit.end();
            return true;
        }
        return false;
    },

    // ugoira

    ugoira_play_pause: function () {
        return _.popup.ugoira_play_pause();
    },

    ugoira_prev_frame: function () {
        return _.popup.ugoira_prev_frame();
    },

    ugoira_next_frame: function () {
        return _.popup.ugoira_next_frame();
    },

    // like

    rate10: function () {
        _.popup.send_like();
    }
};
_.popup.key = {
    keys: [
        'bookmark_submit',
        'bookmark_end',

        function () {
            return _.popup.bookmark.active;
        },

        'qrate_start',

        'manga_start',
        'manga_end',
        'manga_open_page',

        'tag_edit_start',
        'tag_edit_end',

        'ugoira_play_pause',
        'ugoira_prev_frame',
        'ugoira_next_frame',

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
        'comment_toggle'
    ],

    onkey: function (key, ev) {
        var that = this;

        if (!_.popup.running || !_.key_enabled(ev)) {
            return false;
        }

        var cancel = false;

        for (var i = 0; i < that.keys.length; ++i) {
            var item = that.keys[i];

            if (item instanceof g.Function) {
                if (item.call(_.popup.input)) {
                    break;
                }
                continue;
            }

            if (_.conf.key['popup_' + item].split(',').indexOf(key) >= 0) {
                var action = _.popup.input[item];
                if (action.call(_.popup.input)) {
                    cancel = true;
                    break;
                }
            }
        }

        return cancel;
    }
};
_.popup.mouse = {
    init: function () {
        _.onwheel(w, function (ev) {
            if (!_.popup.running || _.conf.popup.mouse_wheel === 0) {
                return false;
            }

            var node = ev.target;
            while (node && node.nodeType === w.Node.ELEMENT_NODE) {
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

        _.onclick(dom.resize_mode, function () {
            _.popup.input.switch_resize_mode();
            return true;
        });

        _.onclick(dom.button_comment, function () {
            _.popup.comment.toggle();
            return true;
        });

        _.onclick(dom.button_vote, function () {
            _.popup.open_vote_dialog();
            return true;
        });

        _.onclick(dom.button_like, function () {
            _.popup.send_like();
            return true;
        });

        _.onclick(dom.button_bookmark, function () {
            _.popup.bookmark.toggle();
            return true;
        });

        _.onclick(dom.button_manga, function () {
            _.popup.manga.toggle();
            return true;
        });

        _.onclick(dom.image_wrapper, function () {
            _.popup.hide();
            return true;
        });

        _.onclick(dom.olc_prev, function () {
            _.popup.input.prev_direction();
            return true;
        });

        _.onclick(dom.olc_next, function () {
            _.popup.input.next_direction();
            return true;
        });

        _.onwheel(dom.image_scroller, function (ev) {

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

        _.onclick(dom.tagedit_wrapper, function (ev) {
            var endbtn = ev.target;
            if (/^input$/i.test(endbtn.tagName) && /endTagEdit/.test(endbtn.getAttribute('onclick'))) {
                _.popup.tagedit.end();
                return true;
            }
            return false;
        });

        _.onclick(dom.comment_form_btn, function () {
            _.popup.comment.toggle_form();
        });
    }
};
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
_.CommentForm = _.class.create({
    init: function (wrap, illust) {
        this.illust = illust;

        var dom = this.dom = {};

        dom.wrap = wrap;
        dom.illust = illust;

        dom.root = _.e('div', {cls: 'pp-commform-root'}, wrap);
        dom.overlay = _.e('div', {cls: 'pp-commform-overlay'}, dom.root);
        dom.overlay_message = _.e('div', {cls: 'pp-commform-overlay-message'}, dom.overlay);
        dom.reply_to_wrap = _.e('div', {cls: 'pp-commform-reply-to-wrap pp-hide'}, dom.root);
        dom.reply_to = _.e('ul', {cls: 'pp-commform-reply-to'}, dom.reply_to_wrap);
        dom.form = _.e('div', {cls: 'pp-commform-form'}, dom.root);
        dom.tabbar = _.e('div', {cls: 'pp-commform-tabbar pp-commform-tabbar-top'}, dom.form);

        dom.overlay.appendChild(dom.icon_loading = _.svg.comment_loading(d));
        dom.overlay.appendChild(dom.icon_error = _.svg.comment_error(d));

        dom.reply_to_wrap.insertBefore(
            dom.icon_reply_to = _.svg.comment_reply_to(d), dom.reply_to_wrap.firstChild);

        var that = this;
        this.tabs.forEach(function (name) {
            var text = _.lng.commform['tab_' + name],
                tab = _.e('div', {cls: 'pp-commform-tab pp-commform-tab-' + name, text: text}, dom.tabbar),
                cont = _.e('div', {cls: 'pp-commform-cont pp-commform-cont-' + name}, dom.form);

            _.onclick(tab, function () {
                that.select_tab(name);
            });

            dom['tab_' + name] = tab;
            dom['cont_' + name] = cont;

            that['tab_' + name](cont);
        });

        this.select_tab(_.conf.general.commform_default_tab);
    },


    set_reply_to: function (id) {
        this.reply_to_id = id || null;

        if (!id) {
            this.dom.reply_to_wrap.classList.add('pp-hide');
            return;
        }

        var that = this;
        this.set_loading();
        _.clear(this.dom.reply_to);
        this.get_comment(id, function (item) {
            _.popup.comment.add_comments([item], that.dom.reply_to);
            that.dom.reply_to_wrap.classList.remove('pp-hide');
            that.set_complete();
        }, function (msg) {
            that.set_error(msg);
        });
    },

    get_comment: function (id, onload, onerror) {
        _.api.get(
            '/rpc/get_comment.php',
            this.illust,
            {
                comment_id: id,
                format: 'json',
                tt: _.api.token
            },
            function (data) {
                if (data.error) {
                    onerror(data.message || 'Unknown API error');
                } else {
                    var item = data.body.items[0];
                    item.id = item.one_comment_id;
                    item.comment = item.one_comment_comment;
                    item.commentDate = item.one_comment_date;
                    item.userId = item.user_id;
                    item.userName = item.user_name;
                    item.replyToUserName = item.reply_to_user_name;
                    item.replyToUserId = item.one_comment_reply_to_user_id;
                    item.commentParentId = item.one_comment_parent_id;
                    item.commentRootId = item.one_comment_root_id;
                    item.commentUserId = item.one_comment_user_id;
                    item.stampId = item.one_comment_stamp_id;
                    item.stampLink = item.one_comment_stamp_link;
                    onload(item);
                }
            },
            onerror
        );
    },


    onsent: function (item) {
        // override this function
    },

    onstatuschange: function (status, message) {
    },


    set_error: function (msg) {
        this.dom.overlay.classList.add('pp-error');
        this.dom.overlay.classList.remove('pp-loading');
        this.dom.overlay_message.textContent = msg || 'Unknown error';
        _.error.apply(_, arguments);
        this.onstatuschange('error', msg);
    },

    set_loading: function () {
        this.dom.overlay.classList.remove('pp-error');
        this.dom.overlay.classList.add('pp-loading');
        this.dom.overlay_message.textContent = 'Loading';
        this.onstatuschange('loading');
    },

    set_complete: function () {
        this.dom.overlay.classList.remove('pp-error');
        this.dom.overlay.classList.remove('pp-loading');
        this.onstatuschange('complete');
    },


    send: function (data) {
        if (this.reply_to_id) {
            data.parent_id = this.reply_to_id;
        }

        var that = this;
        this.set_loading();
        _.api.post(
            '/rpc/post_comment.php',
            this.illust,
            data,
            function (data) {
                if (data.error) {
                    that.set_error(data.message || 'Unknown error');
                } else {
                    _.debug('comment sent', data);
                    that.get_comment(data.body.id, function (item) {
                        that.onsent(data.body);
                        that.comment_textarea.value = '';
                        that.set_reply_to();
                        that.set_complete();
                    }, function (msg) {
                        that.set_error(msg);
                    });
                }
            },
            function (msg) {
                that.set_error(msg);
            }
        );
    },

    send_stamp: function (id) {
        this.send({
            type: 'stamp',
            illust_id: this.illust.id,
            author_user_id: this.illust.author_id,
            stamp_id: id,
            format: 'json',
            tt: _.api.token
        });
    },

    send_comment: function () {
        this.send({
            type: 'comment',
            illust_id: this.illust.id,
            author_user_id: this.illust.author_id,
            comment: this.comment_textarea.value,
            format: 'json',
            tt: _.api.token
        });
    },

    insert_text: function (text) {
        var ta = this.comment_textarea,
            s = ta.selectionStart,
            e = ta.selectionEnd;
        ta.value = ta.value.substring(0, s) + text + ta.value.substring(e);
        ta.setSelectionRange(s + text.length, s + text.length);
        w.setTimeout(function () {
            ta.focus();
        }, 0);
    },

    insert_emoji: function (emoji) {
        this.insert_text('(' + emoji.name + ')');
    },


    select_tab: function (name) {
        if (this.tabs.indexOf(name) < 0) {
            this.select_tab(this.tabs[0]);
            return;
        }

        var that = this;
        this.tabs.forEach(function (_n) {
            var tab = that.dom['tab_' + _n],
                cont = that.dom['cont_' + _n];
            tab.classList[_n === name ? 'add' : 'remove']('pp-active');
            cont.classList[_n === name ? 'add' : 'remove']('pp-active');
        });

        _.conf.general.commform_default_tab = name;
    },

    tab_comment: function (cont) {
        var textarea = _.e('textarea', {placeholder: _.lng.commform.comment_placeholder}, cont),
            emoji = _.e('div', {cls: 'pp-commform-emoji'}, cont),
            toolbar = _.e('div', {cls: 'pp-commform-toolbar'}, cont),
            btn_emoji = _.e('button', {cls: 'pp-commform-button-flat', text: _.lng.commform.btn_emoji}, toolbar),
            btn_send = _.e('button', {
                cls: 'pp-commform-button-blue pp-commform-send',
                text: _.lng.commform.btn_send
            }, toolbar);

        var that = this;
        emoji.classList.add('pp-hide');
        _.onclick(btn_emoji, function () {
            emoji.classList.toggle('pp-hide');
        });
        _.onclick(btn_send, function () {
            that.send_comment();
        });

        this.comment_textarea = textarea;


        if (_.emoji_series) {
            var row;
            _.emoji_series.forEach(function (item, i) {
                var img = new w.Image();
                img.src = item.url;
                _.onclick(img, function () {
                    that.insert_emoji(item);
                });

                if (i % 8 === 0) {
                    row = _.e('div', null, emoji);
                }
                row.appendChild(img);
            });
        } else {
            emoji.textContent = 'Error';
        }
    },

    tab_stamp: function (cont) {
        if (!_.stamp_series) {
            cont.textContent = 'Error';
            return;
        }

        var stamps = _.e('div', {cls: 'pp-commform-stamp-groups'}, cont),
            tabbar = _.e('div', {
                cls: ['pp-commform-tabbar',
                    'pp-commform-tabbar-bottom',
                    'pp-commform-tabbar-center'].join(' ')
            }, cont);

        var that = this, tabs = [], grp_wraps = [];
        _.stamp_series.forEach(function (grp, n) {
            var tab = _.e('div', {cls: 'pp-commform-tab'}, tabbar),
                wrap = _.e('div', {cls: 'pp-commform-stamp-group'}, stamps),
                img = new w.Image();
            tab.dataset.group = grp.slug;
            wrap.dataset.group = grp.slug;
            img.src = '//source.pixiv.net/common/images/stamp/main/' + grp.slug + '.png';
            tab.appendChild(img);
            tabs.push(tab);
            grp_wraps.push(wrap);
            _.onclick(tab, function () {
                tabs.forEach(function (t) {
                    t.classList[t === tab ? 'add' : 'remove']('pp-active');
                });
                grp_wraps.forEach(function (wr) {
                    wr.classList[wr === wrap ? 'add' : 'remove']('pp-active');
                });
            });

            if (n === 0) {
                tab.classList.add('pp-active');
                wrap.classList.add('pp-active');
            }

            var row;
            grp.stamps.forEach(function (id, i) {
                var img = new w.Image();
                img.dataset.id = id;
                img.src = '//source.pixiv.net/common//images/stamp/stamps/' + id + '_s.jpg';
                _.onclick(img, function () {
                    that.send_stamp(id);
                });

                if (i % 5 === 0) {
                    row = _.e('div', null, wrap);
                }
                row.appendChild(img);
            });
        });
    },

    tabs: ['comment', 'stamp']
});
_.CommentForm2 = _.class.create({
    init: function (wrap, illust) {
        this.illust = illust;

        var dom = this.dom = {};

        dom.wrap = wrap;
        dom.illust = illust;

        dom.root = _.e('div', {cls: 'pp-commform2-root'}, wrap);
        dom.overlay = _.e('div', {cls: 'pp-commform2-overlay'}, dom.root);
        dom.overlay_message = _.e('div', {cls: 'pp-commform2-overlay-message'}, dom.overlay);
        dom.mainbar = _.e('div', {cls: 'pp-commform2-mainbar'}, dom.root);
        dom.prof_img = _.e('div', {cls: 'pp-commform2-prof-image'}, dom.mainbar);
        dom.textarea_wrap = _.e('div', {cls: 'pp-commform2-textarea-wrap'}, dom.mainbar);
        dom.textarea = _.e('textarea', {cls: 'pp-commform2-textarea'}, dom.textarea_wrap);
        dom.submit_wrap = _.e('div', {cls: 'pp-commform2-submit-wrap'}, dom.mainbar);
        dom.submit = _.e('button', {cls: 'pp-commform2-submit'}, dom.submit_wrap);

        // dom.overlay.appendChild(dom.icon_loading = _.svg.comment_loading(d));
        // dom.overlay.appendChild(dom.icon_error   = _.svg.comment_error(d));

        // dom.reply_to_wrap.insertBefore(
        //   dom.icon_reply_to = _.svg.comment_reply_to(d), dom.reply_to_wrap.firstChild);

        // var that = this;
        // this.tabs.forEach(function(name) {
        //   var text = _.lng.commform['tab_' + name],
        //       tab  = _.e('div', {cls: 'pp-commform-tab pp-commform-tab-' + name, text: text}, dom.tabbar),
        //       cont = _.e('div', {cls: 'pp-commform-cont pp-commform-cont-' + name}, dom.form);

        //   _.onclick(tab, function() {
        //     that.select_tab(name);
        //   });

        //   dom['tab_' + name]  = tab;
        //   dom['cont_' + name] = cont;

        //   that['tab_' + name](cont);
        // });

        // this.select_tab(_.conf.general.commform_default_tab);
    }
});
_.Floater = _.class.create({
    init: function (wrap, cont, ignore_elements) {
        this.wrap = wrap;
        this.cont = cont;
        this.floating = false;
        this.disable_float = false;
        this.disable_float_temp = false;
        this.use_placeholder = true;
        this.ignore_elements = ignore_elements || [];
        _.Floater.instances.push(this);
        if (_.Floater.initialized) {
            this.setup();
        }
    },

    setup: function () {
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
            var top = this.wrap.getBoundingClientRect().top;
            var mh = de.clientHeight - top - (this.wrap.offsetHeight - this.cont.offsetHeight);
            this.ignore_elements.forEach(function (elem) {
                mh += elem.offsetHeight;
            });
            if (mh < 60) {
                this.disable_float_temp = true;
                this.unfloat();
                this.cont.style.maxHeight = 'none';
                return;
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

    add_ignore_element: function (elem) {
        this.ignore_elements.push(elem);
    }
});

_.extend(_.Floater, {
    instances: [],
    initialized: false,

    init: function () {
        if (_.Floater.initialized) {
            return;
        }
        _.Floater.instances.forEach(function (inst) {
            inst.init();
        });

        _.listen(w, 'scroll', _.Floater.update_float.bind(_.Floater), {async: true});
        _.listen(w, 'resize', _.Floater.update_height.bind(_.Floater), {async: true});
        _.Floater.initialized = true;
    },

    auto_run: function (func) {
        if (_.conf.general.float_tag_list === 0) {
            return;
        }

        func();
    },

    update_float: function () {
        _.Floater.instances.forEach(function (inst) {
            inst.update_float();
        });
    },

    update_height: function () {
        _.Floater.instances.forEach(function (inst) {
            inst.update_height();
        });
    }
});
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
_.setup_ready = function () {
    _.debug('pixplus.setup_ready()');

    _.redirect_jump_page();
    _.config_button.init();

    if (_.conf.general.bookmark_hide) {
        _.qa('a[href*="bookmark.php"]').forEach(function (link) {
            var re;
            if ((re = /^(?:(?:https?:\/\/www\.pixiv\.net)?\/)?bookmark\.php(\?.*)?$/.exec(link.href))) {
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

    _.Floater.auto_run(function () {
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
        } catch (ex) {
            _.error(ex);
        }
    }

    // try {
    //     var req = w.pixiv.api.request;
    //     w.pixiv.api.request = function () {
    //         _.debug('pixiv.api.request', arguments[1]);
    //         if (/^(?:\.\/)?(?:rpc_tag_edit\.php|rpc_rating\.php)(?:\?|$)/.test(arguments[1])) {
    //             arguments[1] = '/' + arguments[1];
    //         }
    //         return req.apply(this, arguments);
    //     };
    // } catch (ex) {
    //     _.error('Failed to setup filter of pixiv.api.request', ex);
    // }

    if (_.conf.general.disable_profile_popup) {
        try {
            var d_on = w.colon.d.on;
            w.colon.d.on = function (evname, query) {
                if (evname === 'mouseenter' && query === '.ui-profile-popup') {
                    return this;
                }
                return d_on.apply(this, arguments);
            };
            w.colon.d.off('mouseenter', '.ui-profile-popup');
        } catch (ex) {
            _.error('Failed to disable profile card', ex);
        }
    }
};

_.run = function () {
    if (_extension_data) {
        var config_set_data = _.e('div', {css: 'display:none'}, d.documentElement);

        _.conf.__init({
            get: function (section, item) {
                return _extension_data.conf[_.conf.__key(section, item)] || null;
            },

            set: function (section, item, value) {
                _extension_data.conf[_.conf.__key(section, item)] = value;

                var ev = d.createEvent('Event');
                ev.initEvent('pixplusConfigSet', true, true);
                config_set_data.setAttribute('data-pp-section', section);
                config_set_data.setAttribute('data-pp-item', item);
                config_set_data.setAttribute('data-pp-value', value);
                config_set_data.dispatchEvent(ev);
            }
        });
        _.debug('Extension mode');
    } else {
        _.conf.__init(_.conf.__wrap_storage(g.localStorage));
        _.debug('User script mode (using LocalStorage)');
    }

    if (_.conf.general.redirect_jump_page === 1 && w.location.pathname === '/jump.php') {
        w.location.href = g.decodeURIComponent(w.location.search.substring(1));
        return;
    }

    _.i18n.setup();
    _.key.init();
    _.ui.tooltip.init();

    _.e('style', {text: _.css}, d.documentElement);

    _.illust.setup(d.documentElement);

    _.Floater.init();
    w.addEventListener('load', _.Floater.update_height.bind(_.Floater), false);

    if (/^(?:uninitialized|loading)$/.test(d.readyState)) {
        w.addEventListener('DOMContentLoaded', _.setup_ready, false);
    } else {
        _.setup_ready();
    }
};
(function (generator) {
    _.apng = generator();
    _.apng.base64 = _.base64;
    _.apng.crc32 = _.crc32;
    _.apng.__mod_generator = generator;

    var APNGDialog = _.class.create(_.Dialog.prototype, {
        init: function (illust, get_frames) {
            APNGDialog.super.init.call(this, {title: _.lng.apng.title, cls: 'pp-apng-generator'});
            this.illust = illust;
            this.get_frames = get_frames;

            var dom = this.dom;
            dom.progressbar = _.e('div', {cls: 'pp-progress-bar'}, dom.content);
            dom.progress = _.e('div', {cls: 'pp-progress'}, dom.progressbar);
            dom.error = _.e('div', {id: 'pp-apng-generator-error'}, dom.content);
            dom.preview = new w.Image();
            dom.preview.id = 'pp-apng-generator-preview';
            dom.content.appendChild(dom.preview);
            dom.warning = _.e('div', {id: 'pp-apng-generator-warning', text: _.lng.apng.warning}, dom.content);
            dom.preparing = _.e('div', {
                id: 'pp-apng-generator-preparing',
                text: _.lng.apng.preparing
            }, dom.content);
            dom.howtosave = _.e('div', {id: 'pp-apng-generator-howtosave', text: _.lng.apng.how2save}, dom.content);

            _.listen(dom.preview, 'load', function () {
                _.modal.centerize();
            });

            var that = this;
            dom.generate = this.add_action('generate', {
                text: _.lng.apng.generate,
                callback: this.generate.bind(this)
            });

            dom.dl_link = this.add_action('download', {
                text: _.lng.apng.download,
                type: 'link'
            });

            this.add_action('close');

            var retry = function () {
                that.frames = that.get_frames();
                if (that.frames) {
                    that.dom.root.classList.remove('pp-preparing');
                } else {
                    that.dom.root.classList.add('pp-preparing');
                    w.setTimeout(retry, 1000);
                }
                that.dom.generate[(that.frames ? 'remove' : 'set') + 'Attribute']('disabled', '');
            };
            retry();
        },

        generate: function () {
            this.dom.generate.setAttribute('disabled', '');
            try {
                _.apng.generate(
                    this.frames,
                    this.oncomplete.bind(this),
                    this.onerror.bind(this),
                    this.onprogress.bind(this)
                );
            } catch (ex) {
                var msg = String(ex);
                if (msg.length > 100) {
                    msg = msg.slice(0, 100) + ' ...';
                }
                this.onerror([
                    msg,
                    '',
                    'Stack:',
                    ex.stack
                ].join('\n'));
            }
        },

        onprogress: function (curr, max) {
            this.dom.progress.style.width =
                g.Math.floor(this.dom.progressbar.clientWidth * curr / max) + 'px';
        },

        onerror: function (msg) {
            this.dom.error.textContent = (msg || 'Unknown error');
            this.dom.root.classList.add('pp-error');
            _.modal.centerize();
        },

        oncomplete: function (result, b64) {
            var dom = this.dom;
            if (b64) {
                dom.preview.src = 'data:image/png;base64,' + result;
                dom.howtosave.classList.add('pp-show');
            } else {
                var dl_filename = [
                    this.illust.author_id,
                    this.illust.id,
                    this.illust.author_name,
                    this.illust.title
                ].join(' ') + '.png';

                var blob = new w.Blob(result, {type: 'image/png'});
                this.object_url = w.URL.createObjectURL(blob);
                this.dom.preview.src = this.object_url;
                this.dom.dl_link.href = this.object_url;
                this.dom.dl_link.setAttribute('download', dl_filename);
                this.dom.dl_link.classList.remove('pp-hide');
                dom.howtosave.classList.remove('pp-show');
            }
            this.dom.root.classList.add('pp-done');
        },

        revoke_object_url: function () {
            if (this.object_url) {
                w.URL.revokeObjectURL(this.object_url);
                delete this.object_url;
            }
        },

        onclose: function () {
            APNGDialog.super.onclose.call(this);
            this.revoke_object_url();
        }
    });

    _.apng.Dialog = APNGDialog;

})(function () {
    return {
        onmessage: function (ev) {
            try {
                var data = ev.data;
                var frames = data.frames;
                var transferables = [];
                frames.forEach(function (frame) {
                    if (frame.image_buf) {
                        transferables.push(frame.image_buf);
                    }
                });

                var result = this.generate_bytes(frames);
                if (data.return_b64) {
                    result = this.base64.enc(result);
                }
                self.postMessage({
                    command: 'complete',
                    data: {
                        result: result,
                        b64: data.return_b64
                    }
                });
            } catch (ex) {
                var msg = String(ex);
                if (msg.length > 100) {
                    msg = msg.slice(0, 100) + ' ...';
                }
                self.postMessage({
                    command: 'error',
                    data: [
                        msg,
                        '',
                        'Stack:',
                        ex.stack
                    ].join('\n')
                });
            }
        },

        send_progress: function (curr, max) {
            self.postMessage({
                command: 'progress',
                data: [curr, max]
            });
        },

        generate: function (frames, oncomplete, onerror, onprogress) {
            var that = this;

            this.prepare_frames(frames, function (frames, transferables) {
                var code = [
                    'apng=(', that.__mod_generator.toString(), ')();',
                    'apng.base64=(', _.base64.__mod_generator.toString(), ')();',
                    'apng.crc32=(', _.crc32.__mod_generator.toString(), ')();',
                    'onmessage=apng.onmessage.bind(apng);'
                ];

                var worker, objurl;

                if (w.Blob && w.URL) {
                    var blob = new w.Blob(code, {type: 'application/javascript'});
                    objurl = w.URL.createObjectURL(blob);
                    worker = new w.Worker(objurl);
                } else {
                    // Presto Opera support
                    worker = new w.Worker('data:application/javascript,' + w.encodeURIComponent(code.join('')));
                }

                var end = function () {
                    worker.terminate();
                    if (objurl) {
                        w.URL.revokeObjectURL(objurl);
                    }
                };

                worker.onmessage = function (ev) {
                    var data = ev.data, stop = false;

                    if (data.command === 'progress') {
                        onprogress(data.data[0], data.data[1]);
                    } else if (data.command === 'error') {
                        onerror(data.data);
                        end();
                    } else if (data.command === 'complete') {
                        oncomplete(data.data.result, data.data.b64);
                        end();
                    }
                };

                worker.onerror = function (ev) {
                    onerror(ev.message);
                    end();
                };

                worker.postMessage({
                    frames: frames,
                    return_b64: !(w.Blob && w.URL)
                }, transferables);
            }, function (msg) {
                onerror(msg);
            }, onprogress);
        },

        prepare_frames: function (frames, oncomplete, onerror, onprogress) {
            var canvas = _.e('canvas');
            canvas.style.display = 'none';
            d.body.appendChild(canvas);

            var oncomplete_ = function (frames, transferables) {
                canvas.parentNode.removeChild(canvas);
                oncomplete(frames, transferables || []);
            };

            var onerror_ = function (msg) {
                canvas.parentNode.removeChild(canvas);
                onerror(msg);
            };

            if (canvas.toBlob) {
                this.prepare_frames_by_blob(canvas, frames, oncomplete_, onerror_, onprogress);
            } else {
                this.prepare_frames_by_data_url(canvas, frames, oncomplete_, onerror_);
            }
        },

        prepare_frames_by_blob: function (canvas, frames, oncomplete, onerror, onprogress) {
            var frames_new = [], transferables = [];

            var prog = 0, prog_max = frames.length * 2;

            var next_frame = function () {
                var frame = frames.shift();
                canvas.width = frame.image.naturalWidth;
                canvas.height = frame.image.naturalHeight;
                canvas.getContext('2d').drawImage(frame.image, 0, 0);

                canvas.toBlob(function (blob) {
                    var reader = new w.FileReader();

                    reader.onload = function () {
                        frames_new.push({
                            delay: frame.delay,
                            image_buf: reader.result
                        });
                        transferables.push(reader.result);

                        onprogress(++prog, prog_max);

                        if (frames.length) {
                            next_frame();
                        } else {
                            oncomplete(frames_new, transferables);
                        }
                    };

                    reader.readAsArrayBuffer(blob);
                }, 'image/png');
            };

            next_frame();
        },

        prepare_frames_by_data_url: function (canvas, frames, oncomplete, onerror) {
            var frames_new = [];

            frames.forEach(function (frame) {
                canvas.width = frame.image.naturalWidth;
                canvas.height = frame.image.naturalHeight;
                canvas.getContext('2d').drawImage(frame.image, 0, 0);

                var url = canvas.toDataURL('image/png');
                var match = /^data:image\/png;base64,(.*)$/.exec(url);
                if (!match) {
                    onerror('Failed to parse data url');
                }

                frames_new.push({
                    delay: frame.delay,
                    image_b64: match[1]
                });
            });

            oncomplete(frames_new);
        },

        generate_bytes: function (frames) {
            var acTL = this.pack_chunk(
                [0x61, 0x63, 0x54, 0x4c], // acTL
                [
                    this.uint32(frames.length),
                    this.uint32(0) // loop count
                ]
            );

            this.seq_num = 0;

            var data = [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])];
            for (var i = 0; i < frames.length; ++i) {
                var frame = this.make_frame(frames[i], i === 0 ? acTL : null);
                data = data.concat(frame);
                this.send_progress(frames.length + i + 1, frames.length * 2);
            }

            // IEND
            data = data.concat(this.pack_chunk([73, 69, 78, 68], []));
            return data;
        },

        uint32: function (value) {
            return new Uint8Array([
                (value >> 24) & 0xff,
                (value >> 16) & 0xff,
                (value >> 8) & 0xff,
                (value >> 0) & 0xff
            ]);
        },

        uint16: function (value) {
            return new Uint8Array([
                (value >> 8) & 0xff,
                (value >> 0) & 0xff
            ]);
        },

        pack_chunk: function (type, bodies) {
            return [
                this.uint32(bodies.reduce(function (a, b) {
                    return a + b.byteLength;
                }, 0)),
                new Uint8Array(type)
            ].concat(bodies).concat([
                this.uint32(this.crc32.calc([type].concat(bodies)))
            ]);
        },

        make_frame: function (frame, acTL) {
            var that = this;

            /* chunk order:
             IHDR
             acTL frame count, play count
             fcTL 1st frame header
             IDAT 1st frame data
             fcTL 2nd frame header
             fdAT 2nd frame data
             ...
             IEND

             https://wiki.mozilla.org/APNG_Specification#Chunk_Sequence_Numbers
             */

            var data;
            if (frame.image_buf) {
                data = new Uint8Array(frame.image_buf);
            } else {
                data = this.base64.dec(frame.image_b64);
            }

            // http://www.w3.org/TR/PNG/#5PNG-file-signature
            if (data[0] !== 137 ||
                data[1] !== 80 ||
                data[2] !== 78 ||
                data[3] !== 71 ||
                data[4] !== 13 ||
                data[5] !== 10 ||
                data[6] !== 26 ||
                data[7] !== 10) {
                throw 'Invalid PNG signature';
            }

            data = data.subarray(8);

            var chunk, IHDR, IDATs = [];
            while ((chunk = this.parse_chunk(data))) {
                // http://www.w3.org/TR/PNG/#11Critical-chunks
                if (chunk.type === 'IHDR') {
                    if (IHDR) {
                        throw 'Multiple IHDR chunks detected';
                    }
                    IHDR = chunk;
                } else if (chunk.type === 'IDAT') {
                    IDATs.push(chunk);
                } else {
                    throw 'unexpected chunk type - ' + chunk.type;
                }
                data = data.subarray(chunk.size);
            }
            if (!IHDR) {
                throw 'IHDR chunk not found';
            }
            if (!IDATs.length) {
                throw 'IDAT chunk not found';
            }

            // IHDR: http://www.w3.org/TR/PNG/#11IHDR
            //   bytes
            //       4 Width
            //       4 Height
            //       1 Bit depth
            //       1 Colour type
            //       1 Compression method
            //       1 Filter method
            //       1 Interlace method

            // https://wiki.mozilla.org/APNG_Specification#.60fcTL.60:_The_Frame_Control_Chunk
            // offset
            //      0    sequence_number       (unsigned int)   Sequence number of the animation chunk, starting from 0
            //      4    width                 (unsigned int)   Width of the following frame
            //      8    height                (unsigned int)   Height of the following frame
            //     12    x_offset              (unsigned int)   X position at which to render the following frame
            //     16    y_offset              (unsigned int)   Y position at which to render the following frame
            //     20    delay_num             (unsigned short) Frame delay fraction numerator
            //     22    delay_den             (unsigned short) Frame delay fraction denominator
            //     24    dispose_op            (byte)           Type of frame area disposal to be done after rendering this frame
            //     25    blend_op              (byte)           Type of frame area rendering for this frame

            var fcTL = this.pack_chunk(
                [0x66, 0x63, 0x54, 0x4c],
                [
                    this.uint32(this.seq_num++),
                    IHDR.data.subarray(0, 8), // width, height
                    this.uint32(0), // x_offset
                    this.uint32(0), // y_offset
                    this.uint16(frame.delay), // delay_num
                    this.uint16(1000), // delay_den (1000 means that delay_num is millisecond)

                    new Uint8Array([
                        // dispose_op:
                        //   0 APNG_DISPOSE_OP_NONE
                        //   1 APNG_DISPOSE_OP_BACKGROUND
                        //   2 APNG_DISPOSE_OP_PREVIOUS
                        0,

                        // blend_op:
                        //   0 APNG_BLEND_OP_SOURCE
                        //   1 APNG_BLEND_OP_OVER
                        0
                    ])
                ]
            );

            var ret;
            if (acTL) {
                ret = [IHDR.all_data].concat(acTL, fcTL);
                IDATs.forEach(function (IDAT) {
                    ret.push(IDAT.all_data);
                });
            } else {
                ret = fcTL;
                IDATs.forEach(function (IDAT) {
                    ret = ret.concat(that.pack_chunk(
                        [0x66, 0x64, 0x41, 0x54],
                        [
                            that.uint32(that.seq_num++),
                            IDAT.data
                        ]
                    ));
                });
            }

            return ret;
        },

        parse_chunk: function (data) {
            // http://www.w3.org/TR/PNG/#5Chunk-layout

            if (data.length < 12) {
                throw 'Data terminated unexpectedly';
            }

            if (data[0] & 0x80) {
                throw 'chunk size < 0';
            }

            var data_size = (((data[0] << 24) & 0xff000000) |
                ((data[1] << 16) & 0x00ff0000) |
                ((data[2] << 8) & 0x0000ff00) |
                ((data[3] << 0) & 0x000000ff));
            var chunk_size = data_size + 12;

            if (data.length < chunk_size) {
                throw 'remaining data size < chunk size';
            }

            var chunk_type = '';
            for (var i = 4; i < 8; ++i) {
                var c = data[i];
                if ((c >= 65 && c <= 90 /* A-Z */) ||
                    (c >= 97 && c <= 122 /* a-z */)) {
                    chunk_type += String.fromCharCode(c);
                } else {
                    throw 'invalid character for chunk type - ' + c;
                }
            }

            var crc = (((data[data_size + 8] << 24) & 0xff000000) |
                ((data[data_size + 9] << 16) & 0x00ff0000) |
                ((data[data_size + 10] << 8) & 0x0000ff00) |
                ((data[data_size + 11] << 0) & 0x000000ff));

            if (chunk_type === 'IEND') {
                return null;
            }

            return {
                size: chunk_size,
                type: chunk_type,
                data: data.subarray(8, 8 + data_size),
                crc: crc,
                all_data: data.subarray(0, chunk_size)
            };
        }
    };
});
(function () {
    var svgid = 0;

    var VoteDialog = _.class.create(_.Dialog.prototype, {
        colors: ['#3465a4', '#73d216', '#cc0000', '#f57900', '#75507b', '#555753'],

        init: function (illust, get_frames) {
            var title = _.lng.vote[illust.vote.answered ? 'title_result' : 'title_vote'];
            VoteDialog.super.init.call(this, {
                title: title,
                cls: 'pp-vote-dialog',
                keys: [
                    [_.conf.key.popup_qrate_end, 'close'],
                    [_.conf.key.popup_qrate_submit, 'send_selected'],
                    [_.conf.key.popup_qrate_select_prev, 'select_prev'],
                    [_.conf.key.popup_qrate_select_next, 'select_next']
                ]
            });

            this.illust = illust;
            this.data = illust.vote;

            var q = 'Q: ' + (illust.vote.question || 'Error');
            _.e('h2', {cls: 'pp-vote-question', text: q}, this.dom.content);

            this.setup_list();
            this.setup_chart();
        },

        setup_list: function () {
            if (this.data.answered) {
                return;
            }

            var that = this;
            var list = _.e('ul', {}, this.dom.content);
            this.buttons = [];
            this.data.items.forEach(function (item, idx) {
                var label = item[0], key = item[1];
                var btn = _.e('button', {text: label, 'data-pp-key': key}, _.e('li', {}, list));
                _.onclick(btn, function () {
                    that.vote(idx);
                });
                that.buttons.push(btn);
            });
        },

        setup_chart: function () {
            var chart = this.create_chart();
            if (this.data.answered) {
                this.dom.content.appendChild(chart);
            } else {
                var exp = _.ui.expander(_.lng.vote.view_result, {
                    ontoggle: function (active) {
                        if (active) {
                            _.modal.centerize();
                        }
                    }
                });
                exp[1].appendChild(chart);
                exp[0].classList.add('pp-vote-result-expander');
                this.dom.content.appendChild(exp[0]);
            }
        },

        point: function (rad, r) {
            return [Math.cos(rad) * (r || 300) + 350, Math.sin(rad) * (r || 300) + 200];
        },

        pointstr: function (rad, r) {
            return this.point(rad, r).join(',');
        },

        create_chart: function () {
            var that = this;

            var svg = _.e('svg', {}, _.e('div', {cls: 'pp-vote-chart'})),
                defs = _.e('defs', {}, svg),
                maskid = 'pp-vote-chart-mask-' + (++svgid),
                mask = _.e('mask', {id: maskid}, defs);
            svg.setAttribute('width', '700');
            svg.setAttribute('height', '400');
            _.e('rect', {x: 0, y: 0, width: 700, height: 400, fill: '#fff'}, mask);

            var tot = this.data.stats.reduce(function (a, b) {
                    return a + b[1];
                }, 0),
                ps = 0;
            this.data.stats.slice().sort(function (a, b) {
                return b[1] - a[1];
            }).forEach(function (item, i) {
                var label = item[0], votes = item[1];

                var color = that.colors[i % that.colors.length],
                    clipid = 'pp-vote-pie-clip-' + (++svgid),
                    clippath = _.e('path', {}, _.e('clipPath', {id: clipid}, defs)),
                    pie = _.e('circle', {
                        cx: 350, cy: 200, r: 170, fill: color,
                        'clip-path': 'url(#' + clipid + ')',
                        mask: 'url(#' + maskid + ')'
                    }, svg);

                var p0 = ps / tot * 2 * Math.PI - Math.PI / 2,
                    pz = (ps + votes) / tot * 2 * Math.PI - Math.PI / 2,
                    pp = [p0];

                for (var j = 1; j < 8; ++j) {
                    var p = j / 4 * Math.PI - Math.PI / 2;
                    if (p0 < p && p < pz) {
                        pp.push(p);
                    }
                }
                pp.push(pz);


                var d = ['M350,200'].concat(pp.map(function (p) {
                    return 'L' + that.pointstr(p);
                })).join(' ') + 'z';


                // _.e('path', {d: d, fill: color}, svg);
                clippath.setAttribute('d', d);
                _.e('path', {
                    d: 'M350,200 L' + that.pointstr(pz), stroke: '#000',
                    'stroke-width': '3', 'stroke-linecap': 'round'
                }, mask);

                var pc = (ps + votes / 2) / tot * 2 * Math.PI - Math.PI / 2,
                    l1 = that.point(pc, 160),
                    l2 = that.point(pc, 180),
                    lr = l2[0] > 350,
                    l3 = [l2[0] + (lr ? 1 : -1) * 20, l2[1]];

                var l = label + ' (' + Math.round(votes / tot * 100) + '%; ' + votes + '/' + tot + ')';

                var text = _.e('text', {
                    text: l,
                    'text-anchor': lr ? 'start' : 'end',
                    'alignment-baseline': 'central',
                    x: l3[0] + (lr ? 1 : -1) * 4,
                    y: l3[1] + 3
                }, svg);

                d = [l1, l2, l3].map(function (xy, i) {
                    return (i ? 'L' : 'M') + xy.join(',');
                }).join(' ');
                _.e('path', {d: d, stroke: color, fill: 'none', 'stroke-width': '2'}, svg);

                ps += votes;
            });

            return svg;
        },

        vote: function (idx) {
            if (this.sent) {
                return;
            }

            var btn = this.buttons[idx],
                label = btn.textContent,
                key = btn.getAttribute('data-pp-key');

            this.buttons.forEach(function (btn) {
                btn.setAttribute('disabled', '1');
                btn.blur();
            });

            this.sent = true;

            var that = this;
            _.popup.status_loading();
            btn.textContent = 'Sending...';
            _.popup.api.post(
                '/rpc_rating.php',
                {
                    mode: 'save2',
                    i_id: that.illust.id,
                    u_id: _.api.uid,
                    qr: 1,
                    num: btn.getAttribute('data-pp-key'),
                    tt: _.api.token
                },
                function (res) {
                    that.close();
                    _.popup.reload();
                },
                function () {
                    btn.textContent = 'Error!';
                }
            );
        },

        select_btn: function (off) {
            var curr = this.buttons.indexOf(d.activeElement);
            off %= this.buttons.length;

            if (curr < 0) {
                curr = (off < 0 ? this.buttons.length : -1) + off;
            } else {
                curr += off;
            }

            if (curr < 0) {
                curr += this.buttons.length;
            } else if (curr >= this.buttons.length) {
                curr -= this.buttons.length;
            }

            this.buttons[curr].focus();
        },

        onkey_select_prev: function () {
            this.select_btn(-1);
            return true;
        },

        onkey_select_next: function () {
            this.select_btn(1);
            return true;
        },

        onkey_send_selected: function () {
            var idx = this.buttons.indexOf(d.activeElement);
            if (idx >= 0) {
                this.vote(idx);
                return true;
            }
            return false;
        }
    });

    _.vote = {
        VoteDialog: VoteDialog,

        run: function (illust, parent) {
            if (this.dialog) {
                this.dialog.close();
            }

            if (!illust.vote.available) {
                _.debug('pixplus.vote.run(): illust.vote.available === false');
                return;
            }

            this.dialog = new VoteDialog(illust);
            this.dialog.open(parent, {centerize: 'both'});
        }
    };
})();
// generated from:
//   src/data/config.json
//   src/data/i18n.json
//   src/data/i18n.js
//   src/data/changelog.json
//   temp/icons/config-button.scss
//   temp/icons/pixplus-24.scss
//   src/data/styles/apng-generator.scss
//   src/data/styles/commentform.scss
//   src/data/styles/tagedit.scss
//   src/data/styles/common.scss
//   src/data/styles/vote.scss
//   src/data/styles/popup.scss
//   src/data/styles/configui.scss
//   src/data/styles/bookmark.scss
//   src/data/pencil.svg
//   src/data/pencil-off.svg
//   src/data/cogwheel.svg
//   src/data/following.svg
//   src/data/heart.svg
//   src/data/mypixiv.svg
//   src/data/ugoira.svg
//   src/data/manga.svg
//   src/data/multipage.svg
//   src/data/olc-arrow.svg
//   src/data/rating-error.svg
//   src/data/comment-loading.svg
//   src/data/comment-error.svg
//   src/data/comment-reply-to.svg
//   src/data/comments.svg
//   src/data/star-white.svg
//   src/data/star-black.svg
//   src/data/response.svg
//   src/data/rm-fit-long.svg
//   src/data/rm-fit-short.svg
//   src/data/rm-original.svg
//   src/data/like-off.svg
//   src/data/like-on.svg
//   src/data/vote-off.svg
//   src/data/vote-on.svg
//   src/data/triangle.svg
//   src/data/cross.svg
//   tools/svg_generator_generator.py
_.css=".pp-apng-generator{text-align:center}.pp-apng-generator .pp-dialog-content{width:640px}.pp-apng-generator #pp-apng-generator-error{color:#800;font-weight:bold;text-align:left;white-space:pre-wrap}.pp-apng-generator.pp-done .pp-progress-bar{display:none}.pp-apng-generator #pp-apng-generator-preview{max-width:100%;max-height:480px;border:0.2em solid transparent;box-sizing:border-box}.pp-apng-generator #pp-apng-generator-howtosave:not(.pp-show){display:none}.pp-apng-generator:not(.pp-preparing) #pp-apng-generator-preparing{display:none}.pp-apng-generator:not(.pp-done) #pp-apng-generator-preview,.pp-apng-generator:not(.pp-done) .pp-dialog-action-download{display:none}.pp-apng-generator:not(.pp-error) #pp-apng-generator-error{display:none}.pp-apng-generator.pp-done #pp-apng-generator-warning,.pp-apng-generator.pp-done .pp-dialog-action-generate,.pp-apng-generator.pp-error #pp-apng-generator-warning,.pp-apng-generator.pp-error .pp-dialog-action-generate{display:none}#pp-popup-bookmark-wrapper{border:1px solid #aaa}#pp-popup-bookmark-wrapper .layout-body{margin:0px;border:none}#pp-popup-bookmark-wrapper .bookmark-detail-unit{border-radius:0px;border:none}#pp-popup-bookmark-wrapper .bookmark-list-unit{border-radius:0px;border:none;margin:0px}#pp-popup-bookmark-wrapper .tag-container{overflow-y:auto}#pp-popup-bookmark-wrapper .list-container+.list-container{margin-top:0px}#pp-popup-bookmark-wrapper ._list-unit{padding-top:4px;padding-bottom:4px}#pp-popup-bookmark-wrapper .tag-cloud{padding:4px !important}#pp-popup-bookmark-wrapper .pp-tag-select{outline:2px solid #0f0}#pp-popup-bookmark-wrapper .pp-tag-link{outline:2px solid #f00}#pp-popup-bookmark-wrapper .pp-tag-associate-button{background-color:#eee;margin-right:0.2em;border:1px solid #bbb;border-radius:0.4em;padding:0px 0.4em;color:#000}#pp-popup-bookmark-wrapper .pp-tag-associate-button.pp-active{background-color:#aaa}#pp-popup-bookmark-wrapper .pp-tag-associate-button:hover{background-color:#ddd}#pp-popup-bookmark-wrapper.pp-associate-tag .tag-container .list-items .tag,#pp-popup-bookmark-wrapper:not(.pp-associate-tag) .pp-tag-associate-button{display:none}#pp-popup.pp-bookmark-mode #pp-popup-header,#pp-popup.pp-bookmark-mode #pp-popup-image-wrapper,#pp-popup.pp-bookmark-mode .pp-popup-olc{display:none}#pp-popup:not(.pp-bookmark-mode) #pp-popup-bookmark-wrapper{display:none}.pp-vote-dialog{min-width:400px}.pp-vote-dialog .pp-vote-question{font-size:120%;text-align:center;margin:.4em}.pp-vote-dialog ul li{margin:.6em}.pp-vote-dialog ul li button{cursor:pointer;font-size:200%;text-align:center;padding:0.4em;margin:0px;background-color:#eee;box-sizing:border-box;width:100%}.pp-vote-dialog ul li button:focus{background-color:#ffc}.pp-vote-dialog ul li button:hover{background-color:#ddd}.pp-vote-dialog ul li button:active{background-color:#aaa}.pp-vote-dialog .pp-vote-result-expander{margin-top:.6em}#pp-popup-tagedit-wrapper{font-size:12px;overflow:auto}#pp-popup-tagedit-wrapper #tag-editor>div{margin:0px !important}#pp-popup.pp-tagedit-mode #pp-popup-header,#pp-popup.pp-tagedit-mode #pp-popup-image-wrapper,#pp-popup.pp-tagedit-mode .pp-popup-olc{display:none}#pp-popup:not(.pp-tagedit-mode) #pp-popup-tagedit-wrapper{display:none}.pp-commform-root{position:relative}.pp-commform-root .pp-commform-overlay{position:absolute;left:0px;right:0px;top:0px;bottom:0px;background-color:rgba(255,255,255,0.8)}.pp-commform-root .pp-commform-overlay svg{position:absolute;display:block;margin:-25px;left:50%;top:50%}.pp-commform-root .pp-commform-overlay .pp-commform-overlay-message{position:absolute;left:0px;right:0px;top:50%;margin-top:30px;text-align:center}.pp-commform-root .pp-commform-overlay .pp-commform-overlay-message:empty{display:none}.pp-commform-root .pp-commform-overlay:not(.pp-loading):not(.pp-error){display:none}.pp-commform-root .pp-commform-overlay:not(.pp-loading) .pp-icon-comment-loading{display:none}.pp-commform-root .pp-commform-overlay:not(.pp-error) .pp-icon-comment-error{display:none}.pp-commform-root .pp-commform-reply-to-wrap{position:relative}.pp-commform-root .pp-commform-reply-to-wrap .pp-icon-comment-reply-to{position:absolute;bottom:0px;width:2em;height:2em;opacity:0.2}.pp-commform-root .pp-commform-reply-to-wrap .pp-commform-reply-to{margin-left:2.4em}.pp-commform-root .pp-commform-reply-to-wrap .pp-commform-reply-to ._comment-item{border-width:0px;margin:0px 0.2em}.pp-commform-root .pp-commform-reply-to-wrap .pp-commform-reply-to .action-list{display:none}.pp-commform-root .pp-commform-form{margin:0.2em 0px;background-color:#e8f0f6;border:1px solid #d6dee5;border-radius:5px;overflow:hidden}.pp-commform-root .pp-commform-form .pp-commform-tabbar{background-color:#e8f0f6}.pp-commform-root .pp-commform-form .pp-commform-tabbar .pp-commform-tab{display:inline-block;font-weight:bold;padding:10px;background-color:#fff;border-right:1px solid #d6dee5}.pp-commform-root .pp-commform-form .pp-commform-tabbar .pp-commform-tab:not(.pp-active){cursor:pointer}.pp-commform-root .pp-commform-form .pp-commform-tabbar-top{border-bottom:1px solid #d6dee5}.pp-commform-root .pp-commform-form .pp-commform-tabbar-top .pp-commform-tab.pp-active{padding-bottom:11px;margin-bottom:-1px}.pp-commform-root .pp-commform-form .pp-commform-tabbar-bottom{border-top:1px solid #d6dee5}.pp-commform-root .pp-commform-form .pp-commform-tabbar-bottom .pp-commform-tab.pp-active{padding-top:11px;margin-top:-1px}.pp-commform-root .pp-commform-form .pp-commform-tabbar-center{text-align:center}.pp-commform-root .pp-commform-form .pp-commform-tabbar-center .pp-commform-tab:first-child{border-left:1px solid #d6dee5}.pp-commform-root .pp-commform-form .pp-commform-cont{background-color:#fff}.pp-commform-root .pp-commform-form .pp-commform-cont:not(.pp-active){display:none}.pp-commform-root .pp-commform-form .pp-commform-toolbar{padding:0.2em;background-color:#fff;border-top:1px dashed #d6dee5}.pp-commform-root .pp-commform-form .pp-commform-toolbar button{border-width:0px;background-color:transparent;font-weight:bold;padding:0.6em 0.8em;cursor:pointer}.pp-commform-root .pp-commform-form .pp-commform-toolbar .pp-commform-button-flat{border-right:1px solid #d6dee5;color:#777}.pp-commform-root .pp-commform-form .pp-commform-toolbar .pp-commform-button-flat:hover{text-decoration:underline}.pp-commform-root .pp-commform-form .pp-commform-toolbar .pp-commform-button-blue{background-color:#0096db;color:#fff;border-radius:0.2em}.pp-commform-root .pp-commform-form .pp-commform-toolbar .pp-commform-button-blue:hover{background-color:#00a7f5}.pp-commform-root .pp-commform-form .pp-commform-toolbar .pp-commform-send{float:right;padding:0.6em 1.8em}.pp-commform-root .pp-commform-form .pp-commform-cont-comment textarea{border-width:0px;padding:0.3em;width:100%;height:4em;background-color:#fff;font-size:inherit}.pp-commform-root .pp-commform-form .pp-commform-cont-comment .pp-commform-emoji{border-top:1px dashed #d6dee5;padding:0.4em}.pp-commform-root .pp-commform-form .pp-commform-cont-comment .pp-commform-emoji div{margin:3px 0px}.pp-commform-root .pp-commform-form .pp-commform-cont-comment .pp-commform-emoji img{display:inline-block;width:42px;height:42px;border:3px solid transparent;margin:0px 3px}.pp-commform-root .pp-commform-form .pp-commform-cont-comment .pp-commform-emoji img:hover{border-color:#ddd}.pp-commform-root .pp-commform-form .pp-commform-cont-stamp .pp-commform-stamp-group:not(.pp-active){display:none}.pp-commform-root .pp-commform-form .pp-commform-cont-stamp .pp-commform-stamp-group{padding:0.4em}.pp-commform-root .pp-commform-form .pp-commform-cont-stamp .pp-commform-stamp-group div{margin:3px 0px}.pp-commform-root .pp-commform-form .pp-commform-cont-stamp .pp-commform-stamp-group img{display:inline-block;width:70px;height:70px;border:3px solid transparent;margin:0px 3px}.pp-commform-root .pp-commform-form .pp-commform-cont-stamp .pp-commform-stamp-group img:hover{border-color:#ddd}.pp-commform-root .pp-commform-form .pp-commform-cont-stamp .pp-commform-tab{padding:4px 15px}.pp-commform-root .pp-commform-form .pp-commform-cont-stamp .pp-commform-tab.pp-active{padding-top:5px;margin-top:-1px}.pp-commform-root .pp-commform-form .pp-commform-cont-stamp .pp-commform-tab img{width:24px;height:24px}.pp-icons-font{font-family:\"PixplusIcons\"}.pp-control,.pp-toplevel input,.pp-toplevel button,.pp-toplevel select,.pp-toplevel textarea,.pp-expander,.pp-progress-bar{border:1px solid #becad8;border-radius:2px;padding:0.1em 0.3em;margin:0.2em}.pp-toplevel input[type=\"checkbox\"]{padding:1px}.pp-toplevel button{white-space:nowrap;background-color:#f2f4f6}.pp-toplevel button:hover{background-color:#ddeaf6}.pp-toplevel button:active{background-color:#becad8}.pp-hide{display:none}.pp-sprite{background-image:url(\"http://source.pixiv.net/www/images/sprites-sa61cacfa96.png\")}input.pp-flat-input{border:none}input.pp-flat-input:not(:hover):not(:focus){background:transparent}.pp-tooltip{position:fixed;padding:0.1em 0.3em;border-radius:2px;background-color:#333;color:#fff;white-space:nowrap;z-index:20002}.pp-tooltip:empty{display:none}.pp-slider{display:inline-block;vertical-align:middle;padding:7px 4px}.pp-slider .pp-slider-rail{position:relative;width:160px;height:2px;background-color:#aaa}.pp-slider .pp-slider-knob{position:absolute;border:1px outset #ddd;background-color:#ccc;width:6px;height:14px;margin:-7px -4px}.pp-slider.pp-debug{outline:1px solid rgba(255,0,0,0.5)}.pp-slider.pp-debug .pp-slider-rail{background-color:#0f0}.pp-slider.pp-debug .pp-slider-knob{border:1px solid #f0f;background-color:#00f;opacity:0.5}.pp-expander .pp-expander-header{display:flex;cursor:pointer}.pp-expander .pp-expander-header .pp-icon-triangle{height:1em;margin:0px 0.4em;align-self:center;transition:transform .1s linear}.pp-expander:not(.pp-active) .pp-expander-content{display:none}.pp-expander.pp-active .pp-expander-header .pp-icon-triangle{transform:rotate(90deg)}.pp-popup-menu{position:fixed;background-color:#fff;border:1px solid #aaa;border-radius:3px;padding:3px 0px;z-index:30000;white-space:pre}.pp-popup-menu .pp-popup-menu-item:hover{background-color:#ddd}.pp-popup-menu .pp-popup-menu-item>label,.pp-popup-menu .pp-popup-menu-item>a{display:block;padding:0.3em 0.6em;color:inherit;text-decoration:none}.pp-popup-menu .pp-popup-menu-item input[type=\"checkbox\"]{border:1px solid #aaa;cursor:pointer;vertical-align:bottom}.pp-progress-bar{padding:0px;margin:0.2em;background-color:#eee}.pp-progress-bar .pp-progress{background-color:#d6dee5;width:0px;height:2em}.pp-dialog{position:fixed;z-index:22000;background-color:#c0c9d2;border:1px solid #6082a1;padding:2px}.pp-dialog .pp-dialog-title{display:flex;margin-bottom:2px}.pp-dialog .pp-dialog-title .pp-dialog-title-text{display:block;text-align:center;font-weight:bold;flex-grow:1}.pp-dialog .pp-dialog-title .pp-dialog-title-rightbox{display:block;height:1em;align-self:center;margin-right:0.2em}.pp-dialog .pp-dialog-title .pp-dialog-title-rightbox svg{display:block;height:1em;cursor:pointer}.pp-dialog .pp-dialog-content{border:1px solid #6082a1;background-color:#fff}.pp-dialog .pp-dialog-actions{text-align:center}.pp-dialog .pp-dialog-actions button{border:1px solid #6082a1}.pp-dialog .pp-dialog-actions .pp-dialog-action+.pp-dialog-action{margin-left:0.2em}.pp-float{position:fixed;top:0px;z-index:90}.column-action-menu.pp-float:not(:hover){opacity:0.6}#pp-search-header{background-color:#fff}#pp-search-header.pp-float:not(:hover){opacity:0.6}#pp-search-size-custom input[type=\"text\"]{width:3em;padding:0px;height:auto;border:1px solid #eee}#pp-search-ratio-custom-text{width:3em;padding:0px;height:auto}#pp-search-ratio-custom-preview{display:none}input[type=\"range\"]:active ~ #pp-search-ratio-custom-preview,.pp-slider.pp-active ~ #pp-search-ratio-custom-preview,input[type=\"text\"]:focus ~ #pp-search-ratio-custom-preview{display:block}#pp-search-ratio-custom-preview{position:absolute;margin-top:0.4em}#pp-search-ratio-custom-preview div{background-color:#ccc}.pp-bookmark-tag-list ul+ul:not(.tagCloud){border-top:2px solid #dae1e7}.pp-bookmark-tag-list ul+ul.tagCloud{border-bottom:2px solid #dae1e7}#pp-popup{position:fixed;border:2px solid #aaa;background-color:#fff;padding:0.2em;z-index:20000;box-sizing:border-box;display:flex;flex-direction:column}#pp-popup .pp-popup-content{flex-grow:1}#pp-popup #pp-popup-title{font-size:120%;font-weight:bold;line-height:1em;margin-bottom:0.1em;display:flex;justify-content:space-between}#pp-popup #pp-popup-rightbox>*{margin-left:0.2em}#pp-popup #pp-popup-rightbox .pp-icons-font{color:#888;cursor:pointer}#pp-popup #pp-popup-rightbox .pp-icons-font:hover{text-decoration:none}#pp-popup #pp-popup-rightbox svg{cursor:pointer;width:1em;height:1em;display:inline-block;vertical-align:middle;opacity:0.4}#pp-popup #pp-popup-rightbox svg:hover{opacity:0.8}#pp-popup #pp-popup-rightbox #pp-popup-button-vote .pp-icon-vote-on{opacity:1}#pp-popup #pp-popup-rightbox #pp-popup-button-vote:not(.pp-active) .pp-icon-vote-on{display:none}#pp-popup #pp-popup-rightbox #pp-popup-button-vote.pp-active .pp-icon-vote-off{display:none}#pp-popup #pp-popup-rightbox #pp-popup-button-like .pp-icon-like-on{opacity:1}#pp-popup #pp-popup-rightbox #pp-popup-button-like:not(.pp-active) .pp-icon-like-on{display:none}#pp-popup #pp-popup-rightbox #pp-popup-button-like.pp-active .pp-icon-like-off{display:none}#pp-popup #pp-popup-rightbox #pp-popup-button-bookmark .pp-icon-star-black{opacity:1}#pp-popup #pp-popup-rightbox #pp-popup-button-bookmark:not(.pp-active) .pp-icon-star-black{display:none}#pp-popup #pp-popup-rightbox #pp-popup-button-bookmark.pp-active .pp-icon-star-white{display:none}#pp-popup #pp-popup-rightbox #pp-popup-button-resize-mode[data-pp-resize-mode=\"L\"] .pp-icon-rm-fit-short,#pp-popup #pp-popup-rightbox #pp-popup-button-resize-mode[data-pp-resize-mode=\"L\"] .pp-icon-rm-original{display:none}#pp-popup #pp-popup-rightbox #pp-popup-button-resize-mode[data-pp-resize-mode=\"S\"] .pp-icon-rm-fit-long,#pp-popup #pp-popup-rightbox #pp-popup-button-resize-mode[data-pp-resize-mode=\"S\"] .pp-icon-rm-original{display:none}#pp-popup #pp-popup-rightbox #pp-popup-button-resize-mode[data-pp-resize-mode=\"O\"] .pp-icon-rm-fit-short,#pp-popup #pp-popup-rightbox #pp-popup-button-resize-mode[data-pp-resize-mode=\"O\"] .pp-icon-rm-fit-long{display:none}#pp-popup #pp-popup-rightbox #pp-popup-button-manga svg{opacity:1}#pp-popup #pp-popup-status{position:relative}#pp-popup #pp-popup-status-text{color:#888}#pp-popup #pp-popup-status-text:empty{display:none}#pp-popup.pp-error #pp-popup-status-text{color:#a00;font-weight:bold}#pp-popup:not(.pp-ugoira) #pp-popup-ugoira-status{display:none}#pp-popup:not(.pp-ugoira-playing) .pp-icon-ugoira-playing{display:none}#pp-popup:not(.pp-ugoira-paused) .pp-icon-ugoira-paused{display:none}#pp-popup:not(.pp-vote) #pp-popup-button-vote{display:none}#pp-popup #pp-popup-header{position:absolute;left:0px;right:0px;padding:0px 0.2em;background-color:#fff;line-height:1.1em;z-index:20001}#pp-popup #pp-popup-header:not(.pp-show):not(:hover){opacity:0}#pp-popup #pp-popup-header .pp-popup-separator{border-top:1px solid #aaa;margin-top:0.1em;padding-top:0.1em}#pp-popup #pp-popup-header #pp-popup-caption-wrapper{overflow-y:auto}#pp-popup:not(.pp-comment-mode) #pp-popup-comment-wrapper{display:none}#pp-popup #pp-popup-comment-toolbar{margin:0.4em 1em 0.2em 1em}#pp-popup #pp-popup-comment-toolbar button{margin-right:0.4em}#pp-popup #pp-popup-comment-toolbar button svg{width:2em;height:2em}#pp-popup .pp-popup-comment-btn{cursor:pointer;border:1px solid transparent;border-radius:3px;opacity:0.2;background-color:transparent}#pp-popup .pp-popup-comment-btn:hover{border-color:#000}#pp-popup .pp-popup-comment-btn:focus:not(:hover):not(:active):not(.pp-active){border:1px dashed #000}#pp-popup .pp-popup-comment-btn:active,#pp-popup .pp-popup-comment-btn.pp-active{opacity:0.4;border-color:#000}#pp-popup .pp-popup-comment-btn svg{display:block}#pp-popup:not(.pp-show-comment-form) .pp-icon-pencil-off{display:none}#pp-popup.pp-show-comment-form .pp-icon-pencil{display:none}#pp-popup ._comment-form-container{display:none}#pp-popup:not(.pp-show-comment-form) #pp-popup-comment-form-cont{display:none}#pp-popup #pp-popup-comment #pp-popup-comment-form-cont{margin:0 20px}#pp-popup #pp-popup-comment #pp-popup-comment-comments ul{margin:0.8em}#pp-popup #pp-popup-comment #pp-popup-comment-comments ul li+li{margin-top:0.8em}#pp-popup #pp-popup-comment .pp-popup-comment-item{display:flex}#pp-popup #pp-popup-comment .pp-popup-comment-item .pp-popup-comment-user-image{display:block;width:40px;height:40px;border-radius:20px;background-size:cover}#pp-popup #pp-popup-comment .pp-popup-comment-item .pp-popup-comment-user-image[style*=\"/common/images/no_profile\"]{background-position:50%;background-size:110%}#pp-popup #pp-popup-comment .pp-popup-comment-item .pp-popup-comment-body{padding-left:0.6em}#pp-popup #pp-popup-comment .pp-popup-comment-item .pp-popup-comment-body *+*{margin-top:0.2em}#pp-popup #pp-popup-comment .pp-popup-comment-item .pp-popup-comment-user-name{display:block;color:#333;font-weight:bold}#pp-popup #pp-popup-comment .pp-popup-comment-item .pp-popup-comment-text{display:block;color:#666}#pp-popup #pp-popup-comment .pp-popup-comment-item .pp-popup-comment-emoji{width:24px;height:24px}#pp-popup #pp-popup-comment .pp-popup-comment-item .pp-popup-comment-stamp{display:block;width:96px;height:96px}#pp-popup #pp-popup-comment .pp-popup-comment-item .pp-popup-comment-info{display:block;color:#999}#pp-popup #pp-popup-comment .pp-popup-comment-item .pp-popup-comment-info span{margin-left:0.6em;color:#009cff;cursor:pointer}#pp-popup #pp-popup-comment .pp-popup-comment-item .pp-popup-comment-info span:hover{text-decoration:underline}#pp-popup #pp-popup-comment .pp-popup-comment-item .pp-popup-comment-display-replies{display:inline-block;padding:0.4em 1em;background-color:#eee;border-radius:0.8em;cursor:pointer;box-sizing:border-box}#pp-popup #pp-popup-comment .pp-popup-comment-item .pp-popup-comment-display-replies:hover{background-color:#e4e4e4}#pp-popup.pp-hide-stamp-comments #pp-popup-comment .pp-popup-comment-item-stamp{display:none}#pp-popup #pp-popup-taglist{margin:0px;padding:0px;background:none}#pp-popup #pp-popup-taglist ul{display:inline}#pp-popup #pp-popup-taglist ul li{display:inline;margin:0px 0.6em 0px 0px;padding:0px;border:0px;box-shadow:none;background:none}#pp-popup #pp-popup-taglist .no-item{color:#aaa;margin-right:0.6em}#pp-popup #pp-popup-taglist.pp-no-pixpedia a[href^=\"http://dic.pixiv.net/\"],#pp-popup #pp-popup-taglist.pp-no-pixpedia a[href^=\"https://dic.pixiv.net/\"],#pp-popup #pp-popup-taglist.pp-no-pixiv-comic a[href^=\"http://comic.pixiv.net/\"],#pp-popup #pp-popup-taglist.pp-no-pixiv-comic a[href^=\"https://comic.pixiv.net/\"],#pp-popup #pp-popup-taglist.pp-no-booth a[href^=\"http://booth.pm/\"],#pp-popup #pp-popup-taglist.pp-no-booth a[href^=\"https://booth.pm/\"]{display:none}#pp-popup #pp-popup-taglist #pp-popup-tagedit-button{opacity:0.4;cursor:pointer}#pp-popup #pp-popup-taglist #pp-popup-tagedit-button:hover{opacity:0.8}#pp-popup #pp-popup-taglist #pp-popup-tagedit-button svg{width:1em;height:1em;vertical-align:middle}#pp-popup #pp-popup-rating{display:none}#pp-popup #pp-popup-rating *{margin:0px;padding:0px}#pp-popup #pp-popup-rating .rating.pp-error .rate{display:none}#pp-popup #pp-popup-rating .pp-icon-rating-error{position:absolute;width:260px;height:26px;left:0px;top:0px}#pp-popup #pp-popup-rating .rating:not(.pp-error) .pp-icon-rating-error{display:none}#pp-popup #pp-popup-rating .score dl,#pp-popup #pp-popup-rating .score dt,#pp-popup #pp-popup-rating .score dd{display:inline}#pp-popup #pp-popup-rating .score dt{margin-right:0.2em}#pp-popup #pp-popup-rating .score dd{margin-right:0.6em}#pp-popup #pp-popup-rating .questionnaire{text-align:inherit}#pp-popup #pp-popup-rating .questionnaire input[type=\"button\"]:focus{outline:2px solid #0f0}#pp-popup #pp-popup-info{padding-bottom:0.1em}#pp-popup #pp-popup-author-image{max-height:3.2em;float:left;border:1px solid #aaa;margin-right:0.2em}#pp-popup #pp-popup-author-image:hover{max-height:none}#pp-popup #pp-popup-author-status{position:absolute;left:3px;margin:2px}#pp-popup #pp-popup-author-status:not(.pp-hide){display:inline-block}#pp-popup #pp-popup-author-status svg{display:block;width:1.2em;height:1.2em;min-width:16px;min-height:16px}#pp-popup #pp-popup-author-status:not(.pp-fav) .pp-icon-following,#pp-popup #pp-popup-author-status.pp-fav-m .pp-icon-following,#pp-popup #pp-popup-author-status.pp-mypix .pp-icon-following{display:none}#pp-popup #pp-popup-author-status:not(.pp-fav-m) .pp-icon-heart,#pp-popup #pp-popup-author-status.pp-mypix .pp-icon-heart{display:none}#pp-popup #pp-popup-author-status:not(.pp-mypix) .pp-icon-mypixiv{display:none}#pp-popup #pp-popup-author-image:hover ~ #pp-popup-author-status{display:none}#pp-popup #pp-popup-tools{margin-left:0.6em}#pp-popup #pp-popup-tools:empty{display:none}#pp-popup #pp-popup-tools a+a{margin-left:0.6em}#pp-popup #pp-popup-ugoira-info{margin-left:0.6em}#pp-popup:not(.pp-ugoira) #pp-popup-ugoira-info{display:none}#pp-popup #pp-popup-author-links a{margin-right:0.6em;font-weight:bold}#pp-popup #pp-popup-image-wrapper{line-height:0;border:1px solid #aaa;position:relative;overflow:hidden}#pp-popup #pp-popup-image-scroller{width:100%;height:100%}#pp-popup #pp-popup-image-layout{display:inline-block}#pp-popup #pp-popup-image-layout img{display:inline-block}#pp-popup .pp-popup-olc{position:absolute;cursor:pointer;opacity:0;top:0px;height:100%;line-height:0px}#pp-popup .pp-popup-olc.pp-active:hover{opacity:0.6}#pp-popup .pp-popup-olc svg{position:relative}#pp-popup #pp-popup-olc-prev{left:0px}#pp-popup #pp-popup-olc-next svg{transform:matrix(-1, 0, 0, 1, 0, 0)}#pp-popup .pp-icon-multipage{position:absolute;opacity:0.8;right:0px;bottom:0px}#pp-popup:not(.pp-frontpage-new) .pp-icon-multipage{display:none}#pp-config-btn1{margin-left:2px;cursor:pointer;display:inline-block;vertical-align:top;border:3px solid #f2f4f6;background:#f2f4f6 url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAWCAYAAADEtGw7AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAFEwAABRMBWjvKTwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAJaSURBVDiNtZTPS1RRGIaf79wBDYksQ3MREaiNTiAty3CcTQuFSr1a9Ce0C6LIRYVBm5YtihYRQkjqmNCq1e3SD4kWkWEzmmiUizIZikiwvOdr4cwwIzrjDPSuzvnec5773u9wDvwnSSFzwp/bb3WtG6ENpVWFGmAHwrIoMyr6zAQMd8eaP20LPOonTjjIJYUYYIqEC4BHEgpd6GlrWNoUPP480aRW7rIOzGgWdNioeY1jl9YsFaIcEJEuwAUq0uu+i+qpno7mySzY87xQyqm/gjIAVGaIqpx3O8J3too69mI6IkFoArQhXfqpQrvbHp4yQ0/fVaXMvgmUwVwogBjzuVAP3OORaSXoBH6lS7tE9YHneSFTVVnxBKQrbSwWAm0Kj7Z8ROR2TpwjKaf+tEGysAQqPaWCAQKjQ3kF5awhcAaAFYFx1ewvlaS+tkOzwEpOqcX0xhoXAzhc+du5UQ4UQEQU+JZTqjEA/dHwQmdn42q5YACFeM70S6hcUNyfuQZ6HbCIOWnQUat6EQBhqtitKpSxNj0wqrYuUPM3awX2XtmJN8qNNr4F5LG3UN0dO/ijIFjVdoy8mp7sPxZJAYz7ycsKu9Pu0ZwXwY37ySYAZfU98DDvrRjzZsJiNLGBbxWu2r3BLWfZ2c4BT/VGw63FerwKGCO6ZxvAPBVphfYJ5iuwsz8S+TPmJ88IWr3uyjkgml45BLwEEGSuKFiMY3vbm95k5m40PJIZx/1kawasiO9Gw/dz9+a1QhwdzI9sbxb6cCHlJ1Zq822p22qjIB8UnQexau18uQFK1j86/dLViN7vDQAAAABJRU5ErkJggg==\") no-repeat 6px 1px}#pp-config-btn1:hover{background-color:#ddeaf6;border-color:#ddeaf6}#pp-config-btn1.pp-active{position:relative;z-index:10001;background-color:#fff;height:27px;border-color:#becad8;border-bottom:none;border-radius:0px 5px 0px 0px}#pp-config-btn1-wrapper{position:relative}#pp-config-btn1-wrapper #pp-config{position:absolute;z-index:10000;top:27px;left:-400px;width:800px;background-color:#fff;border:3px solid #becad8;border-radius:10px}#pp-config-btn1-wrapper #pp-config .pp-config-tab:first-child:hover{margin:-1px 0px 0px -1px;border-top-left-radius:8px;border:1px solid #becad8;border-right:none;border-bottom:none}#pp-config-btn-fallback{position:fixed;right:0px;top:0px;opacity:0.2;padding:16px;cursor:pointer;background-repeat:no-repeat;background-position:center;background-image:url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAFiQAABYkBbWid+gAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAJjSURBVEiJtZRPSFRRFMZ/585zdMrQBN0VmjMpVlAkhVCrpKJFixa2KIhW4phB+4ho0SpI1BkYkYJoG0EJZosWFoSm1MIEZxokI5MyNLA/Tu+922Km6b3n2Ewz9G0u5zvnft8553Ef/GdI3oqh1zWslR1DaAPZDdQCAWAJrRcQGQNrhHDz7L8ZROPtID3AccCfpw0NPEbsK3Q1TfzdIDp7GNQN4IBHYByYAr2IiA+kHk0b6CZHnQlcpyt4FRHtNrg5V0252Q+cdV0QfQ3LuMOFHW/X962FWKIdW4aA7Y5MhK5gDyI6bdCf3IPPHvYUAXwlHKpcvxEP+hK1GDIBuv4PKZ2Eg4PCQPIIyr4HVOW4WpgBQCR5CLGfOpgVbDOoUDriEH8CxAsS9KK78RnCmIOpRozTCmEgQ3zB5ATCalEGAMgDd8hJhVqJAdNohrkYWiteHMD2voUGRWfrT0xaqQ2eK00cEPnsYbYaAKV3nkFNaool/0tgX4b5aJQkGInvRWQc8IPM0hFsJpp46DB4rkoyQOrI/kb0tvQhqWxaq8HSJsgFI3ULy/8IdCXdjS/yGShuz1VwvuFHlhlI7kTpLZkWQ67a6Jv9WJnIZAYgn0GA7+Z7IokRfKqXxflXKHsaKMtRWwF6Mhv59H3gVCHfoAbhDLZ9kJY6tYF4LpQD5DNYA3qBmbRwiwV8Kkhe5APkX5FJOHQJgL5EOR1iAXXZbCRxFGE0E30jHNrsFXBPEJssQ6dHy+ZjC5uAoh+j28CqugzscjABzNW7xQj/hndF74BlFyMyt3F7ZhxtjIL40Hq+lEaKxi8x57FLc3TbGQAAAABJRU5ErkJggg==\")}#pp-config-btn-fallback:hover,#pp-config-btn-fallback.pp-active{opacity:1}#pp-config-btn-fallback-wrapper #pp-config{position:fixed;background-color:#fff;width:800px;border:3px solid #becad8;border-radius:10px}#pp-config-btn-fallback-wrapper #pp-config .pp-config-tab:first-child:hover{margin:-1px 0px 0px -1px;border-top-left-radius:8px;border:1px solid #becad8;border-right:none;border-bottom:none}#pp-config{line-height:1.2em}#pp-config:not(.pp-show){display:none}#pp-config ul{padding:0px;margin:0px;list-style-type:none}#pp-config li{display:block}#pp-config table{border-collapse:collapse;border-spacing:0px}#pp-config table td{padding:0px 0.2em}#pp-config label{cursor:pointer}#pp-config #pp-config-tabbar{border-bottom:2px solid #becad8}#pp-config #pp-config-tabbar label{cursor:pointer}#pp-config #pp-config-tabbar .pp-config-tab{display:inline-block;padding:0.4em 0.6em;font-weight:bold}#pp-config #pp-config-tabbar .pp-config-tab:hover{background-color:#d6dee5}#pp-config #pp-config-tabbar .pp-config-tab.pp-active{background-color:#becad8}#pp-config #pp-config-close-button{padding:0.4em}#pp-config #pp-config-content-wrapper{padding:0.4em;overflow-x:visible;overflow-y:auto}#pp-config .pp-config-content{display:none}#pp-config .pp-config-content.pp-active{display:block}#pp-config .pp-config-content tr:nth-child(even):not(.pp-config-subsection-title) td{background-color:#f2f4f6}#pp-config .pp-config-content dl{margin-top:1.2em}#pp-config .pp-config-content dl dt{margin-top:0.4em}#pp-config .pp-config-content dl dd{margin-left:1em}#pp-config .pp-config-content .pp-config-subsection-title div{font-weight:bold;border-bottom:1px solid #becad8;border-left:0.8em solid #becad8;margin-top:1.6em;margin-bottom:0.4em;padding:0.3em 0.2em}#pp-config .pp-config-content-header{border-bottom:1px solid #ccc;padding-bottom:0.1em;margin-bottom:0.2em}#pp-config #pp-config-bookmark-content textarea{width:100%;height:20em;box-sizing:border-box;margin-bottom:1em}#pp-config #pp-config-bookmark-tag-aliases{width:100%}#pp-config #pp-config-bookmark-tag-aliases td:last-child{width:100%}#pp-config #pp-config-bookmark-tag-aliases td:last-child input{width:100%;box-sizing:border-box}#pp-config #pp-config-importexport-toolbar{margin-bottom:0.2em}#pp-config #pp-config-importexport-toolbar button{margin-right:0.2em}#pp-config #pp-config-importexport-content textarea{width:100%;height:30em;box-sizing:border-box}#pp-config #pp-config-debug-key td{border:1px solid #aaa;padding:0.1em 0.2em}#pp-config #pp-config-debug-content .pp-config-debug-section{margin-top:1.6em}#pp-config #pp-config-debug-content .pp-config-subsection-title div{margin-top:0px}#pp-config input.pp-active{background-color:#ffc}#pp-config #pp-config-about-content ul{display:block}.pp-config-editor .pp-dialog-content{padding:0.2em}.pp-config-regexp-editor textarea{width:100%;height:10em;margin:0px;box-sizing:border-box}.pp-config-regexp-editor table{white-space:pre}.pp-config-regexp-editor .pp-config-regexp-editor-status{font-weight:bold}.pp-config-regexp-editor .pp-config-regexp-editor-status.pp-yes{color:green}.pp-config-regexp-editor .pp-config-regexp-editor-status.pp-no{color:red}\n";
_.conf.__schema=[{"items": [{"value": false, "key": "bookmark_hide"}, {"value": 1, "key": "float_tag_list"}, {"value": false, "key": "disable_effect"}, {"value": 0, "key": "fast_user_bookmark"}, {"value": 1, "key": "redirect_jump_page"}, {"value": false, "key": "disable_profile_popup"}, {"hide": true, "value": "", "key": "commform_default_tab"}, {"value": false, "key": "debug"}], "name": "general"}, {"items": [{"value": true, "key": "preload"}, {"value": false, "key": "big_image"}, {"value": 0.4, "key": "caption_height"}, {"value": 160, "key": "caption_minheight"}, {"value": 0.9, "key": "caption_opacity"}, {"value": false, "key": "remove_pixpedia"}, {"value": false, "key": "remove_pixiv_comic"}, {"value": false, "key": "remove_booth"}, {"value": "", "key": "font_size"}, {"value": 0, "key": "auto_manga"}, {"value": "^http://www\\.pixiv\\.net/(?:(?:bookmark_new_illust|member_illust|ranking|bookmark)\\.php|$)", "key": "auto_manga_regexp", "editor": "Regexp"}, {"value": true, "key": "manga_viewed_flags"}, {"value": 0, "key": "reverse"}, {"value": "^http://www\\.pixiv\\.net/(?:bookmark_new_illust|member_illust)\\.php", "key": "reverse_regexp", "editor": "Regexp"}, {"value": 0.3, "key": "overlay_control"}, {"value": 32, "key": "scroll_height"}, {"value": 0.8, "key": "scroll_height_page"}, {"value": true, "key": "author_status_icon"}, {"hide": true, "value": false, "key": "show_comment_form"}, {"value": false, "key": "hide_stamp_comments"}, {"value": 2, "key": "mouse_wheel"}, {"value": 1, "key": "mouse_wheel_delta"}, {"value": 4, "key": "fit_short_threshold"}, {"value": true, "key": "mark_visited"}, {"value": 2, "key": "manga_page_action"}, {"value": 0, "key": "minimum_size"}], "name": "popup"}, {"items": [{"value": "", "key": "layout_history"}], "hide": true, "name": "mypage"}, {"items": [{"value": "Backspace,a,k", "key": "popup_prev"}, {"value": "Left", "key": "popup_prev_direction"}, {"value": "Space,j", "key": "popup_next"}, {"value": "Right", "key": "popup_next_direction"}, {"value": "Home", "key": "popup_first"}, {"value": "End", "key": "popup_last"}, {"value": "Escape,q", "key": "popup_close"}, {"value": "Up", "key": "popup_caption_scroll_up"}, {"value": "Down", "key": "popup_caption_scroll_down"}, {"value": "c", "key": "popup_caption_toggle"}, {"value": "Shift+c", "key": "popup_comment_toggle"}, {"value": "Up", "key": "popup_illust_scroll_up"}, {"value": "Down", "key": "popup_illust_scroll_down"}, {"value": "Left", "key": "popup_illust_scroll_left"}, {"value": "Right", "key": "popup_illust_scroll_right"}, {"value": "Home", "key": "popup_illust_scroll_top"}, {"value": "End", "key": "popup_illust_scroll_bottom"}, {"value": "PageUp", "key": "popup_illust_page_up"}, {"value": "PageDown", "key": "popup_illust_page_down"}, {"value": "w", "key": "popup_switch_resize_mode"}, {"value": "Shift+f,Shift+o", "key": "popup_open"}, {"value": "f,o", "key": "popup_open_big"}, {"value": "e", "key": "popup_open_profile"}, {"value": "r", "key": "popup_open_illust"}, {"value": "t", "key": "popup_open_bookmark"}, {"value": "y", "key": "popup_open_staccfeed"}, {"value": "Shift+r", "key": "popup_open_response"}, {"value": "g", "key": "popup_reload"}, {"value": "Shift+b", "key": "popup_open_bookmark_detail"}, {"value": "Shift+v", "key": "popup_open_manga_thumbnail"}, {"value": "Shift+1,Shift+!", "key": "popup_rate10"}, {"value": "m", "key": "popup_ugoira_play_pause"}, {"value": "comma", "key": "popup_ugoira_prev_frame"}, {"value": ".", "key": "popup_ugoira_next_frame"}, {"value": "b", "key": "popup_bookmark_start", "subsection": "bookmark"}, {"value": "Enter,Space", "key": "popup_bookmark_submit", "subsection": "bookmark"}, {"value": "Escape", "key": "popup_bookmark_end", "subsection": "bookmark"}, {"value": "v", "key": "popup_manga_start", "subsection": "manga"}, {"value": "Shift+f", "key": "popup_manga_open_page", "subsection": "manga"}, {"value": "v,Escape", "key": "popup_manga_end", "subsection": "manga"}, {"value": "d", "key": "popup_qrate_start", "subsection": "question"}, {"value": "Up,k", "key": "popup_qrate_select_prev", "subsection": "question"}, {"value": "Down,j", "key": "popup_qrate_select_next", "subsection": "question"}, {"value": "Enter,Space", "key": "popup_qrate_submit", "subsection": "question"}, {"value": "Escape,d", "key": "popup_qrate_end", "subsection": "question"}, {"value": "", "key": "popup_tag_edit_start", "subsection": "tagedit"}, {"value": "Escape", "key": "popup_tag_edit_end", "subsection": "tagedit"}], "name": "key", "editor": "Key"}, {"items": [{"value": "", "key": "tag_order"}, {"value": "", "key": "tag_aliases"}], "name": "bookmark"}, {"items": [{"value": 0, "key": "delay"}, {"editor_opts": {"valid_values": ["/member_illust.php", "/bookmark_add.php", "/rpc_rating.php", "/rpc_tag_edit.php", "/rpc_delete_comment.php", "/rpc/get_comment.php", "/rpc/post_comment.php", "/rpc/index.php"]}, "value": "/member_illust.php,/bookmark_add.php,/rpc_rating.php,/rpc_tag_edit.php,/rpc_delete_comment.php,/rpc/get_comment.php,/rpc/post_comment.php,/rpc/index.php", "key": "allow_urls", "editor": "Checklist"}], "hide": true, "name": "xhr"}];
_.i18n={"en": {"ugoira_prev_frame": "Previous frame (#{key})", "mypage_layout_history_help": "Click list item to restore layout.", "delete_comment_confirm": "Delete comment?", "vote": {"title_result": "Poll result", "title_vote": "Vote", "view_result": "View result"}, "search_wlt": "Min width <=", "cancel": "Cancel", "conf": {"bookmark": {"tag_order": "Reorder tags. 1 tag per line.\n-: Separator\n*: Others", "tag_aliases": "Tag association. Used for auto input. Separate by space."}, "popup": {"rate_key": "Enable rate keys", "caption_minheight": "Caption minimum height (px)", "author_status_icon": "Show icon on profile image", "overlay_control": "Click area width (0:disable; x<1:ratio to popup width; x>1:pixel)", "scroll_height": "Scroll step (px)", "auto_manga_regexp": "Regular expression for \"Switch manga...\" setting.", "caption_opacity": "Caption opacity", "remove_pixpedia": "Remove pixiv encyclopedia icon", "mark_visited": "Mark link as visited", "big_image": "Use original size image", "show_comment_form": "Show comment form by default", "hide_stamp_comments": "Hide stamp comments", "scroll_height_page": "Scroll step for PageUp/PageDown", "fit_short_threshold": "Aspect ratio threshold for switch resize mode (0:Disable)", "remove_pixiv_comic": "Remove pixiv comic icon", "mouse_wheel": {"hint": ["Do nothing", "Move to prev/next illust", "Move to prev/next illust (respect \"reverse\" setting)"], "desc": "Mouse wheel operation"}, "preload": "Enable preloading", "manga_page_action": {"hint": ["Do nothing", "Open popup", "Open popup in manga mode"], "desc": "Open popup in manga page"}, "minimum_size": "Minimum image size (enlarge images which is smaller than this value; 0:disable; x<1:ratio to window size; x>1:pixel)", "mouse_wheel_delta": "Threshold for mouse wheel setting (if set negative value, invert direction)", "auto_manga": {"hint": ["Disable", "Enable", "Specify pages by regexp"], "desc": "Switch manga-mode automatically"}, "rate_confirm": "Show confirmation dialog when rating", "reverse_regexp": "Regular expression for \"Reverse...\" setting.", "manga_viewed_flags": "Do not start manga mode automatically if you have already read it", "font_size": "Font size (e.g. 10px)", "reverse": {"hint": ["Disable", "Enable", "Specify pages by regexp"], "desc": "Reverse move direction"}, "remove_booth": "Remove booth icon", "caption_height": "Caption height (ratio)"}, "key": {"popup_open_profile": "Open profile", "popup_caption_scroll_up": "Scroll caption up", "popup_prev_direction": "Move to previous illust (ignore \"reverse\" setting)", "popup_rate10": "Like", "popup_manga_end": "End manga mode", "popup_ugoira_next_frame": "[Ugoira] Show next frame", "popup_open_big": "Open image", "popup_bookmark_submit": "Send", "popup_switch_resize_mode": "Switch resize mode", "popup_illust_scroll_up": "Scroll illust up", "popup_illust_scroll_down": "Scroll illust down", "popup_illust_scroll_bottom": "Scroll illust to bottom", "popup_open_manga_thumbnail": "Open manga thumbnail page", "popup_qrate_select_next": "Select next item", "popup_ugoira_play_pause": "[Ugoira] Play/Pause", "popup_qrate_start": "Start questionnaire mode", "popup_manga_open_page": "Open manga page", "popup_qrate_submit": "Send", "popup_open": "Open illust page", "popup_illust_scroll_right": "Scroll illust right", "popup_qrate_select_prev": "Select previous item", "popup_next": "Move to next illust", "popup_illust_scroll_top": "Scroll illust to top", "popup_first": "Move to first illust", "popup_ugoira_prev_frame": "[Ugoira] Show previous frame", "popup_prev": "Move to previous illust", "popup_open_illust": "Open works", "popup_tag_edit_start": "Start tag edit mode", "popup_bookmark_start": "Start bookmark mode", "popup_tag_edit_end": "End tag edit mode", "popup_reload": "Reload", "popup_illust_page_up": "Scroll illust up (PageUp)", "popup_illust_page_down": "Scroll illust down (PageDown)", "popup_caption_toggle": "Toggle caption display", "popup_caption_scroll_down": "Scroll caption down", "popup_next_direction": "Move to next illust (ignore \"reverse\" setting)", "popup_bookmark_end": "End bookmark mode", "popup_comment_toggle": "Toggle comment", "popup_open_staccfeed": "Open feed", "popup_open_bookmark_detail": "Open bookmark information page", "popup_open_bookmark": "Open bookmark", "popup_last": "Move to last illust", "popup_qrate_end": "End questionnaire mode", "popup_close": "Close", "popup_illust_scroll_left": "Scroll illust left", "popup_manga_start": "Start manga mode", "popup_open_response": "Open image response"}, "general": {"disable_profile_popup": "Disable profile card popup", "commform_default_tab": {"hint": ["comment", "stamp"], "desc": "Default tab of comment form"}, "fast_user_bookmark": {"hint": ["Disable", "Enable (public)", "Enable (private)"], "desc": "Follow user by one-click"}, "redirect_jump_page": {"hint": ["Disable", "Open target", "Modify link"], "desc": "Redirect jump.php"}, "float_tag_list": {"hint": ["Disable", "Enable"], "desc": "Enable float view for tag list"}, "debug": "Debug mode", "bookmark_hide": "Make private bookmark by default", "disable_effect": "Disable UI animation"}}, "importing": "Importing", "reply_comment": "Reply", "ugoira_how_to_use": "How to use?", "search_hgt": "<= Max height", "associate_tags": "Associate tags", "pref": {"key_question": "Tag edit mode", "releasenote": "Release note", "general": "General", "export": "Export", "about_license": "License", "close": "Close", "key_manga": "Manga mode", "importexport": "Import/Export", "bookmark": "Bookmark tag", "regex_valid": "Valid", "add": "Add", "import": "Import", "popup": "Popup", "key_bookmark": "Bookmark mode", "about_web": "Web", "key": "Key", "about_email": "Mail", "about": "About", "changelog": "Changelog", "default": "Default", "debug": "Debug", "regex_invalid": "Invalid"}, "score_view": "Views", "delete_comment": "Delete", "tooltip": {"tagedit": "Start tag edit mode", "vote_off": "Vote (#{key})", "like_off": "Like (#{key})", "resize_mode": "Cycle resize mode (#{key})", "comments": "Toggle comments (#{key})", "manga_mode_off": "End manga mode (#{key})", "bookmark_on": "Edit bookmark (#{key})", "vote_on": "View poll result (#{key})", "like_on": "", "bookmark_off": "Add bookmark (#{key})", "manga_mode_on": "Start manga mode (#{key})", "image_response": "Image response (#{key})"}, "author_bookmarks": "Bookmarks", "score_rated": "Like", "search_wgt": "<= Max width", "commform": {"tab_stamp": "Stickers", "comment_placeholder": "Write a comment...", "tab_comment": "Comments", "btn_send": "Send", "btn_emoji": "Emoji"}, "display_replies": "Display Replies", "ugoira_next_frame": "Next frame (#{key})", "search_hlt": "Min height <=", "mypage_layout_history": "Layout history", "ugoira_generate_apng": "Generate APNG", "ugoira_download_zip": "Download zip", "mypage_layout_history_empty": "Layout history is empty", "author_staccfeed": "Feed", "ugoira_play_pause": "Play/Pause (#{key})", "rate_confirm": "Rate it?\n$pointpt", "__name__": "en", "sending": "Sending", "apng": {"title": "APNG generator", "how2save": "To save image, right click and select \"Save Image As\".", "download": "Download", "warning": "WARNING: This may take a long time and uses much of memory.", "preparing": "Preparing...", "cancel": "Cancel", "close": "Close", "generate": "Generate"}, "ugoira_generate_timecode": "Generate timecode", "delete_tag_confirm": "Really remove?\nYour member id will be notified to the author.", "dialog": {"cancel": "Cancel", "close": "Close", "yes": "Yes", "add": "Add", "no": "No"}, "author_works": "Works"}, "ja": {"ugoira_prev_frame": "\u30b3\u30de\u623b\u3057 (#{key})", "mypage_layout_history_help": "\u30ea\u30b9\u30c8\u3092\u30af\u30ea\u30c3\u30af\u3059\u308b\u3068\u30ec\u30a4\u30a2\u30a6\u30c8\u3092\u5fa9\u5143\u3057\u307e\u3059\u3002", "delete_comment_confirm": "\u30b3\u30e1\u30f3\u30c8\u3092\u524a\u9664\u3057\u307e\u3059\u304b\uff1f", "vote": {"title_result": "\u30a2\u30f3\u30b1\u30fc\u30c8\u7d50\u679c", "title_vote": "\u30a2\u30f3\u30b1\u30fc\u30c8\u306b\u7b54\u3048\u308b", "view_result": "\u7d50\u679c\u3092\u898b\u308b"}, "search_wlt": "\u5e45\u306e\u6700\u5c0f\u5024 <=", "cancel": "\u4e2d\u6b62", "conf": {"bookmark": {"tag_order": "\u30d6\u30c3\u30af\u30de\u30fc\u30af\u30bf\u30b0\u306e\u4e26\u3079\u66ff\u3048\u3068\u30b0\u30eb\u30fc\u30d4\u30f3\u30b0\u30021\u884c1\u30bf\u30b0\u3002\n-: \u30bb\u30d1\u30ec\u30fc\u30bf\n*: \u6b8b\u308a\u5168\u90e8", "tag_aliases": "\u30bf\u30b0\u306e\u95a2\u9023\u4ed8\u3051\u3002\u81ea\u52d5\u5165\u529b\u306b\u4f7f\u7528\u3059\u308b\u3002\u30b9\u30da\u30fc\u30b9\u533a\u5207\u308a\u3002"}, "popup": {"rate_key": "\u8a55\u4fa1\u306e\u30ad\u30fc\u30d0\u30a4\u30f3\u30c9\u3092\u6709\u52b9\u306b\u3059\u308b", "caption_minheight": "\u30ad\u30e3\u30d7\u30b7\u30e7\u30f3\u306e\u9ad8\u3055\u306e\u6700\u5c0f\u5024(px)", "author_status_icon": "\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb\u753b\u50cf\u306e\u5de6\u4e0a\u306b\u30a2\u30a4\u30b3\u30f3\u3092\u8868\u793a\u3059\u308b", "overlay_control": "\u79fb\u52d5\u77e2\u5370\u306e\u5e45(0:\u4f7f\u7528\u3057\u306a\u3044; x<1:\u30dd\u30c3\u30d7\u30a2\u30c3\u30d7\u306e\u5e45\u306b\u5bfe\u3059\u308b\u5272\u5408; x>1:\u30d4\u30af\u30bb\u30eb)", "scroll_height": "\u30b9\u30af\u30ed\u30fc\u30eb\u5e45(px)", "auto_manga_regexp": "\"\u81ea\u52d5\u7684\u306b\u30de\u30f3\u30ac\u30e2\u30fc\u30c9\u3092\u958b\u59cb\u3059\u308b\"\u3067\u4f7f\u7528\u3059\u308b\u6b63\u898f\u8868\u73fe", "caption_opacity": "\u30ad\u30e3\u30d7\u30b7\u30e7\u30f3\u306e\u4e0d\u900f\u660e\u5ea6", "remove_pixpedia": "pixiv\u767e\u79d1\u4e8b\u5178\u30a2\u30a4\u30b3\u30f3\u3092\u9664\u53bb\u3059\u308b", "mark_visited": "\u30ea\u30f3\u30af\u3092\u8a2a\u554f\u6e08\u307f\u306b\u3059\u308b", "big_image": "\u539f\u5bf8\u306e\u753b\u50cf\u3092\u8868\u793a\u3059\u308b", "show_comment_form": "\u30b3\u30e1\u30f3\u30c8\u306e\u6295\u7a3f\u30d5\u30a9\u30fc\u30e0\u3092\u30c7\u30d5\u30a9\u30eb\u30c8\u3067\u8868\u793a\u3059\u308b", "hide_stamp_comments": "\u30b9\u30bf\u30f3\u30d7\u306e\u30b3\u30e1\u30f3\u30c8\u3092\u975e\u8868\u793a\u306b\u3059\u308b", "scroll_height_page": "PageUp/PageDown\u306e\u30b9\u30af\u30ed\u30fc\u30eb\u5e45", "fit_short_threshold": "\u30ea\u30b5\u30a4\u30ba\u30e2\u30fc\u30c9\u3092\u5207\u308a\u66ff\u3048\u308b\u7e26\u6a2a\u6bd4\u306e\u95be\u5024(0:\u7121\u52b9)", "remove_pixiv_comic": "pixiv\u30b3\u30df\u30c3\u30af\u30a2\u30a4\u30b3\u30f3\u3092\u9664\u53bb\u3059\u308b", "mouse_wheel": {"hint": ["\u4f55\u3082\u3057\u306a\u3044", "\u524d/\u6b21\u306e\u30a4\u30e9\u30b9\u30c8\u306b\u79fb\u52d5", "\u524d/\u6b21\u306e\u30a4\u30e9\u30b9\u30c8\u306b\u79fb\u52d5(\u53cd\u8ee2\u306e\u8a2d\u5b9a\u306b\u5f93\u3046)"], "desc": "\u30de\u30a6\u30b9\u30db\u30a4\u30fc\u30eb\u306e\u52d5\u4f5c"}, "preload": "\u5148\u8aad\u307f\u3092\u4f7f\u7528\u3059\u308b", "manga_page_action": {"hint": ["\u4f55\u3082\u3057\u306a\u3044", "\u30dd\u30c3\u30d7\u30a2\u30c3\u30d7\u3092\u958b\u304f", "\u30dd\u30c3\u30d7\u30a2\u30c3\u30d7\u3092\u30de\u30f3\u30ac\u30e2\u30fc\u30c9\u3067\u958b\u304f"], "desc": "\u6f2b\u753b\u4f5c\u54c1\u306e\u30da\u30fc\u30b8\u3067\u30dd\u30c3\u30d7\u30a2\u30c3\u30d7\u3092\u958b\u304f"}, "minimum_size": "\u6700\u5c0f\u30b5\u30a4\u30ba (\u3053\u306e\u5024\u3088\u308a\u5c0f\u3055\u3044\u753b\u50cf\u3092\u62e1\u5927\u3057\u3066\u8868\u793a; 0:\u7121\u52b9; x<1:\u753b\u9762\u30b5\u30a4\u30ba\u306b\u5bfe\u3059\u308b\u5272\u5408; x>1:\u30d4\u30af\u30bb\u30eb)", "mouse_wheel_delta": "\u30db\u30a4\u30fc\u30eb\u8a2d\u5b9a\u306e\u95be\u5024(\u8ca0\u6570\u306e\u5834\u5408\u306f\u65b9\u5411\u3092\u53cd\u8ee2)", "auto_manga": {"hint": ["\u7121\u52b9", "\u6709\u52b9", "\u30da\u30fc\u30b8\u3092\u6b63\u898f\u8868\u73fe\u3067\u6307\u5b9a"], "desc": "\u81ea\u52d5\u7684\u306b\u30de\u30f3\u30ac\u30e2\u30fc\u30c9\u3092\u958b\u59cb\u3059\u308b"}, "rate_confirm": "\u30a4\u30e9\u30b9\u30c8\u3092\u8a55\u4fa1\u3059\u308b\u6642\u306b\u78ba\u8a8d\u3092\u3068\u308b", "reverse_regexp": "\"\u79fb\u52d5\u65b9\u5411\u3092\u53cd\u5bfe\u306b\u3059\u308b\"\u3067\u4f7f\u7528\u3059\u308b\u6b63\u898f\u8868\u73fe", "manga_viewed_flags": "\u65e2\u306b\u8aad\u3093\u3060\u30de\u30f3\u30ac\u306f\u81ea\u52d5\u3067\u30de\u30f3\u30ac\u30e2\u30fc\u30c9\u3092\u958b\u59cb\u3057\u306a\u3044", "font_size": "\u30d5\u30a9\u30f3\u30c8\u30b5\u30a4\u30ba(\u4f8b: 10px)", "reverse": {"hint": ["\u7121\u52b9", "\u6709\u52b9", "\u30da\u30fc\u30b8\u3092\u6b63\u898f\u8868\u73fe\u3067\u6307\u5b9a"], "desc": "\u79fb\u52d5\u65b9\u5411\u3092\u53cd\u5bfe\u306b\u3059\u308b"}, "remove_booth": "BOOTH\u30a2\u30a4\u30b3\u30f3\u3092\u9664\u53bb\u3059\u308b", "caption_height": "\u30ad\u30e3\u30d7\u30b7\u30e7\u30f3\u306e\u9ad8\u3055(\u7387)"}, "key": {"popup_open_profile": "\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb\u3092\u958b\u304f", "popup_caption_scroll_up": "\u30ad\u30e3\u30d7\u30b7\u30e7\u30f3\u3092\u4e0a\u306b\u30b9\u30af\u30ed\u30fc\u30eb\u3059\u308b", "popup_prev_direction": "\u524d\u306e\u30a4\u30e9\u30b9\u30c8\u306b\u79fb\u52d5(\"\u53cd\u5bfe\u306b\u3059\u308b\"\u30aa\u30d7\u30b7\u30e7\u30f3\u306b\u5f71\u97ff\u3055\u308c\u306a\u3044)", "popup_rate10": "\u3044\u3044\u306d\uff01", "popup_manga_end": "\u30de\u30f3\u30ac\u30e2\u30fc\u30c9\u7d42\u4e86", "popup_ugoira_next_frame": "[\u3046\u3054\u30a4\u30e9] \u30b3\u30de\u9001\u308a", "popup_open_big": "\u30a4\u30e9\u30b9\u30c8\u753b\u50cf\u3092\u958b\u304f", "popup_bookmark_submit": "\u9001\u4fe1", "popup_switch_resize_mode": "\u30ea\u30b5\u30a4\u30ba\u30e2\u30fc\u30c9\u3092\u5207\u308a\u66ff\u3048\u308b", "popup_illust_scroll_up": "\u30a4\u30e9\u30b9\u30c8\u3092\u4e0a\u306b\u30b9\u30af\u30ed\u30fc\u30eb\u3059\u308b", "popup_illust_scroll_down": "\u30a4\u30e9\u30b9\u30c8\u3092\u4e0b\u306b\u30b9\u30af\u30ed\u30fc\u30eb\u3059\u308b", "popup_illust_scroll_bottom": "\u30a4\u30e9\u30b9\u30c8\u3092\u4e0b\u7aef\u306b\u30b9\u30af\u30ed\u30fc\u30eb\u3059\u308b", "popup_open_manga_thumbnail": "\u30de\u30f3\u30ac\u30b5\u30e0\u30cd\u30a4\u30eb\u30da\u30fc\u30b8\u3092\u958b\u304f", "popup_qrate_select_next": "\u6b21\u306e\u9078\u629e\u80a2\u3092\u9078\u629e", "popup_ugoira_play_pause": "[\u3046\u3054\u30a4\u30e9] \u518d\u751f/\u4e00\u6642\u505c\u6b62", "popup_qrate_start": "\u30a2\u30f3\u30b1\u30fc\u30c8\u30e2\u30fc\u30c9\u958b\u59cb", "popup_manga_open_page": "\u8868\u793a\u3057\u3066\u3044\u308b\u30da\u30fc\u30b8\u3092\u958b\u304f\u3002", "popup_qrate_submit": "\u9001\u4fe1", "popup_open": "\u30a4\u30e9\u30b9\u30c8\u30da\u30fc\u30b8\u3092\u958b\u304f", "popup_illust_scroll_right": "\u30a4\u30e9\u30b9\u30c8\u3092\u53f3\u306b\u30b9\u30af\u30ed\u30fc\u30eb\u3059\u308b", "popup_qrate_select_prev": "\u524d\u306e\u9078\u629e\u80a2\u3092\u9078\u629e", "popup_next": "\u6b21\u306e\u30a4\u30e9\u30b9\u30c8\u306b\u79fb\u52d5", "popup_illust_scroll_top": "\u30a4\u30e9\u30b9\u30c8\u3092\u4e0a\u7aef\u306b\u30b9\u30af\u30ed\u30fc\u30eb\u3059\u308b", "popup_first": "\u6700\u521d\u306e\u30a4\u30e9\u30b9\u30c8\u306b\u79fb\u52d5", "popup_ugoira_prev_frame": "[\u3046\u3054\u30a4\u30e9] \u30b3\u30de\u623b\u3057", "popup_prev": "\u524d\u306e\u30a4\u30e9\u30b9\u30c8\u306b\u79fb\u52d5", "popup_open_illust": "\u4f5c\u54c1\u4e00\u89a7\u3092\u958b\u304f", "popup_tag_edit_start": "\u30bf\u30b0\u7de8\u96c6\u30e2\u30fc\u30c9\u958b\u59cb", "popup_bookmark_start": "\u30d6\u30c3\u30af\u30de\u30fc\u30af\u7de8\u96c6\u30e2\u30fc\u30c9\u958b\u59cb", "popup_tag_edit_end": "\u30bf\u30b0\u7de8\u96c6\u30e2\u30fc\u30c9\u7d42\u4e86", "popup_reload": "\u30ea\u30ed\u30fc\u30c9", "popup_illust_page_up": "\u30a4\u30e9\u30b9\u30c8\u3092\u4e0a\u306b\u30b9\u30af\u30ed\u30fc\u30eb\u3059\u308b (PageUp)", "popup_illust_page_down": "\u30a4\u30e9\u30b9\u30c8\u3092\u4e0b\u306b\u30b9\u30af\u30ed\u30fc\u30eb\u3059\u308b (PageDown)", "popup_caption_toggle": "\u30ad\u30e3\u30d7\u30b7\u30e7\u30f3\u306e\u5e38\u6642\u8868\u793a/\u81ea\u52d5\u8868\u793a\u3092\u5207\u308a\u66ff\u3048\u308b", "popup_caption_scroll_down": "\u30ad\u30e3\u30d7\u30b7\u30e7\u30f3\u3092\u4e0b\u306b\u30b9\u30af\u30ed\u30fc\u30eb\u3059\u308b", "popup_next_direction": "\u6b21\u306e\u30a4\u30e9\u30b9\u30c8\u306b\u79fb\u52d5(\"\u53cd\u5bfe\u306b\u3059\u308b\"\u30aa\u30d7\u30b7\u30e7\u30f3\u306b\u5f71\u97ff\u3055\u308c\u306a\u3044)", "popup_bookmark_end": "\u30d6\u30c3\u30af\u30de\u30fc\u30af\u7de8\u96c6\u30e2\u30fc\u30c9\u7d42\u4e86", "popup_comment_toggle": "\u30b3\u30e1\u30f3\u30c8\u8868\u793a\u3092\u5207\u308a\u66ff\u3048", "popup_open_staccfeed": "\u30d5\u30a3\u30fc\u30c9\u3092\u958b\u304f", "popup_open_bookmark_detail": "\u30d6\u30c3\u30af\u30de\u30fc\u30af\u8a73\u7d30\u30da\u30fc\u30b8\u3092\u958b\u304f", "popup_open_bookmark": "\u30d6\u30c3\u30af\u30de\u30fc\u30af\u3092\u958b\u304f", "popup_last": "\u6700\u5f8c\u306e\u30a4\u30e9\u30b9\u30c8\u306b\u79fb\u52d5", "popup_qrate_end": "\u30a2\u30f3\u30b1\u30fc\u30c8\u30e2\u30fc\u30c9\u7d42\u4e86", "popup_close": "\u9589\u3058\u308b", "popup_illust_scroll_left": "\u30a4\u30e9\u30b9\u30c8\u3092\u5de6\u306b\u30b9\u30af\u30ed\u30fc\u30eb\u3059\u308b", "popup_manga_start": "\u30de\u30f3\u30ac\u30e2\u30fc\u30c9\u958b\u59cb", "popup_open_response": "\u30a4\u30e1\u30fc\u30b8\u30ec\u30b9\u30dd\u30f3\u30b9\u4e00\u89a7\u3092\u958b\u304f"}, "general": {"disable_profile_popup": "\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb\u30ab\u30fc\u30c9\u306e\u30dd\u30c3\u30d7\u30a2\u30c3\u30d7\u3092\u7121\u52b9\u5316\u3059\u308b", "commform_default_tab": {"hint": ["comment", "stamp"], "desc": "\u30b3\u30e1\u30f3\u30c8\u30d5\u30a9\u30fc\u30e0\u306e\u30c7\u30d5\u30a9\u30eb\u30c8\u30bf\u30d6"}, "fast_user_bookmark": {"hint": ["\u7121\u52b9", "\u6709\u52b9(\u516c\u958b)", "\u6709\u52b9(\u975e\u516c\u958b)"], "desc": "\u30ef\u30f3\u30af\u30ea\u30c3\u30af\u3067\u30e6\u30fc\u30b6\u30fc\u3092\u30d5\u30a9\u30ed\u30fc\u3059\u308b"}, "redirect_jump_page": {"hint": ["\u7121\u52b9", "\u30da\u30fc\u30b8\u3092\u958b\u304f", "\u30ea\u30f3\u30af\u3092\u5909\u66f4"], "desc": "jump.php\u3092\u30ea\u30c0\u30a4\u30ec\u30af\u30c8\u3059\u308b"}, "float_tag_list": {"hint": ["\u7121\u52b9", "\u6709\u52b9"], "desc": "\u30bf\u30b0\u30ea\u30b9\u30c8\u3092\u30d5\u30ed\u30fc\u30c8\u8868\u793a\u3059\u308b"}, "debug": "\u30c7\u30d0\u30c3\u30b0\u30e2\u30fc\u30c9", "bookmark_hide": "\u30d6\u30c3\u30af\u30de\u30fc\u30af\u975e\u516c\u958b\u3092\u30c7\u30d5\u30a9\u30eb\u30c8\u306b\u3059\u308b", "disable_effect": "\u30a2\u30cb\u30e1\u30fc\u30b7\u30e7\u30f3\u306a\u3069\u306e\u30a8\u30d5\u30a7\u30af\u30c8\u3092\u7121\u52b9\u5316\u3059\u308b"}}, "importing": "\u30a4\u30f3\u30dd\u30fc\u30c8\u4e2d", "reply_comment": "\u8fd4\u4fe1", "ugoira_how_to_use": "\u4f7f\u3044\u65b9", "search_hgt": "<= \u9ad8\u3055\u306e\u6700\u5927\u5024", "associate_tags": "\u30bf\u30b0\u3092\u95a2\u9023\u4ed8\u3051\u308b", "pref": {"key_question": "\u30a2\u30f3\u30b1\u30fc\u30c8\u30e2\u30fc\u30c9", "releasenote": "\u30ea\u30ea\u30fc\u30b9\u30ce\u30fc\u30c8", "general": "\u5168\u822c", "export": "\u30a8\u30af\u30b9\u30dd\u30fc\u30c8", "about_license": "\u30e9\u30a4\u30bb\u30f3\u30b9", "close": "\u9589\u3058\u308b", "key_manga": "\u30de\u30f3\u30ac\u30e2\u30fc\u30c9", "importexport": "\u30a4\u30f3\u30dd\u30fc\u30c8/\u30a8\u30af\u30b9\u30dd\u30fc\u30c8", "bookmark": "\u30d6\u30c3\u30af\u30de\u30fc\u30af\u30bf\u30b0", "regex_valid": "\u6709\u52b9", "add": "\u8ffd\u52a0", "key_tagedit": "\u30bf\u30b0\u7de8\u96c6\u30e2\u30fc\u30c9", "import": "\u30a4\u30f3\u30dd\u30fc\u30c8", "popup": "\u30dd\u30c3\u30d7\u30a2\u30c3\u30d7", "key_bookmark": "\u30d6\u30c3\u30af\u30de\u30fc\u30af\u7de8\u96c6\u30e2\u30fc\u30c9", "about_web": "\u30a6\u30a7\u30d6\u30b5\u30a4\u30c8", "key": "\u30ad\u30fc", "about_email": "\u30e1\u30fc\u30eb", "about": "\u60c5\u5831", "changelog": "\u66f4\u65b0\u5c65\u6b74", "default": "\u30c7\u30d5\u30a9\u30eb\u30c8", "debug": "\u30c7\u30d0\u30c3\u30b0", "regex_invalid": "\u4e0d\u6b63"}, "score_view": "\u95b2\u89a7\u6570", "delete_comment": "\u524a\u9664", "tooltip": {"tagedit": "\u30bf\u30b0\u7de8\u96c6\u30e2\u30fc\u30c9\u958b\u59cb", "vote_off": "\u30a2\u30f3\u30b1\u30fc\u30c8\u306b\u7b54\u3048\u308b (#{key})", "like_off": "\u3044\u3044\u306d\uff01 (#{key})", "resize_mode": "\u30ea\u30b5\u30a4\u30ba\u30e2\u30fc\u30c9\u5207\u308a\u66ff\u3048 (#{key})", "comments": "\u30b3\u30e1\u30f3\u30c8\u3092\u8868\u793a (#{key})", "manga_mode_off": "\u30de\u30f3\u30ac\u30e2\u30fc\u30c9\u7d42\u4e86 (#{key})", "bookmark_on": "\u30d6\u30c3\u30af\u30de\u30fc\u30af\u3092\u7de8\u96c6 (#{key})", "vote_on": "\u30a2\u30f3\u30b1\u30fc\u30c8\u7d50\u679c\u3092\u898b\u308b (#{key})", "like_on": "", "bookmark_off": "\u30d6\u30c3\u30af\u30de\u30fc\u30af\u306b\u8ffd\u52a0 (#{key})", "manga_mode_on": "\u30de\u30f3\u30ac\u30e2\u30fc\u30c9\u958b\u59cb (#{key})", "image_response": "\u30a4\u30e1\u30fc\u30b8\u30ec\u30b9\u30dd\u30f3\u30b9 (#{key})"}, "author_bookmarks": "\u30d6\u30c3\u30af\u30de\u30fc\u30af", "score_rated": "\u3044\u3044\u306d\uff01", "search_wgt": "<= \u5e45\u306e\u6700\u5927\u5024", "commform": {"tab_stamp": "\u30b9\u30bf\u30f3\u30d7", "comment_placeholder": "\u30b3\u30e1\u30f3\u30c8\u3059\u308b...", "tab_comment": "\u30b3\u30e1\u30f3\u30c8", "btn_send": "\u9001\u4fe1", "btn_emoji": "\u7d75\u6587\u5b57"}, "display_replies": "\u8fd4\u4fe1\u3092\u898b\u308b", "ugoira_next_frame": "\u30b3\u30de\u9001\u308a (#{key})", "search_hlt": "\u9ad8\u3055\u306e\u6700\u5c0f\u5024 <=", "mypage_layout_history": "\u30ec\u30a4\u30a2\u30a6\u30c8\u306e\u5c65\u6b74", "ugoira_generate_apng": "APNG\u3092\u751f\u6210", "ugoira_download_zip": "zip\u3092\u30c0\u30a6\u30f3\u30ed\u30fc\u30c9", "mypage_layout_history_empty": "\u5c65\u6b74\u304c\u7a7a\u3067\u3059", "author_staccfeed": "\u30d5\u30a3\u30fc\u30c9", "ugoira_play_pause": "\u518d\u751f/\u4e00\u6642\u505c\u6b62 (#{key})", "rate_confirm": "\u8a55\u4fa1\u3057\u307e\u3059\u304b\uff1f\n$point\u70b9", "__name__": "ja", "sending": "\u9001\u4fe1\u4e2d", "apng": {"title": "APNG\u30b8\u30a7\u30cd\u30ec\u30fc\u30bf", "how2save": "\u753b\u50cf\u3092\u4fdd\u5b58\u3059\u308b\u306b\u306f\u53f3\u30af\u30ea\u30c3\u30af\u3057\u3066\u300c\u753b\u50cf\u3092\u4fdd\u5b58\u300d\u3092\u9078\u629e\u3057\u3066\u304f\u3060\u3055\u3044\u3002", "download": "\u30c0\u30a6\u30f3\u30ed\u30fc\u30c9", "warning": "\u6ce8\u610f: \u9577\u3044\u6642\u9593\u304c\u304b\u304b\u308a\u30e1\u30e2\u30ea\u3092\u305f\u304f\u3055\u3093\u6d88\u8cbb\u3059\u308b\u3053\u3068\u304c\u3042\u308a\u307e\u3059\u3002", "preparing": "\u6e96\u5099\u4e2d...", "cancel": "\u30ad\u30e3\u30f3\u30bb\u30eb", "close": "\u9589\u3058\u308b", "generate": "\u751f\u6210"}, "ugoira_generate_timecode": "\u30bf\u30a4\u30e0\u30b3\u30fc\u30c9\u3092\u751f\u6210", "delete_tag_confirm": "\u3053\u306e\u30bf\u30b0\u3092\u524a\u9664\u3057\u307e\u3059\u304b\uff1f\n*\u6295\u7a3f\u8005\u306b\u30e6\u30fc\u30b6\u30fcID\u304c\u901a\u77e5\u3055\u308c\u307e\u3059\u3002", "dialog": {"cancel": "\u30ad\u30e3\u30f3\u30bb\u30eb", "close": "\u9589\u3058\u308b", "yes": "\u306f\u3044", "add": "\u8ffd\u52a0", "no": "\u3044\u3044\u3048"}, "author_works": "\u4f5c\u54c1"}};
_.extend(_.i18n, {
    setup: function () {
        var lng;
        if (d.documentElement) {
            lng = _.i18n[d.documentElement.lang];
        }
        if (!lng && g.navigator) {
            lng = _.i18n[g.navigator.language];
        }
        _.lng = lng || _.i18n.en;
    },

    key_subst: function (msg, key) {
        return msg.replace('#{key}', {'comma': ',', 'plus': '+'}[key] || key);
    }
});
_.changelog=[{"date": "2018/08/18", "changes_i18n": {"ja": ["[\u4fee\u6b63] \u30b3\u30fc\u30c9\u30d5\u30a9\u30fc\u30de\u30c3\u30c8\u4fee\u6b63"]}, "version": "1.19.4", "releasenote": ""}, {"date": "2018/03/11", "changes_i18n": {"en": ["[Fix] Quick fix for the problem that pixplus was completely broken."], "ja": ["[\u4fee\u6b63] \u5b8c\u5168\u306b\u52d5\u304b\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u306e\u3092\u3068\u308a\u3042\u3048\u305a\u76f4\u3057\u305f\u3002"]}, "version": "1.19.3", "releasenote": "http://crckyl.hatenablog.com/entry/2018/03/11/pixplus_1.19.3"}, {"date": "2017/09/07", "changes_i18n": {"en": ["[Fix] New implementation for pixiv's voting feature.", "[Fix] Fix author informations area.", "[Fix] Fix preferences button."], "ja": ["[\u4fee\u6b63] \u30a2\u30f3\u30b1\u30fc\u30c8\u6a5f\u80fd\u3092\u518d\u5b9f\u88c5\u3002", "[\u4fee\u6b63] \u4f5c\u8005\u6b04\u304c\u58ca\u308c\u3066\u3044\u305f\u306e\u3092\u4fee\u6b63\u3002", "[\u4fee\u6b63] \u8a2d\u5b9a\u30dc\u30bf\u30f3\u3092\u4fee\u6b63\u3002"]}, "version": "1.19.2", "releasenote": "http://crckyl.hatenablog.com/entry/2017/09/07/pixplus_1.19.2"}, {"date": "2017/04/30", "changes_i18n": {"en": ["[Fix] Support 'Like'"], "ja": ["[\u4fee\u6b63] \u300c\u3044\u3044\u306d\uff01\u300d\u3092\u30b5\u30dd\u30fc\u30c8\u3002"]}, "version": "1.19.1", "releasenote": "http://crckyl.hatenablog.com/entry/2017/04/30/pixplus_1.19.1"}, {"date": "2017/04/19", "changes_i18n": {"en": ["[Fix] Support for new pixiv's URL that starts with 'https:'.", "[Remove] Temporary disable the rating feature."], "ja": ["[\u4fee\u6b63] 'https:'\u304b\u3089\u59cb\u307e\u308bpixiv\u306e\u65b0\u3057\u3044URL\u306b\u5bfe\u5fdc\u3002", "[\u524a\u9664] \u4e00\u6642\u7684\u306b\u8a55\u4fa1\u6a5f\u80fd\u3092\u524a\u9664\u3002"]}, "version": "1.19.0", "releasenote": "http://crckyl.hatenablog.com/entry/2017/04/19/pixplus_1.19.0"}, {"date": "2017/03/23", "changes_i18n": {"en": ["[Fix] Sometimes 'Disable profile card popup' option doesn't works.", "[Fix] pixplus rarely reports errors with multi-page works.", "[Fix] Tag editor was not working.", "[Fix] Support for pixiv's one-click bookmark feature.", "[Change] Improve UI design."], "ja": ["[\u4fee\u6b63] \u300c\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb\u30ab\u30fc\u30c9\u306e\u30dd\u30c3\u30d7\u30a2\u30c3\u30d7\u3092\u7121\u52b9\u5316\u3059\u308b\u300d\u30aa\u30d7\u30b7\u30e7\u30f3\u304c\u52d5\u304b\u306a\u3044\u3053\u3068\u304c\u3042\u308b\u30d0\u30b0\u3092\u4fee\u6b63\u3002", "[\u4fee\u6b63] \u8907\u6570\u30da\u30fc\u30b8\u4f5c\u54c1\u3067\u7a00\u306b\u30a8\u30e9\u30fc\u304c\u51fa\u308b\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002", "[\u4fee\u6b63] \u30bf\u30b0\u7de8\u96c6\u6a5f\u80fd\u304c\u52d5\u304b\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002", "[\u4fee\u6b63] pixiv\u306e\u30ef\u30f3\u30af\u30ea\u30c3\u30af\u30d6\u30c3\u30af\u30de\u30fc\u30af\u6a5f\u80fd\u306b\u5bfe\u5fdc\u3002", "[\u5909\u66f4] UI\u30c7\u30b6\u30a4\u30f3\u3092\u6539\u5584\u3002"]}, "version": "1.18.1", "releasenote": "http://crckyl.hatenablog.com/entry/2017/03/23/pixplus_1.18.1"}, {"date": "2017/03/05", "changes_i18n": {"en": ["[Add] Re-implement comment posting feature."], "ja": ["[\u8ffd\u52a0] \u30b3\u30e1\u30f3\u30c8\u6295\u7a3f\u6a5f\u80fd\u3092\u518d\u5b9f\u88c5\u3002"]}, "version": "1.18.0", "releasenote": "http://crckyl.hatenablog.com/entry/2017/03/05/pixplus_1.18.0"}, {"date": "2017/01/25", "changes_i18n": {"en": ["[Add] Add an option to specify minimum size of popup.", "[Add] Re-implement 'Disable profile card popup' option.", "[Fix] Fix an issue that thumbnail-menu opens popup.", "[Fix] Fix an issue that pixplus never stops loading when opening user's own works."], "ja": ["[\u8ffd\u52a0] \u30dd\u30c3\u30d7\u30a2\u30c3\u30d7\u306e\u6700\u5c0f\u30b5\u30a4\u30ba\u3092\u6307\u5b9a\u3059\u308b\u30aa\u30d7\u30b7\u30e7\u30f3\u3092\u8ffd\u52a0\u3002", "[\u8ffd\u52a0] \u300c\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb\u30ab\u30fc\u30c9\u306e\u30dd\u30c3\u30d7\u30a2\u30c3\u30d7\u3092\u7121\u52b9\u5316\u3059\u308b\u300d\u30aa\u30d7\u30b7\u30e7\u30f3\u3092\u518d\u5b9f\u88c5\u3002", "[\u4fee\u6b63] \u30b5\u30e0\u30cd\u30a4\u30eb\u30e1\u30cb\u30e5\u30fc\u3092\u30af\u30ea\u30c3\u30af\u3057\u3066\u3082\u30dd\u30c3\u30d7\u30a2\u30c3\u30d7\u304c\u958b\u3044\u3066\u3057\u307e\u3046\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002", "[\u4fee\u6b63] \u30e6\u30fc\u30b6\u30fc\u81ea\u8eab\u306b\u3088\u308b\u4f5c\u54c1\u3092\u30dd\u30c3\u30d7\u30a2\u30c3\u30d7\u3067\u958b\u3051\u306a\u3044\u30d0\u30b0\u3092\u4fee\u6b63\u3002"]}, "version": "1.17.0", "releasenote": "http://crckyl.hatenablog.com/entry/2017/01/25/pixplus_1.17.0"}, {"date": "2017/01/22", "changes_i18n": {"en": ["[Remove] Remove 'Disable profile card popup' option.", "[Remove] Remove posting comment feature.", "[Fix] Rating feature was not working.", "[Fix] Bookmark mode was not working.", "[Fix] Tag edit mode was not working.", "[Fix] Fix support of polling feature."], "ja": ["[\u524a\u9664] \u300c\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb\u30ab\u30fc\u30c9\u306e\u30dd\u30c3\u30d7\u30a2\u30c3\u30d7\u3092\u7121\u52b9\u5316\u3059\u308b\u300d\u30aa\u30d7\u30b7\u30e7\u30f3\u3092\u524a\u9664\u3002", "[\u524a\u9664] \u30b3\u30e1\u30f3\u30c8\u6295\u7a3f\u6a5f\u80fd\u3092\u524a\u9664\u3002", "[\u4fee\u6b63] \u8a55\u4fa1\u6a5f\u80fd\u304c\u52d5\u304b\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002", "[\u4fee\u6b63] \u30d6\u30c3\u30af\u30de\u30fc\u30af\u30e2\u30fc\u30c9\u304c\u52d5\u304b\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002", "[\u4fee\u6b63] \u30bf\u30b0\u7de8\u96c6\u30e2\u30fc\u30c9\u304c\u52d5\u304b\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002", "[\u4fee\u6b63] \u30a2\u30f3\u30b1\u30fc\u30c8\u6a5f\u80fd\u304c\u52d5\u304b\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002"]}, "version": "1.16.0", "releasenote": "http://crckyl.hatenablog.com/entry/2017/01/22/pixplus_1.16.0"}, {"date": "2016/09/17", "changes_i18n": {"en": ["[Fix][Opera12] Fix the behavior of arrow buttons on Opera12."], "ja": ["[\u4fee\u6b63][Opera12] Opera12\u3067\u77e2\u5370\u30dc\u30bf\u30f3\u306e\u52d5\u4f5c\u304c\u304a\u304b\u3057\u304b\u3063\u305f\u306e\u3092\u4fee\u6b63\u3002"]}, "version": "1.15.2", "releasenote": "http://crckyl.hatenablog.com/entry/2016/09/17/pixplus_1.15.2"}, {"date": "2016/08/26", "changes_i18n": {"en": ["[Fix] Preference dialog on manga page was broken.", "[Fix] 'Remove pixiv comic icon' option was broken."], "ja": ["[\u4fee\u6b63] \u30de\u30f3\u30ac\u30da\u30fc\u30b8\u5185\u3067\u8a2d\u5b9a\u30c0\u30a4\u30a2\u30ed\u30b0\u306e\u30ec\u30a4\u30a2\u30a6\u30c8\u304c\u58ca\u308c\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002", "[\u4fee\u6b63] \u300cpixiv\u30b3\u30df\u30c3\u30af\u30a2\u30a4\u30b3\u30f3\u3092\u9664\u53bb\u3059\u308b\u300d\u30aa\u30d7\u30b7\u30e7\u30f3\u304c\u6a5f\u80fd\u3057\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002"]}, "version": "1.15.1", "releasenote": "http://crckyl.hatenablog.com/entry/2016/08/26/pixplus_1.15.1"}, {"date": "2015/08/02", "changes_i18n": {"en": ["[Add] Added an option to disable profile card popup (in the 'Genral' tab).", "[Fix] Author icon badges were broken.", "[Fix] Rarely manga mode ends unexpectedly.", "[Fix] Improve performance."], "ja": ["[\u8ffd\u52a0] \u30d7\u30ed\u30d5\u30a3\u30fc\u30eb\u30ab\u30fc\u30c9\u306e\u30dd\u30c3\u30d7\u30a2\u30c3\u30d7\u3092\u7121\u52b9\u5316\u3059\u308b\u30aa\u30d7\u30b7\u30e7\u30f3\u3092\u8ffd\u52a0(\u5168\u822c\u30bf\u30d6)\u3002", "[\u4fee\u6b63] \u4f5c\u8005\u30a2\u30a4\u30b3\u30f3\u306e\u30d0\u30c3\u30b8\u304c\u8868\u793a\u3055\u308c\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002", "[\u4fee\u6b63] \u7a00\u306b\u30de\u30f3\u30ac\u30e2\u30fc\u30c9\u304c\u52dd\u624b\u306b\u7d42\u4e86\u3059\u308b\u30d0\u30b0\u3092\u4fee\u6b63\u3002", "[\u4fee\u6b63] \u30d1\u30d5\u30a9\u30fc\u30de\u30f3\u30b9\u3092\u6539\u5584\u3002"]}, "version": "1.15.0", "releasenote": "http://crckyl.hatenablog.com/entry/2015/08/02/pixplus_1.15.0"}, {"date": "2015/05/28", "changes_i18n": {"en": ["[Add] Add APNG generator.", "[Add] Support for pixiv spotlight.", "[Fix] Start using MutationObserver. (MutationEvents warnings disappeared on Firefox)", "[Change] Improve page layout of Book-format works.", "[Change] Improve comment area layout. (make white spaces narrow)", "[Change][Opera12] Improve Presto Opera support."], "ja": ["[\u8ffd\u52a0] APNG\u30b8\u30a7\u30cd\u30ec\u30fc\u30bf\u3092\u8ffd\u52a0\u3002", "[\u8ffd\u52a0] pixiv\u30b9\u30dd\u30c3\u30c8\u30e9\u30a4\u30c8\u30da\u30fc\u30b8\u306b\u5bfe\u5fdc\u3002", "[\u4fee\u6b63] \u53ef\u80fd\u306a\u3089MutationObserver\u3092\u4f7f\u7528\u3059\u308b\u3088\u3046\u306b\u5909\u66f4\u3002(Firefox\u3067\u8b66\u544a\u304c\u51fa\u306a\u304f\u306a\u3063\u305f)", "[\u5909\u66f4] \u30d6\u30c3\u30af\u30d5\u30a9\u30fc\u30de\u30c3\u30c8\u306e\u30ec\u30a4\u30a2\u30a6\u30c8\u3092\u6539\u5584\u3002", "[\u5909\u66f4] \u30b3\u30e1\u30f3\u30c8\u6b04\u306e\u30ec\u30a4\u30a2\u30a6\u30c8\u3092\u6539\u5584\u3002(\u4f59\u767d\u3092\u72ed\u304f)", "[\u5909\u66f4][Opera12] Presto Opera\u306e\u30b5\u30dd\u30fc\u30c8\u3092\u6539\u5584\u3002"]}, "version": "1.14.0", "releasenote": "http://crckyl.hatenablog.com/entry/2015/05/28/pixplus_1.14.0"}, {"date": "2015/01/01", "changes_i18n": {"en": ["[Fix] The \"Use original size image\" option was not working for vertically/horizontally long illust works.", "[Fix] The \"Use original size image\" option was not working for single page manga works."], "ja": ["[\u4fee\u6b63] \u975e\u5e38\u306b\u7e26\u30fb\u6a2a\u306b\u9577\u3044\u30a4\u30e9\u30b9\u30c8\u306b\u5bfe\u3057\u3066\u300c\u539f\u5bf8\u306e\u753b\u50cf\u3092\u8868\u793a\u3059\u308b\u300d\u30aa\u30d7\u30b7\u30e7\u30f3\u304c\u6a5f\u80fd\u3057\u3066\u3044\u306a\u304b\u3063\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002", "[\u4fee\u6b63] \u5358\u30da\u30fc\u30b8\u306e\u30de\u30f3\u30ac\u4f5c\u54c1\u306b\u5bfe\u3057\u3066\u300c\u539f\u5bf8\u306e\u753b\u50cf\u3092\u8868\u793a\u3059\u308b\u300d\u30aa\u30d7\u30b7\u30e7\u30f3\u304c\u6a5f\u80fd\u3057\u3066\u3044\u306a\u304b\u3063\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002"]}, "version": "1.13.4", "releasenote": "http://crckyl.hatenablog.com/entry/2015/01/01/pixplus_1.13.4"}, {"date": "2014/12/20", "changes_i18n": {"en": ["[Fix] Popup window reports an error for old works.", "[Fix] \"Use original size image\" option was not working."], "ja": ["[\u4fee\u6b63] \u53e4\u3044\u4f5c\u54c1\u3067\u30a8\u30e9\u30fc\u306b\u306a\u308b\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002", "[\u4fee\u6b63] \u300c\u539f\u5bf8\u306e\u753b\u50cf\u3092\u8868\u793a\u3059\u308b\u300d\u30aa\u30d7\u30b7\u30e7\u30f3\u304c\u52d5\u304b\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002"]}, "version": "1.13.3", "releasenote": "http://crckyl.hatenablog.com/entry/2014/12/20/pixplus_1.13.3"}, {"date": "2014/12/14", "changes_i18n": {"en": ["[Fix] Fix comment mode (Shift+c) was not working."], "ja": ["[\u4fee\u6b63] \u30b3\u30e1\u30f3\u30c8\u30e2\u30fc\u30c9(Shift+c)\u304c\u52d5\u304b\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002"]}, "version": "1.13.2", "releasenote": "http://crckyl.hatenablog.com/entry/2014/12/14/pixplus_1.13.2"}, {"date": "2014/10/19", "changes_i18n": {"en": ["[Fix] Fix popup was broken on Safari 5/6."], "ja": ["[\u4fee\u6b63] Safari 5/6\u3067\u30dd\u30c3\u30d7\u30a2\u30c3\u30d7\u304c\u52d5\u4f5c\u3057\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002"]}, "version": "1.13.1", "releasenote": "http://crckyl.hatenablog.com/entry/2014/10/19/pixplus_1.13.1"}, {"date": "2014/10/10", "changes_i18n": {"en": ["[Change] Change design of frontpage of multi-page works.", "[Fix] Fix \"Use original size image\" setting is inverted for \"book\" type works.", "[Fix] Fix support for staccfeed, area-ranking and mypage (ranking pane).", "[Remove] Remove repost display."], "ja": ["[\u5909\u66f4] \u8907\u6570\u30da\u30fc\u30b8\u4f5c\u54c1\u306e\u6249\u30da\u30fc\u30b8\u3092\u8868\u793a\u3057\u305f\u969b\u306e\u30c7\u30b6\u30a4\u30f3\u3092\u5909\u66f4\u3002", "[\u4fee\u6b63] \u300c\u539f\u5bf8\u306e\u753b\u50cf\u3092\u8868\u793a\u3059\u308b\u300d\u30aa\u30d7\u30b7\u30e7\u30f3\u306e\u52d5\u4f5c\u304c\u300c\u30d6\u30c3\u30af\u300d\u306b\u5bfe\u3057\u3066\u9006\u306b\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002", "[\u4fee\u6b63] \u30b9\u30bf\u30c3\u30af\u30d5\u30a3\u30fc\u30c9\u3001\u5730\u57df\u30e9\u30f3\u30ad\u30f3\u30b0\u3001\u30de\u30a4\u30da\u30fc\u30b8(\u30e9\u30f3\u30ad\u30f3\u30b0\u30da\u30a4\u30f3)\u3067\u30dd\u30c3\u30d7\u30a2\u30c3\u30d7\u304c\u8868\u793a\u3055\u308c\u306a\u3044\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002", "[\u524a\u9664] \u300c\u518d\u6295\u7a3f\u300d\u8868\u793a\u3092\u524a\u9664\u3002"]}, "version": "1.13.0", "releasenote": "http://crckyl.hatenablog.com/entry/2014/10/10/pixplus_1.13.0"}, {"date": "2014/10/01", "changes_i18n": {"en": ["[Fix] Support for pixiv's new \"book\" feature."], "ja": ["[\u4fee\u6b63] \u30d6\u30c3\u30af\u5f62\u5f0f\u6a5f\u80fd\u3092\u30b5\u30dd\u30fc\u30c8\u3002"]}, "version": "1.12.3", "releasenote": "http://crckyl.hatenablog.com/entry/2014/10/01/pixplus_1.12.3"}, {"date": "2014/09/27", "changes_i18n": {"en": ["[Fix] Follow pixiv's changes.", "[Fix] Fix bookmark mode was broken.", "[Fix] Fix GreaseMonkey auto update."], "ja": ["[\u4fee\u6b63] pixiv\u306e\u5909\u66f4\u306b\u5bfe\u5fdc\u3002", "[\u4fee\u6b63] \u30d6\u30c3\u30af\u30de\u30fc\u30af\u30e2\u30fc\u30c9\u304c\u3046\u307e\u304f\u52d5\u4f5c\u3057\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002", "[\u4fee\u6b63] GreaseMonkey \u306e\u81ea\u52d5\u30a2\u30c3\u30d7\u30c7\u30fc\u30c8\u304c\u58ca\u308c\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002"]}, "version": "1.12.1", "releasenote": "http://crckyl.hatenablog.com/entry/2014/09/27/pixplus_1.12.1"}, {"date": "2014/09/04", "changes_i18n": {"en": ["[Add] Add \"Do not start manga mode automatically if you have already read it\" setting.", "[Fix] Fix bookmark mode is not working properly.", "[Fix] Fix comment form was broken.", "[Remove] Remove mypage layout history manager."], "ja": ["[\u8ffd\u52a0] \u300c\u65e2\u306b\u8aad\u3093\u3060\u30de\u30f3\u30ac\u306f\u81ea\u52d5\u3067\u30de\u30f3\u30ac\u30e2\u30fc\u30c9\u3092\u958b\u59cb\u3057\u306a\u3044\u300d\u8a2d\u5b9a\u3092\u8ffd\u52a0\u3002", "[\u4fee\u6b63] \u30d6\u30c3\u30af\u30de\u30fc\u30af\u30e2\u30fc\u30c9\u304c\u6b63\u3057\u304f\u52d5\u4f5c\u3057\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002", "[\u4fee\u6b63] \u30b3\u30e1\u30f3\u30c8\u30d5\u30a9\u30fc\u30e0\u304c\u52d5\u4f5c\u3057\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002", "[\u524a\u9664] \u30c8\u30c3\u30d7\u30da\u30fc\u30b8\u306e\u30ec\u30a4\u30a2\u30a6\u30c8\u306e\u5c65\u6b74\u3092\u7ba1\u7406\u3059\u308b\u6a5f\u80fd\u3092\u524a\u9664\u3002"]}, "version": "1.12.0", "releasenote": "http://crckyl.hatenablog.com/entry/2014/09/04/pixplus_1.12.0"}, {"date": "2014/06/28", "changes_i18n": {"en": ["[Add] Add setting to remove BOOTH icon.", "[Fix] Support for Ugoira."], "ja": ["[\u8ffd\u52a0] BOOTH\u30a2\u30a4\u30b3\u30f3\u3092\u9664\u53bb\u3059\u308b\u8a2d\u5b9a\u3092\u8ffd\u52a0\u3002", "[\u4fee\u6b63] \u3046\u3054\u30a4\u30e9\u3092\u30b5\u30dd\u30fc\u30c8\u3002"]}, "version": "1.11.0", "releasenote": "http://crckyl.hatenablog.com/entry/2014/06/28/pixplus_1.11.0"}, {"date": "2014/05/06", "changes_i18n": {"en": ["[Add] Add \"Open popup in manga page\" option.", "[Fix] Fix key event handling.", "[Fix] Fix \"Hide stamp comments\" option.", "[Fix] Support emoji comment."], "ja": ["[\u8ffd\u52a0] \u300c\u6f2b\u753b\u4f5c\u54c1\u306e\u30da\u30fc\u30b8\u3067\u30dd\u30c3\u30d7\u30a2\u30c3\u30d7\u3092\u958b\u304f\u300d\u30aa\u30d7\u30b7\u30e7\u30f3\u3092\u8ffd\u52a0\u3002", "[\u4fee\u6b63] \u30ad\u30fc\u30a4\u30d9\u30f3\u30c8\u306e\u51e6\u7406\u3092\u4fee\u6b63\u3002", "[\u4fee\u6b63] \u300c\u30b9\u30bf\u30f3\u30d7\u306e\u30b3\u30e1\u30f3\u30c8\u3092\u975e\u8868\u793a\u306b\u3059\u308b\u300d\u30aa\u30d7\u30b7\u30e7\u30f3\u304c\u52d5\u4f5c\u3057\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002", "[\u4fee\u6b63] \u30b3\u30e1\u30f3\u30c8\u306e\u7d75\u6587\u5b57\u3092\u30b5\u30dd\u30fc\u30c8\u3002"]}, "version": "1.10.0", "releasenote": "http://crckyl.hatenablog.com/entry/2014/05/06/203423"}, {"date": "2014/02/21", "changes_i18n": {"en": ["[Add] Add \"Hide stamp comments\" option.", "[Fix] Fix ranking page support.", "[Fix] Support new comment UI.", "[Fix] Configuration button doesn't appears."], "ja": ["[\u8ffd\u52a0] \u300c\u30b9\u30bf\u30f3\u30d7\u306e\u30b3\u30e1\u30f3\u30c8\u3092\u975e\u8868\u793a\u306b\u3059\u308b\u300d\u30aa\u30d7\u30b7\u30e7\u30f3\u3092\u8ffd\u52a0\u3002", "[\u4fee\u6b63] \u30e9\u30f3\u30ad\u30f3\u30b0\u30da\u30fc\u30b8\u306e\u30b5\u30dd\u30fc\u30c8\u3092\u4fee\u6b63\u3002", "[\u4fee\u6b63] \u65b0\u3057\u3044\u30b3\u30e1\u30f3\u30c8UI\u3092\u30b5\u30dd\u30fc\u30c8\u3002", "[\u4fee\u6b63] \u8a2d\u5b9a\u30dc\u30bf\u30f3\u304c\u8868\u793a\u3055\u308c\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002"]}, "version": "1.9.0", "releasenote": "http://crckyl.hatenablog.com/entry/2014/02/21/130255"}, {"date": "2013/08/14", "changes_i18n": {"en": ["[Fix] Fix tag selection in bookmark mode.", "[Fix] Fix \"w\" key reloads illust when in manga mode."], "ja": ["[\u4fee\u6b63] \u30d6\u30c3\u30af\u30de\u30fc\u30af\u30e2\u30fc\u30c9\u3067\u30bf\u30b0\u3092\u9078\u629e\u3067\u304d\u306a\u3044\u5834\u5408\u304c\u3042\u308b\u30d0\u30b0\u3092\u4fee\u6b63\u3002", "[\u4fee\u6b63] \u30de\u30f3\u30ac\u30e2\u30fc\u30c9\u3067\"w\"\u30ad\u30fc\u304c\u4e0a\u624b\u304f\u52d5\u304b\u306a\u3044\u30d0\u30b0\u3092\u4fee\u6b63\u3002"]}, "version": "1.8.1", "releasenote": "http://crckyl.hatenablog.com/entry/2013/08/14/100851"}, {"date": "2013/08/07", "changes_i18n": {"en": ["[Add] Add \"Mark link as visited\" option.", "[Add] Add \"Scroll step for PageUp/PageDown\" option.", "[Add] Support \"Suggested Users\" page.", "[Change] Try to load big image by \"w\" key if \"original size image\" option is disabled.", "[Fix] ESC key is not working.", "[Fix] Shift+V key (open manga thumbnail page) is not working.", "[Fix] Image response support.", "[Fix] Can't view access restricted illust.", "[Fix][Firefox] Some keys are not working on Firefox23."], "ja": ["[\u8ffd\u52a0] \u300c\u30ea\u30f3\u30af\u3092\u8a2a\u554f\u6e08\u307f\u306b\u3059\u308b\u300d\u30aa\u30d7\u30b7\u30e7\u30f3\u3092\u8ffd\u52a0\u3002", "[\u8ffd\u52a0] \u300cPageUp/PageDown\u306e\u30b9\u30af\u30ed\u30fc\u30eb\u5e45\u300d\u30aa\u30d7\u30b7\u30e7\u30f3\u3092\u8ffd\u52a0\u3002", "[\u8ffd\u52a0] \u300c\u304a\u3059\u3059\u3081\u30e6\u30fc\u30b6\u30fc\u300d\u30da\u30fc\u30b8\u306b\u5bfe\u5fdc\u3002", "[\u5909\u66f4] \u300c\u539f\u5bf8\u306e\u753b\u50cf\u3092\u8868\u793a\u3059\u308b\u300d\u30aa\u30d7\u30b7\u30e7\u30f3\u304c\u7121\u52b9\u306b\u306a\u3063\u3066\u3044\u308b\u3068\u304d\u3001\"w\"\u30ad\u30fc\u3067\u539f\u5bf8\u306e\u753b\u50cf\u306b\u5207\u308a\u66ff\u3048\u308b\u3088\u3046\u306b\u5909\u66f4\u3002", "[\u4fee\u6b63] ESC\u30ad\u30fc\u304c\u52d5\u4f5c\u3057\u3066\u3044\u306a\u304b\u3063\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002", "[\u4fee\u6b63] Shift+V\u30ad\u30fc(\u30de\u30f3\u30ac\u30b5\u30e0\u30cd\u30a4\u30eb\u30da\u30fc\u30b8\u3092\u958b\u304f)\u304c\u52d5\u4f5c\u3057\u3066\u3044\u306a\u304b\u3063\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002", "[\u4fee\u6b63] \u30a4\u30e1\u30fc\u30b8\u30ec\u30b9\u30dd\u30f3\u30b9\u306e\u51e6\u7406\u3092\u4fee\u6b63\u3002", "[\u4fee\u6b63] \u30a2\u30af\u30bb\u30b9\u5236\u9650\u304c\u8a2d\u5b9a\u3055\u308c\u3066\u3044\u308b\u30a4\u30e9\u30b9\u30c8\u3092\u958b\u3051\u306a\u3044\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002", "[\u4fee\u6b63][Firefox] Firefox23\u3067\u30ad\u30fc\u64cd\u4f5c\u3067\u304d\u306a\u3044\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002"]}, "version": "1.8.0", "releasenote": "http://crckyl.hatenablog.com/entry/2013/08/07/110857"}, {"date": "2013/06/26", "changes_i18n": {"en": ["[Fix][Chrome] Greasemonkey version(.user.js) is not working on Chrome."], "ja": ["[\u4fee\u6b63][Chrome] Greasemonkey\u7248\u304cChrome\u4e0a\u3067\u52d5\u4f5c\u3057\u306a\u3044\u30d0\u30b0\u3092\u4fee\u6b63\u3002"]}, "version": "1.7.1", "releasenote": "http://crckyl.hatenablog.com/entry/2013/06/26/120605"}, {"date": "2013/06/25", "changes_i18n": {"en": ["Improve boot performance.", "[Add] Added some features that extends \"Advanced Search\" dialog.", "[Remove] Remove \"Change 'Stacc feed' link\" option.", "[Remove] Remove \"Separator style for tag list\" option.", "[Fix] Fix manga mode always reports error.", "[Fix][Firefox] Fix bookmark mode is not working on Firefox ESR 17"], "ja": ["\u8d77\u52d5\u3092\u9ad8\u901f\u5316\u3002", "[\u8ffd\u52a0] \u300c\u691c\u7d22\u30aa\u30d7\u30b7\u30e7\u30f3\u300d\u30c0\u30a4\u30a2\u30ed\u30b0\u306b\u3044\u304f\u3064\u304b\u306e\u30aa\u30d7\u30b7\u30e7\u30f3\u3092\u8ffd\u52a0\u3059\u308b\u6a5f\u80fd\u3092\u8ffd\u52a0\u3002", "[\u524a\u9664] \u300c\u30b9\u30bf\u30c3\u30af\u30d5\u30a3\u30fc\u30c9\u300d\u306e\u30ea\u30f3\u30af\u5148\u3092\u5909\u66f4\u3059\u308b\u30aa\u30d7\u30b7\u30e7\u30f3\u3092\u524a\u9664\u3002", "[\u524a\u9664] \u300c\u30bf\u30b0\u30ea\u30b9\u30c8\u306e\u30bb\u30d1\u30ec\u30fc\u30bf\u306e\u30b9\u30bf\u30a4\u30eb\u300d\u30aa\u30d7\u30b7\u30e7\u30f3\u3092\u524a\u9664\u3002", "[\u4fee\u6b63] \u30de\u30f3\u30ac\u30e2\u30fc\u30c9\u304c\u52d5\u4f5c\u3057\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002", "[\u4fee\u6b63][Firefox] Firefox ESR 17\u3067\u30d6\u30c3\u30af\u30de\u30fc\u30af\u30e2\u30fc\u30c9\u304c\u52d5\u4f5c\u3057\u3066\u3044\u306a\u304b\u3063\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002"]}, "version": "1.7.0", "releasenote": "http://crckyl.hatenablog.com/entry/2013/06/25/110601"}, {"date": "2013/05/26", "changes_i18n": {"en": ["[Fix] Support new bookmark page."], "ja": ["[\u4fee\u6b63] \u65b0\u3057\u3044\u30d6\u30c3\u30af\u30de\u30fc\u30af\u30da\u30fc\u30b8\u3092\u30b5\u30dd\u30fc\u30c8\u3002"]}, "version": "1.6.3", "releasenote": "http://crckyl.hatenablog.com/entry/2013/05/25/210523"}, {"date": "2013/05/18", "changes_i18n": {"en": ["[Fix] Fix author status icon.", "[Fix] Bookmark button is always inactive, even though it is bookmarked.", "[Fix] Fix loading error on Firefox21"], "ja": ["[\u4fee\u6b63] \u4f5c\u8005\u306e\u30b9\u30c6\u30fc\u30bf\u30b9\u30a2\u30a4\u30b3\u30f3\u304c\u8868\u793a\u3055\u308c\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002", "[\u4fee\u6b63] \u30d6\u30c3\u30af\u30de\u30fc\u30af\u3057\u3066\u3082\u30d6\u30c3\u30af\u30de\u30fc\u30af\u30dc\u30bf\u30f3\u306e\u8868\u793a\u304c\u5909\u5316\u3057\u306a\u3044\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002", "[\u4fee\u6b63] Firefox21\u3067\u8aad\u307f\u8fbc\u307f\u30a8\u30e9\u30fc\u304c\u767a\u751f\u3059\u308b\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002"]}, "version": "1.6.2", "releasenote": "http://crckyl.hatenablog.com/entry/2013/05/18/070549"}, {"date": "2013/03/13", "changes_i18n": {"en": ["[Change] Change \"Click area\" design.", "[Fix] Minor fix for pixiv's change."], "ja": ["[\u5909\u66f4] \u79fb\u52d5\u7528\u30af\u30ea\u30c3\u30af\u30a4\u30f3\u30bf\u30fc\u30d5\u30a7\u30fc\u30b9\u306e\u30c7\u30b6\u30a4\u30f3\u3092\u5909\u66f4\u3002", "[\u4fee\u6b63] pixiv\u306e\u5909\u66f4\u306b\u5bfe\u5fdc\u3002"]}, "version": "1.6.1", "releasenote": "http://crckyl.hatenablog.com/entry/2013/03/13/100325"}, {"date": "2013/02/23", "changes_i18n": {"en": ["[Add] Add resize mode settings and key bindings.", "[Fix] Fix author does not shown properly in popup."], "ja": ["[\u8ffd\u52a0] \u30ea\u30b5\u30a4\u30ba\u30e2\u30fc\u30c9\u306e\u8a2d\u5b9a\u3068\u30ad\u30fc\u30d0\u30a4\u30f3\u30c9\u3092\u8ffd\u52a0\u3002", "[\u4fee\u6b63] \u30dd\u30c3\u30d7\u30a2\u30c3\u30d7\u306b\u4f5c\u8005\u304c\u8868\u793a\u3055\u308c\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002"]}, "version": "1.6.0", "releasenote": "http://crckyl.hatenablog.com/entry/2013/02/23/100201"}, {"date": "2013/02/10", "changes_i18n": {"en": ["[Add] Add top-page layout history manager.", "[Fix][Extension] Fix can't save settings in General section."], "ja": ["[\u8ffd\u52a0] \u30c8\u30c3\u30d7\u30da\u30fc\u30b8\u306e\u30ec\u30a4\u30a2\u30a6\u30c8\u306e\u5909\u66f4\u5c65\u6b74\u3092\u7ba1\u7406\u3059\u308b\u6a5f\u80fd\u3092\u8ffd\u52a0\u3002", "[\u4fee\u6b63][\u30a8\u30af\u30b9\u30c6\u30f3\u30b7\u30e7\u30f3] \u300c\u5168\u822c\u300d\u30bb\u30af\u30b7\u30e7\u30f3\u306e\u8a2d\u5b9a\u304c\u4fdd\u5b58\u3055\u308c\u306a\u3044\u30d0\u30b0\u3092\u4fee\u6b63\u3002"]}, "version": "1.5.0", "releasenote": "http://crckyl.hatenablog.com/entry/2013/02/09/210216"}, {"date": "2013/02/02", "changes_i18n": {"en": ["[Add] Add tag association ui to bookmark mode.", "[Fix] Fix author does not shown properly in popup.", "[Fix] Fix comment view in popup.", "[Fix] Fix \"Add favorite user by one-click\" is not working."], "ja": ["[\u8ffd\u52a0] \u30d6\u30c3\u30af\u30de\u30fc\u30af\u30e2\u30fc\u30c9\u306b\u30bf\u30b0\u3092\u95a2\u9023\u4ed8\u3051\u308bUI\u3092\u8ffd\u52a0\u3002", "[\u4fee\u6b63] \u30dd\u30c3\u30d7\u30a2\u30c3\u30d7\u306b\u4f5c\u8005\u304c\u8868\u793a\u3055\u308c\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002", "[\u4fee\u6b63] \u30dd\u30c3\u30d7\u30a2\u30c3\u30d7\u3067\u30b3\u30e1\u30f3\u30c8\u304c\u95b2\u89a7\u51fa\u6765\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002", "[\u4fee\u6b63] \u304a\u6c17\u306b\u5165\u308a\u30e6\u30fc\u30b6\u30fc\u306e\u8ffd\u52a0\u3092\u30ef\u30f3\u30af\u30ea\u30c3\u30af\u3067\u884c\u3046\u8a2d\u5b9a\u304c\u52d5\u4f5c\u3057\u3066\u3044\u306a\u304b\u3063\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002"]}, "version": "1.4.0", "releasenote": "http://crckyl.hatenablog.com/entry/2013/02/02/120229"}, {"date": "2012/12/16", "changes_i18n": {"en": ["[Add] Add option to remove pixiv comic icon.", "[Change] Improve bookmark mode layout.", "[Change] Improve key navigation feature in bookmark mode.", "[Change] Improve tag edit mode layout.", "[Fix] Fix tag edit mode is not working.", "[Fix] Can not open preferences in UserJS/Greasemonkey version."], "ja": ["[\u8ffd\u52a0] pixiv\u30b3\u30df\u30c3\u30af\u30a2\u30a4\u30b3\u30f3\u3092\u9664\u53bb\u3059\u308b\u30aa\u30d7\u30b7\u30e7\u30f3\u3092\u8ffd\u52a0\u3002", "[\u5909\u66f4] \u30d6\u30c3\u30af\u30de\u30fc\u30af\u30e2\u30fc\u30c9\u306e\u30ec\u30a4\u30a2\u30a6\u30c8\u3092\u6539\u5584\u3002", "[\u5909\u66f4] \u30d6\u30c3\u30af\u30de\u30fc\u30af\u30e2\u30fc\u30c9\u306e\u30ad\u30fc\u64cd\u4f5c\u3092\u6539\u5584\u3002", "[\u5909\u66f4] \u30bf\u30b0\u7de8\u96c6\u30e2\u30fc\u30c9\u306e\u30ec\u30a4\u30a2\u30a6\u30c8\u3092\u6539\u5584\u3002", "[\u4fee\u6b63] \u30bf\u30b0\u7de8\u96c6\u30e2\u30fc\u30c9\u304c\u52d5\u304b\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002", "[\u4fee\u6b63] UserJS/Greasemonkey\u7248\u3067\u8a2d\u5b9a\u753b\u9762\u3092\u958b\u3051\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002"]}, "version": "1.3.0", "releasenote": "http://crckyl.hatenablog.com/entry/2012/12/16/041240"}, {"date": "2012/12/06", "changes_i18n": {"en": ["[Fix] Fix manga layout is broken.", "[Fix] Fix tag list layout.", "[Fix] Fix fail to load access-restricted illust.", "[Fix] Fix broken tag list with no tags."], "ja": ["[\u4fee\u6b63] \u30de\u30f3\u30ac\u306e\u30ec\u30a4\u30a2\u30a6\u30c8\u304c\u5d29\u308c\u308b\u30d0\u30b0\u3092\u4fee\u6b63\u3002", "[\u4fee\u6b63] \u30bf\u30b0\u30ea\u30b9\u30c8\u306e\u30ec\u30a4\u30a2\u30a6\u30c8\u3092\u4fee\u6b63\u3002", "[\u4fee\u6b63] \u30a2\u30af\u30bb\u30b9\u304c\u5236\u9650\u3055\u308c\u305f\u4f5c\u54c1\u3092\u95b2\u89a7\u51fa\u6765\u306a\u3044\u30d0\u30b0\u3092\u4fee\u6b63\u3002", "[\u4fee\u6b63] \u30a4\u30e9\u30b9\u30c8\u306b\u30bf\u30b0\u304c\u767b\u9332\u3055\u308c\u3066\u3044\u306a\u3044\u6642\u306b\u8868\u793a\u304c\u58ca\u308c\u308b\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002"]}, "version": "1.2.2", "releasenote": "http://crckyl.hatenablog.com/entry/2012/12/06/101212"}, {"date": "2012/09/29", "changes_i18n": {"en": ["[Fix] Minor fix for pixiv's update."], "ja": ["[\u4fee\u6b63] pixiv\u306e\u5909\u66f4\u306b\u5bfe\u5fdc\u3002"]}, "version": "1.2.1", "releasenote": "http://crckyl.hatenablog.com/entry/2012/09/29/050955"}, {"date": "2012/08/27", "changes_i18n": {"en": ["[Add] Add \"Redirect jump.php\" setting.", "[Fix] Fix control key support for DOM3Events.", "[Fix] Improve auto-manga-mode feature.", "[Fix] Support \"new Staccfeed\" page."], "ja": ["[\u8ffd\u52a0] \"jump.php\u3092\u30ea\u30c0\u30a4\u30ec\u30af\u30c8\u3059\u308b\"\u8a2d\u5b9a\u3092\u8ffd\u52a0\u3002", "[\u4fee\u6b63] DOM3Event\u306eControl\u30ad\u30fc\u30b5\u30dd\u30fc\u30c8\u3092\u4fee\u6b63\u3002", "[\u4fee\u6b63] \u81ea\u52d5\u30de\u30f3\u30ac\u30e2\u30fc\u30c9\u306e\u6319\u52d5\u3092\u6539\u5584\u3002", "[\u4fee\u6b63] \u300c\u65b0\u3057\u3044\u30b9\u30bf\u30c3\u30af\u30d5\u30a3\u30fc\u30c9\u300d\u3092\u30b5\u30dd\u30fc\u30c8\u3002"]}, "version": "1.2.0", "releasenote": "http://crckyl.hatenablog.com/entry/2012/08/27/100841"}, {"date": "2012/08/14", "changes_i18n": {"en": ["[Fix] Header area hidden by click navigator.", "[Fix] \"Reverse\" setting applied in manga mode.", "[Fix] Can't read old manga if \"Use original size image\" is enabled.", "[Fix] Can't add or modify bookmark in staccfeed page.", "[Change] Change default value for some preferences.", "[Fix][WebKit] Status field layout is broken while loading."], "ja": ["[\u4fee\u6b63] \u30af\u30ea\u30c3\u30af\u30ca\u30d3\u30b2\u30fc\u30b7\u30e7\u30f3\u306eUI\u3067\u30d8\u30c3\u30c0\u9818\u57df\u304c\u96a0\u308c\u3066\u3057\u307e\u3046\u30d0\u30b0\u3092\u4fee\u6b63\u3002", "[\u4fee\u6b63] \"\u79fb\u52d5\u65b9\u5411\u3092\u53cd\u5bfe\u306b\u3059\u308b\"\u8a2d\u5b9a\u304c\u30de\u30f3\u30ac\u30e2\u30fc\u30c9\u306b\u3082\u9069\u7528\u3055\u308c\u3066\u3044\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002", "[\u4fee\u6b63] \"\u539f\u5bf8\u306e\u753b\u50cf\u3092\u8868\u793a\u3059\u308b\"\u304c\u6709\u52b9\u306b\u306a\u3063\u3066\u3044\u308b\u3068\u53e4\u3044\u30de\u30f3\u30ac\u4f5c\u54c1\u3092\u95b2\u89a7\u51fa\u6765\u306a\u3044\u30d0\u30b0\u3092\u4fee\u6b63\u3002", "[\u4fee\u6b63] \u30b9\u30bf\u30c3\u30af\u30d5\u30a3\u30fc\u30c9\u30da\u30fc\u30b8\u3067\u30d6\u30c3\u30af\u30de\u30fc\u30af\u306e\u8ffd\u52a0\u30fb\u7de8\u96c6\u304c\u51fa\u6765\u306a\u3044\u30d0\u30b0\u3092\u4fee\u6b63\u3002", "[\u5909\u66f4] \u3044\u304f\u3064\u304b\u306e\u8a2d\u5b9a\u9805\u76ee\u306e\u30c7\u30d5\u30a9\u30eb\u30c8\u5024\u3092\u5909\u66f4\u3002", "[\u4fee\u6b63][WebKit] \u30ed\u30fc\u30c9\u4e2d\u306e\u30b9\u30c6\u30fc\u30bf\u30b9\u8868\u793a\u306e\u30ec\u30a4\u30a2\u30a6\u30c8\u304c\u5909\u306b\u306a\u308b\u306e\u3092\u4fee\u6b63\u3002"]}, "version": "1.1.1", "releasenote": "http://crckyl.hatenablog.com/entry/2012/08/14/070809"}, {"date": "2012/08/09", "changes_i18n": {"en": ["[Add] Open popup from illust link in caption(author comment).", "[Add] Add tag edit mode.", "[Fix] Don't open popup from image-response list in illust page.", "[Fix] Improve error handling.", "[Fix] Displaying html entity in title and author name.", "[Fix] Can' t move to another illust when in bookmark mode.", "[Fix] Various minor bug fixes.", "[Fix][Firefox] Can't send rating if \"Show confirmation dialog when rating\" option is on.", "[Fix][Firefox] Popup don't works on ranking page."], "ja": ["[\u8ffd\u52a0] \u30ad\u30e3\u30d7\u30b7\u30e7\u30f3\u5185\u306e\u30ea\u30f3\u30af\u304b\u3089\u30dd\u30c3\u30d7\u30a2\u30c3\u30d7\u3092\u958b\u304f\u6a5f\u80fd\u3092\u8ffd\u52a0\u3002", "[\u8ffd\u52a0] \u30bf\u30b0\u7de8\u96c6\u6a5f\u80fd\u3092\u8ffd\u52a0\u3002", "[\u4fee\u6b63] \u30a4\u30e9\u30b9\u30c8\u30da\u30fc\u30b8\u5185\u306e\u30a4\u30e1\u30fc\u30b8\u30ec\u30b9\u30dd\u30f3\u30b9\u4e00\u89a7\u304b\u3089\u30dd\u30c3\u30d7\u30a2\u30c3\u30d7\u304c\u958b\u304b\u306a\u3044\u30d0\u30b0\u3092\u4fee\u6b63\u3002", "[\u4fee\u6b63] \u30a8\u30e9\u30fc\u51e6\u7406\u3092\u6539\u5584\u3002", "[\u4fee\u6b63] \u30bf\u30a4\u30c8\u30eb\u3068\u30e6\u30fc\u30b6\u30fc\u540d\u306bHTML\u30a8\u30f3\u30c6\u30a3\u30c6\u30a3\u304c\u8868\u793a\u3055\u308c\u3066\u3044\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002", "[\u4fee\u6b63] \u30d6\u30c3\u30af\u30de\u30fc\u30af\u30e2\u30fc\u30c9\u306e\u6642\u306b\u4ed6\u306e\u30a4\u30e9\u30b9\u30c8\u306b\u79fb\u52d5\u51fa\u6765\u306a\u3044\u30d0\u30b0\u3092\u4fee\u6b63\u3002", "[\u4fee\u6b63] \u4ed6\u7d30\u304b\u306a\u30d0\u30b0\u4fee\u6b63\u3002", "[\u4fee\u6b63][Firefox] \u300c\u30a4\u30e9\u30b9\u30c8\u3092\u8a55\u4fa1\u3059\u308b\u6642\u306b\u78ba\u8a8d\u3092\u3068\u308b\u300d\u30aa\u30d7\u30b7\u30e7\u30f3\u3092\u6709\u52b9\u306b\u3057\u3066\u3044\u308b\u3068\u8a55\u4fa1\u3067\u304d\u306a\u3044\u30d0\u30b0\u3092\u4fee\u6b63\u3002", "[\u4fee\u6b63][Firefox] \u30e9\u30f3\u30ad\u30f3\u30b0\u30da\u30fc\u30b8\u3067\u30dd\u30c3\u30d7\u30a2\u30c3\u30d7\u304c\u958b\u304b\u306a\u3044\u30d0\u30b0\u3092\u4fee\u6b63\u3002"]}, "version": "1.1.0", "releasenote": "http://crckyl.hatenablog.com/entry/2012/08/09/100814"}, {"date": "2012/08/08", "changes_i18n": {"en": ["Rewrite whole of source code.", "[Add] Add preference to specify minimum height of caption area.", "[Remove] Remove tag edit feature.", "[Remove] Remove some dead preferences.", "[Remove] Remove zoom feature.", "[Fix] Fix multilingual support."], "ja": ["\u5168\u4f53\u7684\u306b\u66f8\u304d\u76f4\u3057\u3002", "[\u8ffd\u52a0] \u30ad\u30e3\u30d7\u30b7\u30e7\u30f3\u306e\u9ad8\u3055\u306e\u6700\u5c0f\u5024\u3092\u6307\u5b9a\u3059\u308b\u8a2d\u5b9a\u3092\u8ffd\u52a0\u3002", "[\u524a\u9664] \u30bf\u30b0\u7de8\u96c6\u6a5f\u80fd\u3092\u524a\u9664\u3002", "[\u524a\u9664] \u6a5f\u80fd\u3057\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u3044\u304f\u3064\u304b\u306e\u8a2d\u5b9a\u9805\u76ee\u3092\u524a\u9664\u3002", "[\u524a\u9664] \u30ba\u30fc\u30e0\u6a5f\u80fd\u3092\u524a\u9664\u3002", "[\u4fee\u6b63] \u591a\u8a00\u8a9e\u30b5\u30dd\u30fc\u30c8\u3092\u4fee\u6b63\u3002"]}, "version": "1.0.0", "releasenote": "http://crckyl.hatenablog.com/entry/2012/08/08/140851"}, {"date": "2012/08/05", "changes_i18n": {"en": ["[Fix] Rating feature don't works."], "ja": ["[\u4fee\u6b63] \u8a55\u4fa1\u6a5f\u80fd\u304c\u52d5\u304b\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u306e\u3092\u4fee\u6b63\u3002"]}, "version": "0.9.4", "releasenote": "http://crckyl.hatenablog.com/entry/2012/08/05/010838"}, {"date": "2012/08/03", "changes_i18n": {"en": ["[Fix] Support pixiv's update."], "ja": ["[\u4fee\u6b63] pixiv\u306e\u4ed5\u69d8\u5909\u66f4\u306b\u5bfe\u5fdc\u3002"]}, "version": "0.9.3", "releasenote": "http://crckyl.hatenablog.com/entry/2012/08/03/120844"}, {"date": "2012/06/29", "changes_i18n": {"en": ["[Fix] If conf.popup.big_image=0, \"S\" key (conf.key.popup_open_big) opens medium image."], "ja": ["[\u4fee\u6b63] conf.popup.big_image=0\u306e\u6642\u3001\"S\"\u30ad\u30fc(conf.key.popup_open_big)\u3067medium\u306e\u753b\u50cf\u3092\u958b\u3044\u3066\u3044\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002"]}, "version": "0.9.2", "releasenote": "http://crckyl.hatenablog.com/entry/2012/06/29/100651"}, {"date": "2012/06/26", "changes_i18n": {"en": ["[Fix] Corresponds to pixiv's spec changes.", "[Fix] In reposted illust, pixplus shows first version."], "ja": ["[\u4fee\u6b63] pixiv\u306e\u4ed5\u69d8\u5909\u66f4\u306b\u5bfe\u5fdc\u3002", "[\u4fee\u6b63] \u30a4\u30e9\u30b9\u30c8\u304c\u518d\u6295\u7a3f\u3055\u308c\u3066\u3044\u308b\u5834\u5408\u306b\u53e4\u3044\u753b\u50cf\u3092\u8868\u793a\u3057\u3066\u3044\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002"]}, "version": "0.9.1", "releasenote": "http://crckyl.hatenablog.com/entry/2012/06/25/210620"}, {"date": "2012/02/17", "changes_i18n": {"en": ["[New] Added a setting to change mouse wheel operation. (conf.popup.mouse_wheel)", "[Fix] External links in author comment were broken."], "ja": ["[\u8ffd\u52a0] \u30de\u30a6\u30b9\u30db\u30a4\u30fc\u30eb\u306e\u52d5\u4f5c\u3092\u5909\u66f4\u3059\u308b\u8a2d\u5b9a(conf.popup.mouse_wheel)\u3092\u8ffd\u52a0\u3002", "[\u4fee\u6b63] \u30ad\u30e3\u30d7\u30b7\u30e7\u30f3\u5185\u306e\u5916\u90e8\u30ea\u30f3\u30af\u304c\u58ca\u308c\u3066\u3044\u305f\u306e\u3092\u4fee\u6b63\u3002"]}, "version": "0.9.0", "releasenote": "http://crckyl.hatenablog.com/entry/2012/02/17/100206"}, {"date": "2012/02/11", "changes": ["\u65b0\u7740\u30a4\u30e9\u30b9\u30c8\u30da\u30fc\u30b8\u3067\u4e0a\u624b\u304f\u52d5\u4f5c\u3057\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002", "\u30b9\u30bf\u30c3\u30af\u30d5\u30a3\u30fc\u30c9\u3067\u4e0a\u624b\u304f\u52d5\u4f5c\u3057\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002", "\u30bf\u30b0\u30ea\u30b9\u30c8\u306e\u30d5\u30ed\u30fc\u30c8\u8868\u793a\u306e\u52d5\u4f5c\u3092\u4fee\u6b63\u3002"], "version": "0.8.3", "releasenote": "http://crckyl.hatenablog.com/entry/2012/02/11/150242"}, {"date": "2011/10/27", "changes": ["\u30a2\u30f3\u30b1\u30fc\u30c8\u306b\u56de\u7b54\u3059\u308b\u3068\u30a8\u30e9\u30fc\u30c0\u30a4\u30a2\u30ed\u30b0\u304c\u51fa\u308b\u3088\u3046\u306b\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002", "\u30c8\u30c3\u30d7\u30da\u30fc\u30b8(mypage.php)\u3067\u4e0a\u624b\u304f\u52d5\u4f5c\u3057\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002"], "version": "0.8.2", "releasenote": "http://crckyl.hatenablog.com/entry/2011/10/27/111054"}, {"date": "2011/09/17", "changes": ["pixiv\u306e\u5909\u66f4\u3067\u30a2\u30f3\u30b1\u30fc\u30c8\u306a\u3069\u306e\u52d5\u4f5c\u304c\u304a\u304b\u3057\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002", "conf.key.popup_manga_open_page\u306e\u30c7\u30d5\u30a9\u30eb\u30c8\u5024\u304c\u5909\u3060\u3063\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002"], "version": "0.8.1", "releasenote": "http://crckyl.hatenablog.com/entry/2011/09/17/010931"}, {"date": "2011/09/03", "changes": ["\u30d6\u30c3\u30af\u30de\u30fc\u30af\u7ba1\u7406\u30da\u30fc\u30b8\u3067\u3001\u95b2\u89a7\u51fa\u6765\u306a\u304f\u306a\u3063\u305f\u30a4\u30e9\u30b9\u30c8\u306b\u4e00\u62ec\u3067\u30c1\u30a7\u30c3\u30af\u3092\u5165\u308c\u308b\u6a5f\u80fd\u3092\u8ffd\u52a0\u3002", "\u30b3\u30e1\u30f3\u30c8\u3092\u6295\u7a3f\u3059\u308b\u3068\u30b3\u30e1\u30f3\u30c8\u30d5\u30a9\u30fc\u30e0\u304c\u6d88\u3048\u3066\u3057\u307e\u3046\u30d0\u30b0\u3092\u4fee\u6b63\u3002", "\u30d6\u30c3\u30af\u30de\u30fc\u30af\u30d5\u30a9\u30fc\u30e0\u3067\u30a8\u30e9\u30fc\u304c\u51fa\u308b\u3088\u3046\u306b\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002", "\u8a00\u8a9e\u30b5\u30dd\u30fc\u30c8\u3092\u6539\u5584\u3002", "AutoPatchWork\u7b49\u306e\u30b5\u30dd\u30fc\u30c8\u3092\u6539\u5584\u3002"], "version": "0.8.0", "releasenote": "http://crckyl.hatenablog.com/entry/2011/09/03/010924"}, {"date": "2011/08/21", "changes": ["\u30e9\u30f3\u30ad\u30f3\u30b0\u30da\u30fc\u30b8\u306b\u304a\u3044\u3066AutoPatchWork\u306a\u3069\u3067\u7d99\u304e\u8db3\u3057\u305f\u4e8c\u30da\u30fc\u30b8\u76ee\u4ee5\u964d\u306e\u753b\u50cf\u304c\u8868\u793a\u3055\u308c\u306a\u3044\u306e\u3092\u662f\u6b63\u3059\u308b\u6a5f\u80fd\u3092\u8ffd\u52a0\u3002", "\u304a\u3059\u3059\u3081\u30a4\u30e9\u30b9\u30c8\u3092\u30da\u30fc\u30b8\u306e\u53f3\u5074\u306b\u8868\u793a\u3059\u308b\u6a5f\u80fd(conf.locate_recommend_right)\u3092\u524a\u9664\u3002", "\u5730\u57df\u30e9\u30f3\u30ad\u30f3\u30b0(/ranking_area.php)\u306e\u65b0\u30c7\u30b6\u30a4\u30f3\u306b\u5bfe\u5fdc\u3002"], "version": "0.7.0", "releasenote": "http://crckyl.hatenablog.com/entry/2011/08/21/110824"}, {"date": "2011/07/24", "changes": ["\u30b9\u30bf\u30c3\u30af\u30d5\u30a3\u30fc\u30c9\u3067\u30d6\u30c3\u30af\u30de\u30fc\u30af\u3057\u3088\u3046\u3068\u3059\u308b\u3068\u30a8\u30e9\u30fc\u304c\u51fa\u308b\u30d0\u30b0\u3092\u4fee\u6b63\u3002", "\u300c\u30b9\u30e9\u30a4\u30c9\u30e2\u30fc\u30c9\u300d\u8a2d\u5b9a\u306e\u6642\u3001\u30de\u30f3\u30ac\u3092\u95b2\u89a7\u51fa\u6765\u306a\u3044\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002", "\u30e9\u30f3\u30ad\u30f3\u30b0\u3067\u4e0a\u624b\u304f\u52d5\u4f5c\u3057\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002"], "version": "0.6.3", "releasenote": "http://crckyl.hatenablog.com/entry/2011/07/24/100702"}, {"date": "2011/06/26", "changes": ["\u8a2d\u5b9a\u753b\u9762\u3078\u306e\u30ea\u30f3\u30af\u304c\u8868\u793a\u3055\u308c\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002", "\u30a4\u30d9\u30f3\u30c8\u306e\u7279\u8a2d\u30da\u30fc\u30b8(e.g. /event_starfestival2011.php)\u3067\u52d5\u4f5c\u3057\u3066\u3044\u306a\u304b\u3063\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002"], "version": "0.6.2", "releasenote": "http://crckyl.hatenablog.com/entry/2011/06/26/010657"}, {"date": "2011/05/21", "changes": ["Opera10.1x\u3067\u52d5\u4f5c\u3057\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002", "\u30bf\u30b0\u691c\u7d22(ex. /tags.php?tag=pixiv)\u3067\u52d5\u4f5c\u3057\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002", "\u30a8\u30e9\u30fc\u8868\u793a\u306e\u52d5\u4f5c\u304c\u5909\u3060\u3063\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002", "conf.popup_ranking_log\u3092\u524a\u9664\u3002", "\u65b0\u7740\u30da\u30fc\u30b8\u3067\u52d5\u4f5c\u3057\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002", "conf.locate_recommend_right\u304c\u52d5\u4f5c\u3057\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002"], "version": "0.6.1", "releasenote": "http://crckyl.hatenablog.com/entry/2011/05/21/030509"}, {"date": "2011/05/13", "changes": ["\u30ad\u30fc\u30d0\u30a4\u30f3\u30c9\u306e\u30ab\u30b9\u30bf\u30de\u30a4\u30ba\u6a5f\u80fd\u3092\u8ffd\u52a0\u3002", "\u30a4\u30e9\u30b9\u30c8\u30da\u30fc\u30b8\u3067\u30d6\u30c3\u30af\u30de\u30fc\u30af\u306e\u51e6\u7406\u304c\u52d5\u4f5c\u3057\u3066\u3044\u306a\u304b\u3063\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002", "\u30e9\u30a4\u30bb\u30f3\u30b9\u3092Apache License 2.0\u306b\u5909\u66f4\u3002", "Webkit\u3067\u30d6\u30c3\u30af\u30de\u30fc\u30af\u30d5\u30a9\u30fc\u30e0\u306e\u8868\u793a\u304c\u5909\u3060\u3063\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002", "\u30c8\u30c3\u30d7\u30da\u30fc\u30b8\u306e\u30ec\u30a4\u30a2\u30a6\u30c8\u3092\u30d0\u30c3\u30af\u30a2\u30c3\u30d7\u3059\u308b\u6a5f\u80fd\u3092\u8ffd\u52a0(\u5fa9\u6d3b)\u3002", "Chrome\u3067\u30bb\u30f3\u30bf\u30fc\u30af\u30ea\u30c3\u30af\u306b\u3082\u53cd\u5fdc\u3057\u3066\u3044\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002", "Webkit\u3067\u306e\u30ad\u30fc\u64cd\u4f5c\u3092\u6539\u5584\u3002", "\u30d6\u30c3\u30af\u30de\u30fc\u30af\u30d5\u30a9\u30fc\u30e0\u306a\u3069\u306e\u52d5\u4f5c\u304c\u5909\u306b\u306a\u3063\u3066\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002", "\u691c\u7d22\u30da\u30fc\u30b8\u3067\u52d5\u304b\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002"], "version": "0.6.0", "releasenote": "http://crckyl.hatenablog.com/entry/2011/05/13/120515"}, {"date": "2011/03/26", "changes": ["\u304a\u3059\u3059\u3081\u30a4\u30e9\u30b9\u30c8\u304c\u975e\u8868\u793a\u306e\u6642\u3082conf.locate_recommend_right\u304c\u52d5\u4f5c\u3057\u3066\u3057\u307e\u3046\u30d0\u30b0\u3092\u4fee\u6b63\u3002", "conf.extagedit\u3092\u5ec3\u6b62\u3057\u3066conf.bookmark_form\u306b\u5909\u66f4\u3002", "pixiv\u306e\u8a00\u8a9e\u8a2d\u5b9a\u304c\u65e5\u672c\u8a9e\u4ee5\u5916\u306e\u6642\u306b\u30de\u30f3\u30ac\u304c\u95b2\u89a7\u3067\u304d\u306a\u304b\u3063\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002", "\u30de\u30f3\u30ac\u306e\u898b\u958b\u304d\u8868\u793a\u3092\u4fee\u6b63\u3002", "Firefox4\u3067\u30d6\u30c3\u30af\u30de\u30fc\u30af\u7de8\u96c6\u753b\u9762\u3067\u30bf\u30b0\u3092\u9078\u629e\u3067\u304d\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002", "\u30d6\u30c3\u30af\u30de\u30fc\u30af\u6e08\u307f\u306e\u30a4\u30e9\u30b9\u30c8\u3067\u30d6\u30c3\u30af\u30de\u30fc\u30af\u30dc\u30bf\u30f3\u304c\u8868\u793a\u3055\u308c\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002"], "version": "0.5.1", "releasenote": "http://crckyl.hatenablog.com/entry/2011/03/26/010347"}, {"date": "2011/02/15", "changes": ["conf.extension\u3092\u5ec3\u6b62\u3002Opera\u62e1\u5f35\u7248\u306e\u30c4\u30fc\u30eb\u30d0\u30fc\u30a2\u30a4\u30b3\u30f3\u3092\u524a\u9664\u3002", "Firefox\u3067\u30b3\u30e1\u30f3\u30c8\u8868\u793a\u6a5f\u80fd\u304c\u52d5\u4f5c\u3057\u3066\u3044\u306a\u304b\u3063\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002", "Firefox\u3067\u30d6\u30c3\u30af\u30de\u30fc\u30af\u7de8\u96c6\u30d5\u30a9\u30fc\u30e0\u3067\u30a2\u30ed\u30fc\u30ad\u30fc\u3067\u30bf\u30b0\u9078\u629e\u3092\u884c\u3046\u6642\u306b\u5165\u529b\u5c65\u6b74\u304c\u8868\u793a\u3055\u308c\u308b\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002", "\u30dd\u30c3\u30d7\u30a2\u30c3\u30d7\u306e\u30bf\u30b0\u7de8\u96c6\u306eUI\u3092\u30d6\u30c3\u30af\u30de\u30fc\u30af\u7de8\u96c6\u3068\u540c\u3058\u306b\u5909\u66f4\u3002", "\u30dd\u30c3\u30d7\u30a2\u30c3\u30d7\u3067\u30d6\u30c3\u30af\u30de\u30fc\u30af\u7de8\u96c6\u30e2\u30fc\u30c9\u306e\u307e\u307e\u4ed6\u306e\u30a4\u30e9\u30b9\u30c8\u306b\u79fb\u52d5\u3059\u308b\u3068\u30ad\u30e3\u30d7\u30b7\u30e7\u30f3\u304c\u8868\u793a\u3055\u308c\u306a\u304f\u306a\u308b\u30d0\u30b0\u3092\u4fee\u6b63\u3002", "\u30de\u30f3\u30ac\u30e2\u30fc\u30c9\u3067\u3082\u53ef\u80fd\u306a\u3089\u539f\u5bf8\u306e\u753b\u50cf\u3092\u4f7f\u7528\u3059\u308b\u3088\u3046\u306b\u5909\u66f4\u3002", "\u30e1\u30f3\u30d0\u30fc\u30a4\u30e9\u30b9\u30c8\u30da\u30fc\u30b8\u306a\u3069\u3092\u958b\u3044\u305f\u6642\u306b\u8a55\u4fa1\u306a\u3069\u304c\u51fa\u6765\u306a\u3044\u5834\u5408\u304c\u3042\u308b\u30d0\u30b0\u3092\u4fee\u6b63\u3002", "\u8a2d\u5b9a\u753b\u9762\u306e\u30c7\u30b6\u30a4\u30f3\u3092\u5909\u66f4\u3002", "Opera10.1x\u3067\u30dd\u30c3\u30d7\u30a2\u30c3\u30d7\u3092\u958b\u3044\u305f\u6642\u306b\u753b\u50cf\u304c\u8868\u793a\u3055\u308c\u306a\u3044\u30d0\u30b0\u3092\u4fee\u6b63\u3002", "\u5c0f\u8aac\u30da\u30fc\u30b8\u3067\u8a55\u4fa1\u3067\u304d\u306a\u304b\u3063\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002", "conf.expand_novel\u3092\u524a\u9664\u3002", "\u4ed6\u30e6\u30fc\u30b6\u30fc\u306e\u30d6\u30c3\u30af\u30de\u30fc\u30af\u30da\u30fc\u30b8\u3067\u52d5\u304b\u306a\u304f\u306a\u3063\u3066\u305f\u306e\u3092\u4fee\u6b63\u3002"], "version": "0.5.0", "releasenote": "http://crckyl.hatenablog.com/entry/2011/02/15/110202"}, {"date": "2011/02/04", "changes": ["pixivreader\u3068\u885d\u7a81\u3059\u308b\u3089\u3057\u3044\u306e\u3067\u3001exclude\u306b\u8ffd\u52a0\u3002", "\u8a2d\u5b9a\u307e\u308f\u308a\u3092\u4f5c\u308a\u76f4\u3057\u3002Chrome/Safari\u62e1\u5f35\u7248\u306b\u30aa\u30d7\u30b7\u30e7\u30f3\u30da\u30fc\u30b8\u8ffd\u52a0\u3002\u8a2d\u5b9a\u304c\u5f15\u304d\u7d99\u304c\u308c\u306a\u3044\u3002", "OperaExtension\u7248\u3067\u52d5\u4f5c\u3057\u306a\u3044\u5834\u5408\u304c\u3042\u308b\u30d0\u30b0\u3092\u305f\u3076\u3093\u4fee\u6b63\u3002", "\u95b2\u89a7\u3067\u304d\u306a\u3044\u30de\u30f3\u30ac\u304c\u3042\u3063\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002", "\u30ba\u30fc\u30e0\u6a5f\u80fd\u3067Firefox\u3092\u30b5\u30dd\u30fc\u30c8\u3002", "\u4f01\u753b\u76ee\u9332\u95a2\u9023\u30da\u30fc\u30b8\u306b\u5bfe\u5fdc\u3002", "\u30de\u30f3\u30ac\u30da\u30fc\u30b8\u306e\u5909\u66f4(\u898b\u958b\u304d\u8868\u793a\u306a\u3069)\u306b\u5bfe\u5fdc\u3002\u305d\u308c\u306b\u4f34\u3063\u3066conf.default_manga_type\u3068conf.popup_manga_tb\u3092\u524a\u9664\u3002", "\u4f5c\u54c1\u7ba1\u7406\u30da\u30fc\u30b8\u3067\u52d5\u4f5c\u3057\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002", "Chrome/Safari\u3067AutoPatchWork\u306b\u5bfe\u5fdc\u3002"], "version": "0.4.0", "releasenote": "http://crckyl.hatenablog.com/entry/2011/02/04/130234"}, {"date": "2011/01/15", "changes": ["\u30d6\u30c3\u30af\u30de\u30fc\u30af\u7ba1\u7406\u30da\u30fc\u30b8\u3067\u4e0a\u624b\u304f\u52d5\u4f5c\u3057\u3066\u3044\u306a\u304b\u3063\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002"], "version": "0.3.2", "releasenote": "http://crckyl.hatenablog.com/entry/2011/01/14/150150"}, {"date": "2011/01/14", "changes": ["Opera\u4ee5\u5916\u306e\u30d6\u30e9\u30a6\u30b6\u306b\u304a\u3044\u3066\u4e00\u90e8\u306e\u30da\u30fc\u30b8\u3067\u8a55\u4fa1\u3084\u30b3\u30e1\u30f3\u30c8\u8868\u793a\u306a\u3069\u306e\u6a5f\u80fd\u306e\u52d5\u4f5c\u304c\u5909\u3060\u3063\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002", "conf.popup.rate_key=true\u306e\u6642\u3001Shift\u30ad\u30fc\u306a\u3057\u3067\u8a55\u4fa1\u3067\u304d\u3066\u3044\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002", "ChromeExtension/SafariExtension\u7248\u3067\u81ea\u52d5\u30a2\u30c3\u30d7\u30c7\u30fc\u30c8\u306b\u5bfe\u5fdc\u3002", "OperaExtension\u7248\u306e\u30aa\u30d7\u30b7\u30e7\u30f3\u30da\u30fc\u30b8\u3067\u6570\u5024\u304cNaN\u306b\u306a\u308b\u5834\u5408\u304c\u3042\u308b\u30d0\u30b0\u3092\u305f\u3076\u3093\u4fee\u6b63\u3002"], "version": "0.3.1", "releasenote": "http://crckyl.hatenablog.com/entry/2011/01/14/090139"}, {"date": "2010/12/26", "changes": ["conf.fast_user_bookmark\u8ffd\u52a0\u3002", "\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb\u753b\u50cf\u306e\u5de6\u4e0a\u306b\u30a2\u30a4\u30b3\u30f3(\u30c1\u30a7\u30c3\u30af:\u304a\u6c17\u306b\u5165\u308a/\u30cf\u30fc\u30c8:\u76f8\u4e92/\u65d7:\u30de\u30a4\u30d4\u30af)\u3092\u8868\u793a\u3059\u308b\u6a5f\u80fd(conf.popup.author_status_icon)\u8ffd\u52a0\u3002", "\u30b3\u30e1\u30f3\u30c8\u8868\u793a\u6a5f\u80fd\u3092\u8ffd\u52a0\u3002", "\u30a2\u30f3\u30b1\u30fc\u30c8\u7d50\u679c\u306e\u8868\u793a\u3092\u5909\u66f4\u3002", "\u95b2\u89a7\u30fb\u8a55\u4fa1\u30fb\u30b3\u30e1\u30f3\u30c8\u5c65\u6b74\u30da\u30fc\u30b8\u306b\u5bfe\u5fdc\u3002", "\u30ad\u30fc\u30d0\u30a4\u30f3\u30c9\u3092\u5909\u66f4\u3002Shift+c:\u30b3\u30e1\u30f3\u30c8\u8868\u793a/d:\u30a2\u30f3\u30b1\u30fc\u30c8/a:\u623b\u308b", "\u30dd\u30c3\u30d7\u30a2\u30c3\u30d7\u306e\u30a4\u30d9\u30f3\u30c8API\u3092Popup.on*\u306e\u307f\u306b\u5909\u66f4\u3002", "conf.expand_novel\u8ffd\u52a0\u3002", "\u30e9\u30f3\u30ad\u30f3\u30b0\u30ab\u30ec\u30f3\u30c0\u30fc\u306b\u5bfe\u5fdc\u3002conf.popup_ranking_log\u8ffd\u52a0\u3002", "\u30a4\u30d9\u30f3\u30c8\u8a73\u7d30/\u53c2\u52a0\u8005\u30da\u30fc\u30b8\u306b\u5bfe\u5fdc\u3002", "Extension\u7248\u306b\u30c4\u30fc\u30eb\u30d0\u30fc\u30dc\u30bf\u30f3\u3068\u8a2d\u5b9a\u753b\u9762\u3092\u8ffd\u52a0\u3002conf.extension.*\u8ffd\u52a0\u3002", "\u30bf\u30b0\u306e\u4e26\u3079\u66ff\u3048\u3092\u8a2d\u5b9a\u3057\u3066\u3044\u306a\u3044\u6642\u3001\u30d6\u30c3\u30af\u30de\u30fc\u30af\u7de8\u96c6\u306e\u52d5\u4f5c\u304c\u304a\u304b\u3057\u304b\u3063\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002"], "version": "0.3.0", "releasenote": "http://crckyl.hatenablog.com/entry/2010/12/26/011246"}, {"date": "2010/12/01", "changes": ["Extension\u7248\u3067\u30a2\u30f3\u30b1\u30fc\u30c8\u306b\u7b54\u3048\u3089\u308c\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002", "\u30c8\u30c3\u30d7\u30da\u30fc\u30b8\u306e\u30ec\u30a4\u30a2\u30a6\u30c8\u3092\u30d0\u30c3\u30af\u30a2\u30c3\u30d7\u3059\u308b\u6a5f\u80fd\u8ffd\u52a0\u3002", "Extension\u7248\u306e\u81ea\u52d5\u30a2\u30c3\u30d7\u30c7\u30fc\u30c8\u306b\u5bfe\u5fdc\u3002", "\u4e0a\u4e0b\u30ad\u30fc\u3067\u30ad\u30e3\u30d7\u30b7\u30e7\u30f3\u3092\u30b9\u30af\u30ed\u30fc\u30eb\u3059\u308b\u3088\u3046\u306b\u5909\u66f4\u3002conf.popup.scroll_height\u8ffd\u52a0\u3002", "\u753b\u50cf\u3092\u62e1\u5927/\u7e2e\u5c0f\u3059\u308b\u30ad\u30fc\u3092o/i\u304b\u3089+/-\u306b\u5909\u66f4\u3002", "d\u30ad\u30fc(\u524d\u306e\u30a4\u30e9\u30b9\u30c8\u306b\u623b\u308b)\u3092\u30ad\u30fc\u30d0\u30a4\u30f3\u30c9\u306b\u8ffd\u52a0\u3002"], "version": "0.2.0", "releasenote": "http://crckyl.hatenablog.com/entry/2010/12/01/091212"}, {"date": "2010/11/14", "changes": ["\u4e00\u90e8\u306e\u30da\u30fc\u30b8\u3067\u30a2\u30f3\u30b1\u30fc\u30c8\u7d50\u679c\u3092\u8868\u793a\u51fa\u6765\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002", "\u30a2\u30f3\u30b1\u30fc\u30c8\u306b\u7b54\u3048\u305f\u5f8c\u3001\u9078\u629e\u80a2\u304c\u8868\u793a\u3055\u308c\u305f\u307e\u307e\u306b\u306a\u3063\u3066\u3044\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002", "\u30b9\u30bf\u30c3\u30af\u30d5\u30a3\u30fc\u30c9\u4e0a\u3067\u8a55\u4fa1\u3084\u30bf\u30b0\u7de8\u96c6\u304c\u51fa\u6765\u306a\u304b\u3063\u305f\u30d0\u30b0\u3092\u4fee\u6b63\u3002", "\u30de\u30a6\u30b9\u64cd\u4f5c\u7528UI\u306e\u8868\u793a\u3092\u5909\u66f4\u3002", "conf.popup.overlay_control\u8ffd\u52a0\u3002", "\u30de\u30f3\u30ac\u30da\u30fc\u30b8(mode=manga)\u3067\u6539\u30da\u30fc\u30b8\u51fa\u6765\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002", "\u8a55\u4fa1\u51fa\u6765\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u4e0d\u5177\u5408\u3092\u4fee\u6b63\u3002"], "version": "0.1.2", "releasenote": "http://crckyl.hatenablog.com/entry/2010/11/14/141112"}, {"date": "2010/11/02", "changes": ["\u30a4\u30d9\u30f3\u30c8\u30da\u30fc\u30b8(e.g. http://www.pixiv.net/event_halloween2010.php)\u7528\u306e\u6c4e\u7528\u30b3\u30fc\u30c9\u8ffd\u52a0\u3002", "conf.locate_recommend_right\u304c2\u306e\u6642\u3001\u4e0a\u624b\u304f\u52d5\u4f5c\u3057\u306a\u3044\u5834\u5408\u304c\u3042\u308b\u30d0\u30b0\u3092\u4fee\u6b63\u3002", "pixiv\u306e\u5909\u66f4(\u8a55\u4fa1\u3001\u30e9\u30f3\u30ad\u30f3\u30b0\u3001etc)\u306b\u5bfe\u5fdc\u3002"], "version": "0.1.1", "releasenote": "http://crckyl.hatenablog.com/entry/2010/11/02/091131"}, {"date": "2010/10/27", "changes": ["Opera11\u306eExtension\u306b\u5bfe\u5fdc\u3002", "\u30d6\u30c3\u30af\u30de\u30fc\u30af\u7ba1\u7406\u30da\u30fc\u30b8\u3067\u30ec\u30b3\u30e1\u30f3\u30c9\u3092\u53f3\u5074\u306b\u4e26\u3079\u308b\u6a5f\u80fd\u304c\u52d5\u4f5c\u3057\u306a\u304f\u306a\u3063\u3066\u3044\u305f\u306e\u3092\u4fee\u6b63\u3002", "AutoPatchWork\u306b\u5bfe\u5fdc\u3002"], "version": "0.1.0", "releasenote": "http://crckyl.hatenablog.com/entry/2010/10/27/121045"}];
_.svg={
id_suffix:{},
pencil:function(doc){ // src/data/pencil.svg
var idn=this.id_suffix["pencil"]=(++this.id_suffix["pencil"]||1);
var e0 = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
e0.setAttribute("width", "24");
e0.setAttribute("viewBox", "0 0 24 24");
e0.setAttribute("height", "24");
var e1 = doc.createElementNS("http://www.w3.org/2000/svg", "path");
e1.setAttribute("stroke-linejoin", "miter");
e1.setAttribute("stroke", "#000000");
e1.setAttribute("stroke-linecap", "butt");
e1.setAttribute("d", "m 17,2 5,5 -12,12 -7,2 2,-7 z");
e1.setAttribute("stroke-width", "1");
e1.setAttribute("fill", "none");
e0.appendChild(e1);
var e2 = doc.createElementNS("http://www.w3.org/2000/svg", "path");
e2.setAttribute("stroke", "none");
e2.setAttribute("d", "m 17,2 5,5 -12,12 -5,-5 z");
e2.setAttribute("fill", "#000000");
e0.appendChild(e2);
var e3 = doc.createElementNS("http://www.w3.org/2000/svg", "path");
e3.setAttribute("stroke", "none");
e3.setAttribute("d", "m 6,20 -3,1 1,-3 z");
e3.setAttribute("fill", "#000000");
e0.appendChild(e3);
e0.setAttribute("id", "pp-icon-pencil-" + idn);
e0.setAttribute("class", "pp-icon-pencil");
return e0;
}
,pencil_off:function(doc){ // src/data/pencil-off.svg
var idn=this.id_suffix["pencil-off"]=(++this.id_suffix["pencil-off"]||1);
var e0 = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
e0.setAttribute("width", "24");
e0.setAttribute("viewBox", "0 0 24 24");
e0.setAttribute("height", "24");
var e1 = doc.createElementNS("http://www.w3.org/2000/svg", "defs");
e0.appendChild(e1);
var e2 = doc.createElementNS("http://www.w3.org/2000/svg", "clipPath");
e2.setAttribute("clipPathUnits", "userSpaceOnUse");
e2.setAttribute("id", "pp-icon-pencil-off-clip1-"+idn);
e1.appendChild(e2);
var e3 = doc.createElementNS("http://www.w3.org/2000/svg", "path");
e3.setAttribute("d", "m 0,0 0,24 24,0 0,-24 -24,0 z m 3,1 20,20 -2,2 -20,-20 2,-2 z");
e2.appendChild(e3);
var e4 = doc.createElementNS("http://www.w3.org/2000/svg", "clipPath");
e4.setAttribute("clipPathUnits", "userSpaceOnUse");
e4.setAttribute("id", "pp-icon-pencil-off-clip2-"+idn);
e1.appendChild(e4);
var e5 = doc.createElementNS("http://www.w3.org/2000/svg", "path");
e5.setAttribute("d", "m 0,0 0,24 24,0 0,-24 -24,0 z m 16.875,1.4688 a 0.53576784,0.53576784 0 0 1 0.5,0.1562 l 5,5 a 0.53576784,0.53576784 0 0 1 0,0.75 l -12,12 a 0.53576784,0.53576784 0 0 1 -0.75,0 l -5,-5 a 0.53576784,0.53576784 0 0 1 0,-0.75 l 12,-12 a 0.53576784,0.53576784 0 0 1 0.25,-0.1562 z");
e4.appendChild(e5);
var e6 = doc.createElementNS("http://www.w3.org/2000/svg", "g");
e6.setAttribute("clip-path", "url(#pp-icon-pencil-off-clip1-" + idn + ")");
e0.appendChild(e6);
var e7 = doc.createElementNS("http://www.w3.org/2000/svg", "path");
e7.setAttribute("stroke-linejoin", "miter");
e7.setAttribute("stroke", "#000000");
e7.setAttribute("stroke-linecap", "butt");
e7.setAttribute("d", "m 17,2 5,5 -12,12 -7,2 2,-7 z");
e7.setAttribute("stroke-width", "1");
e7.setAttribute("fill", "none");
e6.appendChild(e7);
var e8 = doc.createElementNS("http://www.w3.org/2000/svg", "path");
e8.setAttribute("stroke", "none");
e8.setAttribute("d", "m 17,2 5,5 -12,12 -5,-5 z");
e8.setAttribute("fill", "#000000");
e6.appendChild(e8);
var e9 = doc.createElementNS("http://www.w3.org/2000/svg", "path");
e9.setAttribute("stroke", "none");
e9.setAttribute("d", "m 6,20 -3,1 1,-3 z");
e9.setAttribute("fill", "#000000");
e6.appendChild(e9);
var e10 = doc.createElementNS("http://www.w3.org/2000/svg", "path");
e10.setAttribute("fill", "#000000");
e10.setAttribute("d", "m 2,4 2,-2 18,18 -2,2 z");
e10.setAttribute("clip-path", "url(#pp-icon-pencil-off-clip2-" + idn + ")");
e0.appendChild(e10);
e0.setAttribute("id", "pp-icon-pencil-off-" + idn);
e0.setAttribute("class", "pp-icon-pencil-off");
return e0;
}
,cogwheel:function(doc){ // src/data/cogwheel.svg
var idn=this.id_suffix["cogwheel"]=(++this.id_suffix["cogwheel"]||1);
var e0 = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
e0.setAttribute("width", "24");
e0.setAttribute("viewBox", "0 0 24 24");
e0.setAttribute("height", "24");
var e1 = doc.createElementNS("http://www.w3.org/2000/svg", "defs");
e0.appendChild(e1);
var e2 = doc.createElementNS("http://www.w3.org/2000/svg", "clipPath");
e2.setAttribute("clipPathUnits", "userSpaceOnUse");
e2.setAttribute("id", "pp-icon-cogwheel-clip-"+idn);
e1.appendChild(e2);
var e3 = doc.createElementNS("http://www.w3.org/2000/svg", "path");
e3.setAttribute("d", "M 12,0 C 5.372583,0 0,5.3726 0,12 0,18.6274 5.372583,24 12,24 18.627417,24 24,18.6274 24,12 24,5.3726 18.627417,0 12,0 z m 0,9 c 1.656854,0 3,1.3431 3,3 0,1.6569 -1.343146,3 -3,3 -1.656854,0 -3,-1.3431 -3,-3 0,-1.6569 1.343146,-3 3,-3 z");
e2.appendChild(e3);
var e4 = doc.createElementNS("http://www.w3.org/2000/svg", "g");
e4.setAttribute("clip-path", "url(#pp-icon-cogwheel-clip-" + idn + ")");
e0.appendChild(e4);
var e5 = doc.createElementNS("http://www.w3.org/2000/svg", "path");
e5.setAttribute("d", "M 20,12 A 8,8 0 0 1 4,12 8,8 0 1 1 20,12 z");
e5.setAttribute("fill", "#000000");
e4.appendChild(e5);
var e6 = doc.createElementNS("http://www.w3.org/2000/svg", "rect");
e6.setAttribute("y", "2");
e6.setAttribute("x", "10");
e6.setAttribute("fill", "#000000");
e6.setAttribute("width", "4");
e6.setAttribute("height", "20");
e4.appendChild(e6);
var e7 = doc.createElementNS("http://www.w3.org/2000/svg", "rect");
e7.setAttribute("width", "4");
e7.setAttribute("y", "2");
e7.setAttribute("x", "-14");
e7.setAttribute("fill", "#000000");
e7.setAttribute("transform", "matrix(0,-1,1,0,0,0)");
e7.setAttribute("height", "20");
e4.appendChild(e7);
var e8 = doc.createElementNS("http://www.w3.org/2000/svg", "rect");
e8.setAttribute("width", "4");
e8.setAttribute("y", "-10");
e8.setAttribute("x", "14.970563");
e8.setAttribute("fill", "#000000");
e8.setAttribute("transform", "matrix(0.70710678,0.70710678,-0.70710678,0.70710678,0,0)");
e8.setAttribute("height", "20");
e4.appendChild(e8);
var e9 = doc.createElementNS("http://www.w3.org/2000/svg", "rect");
e9.setAttribute("width", "4");
e9.setAttribute("y", "6.9705629");
e9.setAttribute("x", "-2");
e9.setAttribute("fill", "#000000");
e9.setAttribute("transform", "matrix(0.70710678,-0.70710678,0.70710678,0.70710678,0,0)");
e9.setAttribute("height", "20");
e4.appendChild(e9);
e0.setAttribute("id", "pp-icon-cogwheel-" + idn);
e0.setAttribute("class", "pp-icon-cogwheel");
return e0;
}
,following:function(doc){ // src/data/following.svg
var idn=this.id_suffix["following"]=(++this.id_suffix["following"]||1);
var e0 = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
e0.setAttribute("width", "20");
e0.setAttribute("viewBox", "0 0 20 20");
e0.setAttribute("height", "20");
var e1 = doc.createElementNS("http://www.w3.org/2000/svg", "rect");
e1.setAttribute("width", "20");
e1.setAttribute("y", "0");
e1.setAttribute("x", "0");
e1.setAttribute("fill", "#1db11d");
e1.setAttribute("ry", "5");
e1.setAttribute("height", "20");
e0.appendChild(e1);
var e2 = doc.createElementNS("http://www.w3.org/2000/svg", "path");
e2.setAttribute("style", "fill:#ffffff");
e2.setAttribute("d", "m 8.4353163,16.788392 1.9062497,-0.1562 c 0.602606,-3.8426 2.842867,-6.7837005 7.4375,-9.1563005 l -1.59375,-3.4999 C 13.865127,6.4092915 10.442669,10.079492 9.284428,14.856992 8.3611468,12.359092 5.1347692,9.8150915 3.3728163,8.9134915 L 1.8699822,11.700151 c 3.3406703,0.375846 5.396555,2.023141 6.5653341,5.088241 z");
e0.appendChild(e2);
e0.setAttribute("id", "pp-icon-following-" + idn);
e0.setAttribute("class", "pp-icon-following");
return e0;
}
,heart:function(doc){ // src/data/heart.svg
var idn=this.id_suffix["heart"]=(++this.id_suffix["heart"]||1);
var e0 = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
e0.setAttribute("width", "20");
e0.setAttribute("viewBox", "0 0 20 20");
e0.setAttribute("height", "20");
var e1 = doc.createElementNS("http://www.w3.org/2000/svg", "rect");
e1.setAttribute("width", "20");
e1.setAttribute("y", "0");
e1.setAttribute("x", "0");
e1.setAttribute("fill", "#c83333");
e1.setAttribute("ry", "5");
e1.setAttribute("height", "20");
e0.appendChild(e1);
var e2 = doc.createElementNS("http://www.w3.org/2000/svg", "path");
e2.setAttribute("d", "M 5.6875 4.28125 C 5.003277 4.3311073 4.3361255 4.5662096 3.78125 4.96875 C 0.966201 7.0109571 1.688426 13.541035 10 16.53125 C 18.311574 13.541035 19.033799 7.0109571 16.21875 4.96875 C 14.739082 3.8953089 12.493276 4.0327239 11.0625 5.59375 C 10.806177 5.8734074 10.259657 6.6063425 10 7.75 C 9.740343 6.6063425 9.193823 5.8734074 8.9375 5.59375 C 8.043265 4.6181087 6.8278716 4.1981544 5.6875 4.28125 z ");
e2.setAttribute("fill", "#ffffff");
e0.appendChild(e2);
e0.setAttribute("id", "pp-icon-heart-" + idn);
e0.setAttribute("class", "pp-icon-heart");
return e0;
}
,mypixiv:function(doc){ // src/data/mypixiv.svg
var idn=this.id_suffix["mypixiv"]=(++this.id_suffix["mypixiv"]||1);
var e0 = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
e0.setAttribute("width", "20");
e0.setAttribute("viewBox", "0 0 20 20");
e0.setAttribute("height", "20");
var e1 = doc.createElementNS("http://www.w3.org/2000/svg", "rect");
e1.setAttribute("width", "20");
e1.setAttribute("y", "0");
e1.setAttribute("x", "0");
e1.setAttribute("fill", "#2458c3");
e1.setAttribute("ry", "5");
e1.setAttribute("height", "20");
e0.appendChild(e1);
var e2 = doc.createElementNS("http://www.w3.org/2000/svg", "path");
e2.setAttribute("d", "M 15,7 A 5,5 0 1 1 5,7 5,5 0 1 1 15,7 z");
e2.setAttribute("fill", "#ffffff");
e0.appendChild(e2);
var e3 = doc.createElementNS("http://www.w3.org/2000/svg", "rect");
e3.setAttribute("width", "12");
e3.setAttribute("y", "12");
e3.setAttribute("x", "4");
e3.setAttribute("fill", "#ffffff");
e3.setAttribute("ry", "3");
e3.setAttribute("height", "6");
e0.appendChild(e3);
var e4 = doc.createElementNS("http://www.w3.org/2000/svg", "rect");
e4.setAttribute("width", "12");
e4.setAttribute("y", "15");
e4.setAttribute("x", "4");
e4.setAttribute("fill", "#ffffff");
e4.setAttribute("ry", "0");
e4.setAttribute("height", "3");
e0.appendChild(e4);
e0.setAttribute("id", "pp-icon-mypixiv-" + idn);
e0.setAttribute("class", "pp-icon-mypixiv");
return e0;
}
,ugoira:function(doc){ // src/data/ugoira.svg
var idn=this.id_suffix["ugoira"]=(++this.id_suffix["ugoira"]||1);
var e0 = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
e0.setAttribute("width", "24");
e0.setAttribute("viewBox", "0 0 24 24");
e0.setAttribute("height", "24");
var e1 = doc.createElementNS("http://www.w3.org/2000/svg", "defs");
e0.appendChild(e1);
var e2 = doc.createElementNS("http://www.w3.org/2000/svg", "clipPath");
e2.setAttribute("id", "pp-icon-ugoira-progress-clip-"+idn);
e2.setAttribute("class", "pp-indicator-progress");
e1.appendChild(e2);
var e3 = doc.createElementNS("http://www.w3.org/2000/svg", "path");
e3.setAttribute("d", "M 12,12 12,0 24,0 24,24 0,24 0,0 12,0 Z");
e2.appendChild(e3);
var e4 = doc.createElementNS("http://www.w3.org/2000/svg", "path");
e4.setAttribute("clip-path", "url(#pp-icon-ugoira-progress-clip-" + idn + ")");
e4.setAttribute("stroke", "#000000");
e4.setAttribute("stroke-width", "2");
e4.setAttribute("d", "M 22,12 A 10,10 0 1 1 2,12 10,10 0 1 1 22,12 z");
e4.setAttribute("fill", "none");
e0.appendChild(e4);
var e5 = doc.createElementNS("http://www.w3.org/2000/svg", "path");
e5.setAttribute("stroke", "#000000");
e5.setAttribute("stroke-width", "2");
e5.setAttribute("fill", "none");
e5.setAttribute("class", "pp-icon-ugoira-playing");
e5.setAttribute("d", "M 8,6 8,18 19,12 z");
e0.appendChild(e5);
var e6 = doc.createElementNS("http://www.w3.org/2000/svg", "path");
e6.setAttribute("stroke", "#000000");
e6.setAttribute("stroke-width", "2");
e6.setAttribute("fill", "none");
e6.setAttribute("class", "pp-icon-ugoira-paused");
e6.setAttribute("d", "M 7,7 10,7 10,17 7,18 z M 14,7 17,7 17,17 14,17 z");
e0.appendChild(e6);
e0.setAttribute("id", "pp-icon-ugoira-" + idn);
e0.setAttribute("class", "pp-icon-ugoira");
return e0;
}
,manga:function(doc){ // src/data/manga.svg
var idn=this.id_suffix["manga"]=(++this.id_suffix["manga"]||1);
var e0 = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
e0.setAttribute("width", "24");
e0.setAttribute("viewBox", "0 0 24 24");
e0.setAttribute("height", "24");
var e1 = doc.createElementNS("http://www.w3.org/2000/svg", "defs");
e0.appendChild(e1);
var e2 = doc.createElementNS("http://www.w3.org/2000/svg", "mask");
e2.setAttribute("maskUnits", "userSpaceOnUse");
e2.setAttribute("id", "pp-icon-manga-frame-mask-"+idn);
e1.appendChild(e2);
var e3 = doc.createElementNS("http://www.w3.org/2000/svg", "rect");
e3.setAttribute("width", "24");
e3.setAttribute("stroke", "none");
e3.setAttribute("y", "0");
e3.setAttribute("x", "0");
e3.setAttribute("fill", "#fff");
e3.setAttribute("class", "pp-icon-manga-frame-mask-1");
e3.setAttribute("height", "24");
e2.appendChild(e3);
var e4 = doc.createElementNS("http://www.w3.org/2000/svg", "rect");
e4.setAttribute("width", "20");
e4.setAttribute("stroke", "none");
e4.setAttribute("y", "2");
e4.setAttribute("x", "2");
e4.setAttribute("fill", "#000");
e4.setAttribute("class", "pp-icon-manga-frame-mask-2");
e4.setAttribute("height", "20");
e2.appendChild(e4);
var e5 = doc.createElementNS("http://www.w3.org/2000/svg", "rect");
e5.setAttribute("opacity", "0.4");
e5.setAttribute("mask", "url(#pp-icon-manga-frame-mask-" + idn + ")");
e5.setAttribute("height", "24");
e5.setAttribute("width", "24");
e5.setAttribute("stroke", "none");
e5.setAttribute("y", "0");
e5.setAttribute("x", "0");
e5.setAttribute("class", "pp-icon-manga-frame");
e5.setAttribute("fill", "#000");
e0.appendChild(e5);
var e6 = doc.createElementNS("http://www.w3.org/2000/svg", "rect");
e6.setAttribute("opacity", "0.1");
e6.setAttribute("height", "20");
e6.setAttribute("width", "20");
e6.setAttribute("stroke", "none");
e6.setAttribute("y", "2");
e6.setAttribute("x", "2");
e6.setAttribute("class", "pp-icon-manga-progress");
e6.setAttribute("fill", "#000");
e0.appendChild(e6);
var e7 = doc.createElementNS("http://www.w3.org/2000/svg", "g");
e7.setAttribute("style", "display:none");
e0.appendChild(e7);
var e8 = doc.createElementNS("http://www.w3.org/2000/svg", "path");
e8.setAttribute("data-pp-char", "-");
e8.setAttribute("stroke-width", "1");
e8.setAttribute("stroke", "#000");
e8.setAttribute("d", "M -2,-4 2,-4");
e7.appendChild(e8);
var e9 = doc.createElementNS("http://www.w3.org/2000/svg", "path");
e9.setAttribute("data-pp-char", "/");
e9.setAttribute("stroke-width", "1");
e9.setAttribute("stroke", "#000");
e9.setAttribute("d", "M 2,-9 -2,0");
e7.appendChild(e9);
var e10 = doc.createElementNS("http://www.w3.org/2000/svg", "path");
e10.setAttribute("data-pp-char", "0");
e10.setAttribute("fill", "#000");
e10.setAttribute("d", "m 0.04101562,-8.859375 q 1.58203128,0 2.43164068,1.4648438 0.6738281,1.1601562 0.6738281,3 0,1.8222656 -0.6738281,3.0058593 Q 1.6347656,0.05859375 0,0.05859375 q -1.6289062,0 -2.4667969,-1.44726565 -0.6738281,-1.1835937 -0.6738281,-3.0175781 0,-2.5546875 1.2363281,-3.7207031 0.7851563,-0.7324219 1.94531252,-0.7324219 z M 0,-7.9921875 q -0.9375,0 -1.4765625,0.9492188 -0.5507813,0.9609375 -0.5507813,2.6542968 0,1.6582031 0.5390626,2.6132813 Q -0.94335938,-0.83789063 0,-0.83789063 q 1.1308594,0 1.6757812,-1.31835937 0.3574219,-0.8847656 0.3574219,-2.296875 0,-1.6464844 -0.5507812,-2.5898437 Q 0.92578125,-7.9921875 0,-7.9921875 Z");
e10.setAttribute("transform", "translate(8,16.5)");
e7.appendChild(e10);
var e11 = doc.createElementNS("http://www.w3.org/2000/svg", "path");
e11.setAttribute("data-pp-char", "1");
e11.setAttribute("fill", "#000");
e11.setAttribute("d", "m 0.83789063,-0.1171875 -1.05468751,0 0,-7.5761719 q -0.99023432,0.3398438 -2.08593752,0.5742188 l -0.1933594,-0.8144531 q 1.57031255,-0.3925782 2.66601567,-0.9316407 l 0.66796876,0 0,8.7480469 z");
e11.setAttribute("transform", "translate(16,16.5)");
e7.appendChild(e11);
var e12 = doc.createElementNS("http://www.w3.org/2000/svg", "path");
e12.setAttribute("data-pp-char", "2");
e12.setAttribute("fill", "#000");
e12.setAttribute("d", "m 3.0820313,-0.1171875 -6.0234376,0 0,-0.9960937 q 0.7089844,-1.6523438 2.71289067,-3.0175782 L 0.10546875,-4.3535156 Q 1.1308594,-5.0566406 1.453125,-5.4492187 1.8222656,-5.90625 1.8222656,-6.4570312 q 0,-0.609375 -0.4335937,-1.0429688 -0.48046877,-0.4804687 -1.25976565,-0.4804687 -1.56445315,0 -2.05078125,1.7402343 L -2.8476563,-6.5742187 Q -2.1796875,-8.859375 0.1875,-8.859375 q 1.2949219,0 2.0625,0.7675781 0.6738281,0.6914063 0.6738281,1.6699219 0,0.7265625 -0.4335937,1.3183594 -0.3984375,0.5742187 -1.8339844,1.4707031 l -0.25195312,0.1523437 q -1.82812498,1.1308594 -2.34960938,2.4140626 l 5.0273438,0 0,0.9492187 z");
e12.setAttribute("transform", "translate(24,16.5)");
e7.appendChild(e12);
var e13 = doc.createElementNS("http://www.w3.org/2000/svg", "path");
e13.setAttribute("data-pp-char", "3");
e13.setAttribute("fill", "#000");
e13.setAttribute("d", "m 0.68554687,-4.5351562 q 2.10937503,0.375 2.10937503,2.1328124 0,1.0605469 -0.7089844,1.72851568 -0.7851563,0.73242187 -2.22070312,0.73242187 -2.15039068,0 -3.10546878,-1.71093745 l 0.8789063,-0.4687501 q 0.6621094,1.29492192 2.21484373,1.29492192 0.91406249,0 1.41796877,-0.46875002 0.4804687,-0.4453125 0.4804687,-1.1308594 0,-0.796875 -0.7207031,-1.2832031 Q 0.375,-4.1542969 -0.69726562,-4.1542969 l -0.52734378,0 0,-0.8496093 0.55078128,0 q 1.078125,0 1.64648437,-0.4101563 0.60937495,-0.4335937 0.60937495,-1.1660156 0,-0.796875 -0.68554682,-1.1777344 -0.43945313,-0.2636719 -1.0546875,-0.2636719 -1.30664058,0 -1.92773438,1.3125 l -0.8789063,-0.421875 q 0.8613282,-1.7285156 2.81835943,-1.7285156 1.23632807,0 2.00390627,0.6269531 Q 2.625,-7.6289062 2.625,-6.6269531 q 0,0.9492187 -0.7441406,1.5527344 Q 1.4003906,-4.6875 0.68554687,-4.5820312 l 0,0.046875 z");
e13.setAttribute("transform", "translate(32,16.5)");
e7.appendChild(e13);
var e14 = doc.createElementNS("http://www.w3.org/2000/svg", "path");
e14.setAttribute("data-pp-char", "4");
e14.setAttribute("d", "m 3.3691406,-2.1738281 -1.4179687,0 0,2.0566406 -0.96093752,0 0,-2.0566406 -4.40039068,0 0,-0.9609375 4.2304688,-5.6367188 1.1308594,0 0,5.7070313 1.4179687,0 0,0.890625 z m -2.3203125,-5.53125 -0.035156,0 q -0.5214844,0.84375 -1.04296878,1.546875 l -2.32617192,3.09375 3.34570318,0 0,-2.8300781 q 0,-0.6152344 0.0585937,-1.8105469 z");
e14.setAttribute("fill", "#000");
e7.appendChild(e14);
var e15 = doc.createElementNS("http://www.w3.org/2000/svg", "path");
e15.setAttribute("data-pp-char", "5");
e15.setAttribute("d", "m -1.5703125,-4.8808594 q 0.85546875,-0.6738281 1.86328125,-0.6738281 1.20703125,0 2.00390625,0.8144531 0.7441406,0.7792969 0.7441406,1.9335938 0,1.0488281 -0.6386718,1.8457031 -0.8027344,1.01953125 -2.37304692,1.01953125 -2.00976558,0 -2.92968748,-1.52929685 l 0.8789062,-0.4570313 q 0.6972657,1.11328127 2.01562502,1.11328127 0.84960938,0 1.41796878,-0.52734377 0.5859375,-0.5566406 0.5859375,-1.4765625 0,-0.8671875 -0.515625,-1.3828125 -0.53906252,-0.5390625 -1.40625003,-0.5390625 -1.21874997,0 -1.84570307,0.9375 l -0.9023438,-0.1171875 0.5507812,-4.7695312 4.7285157,0 0,0.9023437 -3.8730469,0 -0.3867187,2.90625 0.082031,0 z");
e15.setAttribute("fill", "#000");
e7.appendChild(e15);
var e16 = doc.createElementNS("http://www.w3.org/2000/svg", "path");
e16.setAttribute("data-pp-char", "6");
e16.setAttribute("d", "m -1.7988281,-4.3652344 q 0.84960935,-1.2246093 2.20898435,-1.2246093 1.25976565,0 2.02734375,0.8789062 0.6738281,0.7617187 0.6738281,1.8574219 0,1.1953125 -0.7558593,2.03906247 -0.7851563,0.87304688 -2.0507813,0.87304688 -1.5058594,0 -2.3554688,-1.14843745 -0.8261718,-1.1191407 -0.8261718,-3.0878907 0,-2.2441406 0.9960937,-3.5273437 0.90234377,-1.1542969 2.36132815,-1.1542969 1.72265625,0 2.50781255,1.3125 l -0.8613282,0.46875 q -0.4804687,-0.9140625 -1.59374998,-0.9140625 -2.21484372,0 -2.37890622,3.6269531 l 0.046875,0 z M 0.234375,-4.7753906 q -0.85546875,0 -1.4179687,0.6386719 Q -1.6875,-3.5625 -1.6875,-2.8886719 q 0,0.7207031 0.4453125,1.3066407 0.59765625,0.77929682 1.51171875,0.77929682 0.95507815,0 1.46484375,-0.77929682 0.3457031,-0.5332032 0.3457031,-1.2363282 0,-0.8261719 -0.4570312,-1.359375 Q 1.0957031,-4.7753906 0.234375,-4.7753906 Z");
e16.setAttribute("fill", "#000");
e7.appendChild(e16);
var e17 = doc.createElementNS("http://www.w3.org/2000/svg", "path");
e17.setAttribute("data-pp-char", "7");
e17.setAttribute("d", "m 2.9648438,-7.9921875 q -2.54882817,4.0429687 -3.4101563,7.875 l -1.2128906,0 q 0.84960935,-3.328125 3.4101562,-7.6230469 l -4.7285156,0 0,-0.9492187 5.9414063,0 0,0.6972656 z");
e17.setAttribute("fill", "#000");
e7.appendChild(e17);
var e18 = doc.createElementNS("http://www.w3.org/2000/svg", "path");
e18.setAttribute("data-pp-char", "8");
e18.setAttribute("d", "m 0.984375,-4.546875 q 2.1738281,0.7382812 2.1738281,2.3027344 0,1.2304687 -1.125,1.87499997 Q 1.2128906,0.10546875 0,0.10546875 q -1.21875,0 -2.0390625,-0.47460938 -1.0898438,-0.62695312 -1.0898438,-1.83984377 0,-1.5175781 1.9921876,-2.2558593 l 0,-0.035156 q -1.7402344,-0.6269531 -1.7402344,-2.0742187 0,-1.1132813 0.9375,-1.7812501 0.796875,-0.5625 1.94531248,-0.5625 1.28320312,0 2.08593752,0.6621094 0.7910156,0.6269532 0.7910156,1.5703125 0,1.6113282 -1.8984375,2.1035157 l 0,0.035156 z m -0.96679687,-0.375 q 1.82226557,-0.4335937 1.82226557,-1.6933594 0,-0.7265625 -0.6035156,-1.1660156 Q 0.74414062,-8.1503906 0,-8.1503906 q -0.76757812,0 -1.2832031,0.4101562 -0.5273438,0.4335938 -0.5273438,1.1425782 0,0.6972656 0.5683594,1.1132812 0.26367187,0.2167969 0.69140625,0.3867188 Q -0.10546875,-4.9160156 0,-4.9160156 q 0.00585938,0 0.01757813,-0.00586 z m -0.08789063,0.7851563 q -1.9804688,0.5214843 -1.9804688,1.8574218 0,0.8261719 0.7324219,1.2363282 0.55078128,0.31054683 1.30664065,0.31054683 1.06054685,0 1.63476565,-0.57421873 0.421875,-0.421875 0.421875,-1.03125 0,-0.6445313 -0.5917969,-1.125 -0.3398438,-0.2695313 -0.82617188,-0.46875 -0.52148437,-0.2050781 -0.67382812,-0.2050781 -0.01171875,0 -0.0234375,0 z");
e18.setAttribute("fill", "#000");
e7.appendChild(e18);
var e19 = doc.createElementNS("http://www.w3.org/2000/svg", "path");
e19.setAttribute("data-pp-char", "9");
e19.setAttribute("d", "m 1.8164062,-4.4179687 q -0.82617182,1.2011718 -2.19726558,1.2011718 -1.04882812,0 -1.81054692,-0.6386719 -0.9023437,-0.7558593 -0.9023437,-2.0742187 0,-1.21875 0.7558594,-2.0683594 0.7734375,-0.8613281 2.06249997,-0.8613281 1.74609373,0 2.57226563,1.453125 0.5976563,1.0722656 0.5976563,2.7714844 0,2.2910156 -0.9726563,3.5332031 -0.9140625,1.16015625 -2.38476563,1.16015625 -1.70507817,0 -2.58398437,-1.37695315 l 0.8671875,-0.46875 q 0.5683594,0.98437502 1.6875,0.98437502 2.1914062,0 2.3554687,-3.61523432 l -0.046875,0 z m -2.05664058,-3.6035157 q -0.82031252,0 -1.34179682,0.6152344 -0.4687501,0.5566406 -0.4687501,1.40625 0,0.8613281 0.4453126,1.3535156 0.515625,0.5917969 1.40039057,0.5917969 0.984375,0 1.54101563,-0.7675781 0.3691406,-0.515625 0.3691406,-1.1191406 0,-0.7207032 -0.4335937,-1.3007813 -0.59765628,-0.7792969 -1.51171878,-0.7792969 z");
e19.setAttribute("fill", "#000");
e7.appendChild(e19);
e0.setAttribute("id", "pp-icon-manga-" + idn);
e0.setAttribute("class", "pp-icon-manga");
return e0;
}
,multipage:function(doc){ // src/data/multipage.svg
var idn=this.id_suffix["multipage"]=(++this.id_suffix["multipage"]||1);
var e0 = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
e0.setAttribute("width", "160");
e0.setAttribute("viewBox", "0 0 100 100");
e0.setAttribute("height", "160");
var e1 = doc.createElementNS("http://www.w3.org/2000/svg", "defs");
e0.appendChild(e1);
var e2 = doc.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
e2.setAttribute("y1", "50%");
e2.setAttribute("x2", "100%");
e2.setAttribute("x1", "50%");
e2.setAttribute("y2", "100%");
e2.setAttribute("id", "pp-icon-multipage-gradient-"+idn);
e1.appendChild(e2);
var e3 = doc.createElementNS("http://www.w3.org/2000/svg", "stop");
e3.setAttribute("stop-color", "#000000");
e3.setAttribute("stop-opacity", "0");
e3.setAttribute("offset", "0%");
e2.appendChild(e3);
var e4 = doc.createElementNS("http://www.w3.org/2000/svg", "stop");
e4.setAttribute("stop-color", "#000000");
e4.setAttribute("stop-opacity", "1");
e4.setAttribute("offset", "100%");
e2.appendChild(e4);
var e5 = doc.createElementNS("http://www.w3.org/2000/svg", "rect");
e5.setAttribute("width", "100");
e5.setAttribute("y", "0");
e5.setAttribute("x", "0");
e5.setAttribute("fill", "url(#pp-icon-multipage-gradient-" + idn + ")");
e5.setAttribute("id", "pp-popup-multipage-icon-bg-"+idn);
e5.setAttribute("height", "100");
e0.appendChild(e5);
var e6 = doc.createElementNS("http://www.w3.org/2000/svg", "rect");
e6.setAttribute("y", "58");
e6.setAttribute("x", "64");
e6.setAttribute("fill", "#ffffff");
e6.setAttribute("width", "18");
e6.setAttribute("height", "24");
e0.appendChild(e6);
var e7 = doc.createElementNS("http://www.w3.org/2000/svg", "path");
e7.setAttribute("d", "M 84 63 l 3 0 l 0 24 l -18 0 l 0 -3 l 15 0 z");
e7.setAttribute("fill", "#ffffff");
e0.appendChild(e7);
var e8 = doc.createElementNS("http://www.w3.org/2000/svg", "path");
e8.setAttribute("d", "M 89 68 l 3 0 l 0 24 l -18 0 l 0 -3 l 15 0 z");
e8.setAttribute("fill", "#ffffff");
e0.appendChild(e8);
e0.setAttribute("id", "pp-icon-multipage-" + idn);
e0.setAttribute("class", "pp-icon-multipage");
return e0;
}
,olc_arrow:function(doc){ // src/data/olc-arrow.svg
var idn=this.id_suffix["olc-arrow"]=(++this.id_suffix["olc-arrow"]||1);
var e0 = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
e0.setAttribute("width", "100");
e0.setAttribute("viewBox", "0 0 100 100");
e0.setAttribute("height", "100");
var e1 = doc.createElementNS("http://www.w3.org/2000/svg", "path");
e1.setAttribute("stroke-linejoin", "round");
e1.setAttribute("stroke", "#222");
e1.setAttribute("stroke-width", "10");
e1.setAttribute("d", "M 10 50 l 45 -45 l 0 30 l 35 0 l 0 30 l -35 0 l 0 30 z");
e1.setAttribute("fill", "#ddd");
e0.appendChild(e1);
e0.setAttribute("id", "pp-icon-olc-arrow-" + idn);
e0.setAttribute("class", "pp-icon-olc-arrow");
return e0;
}
,rating_error:function(doc){ // src/data/rating-error.svg
var idn=this.id_suffix["rating-error"]=(++this.id_suffix["rating-error"]||1);
var e0 = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
e0.setAttribute("width", "260");
e0.setAttribute("height", "26");
var e1 = doc.createElementNS("http://www.w3.org/2000/svg", "line");
e1.setAttribute("y1", "1");
e1.setAttribute("x2", "260");
e1.setAttribute("stroke", "#d8292c");
e1.setAttribute("x1", "0");
e1.setAttribute("y2", "26");
e0.appendChild(e1);
var e2 = doc.createElementNS("http://www.w3.org/2000/svg", "line");
e2.setAttribute("y1", "26");
e2.setAttribute("x2", "260");
e2.setAttribute("stroke", "#d8292c");
e2.setAttribute("x1", "0");
e2.setAttribute("y2", "1");
e0.appendChild(e2);
e0.setAttribute("id", "pp-icon-rating-error-" + idn);
e0.setAttribute("class", "pp-icon-rating-error");
return e0;
}
,comment_loading:function(doc){ // src/data/comment-loading.svg
var idn=this.id_suffix["comment-loading"]=(++this.id_suffix["comment-loading"]||1);
var e0 = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
e0.setAttribute("width", "50");
e0.setAttribute("viewBox", "0 0 50 50");
e0.setAttribute("height", "50");
var e1 = doc.createElementNS("http://www.w3.org/2000/svg", "path");
e1.setAttribute("stroke", "#444");
e1.setAttribute("stroke-width", "5");
e1.setAttribute("d", "M 45,25 A 20,20 0 0 1 32.653669,43.477591 20,20 0 0 1 10.857864,39.142135 20,20 0 0 1 6.5224095,17.346331 20,20 0 0 1 25,5");
e1.setAttribute("fill", "none");
e0.appendChild(e1);
var e2 = doc.createElementNS("http://www.w3.org/2000/svg", "animateTransform");
e2.setAttribute("to", "360 25 25");
e2.setAttribute("from", "0 25 25");
e2.setAttribute("attributeType", "xml");
e2.setAttribute("type", "rotate");
e2.setAttribute("repeatCount", "indefinite");
e2.setAttribute("dur", "2s");
e2.setAttribute("attributeName", "transform");
e1.appendChild(e2);
e0.setAttribute("id", "pp-icon-comment-loading-" + idn);
e0.setAttribute("class", "pp-icon-comment-loading");
return e0;
}
,comment_error:function(doc){ // src/data/comment-error.svg
var idn=this.id_suffix["comment-error"]=(++this.id_suffix["comment-error"]||1);
var e0 = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
e0.setAttribute("width", "50");
e0.setAttribute("viewBox", "0 0 50 50");
e0.setAttribute("height", "50");
var e1 = doc.createElementNS("http://www.w3.org/2000/svg", "circle");
e1.setAttribute("cy", "25");
e1.setAttribute("cx", "25");
e1.setAttribute("r", "24");
e1.setAttribute("stroke", "none");
e1.setAttribute("fill", "#444");
e0.appendChild(e1);
var e2 = doc.createElementNS("http://www.w3.org/2000/svg", "path");
e2.setAttribute("stroke", "none");
e2.setAttribute("d", "m 23,38 0,4 4,0 0,-4 z");
e2.setAttribute("fill", "#fff");
e0.appendChild(e2);
var e3 = doc.createElementNS("http://www.w3.org/2000/svg", "path");
e3.setAttribute("stroke", "none");
e3.setAttribute("d", "m 23,35 -1,-25 6,0 -1,25 z");
e3.setAttribute("fill", "#fff");
e0.appendChild(e3);
e0.setAttribute("id", "pp-icon-comment-error-" + idn);
e0.setAttribute("class", "pp-icon-comment-error");
return e0;
}
,comment_reply_to:function(doc){ // src/data/comment-reply-to.svg
var idn=this.id_suffix["comment-reply-to"]=(++this.id_suffix["comment-reply-to"]||1);
var e0 = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
e0.setAttribute("width", "24");
e0.setAttribute("viewBox", "0 0 24 24");
e0.setAttribute("height", "24");
var e1 = doc.createElementNS("http://www.w3.org/2000/svg", "path");
e1.setAttribute("stroke", "none");
e1.setAttribute("d", "m 10.292969,1.1908482 2.18164,3.4472656 C 10.35287,6.0157873 5.4060663,9.5185409 4.2128906,13.257255 c -2.441942,7.6517 4.5585938,9.652344 4.5585938,9.652343 0,0 -0.6845863,-2.242734 0.7460937,-4.990234 1.3910079,-2.671159 5.3152499,-5.213399 7.3124999,-6.392578 L 19.095703,15.106864 21.652344,3.7474888 10.292969,1.1908482 Z");
e1.setAttribute("fill", "#000");
e0.appendChild(e1);
e0.setAttribute("id", "pp-icon-comment-reply-to-" + idn);
e0.setAttribute("class", "pp-icon-comment-reply-to");
return e0;
}
,comments:function(doc){ // src/data/comments.svg
var idn=this.id_suffix["comments"]=(++this.id_suffix["comments"]||1);
var e0 = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
e0.setAttribute("width", "24");
e0.setAttribute("viewBox", "0 0 24 24");
e0.setAttribute("height", "24");
var e1 = doc.createElementNS("http://www.w3.org/2000/svg", "defs");
e0.appendChild(e1);
var e2 = doc.createElementNS("http://www.w3.org/2000/svg", "mask");
e2.setAttribute("id", "mask4218-"+idn);
e1.appendChild(e2);
var e3 = doc.createElementNS("http://www.w3.org/2000/svg", "rect");
e3.setAttribute("width", "19");
e3.setAttribute("stroke", "none");
e3.setAttribute("y", "-5");
e3.setAttribute("x", "1");
e3.setAttribute("fill", "#fff");
e3.setAttribute("height", "25");
e2.appendChild(e3);
var e4 = doc.createElementNS("http://www.w3.org/2000/svg", "rect");
e4.setAttribute("strile", "none");
e4.setAttribute("rx", "4");
e4.setAttribute("ry", "4");
e4.setAttribute("height", "21");
e4.setAttribute("width", "18");
e4.setAttribute("y", "-5");
e4.setAttribute("x", "5");
e4.setAttribute("fill", "#000");
e2.appendChild(e4);
var e5 = doc.createElementNS("http://www.w3.org/2000/svg", "path");
e5.setAttribute("d", "M 8,18 5.9238281,19 C 5.4766652,22.163366 3,23 3,23 c 5.0108953,0 6.635146,-2.54389 7.166016,-4 z");
e5.setAttribute("fill", "#000");
e0.appendChild(e5);
var e6 = doc.createElementNS("http://www.w3.org/2000/svg", "rect");
e6.setAttribute("rx", "4");
e6.setAttribute("mask", "url(#mask4218-" + idn + ")");
e6.setAttribute("ry", "4");
e6.setAttribute("height", "13");
e6.setAttribute("width", "16");
e6.setAttribute("stroke", "none");
e6.setAttribute("y", "6");
e6.setAttribute("x", "2");
e6.setAttribute("fill", "#000");
e0.appendChild(e6);
var e7 = doc.createElementNS("http://www.w3.org/2000/svg", "rect");
e7.setAttribute("rx", "2.5");
e7.setAttribute("ry", "2.5");
e7.setAttribute("height", "13");
e7.setAttribute("width", "16");
e7.setAttribute("stroke", "none");
e7.setAttribute("y", "1");
e7.setAttribute("x", "7");
e7.setAttribute("fill", "#000");
e0.appendChild(e7);
e0.setAttribute("id", "pp-icon-comments-" + idn);
e0.setAttribute("class", "pp-icon-comments");
return e0;
}
,star_white:function(doc){ // src/data/star-white.svg
var idn=this.id_suffix["star-white"]=(++this.id_suffix["star-white"]||1);
var e0 = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
e0.setAttribute("width", "24");
e0.setAttribute("viewBox", "0 0 24 24");
e0.setAttribute("height", "24");
var e1 = doc.createElementNS("http://www.w3.org/2000/svg", "path");
e1.setAttribute("stroke-linejoin", "round");
e1.setAttribute("fill", "none");
e1.setAttribute("d", "m 12,2.5 2.435653,6.6476114 7.074912,0.2622189 -5.569596,4.3706677 1.936883,6.809672 L 12,16.64378 6.1221473,20.59017 8.0590308,13.780499 2.4894349,9.4098298 9.5643471,9.1476114 Z");
e1.setAttribute("stroke", "#000");
e1.setAttribute("stroke-width", "2");
e0.appendChild(e1);
e0.setAttribute("id", "pp-icon-star-white-" + idn);
e0.setAttribute("class", "pp-icon-star-white");
return e0;
}
,star_black:function(doc){ // src/data/star-black.svg
var idn=this.id_suffix["star-black"]=(++this.id_suffix["star-black"]||1);
var e0 = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
e0.setAttribute("width", "24");
e0.setAttribute("viewBox", "0 0 24 24");
e0.setAttribute("height", "24");
var e1 = doc.createElementNS("http://www.w3.org/2000/svg", "path");
e1.setAttribute("stroke-linejoin", "round");
e1.setAttribute("fill", "#fc0");
e1.setAttribute("d", "m 12,2.5 2.435653,6.6476114 7.074912,0.2622189 -5.569596,4.3706677 1.936883,6.809672 L 12,16.64378 6.1221473,20.59017 8.0590308,13.780499 2.4894349,9.4098298 9.5643471,9.1476114 Z");
e1.setAttribute("stroke", "#888");
e1.setAttribute("stroke-width", "1.8");
e0.appendChild(e1);
e0.setAttribute("id", "pp-icon-star-black-" + idn);
e0.setAttribute("class", "pp-icon-star-black");
return e0;
}
,response:function(doc){ // src/data/response.svg
var idn=this.id_suffix["response"]=(++this.id_suffix["response"]||1);
var e0 = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
e0.setAttribute("width", "24");
e0.setAttribute("viewBox", "0 0 24 24");
e0.setAttribute("height", "24");
var e1 = doc.createElementNS("http://www.w3.org/2000/svg", "path");
e1.setAttribute("d", "m 10.292969,1.1908482 2.18164,3.4472656 C 10.35287,6.0157873 5.4060663,9.5185409 4.2128906,13.257255 c -2.441942,7.6517 4.5585938,9.652344 4.5585938,9.652343 0,0 -0.6845863,-2.242734 0.7460937,-4.990234 1.3910079,-2.671159 5.3152499,-5.213399 7.3124999,-6.392578 L 19.095703,15.106864 21.652344,3.7474888 10.292969,1.1908482 Z");
e1.setAttribute("fill", "#000");
e0.appendChild(e1);
e0.setAttribute("id", "pp-icon-response-" + idn);
e0.setAttribute("class", "pp-icon-response");
return e0;
}
,rm_fit_long:function(doc){ // src/data/rm-fit-long.svg
var idn=this.id_suffix["rm-fit-long"]=(++this.id_suffix["rm-fit-long"]||1);
var e0 = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
e0.setAttribute("width", "24");
e0.setAttribute("viewBox", "0 0 24 24");
e0.setAttribute("height", "24");
var e1 = doc.createElementNS("http://www.w3.org/2000/svg", "path");
e1.setAttribute("d", "m 5,8 -4,4 4,4 0,-3 6,0 0,3 -3,0 4,4 4,-4 -3,0 0,-3 6,0 0,3 4,-4 -4,-4 0,3 -6,0 0,-3 3,0 -4,-4 -4,4 3,0 0,3 -6,0 z");
e1.setAttribute("fill", "#000");
e0.appendChild(e1);
e0.setAttribute("id", "pp-icon-rm-fit-long-" + idn);
e0.setAttribute("class", "pp-icon-rm-fit-long");
return e0;
}
,rm_fit_short:function(doc){ // src/data/rm-fit-short.svg
var idn=this.id_suffix["rm-fit-short"]=(++this.id_suffix["rm-fit-short"]||1);
var e0 = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
e0.setAttribute("width", "24");
e0.setAttribute("viewBox", "0 0 24 24");
e0.setAttribute("height", "24");
var e1 = doc.createElementNS("http://www.w3.org/2000/svg", "path");
e1.setAttribute("d", "m 9,3 -6,0 0,6 2,-2 5,5 -5,5 -2,-2 0,6 6,0 -2,-2 5,-5 5,5 -2,2 6,0 0,-6 -2,2 -5,-5 5,-5 2,2 0,-6 -6,0 2,2 -5,5 -5,-5 z");
e1.setAttribute("fill", "#000");
e0.appendChild(e1);
e0.setAttribute("id", "pp-icon-rm-fit-short-" + idn);
e0.setAttribute("class", "pp-icon-rm-fit-short");
return e0;
}
,rm_original:function(doc){ // src/data/rm-original.svg
var idn=this.id_suffix["rm-original"]=(++this.id_suffix["rm-original"]||1);
var e0 = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
e0.setAttribute("width", "24");
e0.setAttribute("viewBox", "0 0 24 24");
e0.setAttribute("height", "24");
var e1 = doc.createElementNS("http://www.w3.org/2000/svg", "defs");
e0.appendChild(e1);
var e2 = doc.createElementNS("http://www.w3.org/2000/svg", "mask");
e2.setAttribute("id", "mask4150-"+idn);
e1.appendChild(e2);
var e3 = doc.createElementNS("http://www.w3.org/2000/svg", "rect");
e3.setAttribute("y", "0");
e3.setAttribute("x", "0");
e3.setAttribute("fill", "#fff");
e3.setAttribute("width", "24");
e3.setAttribute("height", "24");
e2.appendChild(e3);
var e4 = doc.createElementNS("http://www.w3.org/2000/svg", "rect");
e4.setAttribute("stroke-linejoin", "round");
e4.setAttribute("height", "5");
e4.setAttribute("width", "7");
e4.setAttribute("stroke", "#000");
e4.setAttribute("y", "12");
e4.setAttribute("x", "11");
e4.setAttribute("stroke-width", "1");
e4.setAttribute("fill", "#000");
e2.appendChild(e4);
var e5 = doc.createElementNS("http://www.w3.org/2000/svg", "rect");
e5.setAttribute("stroke-linejoin", "round");
e5.setAttribute("mask", "url(#mask4150-" + idn + ")");
e5.setAttribute("height", "20");
e5.setAttribute("width", "18");
e5.setAttribute("stroke", "#000");
e5.setAttribute("y", "2");
e5.setAttribute("x", "3");
e5.setAttribute("stroke-width", "1");
e5.setAttribute("fill", "#000");
e0.appendChild(e5);
e0.setAttribute("id", "pp-icon-rm-original-" + idn);
e0.setAttribute("class", "pp-icon-rm-original");
return e0;
}
,like_off:function(doc){ // src/data/like-off.svg
var idn=this.id_suffix["like-off"]=(++this.id_suffix["like-off"]||1);
var e0 = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
e0.setAttribute("width", "24");
e0.setAttribute("viewBox", "0 0 24 24");
e0.setAttribute("height", "24");
var e1 = doc.createElementNS("http://www.w3.org/2000/svg", "circle");
e1.setAttribute("stroke", "none");
e1.setAttribute("cx", "19");
e1.setAttribute("r", "3");
e1.setAttribute("cy", "8");
e1.setAttribute("fill", "#000");
e0.appendChild(e1);
var e2 = doc.createElementNS("http://www.w3.org/2000/svg", "circle");
e2.setAttribute("stroke", "none");
e2.setAttribute("cx", "5");
e2.setAttribute("r", "3");
e2.setAttribute("cy", "8");
e2.setAttribute("fill", "#000");
e0.appendChild(e2);
var e3 = doc.createElementNS("http://www.w3.org/2000/svg", "path");
e3.setAttribute("fill", "none");
e3.setAttribute("d", "m 19.564232,15.780594 a 14,14 0 0 1 -15.1284648,-1e-6");
e3.setAttribute("stroke", "#000");
e3.setAttribute("stroke-linecap", "round");
e3.setAttribute("stroke-width", "3");
e0.appendChild(e3);
e0.setAttribute("id", "pp-icon-like-off-" + idn);
e0.setAttribute("class", "pp-icon-like-off");
return e0;
}
,like_on:function(doc){ // src/data/like-on.svg
var idn=this.id_suffix["like-on"]=(++this.id_suffix["like-on"]||1);
var e0 = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
e0.setAttribute("width", "24");
e0.setAttribute("viewBox", "0 0 24 24");
e0.setAttribute("height", "24");
var e1 = doc.createElementNS("http://www.w3.org/2000/svg", "circle");
e1.setAttribute("stroke", "none");
e1.setAttribute("cx", "19");
e1.setAttribute("r", "3");
e1.setAttribute("cy", "8");
e1.setAttribute("fill", "#258fb8");
e0.appendChild(e1);
var e2 = doc.createElementNS("http://www.w3.org/2000/svg", "circle");
e2.setAttribute("stroke", "none");
e2.setAttribute("cx", "5");
e2.setAttribute("r", "3");
e2.setAttribute("cy", "8");
e2.setAttribute("fill", "#258fb8");
e0.appendChild(e2);
var e3 = doc.createElementNS("http://www.w3.org/2000/svg", "path");
e3.setAttribute("fill", "none");
e3.setAttribute("d", "m 19.564232,15.780594 a 14,14 0 0 1 -15.1284648,-1e-6");
e3.setAttribute("stroke", "#258fb8");
e3.setAttribute("stroke-linecap", "round");
e3.setAttribute("stroke-width", "3");
e0.appendChild(e3);
e0.setAttribute("id", "pp-icon-like-on-" + idn);
e0.setAttribute("class", "pp-icon-like-on");
return e0;
}
,vote_off:function(doc){ // src/data/vote-off.svg
var idn=this.id_suffix["vote-off"]=(++this.id_suffix["vote-off"]||1);
var e0 = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
e0.setAttribute("width", "24");
e0.setAttribute("viewBox", "0 0 24 24");
e0.setAttribute("height", "24");
var e1 = doc.createElementNS("http://www.w3.org/2000/svg", "defs");
e0.appendChild(e1);
var e2 = doc.createElementNS("http://www.w3.org/2000/svg", "clipPath");
e2.setAttribute("id", "clipPath4207-"+idn);
e1.appendChild(e2);
var e3 = doc.createElementNS("http://www.w3.org/2000/svg", "rect");
e3.setAttribute("y", "0.16044484");
e3.setAttribute("width", "22");
e3.setAttribute("height", "20");
e3.setAttribute("transform", "matrix(0.83388204,-0.55194271,0.55194271,0.83388204,0,0)");
e3.setAttribute("x", "1.873877");
e2.appendChild(e3);
var e4 = doc.createElementNS("http://www.w3.org/2000/svg", "rect");
e4.setAttribute("stroke-linejoin", "round");
e4.setAttribute("clip-path", "url(#clipPath4207-" + idn + ")");
e4.setAttribute("transform", "matrix(0.83388204,0.55194271,-0.55194271,0.83388204,-0.87387708,-0.16044484)");
e4.setAttribute("height", "15.738512");
e4.setAttribute("width", "11.153802");
e4.setAttribute("stroke", "#000");
e4.setAttribute("y", "-4.4117341");
e4.setAttribute("x", "12.408394");
e4.setAttribute("stroke-width", "3");
e4.setAttribute("fill", "none");
e0.appendChild(e4);
var e5 = doc.createElementNS("http://www.w3.org/2000/svg", "path");
e5.setAttribute("stroke", "#000");
e5.setAttribute("stroke-width", "3");
e5.setAttribute("stroke-linecap", "round");
e5.setAttribute("d", "m 3,20 18,0");
e5.setAttribute("fill", "none");
e0.appendChild(e5);
e0.setAttribute("id", "pp-icon-vote-off-" + idn);
e0.setAttribute("class", "pp-icon-vote-off");
return e0;
}
,vote_on:function(doc){ // src/data/vote-on.svg
var idn=this.id_suffix["vote-on"]=(++this.id_suffix["vote-on"]||1);
var e0 = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
e0.setAttribute("width", "24");
e0.setAttribute("viewBox", "0 0 24 24");
e0.setAttribute("height", "24");
var e1 = doc.createElementNS("http://www.w3.org/2000/svg", "defs");
e0.appendChild(e1);
var e2 = doc.createElementNS("http://www.w3.org/2000/svg", "clipPath");
e2.setAttribute("id", "clipPath4208-"+idn);
e1.appendChild(e2);
var e3 = doc.createElementNS("http://www.w3.org/2000/svg", "rect");
e3.setAttribute("y", "0.16044484");
e3.setAttribute("width", "22");
e3.setAttribute("height", "20");
e3.setAttribute("transform", "matrix(0.83388204,-0.55194271,0.55194271,0.83388204,0,0)");
e3.setAttribute("x", "1.873877");
e2.appendChild(e3);
var e4 = doc.createElementNS("http://www.w3.org/2000/svg", "rect");
e4.setAttribute("stroke-linejoin", "round");
e4.setAttribute("clip-path", "url(#clipPath4208-" + idn + ")");
e4.setAttribute("transform", "matrix(0.83388204,0.55194271,-0.55194271,0.83388204,-0.87387708,-0.16044484)");
e4.setAttribute("height", "15.738512");
e4.setAttribute("width", "11.153802");
e4.setAttribute("stroke", "#258fb8");
e4.setAttribute("y", "-4.4117341");
e4.setAttribute("x", "12.408394");
e4.setAttribute("stroke-width", "3");
e4.setAttribute("fill", "none");
e0.appendChild(e4);
var e5 = doc.createElementNS("http://www.w3.org/2000/svg", "path");
e5.setAttribute("stroke", "#258fb8");
e5.setAttribute("stroke-width", "3");
e5.setAttribute("stroke-linecap", "round");
e5.setAttribute("d", "m 3,20 18,0");
e5.setAttribute("fill", "none");
e0.appendChild(e5);
e0.setAttribute("id", "pp-icon-vote-on-" + idn);
e0.setAttribute("class", "pp-icon-vote-on");
return e0;
}
,triangle:function(doc){ // src/data/triangle.svg
var idn=this.id_suffix["triangle"]=(++this.id_suffix["triangle"]||1);
var e0 = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
e0.setAttribute("width", "8");
e0.setAttribute("viewBox", "0 0 8 16");
e0.setAttribute("height", "16");
var e1 = doc.createElementNS("http://www.w3.org/2000/svg", "path");
e1.setAttribute("stroke", "none");
e1.setAttribute("d", "M 0,0 L0,16 L8,8 z");
e1.setAttribute("fill", "#000");
e0.appendChild(e1);
e0.setAttribute("id", "pp-icon-triangle-" + idn);
e0.setAttribute("class", "pp-icon-triangle");
return e0;
}
,cross:function(doc){ // src/data/cross.svg
var idn=this.id_suffix["cross"]=(++this.id_suffix["cross"]||1);
var e0 = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
e0.setAttribute("width", "16");
e0.setAttribute("viewBox", "0 0 16 16");
e0.setAttribute("height", "16");
var e1 = doc.createElementNS("http://www.w3.org/2000/svg", "path");
e1.setAttribute("stroke", "#000");
e1.setAttribute("stroke-width", "2");
e1.setAttribute("d", "M1,1 L15,15 M1,15 L15,1");
e1.setAttribute("fill", "none");
e0.appendChild(e1);
e0.setAttribute("id", "pp-icon-cross-" + idn);
e0.setAttribute("class", "pp-icon-cross");
return e0;
}
,};

    _.run();
});
