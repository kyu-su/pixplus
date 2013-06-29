from selenium import webdriver

class Chrome:
  def __init__(self):
    self.options = webdriver.ChromeOptions()
    self.options.add_extension('../bin/pixplus.crx')
    self.driver = webdriver.Chrome(chrome_options = self.options)
    pass
  pass
