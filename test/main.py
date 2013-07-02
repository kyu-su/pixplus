import sys, os
import argparse
import json
import time
import unittest
import warnings

from firefox import Firefox
from chrome import Chrome
from opera import Opera
from safari import Safari

testdir = os.path.abspath(os.path.dirname(__file__))
rootdir = os.path.dirname(testdir)
bindir  = os.path.join(rootdir, 'bin')

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
  cookie = read_json(os.path.join(testdir, 'cookie.json'), {})
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
  write_json(os.path.join(testdir, 'cookie.json'), cookie)
  pass

def login(driver, config):
  print('Logging in...')
  driver.get('https://www.secure.pixiv.net/login.php')

  form = driver.find_elements_by_css_selector('form[action="/login.php"]').pop()

  e_id = form.find_element_by_name('pixiv_id')
  e_id.clear()
  e_id.send_keys(config['username'])

  e_pw = form.find_element_by_name('pass')
  e_pw.clear()
  e_pw.send_keys(config['password'])

  form.submit()

  # safari magic...
  time.sleep(1)

  if driver.current_url != 'http://www.pixiv.net/mypage.php':
    print('Login failed!')
    raw_input('Please login manually and press enter...')
    pass

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

  config = read_json(os.path.join(testdir, 'config.json'))
  if config is None:
    print('Error: Create "config.json" first')
    return

  config['rootdir'] = rootdir
  config['bindir'] = bindir

  tests = []
  for name in (args.tests or sorted(all_tests.keys())):
    tests += all_tests[name]
    pass

  browsers = args.browsers
  if not browsers:
    browsers = browser_names
    pass

  if 'fx' in browsers or 'fx_greasemonkey' in browsers:
    test(Firefox('greasemonkey', config), config, tests)
    pass
  if 'fx' in browsers or 'fx_scriptish' in browsers:
    test(Firefox('scriptish', config), config, tests)
    pass

  if 'chrome' in browsers:
    test(Chrome(config), config, tests)
    pass

  if 'opera' in browsers or 'opera_oex' in browsers:
    test(Opera('extension', config), config, tests)
    pass
  if 'opera' in browsers or 'opera_userjs' in browsers:
    test(Opera('userjs', config), config, tests)
    pass

  if 'safari' in browsers:
    test(Safari(config), config, tests)
    pass
  pass

if __name__ == '__main__':
  main()
  pass
