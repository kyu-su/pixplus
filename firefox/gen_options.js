load('/dev/stdin');
conf.init_map();
conf.each(
  function(sec, key) {
    var type = sec.schema[key][0].constructor === Boolean ? 'bool' : 'string';
    var path = 'extensions.pixplus.' + sec.path.join('_') + '_' + key;
    print('      <preference id="' + path + '" name="' + path + '" type="' + type + '"/>');

    var desc = '&' + escape(sec.schema[key][1]) + ';';
    if (sec.ui) sec.ui += '\n';
    sec.ui += '        <row>\n';
    if (sec.schema[key][2]) {
      sec.ui += '          <box orient="horizontal" align="center"><label value="' + key + '"/></box>\n';
      sec.ui += '          <menulist preference="' + path + '">\n';
      sec.ui += '            <menupopup>\n';
      sec.schema[key][2].forEach(
        function(entry) {
          if (entry.constructor === String) {
            sec.ui += '              <menuitem label="' + entry + '" value="' + entry + '"/>\n';
          } else {
            var label = entry.title.match(/^__MSG_/) ? '&' + entry.title + ';' : entry.title;
            sec.ui += '              <menuitem label="' + label + '" value="' + entry.value + '"/>\n';
          }
        });
      sec.ui += '            </menupopup>\n';
      sec.ui += '          </menulist>\n';
    } else if (type == 'string') {
      sec.ui += '          <box orient="horizontal" align="center"><label value="' + key + '"/></box>\n';
      sec.ui += '          <textbox preference="' + path + '"/>\n';
    } else {
      sec.ui += '          <checkbox label="' + key + '" preference="' + path + '"/>\n';
      sec.ui += '          <spacer/>\n';
    }
    sec.ui += '          <box orient="horizontal" align="center"><description>' + desc + '</description></box>\n';
    sec.ui += '        </row>';
  },
  function(sec) {
    if (sec.name == 'bookmark') return true;
    print('  <prefpane id="' + sec.name + '" label="' + sec.label + '">');
    print('    <preferences>');
    sec.ui = '';
    return false;
  },
  function(sec) {
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
