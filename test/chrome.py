from selenium import webdriver
# from webdriver.remote.remote_connection import RemoteConnection

class Chrome:
  def __init__(self, use_crx = True):
    self.options = webdriver.ChromeOptions()

    if use_crx:
      self.options.add_extension('../bin/pixplus.crx')
    else:
      self.options.add_extension('../bin/pixplus.user.js')
      pass

    self.driver = webdriver.Chrome(chrome_options = self.options)
    pass
  pass
