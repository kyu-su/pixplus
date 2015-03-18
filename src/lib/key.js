_.key = {
  keycode_map: { },
  canonical_map: {
    Spacebar: 'Space',
    Esc: 'Escape',
    '+': 'plus',
    ',': 'comma',
    ' ': 'Space',
    '\t': 'Tab'
  },
  global: {
    connection: null,
    handlers: []
  },

  parse_event: function(ev) {
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
    ].forEach(function(p) {
      if (p[0] && keys.indexOf(p[1]) < 0) {
        keys.unshift(p[1]);
      }
    });

    return keys.join('+');
  },

  listen: function(context, listener, options) {
    var that = this, suspend = null;
    return _.listen(context, ['keydown', 'keypress'], function(ev, connection) {
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

  listen_global: function(listener) {
    var that = this;

    if (!this.global.connection) {
      _.debug('key.listen_global: begin');

      this.global.connection = this.listen(w, function() {
        for(var i = 0; i < that.global.handlers.length; ++i) {
          var ret = that.global.handlers[i].apply(this, arguments);
          if (ret) {
            return ret;
          }
        }
        return false;
      }, {capture: true});
    }

    this.global.handlers.unshift(listener);

    return {
      disconnect: function() {
        var idx = that.global.handlers.indexOf(listener);
        if (idx >= 0) {
          that.global.handlers.splice(idx, 1);
        }
        if (that.global.handlers.length === 0) {
          that.global.connection.disconnect();
          that.global.connection = null;

          _.debug('key.listen_global: end');
        }
      }
    };
  },

  init: function() {
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

    ].forEach(function(p) {
      var code = p[0], name = p[1];
      that.keycode_map[code] = name;
    });
  }
};
