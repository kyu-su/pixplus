import os

from selenium import webdriver

from browser import Browser

class Chrome(Browser):
  name = 'chrome'

  def __init__(self, config):
    Browser.__init__(self, config)
    self.options = webdriver.ChromeOptions()
    self.options.add_extension(os.path.join(self.bindir, 'pixplus.crx'))
    self.driver = webdriver.Chrome(chrome_options = self.options)
    pass

  pass
