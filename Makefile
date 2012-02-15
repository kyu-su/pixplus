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
BUILD_XPI               = $(shell which "$(ZIP)" >/dev/null 2>&1 && which "$(JS)" >/dev/null 2>&1 && echo yes || echo no)

LICENSE                 = LICENSE.TXT
LANG_JS                 = lang.js
CONFIG_JSON             = config.json
CONFIG_JS               = config.js
LIB_JS                  = lib.js
ICON_SVG                = pixplus.svg
ICON_SIZE               = 16 32 48 64
SRC_USERJS              = pixplus.js
COMMON_FILES            = $(LANG_JS) $(CONFIG_JS) $(LIB_JS) common.js
BGPAGE_FILES            = index.js index.html
OPTION_PAGE_FILES       = options.js options.css options.html
DIST_FILES              = $(LICENSE) $(COMMON_FILES) $(BGPAGE_FILES) $(OPTION_PAGE_FILES)

GREASEMONKEY_JS         = pixplus.user.js

VERSION                 = $(shell grep '^// @version' $(SRC_USERJS) | sed -e 's/.*@version *//')
DESCRIPTION             = $(shell grep '^// @description' $(SRC_USERJS) | sed -e 's/.*@description *//')
WEBSITE                 = http://crckyl.pa.land.to/pixplus/
WEBSITE_SED             = $(shell echo $(WEBSITE) | sed -e 's/\//\\\//g')

OPERA_ROOT              = opera
OPERA_CONFIG_XML        = $(OPERA_ROOT)/config.xml
OPERA_ICON_DIR          = icons
OPERA_ICON_FILES        = $(ICON_SIZE:%=$(OPERA_ROOT)/$(OPERA_ICON_DIR)/%.png)
OPERA_DIST_FILES        = $(OPERA_CONFIG_XML) $(OPERA_ICON_FILES) \
                          $(DIST_FILES:%=$(OPERA_ROOT)/%) $(OPERA_ROOT)/includes/$(SRC_USERJS)

CHROME_ROOT             = chrome
CHROME_SIGN_KEY         = $(CHROME_ROOT)/sign/$(CRX:.crx=.crx.pem)
CHROME_MANIFEST_JSON    = $(CHROME_ROOT)/manifest.json
CHROME_ICON_DIR         = icons
CHROME_ICON_FILES       = $(ICON_SIZE:%=$(CHROME_ROOT)/$(CHROME_ICON_DIR)/%.png)
CHROME_DIST_FILES       = $(CHROME_MANIFEST_JSON) $(CHROME_ICON_FILES) \
                          $(DIST_FILES:%=$(CHROME_ROOT)/%) $(CHROME_ROOT)/$(SRC_USERJS)

SAFARI_ROOT             = safari/pixplus.safariextension
SAFARI_INFO_PLIST       = $(SAFARI_ROOT)/Info.plist
SAFARI_SETTINGS_PLIST   = $(SAFARI_ROOT)/Settings.plist
SAFARI_ICON_FILES       = $(ICON_SIZE:%=$(SAFARI_ROOT)/Icon-%.png)
SAFARI_CERTS            = $(patsubst %,$(SAFARI_ROOT)/sign/%,safari_cert.der safari_ca1.der safari_ca2.der)
SAFARI_SIGN_KEY         = $(SAFARI_ROOT)/sign/safari_key.pem
SAFARI_DIST_FILES       = $(SAFARI_INFO_PLIST) $(SAFARI_SETTINGS_PLIST) $(SAFARI_ICON_FILES) \
                          $(DIST_FILES:%=$(SAFARI_ROOT)/%) $(SAFARI_ROOT)/$(SRC_USERJS)

FIREFOX_ROOT            = firefox
FIREFOX_INSTALL_RDF     = $(FIREFOX_ROOT)/install.rdf
FIREFOX_CHROME_MANIFEST = $(FIREFOX_ROOT)/chrome.manifest
FIREFOX_OVERLAY_XUL     = $(FIREFOX_ROOT)/content/pixplus.xul
FIREFOX_DEFAULTS_PREFS  = $(FIREFOX_ROOT)/defaults/preferences/pixplus.js
FIREFOX_CONTENTS        = $(SRC_USERJS) $(LANG_JS) $(LIB_JS) $(CONFIG_JS) $(COMMON_JS) $(OPTION_PAGE_FILES)
FIREFOX_DEBUG_LOADER    = $(FIREFOX_ROOT)/pixplus@crckyl.ath.cx
FIREFOX_ICON_DIR        = content/icons
FIREFOX_ICON_FILES      = $(ICON_SIZE:%=$(FIREFOX_ROOT)/$(FIREFOX_ICON_DIR)/%.png)
FIREFOX_GEN_OPTIONS     = $(FIREFOX_ROOT)/gen_options.js
FIREFOX_DIST_FILES      = $(FIREFOX_INSTALL_RDF) $(FIREFOX_CHROME_MANIFEST) $(FIREFOX_OVERLAY_XUL) $(FIREFOX_DEFAULTS_PREFS) \
                          $(FIREFOX_CONTENTS:%=$(FIREFOX_ROOT)/content/%) $(FIREFOX_ICON_FILES) $(FIREFOX_ROOT)/$(LICENSE)

WARN_KEYWORDS_W         = location document jQuery rating_ef countup_rating send_quality_rating IllustRecommender \
                          Effect sendRequest getPageUrl
WARN_KEYWORDS_P         = $(shell cat prototypejs_funcs.txt)

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
ifeq ($(BUILD_XPI),yes)
ALL_TARGETS            += $(XPI)
endif

all: $(ALL_TARGETS) status

status:
	@echo
	@echo "$(GREASEMONKEY_JS):    yes"
	@echo "$(OEX):        $(BUILD_OEX)"
	@echo "$(CRX):        $(BUILD_CRX)"
	@echo "$(SAFARIEXTZ): $(BUILD_SAFARIEXTZ)"
	@echo "$(XPI):        $(BUILD_XPI)"

$(CONFIG_JSON): $(SRC_USERJS)
	@echo Create: $@
	@echo '[' > $@
	@sed -e '1,/__CONFIG_BEGIN__/d' -e '/__CONFIG_END__/,$$d' < $(SRC_USERJS) >> $@
	@echo ']' >> $@

$(LANG_JS): $(SRC_USERJS)
	@echo Create: $@
	@echo '// auto generated code' > $@
	@sed -e '1,/__LANG_BEGIN__/d' -e '/__LANG_END__/,$$d' < $(SRC_USERJS) | tr -d '\r' >> $@

$(CONFIG_JS): $(SRC_USERJS)
	@echo Create: $@
	@echo '// auto generated code' > $@
	@echo 'var conf_schema = [' >> $@
	@sed -e '1,/__CONFIG_BEGIN__/d' -e '/__CONFIG_END__/,$$d' < $(SRC_USERJS) | tr -d '\r' >> $@
	@echo '];' >> $@
	@echo 'var LS = {' >> $@
	@sed -e '1,/__STORAGE_COMMON_ENTRIES_BEGIN__/d' \
         -e '/__STORAGE_COMMON_ENTRIES_END__/,$$d' \
         -e '/__REMOVE__/d' \
       < $(SRC_USERJS) | tr -d '\r' >> $@
	@echo '};' >> $@
	@sed -e '1,/__CONFIG_UI_BEGIN__/d' -e '/__CONFIG_UI_END__/,$$d' < $(SRC_USERJS) | tr -d '\r' >> $@

$(LIB_JS): $(SRC_USERJS)
	@echo Create: $@
	@echo '// auto generated code' > $@
	@echo 'var conf={log_level:2};' >> $@
	@sed -e '1,/__LIBRARY_BEGIN__/d' -e '/__LIBRARY_END__/,$$d' < $(SRC_USERJS) | tr -d '\r' >> $@

$(GREASEMONKEY_JS): $(SRC_USERJS)
	@echo Create: $@
	@sed -e '/__GREASEMONKEY_REMOVE__/d' < $< > $@

warn:
	@for kw in $(WARN_KEYWORDS_W); do \
       grep -Hn $$kw $(SRC_USERJS) | grep -v window.$$kw | grep -v "'$$kw" | grep -v '/\* WARN \*/' || : ; \
     done
	@for kw in $(WARN_KEYWORDS_P); do \
       grep -Hn "\\.$$kw(" $(SRC_USERJS) | grep -v '/\* WARN \*/' || : ; \
     done

clean: clean-opera clean-chrome clean-safari clean-firefox
	@echo Cleaning
	@rm -f $(CONFIG_JSON) $(CONFIG_JS) $(GREASEMONKEY_JS)

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
	@python conf-parser.py opera < $(CONFIG_JSON) >> $@
	@sed -e '1,/@CONFIG@/d' < $< >> $@

$(OPERA_ROOT)/includes/$(SRC_USERJS): $(SRC_USERJS) warn
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
	@sed -e '/@ICONS@/,$$d' < $< | tr -d '\r' > $@
	@first=1;for size in $(ICON_SIZE); do \
       test $$first -eq 1 && first=0 || echo ',' >> $@; \
       /bin/echo -n "    \"$$size\": \"$(CHROME_ICON_DIR)/$$size.png\"" >> $@; \
     done
	@echo >> $@;
	@sed -e '1,/@ICONS@/d' \
         -e 's/@VERSION@/$(VERSION)/' \
         -e 's/@DESCRIPTION@/$(DESCRIPTION)/' \
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
	@python conf-parser.py safari < $(CONFIG_JSON) >> $@
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
       : | openssl dgst -sign ../$(SAFARI_SIGN_KEY) -binary | wc -c > siglen.txt && \
       $(XAR) --sign -f ../$@ --data-to-sign sha1_hash.dat --sig-size `cat siglen.txt` $(SAFARI_CERTS:%=--cert-loc ../%) >/dev/null && \
       (echo "3021300906052B0E03021A05000414" | xxd -r -p; cat sha1_hash.dat) | \
         openssl rsautl -sign -inkey ../$(SAFARI_SIGN_KEY) > signature.dat && \
       $(XAR) --inject-sig signature.dat -f ../$@ >/dev/null
	@chmod 644 $@

clean-safari:
	@rm -f $(SAFARIEXTZ) $(SAFARI_INFO_PLIST) $(SAFARI_SETTINGS_PLIST) \
           $(SAFARI_ROOT)/$(CONFIG_JS) $(SAFARI_ROOT)/$(SRC_USERJS) $(DIST_FILES:%=$(SAFARI_ROOT)/%) $(SAFARI_ICON_FILES)
	@rm -rf $(SAFARIEXTZ_TMP_DIR)

# ================ Firefox ================

$(FIREFOX_ROOT)/$(LICENSE): $(FIREFOX_ROOT)/%: %
	@echo "Copy: $< => $@"
	@cp $< $@

$(FIREFOX_CONTENTS:%=$(FIREFOX_ROOT)/content/%): $(FIREFOX_ROOT)/content/%: % warn
	@echo "Copy: $< => $@"
	@cp $< $@

$(FIREFOX_INSTALL_RDF): $(FIREFOX_INSTALL_RDF).in
	@echo Create: $@
	@sed -e 's/@VERSION@/$(VERSION)/' \
         -e 's/@DESCRIPTION@/$(DESCRIPTION)/' \
         -e 's/@WEBSITE@/$(WEBSITE_SED)/' \
       < $< > $@

$(FIREFOX_CHROME_MANIFEST): $(FIREFOX_CHROME_MANIFEST).in
	@echo "Copy: $< => $@"
	@cp $< $@

$(FIREFOX_ICON_FILES): $(ICON_SVG)
	@echo Build: $@
	@mkdir -p $(dir $@)
	@$(RSVG_CONVERT) $< -w $(@:$(FIREFOX_ROOT)/$(FIREFOX_ICON_DIR)/%.png=%) -o $@

$(FIREFOX_DEFAULTS_PREFS): $(CONFIG_JSON)
	@echo Build: $@
	@mkdir -p $(dir $@)
	@python conf-parser.py firefox < $(CONFIG_JSON) >> $@

$(FIREFOX_DEBUG_LOADER):
	@echo Build: $@
	@(pwd | tr -d '\r\n'; echo "/$(dir $@)") > $@

$(XPI): $(FIREFOX_DIST_FILES) $(FIREFOX_DEBUG_LOADER)
	@echo Build: $@
	@rm -rf $(XPI_TMP_DIR)
	@for file in $(FIREFOX_DIST_FILES:$(FIREFOX_ROOT)/%=%); do \
       mkdir -p $(XPI_TMP_DIR)/`dirname $$file`; \
       cp $(FIREFOX_ROOT)/$$file $(XPI_TMP_DIR)/$$file; \
     done
	@cd $(XPI_TMP_DIR) && $(ZIP) -qr ../$@ *

clean-firefox:
	@rm -f $(XPI) $(FIREFOX_CONTENTS_COPY:%=$(FIREFOX_ROOT)/content/%) \
           $(FIREFOX_INSTALL_RDF) $(FIREFOX_CHROME_MANIFEST) $(FIREFOX_DEFAULTS_PREFS) \
           $(FIREFOX_DEBUG_LOADER)
	@rm -rf $(XPI_TMP_DIR) $(FIREFOX_ROOT)/defaults $(FIREFOX_ROOT)/$(FIREFOX_ICON_DIR)
