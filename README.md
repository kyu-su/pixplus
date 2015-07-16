pixplus
=======

Browser extension for pixiv.

Donate! => http://www.pixiv.net/premium.php

## Screenshot

![Popup](screenshot/mac_opera12_popup.png)

## Supported browsers

* GoogleChrome/Chromium (crx/Greasemonkey)
* Firefox / ESR (Greasemonkey/Scriptish)
* Safari (safariextz)
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
* openssl (crx, safariextz)

Followings are downloaded under `ext/` dir by `git submodule update --init`.

* crxmake
* rubyzip (required by crxmake)
* xar
* sass

## How to build

```bash
$ git submodule update --init
$ make deps
$ make
```

If you don't want to build safariextz, you can skip `make deps`.

## How to sign safariextz

1. Get signing certificates from [Safari Dev Center].
1. Make an empty extension, **foo.safariextz**.
1. Export secret key from **Keychain Access.app** as pkcs12 format.
1. Extract certificates from **foo.safariextz** and put into **safari/sign/??.crt**. (??: 00~02)
1. Convert exported pkcs12 file to PEM format and put into **safari/sign/key.pem**.
1. `make clean; make`

You can shortcut step4--5 by following:

```bash
$ safari/prepare_sign.sh foo.safariextz Certificates.p12
```

[Safari Dev Center]: https://developer.apple.com/devcenter/safari/
