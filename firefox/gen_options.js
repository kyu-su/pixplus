load('/dev/stdin');
conf.init_map();
conf.each(
  function(sec, key) {
    var type = sec.schema[key][0].constructor === Boolean ? 'bool' : 'string';
    var path = 'extensions.pixplus.' + sec.path.join('_') + '_' + key;
    print('      <preference id="' + path + '" name="' + path + '" type="' + type + '"/>');

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
            sec.ui += '              <menuitem label="' + escape(entry.title) + '" value="' + entry.value + '"/>\n';
          }
        });
      sec.ui += '            </menupopup>\n';
      sec.ui += '          </menulist>\n';
    } else if (type == 'string') {
      sec.ui += '          <box orient="horizontal" align="center"><label value="' + key + '"/></box>\n';
      sec.ui += '          <textbox preference="' + path + '" flex="1"/>\n';
    } else {
      sec.ui += '          <checkbox label="' + key + '" preference="' + path + '"/>\n';
    }
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
    print('        <column flex="1"/>');
    print('      </columns>');
    print('      <rows>');
    print(sec.ui);
    print('      </rows>');
    print('    </grid>');
    print('  </prefpane>');
  });

function escape(str) {
  var res = '';
  for(var i = 0; i < str.length; ++i) {
    var c = str.charCodeAt(i);
    if (c >= 0x20 && c < 0x80) {
      res += str[i];
    } else {
      res += '&#' + c + ';';
    }
  }
  return res;
}
