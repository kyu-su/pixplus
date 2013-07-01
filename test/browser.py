import tempfile
import shutil

class Browser:

  def __init__(self, config):
    self.rootdir = config['rootdir']
    self.bindir = config['bindir']
    self.driver = None
    self.profiledir = None
    pass

  def create_profile(self):
    self.profiledir = tempfile.mkdtemp()
    print('%s: %s' % (self.name, self.profiledir))
    pass

  def set_window_size(self, width, height):
    self.driver.set_window_size(width, height)
    pass

  def quit(self):
    try:
      self.driver.quit()
    finally:
      if self.profiledir:
        print('Remove profile: %s' % self.profiledir)
        shutil.rmtree(self.profiledir)
        pass
      pass
    pass

  pass
