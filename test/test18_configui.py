import os
import time

from selenium.webdriver.support.select import Select

import util
from test_base import TestCase

class Test_ModConfigUI(TestCase):

  def setUp(self):
    TestCase.setUp(self)
    self.conf_schema = util.read_json(os.path.join(self.rootdir, 'temp', 'config.json'))['data']
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

  # TODO: bookmark.tag_order
  # TODO: bookmark.tag_aliases
  # TODO: key editor
  # TODO: support extension version

  pass
