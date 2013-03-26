pixplus
=======

## pixplus とは

pixiv の UI を拡張するブラウザ拡張。
サムネイルをクリックすると、対象のイラストをポップアップで表示する。

## サポートしているブラウザ

* Opera
* Chrome
* Firefox (Greasemonkey)
* Safari

## ビルド方法

必要なもの:

* make (GNU Make)
* rsvg-convert (アイコンを作る)
* python2.7 (pixplus.js に埋め込んでいる JSON からメタデータなどを作る)
* zip (oex を作る)
* openssl (safariextz に署名する)

    git submodule update --init
    make deps
    make

Safari 拡張を作成しない場合は `make deps` は不要。
Chrome 拡張を作成しない場合は `git submodule update --init` も不要。

### Safari 拡張に署名する方法

1.  [Safari Dev Center](https://developer.apple.com/devcenter/safari/)
    で証明書を発行し、 Extension Builder で適当な safariextz を作成する。
2.  証明書を発行する際に使用した Keychain Access.app
    で鍵を pkcs12 形式でエクスポートする。
3.  エクスポートした p12 ファイルから openssl コマンドで秘密鍵を
    PEM 形式で抜き出す。
4.  作成した safariextz から証明書を DER 形式で抜き出し、 safari/sign/
    下に cert??.crt のファイル名で保存(?? は連番、通常は 00 〜 02)。
5.  `make clean; make` する。

3, 4 についてはスクリプトを用意している。

    safari/prepare_sign.sh hoge.safariextz Certificates.p12
