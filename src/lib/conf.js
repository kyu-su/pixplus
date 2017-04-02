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
    },

    debug_xhr_block_urls: {
      parse: function(str) {
        return str.split(',');
      },

      dump: function(urls) {
        return urls.join(',');
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
};
