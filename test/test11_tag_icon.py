from test_base import TestCase

class Test_TagIcon(TestCase):

  def test_pixpedia_icon(self):
    self.open_test_user()

    self.open_popup()
    self.popup_show_caption()
    self.assertTrue(self.q('#pp-popup-taglist .tag a[href^="http://dic.pixiv.net/"]').is_displayed())

    self.set_conf('popup.remove_pixpedia', True)
    self.popup_reload()
    self.popup_show_caption()
    self.assertFalse(self.q('#pp-popup-taglist .tag a[href^="http://dic.pixiv.net/"]').is_displayed())
    pass

  def test_pixiv_comic_icon(self):
    # /search.php?s_mode=s_tag_full&word=%E9%BB%92%E5%9F%B7%E4%BA%8B
    self.open('/search.php?s_mode=s_tag_full&word=%E3%83%80%E3%83%B3%E3%82%AC%E3%83%B3%E3%83%AD%E3%83%B3%E3%83%91')

    self.open_popup()
    self.popup_show_caption()
    self.assertTrue(self.q('#pp-popup-taglist .tag a[href^="http://comic.pixiv.net/"]').is_displayed())

    self.set_conf('popup.remove_pixiv_comic', True)
    self.popup_reload()
    self.popup_show_caption()
    self.assertFalse(self.q('#pp-popup-taglist .tag a[href^="http://comic.pixiv.net/"]').is_displayed())
    pass

  pass
