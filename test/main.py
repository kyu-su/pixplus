import sys, os
import argparse
import unittest
import warnings

_path = os.path.join(os.path.dirname(__file__), 'selenium', 'py')
if os.path.exists(_path) and _path not in sys.path:
  sys.path.insert(0, _path)
  pass

import util
from firefox import Firefox
from chrome import Chrome
from opera import Opera
from safari import Safari

testdir = os.path.abspath(os.path.dirname(__file__))

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

def load_cookie(driver):
  cookie = util.read_json(os.path.join(testdir, 'cookie.json'), {})
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
  util.write_json(os.path.join(testdir, 'cookie.json'), cookie)
  pass

def login(browser, config):
  print('Logging in...')
  browser.open('https://www.secure.pixiv.net/login.php')

  form = browser.qa('form[action*="login.php"]')[-1]

  e_id = browser.q('input[name="pixiv_id"]', form)
  e_id.clear()
  e_id.send_keys(config['username'])

  e_pw = browser.q('input[name="pass"]', form)
  e_pw.clear()
  e_pw.send_keys(config['password'])

  form.submit()

  browser.wait_page_load()

  if browser.url != 'http://www.pixiv.net/mypage.php':
    print('Login failed!')
    raw_input('Please login manually and press enter...')
    pass

  save_cookie(browser.driver)
  pass

def test(browser, config, tests):
  browser.start()
  try:
    suite = unittest.TestSuite()
    suite.addTests([cls(browser, config, testname) for cls, testname in tests])

    browser.set_window_size(1280, 800)

    browser.open('http://www.pixiv.net/')
    load_cookie(browser.driver)
    browser.open('http://www.pixiv.net/')

    if browser.url == 'http://www.pixiv.net/':
      login(browser, config)
      pass

    unittest.TextTestRunner(verbosity = 2).run(suite)
  finally:
    browser.quit()
    pass
  pass

def main():
  from browser import Browser
  import firefox
  import chrome
  import opera
  import safari

  browsers = [
    (firefox, firefox.Firefox),
    (chrome, chrome.Chrome),
    (opera, opera.Opera),
    (safari, safari.Safari)
    ]

  all_tests = load_tests()
  browser_names = list(map(lambda b: b[1].name, browsers))

  parser = argparse.ArgumentParser(usage = '%(prog)s [options]')

  parser.add_argument('-p', dest = 'server_port', type = int,
                      required = True, help = 'Selenium server port')
  parser.add_argument('-t', dest = 'tests', action = 'append',
                      help = 'TEST or TEST:METHOD')
  parser.add_argument('-b', metavar = 'BROWSER', choices = browser_names,
                      dest = 'browsers', action = 'append',
                      help = ','.join(browser_names))
  parser.add_argument('--repeatable', dest = 'repeatable',
                      action = 'store_true', default = False)

  for mod, browser in browsers:
    browser.browserdir = os.path.dirname(mod.__file__)
    browser.register_args(parser)
    pass

  args = parser.parse_args()

  config = util.read_json(os.path.join(testdir, 'config.json'))
  if config is None:
    print('Error: Create "config.json" first')
    return

  Browser.testdir = testdir
  Browser.rootdir = os.path.dirname(testdir)
  Browser.bindir = os.path.join(Browser.rootdir, 'bin')
  Browser.args = args
  Browser.config = config

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
    for name in sorted(all_tests.keys()):
      cls = all_tests[name]
      if args.repeatable and not cls.repeatable:
        warnings.warn('Skipping %s because it is not repeatable' % cls.__name__)
        continue
      tests += [(cls, n) for n in cls.list_tests()]
      pass
    pass

  for mod, browser in browsers:
    if args.browsers and browser.name not in args.browsers:
      continue
    test(browser(), config, tests)
    pass
  pass

if __name__ == '__main__':
  main()
  pass
