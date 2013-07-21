import os
import time

from selenium.webdriver.support.select import Select
from selenium.webdriver.common.keys import Keys

import util
from test_base import TestCase

class Test_ModConfigUI(TestCase):

  def setUp(self):
    TestCase.setUp(self)
    self.conf_schema = util.read_json(os.path.join(self.rootdir, 'temp', 'config.json'))['data']

    self.conf_map = {}
    for section in self.conf_schema:
      secname = section['name']
      self.conf_map[secname] = section
      for item in section['items']:
        self.conf_map[secname, item['key']] = item
        pass
      pass
    pass

  def prepare(self):
    self.open('/')
    self.q('#pp-config-btn').click()
    config = self.q('#pp-config')
    x, y, w, h = self.geom(config)
    self.assertEqual(y, 105)
    sw, sh = self.screen_size()
    self.assertEqual(w, 806)
    self.assertEqual(x, int((sw - w) / 2))
    self.current_section = None
    pass

  def activate_section(self, section):
    if section != self.current_section:
      self.q('#pp-config-tab-%s' % section['name']).click()
      self.current_section = section
      time.sleep(1)
      pass
    pass

  def get_input(self, section, item, suffix = ''):
    input_id = 'pp-config-%s-%s%s' % (section['name'], item['key'].replace('_', '-'), suffix)
    return self.q('#%s' % input_id)

  def each_item(self, callback, *args):
    for section in self.conf_schema:
      if section['name'] in ('mypage', 'bookmark'):
        continue
      self.activate_section(section)

      for item in section['items']:
        default = item['value']
        input_e = self.get_input(section, item)
        default_btn = self.get_input(section, item, '-default')

        conf_key = '%s.%s' % (section['name'], item['key'])
        current = self.get_conf(conf_key)
        if isinstance(default, bool):
          self.assertEqual(input_e.get_attribute('type'), 'checkbox')
          self.assertEqual(input_e.is_selected(), current)
        else:
          self.assertEqual(input_e.get_attribute('value'), str(current))
          pass

        callback(section, item, conf_key, default, current, input_e, default_btn, *args)
        pass

      pass
    pass

  def update_change_steps(self, section, item, conf_key, default, current, input_e, default_btn, steps):
    self.set_conf(conf_key, default)

    if isinstance(default, bool):
      values = [not default]
    elif input_e.tag_name.lower() == 'select':
      sel = Select(input_e)
      values = [default.__class__(o.get_attribute('value')) for o in sel.options]
      values.remove(default)
    elif isinstance(default, int) or isinstance(default, float):
      values = [default + 1]
    else:
      values = [default + 'hoge']
      pass

    values.insert(0, default)
    values.append(default)

    for idx, value in enumerate(values):
      if len(steps) == idx:
        steps.append([])
        pass
      next = None
      if idx + 1 < len(values):
        next = values[idx + 1]
        pass
      steps[idx].append((section, item, value, next))
      pass
    pass

  def test_change(self):
    conf = self.prepare()
    steps = []
    self.each_item(self.update_change_steps, steps)

    for items in steps:
      self.prepare()

      for section, item, value, next_value in items:
        self.activate_section(section)

        conf_value = self.get_conf('%s.%s' % (section['name'], item['key']))
        self.assertEqual(conf_value, value)

        input_e = self.get_input(section, item)

        if isinstance(value, bool):
          self.assertEqual(input_e.is_selected(), value)
        else:
          self.assertEqual(input_e.get_attribute('value'), str(value))
          pass

        if next_value is None:
          continue

        if isinstance(value, bool):
          if next_value is not None and value != next_value:
            input_e.click()
            pass
          pass
        elif input_e.tag_name.lower() == 'select':
          Select(input_e).select_by_value(str(next_value))
        else:
          input_e.clear()
          input_e.send_keys(str(next_value))
          pass

        pass

      time.sleep(1)
      pass
    pass

  def check_reset_default(self, section, item, conf_key, default, current, input_e, default_btn):
    if isinstance(default, bool):
      if current == default:
        input_e.click()
        pass
      pass
    elif input_e.tag_name.lower() == 'select':
      sel = Select(input_e)
      values = [default.__class__(o.get_attribute('value')) for o in sel.options]
      values.remove(default)
      sel.select_by_value(str(values[0]))
    elif isinstance(default, int) or isinstance(default, float):
      input_e.clear()
      input_e.send_keys(str(default + 1))
    else:
      input_e.clear()
      input_e.send_keys(default + 'hoge')
      pass

    self.assertNotEqual(self.get_conf(conf_key), default)
    default_btn.click()
    self.assertEqual(self.get_conf(conf_key), default)
    pass

  def test_reset_default(self):
    conf = self.prepare()
    self.each_item(self.check_reset_default)
    pass

  def check_key_editor_keys(self, expected_keys):
    keys = [l.text for l in self.qa('.pp-config-key-editor ul li label')]
    self.assertEqual(keys, expected_keys)
    pass

  def check_key_editor_grab(self, keys, value):
    grab = self.q('.pp-config-key-editor-grab')
    self.js('arguments[0].focus()', grab)
    self.send_keys(keys, grab)
    self.assertEqual(grab.get_attribute('value'), value)
    pass

  def test_key_editor(self):
    conf = self.prepare()
    section = self.conf_map['key']
    item = self.conf_map['key', 'popup_prev']
    self.activate_section(section)
    input_e = self.get_input(section, item)
    initial_keys = input_e.get_attribute('value').split(',')

    self.js('arguments[0].focus()', input_e)
    time.sleep(1)

    editor = self.q('.pp-config-key-editor')
    self.assertTrue(editor.is_displayed())
    ix, iy, iw, ih = self.geom(input_e)
    ex, ey, ew, eh = self.geom(editor)
    self.assertTrue(0 <= ix - (ex + ew) <= 4)

    self.check_key_editor_keys(initial_keys)

    self.check_key_editor_grab('a', 'a')
    self.check_key_editor_grab('abc', 'c')
    self.check_key_editor_grab('D', 'Shift+d')
    self.check_key_editor_grab('DEF', 'Shift+f')
    self.check_key_editor_grab('!', 'Shift+!')
    self.check_key_editor_grab(',', 'comma')
    self.check_key_editor_grab('+', 'Shift+plus')
    self.check_key_editor_grab('t', 't')
    self.check_key_editor_grab(Keys.F5, 'F5')

    self.q('.pp-config-key-editor-add').click()
    self.assertEqual(self.q('.pp-config-key-editor-grab').get_attribute('value'), '')

    self.check_key_editor_keys(initial_keys + ['F5'])
    self.assertEqual(input_e.get_attribute('value'), ','.join(initial_keys + ['F5']))

    self.q('.pp-config-key-editor-close').click()
    self.assertFalse(self.qa('.pp-config-key-editor'))
    pass

  # TODO: bookmark.tag_order
  # TODO: bookmark.tag_aliases

  pass
