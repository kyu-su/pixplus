from selenium.webdriver.common.keys import Keys

from test_base import TestCase

class Test_ModKey(TestCase):
  run_in_pixiv = False

  keys = [
    (Keys.BACK_SPACE, 'Backspace'),
    (Keys.TAB,        'Tab'),
    (Keys.RETURN,     'Enter'),
    (Keys.SHIFT,      'Shift'),
    (Keys.CONTROL,    'Control'),
    (Keys.ALT,        'Alt'),
    (Keys.ESCAPE,     'Escape'),
    (Keys.SPACE,      'Space'),
    (Keys.PAGE_UP,    'PageUp'),
    (Keys.PAGE_DOWN,  'PageDown'),
    (Keys.END,        'End'),
    (Keys.HOME,       'Home'),
    (Keys.LEFT,       'Left'),
    (Keys.UP,         'Up'),
    (Keys.RIGHT,      'Right'),
    (Keys.DOWN,       'Down'),
    (Keys.INSERT,     'Insert'),
    (Keys.DELETE,     'Delete'),
    (Keys.SEMICOLON,  ';'),
    (Keys.EQUALS,     '='),
    (Keys.NUMPAD0,    '0'),
    (Keys.NUMPAD1,    '1'),
    (Keys.NUMPAD2,    '2'),
    (Keys.NUMPAD3,    '3'),
    (Keys.NUMPAD4,    '4'),
    (Keys.NUMPAD5,    '5'),
    (Keys.NUMPAD6,    '6'),
    (Keys.NUMPAD7,    '7'),
    (Keys.NUMPAD8,    '8'),
    (Keys.NUMPAD9,    '9'),
    (Keys.MULTIPLY,   '*'),
    (Keys.ADD,        'plus'),
    (Keys.SEPARATOR,  'comma'),
    (Keys.SUBTRACT,   '-'),
    (Keys.DECIMAL,    '.'),
    (Keys.DIVIDE,     '/'),
    (Keys.F1,         'F1'),
    (Keys.F2,         'F2'),
    (Keys.F3,         'F3'),
    (Keys.F4,         'F4'),
    (Keys.F5,         'F5'),
    (Keys.F6,         'F6'),
    (Keys.F7,         'F7'),
    (Keys.F8,         'F8'),
    (Keys.F9,         'F9'),
    (Keys.F10,        'F10'),
    (Keys.F11,        'F11'),
    (Keys.F12,        'F12'),
    (',',             'comma'),
    ('+',             'Shift+plus')
    ] + [(c, 'Shift+' + c.lower()) for c in '!"#$%&()*:<>?@^_{}~ABCDEFGHIJKLMNOPQRSTUVWXYZ'] + [
    (c, c) for c in '-\'./;=[]\\`abcdefghijklmnopqrstuvwxyz0123456789']

  def test_modkey1(self):
    self.b.open('file://%s/key_test.html' % self.testdir)
    textarea = self.q('textarea')

    for key, name in self.keys:
      if self.b.name == 'opera' and key in (Keys.MULTIPLY, Keys.ADD, Keys.SEPARATOR,
                                            Keys.SUBTRACT, Keys.DECIMAL, Keys.DIVIDE):
        continue
      textarea.clear()
      self.send_keys(key)
      keys = textarea.get_attribute('value').strip().split('\n')
      keys = [l.split(' ', 1)[0].split('=', 1)[1] for l in keys]
      self.assertEqual(keys[-1], name)
      pass
    pass

  pass
