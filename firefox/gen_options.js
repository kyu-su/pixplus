load('/dev/stdin');
LS.init_map();
LS.each(function(item, sec) {
  var type = typeof item.value === 'boolean' ? 'bool' : 'string';
  var path = 'extensions.pixplus.conf_' + (sec.name === 'general' ? '' : sec.name + '_') + item.key; // for compatibility
  print('      <preference id="' + path + '" name="' + path + '" type="' + type + '"/>');

  var desc = '&' + escape(item.desc) + ';';
  if (sec.ui) sec.ui += '\n';
  sec.ui += '        <row>\n';
  if (item.hint) {
    sec.ui += '          <box orient="horizontal" align="center"><label value="' + item.key + '"/></box>\n';
    sec.ui += '          <menulist preference="' + path + '">\n';
    sec.ui += '            <menupopup>\n';
    item.hint.forEach(
      function(entry) {
        if (typeof entry === 'string') {
          sec.ui += '              <menuitem label="' + entry + '" value="' + entry + '"/>\n';
        } else {
          var label = entry.title.match(/^__MSG_/) ? '&' + entry.title + ';' : entry.title;
          sec.ui += '              <menuitem label="' + label + '" value="' + entry.value + '"/>\n';
        }
      });
    sec.ui += '            </menupopup>\n';
    sec.ui += '          </menulist>\n';
  } else if (type == 'string') {
    sec.ui += '          <box orient="horizontal" align="center"><label value="' + item.key + '"/></box>\n';
    sec.ui += '          <textbox preference="' + path + '"/>\n';
  } else {
    sec.ui += '          <checkbox label="' + item.key + '" preference="' + path + '"/>\n';
    sec.ui += '          <spacer/>\n';
  }
  sec.ui += '          <box orient="horizontal" align="center"><description>' + desc + '</description></box>\n';
  sec.ui += '        </row>';
}, function(sec) {
  if (sec.name == 'bookmark') return true;
  print('  <prefpane id="' + sec.name + '" label="' + sec.label + '">');
  print('    <preferences>');
  sec.ui = '';
  return false;
}, function(sec) {
  print('    </preferences>');
  print('    <grid flex="1">');
  print('      <columns>');
  print('        <column/>');
  print('        <column/>');
  print('        <column/>');
  print('      </columns>');
  print('      <rows>');
  print(sec.ui);
  print('      </rows>');
  print('    </grid>');
  print('  </prefpane>');
});
