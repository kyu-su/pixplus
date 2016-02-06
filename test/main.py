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

def test(browser, config, tests):
  try:
    suite = unittest.TestSuite()
    suite.addTests([cls(browser, config, testname) for cls, testname in tests])
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
  Browser.distdir = os.path.join(Browser.rootdir, 'dist')
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
