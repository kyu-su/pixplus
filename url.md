Image URL
==========

## Examples

* `http://i1.pixiv.net/img9/img/username/99999999_m.jpg`
* `http://i2.pixiv.net/img-inf/img/2013/01/23/01/23/45/99999999-01234567890123456789abcdefabcdef_s.jpg?8888888888`
    * Thumbnail (2013~)
* `http://i2.pixiv.net/img114/group/176mw/username/99999999_m.jpg`
    * **/group/?id=11313**

## Description

* 2013/01/23/01/23/45
    * Upload time.
    * **YYYY/MM/DD/HH/MM/SS** (JST?)
* 99999999
    * Illust ID.
    * **/member_illust.php?mode=medium&illust_id=99999999**
* -01234567890123456789abcdefabcdef
    * Random 32 characters. ([0-9a-f])
    * Added to limit anonymous access.
* \_0123abcdef
    * Random 10 characters. ([0-9a-f])
    * Added to limit anonymous access.
    * Old form of above.
* \_s
    * Small thumbnail.
    * **/mypage.php**, **/bookmark_new_illust.php**, **/new_illust.php**, **/member_illust.php?id=**, etc...
* \_m
    * Medium image.
    * **/member_illust.php?mode=medium&illust_id=99999999**
* \_100
    * 100x100 (fit)
    * **/search.php**, **/user_event.php**, etc...
* \_128x128
    * 128x128 (cropped, jpg)
    * **/ranking_log.php**, **/stacc**
* \_240ms
    * 240x240 (fit, jpg)
    * **/stacc**
* \_240mw
    * 240x (fit width, jpg)
    * **/tags.php**
* \_p0
    * Manga first page (might be scaled)
    * **_p0**, **_p1**, **p2**, ..., **_p9**, **_p10**, ...
* \_big\_p0
    * Original size image of manga page.
    * Not provided for oooold illusts.
* \_128x128\_p0
    * Manga page thumbnail (cropped, jpg)
* ?8888888888
    * Added after resubmitted.
    * Unix time.
* /176mw/
    * 176x (fit width)

Search URL
===========

* Search target
    * Tags: **s_mode=s_tag**
    * Title/Description: **s_mode=s_tc**
* Sort by
    * Newest:
    * Popularity: **order=popular_d**
    * Oldest: **order=date**
* Period
    * All Time:
    * Within Last Day: **scd=2013-06-06**
    * Within Last Week:
    * Within Last Month:
* Size
    * All sizes:
    * Small (- 1000x1000): **wgt=1000&hgt=1000**
    * Medium (1001x1001 - 3000x3000): **wlt=1001&wgt=3000&hlt=1001&hgt=3000**
    * Large (3001x3001 -): **wlt=3001&hlt=3001**
* Orientation
    * All orientations:
    * Landscape: **ratio=0.5**
    * Portrait: **ratio=-0.5**
    * Square: **ratio=0**
    * `ratio = (width - height) / min(width, height)`
* R-18: **r18=1**
