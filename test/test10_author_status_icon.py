from test_base import TestCase

class Test_AuthorStatusIcon(TestCase):

  def test_author_status_icon(self):
    self.open('/mypixiv_new_illust.php')
    self.open_popup()
    self.js('pixplus.popup.show_caption()')
    self.assertTrue(self.q('#pp-popup-author-status.pp-mypix').is_displayed())

    self.open('/bookmark_new_illust.php')
    self.open_popup()
    self.js('pixplus.popup.show_caption()')
    self.assertTrue(self.q('#pp-popup-author-status.pp-fav:not(.pp-mypix)').is_displayed())

    self.set_conf('popup.author_status_icon', False)

    self.open('/bookmark_new_illust.php')
    self.open_popup()
    self.js('pixplus.popup.show_caption()')
    self.assertFalse(self.q('#pp-popup-author-status').is_displayed())
    pass

  pass
