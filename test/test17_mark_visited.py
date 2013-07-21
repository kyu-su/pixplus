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
    link = self.js('return pixplus.illust.list[0].link')
    x, y, w, h = self.geom(link)
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
      fp = open('test17_mark_visited_image.dat', 'wb')
      fp.write(img.tobytes())
      fp.close()
      raise
    pass

  def test_on(self):
    if self.b.name == 'opera':
      self.skipTest('Mark as visited feature is currently disabled on opera')
      return

    self.open('/member_illust.php?id=11&p=9')
    self.inject_css()

    self.check_link_color(b'\xff\xff\xff')
    self.open_popup()
    self.close_popup()
    self.check_link_color(b'\xff\x00\x00')
    pass

  def test_off(self):
    if self.b.name == 'opera':
      self.skipTest('Mark as visited feature is currently disabled on opera')
      return

    self.open('/member_illust.php?id=11&p=10')
    self.set_conf('popup.mark_visited', False)
    self.inject_css()

    self.check_link_color(b'\xff\xff\xff')
    self.open_popup()
    self.close_popup()
    self.check_link_color(b'\xff\xff\xff')
    pass

  pass

