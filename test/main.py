import sys, os
import argparse
import json
import unittest
import time

from firefox import Firefox
from chrome import Chrome
from opera import Opera
from safari import Safari

def make_tests(clslist, browser, config):
  tests = []
  for cls in clslist:
    for name in dir(cls):
      if not name.startswith('test_'):
        continue
      attr = getattr(cls, name)
      if callable(attr):
        tests.append(cls(browser, config, name))
        pass
      pass
    pass
  return tests

def load_tests():
  tests = {}

  for filename in sorted(os.listdir('.')):
    if not filename.startswith('test') or not filename.endswith('.py'):
      continue

    name = filename.split('.', 1)[0]
    mod = __import__(name, {}, {}, [], 0)

    classes = []
    for aname in dir(mod):
      if not aname.startswith('Test_'):
        continue
      classes.append(getattr(mod, aname))
      pass
    if classes:
      tests[name] = classes
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

  # safari magic...
  time.sleep(1)

  if driver.current_url != 'http://www.pixiv.net/mypage.php':
    raise RuntimeError('Login failed!')

  save_cookie(driver)
  pass

def test(browser, config, tests):
  try:
    suite = unittest.TestSuite()
    suite.addTests(make_tests(tests, browser, config))

    browser.set_window_size(1280, 800)

    driver = browser.driver
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
  all_tests = load_tests()
  browser_names = (
    'fx', 'fx_greasemonkey', 'fx_scriptish',
    'chrome',
    'opera', 'opera_oex', 'opera_userjs',
    'safari'
    )

  parser = argparse.ArgumentParser(usage = '%(prog)s [options]')
  parser.add_argument('-t', metavar = 'TEST', choices = all_tests.keys(),
                      dest = 'tests', action = 'append',
                      help = ','.join(sorted(all_tests.keys())))
  parser.add_argument('-b', metavar = 'BROWSER', choices = browser_names,
                      dest = 'browsers', action = 'append',
                      help = ','.join(browser_names))
  args = parser.parse_args()

  config = read_json('config.json')
  if config is None:
    print('Error: Create "config.json" first')
    return

  tests = []
  for name in (args.tests or sorted(all_tests.keys())):
    tests += all_tests[name]
    pass

  browsers = args.browsers
  if not browsers:
    browsers = browser_names
    pass

  if 'fx' in browsers or 'fx_greasemonkey' in browsers:
    test(Firefox(['greasemonkey']), config, tests)
    pass
  if 'fx' in browsers or 'fx_scriptish' in browsers:
    test(Firefox(['scriptish']), config, tests)
    pass

  if 'chrome' in browsers:
    test(Chrome(), config, tests)
    pass

  if 'opera' in browsers or 'opera_oex' in browsers:
    test(Opera('extension'), config, tests)
    pass
  if 'opera' in browsers or 'opera_userjs' in browsers:
    test(Opera('userjs'), config, tests)
    pass

  if 'safari' in browsers:
    test(Safari(), config, tests)
    pass
  pass

if __name__ == '__main__':
  main()
  pass
