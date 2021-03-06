pixplus version history
=======================

## [1.19.3 - 2018/03/11](http://crckyl.hatenablog.com/entry/2018/03/11/pixplus_1.19.3)

### 変更点

* [修正] 完全に動かなくなっていたのをとりあえず直した。

### Changes

* [Fix] Quick fix for the problem that pixplus was completely broken.

## [1.19.2 - 2017/09/07](http://crckyl.hatenablog.com/entry/2017/09/07/pixplus_1.19.2)

### 変更点

* [修正] アンケート機能を再実装。
* [修正] 作者欄が壊れていたのを修正。
* [修正] 設定ボタンを修正。

### Changes

* [Fix] New implementation for pixiv's voting feature.
* [Fix] Fix author informations area.
* [Fix] Fix preferences button.

## [1.19.1 - 2017/04/30](http://crckyl.hatenablog.com/entry/2017/04/30/pixplus_1.19.1)

### 変更点

* [修正] 「いいね！」をサポート。

### Changes

* [Fix] Support 'Like'

## [1.19.0 - 2017/04/19](http://crckyl.hatenablog.com/entry/2017/04/19/pixplus_1.19.0)

### 変更点

* [修正] 'https:'から始まるpixivの新しいURLに対応。
* [削除] 一時的に評価機能を削除。

### Changes

* [Fix] Support for new pixiv's URL that starts with 'https:'.
* [Remove] Temporary disable the rating feature.

## [1.18.1 - 2017/03/23](http://crckyl.hatenablog.com/entry/2017/03/23/pixplus_1.18.1)

### 変更点

* [修正] 「プロフィールカードのポップアップを無効化する」オプションが動かないことがあるバグを修正。
* [修正] 複数ページ作品で稀にエラーが出る不具合を修正。
* [修正] タグ編集機能が動かなくなっていた不具合を修正。
* [修正] pixivのワンクリックブックマーク機能に対応。
* [変更] UIデザインを改善。

### Changes

* [Fix] Sometimes 'Disable profile card popup' option doesn't works.
* [Fix] pixplus rarely reports errors with multi-page works.
* [Fix] Tag editor was not working.
* [Fix] Support for pixiv's one-click bookmark feature.
* [Change] Improve UI design.

## [1.18.0 - 2017/03/05](http://crckyl.hatenablog.com/entry/2017/03/05/pixplus_1.18.0)

### 変更点

* [追加] コメント投稿機能を再実装。

### Changes

* [Add] Re-implement comment posting feature.

## [1.17.0 - 2017/01/25](http://crckyl.hatenablog.com/entry/2017/01/25/pixplus_1.17.0)

### 変更点

* [追加] ポップアップの最小サイズを指定するオプションを追加。
* [追加] 「プロフィールカードのポップアップを無効化する」オプションを再実装。
* [修正] サムネイルメニューをクリックしてもポップアップが開いてしまう不具合を修正。
* [修正] ユーザー自身による作品をポップアップで開けないバグを修正。

### Changes

* [Add] Add an option to specify minimum size of popup.
* [Add] Re-implement 'Disable profile card popup' option.
* [Fix] Fix an issue that thumbnail-menu opens popup.
* [Fix] Fix an issue that pixplus never stops loading when opening user's own works.

## [1.16.0 - 2017/01/22](http://crckyl.hatenablog.com/entry/2017/01/22/pixplus_1.16.0)

### 変更点

* [削除] 「プロフィールカードのポップアップを無効化する」オプションを削除。
* [削除] コメント投稿機能を削除。
* [修正] 評価機能が動かなくなっていた不具合を修正。
* [修正] ブックマークモードが動かなくなっていた不具合を修正。
* [修正] タグ編集モードが動かなくなっていた不具合を修正。
* [修正] アンケート機能が動かなくなっていた不具合を修正。

### Changes

* [Remove] Remove 'Disable profile card popup' option.
* [Remove] Remove posting comment feature.
* [Fix] Rating feature was not working.
* [Fix] Bookmark mode was not working.
* [Fix] Tag edit mode was not working.
* [Fix] Fix support of polling feature.

## [1.15.2 - 2016/09/17](http://crckyl.hatenablog.com/entry/2016/09/17/pixplus_1.15.2)

### 変更点

* [修正][Opera12] Opera12で矢印ボタンの動作がおかしかったのを修正。

### Changes

* [Fix][Opera12] Fix the behavior of arrow buttons on Opera12.

## [1.15.1 - 2016/08/26](http://crckyl.hatenablog.com/entry/2016/08/26/pixplus_1.15.1)

### 変更点

* [修正] マンガページ内で設定ダイアログのレイアウトが壊れていた不具合を修正。
* [修正] 「pixivコミックアイコンを除去する」オプションが機能しなくなっていた不具合を修正。

### Changes

* [Fix] Preference dialog on manga page was broken.
* [Fix] 'Remove pixiv comic icon' option was broken.

## [1.15.0 - 2015/08/02](http://crckyl.hatenablog.com/entry/2015/08/02/pixplus_1.15.0)

### 変更点

* [追加] プロフィールカードのポップアップを無効化するオプションを追加(全般タブ)。
* [修正] 作者アイコンのバッジが表示されなくなっていた不具合を修正。
* [修正] 稀にマンガモードが勝手に終了するバグを修正。
* [修正] パフォーマンスを改善。

### Changes

* [Add] Added an option to disable profile card popup (in the 'Genral' tab).
* [Fix] Author icon badges were broken.
* [Fix] Rarely manga mode ends unexpectedly.
* [Fix] Improve performance.

## [1.14.0 - 2015/05/28](http://crckyl.hatenablog.com/entry/2015/05/28/pixplus_1.14.0)

### 変更点

* [追加] APNGジェネレータを追加。
* [追加] pixivスポットライトページに対応。
* [修正] 可能ならMutationObserverを使用するように変更。(Firefoxで警告が出なくなった)
* [変更] ブックフォーマットのレイアウトを改善。
* [変更] コメント欄のレイアウトを改善。(余白を狭く)
* [変更][Opera12] Presto Operaのサポートを改善。

### Changes

* [Add] Add APNG generator.
* [Add] Support for pixiv spotlight.
* [Fix] Start using MutationObserver. (MutationEvents warnings disappeared on Firefox)
* [Change] Improve page layout of Book-format works.
* [Change] Improve comment area layout. (make white spaces narrow)
* [Change][Opera12] Improve Presto Opera support.

## [1.13.4 - 2015/01/01](http://crckyl.hatenablog.com/entry/2015/01/01/pixplus_1.13.4)

### 変更点

* [修正] 非常に縦・横に長いイラストに対して「原寸の画像を表示する」オプションが機能していなかった不具合を修正。
* [修正] 単ページのマンガ作品に対して「原寸の画像を表示する」オプションが機能していなかった不具合を修正。

### Changes

* [Fix] The "Use original size image" option was not working for vertically/horizontally long illust works.
* [Fix] The "Use original size image" option was not working for single page manga works.

## [1.13.3 - 2014/12/20](http://crckyl.hatenablog.com/entry/2014/12/20/pixplus_1.13.3)

### 変更点

* [修正] 古い作品でエラーになる不具合を修正。
* [修正] 「原寸の画像を表示する」オプションが動かなくなっていた不具合を修正。

### Changes

* [Fix] Popup window reports an error for old works.
* [Fix] "Use original size image" option was not working.

## [1.13.2 - 2014/12/14](http://crckyl.hatenablog.com/entry/2014/12/14/pixplus_1.13.2)

### 変更点

* [修正] コメントモード(Shift+c)が動かなくなっていた不具合を修正。

### Changes

* [Fix] Fix comment mode (Shift+c) was not working.

## [1.13.1 - 2014/10/19](http://crckyl.hatenablog.com/entry/2014/10/19/pixplus_1.13.1)

### 変更点

* [修正] Safari 5/6でポップアップが動作しなくなっていたバグを修正。

### Changes

* [Fix] Fix popup was broken on Safari 5/6.

## [1.13.0 - 2014/10/10](http://crckyl.hatenablog.com/entry/2014/10/10/pixplus_1.13.0)

### 変更点

* [変更] 複数ページ作品の扉ページを表示した際のデザインを変更。
* [修正] 「原寸の画像を表示する」オプションの動作が「ブック」に対して逆になっていた不具合を修正。
* [修正] スタックフィード、地域ランキング、マイページ(ランキングペイン)でポップアップが表示されない不具合を修正。
* [削除] 「再投稿」表示を削除。

### Changes

* [Change] Change design of frontpage of multi-page works.
* [Fix] Fix "Use original size image" setting is inverted for "book" type works.
* [Fix] Fix support for staccfeed, area-ranking and mypage (ranking pane).
* [Remove] Remove repost display.

## [1.12.3 - 2014/10/01](http://crckyl.hatenablog.com/entry/2014/10/01/pixplus_1.12.3)

### 変更点

* [修正] ブック形式機能をサポート。

### Changes

* [Fix] Support for pixiv's new "book" feature.

## [1.12.1 - 2014/09/27](http://crckyl.hatenablog.com/entry/2014/09/27/pixplus_1.12.1)

### 変更点

* [修正] pixivの変更に対応。
* [修正] ブックマークモードがうまく動作しなくなっていた不具合を修正。
* [修正] GreaseMonkey の自動アップデートが壊れていた不具合を修正。

### Changes

* [Fix] Follow pixiv's changes.
* [Fix] Fix bookmark mode was broken.
* [Fix] Fix GreaseMonkey auto update.

## [1.12.0 - 2014/09/04](http://crckyl.hatenablog.com/entry/2014/09/04/pixplus_1.12.0)

### 変更点

* [追加] 「既に読んだマンガは自動でマンガモードを開始しない」設定を追加。
* [修正] ブックマークモードが正しく動作しなくなっていた不具合を修正。
* [修正] コメントフォームが動作しなくなっていた不具合を修正。
* [削除] トップページのレイアウトの履歴を管理する機能を削除。

### Changes

* [Add] Add "Do not start manga mode automatically if you have already read it" setting.
* [Fix] Fix bookmark mode is not working properly.
* [Fix] Fix comment form was broken.
* [Remove] Remove mypage layout history manager.

## [1.11.0 - 2014/06/28](http://crckyl.hatenablog.com/entry/2014/06/28/pixplus_1.11.0)

### 変更点

* [追加] BOOTHアイコンを除去する設定を追加。
* [修正] うごイラをサポート。

### Changes

* [Add] Add setting to remove BOOTH icon.
* [Fix] Support for Ugoira.

## [1.10.0 - 2014/05/06](http://crckyl.hatenablog.com/entry/2014/05/06/203423)

### 変更点

* [追加] 「漫画作品のページでポップアップを開く」オプションを追加。
* [修正] キーイベントの処理を修正。
* [修正] 「スタンプのコメントを非表示にする」オプションが動作しなくなっていた不具合を修正。
* [修正] コメントの絵文字をサポート。

### Changes

* [Add] Add "Open popup in manga page" option.
* [Fix] Fix key event handling.
* [Fix] Fix "Hide stamp comments" option.
* [Fix] Support emoji comment.

## [1.9.0 - 2014/02/21](http://crckyl.hatenablog.com/entry/2014/02/21/130255)

### 変更点

* [追加] 「スタンプのコメントを非表示にする」オプションを追加。
* [修正] ランキングページのサポートを修正。
* [修正] 新しいコメントUIをサポート。
* [修正] 設定ボタンが表示されなくなっていた不具合を修正。

### Changes

* [Add] Add "Hide stamp comments" option.
* [Fix] Fix ranking page support.
* [Fix] Support new comment UI.
* [Fix] Configuration button doesn't appears.

## [1.8.1 - 2013/08/14](http://crckyl.hatenablog.com/entry/2013/08/14/100851)

### 変更点

* [修正] ブックマークモードでタグを選択できない場合があるバグを修正。
* [修正] マンガモードで"w"キーが上手く動かないバグを修正。

### Changes

* [Fix] Fix tag selection in bookmark mode.
* [Fix] Fix "w" key reloads illust when in manga mode.

## [1.8.0 - 2013/08/07](http://crckyl.hatenablog.com/entry/2013/08/07/110857)

### 変更点

* [追加] 「リンクを訪問済みにする」オプションを追加。
* [追加] 「PageUp/PageDownのスクロール幅」オプションを追加。
* [追加] 「おすすめユーザー」ページに対応。
* [変更] 「原寸の画像を表示する」オプションが無効になっているとき、"w"キーで原寸の画像に切り替えるように変更。
* [修正] ESCキーが動作していなかった不具合を修正。
* [修正] Shift+Vキー(マンガサムネイルページを開く)が動作していなかった不具合を修正。
* [修正] イメージレスポンスの処理を修正。
* [修正] アクセス制限が設定されているイラストを開けない不具合を修正。
* [修正][Firefox] Firefox23でキー操作できない不具合を修正。

### Changes

* [Add] Add "Mark link as visited" option.
* [Add] Add "Scroll step for PageUp/PageDown" option.
* [Add] Support "Suggested Users" page.
* [Change] Try to load big image by "w" key if "original size image" option is disabled.
* [Fix] ESC key is not working.
* [Fix] Shift+V key (open manga thumbnail page) is not working.
* [Fix] Image response support.
* [Fix] Can't view access restricted illust.
* [Fix][Firefox] Some keys are not working on Firefox23.

## [1.7.1 - 2013/06/26](http://crckyl.hatenablog.com/entry/2013/06/26/120605)

### 変更点

* [修正][Chrome] Greasemonkey版がChrome上で動作しないバグを修正。

### Changes

* [Fix][Chrome] Greasemonkey version(.user.js) is not working on Chrome.

## [1.7.0 - 2013/06/25](http://crckyl.hatenablog.com/entry/2013/06/25/110601)

### 変更点

* 起動を高速化。
* [追加] 「検索オプション」ダイアログにいくつかのオプションを追加する機能を追加。
* [削除] 「スタックフィード」のリンク先を変更するオプションを削除。
* [削除] 「タグリストのセパレータのスタイル」オプションを削除。
* [修正] マンガモードが動作しなくなっていた不具合を修正。
* [修正][Firefox] Firefox ESR 17でブックマークモードが動作していなかったバグを修正。

### Changes

* Improve boot performance.
* [Add] Added some features that extends "Advanced Search" dialog.
* [Remove] Remove "Change 'Stacc feed' link" option.
* [Remove] Remove "Separator style for tag list" option.
* [Fix] Fix manga mode always reports error.
* [Fix][Firefox] Fix bookmark mode is not working on Firefox ESR 17

## [1.6.3 - 2013/05/26](http://crckyl.hatenablog.com/entry/2013/05/25/210523)

### 変更点

* [修正] 新しいブックマークページをサポート。

### Changes

* [Fix] Support new bookmark page.

## [1.6.2 - 2013/05/18](http://crckyl.hatenablog.com/entry/2013/05/18/070549)

### 変更点

* [修正] 作者のステータスアイコンが表示されなくなっていた不具合を修正。
* [修正] ブックマークしてもブックマークボタンの表示が変化しない不具合を修正。
* [修正] Firefox21で読み込みエラーが発生する不具合を修正。

### Changes

* [Fix] Fix author status icon.
* [Fix] Bookmark button is always inactive, even though it is bookmarked.
* [Fix] Fix loading error on Firefox21

## [1.6.1 - 2013/03/13](http://crckyl.hatenablog.com/entry/2013/03/13/100325)

### 変更点

* [変更] 移動用クリックインターフェースのデザインを変更。
* [修正] pixivの変更に対応。

### Changes

* [Change] Change "Click area" design.
* [Fix] Minor fix for pixiv's change.

## [1.6.0 - 2013/02/23](http://crckyl.hatenablog.com/entry/2013/02/23/100201)

### 変更点

* [追加] リサイズモードの設定とキーバインドを追加。
* [修正] ポップアップに作者が表示されなくなっていた不具合を修正。

### Changes

* [Add] Add resize mode settings and key bindings.
* [Fix] Fix author does not shown properly in popup.

## [1.5.0 - 2013/02/10](http://crckyl.hatenablog.com/entry/2013/02/09/210216)

### 変更点

* [追加] トップページのレイアウトの変更履歴を管理する機能を追加。
* [修正][エクステンション] 「全般」セクションの設定が保存されないバグを修正。

### Changes

* [Add] Add top-page layout history manager.
* [Fix][Extension] Fix can't save settings in General section.

## [1.4.0 - 2013/02/02](http://crckyl.hatenablog.com/entry/2013/02/02/120229)

### 変更点

* [追加] ブックマークモードにタグを関連付けるUIを追加。
* [修正] ポップアップに作者が表示されなくなっていた不具合を修正。
* [修正] ポップアップでコメントが閲覧出来なくなっていた不具合を修正。
* [修正] お気に入りユーザーの追加をワンクリックで行う設定が動作していなかった不具合を修正。

### Changes

* [Add] Add tag association ui to bookmark mode.
* [Fix] Fix author does not shown properly in popup.
* [Fix] Fix comment view in popup.
* [Fix] Fix "Add favorite user by one-click" is not working.

## [1.3.0 - 2012/12/16](http://crckyl.hatenablog.com/entry/2012/12/16/041240)

### 変更点

* [追加] pixivコミックアイコンを除去するオプションを追加。
* [変更] ブックマークモードのレイアウトを改善。
* [変更] ブックマークモードのキー操作を改善。
* [変更] タグ編集モードのレイアウトを改善。
* [修正] タグ編集モードが動かなくなっていた不具合を修正。
* [修正] UserJS/Greasemonkey版で設定画面を開けなくなっていた不具合を修正。

### Changes

* [Add] Add option to remove pixiv comic icon.
* [Change] Improve bookmark mode layout.
* [Change] Improve key navigation feature in bookmark mode.
* [Change] Improve tag edit mode layout.
* [Fix] Fix tag edit mode is not working.
* [Fix] Can not open preferences in UserJS/Greasemonkey version.

## [1.2.2 - 2012/12/06](http://crckyl.hatenablog.com/entry/2012/12/06/101212)

### 変更点

* [修正] マンガのレイアウトが崩れるバグを修正。
* [修正] タグリストのレイアウトを修正。
* [修正] アクセスが制限された作品を閲覧出来ないバグを修正。
* [修正] イラストにタグが登録されていない時に表示が壊れる不具合を修正。

### Changes

* [Fix] Fix manga layout is broken.
* [Fix] Fix tag list layout.
* [Fix] Fix fail to load access-restricted illust.
* [Fix] Fix broken tag list with no tags.

## [1.2.1 - 2012/09/29](http://crckyl.hatenablog.com/entry/2012/09/29/050955)

### 変更点

* [修正] pixivの変更に対応。

### Changes

* [Fix] Minor fix for pixiv's update.

## [1.2.0 - 2012/08/27](http://crckyl.hatenablog.com/entry/2012/08/27/100841)

### 変更点

* [追加] "jump.phpをリダイレクトする"設定を追加。
* [修正] DOM3EventのControlキーサポートを修正。
* [修正] 自動マンガモードの挙動を改善。
* [修正] 「新しいスタックフィード」をサポート。

### Changes

* [Add] Add "Redirect jump.php" setting.
* [Fix] Fix control key support for DOM3Events.
* [Fix] Improve auto-manga-mode feature.
* [Fix] Support "new Staccfeed" page.

## [1.1.1 - 2012/08/14](http://crckyl.hatenablog.com/entry/2012/08/14/070809)

### 変更点

* [修正] クリックナビゲーションのUIでヘッダ領域が隠れてしまうバグを修正。
* [修正] "移動方向を反対にする"設定がマンガモードにも適用されていたバグを修正。
* [修正] "原寸の画像を表示する"が有効になっていると古いマンガ作品を閲覧出来ないバグを修正。
* [修正] スタックフィードページでブックマークの追加・編集が出来ないバグを修正。
* [変更] いくつかの設定項目のデフォルト値を変更。
* [修正][WebKit] ロード中のステータス表示のレイアウトが変になるのを修正。

### Changes

* [Fix] Header area hidden by click navigator.
* [Fix] "Reverse" setting applied in manga mode.
* [Fix] Can't read old manga if "Use original size image" is enabled.
* [Fix] Can't add or modify bookmark in staccfeed page.
* [Change] Change default value for some preferences.
* [Fix][WebKit] Status field layout is broken while loading.

## [1.1.0 - 2012/08/09](http://crckyl.hatenablog.com/entry/2012/08/09/100814)

### 変更点

* [追加] キャプション内のリンクからポップアップを開く機能を追加。
* [追加] タグ編集機能を追加。
* [修正] イラストページ内のイメージレスポンス一覧からポップアップが開かないバグを修正。
* [修正] エラー処理を改善。
* [修正] タイトルとユーザー名にHTMLエンティティが表示されていたバグを修正。
* [修正] ブックマークモードの時に他のイラストに移動出来ないバグを修正。
* [修正] 他細かなバグ修正。
* [修正][Firefox] 「イラストを評価する時に確認をとる」オプションを有効にしていると評価できないバグを修正。
* [修正][Firefox] ランキングページでポップアップが開かないバグを修正。

### Changes

* [Add] Open popup from illust link in caption(author comment).
* [Add] Add tag edit mode.
* [Fix] Don't open popup from image-response list in illust page.
* [Fix] Improve error handling.
* [Fix] Displaying html entity in title and author name.
* [Fix] Can' t move to another illust when in bookmark mode.
* [Fix] Various minor bug fixes.
* [Fix][Firefox] Can't send rating if "Show confirmation dialog when rating" option is on.
* [Fix][Firefox] Popup don't works on ranking page.

## [1.0.0 - 2012/08/08](http://crckyl.hatenablog.com/entry/2012/08/08/140851)

### 変更点

* 全体的に書き直し。
* [追加] キャプションの高さの最小値を指定する設定を追加。
* [削除] タグ編集機能を削除。
* [削除] 機能しなくなっていたいくつかの設定項目を削除。
* [削除] ズーム機能を削除。
* [修正] 多言語サポートを修正。

### Changes

* Rewrite whole of source code.
* [Add] Add preference to specify minimum height of caption area.
* [Remove] Remove tag edit feature.
* [Remove] Remove some dead preferences.
* [Remove] Remove zoom feature.
* [Fix] Fix multilingual support.

## [0.9.4 - 2012/08/05](http://crckyl.hatenablog.com/entry/2012/08/05/010838)

### 変更点

* [修正] 評価機能が動かなくなっていたのを修正。

### Changes

* [Fix] Rating feature don't works.

## [0.9.3 - 2012/08/03](http://crckyl.hatenablog.com/entry/2012/08/03/120844)

### 変更点

* [修正] pixivの仕様変更に対応。

### Changes

* [Fix] Support pixiv's update.

## [0.9.2 - 2012/06/29](http://crckyl.hatenablog.com/entry/2012/06/29/100651)

### 変更点

* [修正] conf.popup.big\_image=0の時、"S"キー(conf.key.popup\_open\_big)でmediumの画像を開いていたバグを修正。

### Changes

* [Fix] If conf.popup.big\_image=0, "S" key (conf.key.popup\_open\_big) opens medium image.

## [0.9.1 - 2012/06/26](http://crckyl.hatenablog.com/entry/2012/06/25/210620)

### 変更点

* [修正] pixivの仕様変更に対応。
* [修正] イラストが再投稿されている場合に古い画像を表示していたバグを修正。

### Changes

* [Fix] Corresponds to pixiv's spec changes.
* [Fix] In reposted illust, pixplus shows first version.

## [0.9.0 - 2012/02/17](http://crckyl.hatenablog.com/entry/2012/02/17/100206)

### 変更点

* [追加] マウスホイールの動作を変更する設定(conf.popup.mouse\_wheel)を追加。
* [修正] キャプション内の外部リンクが壊れていたのを修正。

### Changes

* [New] Added a setting to change mouse wheel operation. (conf.popup.mouse\_wheel)
* [Fix] External links in author comment were broken.

## [0.8.3 - 2012/02/11](http://crckyl.hatenablog.com/entry/2012/02/11/150242)

* 新着イラストページで上手く動作しなくなっていた不具合を修正。
* スタックフィードで上手く動作しなくなっていた不具合を修正。
* タグリストのフロート表示の動作を修正。

## [0.8.2 - 2011/10/27](http://crckyl.hatenablog.com/entry/2011/10/27/111054)

* アンケートに回答するとエラーダイアログが出るようになっていた不具合を修正。
* トップページ(mypage.php)で上手く動作しなくなっていた不具合を修正。

## [0.8.1 - 2011/09/17](http://crckyl.hatenablog.com/entry/2011/09/17/010931)

* pixivの変更でアンケートなどの動作がおかしくなっていた不具合を修正。
* conf.key.popup\_manga\_open\_pageのデフォルト値が変だったバグを修正。

## [0.8.0 - 2011/09/03](http://crckyl.hatenablog.com/entry/2011/09/03/010924)

* ブックマーク管理ページで、閲覧出来なくなったイラストに一括でチェックを入れる機能を追加。
* コメントを投稿するとコメントフォームが消えてしまうバグを修正。
* ブックマークフォームでエラーが出るようになっていた不具合を修正。
* 言語サポートを改善。
* AutoPatchWork等のサポートを改善。

## [0.7.0 - 2011/08/21](http://crckyl.hatenablog.com/entry/2011/08/21/110824)

* ランキングページにおいてAutoPatchWorkなどで継ぎ足した二ページ目以降の画像が表示されないのを是正する機能を追加。
* おすすめイラストをページの右側に表示する機能(conf.locate\_recommend\_right)を削除。
* 地域ランキング(/ranking\_area.php)の新デザインに対応。

## [0.6.3 - 2011/07/24](http://crckyl.hatenablog.com/entry/2011/07/24/100702)

* スタックフィードでブックマークしようとするとエラーが出るバグを修正。
* 「スライドモード」設定の時、マンガを閲覧出来ない不具合を修正。
* ランキングで上手く動作しなくなっていた不具合を修正。

## [0.6.2 - 2011/06/26](http://crckyl.hatenablog.com/entry/2011/06/26/010657)

* 設定画面へのリンクが表示されなくなっていた不具合を修正。
* イベントの特設ページ(e.g. /event\_starfestival2011.php)で動作していなかった不具合を修正。

## [0.6.1 - 2011/05/21](http://crckyl.hatenablog.com/entry/2011/05/21/030509)

* Opera10.1xで動作しなくなっていたバグを修正。
* タグ検索(ex. /tags.php?tag=pixiv)で動作しなくなっていた不具合を修正。
* エラー表示の動作が変だったバグを修正。
* conf.popup\_ranking\_logを削除。
* 新着ページで動作しなくなっていた不具合を修正。
* conf.locate\_recommend\_rightが動作しなくなっていた不具合を修正。

## [0.6.0 - 2011/05/13](http://crckyl.hatenablog.com/entry/2011/05/13/120515)

* キーバインドのカスタマイズ機能を追加。
* イラストページでブックマークの処理が動作していなかった不具合を修正。
* ライセンスをApache License 2.0に変更。
* Webkitでブックマークフォームの表示が変だった不具合を修正。
* トップページのレイアウトをバックアップする機能を追加(復活)。
* Chromeでセンタークリックにも反応していたバグを修正。
* Webkitでのキー操作を改善。
* ブックマークフォームなどの動作が変になってた不具合を修正。
* 検索ページで動かなくなっていた不具合を修正。

## [0.5.1 - 2011/03/26](http://crckyl.hatenablog.com/entry/2011/03/26/010347)

* おすすめイラストが非表示の時もconf.locate\_recommend\_rightが動作してしまうバグを修正。
* conf.extageditを廃止してconf.bookmark\_formに変更。
* pixivの言語設定が日本語以外の時にマンガが閲覧できなかった不具合を修正。
* マンガの見開き表示を修正。
* Firefox4でブックマーク編集画面でタグを選択できなくなっていたバグを修正。
* ブックマーク済みのイラストでブックマークボタンが表示されなくなっていた不具合を修正。

## [0.5.0 - 2011/02/15](http://crckyl.hatenablog.com/entry/2011/02/15/110202)

* conf.extensionを廃止。Opera拡張版のツールバーアイコンを削除。
* Firefoxでコメント表示機能が動作していなかったバグを修正。
* Firefoxでブックマーク編集フォームでアローキーでタグ選択を行う時に入力履歴が表示される不具合を修正。
* ポップアップのタグ編集のUIをブックマーク編集と同じに変更。
* ポップアップでブックマーク編集モードのまま他のイラストに移動するとキャプションが表示されなくなるバグを修正。
* マンガモードでも可能なら原寸の画像を使用するように変更。
* メンバーイラストページなどを開いた時に評価などが出来ない場合があるバグを修正。
* 設定画面のデザインを変更。
* Opera10.1xでポップアップを開いた時に画像が表示されないバグを修正。
* 小説ページで評価できなかったバグを修正。
* conf.expand\_novelを削除。
* 他ユーザーのブックマークページで動かなくなってたのを修正。

## [0.4.0 - 2011/02/04](http://crckyl.hatenablog.com/entry/2011/02/04/130234)

* pixivreaderと衝突するらしいので、excludeに追加。
* 設定まわりを作り直し。Chrome/Safari拡張版にオプションページ追加。設定が引き継がれない。
* OperaExtension版で動作しない場合があるバグをたぶん修正。
* 閲覧できないマンガがあったバグを修正。
* ズーム機能でFirefoxをサポート。
* 企画目録関連ページに対応。
* マンガページの変更(見開き表示など)に対応。それに伴ってconf.default\_manga\_typeとconf.popup\_manga\_tbを削除。
* 作品管理ページで動作しなくなっていた不具合を修正。
* Chrome/SafariでAutoPatchWorkに対応。

## [0.3.2 - 2011/01/15](http://crckyl.hatenablog.com/entry/2011/01/14/150150)

* ブックマーク管理ページで上手く動作していなかった不具合を修正。

## [0.3.1 - 2011/01/14](http://crckyl.hatenablog.com/entry/2011/01/14/090139)

* Opera以外のブラウザにおいて一部のページで評価やコメント表示などの機能の動作が変だったバグを修正。
* conf.popup.rate\_key=trueの時、Shiftキーなしで評価できていたバグを修正。
* ChromeExtension/SafariExtension版で自動アップデートに対応。
* OperaExtension版のオプションページで数値がNaNになる場合があるバグをたぶん修正。

## [0.3.0 - 2010/12/26](http://crckyl.hatenablog.com/entry/2010/12/26/011246)

* conf.fast\_user\_bookmark追加。
* プロフィール画像の左上にアイコン(チェック:お気に入り/ハート:相互/旗:マイピク)を表示する機能(conf.popup.author\_status\_icon)追加。
* コメント表示機能を追加。
* アンケート結果の表示を変更。
* 閲覧・評価・コメント履歴ページに対応。
* キーバインドを変更。Shift+c:コメント表示/d:アンケート/a:戻る
* ポップアップのイベントAPIをPopup.on\*のみに変更。
* conf.expand\_novel追加。
* ランキングカレンダーに対応。conf.popup\_ranking\_log追加。
* イベント詳細/参加者ページに対応。
* Extension版にツールバーボタンと設定画面を追加。conf.extension.\*追加。
* タグの並べ替えを設定していない時、ブックマーク編集の動作がおかしかった不具合を修正。

## [0.2.0 - 2010/12/01](http://crckyl.hatenablog.com/entry/2010/12/01/091212)

* Extension版でアンケートに答えられなくなっていたバグを修正。
* トップページのレイアウトをバックアップする機能追加。
* Extension版の自動アップデートに対応。
* 上下キーでキャプションをスクロールするように変更。conf.popup.scroll\_height追加。
* 画像を拡大/縮小するキーをo/iから+/-に変更。
* dキー(前のイラストに戻る)をキーバインドに追加。

## [0.1.2 - 2010/11/14](http://crckyl.hatenablog.com/entry/2010/11/14/141112)

* 一部のページでアンケート結果を表示出来なくなっていた不具合を修正。
* アンケートに答えた後、選択肢が表示されたままになっていたバグを修正。
* スタックフィード上で評価やタグ編集が出来なかったバグを修正。
* マウス操作用UIの表示を変更。
* conf.popup.overlay\_control追加。
* マンガページ(mode=manga)で改ページ出来なくなっていた不具合を修正。
* 評価出来なくなっていた不具合を修正。

## [0.1.1 - 2010/11/02](http://crckyl.hatenablog.com/entry/2010/11/02/091131)

* イベントページ(e.g. http://www.pixiv.net/event\_halloween2010.php)用の汎用コード追加。
* conf.locate\_recommend\_rightが2の時、上手く動作しない場合があるバグを修正。
* pixivの変更(評価、ランキング、etc)に対応。

## [0.1.0 - 2010/10/27](http://crckyl.hatenablog.com/entry/2010/10/27/121045)

* Opera11のExtensionに対応。
* ブックマーク管理ページでレコメンドを右側に並べる機能が動作しなくなっていたのを修正。
* AutoPatchWorkに対応。
