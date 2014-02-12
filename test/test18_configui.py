import os
import time

from selenium.webdriver.support.select import Select
from selenium.webdriver.common.keys import Keys

import util
from test_base import TestCase

class Test_ModConfigUI(TestCase):

  # TODO: bookmark.tag_order
  # TODO: bookmark.tag_aliases

  def setUp(self):
    TestCase.setUp(self)
    self.conf_schema = util.read_json(os.path.join(self.rootdir, 'temp', 'config.json'))

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
    self.current_section = None
    pass

  def activate_section(self, section):
    if section != self.current_section:
      self.q('#pp-config-tab-%s' % section['name']).click()
      self.current_section = section
      time.sleep(1)
      pass
    pass

  def input_query(self, section, item, suffix = ''):
    if isinstance(section, dict):
      section = section['name']
      pass
    if isinstance(item, dict):
      item = item['key']
      pass
    input_id = 'pp-config-%s-%s%s' % (section, item.replace('_', '-'), suffix)
    return '#' + input_id

  def get_input(self, section, item, suffix = ''):
    return self.q(self.input_query(section, item, suffix = ''))

  def each_item(self, callback, *args):
    for section in self.conf_schema:
      if section['name'] in ('mypage', 'bookmark'):
        continue
      self.activate_section(section)

      for item in section['items']:
        default = item['value']
        input_e = self.get_input(section, item)

        conf_key = '%s.%s' % (section['name'], item['key'])
        current = self.get_conf(conf_key)
        if isinstance(default, bool):
          self.assertEqual(input_e.get_attribute('type'), 'checkbox')
          self.assertEqual(input_e.is_selected(), current)
        else:
          self.assertEqual(input_e.get_attribute('value'), str(current))
          pass

        callback(section, item, conf_key, default, current, input_e, *args)
        pass

      pass
    pass

  def update_change_steps(self, section, item, conf_key, default, current, input_e, steps):
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

  def check_reset_default(self, section, item, conf_key, default, current, input_e):
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
    self.auto_click(self.input_query(section, item, '-default'))
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
    self.js('document.querySelector(".pp-config-key-editor-grab").focus()')
    grab = self.q('.pp-config-key-editor-grab')
    self.send_keys(keys, grab)
    self.assertEqual(grab.get_attribute('value'), value)
    pass

  def test_key_editor(self):
    conf = self.prepare()
    section = self.conf_map['key']
    self.activate_section(section)
    input_query = self.input_query('key', 'popup_prev')
    input_e = self.q(input_query)
    initial_keys = input_e.get_attribute('value').split(',')

    self.js('document.querySelector("%s").focus()' % input_query)
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

  def check_modal_position_size(self, dialog, left, top, width, height):
    self.assertTrue(dialog.is_displayed())
    sw, sh = self.screen_size()
    x, y, w, h = self.geom(dialog)

    self.assertTrue(w <= sw, h <= sh)
    self.assertTrue(width[0] <= w <= width[1])
    self.assertTrue(height[0] <= h <= height[1])

    if left is None:
      self.assertEqual(x, int((sw - w) / 2))
    else:
      self.assertTrue(left[0] <= x <= left[1])
      pass

    if top is None:
      self.assertEqual(y, int((sh - h) / 2))
    else:
      self.assertTrue(top[0] <= y <= top[1])
      pass
    pass

  def check_keyeditor_position_size(self, input_e):
    editor = self.qa('.pp-config-key-editor')
    self.assertEqual(len(editor), 1)
    editor = editor[0]
    self.assertTrue(editor.is_displayed())

    ix, iy, iw, ih = self.geom(input_e)
    ex, ey, ew, eh = self.geom(editor)
    self.assertTrue(100 < ew < 400)
    self.assertTrue(50 < eh < 200)
    self.assertTrue(0 <= ix - (ex + ew) <= 4)
    pass

  def test_modal(self):
    self.prepare()
    self.check_modal_position_size(self.q('#pp-config-pixiv'), None, (100, 100), (902, 902), (100, 300))

    self.auto_click('.pp-layout-history')
    self.assertFalse(self.q('#pp-config').is_displayed())
    self.check_modal_position_size(self.q('#pp-layout-history-manager'), None, None, (400, 600), (300, 400))

    self.auto_click('#pp-config-btn')
    self.assertTrue(self.q('#pp-config').is_displayed())
    self.assertFalse(self.qa('#pp-layout-history-manager'))
    self.current_section = None

    self.activate_section(self.conf_map['key'])

    input_e = self.get_input('key', 'popup_first')
    input_e.click()
    self.check_keyeditor_position_size(input_e)

    input_e = self.get_input('key', 'popup_close')
    input_e.click()
    self.check_keyeditor_position_size(input_e)

    self.js('document.activeElement.blur()')

    input_query = self.input_query('key', 'popup_caption_scroll_down')
    self.js('document.querySelector("%s").focus()' % input_query)
    self.check_keyeditor_position_size(self.q(input_query))

    input_query = self.input_query('key', 'popup_comment_toggle')
    self.js('document.querySelector("%s").focus()' % input_query)
    self.check_keyeditor_position_size(self.q(input_query))

    time.sleep(1)
    self.q('form[action*="search.php"]').click()
    self.assertFalse(self.qa('.pp-config-key-editor'))
    self.assertTrue(self.q('#pp-config').is_displayed())

    self.q('form[action*="search.php"]').click()
    self.assertFalse(self.qa('.pp-config-key-editor'))
    self.assertFalse(self.q('#pp-config').is_displayed())

    self.auto_click('#pp-config-btn')
    self.assertTrue(self.q('#pp-config').is_displayed())

    input_e = self.get_input('key', 'popup_prev')
    input_e.click()
    self.check_keyeditor_position_size(input_e)

    time.sleep(1)
    self.send_keys(Keys.ESCAPE, self.q('body'))
    self.assertFalse(self.qa('.pp-config-key-editor'))
    self.assertTrue(self.q('#pp-config').is_displayed())

    self.send_keys(Keys.ESCAPE, self.q('body'))
    self.assertFalse(self.qa('.pp-config-key-editor'))
    self.assertFalse(self.q('#pp-config').is_displayed())

    self.auto_click('#pp-config-btn')
    self.assertTrue(self.q('#pp-config').is_displayed())

    time.sleep(1)
    self.q('form[action*="search.php"]').click()
    self.assertFalse(self.q('#pp-config').is_displayed())

    self.auto_click('.pp-layout-history')
    self.assertFalse(self.q('#pp-config').is_displayed())
    self.assertTrue(self.q('#pp-layout-history-manager').is_displayed())

    time.sleep(1)
    self.send_keys(Keys.ESCAPE, self.q('body'))
    self.assertFalse(self.q('#pp-config').is_displayed())
    self.assertFalse(self.qa('#pp-layout-history-manager'))
    pass

  pass
