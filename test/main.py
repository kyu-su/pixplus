import sys, os
import argparse
import unittest
import subprocess

testdir = os.path.abspath(os.path.dirname(__file__))

selenium_py_dir = os.path.join(testdir, 'selenium', 'py')
if os.path.exists(selenium_py_dir):
  sys.path.insert(0, selenium_py_dir)
  pass

import selenium.common.exceptions

import util

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

def save_cookie(driver):
  cookie = {}
  for key in ['PHPSESSID']:
    cookie[key] = driver.get_cookie(key)
    pass
  util.write_json(os.path.join(testdir, 'cookie.json'), cookie)
  pass

def login(browser, config):
  print('Logging in...')
  # browser.open('https://www.secure.pixiv.net/login.php')

  form = browser.wait_until(lambda d: browser.qa('form[action*="login.php"]'))[-1]

  e_id = form.find_element_by_css_selector('input[name="pixiv_id"]')
  e_id.clear()
  e_id.send_keys(config['username'])

  e_pw = form.find_element_by_css_selector('input[name="pass"]')
  e_pw.clear()
  e_pw.send_keys(config['password'])

  # form.submit()
  form.find_element_by_css_selector('#login_submit').click()

  try:
    browser.wait_until(lambda d: browser.url.startswith('http://www.pixiv.net/mypage.php'))
  except selenium.common.exceptions.TimeoutException:
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

    browser.set_window_size(1024, 768)

    if list(filter(lambda p: p[0].run_in_pixiv, tests)):
      browser.open('http://www.pixiv.net/')

      cookie = util.read_json(os.path.join(testdir, 'cookie.json'), {})
      for name, item in cookie.items():
        browser.set_cookie(item['name'], item['value'],
                           item.get('domain', '.pixiv.net'),
                           item['path'])
        pass

      browser.open('http://www.pixiv.net/')

      if browser.url == 'http://www.pixiv.net/':
        login(browser, config)
        pass
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
  import safari

  browsers = [
    (firefox, firefox.Firefox),
    (chrome, chrome.Chrome),
    (safari, safari.Safari)
    ]

  all_tests = load_tests()
  browser_names = [b[1].name for b in browsers]

  parser = argparse.ArgumentParser(usage = '%(prog)s [options]')

  parser.add_argument('-d', dest = 'server_host',
                      default = 'localhost', help = 'Selenium server host name')
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
    if hasattr(mod, 'register_args'):
      mod.register_args(parser)
      pass
    browser.browserdir = os.path.dirname(mod.__file__)
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
  for name in (args.tests or sorted(all_tests.keys())):
    if ':' in name:
      name = name.split(':')
      tests.append((all_tests[name[0]], name[1]))
    else:
      cls = all_tests[name]
      tests += [(cls, n) for n in cls.list_tests()]
      pass
    pass

  subprocess.call(['make', '-C', Browser.rootdir])

  for mod, browser in browsers:
    if args.browsers and browser.name not in args.browsers:
      continue
    test(browser(), config, tests)
    pass
  pass

if __name__ == '__main__':
  main()
  pass
