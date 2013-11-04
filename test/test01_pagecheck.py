from test_base import TestCase

class Test_PageCheck(TestCase):
  pages = (
    ('/mypage.php', 30),
    ('/new_illust.php', 20),
    ('/bookmark_new_illust.php', 20),
    ('/mypixiv_new_illust.php', None),
    ('/ranking.php?mode=daily', 50),
    ('/ranking_area.php', None), # 35
    ('/stacc/p/activity', None),
    ('/stacc/p/activity?mode=unify', None),
    ('/user_event.php', 28),
    ('/bookmark.php?rest=hide', None),
    ('/member_illust.php', None),
    ('/response.php?illust_id=11437736', 21),
    ('/member_illust.php?mode=medium&illust_id=11437736', 4),
    ('/member.php?id=11', 3),
    ('/member_illust.php?id=11', 20),
    ('/tags.php?tag=pixiv', 12),
    ('/search.php?s_mode=s_tag&word=pixiv', 20),
    ('/cate_r18.php', 21),
    ('/new_illust_r18.php', 20),
    ('/user_event.php?type=r18', 28),
    ('/questionnaire_illust.php', 20),
    ('/search_user.php', 80)
    )

  def test_pages(self):
    for url, count in self.pages:
      self.open(url)
      self.open_popup()
      if count is not None:
        self.assertEqual(self.js('return pixplus.illust.list.length'), count)
        pass
      pass
    pass

  pass
