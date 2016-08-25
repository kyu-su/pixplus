import util
from test_base import TestCase

class Test_Jumpphp(TestCase):

  def test_jump_php(self):
    self.open('/')
    self.set_conf('general.redirect_jump_page', 0)
    self.js('location.href="/jump.php?http%3a%2f%2fexample%2ecom%2f"')
    self.wait_until(lambda d: self.url == 'http://www.pixiv.net/jump.php?http%3a%2f%2fexample%2ecom%2f')

    self.open('/')
    self.set_conf('general.redirect_jump_page', 1)
    self.js('location.href="/jump.php?http%3a%2f%2fexample%2ecom%2f"')
    self.wait_until(lambda d: self.url == 'http://example.com/')

    self.open('/')
    iid, real_url, jump_url = self.config['test-targets']['external-link']
    self.open_popup(iid)
    self.popup_show_caption()
    self.assertEqual(self.q('#pp-popup-caption a').get_attribute('href'), jump_url)

    self.set_conf('general.redirect_jump_page', 2)
    self.popup_reload()

    self.assertEqual(self.q('#pp-popup-caption a').get_attribute('href'), real_url)
