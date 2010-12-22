RSVG_CONVERT    ?= rsvg-convert
ECHO            ?= /bin/echo
ZIP             ?= zip
ICON_SIZE       ?= 64 16
OEX              = pixplus.oex
CRX              = pixplus.crx

CONFIG_XML       = config.xml
CONFIG_JS        = config.js
PARSER_JS        = parser.js
ICON_PREFIX      = icons/pixplus_
ICON_SUFFIX      = .png
ICON_FILES       = $(ICON_SIZE:%=$(ICON_PREFIX)%$(ICON_SUFFIX))
ICON_SVG         = icons/pixplus.svg
SIGNATURE        = signature1.xml
SRC_USERJS       = includes/pixplus.js
SIGN_FILES       = $(CONFIG_XML) $(SRC_USERJS) $(ICON_FILES)
DIST_FILES       = $(SIGN_FILES) $(CONFIG_JS) $(PARSER_JS) common.js index.html index.js options.html options.css
VERSION          = $(shell grep '^// @version' $(SRC_USERJS) | sed -e 's/.*@version\s*//')
DESCRIPTION      = $(shell grep '^// @description' $(SRC_USERJS) | sed -e 's/.*@description\s*//')

CRX_TMP_DIR      = .crx
MANIFEST_JSON    = manifest.json

WARN_KEYWORDS_W  = location jQuery rating_ef countup_rating send_quality_rating IllustRecommender Effect sendRequest
WARN_KEYWORDS_P  = $(shell cat prototypejs_funcs.txt)

all: $(OEX)
dist: $(OEX)

$(CONFIG_XML): $(CONFIG_XML).in $(SRC_USERJS)
	sed -e '/@ICONS@/,$$d' -e 's/@VERSION@/$(VERSION)/' -e 's/@DESCRIPTION@/$(DESCRIPTION)/' < $< > $@
	@for size in $(ICON_SIZE); do \
           $(ECHO) "  <icon src=\"$(ICON_PREFIX)$$size$(ICON_SUFFIX)\" />" >> $@; \
         done
	$(ECHO) "  <icon src=\"$(ICON_SVG)\" />" >> $@;
	sed -e '1,/@ICONS@/d' -e '/@CONFIG@/,$$d' < $< >> $@
	@for f in $(SRC_USERJS); do \
           sed -e '1,/\/\* __CONFIG_BEGIN__ \*\//d' -e '/\/\* __CONFIG_END__ \*\//,$$d' < $$f \
             | sed -e '1 s/^/{/' -e '$$ s/$$/}/' | python conf-parser.py >> $@; \
         done
	$(ECHO) '  <preference name="conf_bookmark_tag_order" value="" />' >> $@
	$(ECHO) '  <preference name="conf_bookmark_tag_aliases" value="" />' >> $@
	sed -e '1,/@CONFIG@/d' < $< >> $@

$(CONFIG_JS): $(SRC_USERJS)
	$(ECHO) -ne 'var conf_schema = {\r\n' > $@
	@a=1;for f in $(SRC_USERJS); do \
           test $$a = 1 && a=0 || $(ECHO) -ne ',\r\n' >> $@; \
           sed -e '1,/\/\* __CONFIG_BEGIN__ \*\//d' -e '/\/\* __CONFIG_END__ \*\//,$$d' < $$f >> $@; \
         done
	$(ECHO) -ne '};\r\n' >> $@

$(PARSER_JS): $(SRC_USERJS)
	$(ECHO) -ne 'var parser = {\r\n' > $@
	@a=1;for f in $(SRC_USERJS); do \
           test $$a = 1 && a=0 || $(ECHO) -ne ',\r\n' >> $@; \
           sed -e '1,/\/\* __PARSER_FUNCTIONS_BEGIN__ \*\//d' -e '/\/\* __PARSER_FUNCTIONS_END__ \*\//,$$d' < $$f >> $@; \
         done
	$(ECHO) -ne '};\r\n' >> $@

$(ICON_FILES): $(ICON_SVG)
	$(RSVG_CONVERT) $< -w $(@:$(ICON_PREFIX)%$(ICON_SUFFIX)=%) -o $@

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

$(MANIFEST_JSON): $(MANIFEST_JSON).in $(SRC_USERJS)
	sed -e '/@ICONS@/,$$d' -e 's/@VERSION@/$(VERSION)/' -e 's/@DESCRIPTION@/$(DESCRIPTION)/' < $< > $@

$(CRX): $(MANIFEST_JSON) $(SRC_USERJS)
	rm -rf $(CRX_TMP_DIR)
	mkdir -p $(CRX_TMP_DIR)/$(CRX:.crx=)
	mkdir -p $(CRX_TMP_DIR)/$(CRX:.crx=)/$(shell dirname $(SRC_USERJS))
	cp $(MANIFEST_JSON) $(CRX_TMP_DIR)/$(CRX:.crx=)
	cp $(SRC_USERJS) $(CRX_TMP_DIR)/$(CRX:.crx=)/$(shell dirname $(SRC_USERJS))
	@test -f $(CRX:.crx=.pem) && \
           chromium-browser --pack-extension=$(CRX_TMP_DIR)/$(CRX:.crx=) --pack-extension-key=$(CRX:.crx=.pem) || \
           chromium-browser --pack-extension=$(CRX_TMP_DIR)/$(CRX:.crx=)
	mv $(CRX_TMP_DIR)/$(CRX) ./
	@test -f $(CRX_TMP_DIR)/$(CRX:.crx=.pem) && mv $(CRX_TMP_DIR)/$(CRX:.crx=.pem) ./ || :

clean:
	rm -rf $(CRX_TMP_DIR)
	rm -f $(CONFIG_XML) $(CONFIG_JS) $(PARSER_JS) $(ICON_FILES) $(SIGNATURE) $(OEX) \
              $(MANIFEST_JSON) $(CRX)
