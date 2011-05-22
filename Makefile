RSVG_CONVERT            = rsvg-convert
ZIP                     = zip
XAR                     = xar
JS                      = js
CHROME                  = $(shell ./find_chrome.sh)
OEX                     = pixplus.oex
CRX                     = pixplus.crx
SAFARIEXTZ              = pixplus.safariextz
XPI                     = pixplus.xpi
OEX_TMP_DIR             = .oex
CRX_TMP_DIR             = .crx
SAFARIEXTZ_TMP_DIR      = .safariextz
XPI_TMP_DIR             = .xpi
BUILD_OEX               = $(shell which "$(ZIP)" >/dev/null 2>&1 && echo yes || echo no)
BUILD_CRX               = $(shell which "$(CHROME)" >/dev/null 2>&1 && echo yes || echo no)
BUILD_SAFARIEXTZ        = $(shell which "$(XAR)" >/dev/null 2>&1 && $(XAR) --help 2>&1 | grep sign >/dev/null && echo yes || echo no)
BUILD_XPI               = $(shell which "$(ZIP)" >/dev/null 2>&1 && which "$(JS)" >/dev/null && echo yes || echo no)

LICENSE                 = LICENSE.TXT
CONFIG_JSON             = config.json
CONFIG_JS               = config.js
LIB_JS                  = lib.js
ICON_SVG                = pixplus.svg
ICON_SIZE               = 16 32 48 64
SRC_USERJS              = pixplus.js
DIST_FILES              = common.js index.html index.js options.html options.css options.js $(LIB_JS)

I18N_DIR                = i18n
I18N_LANGUAGES_FULL     = en-US ja-JP
I18N_LANGUAGES          = $(foreach l,$(I18N_LANGUAGES_FULL),$(firstword $(subst -, ,$(l))))
I18N_UPDATE             = $(I18N_DIR)/update.py
I18N_EDIT               = $(I18N_DIR)/edit.py
I18N_EDIT_HASH          = $(I18N_DIR)/edit_hash.py

VERSION                 = $(shell grep '^// @version' $(SRC_USERJS) | sed -e 's/.*@version *//')
DESCRIPTION             = $(shell grep '^// @description' $(SRC_USERJS) | sed -e 's/.*@description *//')
WEBSITE                 = http://crckyl.pa.land.to/pixplus/
WEBSITE_SED             = $(shell echo $(WEBSITE) | sed -e 's/\//\\\//g')

GREASEMONKEY_JS         = pixplus.user.js

OPERA_ROOT              = opera
OPERA_CONFIG_XML        = $(OPERA_ROOT)/config.xml
OPERA_ICON_DIR          = icons
OPERA_ICON_FILES        = $(ICON_SIZE:%=$(OPERA_ROOT)/$(OPERA_ICON_DIR)/%.png)
OPERA_I18N_SOURCES      = $(OPERA_ROOT)/includes/$(SRC_USERJS) $(OPERA_ROOT)/$(CONFIG_JS)
OPERA_I18N_FILES        = $(foreach l,$(I18N_LANGUAGES),$(OPERA_I18N_SOURCES:$(OPERA_ROOT)/%=$(OPERA_ROOT)/locales/$(l)/%))
OPERA_DIST_FILES        = $(OPERA_CONFIG_XML) $(OPERA_I18N_SOURCES) $(OPERA_ICON_FILES) \
                          $(DIST_FILES:%=$(OPERA_ROOT)/%) $(OPERA_I18N_FILES) $(LICENSE)

CHROME_ROOT             = chrome
CHROME_SIGN_KEY         = $(CHROME_ROOT)/sign/$(CRX:.crx=.crx.pem)
CHROME_MANIFEST_JSON    = $(CHROME_ROOT)/manifest.json
CHROME_ICON_DIR         = icons
CHROME_ICON_FILES       = $(ICON_SIZE:%=$(CHROME_ROOT)/$(CHROME_ICON_DIR)/%.png)
CHROME_I18N_FILES       = $(I18N_LANGUAGES:%=$(CHROME_ROOT)/_locales/%/messages.json)
CHROME_DIST_FILES       = $(CHROME_MANIFEST_JSON) $(CHROME_ROOT)/$(CONFIG_JS) $(CHROME_ROOT)/$(SRC_USERJS) \
                          $(CHROME_ICON_FILES) $(DIST_FILES:%=$(CHROME_ROOT)/%) $(CHROME_I18N_FILES) $(LICENSE)

SAFARI_ROOT             = safari/pixplus.safariextension
SAFARI_INFO_PLIST       = $(SAFARI_ROOT)/Info.plist
SAFARI_SETTINGS_PLIST   = $(SAFARI_ROOT)/Settings.plist
SAFARI_ICON_FILES       = $(ICON_SIZE:%=$(SAFARI_ROOT)/Icon-%.png)
SAFARI_CERTS            = $(patsubst %,$(SAFARI_ROOT)/sign/%,safari_cert.der safari_ca1.der safari_ca2.der)
SAFARI_SIGN_KEY         = $(SAFARI_ROOT)/sign/safari_key.pem
SAFARI_DIST_FILES       = $(SAFARI_INFO_PLIST) $(SAFARI_SETTINGS_PLIST) $(SAFARI_ROOT)/$(CONFIG_JS) \
                          $(SAFARI_ROOT)/$(SRC_USERJS) $(SAFARI_ICON_FILES) $(DIST_FILES:%=$(SAFARI_ROOT)/%) $(LICENSE)

FIREFOX_ROOT            = firefox
FIREFOX_INSTALL_RDF     = $(FIREFOX_ROOT)/install.rdf
FIREFOX_CHROME_MANIFEST = $(FIREFOX_ROOT)/chrome.manifest
FIREFOX_OVERLAY_XUL     = $(FIREFOX_ROOT)/content/pixplus.xul
FIREFOX_DEFAULTS_PREFS  = $(FIREFOX_ROOT)/defaults/preferences/pixplus.js
FIREFOX_OPTIONS_XUL     = $(FIREFOX_ROOT)/content/options.xul
FIREFOX_CONTENTS        = $(SRC_USERJS) $(CONFIG_JS) options.xul options.js tag_alias.xul tag_alias.js
FIREFOX_DEBUG_LOADER    = $(FIREFOX_ROOT)/pixplus@crckyl.ath.cx
FIREFOX_ICON_DIR        = content/icons
FIREFOX_ICON_FILES      = $(ICON_SIZE:%=$(FIREFOX_ROOT)/$(FIREFOX_ICON_DIR)/%.png)
FIREFOX_GEN_OPTIONS     = $(FIREFOX_ROOT)/gen_options.js
FIREFOX_I18N_FILES      = $(I18N_LANGUAGES_FULL:%=$(FIREFOX_ROOT)/locale/%/entities.dtd)
FIREFOX_DIST_FILES      = $(FIREFOX_INSTALL_RDF) $(FIREFOX_CHROME_MANIFEST) $(FIREFOX_OVERLAY_XUL) $(FIREFOX_DEFAULTS_PREFS) \
                          $(FIREFOX_CONTENTS:%=$(FIREFOX_ROOT)/content/%) $(FIREFOX_ICON_FILES) $(FIREFOX_I18N_FILES) $(LICENSE)

WARN_KEYWORDS_W         = location document jQuery rating_ef countup_rating send_quality_rating IllustRecommender \
                          Effect sendRequest getPageUrl
WARN_KEYWORDS_P         = $(shell cat prototypejs_funcs.txt)

ALL_TARGETS             = $(GREASEMONKEY_JS)

ifeq ($(BUILD_OEX),yes)
ALL_TARGETS         += $(OEX)
endif
ifeq ($(BUILD_CRX),yes)
ALL_TARGETS         += $(CRX)
endif
ifeq ($(BUILD_SAFARIEXTZ),yes)
ALL_TARGETS         += $(SAFARIEXTZ)
endif
ifeq ($(BUILD_XPI),yes)
ALL_TARGETS         += $(XPI)
endif

all: $(ALL_TARGETS)

$(CONFIG_JSON): $(SRC_USERJS)
	echo '[' > $@
	sed -e '1,/__CONFIG_BEGIN__/d' -e '/__CONFIG_END__/,$$d' < $(SRC_USERJS) >> $@
	echo ']' >> $@

$(CONFIG_JS): $(SRC_USERJS)
	echo '// auto generated code' > $@
	echo 'var conf_schema = [' >> $@
	sed -e '1,/__CONFIG_BEGIN__/d' -e '/__CONFIG_END__/,$$d' < $(SRC_USERJS) | tr -d '\r' >> $@
	echo '];' >> $@
	echo 'var LS = {' >> $@
	sed -e '1,/__STORAGE_COMMON_ENTRIES_BEGIN__/d' \
            -e '/__STORAGE_COMMON_ENTRIES_END__/,$$d' \
            -e '/__REMOVE__/d' \
          < $(SRC_USERJS) | tr -d '\r' >> $@;
	echo '};' >> $@
	sed -e '1,/__CONFIG_UI_BEGIN__/d' -e '/__CONFIG_UI_END__/,$$d' < $(SRC_USERJS) | tr -d '\r' >> $@;

$(LIB_JS): $(SRC_USERJS)
	echo '// auto generated code' > $@
	echo 'var conf={log_level:2};' >> $@
	sed -e '1,/__LIBRARY_BEGIN__/d' -e '/__LIBRARY_END__/,$$d' < $(SRC_USERJS) | tr -d '\r' >> $@

$(GREASEMONKEY_JS): $(SRC_USERJS)
	sed -e '/__GREASEMONKEY_REMOVE__/d' < $< > $@

$(I18N_LANGUAGES:%=$(I18N_DIR)/%.po): $(SRC_USERJS) $(I18N_UPDATE)
	$(I18N_UPDATE) $@ $<

warn:
	@for kw in $(WARN_KEYWORDS_W); do \
           grep -Hn $$kw $(SRC_USERJS) | grep -v window.$$kw | grep -v "'$$kw" | grep -v '/\* WARN \*/' || : ; \
         done
	@for kw in $(WARN_KEYWORDS_P); do \
           grep -Hn "\\.$$kw(" $(SRC_USERJS) | grep -v '/\* WARN \*/' || : ; \
         done

po: $(I18N_LANGUAGES:%=$(I18N_DIR)/%.po)

clean: clean-opera clean-chrome clean-safari clean-firefox
	rm -f $(CONFIG_JSON) $(CONFIG_JS) $(GREASEMONKEY_JS)

# ================ Opera ================

$(OPERA_CONFIG_XML): $(OPERA_CONFIG_XML).in $(SRC_USERJS) $(CONFIG_JSON)
	sed -e '/@LICENSE@/,$$d' \
            -e 's/@VERSION@/$(VERSION)/' \
            -e 's/@DESCRIPTION@/$(DESCRIPTION)/' \
            -e 's/@WEBSITE@/$(WEBSITE_SED)/' \
          < $< > $@
	@grep '://' $(LICENSE) | sed -e '2,$$d' -e 's/^ */  <license href="/' -e 's/ *$$/">/' >> $@
	@cat $(LICENSE) >> $@
	@echo '  </license>' >> $@
	sed -e '1,/@LICENSE@/d' -e '/@ICONS@/,$$d' < $< >> $@
	@for size in $(ICON_SIZE); do echo "  <icon src=\"$(OPERA_ICON_DIR)/$$size.png\" />" >> $@; done
	sed -e '1,/@ICONS@/d' -e '/@CONFIG@/,$$d' < $< >> $@
	python conf-parser.py opera < $(CONFIG_JSON) >> $@
	sed -e '1,/@CONFIG@/d' < $< >> $@

$(OPERA_ROOT)/includes/$(SRC_USERJS): $(SRC_USERJS) warn
	mkdir -p $(dir $@)
	$(I18N_EDIT) $< opera < $(SRC_USERJS) > $@

$(OPERA_ICON_FILES): $(ICON_SVG)
	mkdir -p $(dir $@)
	$(RSVG_CONVERT) $< -w $(@:$(OPERA_ROOT)/$(OPERA_ICON_DIR)/%.png=%) -o $@

$(OPERA_ROOT)/$(CONFIG_JS): $(CONFIG_JS)
	$(I18N_EDIT) $< opera < $(CONFIG_JS) > $@

$(DIST_FILES:%=$(OPERA_ROOT)/%): $(OPERA_ROOT)/%: %
	cp $< $@

$(OPERA_I18N_FILES): $(OPERA_I18N_SOURCES)
	mkdir -p $(dir $@)
	$(I18N_EDIT) $(I18N_DIR)/$(shell echo $@ | sed -e 's/.*locales\/\([^\/]*\)\/.*/\1/').po opera \
          < $(shell basename $@) > $@

$(OEX): $(OPERA_DIST_FILES)
	rm -rf $(OEX_TMP_DIR)
	@for file in $(^:$(OPERA_ROOT)/%=%); do \
           mkdir -p $(OEX_TMP_DIR)/`dirname $$file`; \
           cp $(OPERA_ROOT)/$$file $(OEX_TMP_DIR)/$$file || cp $$file $(OEX_TMP_DIR)/$$file; \
         done
#	cd $(OEX_TMP_DIR) && ../$(OPERA_ROOT)/sign/create_signature.sh $(^:$(OPERA_ROOT)/%=%) > signature1.xml
	cd $(OEX_TMP_DIR) && $(ZIP) -r ../$@ *

clean-opera:
	rm -f $(OEX) $(OPERA_CONFIG_XML) $(OPERA_ROOT)/$(CONFIG_JS) $(DIST_FILES:%=$(OPERA_ROOT)/%)
	rm -rf $(OEX_TMP_DIR) $(OPERA_ROOT)/includes $(OPERA_ROOT)/$(OPERA_ICON_DIR) $(OPERA_ROOT)/locales

# ================ Chrome ================

$(CHROME_MANIFEST_JSON): $(CHROME_MANIFEST_JSON).in $(SRC_USERJS)
	sed -e '/@ICONS@/,$$d' < $< | tr -d '\r' > $@
	@first=1;for size in $(ICON_SIZE); do \
           test $$first -eq 1 && first=0 || echo ',' >> $@; \
           /bin/echo -n "    \"$$size\": \"$(CHROME_ICON_DIR)/$$size.png\"" >> $@; \
         done
	echo >> $@;
	sed -e '1,/@ICONS@/d' \
            -e 's/@VERSION@/$(VERSION)/' \
            -e 's/@DESCRIPTION@/$(DESCRIPTION)/' \
            -e 's/@WEBSITE@/$(WEBSITE_SED)/' \
          < $< | tr -d '\r' >> $@

$(CHROME_ROOT)/$(CONFIG_JS): $(CONFIG_JS)
	$(I18N_EDIT_HASH) < $< >> $@

$(CHROME_ICON_FILES): $(ICON_SVG)
	mkdir -p $(dir $@)
	$(RSVG_CONVERT) $< -w $(@:$(CHROME_ROOT)/$(CHROME_ICON_DIR)/%.png=%) -o $@

$(CHROME_ROOT)/$(SRC_USERJS) $(DIST_FILES:%=$(CHROME_ROOT)/%): $(CHROME_ROOT)/%: %
	cp $< $@

$(CHROME_I18N_FILES): $(CONFIG_JS)
	mkdir -p $(dir $@)
	$(I18N_EDIT_HASH) chrome $(I18N_DIR)/$(@:$(CHROME_ROOT)/_locales/%/messages.json=%).po $@ < $(CONFIG_JS) > /dev/null

$(CRX): $(CHROME_DIST_FILES)
	rm -rf $(CRX_TMP_DIR)
	@for file in $(^:$(CHROME_ROOT)/%=%); do \
           mkdir -p $(CRX_TMP_DIR)/$(CRX:.crx=)/`dirname $$file`; \
           cp $(CHROME_ROOT)/$$file $(CRX_TMP_DIR)/$(CRX:.crx=)/$$file || cp $$file $(CRX_TMP_DIR)/$(CRX:.crx=)/$$file; \
         done
	@test -f $(CHROME_SIGN_KEY) && \
           "$(CHROME)" --pack-extension=$(CRX_TMP_DIR)/$(CRX:.crx=) --pack-extension-key=$(CHROME_SIGN_KEY) || \
           "$(CHROME)" --pack-extension=$(CRX_TMP_DIR)/$(CRX:.crx=)
	mv $(CRX_TMP_DIR)/$(CRX) ./
	@test -f $(CRX_TMP_DIR)/$(CRX:.crx=.pem) && mv $(CRX_TMP_DIR)/$(CRX:.crx=.pem) $(CHROME_SIGN_KEY) || :

clean-chrome:
	rm -f $(CRX) $(CHROME_MANIFEST_JSON) $(CHROME_ROOT)/$(CONFIG_JS) $(CHROME_ROOT)/$(SRC_USERJS) \
          $(DIST_FILES:%=$(CHROME_ROOT)/%)
	rm -rf $(CRX_TMP_DIR) $(CHROME_ROOT)/$(CHROME_ICON_DIR) $(CHROME_ROOT)/_locales

# ================ Safari ================

$(SAFARI_INFO_PLIST): $(SAFARI_INFO_PLIST).in
	sed -e 's/@VERSION@/$(VERSION)/' \
            -e 's/@WEBSITE@/$(WEBSITE_SED)/' \
          < $< > $@

$(SAFARI_SETTINGS_PLIST): $(SAFARI_SETTINGS_PLIST).in $(CONFIG_JSON)
	sed -e '/__SETTINGS__/,$$d' < $< > $@
	python conf-parser.py safari < $(CONFIG_JSON) >> $@
	sed -e '1,/__SETTINGS__/d' < $< >> $@

$(SAFARI_ROOT)/$(CONFIG_JS) $(SAFARI_ROOT)/$(SRC_USERJS) $(DIST_FILES:%=$(SAFARI_ROOT)/%): $(SAFARI_ROOT)/%: %
	cp $< $@

$(SAFARI_ICON_FILES): $(ICON_SVG)
	$(RSVG_CONVERT) $< -w $(@:$(SAFARI_ROOT)/Icon-%.png=%) -o $@

$(SAFARIEXTZ): $(SAFARI_DIST_FILES)
	rm -rf $(SAFARIEXTZ_TMP_DIR)
	@for file in $(^:$(SAFARI_ROOT)/%=%); do \
           d=$(SAFARIEXTZ_TMP_DIR)/$(SAFARIEXTZ:.safariextz=.safariextension); \
           mkdir -p $$d/`dirname $$file`; \
           cp $(SAFARI_ROOT)/$$file $$d/$$file || cp $$file $$d/$$file; \
         done
	cd $(SAFARIEXTZ_TMP_DIR) && \
          $(XAR) -cf ../$@ $(SAFARIEXTZ:.safariextz=.safariextension) && \
          : | openssl dgst -sign ../$(SAFARI_SIGN_KEY) -binary | wc -c > siglen.txt && \
          $(XAR) --sign -f ../$@ --data-to-sign sha1_hash.dat --sig-size `cat siglen.txt` $(SAFARI_CERTS:%=--cert-loc ../%) && \
          (echo "3021300906052B0E03021A05000414" | xxd -r -p; cat sha1_hash.dat) | \
            openssl rsautl -sign -inkey ../$(SAFARI_SIGN_KEY) > signature.dat && \
          $(XAR) --inject-sig signature.dat -f ../$@

clean-safari:
	rm -f $(SAFARIEXTZ) $(SAFARI_INFO_PLIST) $(SAFARI_SETTINGS_PLIST) \
          $(SAFARI_ROOT)/$(CONFIG_JS) $(SAFARI_ROOT)/$(SRC_USERJS) $(DIST_FILES:%=$(SAFARI_ROOT)/%) $(SAFARI_ICON_FILES)
	rm -rf $(SAFARIEXTZ_TMP_DIR)

# ================ Firefox ================

$(FIREFOX_ROOT)/content/$(SRC_USERJS): $(SRC_USERJS) warn
	cp $< $@

$(FIREFOX_ROOT)/content/$(CONFIG_JS): $(CONFIG_JS)
	cp $< $@

$(FIREFOX_INSTALL_RDF): $(FIREFOX_INSTALL_RDF).in
	sed -e 's/@VERSION@/$(VERSION)/' \
            -e 's/@DESCRIPTION@/$(DESCRIPTION)/' \
            -e 's/@WEBSITE@/$(WEBSITE_SED)/' \
          < $< > $@

$(FIREFOX_CHROME_MANIFEST): $(FIREFOX_CHROME_MANIFEST).in
	cp $< $@
	@for l in $(I18N_LANGUAGES_FULL); do echo "locale pixplus $$l locale/$$l/" >> $@; done

$(FIREFOX_ICON_FILES): $(ICON_SVG)
	mkdir -p $(dir $@)
	$(RSVG_CONVERT) $< -w $(@:$(FIREFOX_ROOT)/$(FIREFOX_ICON_DIR)/%.png=%) -o $@

$(FIREFOX_DEFAULTS_PREFS): $(CONFIG_JSON)
	mkdir -p $(dir $@)
	python conf-parser.py firefox < $(CONFIG_JSON) >> $@

$(FIREFOX_OPTIONS_XUL): $(FIREFOX_OPTIONS_XUL).in $(CONFIG_JS)
	sed -e '/__PREFERENCES__/,$$d' < $< > $@
	$(I18N_EDIT_HASH) < $(CONFIG_JS) | $(JS) -f $(LIB_JS) -f $(FIREFOX_GEN_OPTIONS) >> $@
	sed -e '1,/__PREFERENCES__/d' < $< >> $@

$(FIREFOX_DEBUG_LOADER):
	(pwd | tr -d '\r\n'; echo "/$(dir $@)") > $@

$(FIREFOX_I18N_FILES): %: %.in $(CONFIG_JS)
	rm -f $@
	$(I18N_EDIT_HASH) firefox \
          $(I18N_DIR)/$(firstword $(subst -, ,$(@:$(FIREFOX_ROOT)/locale/%/entities.dtd=%))).po \
          $@ < $(CONFIG_JS) > /dev/null
	cat $< >> $@

$(XPI): $(FIREFOX_DIST_FILES) $(FIREFOX_DEBUG_LOADER)
	rm -rf $(XPI_TMP_DIR)
	@for file in $(FIREFOX_DIST_FILES:$(FIREFOX_ROOT)/%=%); do \
           mkdir -p $(XPI_TMP_DIR)/`dirname $$file`; \
           cp $(FIREFOX_ROOT)/$$file $(XPI_TMP_DIR)/$$file || cp $$file $(XPI_TMP_DIR)/$$file; \
         done
	cd $(XPI_TMP_DIR) && $(ZIP) -r ../$@ *

clean-firefox:
	rm -f $(XPI) $(FIREFOX_ROOT)/content/$(SRC_USERJS) $(FIREFOX_ROOT)/content/$(CONFIG_JS) \
          $(FIREFOX_INSTALL_RDF) $(FIREFOX_CHROME_MANIFEST) $(FIREFOX_DEFAULTS_PREFS) $(FIREFOX_OPTIONS_XUL) \
          $(FIREFOX_DEBUG_LOADER) $(FIREFOX_I18N_FILES)
	rm -rf $(XPI_TMP_DIR) $(FIREFOX_ROOT)/defaults $(FIREFOX_ROOT)/$(FIREFOX_ICON_DIR)
