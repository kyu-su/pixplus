conf.init_map();

var tag_aliases_list = document.getElementById('conf_bookmark_tag_aliases');
var tag_alias_dialog;

tag_aliases_init();

function tag_aliases_init() {
  var tag_aliases = conf.parse_bm_tag_aliases(pref.getCharPref('conf_bookmark_tag_aliases'));
  Array.prototype.forEach.apply(
    tag_aliases_list.getElementsByTagName('listitem'),
    [function(row) { row.parentNode.removeChild(row); }]);
  for(var key in tag_aliases) {
    var row = tag_aliases_add_row();
    row[1].setAttribute('label', key);
    row[2].setAttribute('label', tag_aliases[key].join(' '));
  }
}
function tag_aliases_add_row() {
  var row = document.createElement('listitem');
  var cell1 = document.createElement('listcell');
  var cell2 = document.createElement('listcell');
  var cell3 = document.createElement('listcell');
  cell2.setAttribute('label', '=');
  row.appendChild(cell1);
  row.appendChild(cell2);
  row.appendChild(cell3);
  tag_aliases_list.appendChild(row);
  return [row, cell1, cell3];
}
function tag_aliases_get_row_data(row) {
  var cells = row.getElementsByTagName('listcell');
  return [cells[0].getAttribute('label'), cells[2].getAttribute('label'), cells[0], cells[2]];
}

function tag_aliases_add() {
  var row = tag_aliases_add_row();
  row[1].setAttribute('label', 'Tag');
  row[2].setAttribute('label', 'Tag1 Tag2');
  tag_aliases_list.selectedItem = row[0];
  tag_aliases_edit();
}
function tag_aliases_remove() {
  if (!tag_aliases_list.selectedItem) return;
  tag_aliases_list.removeChild(tag_aliases_list.selectedItem);
}
function tag_aliases_edit() {
  if (!tag_aliases_list.selectedItem) return;
  var item = tag_aliases_get_row_data(tag_aliases_list.selectedItem);
  var data = {complete: false, tag: item[0], aliases: item[1].split(/ +/)};
  openDialog('chrome://pixplus/content/tag_alias.xul', null, 'modal,resizable', data);
  if (data.complete) {
    item[2].setAttribute('label', data.tag);
    item[3].setAttribute('label', data.aliases.join(' '));
  }
}
function tag_aliases_to_string() {
  var val = '';
  Array.prototype.forEach.apply(
    tag_aliases_list.getElementsByTagName('listitem'),
    [function(row) {
       row = tag_aliases_get_row_data(row);
       val += row[0] + '\n' + row[1] + '\n';
     }]);
  return val;
}

function export_export() {
}
function export_import() {
  var obj = JSON.parse(document.getElementById('export_text').value);
  conf.each(
    function(sec, key) {
      if (sec.name == 'bookmark') return;
      var val = obj[sec.name + '_' + key];
      if (typeof val !== 'undefined' && val !== null) {
        var name = sec.path.join('_') + '_' + key;
        if (val.constructor === Boolean) {
          pref.setBoolPref(name, val);
        } else {
          pref.setCharPref(name, val);
        }
      }
    });
  var o = obj['bookmark_tag_order'], a = obj['bookmark_tag_aliases'];
  if (o) pref.setCharPref('conf_bookmark_tag_order', o);
  if (a) pref.setCharPref('conf_bookmark_tag_aliases', a);
  tag_aliases_init();
}

function accept() {
  pref.setCharPref('conf_bookmark_tag_aliases', tag_aliases_to_string());
  return true;
}
