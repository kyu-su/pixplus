class Browser:

  def __init__(self, driver):
    self.driver = driver
    pass

  def set_window_size(self, width, height):
    self.driver.set_window_size(width, height)
    pass

  def quit(self):
    self.driver.quit()
    pass

  pass
