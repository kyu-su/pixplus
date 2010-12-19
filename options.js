document.addEventListener('DOMContentLoaded', init, false);
function init() {
  var root = document.getElementById('options-root');
  var table = document.createElement('table');
  table.className = 'config-table';
  root.appendChild(table);

  var idx;
  conf.each(
    function(sec, key) {
      if (sec.name == 'bookmark') return;

      var input = document.createElement('input');
      var value = conf.get(sec.name, key), type = typeof sec.schema[key][0];
      var row = table.insertRow(-1), cell = row.insertCell(-1);
      row.className = 'entry ' + (idx & 1 ? 'odd' : 'even');
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
        cell.appendChild(input);
      }

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
          conf.remove(sec.name, key, value);
        }, false);
      row.insertCell(-1).appendChild(def);
      row.insertCell(-1).innerText = sec.schema[key][1];

      input.addEventListener(
        type == 'boolean' ? 'change' : 'keyup',
        function() {
          var value;
          if (type == 'boolean') {
            value = input.checked;
          } else {
            value = conf.conv[type][0](input.value);
          }
          conf.set(sec.name, key, value);
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
  tag_order_textarea.value = conf.get('bookmark', 'tag_order');
  tag_order_textarea.addEventListener(
    'keyup',
    function() {
      conf.set('bookmark', 'tag_order', tag_order_textarea.value);
    }, false);
  tocont.appendChild(tag_order_textarea);

  var tacont = make_custom_section('Tag alias');
  tacont.innerText = '\u30b9\u30da\u30fc\u30b9\u533a\u5207\u308a\u3067\u8907\u6570\u8a18\u8ff0\u3002\u30d6\u30c3' +
    '\u30af\u30de\u30fc\u30af\u6642\u306e\u30bf\u30b0\u306e\u81ea\u52d5\u5165\u529b\u306b\u4f7f\u7528\u3002';
  (function() {
     var table = document.createElement('table');
     table.className = 'tagalias-table';
     tacont.appendChild(table);

     var add = document.createElement('button');
     add.innerText = 'Add';
     add.addEventListener('click', function() { add_row(); }, false);
     tacont.appendChild(add);

     var aliases = parser.parse_bm_tag_aliases(conf.get('bookmark', 'tag_aliases'));
     aliases.keys.forEach(function(key) { add_row(key, aliases.map[key]); });

     function add_row(tag, list) {
       var row = table.insertRow(-1), cell, remove, input1, input2;
       remove = document.createElement('button');
       remove.innerText = 'Remove';
       remove.addEventListener(
         'click',
         function() {
           row.parentNode.removeChild(row);
           save();
         }, false);
       cell = row.insertCell(-1);
       cell.className = 'cell-remove';
       cell.appendChild(remove);

       input1 = document.createElement('input');
       input1.value = tag || '';
       input1.addEventListener('keyup', save, false);
       cell = row.insertCell(-1);
       cell.className = 'cell-tag';
       cell.appendChild(input1);

       input2 = document.createElement('input');
       input2.value = list ? list.join(' ') : '';
       input2.addEventListener('keyup', save, false);
       cell = row.insertCell(-1);
       cell.className = 'cell-aliases';
       cell.appendChild(input2);
     }

     function save() {
       var tag_aliases = '';
       Array.prototype.forEach.apply(
         table.rows,
         [function(row) {
            var inputs = row.getElementsByTagName('input');
            var key = inputs[0].value;
            var val = inputs[1].value;
            if (key && val) tag_aliases += key + '\n' + val + '\n';
          }]);
       conf.set('bookmark', 'tag_aliases', tag_aliases);
     }
   })();

  function make_custom_section(label) {
    make_section(label);
    var row = table.insertRow(-1), cell = row.insertCell(-1);
    row.className = 'section-custom';
    cell.setAttribute('colspan', '4');
    return cell;
  }
  function make_section(label) {
    var row = table.insertRow(-1);
    row.className = 'section';
    var cell = row.insertCell(-1);
    cell.setAttribute('colspan', '4');
    cell.innerText = label;
    idx = 0;
    return row;
  }
}
