var root = document.getElementById('root'), data = window.arguments[0];

function log(msg) {
  var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
    .getService(Components.interfaces.nsIConsoleService);
  consoleService.logStringMessage(msg);
}

document.getElementById('tag').value = data.tag;
//data.aliases.forEach(add);
add_last_row();

function add(tag) {
  var box = document.createElement('box');
  var textbox = document.createElement('textbox');
  var button = document.createElement('button');
  box.setAttribute('orient', 'horizontal');
  textbox.setAttribute('flex', '1');
  textbox.setAttribute('value', tag || '');
  button.setAttribute('icon', 'remove');
  button.addEventListener(
    'command',
    function() {
      root.removeChild(box);
    }, false);
  box.appendChild(textbox);
  box.appendChild(button);
  root.appendChild(box);
  return [box, textbox, button];
}

function add_last_row() {
  var row = add();
  row[1].addEventListener(
    'input',
    function() {
      row[1].removeEventListener('input', arguments.callee, false);
      row[2].hidden = false;
      add_last_row();
    }, false);
  row[2].hidden = true;
}

function accept() {
  data.complete = true;
  return true;
}
