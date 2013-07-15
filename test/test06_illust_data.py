from test_base import TestCase

class Test_IllustData(TestCase):
  illust_list = [
    {'id': 1580459,
     'title': '\u3010\u4f01\u753b\u3011\u30d4\u30af\u30b7\u30d6\u305f\u3093\u3092\u63cf\u3053\u3046\uff01',
     'caption': '2008\u5e749\u670810\u65e5\u3067pixiv\u306f\u30b5\u30fc\u30d3\u30b9\u958b\u59cb1\u5468\u5e74\u3092\u8fce\u3048\u307e\u3059\u3002<br />\u305d\u3053\u3067\u3001pixiv1\u5468\u5e74\u8a18\u5ff5\u4f01\u753b\u3068\u3057\u3066\u3001pixiv\u3068\u3044\u3046\u30b5\u30fc\u30d3\u30b9\u3092\u64ec\u4eba\u5316\u3057\u305f\u30ad\u30e3\u30e9\u30af\u30bf\u30fc\u300c\u30d4\u30af\u30b7\u30d6\u305f\u3093\u300d\u3092\u5927\u52df\u96c6\uff01<br />\u7686\u3055\u3093\u304c\u8003\u3048\u308b\u300c\u30d4\u30af\u30b7\u30d6\u305f\u3093\u300d\u3092\u30a4\u30e9\u30b9\u30c8\u306b\u3057\u3066\u307f\u307e\u305b\u3093\u304b\uff1f <br /><br />Special Thanks:\u300c\u307f\u3093\u306a\u3067\u30d4\u30af\u30b7\u30d6\u305f\u3093\u63cf\u3053\u3046\u305c\uff01\u300d<strong><a href="http://www.pixiv.net/member_illust.php?mode=medium&amp;illust_id=14567">illust/14567</a></strong><br />\u300cpixiv\u304a\u8a95\u751f\u65e5\u300d <strong><a href="http://www.pixiv.net/member_illust.php?mode=medium&amp;illust_id=1469262">illust/1469262</a></strong> <br />\u30d4\u30af\u30b7\u30d6\u305f\u3093\u3000\u2192\u3000<a href="http://tinyurl.com/6yx3f5" target="_blank">http://tinyurl.com/6yx3f5</a>',
     'tags': [
        'pixiv\u30a2\u30a4\u30b3\u30f3\u304c\u30b4\u30fc\u30b8\u30e3\u30b9',
        '\u30aa\u30d5\u30a3\u30b7\u30e3\u30eb',
        '\u30d4\u30af\u30b7\u30d6\u305f\u3093',
        '\u4f01\u753b',
        '\u4f01\u753b\u4e3b',
        '\u4f01\u753b\u76ee\u9332',
        '\u516c\u5f0f',
        '\u516c\u5f0f\u4f01\u753b',
        '\u8a18\u5ff5\u65e5'
        ],

     'author_id':              11,
     'author_name':            'pixiv\u4e8b\u52d9\u5c40',
     'author_is_me':           False,
     'author_favorite':        True,
     'author_mutual_favorite': False,
     'author_mypixiv':         False,
     'size':                   {'width': 749, 'height': 711},
     'manga':                  {'available': False, 'viewed': False},
     'image_url_base':         'http://i1.pixiv.net/img01/img/pixiv/1580459',
     'image_url_big':          'http://i1.pixiv.net/img01/img/pixiv/1580459.jpg',
     'image_url_medium':       'http://i1.pixiv.net/img01/img/pixiv/1580459_m.jpg',
     'image_url_suffix':       '.jpg',
     'url_medium':             '/member_illust.php?mode=medium&illust_id=1580459',
     'url_author_profile':     '/member.php?id=11',
     'url_author_works':       '/member_illust.php?id=11',
     'url_author_bookmarks':   '/bookmark.php?id=11',
     'url_author_staccfeed':   '/stacc/pixiv',
     'url_bookmark':           '/bookmark_add.php?type=illust&illust_id=1580459',
     'url_bookmark_detail':    '/bookmark_detail.php?illust_id=1580459',
     'url_manga':              '/member_illust.php?mode=manga&illust_id=1580459',
     'url_response':           '/response.php?illust_id=1580459',
     'url_response_to':        None
     }
    ]

  @classmethod
  def python2_support(cls):
    import sys
    if sys.version >= '3':
      return

    import codecs

    def convert(o):
      if isinstance(o, str):
        return codecs.unicode_escape_decode(o)[0]
      elif isinstance(o, dict):
        for key, value in o.items():
          o[key] = convert(value)
          pass
        pass
      elif isinstance(o, list):
        for idx, value in enumerate(o):
          o[idx] = convert(value)
          pass
        pass
      return o

    cls.illust_list = convert(cls.illust_list)
    pass

  def test_illust_data(self):
    self.open('/')

    for data in self.illust_list:
      self.open_popup(data['id'])

      illust_data = self.popup_get_illust_data()
      for key, value in data.items():
        self.assertEquals(illust_data[key], value)
        pass
      pass

    pass

  pass

Test_IllustData.python2_support()
