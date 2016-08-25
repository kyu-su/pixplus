from selenium.webdriver.common.keys import Keys

from test_base import TestCase

class Test_ModKey(TestCase):
  run_in_pixiv = False

  def setUp(self):
    # http://www.w3.org/TR/DOM-Level-3-Events/#legacy-key-models
    # https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent

    self.keys = [
      (Keys.BACK_SPACE, ('keydown=Backspace',)),
      (Keys.TAB,        ('keydown=Tab',)),
      (Keys.RETURN,     ('keydown=Enter', 'keypress=Enter')),
      (Keys.SHIFT,      ('keydown=Shift',)),
      (Keys.CONTROL,    ('keydown=Control',)),
      (Keys.ALT,        ('keydown=Alt',)),
      (Keys.ESCAPE,     ('keydown=Escape',)),
      (Keys.SPACE,      ('keydown=Space', 'keypress=Space')),
      (Keys.PAGE_UP,    ('keydown=PageUp',)),
      (Keys.PAGE_DOWN,  ('keydown=PageDown',)),
      (Keys.END,        ('keydown=End',)),
      (Keys.HOME,       ('keydown=Home',)),
      (Keys.LEFT,       ('keydown=Left',)),
      (Keys.UP,         ('keydown=Up',)),
      (Keys.RIGHT,      ('keydown=Right',)),
      (Keys.DOWN,       ('keydown=Down',)),
      (Keys.INSERT,     ('keydown=Insert',)),
      (Keys.DELETE,     ('keydown=Delete',)),
      (Keys.SEMICOLON,  ('keypress=;',)),
      (Keys.EQUALS,     ('keypress==',)),
      (Keys.NUMPAD0,    ('keydown=0', 'keypress=0')),
      (Keys.NUMPAD1,    ('keydown=1', 'keypress=1')),
      (Keys.NUMPAD2,    ('keydown=2', 'keypress=2')),
      (Keys.NUMPAD3,    ('keydown=3', 'keypress=3')),
      (Keys.NUMPAD4,    ('keydown=4', 'keypress=4')),
      (Keys.NUMPAD5,    ('keydown=5', 'keypress=5')),
      (Keys.NUMPAD6,    ('keydown=6', 'keypress=6')),
      (Keys.NUMPAD7,    ('keydown=7', 'keypress=7')),
      (Keys.NUMPAD8,    ('keydown=8', 'keypress=8')),
      (Keys.NUMPAD9,    ('keydown=9', 'keypress=9')),
      (Keys.MULTIPLY,   ('keydown=*', 'keypress=*')),
      (Keys.ADD,        ('keydown=plus', 'keypress=plus')),
      (Keys.SEPARATOR,  ('keypress=comma',)),
      (Keys.SUBTRACT,   ('keydown=-', 'keypress=-')),
      (Keys.DECIMAL,    ('keydown=.', 'keypress=.')),
      (Keys.DIVIDE,     ('keydown=/', 'keypress=/')),
      (Keys.F1,         ('keydown=F1',)),
      (Keys.F2,         ('keydown=F2',)),
      (Keys.F3,         ('keydown=F3',)),
      (Keys.F4,         ('keydown=F4',)),
      (Keys.F5,         ('keydown=F5',)),
      (Keys.F6,         ('keydown=F6',)),
      (Keys.F7,         ('keydown=F7',)),
      (Keys.F8,         ('keydown=F8',)),
      (Keys.F9,         ('keydown=F9',)),
      (Keys.F10,        ('keydown=F10',)),
      (Keys.F11,        ('keydown=F11',)),
      (Keys.F12,        ('keydown=F12',)),
      (',',             ('keypress=comma',)),
      ('+',             ('keypress=Shift+plus',)),
      ]

    for c in r"-;'./=[\]`":
      self.keys.append((c, ('keypress=' + c,)))

    for c in r'_:"><?{|}~)!@#$%^&*(':
      self.keys.append((c, ('keypress=Shift+' + c,)))

    for c in '0123456789abcdefghijklmnopqrstuvwxyz':
      self.keys.append((c, ('keydown=' + c, 'keypress=' + c)))

    for c1, c2 in zip('abcdefghijklmnopqrstuvwxyz',
                      'ABCDEFGHIJKLMNOPQRSTUVWXYZ'):
      self.keys.append((c2, ('keydown=Shift+' + c1, 'keypress=Shift+' + c2.lower())))


  def test_mod_key1(self):
    self.b.open('file://%s/key_test.html' % self.testdir)
    target = self.q('input')
    textarea = self.q('textarea')

    for key, names in self.keys:
      textarea.clear()
      self.send_keys(key, target)
      keys = textarea.get_attribute('value').strip().split('\n')
      keys = [l.split(' ', 1)[0] for l in keys]

      self.assertTrue(set(names).issubset(set(keys)), '%s.issubset(%s)' % (str(names), str(keys)))

      if key in (Keys.SHIFT, Keys.CONTROL, Keys.ALT):
        self.ac().key_down(key, target).key_up(key, target).perform()
