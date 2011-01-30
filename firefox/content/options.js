var pref = Components.classes['@mozilla.org/preferences-service;1']
  .getService(Components.interfaces.nsIPrefBranch);
var tag_aliases = conf.parse_bm_tag_aliases(pref.getCharPref('extensions.pixplus.conf_bookmark_tag_aliases'));
var tag_aliases_list = document.getElementById('conf_bookmark_tag_aliases');
var tag_alias_dialog;

for(var key in tag_aliases) {
  var row = tag_aliases_add_row();
  row[1].setAttribute('label', key);
  row[2].setAttribute('label', tag_aliases[key].join(' '));
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
}
function tag_aliases_remove() {
  if (!tag_aliases_list.selectedItem) return;
  tag_aliases_list.removeChild(tag_aliases_list.selectedItem);
}
function tag_aliases_edit() {
  if (!tag_aliases_list.selectedItem) return;
  var item = tag_aliases_get_row_data(tag_aliases_list.selectedItem);
  var data = {complete: false, tag: item[0], aliases: item[1].split(/ +/)};
  openDialog('chrome://pixplus/content/tag_alias.xul', null, 'modal', data);
  if (data.complete) {
    item[2].setAttribute('label', data.tag);
    item[3].setAttribute('label', data.aliases.join(' '));
  }
}
