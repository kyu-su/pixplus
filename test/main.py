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

def load_tests():
  tests = {}

  for filename in sorted(os.listdir('.')):
    if not filename.startswith('test') or not filename.endswith('.py'):
      continue

    name = filename.split('.', 1)[0]
    mod = __import__(name, {}, {}, [], 0)

    for aname in dir(mod):
      if not aname.startswith('Test_'):
        continue
      tests[name] = getattr(mod, aname)
      break
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

  form = driver.find_elements_by_css_selector('form[action="/login.php"]')[-1]

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
    suite.addTests([cls(browser, config, testname) for cls, testname in tests])

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
  parser.add_argument('-t', dest = 'tests', action = 'append',
                      help = 'TEST or TEST:METHOD')
  parser.add_argument('-b', metavar = 'BROWSER', choices = browser_names,
                      dest = 'browsers', action = 'append',
                      help = ','.join(browser_names))
  parser.add_argument('--firefox', metavar = 'COMMAND', dest = 'firefox')
  parser.add_argument('--repeatable', dest = 'repeatable',
                      action = 'store_true', default = False)
  args = parser.parse_args()

  config = read_json(os.path.join(testdir, 'config.json'))
  if config is None:
    print('Error: Create "config.json" first')
    return

  config['rootdir']    = rootdir
  config['bindir']     = bindir
  config['firefox']    = args.firefox
  config['repeatable'] = args.repeatable

  tests = []
  if args.tests:
    for name in args.tests:
      if ':' in name:
        name = name.split(':')
        tests.append((all_tests[name[0]], name[1]))
      else:
        cls = all_tests[name]
        tests += [(cls, n) for n in cls.list_tests()]
        pass
      pass
    pass
  else:
    for cls in all_tests.values():
      if args.repeatable and not cls.repeatable:
        warnings.warn('Skipping %s because it is not repeatable' % cls.__name__)
        continue
      tests += [(cls, n) for n in cls.list_tests()]
      pass
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
