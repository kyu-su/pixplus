import sys, os
import json
import fontforge

rootdir = os.path.realpath(os.path.join(os.path.dirname(__file__), '..'))
svgdir = os.path.join(rootdir, 'src', 'data', 'glyphs')


def main(out_font, out_char_map, icons):
  letters = 'abcde'[:len(icons)]
  font = fontforge.font()

  for icon, letter in zip(icons, letters):
    glyph = font.createMappedChar(letter)
    glyph.importOutlines(os.path.join(svgdir, icon + '.svg'))

  font.fontname = 'PixplusIcons'
  font.generate(out_font)
  json.dump(dict(zip(map(lambda n: n.replace('-', '_'), icons),
                     letters)),
            open(out_char_map, 'w'))


if __name__ == '__main__':
  main(sys.argv[1], sys.argv[2], sys.argv[3:])
