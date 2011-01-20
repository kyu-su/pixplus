document.addEventListener('DOMContentLoaded', init, false);

function init() {
  if (window.safari) {
    safari.self.addEventListener(
      'message',
      function(ev) {
        if (ev.name == 'config') {
          conf.get = function(s, n) {
            return ev.message[s + '_' + n];
          };
          conf.set = function(s, n, v) {
            safari.self.tab.dispatchMessage('config-set', {section: s, key: n, value: v});
          };
          conf.remove = function(s, n) {
            safari.self.tab.dispatchMessage('config-remove', {section: s, key: n});
          };
          init_real();
        }
      }, false);
    safari.self.tab.dispatchMessage('config', null);
  } else {
    init_real();
  }
}

function ConfigUI(root, st, option_page) {
  this.root = root;

  var btn_bmlet = document.createElement('a');
  btn_bmlet.textContent = 'Bookmarklet';
  root.appendChild(btn_bmlet);

  var table = document.createElement('table');
  table.id = 'pp-conf-table';
  root.appendChild(table);

  var input_table = { };

  var idx;
  st.each(
    function(sec, key) {
      if (sec.name == 'bookmark') return;

      var value = st.conf ? st.conf[key] : st.get(sec.name, key);
      var type = typeof sec.schema[key][0];
      var row = table.insertRow(-1), cell = row.insertCell(-1), input;
      row.className = 'pp-conf-entry pp-conf-entry-' + (idx & 1 ? 'odd' : 'even');
      if (sec.schema[key][2]) {
        input = document.createElement('select');
        for(var i = 0; i < sec.schema[key][2].length; ++i) {
          var entry = sec.schema[key][2][i];
          var opt = document.createElement('option');
          if (typeof entry === 'string') {
            opt.value = opt.textContent = entry;
          } else {
            opt.value = entry.value;
            opt.textContent = entry.title;
          }
          input.appendChild(opt);
        }
      } else {
        input = document.createElement('input');
      }
      if (type == 'boolean') {
        input.setAttribute('type', 'checkbox');
        input.checked = value;

        var label = document.createElement('label');
        label.appendChild(input);
        label.appendChild(document.createTextNode(key));

        cell.appendChild(label);
        cell.setAttribute('colspan', '2');
      } else {
        cell.innerText = key;
        input.value = value;
        cell = row.insertCell(-1);
        cell.className = 'pp-conf-cell-value';
        cell.appendChild(input);
      }
      input_table[sec.name + '_' + key] = input;

      var def = document.createElement('button');
      def.innerText = 'Default';
      def.addEventListener(
        'click',
        function() {
          if (type == 'boolean') {
            input.checked = sec.schema[key][0];
          } else {
            input.value = sec.schema[key][0];
          }
          if (st.u) st.remove(sec.name, key, value);
          update_bookmarklet();
        }, false);
      row.insertCell(-1).appendChild(def);
      row.insertCell(-1).innerText = sec.schema[key][1];

      input.addEventListener(
        sec.schema[key][2] || type == 'boolean' ? 'change' : 'keyup',
        function() {
          var value;
          if (type == 'boolean') {
            value = input.checked;
          } else {
            value = st.conv[type][0](input.value);
          }
          if (st.u) st.set(sec.name, key, value);
          update_bookmarklet();
        }, false);

      ++idx;
    },
    function(sec) {
      if (sec.name == 'bookmark') return;
      make_section(sec.label);
    });

  var tocont = make_custom_section('Tag order');
  tocont.innerText = '\u30d6\u30c3\u30af\u30de\u30fc\u30af\u30bf\u30b0\u306e\u4e26\u3079\u66ff' +
    '\u3048\u3068\u30b0\u30eb\u30fc\u30d4\u30f3\u30b0\u30021\u884c1\u30bf\u30b0\u3002\n' +
    '"-": \u30bb\u30d1\u30ec\u30fc\u30bf\n"*": \u6b8b\u308a\u5168\u90e8';
  var tag_order_textarea = document.createElement('textarea');
  tag_order_textarea.rows = '20';
  tag_order_textarea.value = st.get('bookmark', 'tag_order');
  tag_order_textarea.addEventListener(
    'keyup',
    function() {
      if (st.u) st.set('bookmark', 'tag_order', tag_order_textarea.value);
      update_bookmarklet();
    }, false);
  tocont.appendChild(tag_order_textarea);

  var tacont = make_custom_section('Tag alias');
  tacont.innerText = '\u30b9\u30da\u30fc\u30b9\u533a\u5207\u308a\u3067\u8907\u6570\u8a18\u8ff0\u3002\u30d6\u30c3' +
    '\u30af\u30de\u30fc\u30af\u6642\u306e\u30bf\u30b0\u306e\u81ea\u52d5\u5165\u529b\u306b\u4f7f\u7528\u3002';
  var tag_alias_table = document.createElement('table');
  tag_alias_table.id = 'pp-tagalias-table';
  tacont.appendChild(tag_alias_table);
  (function() {
     var add = document.createElement('button');
     add.innerText = 'Add';
     add.addEventListener('click', function() { add_row(); }, false);
     tacont.appendChild(add);

     var aliases = st.parse_bm_tag_aliases(st.get('bookmark', 'tag_aliases'));
     aliases.keys.forEach(function(key) { add_row(key, aliases.map[key]); });

     function add_row(tag, list) {
       var row = tag_alias_table.insertRow(-1), cell, remove, input1, input2;
       remove = document.createElement('button');
       remove.innerText = 'Remove';
       remove.addEventListener(
         'click',
         function() {
           row.parentNode.removeChild(row);
           save();
         }, false);
       cell = row.insertCell(-1);
       cell.className = 'pp-conf-cell-remove';
       cell.appendChild(remove);

       input1 = document.createElement('input');
       input1.value = tag || '';
       input1.addEventListener('keyup', save, false);
       cell = row.insertCell(-1);
       cell.className = 'pp-conf-cell-tag';
       cell.appendChild(input1);

       input2 = document.createElement('input');
       input2.value = list ? list.join(' ') : '';
       input2.addEventListener('keyup', save, false);
       cell = row.insertCell(-1);
       cell.className = 'pp-conf-cell-aliases';
       cell.appendChild(input2);
     }

     function save() {
       if (st.u) st.set('bookmark', 'tag_aliases', get_tag_alias_str());
       update_bookmarklet();
     }
   })();
  update_bookmarklet();

  function make_custom_section(label) {
    make_section(label);
    var row = table.insertRow(-1), cell = row.insertCell(-1);
    row.className = 'pp-conf-section-custom';
    cell.setAttribute('colspan', '4');
    return cell;
  }
  function make_section(label) {
    var row = table.insertRow(-1);
    row.className = 'pp-conf-section';
    var cell = row.insertCell(-1);
    cell.setAttribute('colspan', '4');
    cell.innerText = label;
    idx = 0;
    return row;
  }
  function get_tag_alias_str() {
    var tag_aliases = '';
    for(var i = 0; i < tag_alias_table.rows.length; ++i) {
      var row = tag_alias_table.rows[i];
      var inputs = row.getElementsByTagName('input');
      var key = inputs[0].value;
      var val = inputs[1].value;
      if (key && val) tag_aliases += key + '\n' + val + '\n';
    }
    return tag_aliases;
  }
  function update_bookmarklet() {
    btn_bmlet.href = 'javascript:(function(){' + gen_js() + '})()';
  }

  function gen_js() {
    var js = 'var pp=window.opera?window.opera.pixplus:window.pixplus;';
    var order = st.parse_bm_tag_order(tag_order_textarea.value);
    var alias = st.parse_bm_tag_aliases(get_tag_alias_str());
    st.each(
      function(sec, key) {
        if (sec.name == 'bookmark') return;
        var input = input_table[sec.name + '_' + key], val;
        if (typeof sec.schema[key][0] == 'boolean') {
          val = input.checked;
        } else {
          val = st.get_conv(sec.name, key)[0](input.value);
        }
        if (val !== sec.schema[key][0]) {
          js += 'pp.' + sec.path.join('.') + '.' + key + '=' + stringify(val) + ';';
        }
      });
    if (order.length) {
      js += 'pp.conf.bm_tag_order=[';
      for(var i = 0; i < order.length; ++i) {
        var ary = order[i];
        js += '[';
        for(var j = 0; j < ary.length; ++j) {
          var tag = ary[j];
          js += (tag ? stringify(tag) : 'null') + ',';
        }
        js += '],';
      }
      js += '];';
    }
    for(var i = 0; i < alias.keys.length; ++i) {
      var key = alias.keys[i];
      if (i == 0) js += 'pp.conf.bm_tag_aliases={';
      js += stringify(key) + ':[';
      for(var j = 0; j < alias.map[key].length; ++j) {
        var tag = alias.map[key][j];
        js += stringify(tag) + ',';
      }
      js += '],';
    }
    if (alias.keys.length) js += '};';
    return js;

    function stringify(val) {
      if (window.JSON && window.JSON.stringify) return JSON.stringify(val);
      if (typeof val == 'string') {
        return '"' + val.replace(/[\\\"]/g, '\\$0') + '"';
      } else {
        return val.toString();
      }
    }
  }
}
function init_real() {
  new ConfigUI(document.getElementById('options-root'), conf);
}
