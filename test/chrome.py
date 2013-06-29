from selenium import webdriver

from browser import Browser

class Chrome(Browser):

  def __init__(self):
    self.options = webdriver.ChromeOptions()
    self.options.add_extension('../bin/pixplus.crx')
    Browser.__init__(self, webdriver.Chrome(chrome_options = self.options))
    pass

  def quit(self):
    self.driver.quit()
    pass

  pass
