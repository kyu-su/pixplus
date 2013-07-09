import sys, os

_path = os.path.join(os.path.dirname(__file__), 'selenium', 'py')
if os.path.exists(_path) and _path not in sys.path:
  sys.path.insert(0, _path)
  pass

from selenium import webdriver
from selenium.webdriver import DesiredCapabilities
from selenium.webdriver import ActionChains
from selenium.webdriver.remote.webdriver import WebDriver
from selenium.webdriver.common.keys import Keys

d = WebDriver(
  'http://localhost:%d/wd/hub' % int(sys.argv[1]),
  desired_capabilities = DesiredCapabilities.OPERA
  )

d.get('file://%s/key_test.html' % os.path.abspath(os.path.dirname(__file__)))

keys = [
  Keys.ARROW_LEFT,
  Keys.ARROW_UP,
  Keys.ARROW_RIGHT,
  Keys.ARROW_DOWN,
  Keys.SPACE,
  Keys.ENTER,
  Keys.ESCAPE,
  '\x1b'
  ]

for key in keys:
  ActionChains(d).send_keys(key).perform()
  pass

for key in keys:
  d.find_element_by_css_selector('input').send_keys(key)
  pass
