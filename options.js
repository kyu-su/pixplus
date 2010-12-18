document.addEventListener('DOMContentLoaded', init, false);
function init() {
  var root = document.getElementById('options-root');
  var table = document.createElement('table');
  root.appendChild(table);

  var idx;
  conf.each(
    function(sec, key) {
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
        }, false);
      row.insertCell(-1).appendChild(def);
      row.insertCell(-1).innerText = sec.schema[key][1];

      input.addEventListener(
        'change',
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
      var row = table.insertRow(-1);
      row.className = 'section';
      var cell = row.insertCell(-1);
      cell.setAttribute('colspan', '4');
      cell.innerText = sec.label;
      idx = 0;
    });
}
