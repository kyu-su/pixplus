import sys
import json
import xml.etree.ElementTree as ET

class Generator:
  ns = 'http://www.w3.org/2000/svg'

  def __init__(self, out):
    self.out = out
    self.elem_id = 0
    pass

  def elem(self, node, parent = None):
    varname = 'e%d' % self.elem_id
    self.elem_id += 1

    self.out.write('var %s = doc.createElementNS("%s", "%s");\n' % (varname, self.ns, node.tag.split('}')[-1]))

    for name, value in node.attrib.items():
      self.out.write('%s.setAttribute(%s, %s);\n' % (varname, json.dumps(name), json.dumps(value)))
      pass

    if parent:
      self.out.write('%s.appendChild(%s);\n' % (parent, varname))
      pass

    for child in node:
      self.elem(child, varname)
      pass

    return varname

  def gen(self, filename, name):
    self.out.write('function(doc){ // %s\n' % filename)
    varname = self.elem(ET.parse(filename).getroot())
    self.out.write('%s.setAttribute("id", "pp-icon-%s");\n' % (varname, name))
    self.out.write('return %s;\n' % varname)
    self.out.write('}\n')
    pass

  pass

def main(files, out):
  out.write('_.svg={\n')
  for fn in files:
    name = fn.split('/')[-1].split('.')[0]
    out.write('%s:' % name.replace('-', '_'))
    Generator(out).gen(fn, name)
    out.write(',')
    pass
  out.write('};\n')
  pass

if __name__ == '__main__':
  main(sys.argv[1:], sys.stdout)
  pass
