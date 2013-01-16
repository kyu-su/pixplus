RSVG_CONVERT            = rsvg-convert
ZIP                     = zip
XAR                     = xar
CHROME                  = $(shell ./find_chrome.sh)
OEX                     = pixplus.oex
CRX                     = pixplus.crx
SAFARIEXTZ              = pixplus.safariextz
OEX_TMP_DIR             = $(CURDIR)/.oex
CRX_TMP_DIR             = $(CURDIR)/.crx
SAFARIEXTZ_TMP_DIR      = $(CURDIR)/.safariextz

BUILD_OEX               = $(shell which "$(ZIP)" >/dev/null 2>&1 && echo yes || echo no)
BUILD_CRX               = $(shell which "$(CHROME)" >/dev/null 2>&1 && echo yes || echo no)
BUILD_SAFARIEXTZ        = $(shell which "$(XAR)" >/dev/null 2>&1 && $(XAR) --help 2>&1 | grep sign >/dev/null && echo yes || echo no)

LICENSE                 = LICENSE.TXT
LIB_JS                  = lib.js
DATA_JS                 = data.js
CONFIG_JSON             = config.json
CHANGELOG_JSON          = changelog.json
ICON_SVG                = pixplus.svg
ICON_SIZE               = 16 32 48 64 128
SRC_USERJS              = pixplus.js
COMMON_FILES            = $(LIB_JS) $(DATA_JS) common.js
BGPAGE_FILES            = index.js index.html
OPTION_PAGE_FILES       = options.js options.css options.html
DIST_FILES              = $(LICENSE) $(COMMON_FILES) $(BGPAGE_FILES) $(OPTION_PAGE_FILES)

GREASEMONKEY_JS         = pixplus.user.js

VERSION                 = $(shell grep '^// @version' $(SRC_USERJS) | sed -e 's/.*@version *//')
DESCRIPTION             = $(shell grep '^// @description' $(SRC_USERJS) | sed -e 's/.*@description *//')
WEBSITE                 = http://crckyl.pa.land.to/pixplus/
WEBSITE_SED             = $(shell echo $(WEBSITE) | sed -e 's/\//\\\//g')

OPERA_ROOT              = $(CURDIR)/opera
OPERA_CONFIG_XML        = $(OPERA_ROOT)/config.xml
OPERA_ICON_DIR          = icons
OPERA_ICON_FILES        = $(ICON_SIZE:%=$(OPERA_ROOT)/$(OPERA_ICON_DIR)/%.png)
OPERA_DIST_FILES        = $(OPERA_CONFIG_XML) $(OPERA_ICON_FILES) \
                          $(DIST_FILES:%=$(OPERA_ROOT)/%) $(OPERA_ROOT)/includes/$(SRC_USERJS)

CHROME_ROOT             = $(CURDIR)/chrome
CHROME_SIGN_KEY         = $(CHROME_ROOT)/sign/$(CRX:.crx=.crx.pem)
CHROME_MANIFEST_JSON    = $(CHROME_ROOT)/manifest.json
CHROME_ICON_DIR         = icons
CHROME_ICON_FILES       = $(ICON_SIZE:%=$(CHROME_ROOT)/$(CHROME_ICON_DIR)/%.png)
CHROME_DIST_FILES       = $(CHROME_MANIFEST_JSON) $(CHROME_ICON_FILES) \
                          $(DIST_FILES:%=$(CHROME_ROOT)/%) $(CHROME_ROOT)/$(SRC_USERJS)

SAFARI_ROOT             = $(CURDIR)/safari/pixplus.safariextension
SAFARI_INFO_PLIST       = $(SAFARI_ROOT)/Info.plist
SAFARI_SETTINGS_PLIST   = $(SAFARI_ROOT)/Settings.plist
SAFARI_ICON_FILES       = $(ICON_SIZE:%=$(SAFARI_ROOT)/Icon-%.png)
SAFARI_CERTS            = $(patsubst %,$(SAFARI_ROOT)/sign/%,safari_cert.der safari_ca1.der safari_ca2.der)
SAFARI_SIGN_KEY         = $(SAFARI_ROOT)/sign/safari_key.pem
SAFARI_DIST_FILES       = $(SAFARI_INFO_PLIST) $(SAFARI_SETTINGS_PLIST) $(SAFARI_ICON_FILES) \
                          $(DIST_FILES:%=$(SAFARI_ROOT)/%) $(SAFARI_ROOT)/$(SRC_USERJS)

ALL_TARGETS             = $(GREASEMONKEY_JS)

ifeq ($(BUILD_OEX),yes)
ALL_TARGETS            += $(OEX)
endif
ifeq ($(BUILD_CRX),yes)
ALL_TARGETS            += $(CRX)
endif
ifeq ($(BUILD_SAFARIEXTZ),yes)
ALL_TARGETS            += $(SAFARIEXTZ)
endif

all: $(ALL_TARGETS) $(CHANGELOG_JSON) status

status:
	@echo
	@echo "$(GREASEMONKEY_JS):    yes"
	@echo "$(OEX):        $(BUILD_OEX)"
	@echo "$(CRX):        $(BUILD_CRX)"
	@echo "$(SAFARIEXTZ): $(BUILD_SAFARIEXTZ)"

$(CONFIG_JSON): $(SRC_USERJS)
	@echo Create: $@
	@echo '{"comment": "this file was automatically generated from $<", "data": [' >> $@
	@sed -e '1,/__CONFIG_BEGIN__/d' -e '/__CONFIG_END__/,$$d' < $(SRC_USERJS) >> $@
	@echo ']}' >> $@

$(CHANGELOG_JSON): $(SRC_USERJS)
	@echo Create: $@
	@echo '{"comment": "this file was automatically generated from $<", "data": [' >> $@
	@sed -e '1,/__CHANGELOG_BEGIN__/d' -e '/__CHANGELOG_END__/,$$d' < $(SRC_USERJS) >> $@
	@echo ']}' >> $@

$(LIB_JS): $(SRC_USERJS)
	@echo Create: $@
	@echo '// this file was automatically generated from $<' > $@
	@echo '(function(g, w, d) {' >> $@
	@sed -e '1,/__LIBRARY_BEGIN__/d' -e '/__LIBRARY_END__/,$$d' < $(SRC_USERJS) | tr -d '\r' >> $@
	@echo '})(this, this.window, this.window.document);' >> $@

$(DATA_JS): $(SRC_USERJS)
	@echo Create: $@
	@echo '// this file was automatically generated from $<' > $@
	@echo '(function(g, w, d, _) {' >> $@
	@sed -e '1,/__DATA_BEGIN__/d' -e '/__DATA_END__/,$$d' < $(SRC_USERJS) | tr -d '\r' >> $@
	@echo '})(this, this.window, this.window.document, this.window.pixplus);' >> $@

clean: clean-greasemonkey clean-opera clean-chrome clean-safari
	@echo Cleaning
	@rm -f $(CONFIG_JSON) $(LIB_JS) $(DATA_JS)

# ================ GreaseMonkey ================

$(GREASEMONKEY_JS): $(SRC_USERJS)
	@echo Create: $@
	@sed -e '/__GREASEMONKEY_REMOVE__/d' < $< > $@

clean-greasemonkey:
	@rm -f $(GREASEMONKEY_JS)

# ================ Opera ================

$(OPERA_CONFIG_XML): $(OPERA_CONFIG_XML).in $(SRC_USERJS) $(CONFIG_JSON)
	@echo Create: $@
	@sed -e '/@LICENSE@/,$$d' \
             -e 's/@VERSION@/$(VERSION)/' \
             -e 's/@DESCRIPTION@/$(DESCRIPTION)/' \
             -e 's/@WEBSITE@/$(WEBSITE_SED)/' \
           < $< > $@
	@grep '://' $(LICENSE) | sed -e '2,$$d' -e 's/^ */  <license href="/' -e 's/ *$$/">/' >> $@
	@cat $(LICENSE) >> $@
	@echo '  </license>' >> $@
	@sed -e '1,/@LICENSE@/d' -e '/@ICONS@/,$$d' < $< >> $@
	@for size in $(ICON_SIZE); do echo "  <icon src=\"$(OPERA_ICON_DIR)/$$size.png\" />" >> $@; done
	@sed -e '1,/@ICONS@/d' -e '/@CONFIG@/,$$d' < $< >> $@
	@python2 conf-parser.py opera < $(CONFIG_JSON) >> $@
	@sed -e '1,/@CONFIG@/d' < $< >> $@

$(OPERA_ROOT)/includes/$(SRC_USERJS): $(SRC_USERJS)
	@echo "Copy: $< => $@"
	@mkdir -p $(dir $@)
	@cp $< $@

$(OPERA_ICON_FILES): $(ICON_SVG)
	@echo Build: $@
	@mkdir -p $(dir $@)
	@$(RSVG_CONVERT) $< -w $(@:$(OPERA_ROOT)/$(OPERA_ICON_DIR)/%.png=%) -o $@

$(DIST_FILES:%=$(OPERA_ROOT)/%): $(OPERA_ROOT)/%: %
	@echo "Copy: $< => $@"
	@cp $< $@

$(OEX): $(OPERA_DIST_FILES)
	@echo Build: $@
	@rm -rf $(OEX_TMP_DIR)
	@for file in $(^:$(OPERA_ROOT)/%=%); do \
           mkdir -p $(OEX_TMP_DIR)/`dirname $$file`; \
           cp $(OPERA_ROOT)/$$file $(OEX_TMP_DIR)/$$file; \
         done
#	cd $(OEX_TMP_DIR) && ../$(OPERA_ROOT)/sign/create_signature.sh $(^:$(OPERA_ROOT)/%=%) > signature1.xml
	@cd $(OEX_TMP_DIR) && $(ZIP) -qr ../$@ *

clean-opera:
	@rm -f $(OEX) $(OPERA_CONFIG_XML) $(DIST_FILES:%=$(OPERA_ROOT)/%)
	@rm -rf $(OEX_TMP_DIR) $(OPERA_ROOT)/includes $(OPERA_ROOT)/$(OPERA_ICON_DIR)

# ================ Chrome ================

$(CHROME_MANIFEST_JSON): $(CHROME_MANIFEST_JSON).in $(SRC_USERJS)
	@echo Create: $@
	@sed -e '/@ICONS@/,$$d' \
             -e 's/@VERSION@/$(VERSION)/' \
             -e 's/@DESCRIPTION@/$(DESCRIPTION)/' \
           < $< | tr -d '\r' > $@
	@first=1;for size in $(ICON_SIZE); do \
       test $$first -eq 1 && first=0 || echo ',' >> $@; \
       /bin/echo -n "    \"$$size\": \"$(CHROME_ICON_DIR)/$$size.png\"" >> $@; \
     done
	@echo >> $@;
	@sed -e '1,/@ICONS@/d' \
             -e 's/@VERSION@/$(VERSION)/' \
             -e 's/@WEBSITE@/$(WEBSITE_SED)/' \
           < $< | tr -d '\r' >> $@

$(CHROME_ICON_FILES): $(ICON_SVG)
	@echo Build: $@
	@mkdir -p $(dir $@)
	@$(RSVG_CONVERT) $< -w $(@:$(CHROME_ROOT)/$(CHROME_ICON_DIR)/%.png=%) -o $@

$(CHROME_ROOT)/$(SRC_USERJS) $(DIST_FILES:%=$(CHROME_ROOT)/%): $(CHROME_ROOT)/%: %
	@echo "Copy: $< => $@"
	@cp $< $@

$(CRX): $(CHROME_DIST_FILES)
	@echo Build: $@
	@rm -rf $(CRX_TMP_DIR)
	@for file in $(^:$(CHROME_ROOT)/%=%); do \
           mkdir -p $(CRX_TMP_DIR)/$(CRX:.crx=)/`dirname $$file`; \
           cp $(CHROME_ROOT)/$$file $(CRX_TMP_DIR)/$(CRX:.crx=)/$$file; \
         done
	@if test -f $(CHROME_SIGN_KEY); then \
           "$(CHROME)" --pack-extension=$(CRX_TMP_DIR)/$(CRX:.crx=) --pack-extension-key=$(CHROME_SIGN_KEY); \
         else \
           "$(CHROME)" --pack-extension=$(CRX_TMP_DIR)/$(CRX:.crx=); \
         fi
	@mv $(CRX_TMP_DIR)/$(CRX) ./
	@test -f $(CRX_TMP_DIR)/$(CRX:.crx=.pem) && mv $(CRX_TMP_DIR)/$(CRX:.crx=.pem) $(CHROME_SIGN_KEY) || :

clean-chrome:
	@rm -f $(CRX) $(CHROME_MANIFEST_JSON) $(CHROME_ROOT)/$(SRC_USERJS) $(DIST_FILES:%=$(CHROME_ROOT)/%)
	@rm -rf $(CRX_TMP_DIR) $(CHROME_ROOT)/$(CHROME_ICON_DIR)

# ================ Safari ================

$(SAFARI_INFO_PLIST): $(SAFARI_INFO_PLIST).in
	@echo Create: $@
	@sed -e 's/@VERSION@/$(VERSION)/' \
         -e 's/@WEBSITE@/$(WEBSITE_SED)/' \
       < $< > $@

$(SAFARI_SETTINGS_PLIST): $(SAFARI_SETTINGS_PLIST).in $(CONFIG_JSON)
	@echo Create: $@
	@sed -e '/__SETTINGS__/,$$d' < $< > $@
	@python2 conf-parser.py safari < $(CONFIG_JSON) >> $@
	@sed -e '1,/__SETTINGS__/d' < $< >> $@

$(SAFARI_ROOT)/$(SRC_USERJS) $(DIST_FILES:%=$(SAFARI_ROOT)/%): $(SAFARI_ROOT)/%: %
	@echo "Copy: $< => $@"
	@cp $< $@

$(SAFARI_ICON_FILES): $(ICON_SVG)
	@echo Build: $@
	@$(RSVG_CONVERT) $< -w $(@:$(SAFARI_ROOT)/Icon-%.png=%) -o $@

$(SAFARIEXTZ): $(SAFARI_DIST_FILES)
	@echo Build: $@
	@rm -rf $(SAFARIEXTZ_TMP_DIR)
	@for file in $(^:$(SAFARI_ROOT)/%=%); do \
       d=$(SAFARIEXTZ_TMP_DIR)/$(SAFARIEXTZ:.safariextz=.safariextension); \
       mkdir -p $$d/`dirname $$file`; \
       cp $(SAFARI_ROOT)/$$file $$d/$$file; \
     done
	@cd $(SAFARIEXTZ_TMP_DIR) && \
       $(XAR) -cf ../$@ $(SAFARIEXTZ:.safariextz=.safariextension) >/dev/null && \
       : | openssl dgst -sign $(SAFARI_SIGN_KEY) -binary | wc -c > siglen.txt && \
       $(XAR) --sign -f ../$@ --data-to-sign sha1_hash.dat --sig-size `cat siglen.txt` $(SAFARI_CERTS:%=--cert-loc %) >/dev/null && \
       (echo "3021300906052B0E03021A05000414" | xxd -r -p; cat sha1_hash.dat) | \
         openssl rsautl -sign -inkey $(SAFARI_SIGN_KEY) > signature.dat && \
       $(XAR) --inject-sig signature.dat -f ../$@ >/dev/null
	@chmod 644 $@

clean-safari:
	@rm -f $(SAFARIEXTZ) $(SAFARI_INFO_PLIST) $(SAFARI_SETTINGS_PLIST) \
           $(SAFARI_ROOT)/$(SRC_USERJS) $(DIST_FILES:%=$(SAFARI_ROOT)/%) $(SAFARI_ICON_FILES)
	@rm -rf $(SAFARIEXTZ_TMP_DIR)
