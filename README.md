pixplus
=======

Browser extension for pixiv.

Donate! => http://www.pixiv.net/premium.php

## Screenshot

![Popup](screenshot/mac_opera12_popup.png)

## Supported browsers

* GoogleChrome/Chromium (crx/Greasemonkey)
* Firefox / ESR (Greasemonkey/Scriptish)
* Opera 15+ (crx)
* Opera 12 (oex/UserJS)

## License

The MIT License

## Version history

[changelog.md](changelog.md)

## Build requirements

* make (GNU Make)
* rsvg-convert or Inkscape or GIMP
* python 2.7+ or 3.3+
* ruby
* zip command (oex only)
* openssl (crx)

Followings are downloaded under `ext/` dir by `git submodule update --init`.

* crxmake
* rubyzip (required by crxmake)
* sass

## Build

```bash
$ git submodule update --init
$ make deps
$ make
```
