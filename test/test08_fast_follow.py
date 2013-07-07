import time

from selenium.webdriver import ActionChains

from test_base import TestCase

class Test_FastFollow(TestCase):

  def unfollow(self):
    self.q('.user-relation #favorite-button.following').click()
    time.sleep(1)
    self.q('.user-relation #favorite-preference input.button.remove').click()
    time.sleep(1)
    self.reload()
    self.assertFalse(self.has_class(self.q('.user-relation #favorite-button'), 'following'))
    pass

  def follow(self, uid, restrict):
    self.open('/member.php?id=%d' % uid)

    btn = self.q('.user-relation #favorite-button')
    if self.has_class(btn, 'following'):
      self.unfollow()
      pass

    fast_user_bookmark = 2 if restrict else 1
    self.driver.execute_script('pixplus.conf.general.fast_user_bookmark=%d' % fast_user_bookmark)
    self.reload()

    btn = self.q('.user-relation #favorite-button')
    self.assertFalse(self.has_class(btn, 'following'))
    btn.click()
    time.sleep(1)

    value = 1 if restrict else 0
    self.assertFalse(self.q('#favorite-preference').is_displayed())
    self.assertTrue(self.has_class(btn, 'following'))
    self.assertTrue(self.qa('#favorite-preference form input[name="restrict"][value="%d"]:checked' % value))

    rest = '&rest=hide' if restrict else ''
    self.open('/bookmark.php?type=user' + rest)

    self.assertTrue(self.qa('.members input[name="id[]"][value="%d"]' % uid))
    pass

  def test_fast_follow(self):
    self.follow(self.config['test-user'], True)
    self.follow(self.config['test-user'], False)
    pass

  pass
