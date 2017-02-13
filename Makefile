SVG_TO_PNG                      = tools/svg_to_png.sh
SVG_TO_PNG_CMD                  = $(shell $(SVG_TO_PNG))
ZIP                             = zip
CRXMAKE                         = RUBYLIB=$(CURDIR)/ext/rubyzip/lib $(CURDIR)/ext/crxmake/bin/crxmake
XAR                             = $(CURDIR)/ext/xar/xar/src/xar
PYTHON                          = python
SCSS                            = RUBYLIB=$(CURDIR)/ext/sass/lib $(CURDIR)/ext/sass/bin/scss

ifeq ($(shell $(SVG_TO_PNG) >/dev/null && echo yes || echo no),no)
$(error Could not find svg converter command)
endif

ifeq ($(shell which $(PYTHON) >/dev/null 2>&1 && echo yes || echo no),no)
$(error python command not found)
endif

ifeq ($(shell $(SCSS) -v >/dev/null 2>&1 && echo yes || echo no),no)
$(error scss command not found; run `git submodule update --ini` first)
endif

STR2JSON                        = $(PYTHON) -c 'import sys,json;json.dump(sys.stdin.read().decode("utf-8"),sys.stdout)'
JSON2ASCII                      = $(PYTHON) -c 'import sys,json;json.dump(json.loads(sys.stdin.read().decode("utf-8")),sys.stdout)'

LICENSE                         = LICENSE.TXT
ICON_SVG                        = src/data/pixplus.svg
ICON_SMALL_SVG                  = src/data/pixplus_small.svg
CONFIG_JSON                     = src/data/config.json
CHANGELOG_JSON                  = src/data/changelog.json

BUILD_OEX                       = $(shell which "$(ZIP)" >/dev/null 2>&1 && echo yes || echo no)
BUILD_CRX                       = $(shell $(CRXMAKE) >/dev/null 2>&1 && echo yes || echo no)
# BUILD_SAFARIEXTZ                = $(shell test -x "$(XAR)" && $(XAR) --help 2>&1 | grep sign >/dev/null && echo yes || echo no)
BUILD_SAFARIEXTZ                = no

VERSION_DEV                     = $(shell $(PYTHON) tools/changelog.py dev_version < $(CHANGELOG_JSON))
VERSION_STABLE                  = $(shell $(PYTHON) tools/changelog.py stable_version < $(CHANGELOG_JSON))
WEBSITE                         = http://ccl4.info/pixplus/

BUILD_DIR                       = temp
BUILD_DIR_ICON                  = $(BUILD_DIR)/icons
BUILD_DIR_OEX                   = $(BUILD_DIR)/oex
BUILD_DIR_CRX                   = $(BUILD_DIR)/crx
BUILD_DIR_SAFARIEXTZ            = $(BUILD_DIR)/pixplus.safariextension

CHANGELOG_MD                    = changelog.md
RELEASE_ATOM                    = release.atom

DIST_DIR                        = dist
RELEASE_DIR                     = releases/$(VERSION_STABLE)
RELEASE_LATEST                  = releases/latest
OPERA_USERJS                    = $(DIST_DIR)/pixplus.js
GREASEMONKEY_JS                 = $(DIST_DIR)/pixplus.user.js
OEX                             = $(DIST_DIR)/pixplus.oex
CRX                             = $(DIST_DIR)/pixplus.crx
SAFARIEXTZ                      = $(DIST_DIR)/pixplus.safariextz

LIB_JS                          = $(BUILD_DIR)/lib.js
DATA_JS                         = $(BUILD_DIR)/data.js
ICON_SIZE_SMALL                 = 16 22 24
ICON_SIZE_BIG                   = 32 48 64 128
ICON_SIZE                       = $(ICON_SIZE_SMALL) $(ICON_SIZE_BIG)
ICON_FILES_SMALL                = $(ICON_SIZE_SMALL:%=$(BUILD_DIR_ICON)/%.png)
ICON_FILES_BIG                  = $(ICON_SIZE_BIG:%=$(BUILD_DIR_ICON)/%.png)
ICON_FILES                      = $(ICON_FILES_SMALL) $(ICON_FILES_BIG)
ICON_CONFIG_BTN_SVG             = $(BUILD_DIR_ICON)/config-button.svg
ICON_CONFIG_BTN_PNG             = $(BUILD_DIR_ICON)/config-button.png
CSS_ICON_NAMES                  =
CSS_ICON_FILES_PNG              = $(CSS_ICON_NAMES:%=$(BUILD_DIR_ICON)/%.png)
CSS_ICON_FILES_SCSS             = $(CSS_ICON_NAMES:%=$(BUILD_DIR_ICON)/%.scss) \
                                  $(BUILD_DIR_ICON)/config-button.scss \
                                  $(BUILD_DIR_ICON)/pixplus-24.scss
SVG_GEN_GEN                     = tools/svg_generator_generator.py
SVG_GEN_NAMES                   = pencil pencil-off cogwheel following heart \
                                  mypixiv ugoira multipage olc-arrow rating-error
SVG_GEN_FILES                   = $(SVG_GEN_NAMES:%=src/data/%.svg)
DIST_FILES                      = $(LICENSE) $(wildcard extension/*) $(LIB_JS) $(DATA_JS)

OEX_USERJS                      = $(BUILD_DIR_OEX)/includes/$(notdir $(OPERA_USERJS))
OEX_CONFIG_XML_IN               = opera/config.xml.in
OEX_CONFIG_XML                  = $(BUILD_DIR_OEX)/config.xml
OEX_ICON_DIR                    = icons
OEX_ICON_FILES                  = $(ICON_SIZE:%=$(BUILD_DIR_OEX)/$(OEX_ICON_DIR)/%.png)
OEX_DIST_FILES                  = $(addprefix $(BUILD_DIR_OEX)/,$(notdir $(DIST_FILES))) \
                                  $(OEX_USERJS) $(OEX_CONFIG_XML) $(OEX_ICON_FILES)

CRX_SIGN_KEY                    = chrome/sign/$(notdir $(CRX)).pem
CRX_MANIFEST_JSON_IN            = chrome/manifest.json.in
CRX_USERJS                      = $(BUILD_DIR_CRX)/$(notdir $(OPERA_USERJS))
CRX_MANIFEST_JSON               = $(BUILD_DIR_CRX)/manifest.json
CRX_ICON_DIR                    = icons
CRX_ICON_FILES                  = $(ICON_SIZE:%=$(BUILD_DIR_CRX)/$(CRX_ICON_DIR)/%.png)
CRX_DIST_FILES                  = $(addprefix $(BUILD_DIR_CRX)/,$(notdir $(DIST_FILES))) \
                                  $(CRX_USERJS) $(CRX_MANIFEST_JSON) $(CRX_ICON_FILES)

SAFARIEXTZ_CERTS                = $(sort $(wildcard safari/sign/cert??))
SAFARIEXTZ_SIGN_KEY             = safari/sign/key.pem
SAFARIEXTZ_INFO_PLIST_IN        = safari/Info.plist.in
SAFARIEXTZ_SETTINGS_PLIST_IN    = safari/Settings.plist.in
SAFARIEXTZ_USERJS               = $(BUILD_DIR_SAFARIEXTZ)/$(notdir $(OPERA_USERJS))
SAFARIEXTZ_INFO_PLIST           = $(BUILD_DIR_SAFARIEXTZ)/Info.plist
SAFARIEXTZ_SETTINGS_PLIST       = $(BUILD_DIR_SAFARIEXTZ)/Settings.plist
SAFARIEXTZ_ICON_FILES           = $(ICON_SIZE:%=$(BUILD_DIR_SAFARIEXTZ)/Icon-%.png)
SAFARIEXTZ_DIST_FILES           = $(addprefix $(BUILD_DIR_SAFARIEXTZ)/,$(notdir $(DIST_FILES))) \
                                  $(SAFARIEXTZ_USERJS) $(SAFARIEXTZ_INFO_PLIST) \
                                  $(SAFARIEXTZ_SETTINGS_PLIST) $(SAFARIEXTZ_ICON_FILES)

AUTOUPDATE_TARGETS              = chrome.xml opera.xml
AUTOUPDATE_FILES                = $(AUTOUPDATE_TARGETS:%=autoupdate/1/%)
AUTOUPDATE_GM                   = autoupdate/1/pixplus.user.js

RELEASE_TARGETS                 = $(OPERA_USERJS) $(GREASEMONKEY_JS)

ifeq ($(BUILD_OEX),yes)
RELEASE_TARGETS += $(OEX)
endif

ifeq ($(BUILD_CRX),yes)
RELEASE_TARGETS += $(CRX)
endif

ifeq ($(BUILD_SAFARIEXTZ),yes)
RELEASE_TARGETS += $(SAFARIEXTZ)
endif

ALL_TARGETS = $(AUTOUPDATE_FILES) $(AUTOUPDATE_GM) $(RELEASE_TARGETS)
RELEASE_FILES = $(RELEASE_TARGETS:$(DIST_DIR)/%=$(RELEASE_DIR)/%)

all: info $(ALL_TARGETS) changelog

info:
	@echo 'Version: $(VERSION_DEV)'
	@echo 'Website: $(WEBSITE)'
	@echo 'SVG rasterizer: $(SVG_TO_PNG_CMD)'
	@echo
	@echo '$(notdir $(OPERA_USERJS)):         yes'
	@echo '$(notdir $(OEX)):        $(BUILD_OEX)'
	@echo '$(notdir $(CRX)):        $(BUILD_CRX)'
	@echo '$(notdir $(SAFARIEXTZ)): $(BUILD_SAFARIEXTZ)'
	@echo

deps: $(XAR)

$(XAR):
	@cd ext/xar/xar && ./autogen.sh && $(MAKE)

release: $(RELEASE_FILES) $(RELEASE_LATEST) $(AUTOUPDATE_GM)

$(RELEASE_FILES): $(RELEASE_DIR)/%: $(DIST_DIR)/%
	@echo 'Copy: $< => $@'
	@mkdir -p $(dir $@)
	@cp $< $@

$(RELEASE_LATEST): $(RELEASE_DIR)
	@echo 'Copy: $< => $@'
	@rm -rf $@
	@cp -r $(RELEASE_DIR) $@

clean: clean-changelog
	@echo 'Cleaning'
	@rm -rf $(BUILD_DIR) $(DIST_DIR) $(AUTOUPDATE_FILES) $(AUTOUPDATE_GM)

# ================ Changelog ================

$(CHANGELOG_MD): $(CHANGELOG_JSON)
	@echo 'Generate: $@'
	@$(PYTHON) tools/changelog.py markdown < $< > $@

$(RELEASE_ATOM): $(CHANGELOG_JSON)
	@echo 'Generate: $@'
	@$(PYTHON) tools/changelog.py atom < $< > $@

changelog: $(CHANGELOG_MD) $(RELEASE_ATOM)

clean-changelog:
	@rm -f $(CHANGELOG_MD) $(RELEASE_ATOM)

# ================  ================

$(CSS_ICON_FILES_PNG): $(BUILD_DIR_ICON)/%.png: src/data/%.svg
	@echo 'Generate: $@'
	@mkdir -p $(dir $@)
	@$(SVG_TO_PNG) -svg $(CURDIR)/$< -png $(CURDIR)/$@

$(BUILD_DIR_ICON)/pixplus-24.png: $(BUILD_DIR_ICON)/24.png
	@echo 'Copy: $< => $@'
	@mkdir -p $(dir $@)
	@cp $< $@

$(CSS_ICON_FILES_SCSS): %.scss: %.png
	@echo 'Generate: $@'
	@mkdir -p $(dir $@)
	@/bin/echo -n '$$icon-$(shell echo $(basename $(notdir $@))):url("data:image/png;base64,' > $@
	@base64 -w 0 $< >> $@
	@echo '");' >> $@

$(ICON_CONFIG_BTN_SVG): $(ICON_SMALL_SVG)
	@echo 'Generate: $@'
	@mkdir -p $(dir $@)
	@sed 's/#0096db/#adc1d8/' $< > $@

$(ICON_CONFIG_BTN_PNG): $(ICON_CONFIG_BTN_SVG)
	@echo 'Generate: $@'
	@mkdir -p $(dir $@)
	@$(SVG_TO_PNG) -svg $(CURDIR)/$< -size 22 -png $(CURDIR)/$@

$(BUILD_DIR)/_lib.js: $(shell sed 's|^|src/lib/|' src/lib/files.txt)
	@echo 'Generate: $@'
	@mkdir -p $(dir $@)
	@echo '// generated from:' > $@
	@echo $^ | xargs -n 1 echo '//  ' >> $@
	@cat $^ >> $@

$(LIB_JS): $(BUILD_DIR)/_lib.js
	@echo 'Generate: $@'
	@mkdir -p $(dir $@)
	@echo '(function(g, w, d) {' >> $@
	@cat $^ >> $@
	@echo '})(this, this.window, this.window.document);' >> $@

$(BUILD_DIR)/_main.js: $(shell sed 's|^|src/main/|' src/main/files.txt)
	@echo 'Generate: $@'
	@mkdir -p $(dir $@)
	@echo '// generated from:' > $@
	@echo $^ | xargs -n 1 echo '//  ' >> $@
	@cat $^ >> $@

$(BUILD_DIR)/_data.js: src/data/config.json src/data/i18n.json src/data/i18n.js \
                       $(CHANGELOG_JSON) $(CSS_ICON_FILES_SCSS) \
                       $(wildcard src/data/styles/*.scss) \
                       $(SVG_GEN_FILES) $(SVG_GEN_GEN)
	@echo 'Generate: $@'
	@mkdir -p $(dir $@)
	@echo '// generated from:' > $@
	@echo $^ | xargs -n 1 echo '//  ' >> $@
	@/bin/echo -n '_.css=' >> $@
	@cat $(wildcard src/data/styles/*.scss) | $(SCSS) --style compressed -I $(BUILD_DIR_ICON) | $(STR2JSON) >> $@
	@echo ';'>> $@
	@/bin/echo -n '_.conf.__schema=' >> $@
	@$(JSON2ASCII) < src/data/config.json >> $@
	@echo ';'>> $@
	@/bin/echo -n '_.i18n=' >> $@
	@$(JSON2ASCII) < src/data/i18n.json >> $@
	@echo ';' >> $@
	@cat src/data/i18n.js >> $@
	@/bin/echo -n '_.changelog=' >> $@
	@$(JSON2ASCII) < $(CHANGELOG_JSON) >> $@
	@echo ';' >> $@
	@$(PYTHON) $(SVG_GEN_GEN) $(SVG_GEN_FILES) >> $@

$(DATA_JS): $(BUILD_DIR)/_data.js
	@echo 'Generate: $@'
	@mkdir -p $(dir $@)
	@echo '(function(g, w, d, _) {' >> $@
	@cat $^ >> $@
	@echo '})(this, this.window, this.window.document, this.window.pixplus);' >> $@

# ================ GreaseMonkey ================

$(GREASEMONKEY_JS): src/wrapper.js $(BUILD_DIR)/_lib.js $(BUILD_DIR)/_main.js $(BUILD_DIR)/_data.js
	@echo 'Generate: $@'
	@mkdir -p $(dir $@)
	@sed -e '/__SRC__/,$$d' -e 's/@VERSION@/$(VERSION_DEV)/' src/wrapper.js > $@
	@cat $(BUILD_DIR)/_lib.js $(BUILD_DIR)/_main.js $(BUILD_DIR)/_data.js >> $@
	@sed -e '1,/__SRC__/d' -e 's/@VERSION@/$(VERSION_DEV)/' src/wrapper.js >> $@

# ================ Opera UserJS ================

$(OPERA_USERJS): $(GREASEMONKEY_JS)
	@echo 'Generate: $@'
	@mkdir -p $(dir $@)
	@sed -e '/__OPERA_USERJS_REMOVE__/d' $< > $@

# ================ Extension common files ================

$(ICON_FILES_SMALL): $(ICON_SMALL_SVG)
	@echo 'Generate: $@'
	@mkdir -p $(dir $@)
	@$(SVG_TO_PNG) -svg $(CURDIR)/$< -size $(basename $(notdir $@)) -png $(CURDIR)/$@

$(ICON_FILES_BIG): $(ICON_SVG)
	@echo 'Generate: $@'
	@mkdir -p $(dir $@)
	@$(SVG_TO_PNG) -svg $(CURDIR)/$< -size $(basename $(notdir $@)) -png $(CURDIR)/$@

# ================ Opera ================

$(OEX_CONFIG_XML): $(OEX_CONFIG_XML_IN) $(CONFIG_JSON) $(CHANGELOG_JSON)
	@echo 'Generate: $@'
	@mkdir -p $(dir $@)
	@sed -e '/@LICENSE@/,$$d' \
             -e 's/@VERSION@/$(VERSION_DEV)/' \
             -e 's|@WEBSITE@|$(WEBSITE)|' \
           < $< > $@
	@echo '  <license>' >> $@
	@cat $(LICENSE) >> $@
	@echo '  </license>' >> $@
	@sed -e '1,/@LICENSE@/d' -e '/@ICONS@/,$$d' < $< >> $@
	@for size in $(ICON_SIZE); do echo "  <icon src=\"$(OEX_ICON_DIR)/$$size.png\" />" >> $@; done
	@sed -e '1,/@ICONS@/d' -e '/@CONFIG@/,$$d' < $< >> $@
	@$(PYTHON) tools/conf-parser.py opera < $(CONFIG_JSON) >> $@
	@sed -e '1,/@CONFIG@/d' < $< >> $@

$(OEX_USERJS): $(OPERA_USERJS)
	@echo 'Copy: $< => $@'
	@mkdir -p $(dir $@)
	@cp $< $@

.SECONDEXPANSION:
$(addprefix $(BUILD_DIR_OEX)/,$(notdir $(DIST_FILES))): \
  $$(filter $$(notdir $$@) %/$$(notdir $$@),$$(DIST_FILES))
	@echo 'Copy: $< => $@'
	@mkdir -p $(dir $@)
	@cp $< $@

$(OEX_ICON_FILES): $(BUILD_DIR_OEX)/$(OEX_ICON_DIR)/%: $(BUILD_DIR_ICON)/%
	@echo 'Copy: $< => $@'
	@mkdir -p $(dir $@)
	@cp $< $@

$(OEX): $(OEX_DIST_FILES)
	@echo 'Generate: $@'
	@cd $(BUILD_DIR_OEX) && $(ZIP) -qr $(CURDIR)/$@ *
	@echo

# ================ Chrome ================

$(CRX_MANIFEST_JSON): $(CRX_MANIFEST_JSON_IN) $(CHANGELOG_JSON)
	@echo 'Generate: $@'
	@sed -e '/@ICONS@/,$$d' \
             -e 's/@VERSION@/$(VERSION_DEV)/' \
           < $< | tr -d '\r' > $@
	@first=1;for size in $(ICON_SIZE); do \
           test $$first -eq 1 && first=0 || echo ',' >> $@; \
           /bin/echo -n "    \"$$size\": \"$(CRX_ICON_DIR)/$$size.png\"" >> $@; \
         done
	@echo >> $@;
	@sed -e '1,/@ICONS@/d' \
             -e 's/@VERSION@/$(VERSION_DEV)/' \
             -e 's|@WEBSITE@|$(WEBSITE)|' \
           < $< | tr -d '\r' >> $@

$(CRX_USERJS): $(OPERA_USERJS)
	@echo 'Copy: $< => $@'
	@mkdir -p $(dir $@)
	@cp $< $@


.SECONDEXPANSION:
$(addprefix $(BUILD_DIR_CRX)/,$(notdir $(DIST_FILES))): \
  $$(filter $$(notdir $$@) %/$$(notdir $$@),$$(DIST_FILES))
	@echo 'Copy: $< => $@'
	@mkdir -p $(dir $@)
	@cp $< $@

$(CRX_ICON_FILES): $(BUILD_DIR_CRX)/$(CRX_ICON_DIR)/%: $(BUILD_DIR_ICON)/%
	@echo 'Copy: $< => $@'
	@mkdir -p $(dir $@)
	@cp $< $@

$(CRX): $(CRX_DIST_FILES)
	@echo 'Generate: $@'
ifeq ($(wildcard $(CRX_SIGN_KEY)),)
	@echo 'Warning: $(CRX_SIGN_KEY) not found'
	@$(CRXMAKE) --pack-extension=$(BUILD_DIR_CRX) --extension-output=$@ --key-output=$(BUILD_DIR)/$(notdir $(CRX_SIGN_KEY))
else
	@$(CRXMAKE) --pack-extension=$(BUILD_DIR_CRX) --pack-extension-key=$(CRX_SIGN_KEY) --extension-output=$@
endif
	@echo

# ================ Safari ================

$(SAFARIEXTZ_INFO_PLIST): $(SAFARIEXTZ_INFO_PLIST_IN) $(CHANGELOG_JSON)
	@echo 'Generate: $@'
	@mkdir -p $(dir $@)
	@sed -e 's/@VERSION@/$(VERSION_DEV)/' \
             -e 's|@WEBSITE@|$(WEBSITE)|' \
           < $< > $@

$(SAFARIEXTZ_SETTINGS_PLIST): $(SAFARIEXTZ_SETTINGS_PLIST_IN) $(CONFIG_JSON)
	@echo 'Generate: $@'
	@mkdir -p $(dir $@)
	@sed -e '/__SETTINGS__/,$$d' < $< > $@
	@$(PYTHON) tools/conf-parser.py safari < $(CONFIG_JSON) >> $@
	@sed -e '1,/__SETTINGS__/d' < $< >> $@

$(SAFARIEXTZ_USERJS): $(OPERA_USERJS)
	@echo 'Copy: $< => $@'
	@mkdir -p $(dir $@)
	@cp $< $@

.SECONDEXPANSION:
$(addprefix $(BUILD_DIR_SAFARIEXTZ)/,$(notdir $(DIST_FILES))): \
  $$(filter $$(notdir $$@) %/$$(notdir $$@),$$(DIST_FILES))
	@echo 'Copy: $< => $@'
	@mkdir -p $(dir $@)
	@cp $< $@

$(SAFARIEXTZ_ICON_FILES): $(BUILD_DIR_SAFARIEXTZ)/Icon-%: $(BUILD_DIR_ICON)/%
	@echo 'Copy: $< => $@'
	@mkdir -p $(dir $@)
	@cp $< $@

$(SAFARIEXTZ): $(SAFARIEXTZ_DIST_FILES)
	@echo 'Generate: $@'
	@$(XAR) -C $(dir $(BUILD_DIR_SAFARIEXTZ)) --distribution -cf $@ $(notdir $(BUILD_DIR_SAFARIEXTZ))
ifeq ($(wildcard $(SAFARIEXTZ_SIGN_KEY)),)
	@echo 'Warning: $(SAFARIEXTZ_SIGN_KEY) not found'
else
	@echo 'Sign: $@'
	@: | openssl dgst -sign $(SAFARIEXTZ_SIGN_KEY) -binary | wc -c > $(BUILD_DIR)/siglen.txt
	@$(XAR) --sign -f $@ --digestinfo-to-sign $(BUILD_DIR)/digestinfo.dat \
           --sig-size `cat $(BUILD_DIR)/siglen.txt` $(SAFARIEXTZ_CERTS:%=--cert-loc %)
	@openssl rsautl -sign -inkey $(SAFARIEXTZ_SIGN_KEY) -in $(BUILD_DIR)/digestinfo.dat -out $(BUILD_DIR)/signature.dat
	@$(XAR) --inject-sig $(BUILD_DIR)/signature.dat -f $@ >/dev/null
endif
	@chmod 644 $@
	@echo

# ================ AutoUpdate ================

$(AUTOUPDATE_FILES): %: %.in $(CHANGELOG_JSON)
	@echo 'Generate: $@'
	@sed -e "s/@VERSION@/$(VERSION_STABLE)/g" < $< > $@

$(AUTOUPDATE_GM): $(RELEASE_LATEST)/$(notdir $(GREASEMONKEY_JS))
	@echo 'Copy: $< => $@'
	@mkdir -p $(dir $@)
	@cp $< $@
