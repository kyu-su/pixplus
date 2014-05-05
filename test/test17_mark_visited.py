import util
from test_base import TestCase

class Test_MarkVisited(TestCase):

  def inject_css(self):
    self.js('''
      var style = document.createElement('style');
      style.textContent = [
        'a.work{background-color:white !important;display:block}',
        'a.work:visited{background-color:red !important}',
        'a.work *{opacity:0!important}'
      ].join('');
      document.body.appendChild(style);
    ''')
    pass

  def check_link_color(self, color):
    link = self.js('''
      window.scrollTo(0, 0);
      return pixplus.illust.list[0].link
    ''')
    x, y, w, h = tuple(map(int, self.geom(link)))
    self.assertTrue(w > 140)
    self.assertTrue(h > 150)

    x += 1
    y += 1
    w -= 2
    h -= 2

    img = self.screenshot().crop((x, y, x + w, y + h))
    try:
      self.assertTrue(img.tobytes() == color * (w * h))
    except:
      img.save('test17_mark_visited_image_1.png')

      from PIL import ImageDraw
      img = self.screenshot()
      img.save('test17_mark_visited_image_2.png')
      draw = ImageDraw.Draw(img)
      points = [(20,40), (25,60), (40,80), (60,75), (80,95), (85,20), (50,40)]
      draw.polygon([(x, y), (x, y + h), (x + w, y + h), (x + w, y)], outline='rgb(0,255,0)')
      img.save('test17_mark_visited_image_3.png')
      raise
    pass

  def test_on(self):
    self.open('/member_illust.php?id=11&p=9')
    self.inject_css()

    self.check_link_color(b'\xff\xff\xff')
    self.open_popup()
    self.close_popup()
    self.check_link_color(b'\xff\x00\x00')
    pass

  def test_off(self):
    self.open('/member_illust.php?id=11&p=10')
    self.set_conf('popup.mark_visited', False)
    self.inject_css()

    self.check_link_color(b'\xff\xff\xff')
    self.open_popup()
    self.close_popup()
    self.check_link_color(b'\xff\xff\xff')
    pass

  pass

