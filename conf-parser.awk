BEGIN {
  cstack[0] = 0;
}
match($0, /([a-zA-Z0-9_]+): \{/, re) {
  cstack[cstack[0] + 1] = re[1];
  ++cstack[0];
}
match($0, /\}/, re) {
  --cstack[0];
}
match($0,/([a-zA-Z0-9_]+): *\[(.*)\]/,line) {
  name = "conf";
  for(i = 0; i < cstack[0]; ++i) {
    name = name "_" cstack[i + 1];
  }
  name = name "_" line[1];
  if ((value = gensub(/^([a-zA-Z0-9_\.]+), +'.*'$/, "\\1", 1, line[2])) == line[2]) {
    value = gensub(/^'(.*)', +'.*'$/, "\\1", 1, value);
    value = gensub(/\\(.)/, "\\1", "g", value);
  }
  printf("<preference name=\"%s\" value=\"%s\" />\n", name, value);
}
