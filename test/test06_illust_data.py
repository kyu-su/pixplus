from selenium.webdriver.support.select import Select

from test_base import TestCase

class Test_IllustData(TestCase):
  illust_list = [
    {'id': 1580459,
     'title': u'\u3010\u4f01\u753b\u3011\u30d4\u30af\u30b7\u30d6\u305f\u3093\u3092\u63cf\u3053\u3046\uff01',
     'caption': u'2008\u5e749\u670810\u65e5\u3067pixiv\u306f\u30b5\u30fc\u30d3\u30b9\u958b\u59cb1\u5468\u5e74\u3092\u8fce\u3048\u307e\u3059\u3002<br>\u305d\u3053\u3067\u3001pixiv1\u5468\u5e74\u8a18\u5ff5\u4f01\u753b\u3068\u3057\u3066\u3001pixiv\u3068\u3044\u3046\u30b5\u30fc\u30d3\u30b9\u3092\u64ec\u4eba\u5316\u3057\u305f\u30ad\u30e3\u30e9\u30af\u30bf\u30fc\u300c\u30d4\u30af\u30b7\u30d6\u305f\u3093\u300d\u3092\u5927\u52df\u96c6\uff01<br>\u7686\u3055\u3093\u304c\u8003\u3048\u308b\u300c\u30d4\u30af\u30b7\u30d6\u305f\u3093\u300d\u3092\u30a4\u30e9\u30b9\u30c8\u306b\u3057\u3066\u307f\u307e\u305b\u3093\u304b\uff1f <br><br>Special Thanks:\u300c\u307f\u3093\u306a\u3067\u30d4\u30af\u30b7\u30d6\u305f\u3093\u63cf\u3053\u3046\u305c\uff01\u300d<strong><a href="http://www.pixiv.net/member_illust.php?mode=medium&amp;illust_id=14567">illust/14567</a></strong><br>\u300cpixiv\u304a\u8a95\u751f\u65e5\u300d <strong><a href="http://www.pixiv.net/member_illust.php?mode=medium&amp;illust_id=1469262">illust/1469262</a></strong> <br>\u30d4\u30af\u30b7\u30d6\u305f\u3093\u3000\u2192\u3000<a href="http://tinyurl.com/6yx3f5" target="_blank">http://tinyurl.com/6yx3f5</a>',
     'tags': set([
          u'pixiv\u30a2\u30a4\u30b3\u30f3\u304c\u30b4\u30fc\u30b8\u30e3\u30b9',
          u'\u30aa\u30d5\u30a3\u30b7\u30e3\u30eb',
          u'\u30d4\u30af\u30b7\u30d6\u305f\u3093',
          u'\u4f01\u753b',
          u'\u4f01\u753b\u4e3b',
          u'\u4f01\u753b\u76ee\u9332',
          u'\u516c\u5f0f',
          u'\u516c\u5f0f\u4f01\u753b',
          u'\u8a18\u5ff5\u65e5'
          ]),

     'author_id':               11,
     'author_name':             u'pixiv\u4e8b\u52d9\u5c40',
     'author_is_me':            False,
     'author_favorite':         True,
     'author_mutual_favorite':  False,
     'author_mypixiv':          False,
     'size':                    {'width': 749, 'height': 711},
     'manga':                   {'available': False, 'viewed': False},
     'image_url_big':           'http://i4.pixiv.net/img-original/img/2008/09/10/17/47/18/1580459_p0.jpg',
     'image_url_medium':        'http://i4.pixiv.net/c/600x600/img-master/img/2008/09/10/17/47/18/1580459_p0_master1200.jpg',
     'url_medium':              '/member_illust.php?mode=medium&illust_id=1580459',
     'url_author_profile':      '/member.php?id=11',
     'url_author_works':        '/member_illust.php?id=11',
     'url_author_bookmarks':    '/bookmark.php?id=11',
     'url_author_staccfeed':    '/stacc/pixiv',
     'url_bookmark':            '/bookmark_add.php?type=illust&illust_id=1580459',
     'url_bookmark_detail':     '/bookmark_detail.php?illust_id=1580459',
     'url_manga':               '/member_illust.php?mode=manga&illust_id=1580459',
     'url_response':            '/response.php?illust_id=1580459',
     'url_response_to':         None,
     'has_image_response':      True,
     'image_response_to':       None
     },

    {'id': 35064276,
     'title': u'\u30b0\u30ea\u30fc \u30b2\u30fc\u30e0\u30a4\u30e9\u30b3\u30f3supported by Biz-IQ',
     'caption': u'4\u670817\u65e5\u3088\u308a\u300c\u30b0\u30ea\u30fc \u30b2\u30fc\u30e0\u30a4\u30e9\u30b9\u30c8\u30b3\u30f3\u30c6\u30b9\u30c8supported by Biz-IQ\u300d\u3092\u958b\u50ac\u3044\u305f\u3057\u307e\u3059\u3002<br>\u3053\u306e\u4f01\u753b\u306f\u3001\u30b0\u30ea\u30fc\u682a\u5f0f\u4f1a\u793e\u306e\u30b2\u30fc\u30e0\u30af\u30ea\u30a8\u30a4\u30bf\u30fc\u63a1\u7528\u3092\u76ee\u7684\u3068\u3057\u305f\u4f01\u753b\u3067\u3059\u3002\u5168\u6295\u7a3f\u8005\u306b\u5bfe\u3057\u3066\u3001\u30b2\u30fc\u30e0\u30af\u30ea\u30a8\u30a4\u30bf\u30fc\u63a1\u7528\u30b9\u30ab\u30a6\u30c8\u306e\u9023\u7d61\u3092\u3055\u305b\u3066\u3044\u305f\u3060\u304f\u53ef\u80fd\u6027\u304c\u3054\u3056\u3044\u307e\u3059\u3002\u8a73\u7d30\u306f\u5fc5\u305a\u5fdc\u52df\u8981\u9805\u3092\u78ba\u8a8d\u304f\u3060\u3055\u3044\u3002<br><br>\u3010\u52df\u96c6\u671f\u9593\u3011<br><s>2013\u5e744\u670817\u65e5\uff08\u6c34\uff09\uff5e2013\u5e745\u670828\u65e5\uff08\u706b\uff0923\uff1a59\u307e\u3067</s><br><span style="color:#fe3a20;">\u5fdc\u52df\u53d7\u4ed8\u306f\u7d42\u4e86\u3044\u305f\u3057\u307e\u3057\u305f\u3002\u305f\u304f\u3055\u3093\u306e\u3054\u5fdc\u52df\u3042\u308a\u304c\u3068\u3046\u3054\u3056\u3044\u307e\u3059\uff01</span><br>\u53d7\u8cde\u4f5c\u54c1\u3092\u767a\u8868\u3044\u305f\u3057\u307e\u3057\u305f\u3002 <strong><a href="http://www.pixiv.net/info.php?id=1715">info.php?id=1715</a></strong><br><br>\u3010\u30bf\u30b0\u3011<br><span style="color:#fe3a20;">\u30b0\u30ea\u30fc\u30b2\u30fc\u30e0\u30a4\u30e9\u30b3\u30f3</span><br><br>\u3010\u30c6\u30fc\u30de\u3011<br>\u30dc\u30b9\u3068\u306e\u6c7a\u6226\uff01\u30d5\u30a1\u30f3\u30bf\u30b8\u30fc\u3092\u984c\u6750\u306b\u3057\u305f\u67b6\u7a7a\u306e\u30ab\u30fc\u30c9\u30b2\u30fc\u30e0\u306b\u767b\u5834\u3059\u308b\u300c\u30dc\u30b9\u30e2\u30f3\u30b9\u30bf\u30fc\u300d\u3092\u63cf\u3044\u3066\u304f\u3060\u3055\u3044\u3002<br>\u3000\u30fb\u300c\u30b2\u30fc\u30e0\u4e2d\u76e4\u306b\u767b\u5834\u3057\u3001\u82e6\u6226\u3055\u305b\u3089\u308c\u308b\u30dc\u30b9\u300d\u3068\u3044\u3046\u8a2d\u5b9a\u3092\u30a4\u30e1\u30fc\u30b8\u3057\u3066\u81ea\u7531\u306b\u8868\u73fe\u3057\u3066\u304f\u3060\u3055\u3044\u3002<br>\u3000\u30fb\u30ab\u30fc\u30c9\u30a4\u30e1\u30fc\u30b8\u3067\u3082\u3001\u30d0\u30c8\u30eb\u30b7\u30fc\u30f3\u3092\u63cf\u3044\u3066\u3082\u304b\u307e\u3044\u307e\u305b\u3093\u3002<br>\u3000\u30fb\u30a4\u30e9\u30b9\u30c8\u306e\u30c6\u30a4\u30b9\u30c8\u306b\u6307\u5b9a\u306f\u3042\u308a\u307e\u305b\u3093\u3002<br><br>\u3010\u53c2\u52a0\u65b9\u6cd5\u3011<br>\u6295\u7a3f\u3055\u308c\u305f\u65b9\u5168\u54e1\u306b\u3001pixiv\u306e\u516c\u5f0f\u30a2\u30ab\u30a6\u30f3\u30c8\u304b\u3089\u30e1\u30c3\u30bb\u30fc\u30b8\u3092\u304a\u9001\u308a\u3044\u305f\u3057\u307e\u3059\u3002<br>\u30e1\u30c3\u30bb\u30fc\u30b8\u306b\u8a18\u8f09\u3055\u308c\u3066\u3044\u308b\u5fdc\u52df\u30d5\u30a9\u30fc\u30e0\u306b\u30a2\u30af\u30bb\u30b9\u3057\u3001\u6295\u7a3f\u8005\u60c5\u5831\u3092\u5165\u529b\u3057\u305f\u6642\u70b9\u3067\u5fdc\u52df\u53d7\u4ed8\u5b8c\u4e86\u3068\u306a\u308a\u307e\u3059\u3002<br>\u203b\u8a18\u5165\u3044\u305f\u3060\u304d\u307e\u3057\u305f\u6295\u7a3f\u8005\u60c5\u5831\u306b\u3064\u304d\u307e\u3057\u3066\u306f\u3001\u682a\u5f0f\u4f1a\u793e\u30ea\u30af\u30eb\u30fc\u30c8\u30ad\u30e3\u30ea\u30a2\u304a\u3088\u3073\u30b0\u30ea\u30fc\u682a\u5f0f\u4f1a\u793e\u306b\u63d0\u4f9b\u3044\u305f\u3057\u307e\u3059\u3002<br>\u3000\u6295\u7a3f\u4f5c\u54c1\u3092\u898b\u305f\u30b0\u30ea\u30fc\u304b\u3089\u6295\u7a3f\u8005\u3078\u30b9\u30ab\u30a6\u30c8\u306e\u5e0c\u671b\u304c\u3042\u3063\u305f\u5834\u5408\u306e\u307f\u3001\u30ea\u30af\u30eb\u30fc\u30c8\u30ad\u30e3\u30ea\u30a2\u3088\u308a\u3054\u9023\u7d61\u3055\u305b\u3066\u3044\u305f\u3060\u304d\u307e\u3059\u3002<br><br>\u512a\u79c0\u8cde5\u540d\u306b\u306f\u3001\u8cde\u91d15\u4e07\u5186\u304c\u9032\u5448\u3055\u308c\u307e\u3059\u3002<br>\u3042\u306a\u305f\u306e\u624d\u80fd\u3001\u6025\u52df\uff01\u30b2\u30fc\u30e0\u30af\u30ea\u30a8\u30a4\u30bf\u30fc\u3092\u76ee\u6307\u3059\u307f\u306a\u3055\u307e\u306e\u3054\u53c2\u52a0\u3001\u304a\u5f85\u3061\u3057\u3066\u304a\u308a\u307e\u3059\u3002<br><br>\u25c6\u5fdc\u52df\u4f5c\u54c1\u4e00\u89a7\u30da\u30fc\u30b8\u3000<a href="http://www.pixiv.net/contest/gree.php" target="_blank">http://www.pixiv.net/contest/gree.php</a><br>\u25c6\u5fdc\u52df\u8981\u9805\u3000<a href="http://www.pixiv.net/contest/gree_terms.php" target="_blank">http://www.pixiv.net/contest/gree_terms.php</a><br><br>\u25c6\u30b0\u30ea\u30fc\u63a1\u7528\u30b5\u30a4\u30c8\u300eCareers at GREE\u300f\u3000<a href="http://gree.jp/r/60468/1" target="_blank">http://gree.jp/r/60468/1</a><br>\u25c6\u30b0\u30ea\u30fc\u63a1\u7528\u516c\u5f0fFacebook\u30da\u30fc\u30b8\u300eCareers at GREE\u300f\u3000<a href="http://gree.jp/r/60466/1" target="_blank">http://gree.jp/r/60466/1</a>',
     'tags': set([
          u'\u30b0\u30ea\u30fc\u30b2\u30fc\u30e0\u30a4\u30e9\u30b3\u30f3',
          u'\u30d5\u30a1\u30f3\u30bf\u30b8\u30fc',
          u'\u4e2d\u30dc\u30b9',
          u'\u516c\u5f0f\u4f01\u753b',
          u'\u753b\u529b>\u5c65\u6b74\u66f8'
          ]),

     'author_id':               11,
     'author_name':             u'pixiv\u4e8b\u52d9\u5c40',
     'author_is_me':            False,
     'author_favorite':         True,
     'author_mutual_favorite':  False,
     'author_mypixiv':          False,
     'size':                    {'width': 970, 'height': 740},
     'manga':                   {'available': False, 'viewed': False},
     'image_url_medium':        'http://i1.pixiv.net/c/600x600/img-master/img/2013/04/24/19/31/03/35064276_p0_master1200.jpg',
     'image_url_big':           'http://i1.pixiv.net/img-original/img/2013/04/24/19/31/03/35064276_p0.jpg',
     'url_medium':              '/member_illust.php?mode=medium&illust_id=35064276',
     'url_author_profile':      '/member.php?id=11',
     'url_author_works':        '/member_illust.php?id=11',
     'url_author_bookmarks':    '/bookmark.php?id=11',
     'url_author_staccfeed':    '/stacc/pixiv',
     'url_bookmark':            '/bookmark_add.php?type=illust&illust_id=35064276',
     'url_bookmark_detail':     '/bookmark_detail.php?illust_id=35064276',
     'url_manga':               '/member_illust.php?mode=manga&illust_id=35064276',
     'url_response':            '/response.php?illust_id=35064276',
     'url_response_to':         None,
     'has_image_response':      True,
     'image_response_to':       None
     },

    {'id': 6209105,
     'title': u'\u30c1\u30e7\u30d3\u30de\u30f3\u30ac',
     'caption': u'\u30de\u30f3\u30ac\u3092\u6295\u7a3f\u3059\u308b\u3068\u3053\u306e\u3088\u3046\u306b\u306a\u308a\u307e\u3059\u3002<br><br>\u30c1\u30e7\u30d3\u30de\u30f3\u30ac\u7d9a\u7de8\uff1a<strong><a href="http://www.pixiv.net/member_illust.php?mode=medium&amp;illust_id=17242686">illust/17242686</a></strong>',
     'tags': set([
          u'\u304a\u6301\u3061\u5e30\u308a',
          u'\u3061\u3087\u3073\u307e\u3093\u30ac',
          u'\u306a\u306b\u3053\u308c\u304b\u308f\u3044\u3044',
          u'\u30aa\u30c1\u306e\u30b7\u30e5\u30fc\u30eb\u3055\u306b\u5b8c\u6557',
          u'\u30b9\u30e9\u30a4\u30c9\u5f62\u5f0f\u5fa9\u6d3b\u5e0c\u671b',
          u'\u30c1\u30e7\u30d3',
          u'\u53ef\u611b\u3044\u30fb\u30fb\u30fb',
          u'\u62cd\u624b\u30fb\u9801\u9001\u308a\u306f\u4e0b\u90e8\u304c\u52dd\u624b\u304c\u826f\u3044\u3002',
          u'\u898b\u958b\u304d\u306e\u305f\u3081\u306b\u6a2a\u5e451000\uff5e1200\u304f\u3089\u3044\u306b\u3057\u3066\u307b\u3057\u3044',
          u'\u898b\u958b\u304d\u306f\u3059\u3054\u304f\u4fbf\u5229\u3060\u3068\u601d\u3046'
          ]),

     'author_id':               11,
     'author_name':             u'pixiv\u4e8b\u52d9\u5c40',
     'author_is_me':            False,
     'author_favorite':         True,
     'author_mutual_favorite':  False,
     'author_mypixiv':          False,
     'manga':                   {'available': True, 'viewed': False, 'page_count': 3},
     'image_url_medium':        'http://i2.pixiv.net/c/600x600/img-master/img/2009/09/18/15/38/43/6209105_p0_master1200.jpg',
     'url_medium':              '/member_illust.php?mode=medium&illust_id=6209105',
     'url_author_profile':      '/member.php?id=11',
     'url_author_works':        '/member_illust.php?id=11',
     'url_author_bookmarks':    '/bookmark.php?id=11',
     'url_author_staccfeed':    '/stacc/pixiv',
     'url_bookmark':            '/bookmark_add.php?type=illust&illust_id=6209105',
     'url_bookmark_detail':     '/bookmark_detail.php?illust_id=6209105',
     'url_manga':               '/member_illust.php?mode=manga&illust_id=6209105',
     'url_response':            '/response.php?illust_id=6209105',
     'url_response_to':         None,
     'has_image_response':      False,
     'image_response_to':       None
     },

    {'id': 37442895,
     'title': u'\u3010\u516c\u5f0f\u4f01\u753b\u3011\u65b0\u4eba\u8cde\u300cP-1GRANDPRIX2013\u300d\u958b\u50ac',
     'caption': u'\u3053\u306e\u516c\u5f0f\u4f01\u753b\u306f\u3001pixiv\u306b\u30a4\u30e9\u30b9\u30c8\u3092\u6295\u7a3f\u3057\u3066\u3044\u308b\u82e5\u304d\u624d\u80fd\u3092\u6301\u3063\u305f\u30e6\u30fc\u30b6\u30fc\u306b<br>\u65b0\u305f\u306a\u30c1\u30e3\u30f3\u30b9\u3092\u63b4\u3093\u3067\u3044\u305f\u3060\u304f\u305f\u3081\u306e\u65b0\u4eba\u8cde\u4f01\u753b\u3067\u3059\u3002<br><br>\u3010\u52df\u96c6\u671f\u9593\u3011<br><span style="color:#fe3a20;">2013\u5e747\u670831\u65e5(\u6c34)\uff5e8\u670830\u65e5\uff08\u91d1)23\uff1a59 \u307e\u3067</span><br><br>\u3010\u53c2\u52a0\u65b9\u6cd5\u3011<br>\u4e88\u9078\u3067\u306f\u4f5c\u54c1\u95b2\u89a7\u6570\u306b\u57fa\u3065\u304d\u3001\u90fd\u9053\u5e9c\u770c\u3054\u3068\u306e\u672c\u9078\u51fa\u5834\u8005\u3092\u6c7a\u5b9a\u3057\u307e\u3059\u3002<br><br>\u307e\u305f\u4eca\u56de\u304b\u3089\u682a\u5f0f\u4f1a\u793e\u30e1\u30c7\u30a3\u30a2\u30d5\u30a1\u30af\u30c8\u30ea\u30fcMF\u6587\u5eabJ\u5354\u529b\u306e\u3082\u3068\u3001<br>\u65b0\u90e8\u9580\u3068\u3057\u3066\u300c\u30e9\u30a4\u30c8\u30ce\u30d9\u30eb\u30a4\u30e9\u30b9\u30c8\u30ec\u30fc\u30bf\u30fc\u90e8\u9580\u300d\u3078\u306e\u53c2\u52a0\u304c\u53ef\u80fd\u3068\u306a\u308a\u307e\u3059\u3002<br>\u4e88\u9078\u3001\u672c\u9078\u5be9\u67fb\u3092\u7d4c\u3066\u3001\u53c2\u52a0\u8005\u306e\u4e2d\u304b\u3089\u9078\u3070\u308c\u305f\u53d7\u8cde\u8005\u306f<br>MF\u6587\u5eabJ\u306e\u65b0\u4f5c\u30e9\u30a4\u30c8\u30ce\u30d9\u30eb\u306e\u30a4\u30e9\u30b9\u30c8\u30ec\u30fc\u30bf\u30fc\u3068\u3057\u3066\u63a1\u7528\u3055\u308c\u307e\u3059\u3002<br><br>\uff08\uff11\uff09\u898f\u5b9a\u306e\u30c6\u30fc\u30de\u306b\u6cbf\u3063\u305f\u30a4\u30e9\u30b9\u30c8\u3092\u5236\u4f5c\u3057\u307e\u3059\u3002<br>\u4e88\u9078\u30c6\u30fc\u30de\u306f\u300c<span style="color:#fe3a20;">\u6b66\u5668&amp;\u5c11\u5973</span>\u300d\u3067\u3059\u3002<br>\u898f\u5b9a\u306e\u30c6\u30fc\u30de\u3067\u30aa\u30ea\u30b8\u30ca\u30eb\u306e\u30a4\u30e9\u30b9\u30c8\u3092\u5236\u4f5c\u3057\u3066\u304f\u3060\u3055\u3044\u3002<br><br>\uff08\uff12\uff09\u53c2\u52a0\u3057\u305f\u3044\u90e8\u9580\u306b\u3042\u308f\u305b\u3066\u3001\u6307\u5b9a\u3055\u308c\u305f2\u3064\u306e\u30bf\u30b0\u3092\u8a2d\u5b9a\u3057\u3066\u6295\u7a3f\u3057\u3066\u304f\u3060\u3055\u3044\u3002<br>\u203b\u30a4\u30e9\u30b9\u30c8\u3092\u5236\u4f5c\u30fb\u6295\u7a3f\u3059\u308b\u30b5\u30a4\u30ba\u306f\u81ea\u7531\u3067\u3059\u3002\u6295\u7a3f\u679a\u6570\u306e\u5236\u9650\u306f\u3054\u3056\u3044\u307e\u305b\u3093\u3002\u53c2\u52a0\u3067\u304d\u308b\u90e8\u9580\u306f1\u6295\u7a3f\u306b\u3064\u304d1\u3064\u3067\u3059\u3002<br><br>\u30fbP1\u30b0\u30e9\u30f3\u30d7\u30ea\u90e8\u9580<br><br>\u53c2\u52a0\u30bf\u30b0\u300c<span style="color:#fe3a20;">P1\u30b0\u30e9\u30f3\u30d7\u30ea2013</span>\u300d\u300c<span style="color:#fe3a20;">P1\u4e88\u90782013+\u5730\u57df\u540d</span>\u300d<br><br>[\u30bf\u30b0\u306e\u4f8b]<br>\u6771\u4eac\u90fd\u51fa\u8eab\u306e\u5834\u5408\u306f\u300cP1\u4e88\u90782013\u6771\u4eac\u300d\u3001\u6d77\u5916\u306e\u5834\u5408\u306f\u300cP1\u4e88\u90782013\u6d77\u5916\u300d\u3068\u306a\u308a\u307e\u3059\u3002<br><br>\u5404\u5730\u57df\u306e\u4e88\u9078\u901a\u904e\u8005\u306f\u6295\u7a3f\u3055\u308c\u305f\u4f5c\u54c1\u306e\u95b2\u89a7\u6570\u306b\u3088\u3063\u3066\u6c7a\u5b9a\u3057\u307e\u3059\u3002<br>1\u3064\u306e\u5730\u57df\u306b\u3064\u304d\u9078\u629c\u3055\u308c\u308b\u4ee3\u8868\u8005\u306f3\u540d\u3001\u300c\u6d77\u5916\u300d\u30a8\u30ea\u30a2\u306f5\u540d\u3092\u4e0a\u9650\u3068\u3057\u3001<br>\u3088\u308a\u591a\u304f\u306e\u95b2\u89a7\u6570\u3092\u5f97\u305f\u4f5c\u54c1\u9806\u306b40\u540d\u306e\u4e88\u9078\u901a\u904e\u67a0\u3092\u7372\u5f97\u3059\u308b\u30eb\u30fc\u30eb\u3067\u3059\u3002<br><br>\u30fb\u30e9\u30a4\u30c8\u30ce\u30d9\u30eb\u30a4\u30e9\u30b9\u30c8\u30ec\u30fc\u30bf\u30fc\u90e8\u9580<br>\u30bf\u30b0\uff1a\u300c<span style="color:#fe3a20;">P1\u30b0\u30e9\u30f3\u30d7\u30ea2013</span>\u300d\u300c<span style="color:#fe3a20;">P1\u30e9\u30a4\u30c8\u30ce\u30d9\u30eb2013</span>\u300d<br>MF\u6587\u5eabJ\u7de8\u96c6\u90e8\u306b\u3088\u308b\u5be9\u67fb\u306e\u3082\u3068\u3001\u53c2\u52a0\u8005\u306e\u4e2d\u304b\u308910\u540d\u304c\u4e88\u9078\u901a\u904e\u8005\u3068\u3057\u3066\u9078\u3070\u308c\u307e\u3059\u3002<br><br>\u3010\u672c\u9078\u4ee3\u8868\u8005\u306e\u767a\u8868\u3011<br>\u671f\u9593\u7d42\u4e86\u5f8c\u3001\u4e88\u9078\u3092\u901a\u904e\u3055\u308c\u305f\u65b9\u306b\u306f9\u67085\u65e5(\u6728)\u307e\u3067\u306b\u4e88\u9078\u901a\u904e\u306e\u9023\u7d61\u3068\u5171\u306b\u3001\u672c\u9078\u8a73\u7d30\u306b\u3064\u3044\u3066\u3054\u9023\u7d61\u3057\u307e\u3059\u3002<br><br>\u25c6\u5fdc\u52df\u4f5c\u54c1\u4e00\u89a7\u30da\u30fc\u30b8 <a href="http://www.pixiv.net/contest/p1_2013.php" target="_blank">http://www.pixiv.net/contest/p1_2013.php</a><br>\u25c6\u5fdc\u52df\u8981\u9805 <a href="http://www.pixiv.net/contest/p1_2013_terms.php" target="_blank">http://www.pixiv.net/contest/p1_2013_terms.php</a><br>\u25c6P-1GRANDPRIX2013\u7279\u8a2d\u30b5\u30a4\u30c8 <a href="http://www.pixiv.net/p1/2013/" target="_blank">http://www.pixiv.net/p1/2013/</a>',
     'tags': set([
          u'P1\u30b0\u30e9\u30f3\u30d7\u30ea2013',
          u'P1\u30e9\u30a4\u30c8\u30ce\u30d9\u30eb2013',
          u'\u516c\u5f0f\u4f01\u753b',
          u'\u6e1b\u91cf\u30b3\u30f3\u30d3'
          ]),

     'author_id':               11,
     'author_name':             u'pixiv\u4e8b\u52d9\u5c40',
     'author_is_me':            False,
     'author_favorite':         True,
     'author_mutual_favorite':  False,
     'author_mypixiv':          False,
     'manga':                   {'available': True, 'viewed': False, 'page_count': 2},
     'image_url_medium':        'http://i4.pixiv.net/c/600x600/img-master/img/2013/07/31/14/33/54/37442895_p0_master1200.jpg',
     'url_medium':              '/member_illust.php?mode=medium&illust_id=37442895',
     'url_author_profile':      '/member.php?id=11',
     'url_author_works':        '/member_illust.php?id=11',
     'url_author_bookmarks':    '/bookmark.php?id=11',
     'url_author_staccfeed':    '/stacc/pixiv',
     'url_bookmark':            '/bookmark_add.php?type=illust&illust_id=37442895',
     'url_bookmark_detail':     '/bookmark_detail.php?illust_id=37442895',
     'url_manga':               '/member_illust.php?mode=manga&illust_id=37442895',
     'url_response':            '/response.php?illust_id=37442895',
     'url_response_to':         None,
     'has_image_response':      True,
     'image_response_to':       None
     }
    ]

  def check_object_equal(self, o1, o2, msg, path = []):
    msg_s = msg % {'path': '/'.join(path), 'obj1': '%s' % o1, 'obj2': '%s' % o2}

    if isinstance(o1, dict):
      if not isinstance(o2, dict):
        raise RuntimeError(msg_s)

      for key, value in o1.items():
        self.check_object_equal(value, o2[key], msg, path + [key])

    else:
      self.assertEqual(o1, o2, msg_s)

  def test_illust_data(self):
    self.open('/')
    self.set_conf('popup.big_image', True)

    for data in self.illust_list:
      self.open_popup(data['id'])
      if 'image_url_big' in data:
        self.popup_wait_big_image()
      illust_data = self.popup_get_illust_data()
      illust_data['tags'] = set(illust_data['tags'])
      self.check_object_equal(data, illust_data, 'Illust data mismatch! %d[%%(path)s] =>\n  %%(obj1)s\n    vs\n  %%(obj2)s' % data['id'])
