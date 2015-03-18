_.fastxml = {
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

  remove_selector: function(root, selector) {
    var that = this;
    this.qa(root, selector).forEach(function(node) {
      that.remove_from_parent(node);
    });
  },

  remove_from_parent: function(node) {
    if (!node || !node.parent) {
      return;
    }

    var idx = node.parent.children.indexOf(node);
    if (idx >= 0) {
      node.parent.children.splice(idx, 1);
    }
  },

  html: function(node, all) {
    if (!node || (!all && this.ignore_elements.test(node.tag))) {
      return '';
    }
    return (node.raw_open || '') + this.inner_html(node, all) + (node.raw_close || '');
  },

  inner_html: function(node, all) {
    if (!node || (!all && this.ignore_elements.test(node.tag))) {
      return '';
    }
    if (node.text) {
      return node.text;
    }
    var that = this;
    return node.children.reduce(function(a, b) {
      return a + that.html(b, all);
    }, '');
  },

  text: function(node, all) {
    if (!node || (!all && this.ignore_elements.test(node.tag))) {
      return '';
    }
    if (node.text) {
      return node.text;
    }
    var that = this;
    return node.children.map(function(c) {
      return c.text || that.text(c);
    }).join('');
  }
};
