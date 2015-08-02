from PIL import Image

import util
from test_base import TestCase

class Test_MarkVisited(TestCase):

  def inject_css(self):
    self.js('''
      var style = document.createElement('style');
      style.textContent = [
        'a.work{background-color:white !important;display:block;overflow:hidden}',
        'a.work:visited{background-color:red !important}',
        'a.work *{opacity:0!important}',
        '._work.manga::after{display:none}'
      ].join('');
      document.body.appendChild(style);
    ''')
    pass

  def check_link_color(self, color, filename_suffix):
    link = self.js('''
      window.scrollTo(0, 0);
      return pixplus.illust.list[0].link.querySelector('img._thumbnail')
    ''')
    x, y, w, h = tuple(map(int, self.geom(link)))
    self.assertTrue(w > 100)
    self.assertTrue(h > 100)

    x += 1
    y += 1
    w -= 2
    h -= 2

    img = self.screenshot().crop((x, y, x + w, y + h))
    self.assertImageEqual(img, Image.new('RGB', (w, h), color),
                          'test17_mark_visited_%s.png' % filename_suffix)

    self.save_image(img, 'test17_mark_visited_image_1.png')
    from PIL import ImageDraw
    img = self.screenshot()
    self.save_image(img, 'test17_mark_visited_image_2.png')
    draw = ImageDraw.Draw(img)
    points = [(20,40), (25,60), (40,80), (60,75), (80,95), (85,20), (50,40)]
    draw.polygon([(x, y), (x, y + h), (x + w, y + h), (x + w, y)], outline='rgb(0,255,0)')
    self.save_image(img, 'test17_mark_visited_image_3.png')
    pass

  def test_on(self):
    self.open('/member_illust.php?id=11&p=9')
    self.inject_css()

    self.check_link_color('white', 'on1')
    self.open_popup()
    self.close_popup()
    self.check_link_color('red', 'on2')
    pass

  def test_off(self):
    self.open('/member_illust.php?id=11&p=10')
    self.set_conf('popup.mark_visited', False)
    self.inject_css()

    self.check_link_color('white', 'off1')
    self.open_popup()
    self.close_popup()
    self.check_link_color('white', 'off2')
    pass

  pass

