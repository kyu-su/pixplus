import sys, os
import json
import unittest

from firefox import Firefox
from chrome import Chrome
from opera import Opera

def make_tests(clslist, driver, config):
  tests = []
  for cls in clslist:
    for name in dir(cls):
      if not name.startswith('test_'):
        continue
      attr = getattr(cls, name)
      if callable(attr):
        tests.append(cls(driver, config, name))
        pass
      pass
    pass
  return tests

def load_tests():
  tests = []

  for filename in sorted(os.listdir('.')):
    if not filename.startswith('test') or not filename.endswith('.py'):
      continue

    name = filename.split('.', 1)[0]
    mod = __import__(name, {}, {}, [], 0)

    for aname in dir(mod):
      if not aname.startswith('Test_'):
        continue
      tests.append(getattr(mod, aname))
      pass
    pass

  return tests

def read_json(filename, default = None):
  if not os.path.exists(filename):
    return default

  fp = open(filename)
  try:
    return json.load(fp)
  finally:
    fp.close()
    pass
  pass

def write_json(filename, obj):
  fp = open(filename, 'w')
  try:
    json.dump(obj, fp)
  finally:
    fp.close()
    pass
  pass

def load_cookie(driver):
  cookie = read_json('cookie.json', {})
  for name, item in cookie.items():
    print('Cookie: %s=%s' % (item['name'], item['value']))
    driver.add_cookie(item)
    pass
  pass

def save_cookie(driver):
  cookie = {}
  for key in ['PHPSESSID']:
    cookie[key] = driver.get_cookie(key)
    pass
  write_json('cookie.json', cookie)
  pass

def login(driver, config):
  print('Logging in...')
  driver.get('https://www.secure.pixiv.net/login.php')
  driver.find_element_by_id('login_pixiv_id').send_keys(config['username'])
  driver.find_element_by_id('login_password').send_keys(config['password'])
  driver.find_element_by_class_name('login-form').submit()

  if driver.current_url != 'http://www.pixiv.net/mypage.php':
    raise RuntimeError('Login failed!')

  save_cookie(driver)
  pass

def test(browser, config, tests):
  driver = browser.driver

  try:
    suite = unittest.TestSuite()
    suite.addTests(make_tests(tests, driver, config))

    browser.set_window_size(1280, 800)
    driver.get('http://www.pixiv.net/')
    load_cookie(driver)
    driver.get('http://www.pixiv.net/')

    if driver.current_url == 'http://www.pixiv.net/':
      login(driver, config)
      pass

    unittest.TextTestRunner(verbosity = 2).run(suite)
  finally:
    browser.quit()
    pass
  pass

def main():
  config = read_json('config.json')
  if config is None:
    print('Error: Create "config.json" first')
    return

  tests = load_tests()

  test(Firefox(['greasemonkey']), config, tests)
  test(Firefox(['scriptish']), config, tests)
  test(Chrome(), config, tests)
  test(Opera('extension'), config, tests)
  test(Opera('userjs'), config, tests)
  pass

if __name__ == '__main__':
  main()
  pass
