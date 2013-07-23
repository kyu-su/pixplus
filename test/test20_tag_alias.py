from test_base import TestCase

class Test_TagAlias(TestCase):

  def test_tag_alias(self):
    self.open('/')
    self.open_popup(1580459)
    self.start_bookmark()
    self.assertEqual(self.q('#pp-popup-bookmark-wrapper #input_tag').get_attribute('value'), '')
    self.q('.pp-tag-association-toggle').click()
    self.q('#pp-popup-bookmark-wrapper section.work-tags-container .pp-tag-associate-button').click()
    btn = self.q('#pp-popup-bookmark-wrapper section.tag-cloud-container .pp-tag-associate-button')
    tag = btn.get_attribute('data-pp-tag')
    btn.click()
    self.assertEqual(self.q('#pp-popup-bookmark-wrapper #input_tag').get_attribute('value'), tag)
    self.open_popup(1580459)
    self.start_bookmark()
    self.assertEqual(self.q('#pp-popup-bookmark-wrapper #input_tag').get_attribute('value'), tag)
    pass

  pass
