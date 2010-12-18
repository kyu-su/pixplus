RSVG_CONVERT    ?= rsvg-convert
ZIP             ?= zip
ICON_SIZE       ?= 64 16
OEX              = pixplus.oex

CONFIG_XML       = config.xml
INDEX_CONFIG_JS  = index_config.js
ICON_PREFIX      = icons/pixplus_
ICON_SUFFIX      = .png
ICON_FILES       = $(ICON_SIZE:%=$(ICON_PREFIX)%$(ICON_SUFFIX))
ICON_SVG         = icons/pixplus.svg
SIGNATURE        = signature1.xml
SRC_USERJS       = includes/pixplus.js
SIGN_FILES       = $(CONFIG_XML) $(SRC_USERJS) $(ICON_FILES)
DIST_FILES       = $(SIGN_FILES) common.js index.html index.js $(INDEX_CONFIG_JS) options.html options.css
VERSION          = $(shell grep '^// @version' $(SRC_USERJS) | sed -e 's/.*@version\s*//')

WARN_KEYWORDS_W  = location jQuery rating_ef countup_rating send_quality_rating IllustRecommender Effect sendRequest
WARN_KEYWORDS_P  = $(shell cat prototypejs_funcs.txt)

all: $(OEX)
dist: $(OEX)

$(CONFIG_XML): $(CONFIG_XML).in
	sed -e '/@ICONS@/,$$d' -e 's/@VERSION@/$(VERSION)/' < $< > $@
	@for size in $(ICON_SIZE);do \
           echo "  <icon src=\"$(ICON_PREFIX)$$size$(ICON_SUFFIX)\" />" >> $@; \
         done
	echo "  <icon src=\"$(ICON_SVG)\" />" >> $@;
	sed -e '1,/@ICONS@/d' -e '/@CONFIG@/,$$d' < $< >> $@
	sed -e '1,/\/\* __CONFIG_BEGIN__ \*\//d' -e '/\/\* __CONFIG_END__ \*\//,$$d' < includes/pixplus.js \
          | sed -e '1 s/^/{/' -e '$$ s/$$/}/' | python conf-parser.py >> $@
	sed -e '1,/@CONFIG@/d' < $< >> $@

$(INDEX_CONFIG_JS):
	/bin/echo -ne 'var conf_schema = {\r\n' > $@
	sed -e '1,/\/\* __CONFIG_BEGIN__ \*\//d' -e '/\/\* __CONFIG_END__ \*\//,$$d' < includes/pixplus.js >> $@
	/bin/echo -ne '};\r\n' >> $@

$(ICON_FILES): $(ICON_SVG)
	$(RSVG_CONVERT) $< -w $(@:$(ICON_PREFIX)%$(ICON_SUFFIX)=%) -o $@

$(SIGNATURE): $(SIGN_FILES)
	./create_signature.sh $^ > $@

$(OEX): $(DIST_FILES)
	@for kw in $(WARN_KEYWORDS_W);do \
           grep -Hn $$kw $(SRC_USERJS) | grep -v window.$$kw | grep -v '/\* WARN \*/' || : ; \
         done
	@for kw in $(WARN_KEYWORDS_P);do \
           grep -Hn "\\.$$kw(" $(SRC_USERJS) | grep -v '/\* WARN \*/' || : ; \
         done
	$(ZIP) -r $@ $^

clean:
	rm -f $(CONFIG_XML) $(INDEX_CONFIG_JS) $(ICON_FILES) $(SIGNATURE) $(OEX)
