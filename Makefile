RSVG_CONVERT         = rsvg-convert
ECHO                 = /bin/echo
ZIP                  = zip
XAR                  = $(shell echo $$HOME/local/xar/bin/xar)
ICON_SIZE            = 64 16 32 48
CHROME               = /usr/bin/chromium-browser
OEX                  = pixplus.oex
CRX                  = pixplus.crx
SAFARIEXTZ           = pixplus.safariextz
BUILD_CRX            = $(shell test -x $(CHROME) && echo yes || echo no)

CONFIG_XML           = config.xml
CONFIG_JS            = config.js
PARSER_JS            = parser.js
GREASEMONKEY_JS      = pixplus.user.js
ICON_PREFIX          = icons/pixplus_
ICON_SUFFIX          = .png
ICON_FILES           = $(ICON_SIZE:%=$(ICON_PREFIX)%$(ICON_SUFFIX))
ICON_FILES_SAFARI    = $(ICON_SIZE:%=Icon-%$(ICON_SUFFIX))
ICON_SVG             = icons/pixplus.svg
SIGNATURE            = signature1.xml
SRC_USERJS           = includes/pixplus.js
SIGN_FILES           = $(CONFIG_XML) $(SRC_USERJS) $(ICON_FILES)
DIST_FILES           = $(SIGN_FILES) $(CONFIG_JS) $(PARSER_JS) common.js index.html index.js options.html options.css options.js
VERSION              = $(shell grep '^// @version' $(SRC_USERJS) | sed -e 's/.*@version *//')
DESCRIPTION          = $(shell grep '^// @description' $(SRC_USERJS) | sed -e 's/.*@description *//')

CRX_TMP_DIR          = .crx
MANIFEST_JSON        = manifest.json

SAFARIEXTZ_TMP_DIR   = .safariextz
INFO_PLIST           = Info.plist
SAFARIEXTZ_CERTS     = safari_cert.der safari_ca1.der safari_ca2.der
SAFARIEXTZ_PRIV      = safari_key.pem

WARN_KEYWORDS_W      = location document jQuery rating_ef countup_rating send_quality_rating IllustRecommender Effect sendRequest
WARN_KEYWORDS_P      = $(shell cat prototypejs_funcs.txt)

ALL_TARGETS          = $(OEX) $(GREASEMONKEY_JS) $(SAFARIEXTZ)
ifeq ($(BUILD_CRX),yes)
ALL_TARGETS         += $(CRX)
endif

all: $(ALL_TARGETS)
dist: $(OEX)

$(CONFIG_XML): $(CONFIG_XML).in $(SRC_USERJS)
	sed -e '/@ICONS@/,$$d' -e 's/@VERSION@/$(VERSION)/' -e 's/@DESCRIPTION@/$(DESCRIPTION)/' < $< > $@
	@for size in $(ICON_SIZE); do \
           $(ECHO) "  <icon src=\"$(ICON_PREFIX)$$size$(ICON_SUFFIX)\" />" >> $@; \
         done
	$(ECHO) "  <icon src=\"$(ICON_SVG)\" />" >> $@;
	sed -e '1,/@ICONS@/d' -e '/@CONFIG@/,$$d' < $< >> $@
	@for f in $(SRC_USERJS); do \
           sed -e '1,/__CONFIG_BEGIN__/d' -e '/__CONFIG_END__/,$$d' < $$f \
             | sed -e '1 s/^/{/' -e '$$ s/$$/}/' | python conf-parser.py >> $@; \
         done
	$(ECHO) '  <preference name="conf_bookmark_tag_order" value="" />' >> $@
	$(ECHO) '  <preference name="conf_bookmark_tag_aliases" value="" />' >> $@
	sed -e '1,/@CONFIG@/d' < $< >> $@

$(CONFIG_JS): $(SRC_USERJS)
	$(ECHO) -ne 'var conf_schema = {\r\n' > $@
	@a=1;for f in $(SRC_USERJS); do \
           test $$a = 1 && a=0 || $(ECHO) -ne ',\r\n' >> $@; \
           sed -e '1,/__CONFIG_BEGIN__/d' -e '/__CONFIG_END__/,$$d' < $$f >> $@; \
         done
	$(ECHO) -ne '};\r\n' >> $@

$(PARSER_JS): $(SRC_USERJS)
	$(ECHO) -ne 'var parser = {\r\n' > $@
	@a=1;for f in $(SRC_USERJS); do \
           test $$a = 1 && a=0 || $(ECHO) -ne ',\r\n' >> $@; \
           sed -e '1,/__PARSER_FUNCTIONS_BEGIN__/d' -e '/__PARSER_FUNCTIONS_END__/,$$d' < $$f >> $@; \
         done
	$(ECHO) -ne '};\r\n' >> $@

$(ICON_FILES): $(ICON_SVG)
	$(RSVG_CONVERT) $< -w $(@:$(ICON_PREFIX)%$(ICON_SUFFIX)=%) -o $@
$(ICON_FILES_SAFARI): $(ICON_SVG)
	$(RSVG_CONVERT) $< -w $(@:Icon-%$(ICON_SUFFIX)=%) -o $@

$(SIGNATURE): $(SIGN_FILES)
	./create_signature.sh $^ > $@

$(OEX): $(DIST_FILES)
	@for kw in $(WARN_KEYWORDS_W); do \
           grep -Hn $$kw $(SRC_USERJS) | grep -v window.$$kw | grep -v '/\* WARN \*/' || : ; \
         done
	@for kw in $(WARN_KEYWORDS_P); do \
           grep -Hn "\\.$$kw(" $(SRC_USERJS) | grep -v '/\* WARN \*/' || : ; \
         done
	$(ZIP) -r $@ $^

$(GREASEMONKEY_JS): $(SRC_USERJS)
	sed -e '/__OPERA_BEGIN__/,/__OPERA_END__/d' -e '/__GREASEMONKEY_BEGIN__/d' -e '/__GREASEMONKEY_END__/d' < $< > $@

$(MANIFEST_JSON): $(MANIFEST_JSON).in $(SRC_USERJS)
	sed -e '/@ICONS@/,$$d' < $< > $@
	@first=1;for size in $(ICON_SIZE); do \
           test $$first -eq 1 && first=0 || $(ECHO) -ne ',\r\n' >> $@; \
           $(ECHO) -n "    \"$$size\": \"$(ICON_PREFIX)$$size$(ICON_SUFFIX)\"" >> $@; \
         done
	$(ECHO) -ne '\r\n' >> $@;
	sed -e '1,/@ICONS@/d' -e 's/@VERSION@/$(VERSION)/' -e 's/@DESCRIPTION@/$(DESCRIPTION)/' < $< >> $@

$(CRX): $(MANIFEST_JSON) $(SRC_USERJS)
	rm -rf $(CRX_TMP_DIR)
	mkdir -p $(CRX_TMP_DIR)/$(CRX:.crx=)
	cp $(MANIFEST_JSON) $(CRX_TMP_DIR)/$(CRX:.crx=)
	cp $(SRC_USERJS) $(CRX_TMP_DIR)/$(CRX:.crx=)/$(shell dirname $(SRC_USERJS))
	@for size in $(ICON_SIZE); do \
           mkdir -p $(CRX_TMP_DIR)/$(CRX:.crx=)/$(shell dirname $(ICON_PREFIX)$$size$(ICON_SUFFIX)); \
           cp $(ICON_PREFIX)$$size$(ICON_SUFFIX) \
             $(CRX_TMP_DIR)/$(CRX:.crx=)/$(shell dirname $(ICON_PREFIX)$$size$(ICON_SUFFIX)); \
         done
	@test -f $(CRX:.crx=.pem) && \
           $(CHROME) --pack-extension=$(CRX_TMP_DIR)/$(CRX:.crx=) --pack-extension-key=$(CRX:.crx=.pem) || \
           $(CHROME) --pack-extension=$(CRX_TMP_DIR)/$(CRX:.crx=)
	mv $(CRX_TMP_DIR)/$(CRX) ./
	@test -f $(CRX_TMP_DIR)/$(CRX:.crx=.pem) && mv $(CRX_TMP_DIR)/$(CRX:.crx=.pem) ./ || :

$(INFO_PLIST): $(INFO_PLIST).in
	sed -e 's/@VERSION@/$(VERSION)/' < $< > $@

$(SAFARIEXTZ): $(INFO_PLIST) $(SRC_USERJS) $(ICON_FILES_SAFARI)
	rm -rf $(SAFARIEXTZ_TMP_DIR)
	mkdir -p $(SAFARIEXTZ_TMP_DIR)/$(SAFARIEXTZ:.safariextz=.safariextension)/$(shell dirname $(SRC_USERJS))
	cp $(INFO_PLIST) $(SAFARIEXTZ_TMP_DIR)/$(SAFARIEXTZ:.safariextz=.safariextension)
	cp $(SRC_USERJS) $(SAFARIEXTZ_TMP_DIR)/$(SAFARIEXTZ:.safariextz=.safariextension)/$(shell dirname $(SRC_USERJS))
	@for file in $(ICON_FILES_SAFARI); do \
           cp $$file $(SAFARIEXTZ_TMP_DIR)/$(SAFARIEXTZ:.safariextz=.safariextension); \
         done
	cd $(SAFARIEXTZ_TMP_DIR) && \
          $(XAR) -cf ../$@ $(SAFARIEXTZ:.safariextz=.safariextension) && \
          : | openssl dgst -sign ../$(SAFARIEXTZ_PRIV) -binary | wc -c > siglen.txt && \
          $(XAR) --sign -f ../$@ --data-to-sign sha1_hash.dat --sig-size `cat siglen.txt` $(SAFARIEXTZ_CERTS:%=--cert-loc ../%) && \
          (echo "3021300906052B0E03021A05000414" | xxd -r -p; cat sha1_hash.dat) | openssl rsautl -sign -inkey ../$(SAFARIEXTZ_PRIV) > signature.dat && \
          $(XAR) --inject-sig signature.dat -f ../$@

clean:
	rm -rf $(CRX_TMP_DIR) $(SAFARIEXTZ_TMP_DIR)
	rm -f $(CONFIG_XML) $(CONFIG_JS) $(PARSER_JS) $(ICON_FILES) $(SIGNATURE) $(OEX) \
              $(GREASEMONKEY_JS) $(MANIFEST_JSON) $(CRX) \
              $(INFO_PLIST) $(SAFARIEXTZ) $(ICON_FILES_SAFARI)
