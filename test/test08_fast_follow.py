import time

from test_base import TestCase

class Test_FastFollow(TestCase):

  def unfollow(self):
    self.click(self.q('.user-relation #favorite-button.following'))
    time.sleep(1)
    self.click(self.q('.user-relation #favorite-preference input.button.remove'))
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
    self.set_conf('general.fast_user_bookmark', fast_user_bookmark)
    self.reload()

    btn = self.q('.user-relation #favorite-button')
    self.assertFalse(self.has_class(btn, 'following'))
    self.click(btn)
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
