import sys, os

_path = os.path.join(os.path.dirname(__file__), 'selenium', 'py')
if os.path.exists(_path) and _path not in sys.path:
  sys.path.insert(0, _path)
  pass

from selenium import webdriver
from selenium.webdriver import ActionChains
from selenium.webdriver.common.keys import Keys

d = webdriver.Chrome()
d.get('file://%s/key_test.html' % os.path.abspath(os.path.dirname(__file__)))

keys = [
  Keys.ARROW_LEFT,
  Keys.ARROW_UP,
  Keys.ARROW_RIGHT,
  Keys.ARROW_DOWN,
  Keys.SPACE,
  Keys.ENTER,
  Keys.ESCAPE
  ]

for key in keys:
  ActionChains(d).send_keys(key).perform()
  pass

for key in keys:
  d.find_element_by_css_selector('input').send_keys(key)
  pass
