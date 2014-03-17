from test_base import TestCase

class Test_MangaPage(TestCase):

  def test_manga_page_action(self):
    self.set_conf('popup.manga_page_action', 0)
    self.open('/member_illust.php?mode=medium&illust_id=40833644')
    link = self.q('a[href*="mode=manga"]')
    self.js('arguments[0].removeAttribute("target")', link)
    self.click(link)
    self.wait_page_load()
    self.assertEqual(self.url, 'http://www.pixiv.net/member_illust.php?mode=manga&illust_id=40833644')

    self.set_conf('popup.manga_page_action', 1)
    self.open('/member_illust.php?mode=medium&illust_id=40833644')
    self.click(self.q('a[href*="mode=manga"] img'))
    self.popup_wait_load()
    self.assertFalse(self.js('return pixplus.popup.manga.active'))

    self.set_conf('popup.manga_page_action', 2)
    self.open('/member_illust.php?mode=medium&illust_id=40833644')
    self.click(self.q('a[href*="mode=manga"] img'))
    self.popup_wait_load()
    self.assertTrue(self.js('return pixplus.popup.manga.active'))
    pass

  pass
