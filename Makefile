RSVG_CONVERT            = rsvg-convert
ZIP                     = zip
XAR                     = xar
CHROME                  = $(shell ./find_chrome.sh)
OEX                     = pixplus.oex
CRX                     = pixplus.crx
SAFARIEXTZ              = pixplus.safariextz
OEX_TMP_DIR             = .oex
CRX_TMP_DIR             = .crx
SAFARIEXTZ_TMP_DIR      = .safariextz
BUILD_OEX               = $(shell which "$(ZIP)" >/dev/null && echo yes || echo no)
BUILD_CRX               = $(shell which "$(CHROME)" >/dev/null && echo yes || echo no)
BUILD_SAFARIEXTZ        = $(shell which "$(XAR)" >/dev/null && $(XAR) --help 2>&1 | grep sign >/dev/null && echo yes || echo no)

CONFIG_JSON             = config.json
CONFIG_JS               = config.js
GREASEMONKEY_JS         = pixplus.user.js
ICON_SVG                = pixplus.svg
ICON_SIZE               = 16 32 48 64
SRC_USERJS              = pixplus.js
DIST_FILES              = common.js index.html index.js options.html options.css options.js

I18N_DIR                = i18n
I18N_LANGUAGES          = en ja
I18N_UPDATE             = $(I18N_DIR)/update.py
I18N_EDIT               = $(I18N_DIR)/edit.py
I18N_CHROME             = $(I18N_DIR)/chrome.py

VERSION                 = $(shell grep '^// @version' $(SRC_USERJS) | sed -e 's/.*@version *//')
DESCRIPTION             = $(shell grep '^// @description' $(SRC_USERJS) | sed -e 's/.*@description *//')

OPERA_ROOT              = opera
OPERA_CONFIG_XML        = $(OPERA_ROOT)/config.xml
OPERA_ICON_DIR          = icons
OPERA_ICON_FILES        = $(ICON_SIZE:%=$(OPERA_ROOT)/$(OPERA_ICON_DIR)/%.png)
OPERA_I18N_SOURCES      = $(OPERA_ROOT)/includes/$(SRC_USERJS) $(OPERA_ROOT)/$(CONFIG_JS)
OPERA_I18N_FILES        = $(foreach l,$(I18N_LANGUAGES),$(OPERA_I18N_SOURCES:$(OPERA_ROOT)/%=$(OPERA_ROOT)/locales/$(l)/%))
OPERA_DIST_FILES        = $(OPERA_CONFIG_XML) $(OPERA_I18N_SOURCES) $(OPERA_ICON_FILES) $(DIST_FILES:%=$(OPERA_ROOT)/%) $(OPERA_I18N_FILES)

CHROME_ROOT             = chrome
CHROME_SIGN_KEY         = $(CHROME_ROOT)/sign/$(CRX:.crx=.crx.pem)
CHROME_MANIFEST_JSON    = $(CHROME_ROOT)/manifest.json
CHROME_ICON_DIR         = icons
CHROME_ICON_FILES       = $(ICON_SIZE:%=$(CHROME_ROOT)/$(CHROME_ICON_DIR)/%.png)
CHROME_I18N_FILES       = $(I18N_LANGUAGES:%=$(CHROME_ROOT)/_locales/%/messages.json)
CHROME_DIST_FILES       = $(CHROME_MANIFEST_JSON) $(CHROME_ROOT)/$(CONFIG_JS) $(CHROME_ROOT)/$(SRC_USERJS) $(CHROME_ICON_FILES) $(DIST_FILES:%=$(CHROME_ROOT)/%) $(CHROME_I18N_FILES)

SAFARI_ROOT             = safari
SAFARI_INFO_PLIST       = $(SAFARI_ROOT)/Info.plist
SAFARI_SETTINGS_PLIST   = $(SAFARI_ROOT)/Settings.plist
SAFARI_ICON_FILES       = $(ICON_SIZE:%=$(SAFARI_ROOT)/Icon-%.png)
SAFARI_CERTS            = $(SAFARI_ROOT)/sign/safari_cert.der $(SAFARI_ROOT)/sign/safari_ca1.der $(SAFARI_ROOT)/sign/safari_ca2.der
SAFARI_SIGN_KEY         = $(SAFARI_ROOT)/sign/safari_key.pem
SAFARI_DIST_FILES       = $(SAFARI_INFO_PLIST) $(SAFARI_SETTINGS_PLIST) $(SAFARI_ROOT)/$(CONFIG_JS) $(SAFARI_ROOT)/$(SRC_USERJS) $(SAFARI_ICON_FILES) $(DIST_FILES:%=$(SAFARI_ROOT)/%)

ALL_TARGETS          =

ifeq ($(BUILD_OEX),yes)
ALL_TARGETS         += $(OEX)
endif
ifeq ($(BUILD_CRX),yes)
ALL_TARGETS         += $(CRX)
endif
ifeq ($(BUILD_SAFARIEXTZ),yes)
ALL_TARGETS         += $(SAFARIEXTZ)
endif

all: $(ALL_TARGETS)

$(CONFIG_JSON): $(SRC_USERJS)
	echo '{' > $@
	sed -e '1,/__CONFIG_BEGIN__/d' -e '/__CONFIG_END__/,$$d' < $(SRC_USERJS) >> $@
	echo ',"bookmark_tag_order":["",""],' >> $@
	echo '"bookmark_tag_aliases":["",""]}' >> $@

$(CONFIG_JS): $(SRC_USERJS)
	echo 'var conf_schema = {' > $@
	sed -e '1,/__CONFIG_BEGIN__/d' -e '/__CONFIG_END__/,$$d' < $(SRC_USERJS) | tr -d '\r' >> $@
	echo '};' >> $@
	echo 'var conf = {' >> $@
	sed -e '1,/__STORAGE_COMMON_ENTRIES_BEGIN__/d' \
            -e '/__STORAGE_COMMON_ENTRIES_END__/,$$d' \
            -e '/__REMOVE__/d' \
          < $(SRC_USERJS) | tr -d '\r' >> $@;
	echo '};' >> $@
	sed -e '1,/__CONFIG_UI_BEGIN__/d' -e '/__CONFIG_UI_END__/,$$d' < $(SRC_USERJS) | tr -d '\r' >> $@;

$(I18N_LANGUAGES:%=$(I18N_DIR)/%.po): $(SRC_USERJS) $(I18N_UPDATE)
	$(I18N_UPDATE) $@ $<

clean: clean-opera clean-chrome clean-safari
	rm -f $(CONFIG_JSON) $(CONFIG_JS)

# ================ Opera ================

$(OPERA_CONFIG_XML): $(OPERA_CONFIG_XML).in $(SRC_USERJS) $(CONFIG_JSON)
	sed -e '/@ICONS@/,$$d' -e 's/@VERSION@/$(VERSION)/' -e 's/@DESCRIPTION@/$(DESCRIPTION)/' < $< > $@
	@for size in $(ICON_SIZE); do echo "  <icon src=\"$(OPERA_ICON_DIR)/$$size.png\" />" >> $@; done
	sed -e '1,/@ICONS@/d' -e '/@CONFIG@/,$$d' < $< >> $@
	python conf-parser.py opera < $(CONFIG_JSON) >> $@
	echo '  <preference name="conf_bookmark_tag_order" value="" />' >> $@
	echo '  <preference name="conf_bookmark_tag_aliases" value="" />' >> $@
	sed -e '1,/@CONFIG@/d' < $< >> $@

$(OPERA_ROOT)/includes/$(SRC_USERJS): $(I18N_DIR)/en.po $(SRC_USERJS)
	mkdir -p $(dir $@)
	$(I18N_EDIT) $< opera < $(SRC_USERJS) > $@

$(OPERA_ICON_FILES): $(ICON_SVG)
	mkdir -p $(dir $@)
	$(RSVG_CONVERT) $< -w $(@:$(OPERA_ROOT)/$(OPERA_ICON_DIR)/%.png=%) -o $@

$(OPERA_ROOT)/$(CONFIG_JS): $(I18N_DIR)/en.po $(CONFIG_JS)
	$(I18N_EDIT) $< opera < $(CONFIG_JS) > $@

$(DIST_FILES:%=$(OPERA_ROOT)/%): $(OPERA_ROOT)/%: %
	cp $< $@

$(OPERA_I18N_FILES): $(I18N_LANGUAGES:%=$(I18N_DIR)/%.po) $(OPERA_I18N_SOURCES)
	mkdir -p $(dir $@)
	$(I18N_EDIT) $(I18N_DIR)/$(shell echo $@ | sed -e 's/.*locales\/\([^\/]*\)\/.*/\1/').po opera \
          < $(shell basename $@) > $@

$(OEX): $(OPERA_DIST_FILES)
	rm -rf $(OEX_TMP_DIR)
	@for file in $(^:$(OPERA_ROOT)/%=%); do \
           mkdir -p $(OEX_TMP_DIR)/`dirname $$file`; \
           cp $(OPERA_ROOT)/$$file $(OEX_TMP_DIR)/$$file; \
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
	sed -e '1,/@ICONS@/d' -e 's/@VERSION@/$(VERSION)/' -e 's/@DESCRIPTION@/$(DESCRIPTION)/' < $< | tr -d '\r' >> $@

$(CHROME_ROOT)/$(CONFIG_JS): $(CONFIG_JS)
	$(I18N_CHROME) < $< >> $@

$(CHROME_ICON_FILES): $(ICON_SVG)
	mkdir -p $(dir $@)
	$(RSVG_CONVERT) $< -w $(@:$(CHROME_ROOT)/$(CHROME_ICON_DIR)/%.png=%) -o $@

$(CHROME_ROOT)/$(SRC_USERJS) $(DIST_FILES:%=$(CHROME_ROOT)/%): $(CHROME_ROOT)/%: %
	cp $< $@

$(CHROME_I18N_FILES): $(CHROME_ROOT)/_locales/%/messages.json: i18n/%.po $(CONFIG_JS)
	mkdir -p $(dir $@)
	$(I18N_CHROME) $< $@ < $(CONFIG_JS) > /dev/null

$(CRX): $(CHROME_DIST_FILES)
	rm -rf $(CRX_TMP_DIR)
	@for file in $(^:$(CHROME_ROOT)/%=%); do \
           mkdir -p $(CRX_TMP_DIR)/$(CRX:.crx=)/`dirname $$file`; \
           cp $(CHROME_ROOT)/$$file $(CRX_TMP_DIR)/$(CRX:.crx=)/$$file; \
         done
	@test -f $(CHROME_SIGN_KEY) && \
           "$(CHROME)" --pack-extension=$(CRX_TMP_DIR)/$(CRX:.crx=) --pack-extension-key=$(CHROME_SIGN_KEY) || \
           "$(CHROME)" --pack-extension=$(CRX_TMP_DIR)/$(CRX:.crx=)
	mv $(CRX_TMP_DIR)/$(CRX) ./
	@test -f $(CRX_TMP_DIR)/$(CRX:.crx=.pem) && mv $(CRX_TMP_DIR)/$(CRX:.crx=.pem) $(CHROME_SIGN_KEY) || :

clean-chrome:
	rm -f $(CRX) $(CHROME_MANIFEST_JSON) $(CHROME_ROOT)/$(CONFIG_JS) $(CHROME_ROOT)/$(SRC_USERJS) $(DIST_FILES:%=$(CHROME_ROOT)/%)
	rm -rf $(CRX_TMP_DIR) $(CHROME_ROOT)/$(CHROME_ICON_DIR) $(CHROME_ROOT)/_locales

# ================ Safari ================

$(SAFARI_INFO_PLIST): $(SAFARI_INFO_PLIST).in
	sed -e 's/@VERSION@/$(VERSION)/' < $< > $@

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
           mkdir -p $(SAFARIEXTZ_TMP_DIR)/$(SAFARIEXTZ:.safariextz=.safariextension)/`dirname $$file`; \
           cp $(SAFARI_ROOT)/$$file $(SAFARIEXTZ_TMP_DIR)/$(SAFARIEXTZ:.safariextz=.safariextension)/$$file; \
         done
	cd $(SAFARIEXTZ_TMP_DIR) && \
          $(XAR) -cf ../$@ $(SAFARIEXTZ:.safariextz=.safariextension) && \
          : | openssl dgst -sign ../$(SAFARI_SIGN_KEY) -binary | wc -c > siglen.txt && \
          $(XAR) --sign -f ../$@ --data-to-sign sha1_hash.dat --sig-size `cat siglen.txt` $(SAFARI_CERTS:%=--cert-loc ../%) && \
          (echo "3021300906052B0E03021A05000414" | xxd -r -p; cat sha1_hash.dat) | openssl rsautl -sign -inkey ../$(SAFARI_SIGN_KEY) > signature.dat && \
          $(XAR) --inject-sig signature.dat -f ../$@

clean-safari:
	rm -f $(SAFARIEXTZ) $(SAFARI_INFO_PLIST) $(SAFARI_SETTINGS_PLIST) $(SAFARI_ROOT)/$(CONFIG_JS) $(SAFARI_ROOT)/$(SRC_USERJS) $(DIST_FILES:%=$(SAFARI_ROOT)/%) $(SAFARI_ICON_FILES)
	rm -rf $(SAFARIEXTZ_TMP_DIR)
