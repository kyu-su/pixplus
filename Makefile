RSVG_CONVERT         = rsvg-convert
ZIP                  = zip
XAR                  = $(shell echo $$HOME/local/xar/bin/xar)
ICON_SIZE            = 64 16 32 48
CHROME               = $(shell ./find_chrome.sh)
OEX                  = pixplus.oex
CRX                  = pixplus.crx
SAFARIEXTZ           = pixplus.safariextz
BUILD_CRX            = $(shell test -x "$(CHROME)" && echo yes || echo no)

CONFIG_XML           = config.xml
CONFIG_JS            = config.js
GREASEMONKEY_JS      = pixplus.user.js
ICON_PREFIX          = icons/pixplus_
ICON_SUFFIX          = .png
ICON_FILES           = $(ICON_SIZE:%=$(ICON_PREFIX)%$(ICON_SUFFIX))
ICON_FILES_SAFARI    = $(ICON_SIZE:%=Icon-%$(ICON_SUFFIX))
ICON_SVG             = icons/pixplus.svg
SIGNATURE            = signature1.xml
SRC_USERJS           = includes/pixplus.js
CONFIG_JSON          = config.json

CRX_TMP_DIR          = .crx
MANIFEST_JSON        = manifest.json

SAFARIEXTZ_TMP_DIR   = .safariextz
INFO_PLIST           = Info.plist
SETTINGS_PLIST       = Settings.plist
SAFARIEXTZ_CERTS     = safari_cert.der safari_ca1.der safari_ca2.der
SAFARIEXTZ_PRIV      = safari_key.pem

SIGN_FILES           = $(CONFIG_XML) $(SRC_USERJS) $(ICON_FILES)
DIST_FILES_EXTRA     = $(CONFIG_JS) common.js index.html index.js options.html options.css options.js
DIST_FILES_OEX       = $(SIGN_FILES) $(DIST_FILES_EXTRA)
DIST_FILES_CRX       = $(MANIFEST_JSON) $(SRC_USERJS) $(ICON_FILES) $(DIST_FILES_EXTRA)
DIST_FILES_SAFARI    = $(INFO_PLIST) $(SETTINGS_PLIST) $(SRC_USERJS) $(ICON_FILES_SAFARI)
VERSION              = $(shell grep '^// @version' $(SRC_USERJS) | sed -e 's/.*@version *//')
DESCRIPTION          = $(shell grep '^// @description' $(SRC_USERJS) | sed -e 's/.*@description *//')

WARN_KEYWORDS_W      = location document jQuery rating_ef countup_rating send_quality_rating IllustRecommender Effect sendRequest
WARN_KEYWORDS_P      = $(shell cat prototypejs_funcs.txt)

ALL_TARGETS          = $(OEX) $(GREASEMONKEY_JS) $(SAFARIEXTZ)
ifeq ($(BUILD_CRX),yes)
ALL_TARGETS         += $(CRX)
endif

all: $(ALL_TARGETS)
dist: $(OEX)

$(CONFIG_JSON): $(SRC_USERJS)
	echo '{' > $@
	sed -e '1,/__CONFIG_BEGIN__/d' -e '/__CONFIG_END__/,$$d' < $(SRC_USERJS) >> $@
	echo ',"bookmark_tag_order":["",""],' >> $@
	echo '"bookmark_tag_aliases":["",""]}' >> $@

$(CONFIG_XML): $(CONFIG_XML).in $(SRC_USERJS) $(CONFIG_JSON)
	sed -e '/@ICONS@/,$$d' -e 's/@VERSION@/$(VERSION)/' -e 's/@DESCRIPTION@/$(DESCRIPTION)/' < $< > $@
	@for size in $(ICON_SIZE); do \
           echo "  <icon src=\"$(ICON_PREFIX)$$size$(ICON_SUFFIX)\" />" >> $@; \
         done
	echo "  <icon src=\"$(ICON_SVG)\" />" >> $@;
	sed -e '1,/@ICONS@/d' -e '/@CONFIG@/,$$d' < $< >> $@
	python conf-parser.py opera < $(CONFIG_JSON) >> $@
	echo '  <preference name="conf_bookmark_tag_order" value="" />' >> $@
	echo '  <preference name="conf_bookmark_tag_aliases" value="" />' >> $@
	sed -e '1,/@CONFIG@/d' < $< >> $@

$(CONFIG_JS): $(SRC_USERJS)
	echo 'var conf_schema = {' > $@
	sed -e '1,/__CONFIG_BEGIN__/d' -e '/__CONFIG_END__/,$$d' < $(SRC_USERJS) | tr -d '\r' >> $@; \
	echo '};' >> $@
	echo 'var conf = {' >> $@
	sed -e '1,/__STORAGE_COMMON_ENTRIES_BEGIN__/d' \
            -e '/__STORAGE_COMMON_ENTRIES_END__/,$$d' \
            -e '/__REMOVE__/d' \
          < $(SRC_USERJS) | tr -d '\r' >> $@;
	echo '};' >> $@
	sed -e '1,/__CONFIG_UI_BEGIN__/d' -e '/__CONFIG_UI_END__/,$$d' < $(SRC_USERJS) | tr -d '\r' >> $@;

$(ICON_FILES): $(ICON_SVG)
	$(RSVG_CONVERT) $< -w $(@:$(ICON_PREFIX)%$(ICON_SUFFIX)=%) -o $@
$(ICON_FILES_SAFARI): $(ICON_SVG)
	$(RSVG_CONVERT) $< -w $(@:Icon-%$(ICON_SUFFIX)=%) -o $@

$(SIGNATURE): $(SIGN_FILES)
	./create_signature.sh $^ > $@

$(OEX): $(DIST_FILES_OEX)
	@for kw in $(WARN_KEYWORDS_W); do \
           grep -Hn $$kw $(SRC_USERJS) | grep -v window.$$kw | grep -v "'$$kw" | grep -v '/\* WARN \*/' || : ; \
         done
	@for kw in $(WARN_KEYWORDS_P); do \
           grep -Hn "\\.$$kw(" $(SRC_USERJS) | grep -v '/\* WARN \*/' || : ; \
         done
	$(ZIP) -r $@ $^

$(GREASEMONKEY_JS): $(SRC_USERJS)
	sed -e '/__GREASEMONKEY_REMOVE__/d' < $< > $@

$(MANIFEST_JSON): $(MANIFEST_JSON).in $(SRC_USERJS)
	sed -e '/@ICONS@/,$$d' < $< | tr -d '\r' > $@
	@first=1;for size in $(ICON_SIZE); do \
           test $$first -eq 1 && first=0 || echo ',' >> $@; \
           /bin/echo -n "    \"$$size\": \"$(ICON_PREFIX)$$size$(ICON_SUFFIX)\"" >> $@; \
         done
	echo >> $@;
	sed -e '1,/@ICONS@/d' -e 's/@VERSION@/$(VERSION)/' -e 's/@DESCRIPTION@/$(DESCRIPTION)/' < $< | tr -d '\r' >> $@

$(CRX): $(DIST_FILES_CRX)
	rm -rf $(CRX_TMP_DIR)
	@for file in $(DIST_FILES_CRX); do \
           mkdir -p $(CRX_TMP_DIR)/$(CRX:.crx=)/`dirname $$file`; \
           cp $$file $(CRX_TMP_DIR)/$(CRX:.crx=)/`dirname $$file`; \
         done
	@test -f $(CRX:.crx=.crx.pem) && \
           "$(CHROME)" --pack-extension=$(CRX_TMP_DIR)/$(CRX:.crx=) --pack-extension-key=$(CRX:.crx=.crx.pem) || \
           "$(CHROME)" --pack-extension=$(CRX_TMP_DIR)/$(CRX:.crx=)
	mv $(CRX_TMP_DIR)/$(CRX) ./
	@test -f $(CRX_TMP_DIR)/$(CRX:.crx=.pem) && mv $(CRX_TMP_DIR)/$(CRX:.crx=.pem) ./$(CRX:.crx=.crx.pem) || :

$(INFO_PLIST): $(INFO_PLIST).in
	sed -e 's/@VERSION@/$(VERSION)/' < $< > $@

$(SETTINGS_PLIST): $(SETTINGS_PLIST).in $(CONFIG_JSON)
	sed -e '/__SETTINGS__/,$$d' < $< > $@
	python conf-parser.py safari < $(CONFIG_JSON) >> $@
	sed -e '1,/__SETTINGS__/d' < $< >> $@

$(SAFARIEXTZ): $(DIST_FILES_SAFARI)
	rm -rf $(SAFARIEXTZ_TMP_DIR)
	@for file in $(DIST_FILES_SAFARI); do \
           mkdir -p $(SAFARIEXTZ_TMP_DIR)/$(SAFARIEXTZ:.safariextz=.safariextension)/`dirname $$file`; \
           cp $$file $(SAFARIEXTZ_TMP_DIR)/$(SAFARIEXTZ:.safariextz=.safariextension)/`dirname $$file`; \
         done
	cd $(SAFARIEXTZ_TMP_DIR) && \
          $(XAR) -cf ../$@ $(SAFARIEXTZ:.safariextz=.safariextension) && \
          : | openssl dgst -sign ../$(SAFARIEXTZ_PRIV) -binary | wc -c > siglen.txt && \
          $(XAR) --sign -f ../$@ --data-to-sign sha1_hash.dat --sig-size `cat siglen.txt` $(SAFARIEXTZ_CERTS:%=--cert-loc ../%) && \
          (echo "3021300906052B0E03021A05000414" | xxd -r -p; cat sha1_hash.dat) | openssl rsautl -sign -inkey ../$(SAFARIEXTZ_PRIV) > signature.dat && \
          $(XAR) --inject-sig signature.dat -f ../$@

clean:
	rm -rf $(CRX_TMP_DIR) $(SAFARIEXTZ_TMP_DIR)
	rm -f $(CONFIG_JSON) $(CONFIG_XML) $(CONFIG_JS) $(ICON_FILES) $(SIGNATURE) $(OEX) \
              $(GREASEMONKEY_JS) $(MANIFEST_JSON) $(CRX) \
              $(INFO_PLIST) $(SETTINGS_PLIST) $(SAFARIEXTZ) $(ICON_FILES_SAFARI)
