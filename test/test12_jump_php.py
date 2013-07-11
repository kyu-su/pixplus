from test_base import TestCase

try:
  from urllib.parse import unquote
except ImportError:
  from urllib import unquote
  pass

class Test_Jumpphp(TestCase):

  def test_jump_php(self):
    self.open('/')
    self.set_conf('general.redirect_jump_page', 0)
    self.js('location.href="/jump.php?http%3a%2f%2fexample%2ecom%2f"')
    self.wait_until(lambda d: self.url == 'http://www.pixiv.net/jump.php?http%3a%2f%2fexample%2ecom%2f')

    self.open('/')
    self.set_conf('general.redirect_jump_page', 1)
    self.js('location.href="/jump.php?http%3a%2f%2fexample%2ecom%2f"')
    self.wait_until(lambda d: self.url == 'http://example.iana.org/')

    self.open('/search.php?s_mode=s_tc&word=http%3A%2F%2Fwww.youtube.com%2F')
    self.open_popup()
    self.js('pixplus.popup.show_caption()')

    link = self.q('#pp-popup-caption a[href^="/jump.php?http%3A%2F%2Fwww.youtube.com%2F"]')
    url = unquote(link.get_attribute('href').replace('http://www.pixiv.net/jump.php?', ''))
    self.assertEquals(url, link.text)

    self.set_conf('general.redirect_jump_page', 2)
    self.popup_reload()

    link = self.q('#pp-popup-caption a[href^="http://www.youtube.com/"]')
    self.assertEquals(link.get_attribute('href'), link.text)
    pass

  pass
