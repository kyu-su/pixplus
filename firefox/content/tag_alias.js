var data = window.arguments[0];
var tag = document.getElementById('tag');
var aliases = document.getElementById('aliases');
tag.value = data.tag;
aliases.value = data.aliases.join(' ');

function accept() {
  data.complete = true;
  data.tag = tag.value;
  data.aliases = aliases.value.split(/ +/);
  return true;
}
