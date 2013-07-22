import util
from test_base import TestCase

class Test_TagOrder(TestCase):

  def ul_to_tags(self, ul):
    tags = []
    for link in ul.find_elements_by_css_selector('li a'):
      p = util.urlparse(link.get_attribute('href'))
      q = dict(util.parse_qsl(p.query))
      tags.append(q.get('tag'))
      pass
    return tags

  def check(self, tags, cloud = True):
    self.set_conf('bookmark.tag_order', tags)
    self.open('/bookmark.php?rest=hide')

    uls = self.qa('.area_bookmark #bookmark_list > ul')[1:]
    for ul in uls:
      self.assertEqual(self.has_class(ul, 'tagCloud'), cloud)
      pass
    self.assertEqual([self.ul_to_tags(ul) for ul in uls], tags)
    pass

  def test_tag_order(self):
    self.open('/bookmark.php?rest=hide')
    tags = self.qa('.area_bookmark #bookmark_list > ul')
    self.assertEqual(len(tags), 1)
    tags = self.ul_to_tags(tags[0])[2:]
    self.assertTrue(len(tags) >= 3)

    self.check([tags])
    tags = tags[-1:] + tags[:-1]
    self.check([tags])
    tags = tags[-1:] + tags[:-1]
    self.check([tags])
    self.check([tags[-1:], tags[:-1]])
    self.check([[t] for t in tags])

    self.set_cookie('bookToggle', 'flat', 'pixiv.net', '/')

    self.check([tags], False)
    tags = tags[-1:] + tags[:-1]
    self.check([tags], False)
    tags = tags[-1:] + tags[:-1]
    self.check([tags], False)
    self.check([tags[-1:], tags[:-1]], False)
    self.check([[t] for t in tags], False)
    pass

  pass
