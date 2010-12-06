RSVG_CONVERT ?= rsvg-convert
ZIP          ?= zip
ICON_SIZE_D  ?= 60
ICON_SIZE    ?= 18 60 128
OEX           = pixplus.oex

CONFIG_XML    = config.xml
ICON_PREFIX   = icons/pixplus_
ICON_SUFFIX   = .png
ICON_FILES    = $(ICON_SIZE:%=$(ICON_PREFIX)%$(ICON_SUFFIX))
SIGNATURE     = signature1.xml
SRC_USERJS    = includes/pixplus.js
SIGN_FILES    = $(CONFIG_XML) $(SRC_USERJS) $(ICON_FILES)
DIST_FILES    = $(SIGN_FILES) index.html
VERSION       = $(shell grep '^// @version' $(SRC_USERJS) | sed -e 's/.*@version\s*//')

WARN_KEYWORDS = location jQuery rating_ef countup_rating send_quality_rating IllustRecommender Effect

all: $(OEX)
dist: $(OEX)

$(CONFIG_XML): $(CONFIG_XML).in
	sed -e '/@ICONS@/,$$d' -e 's/@VERSION@/$(VERSION)/' < $< > $@
	echo '  <icon src="$(ICON_PREFIX)$(ICON_SIZE_D)$(ICON_SUFFIX)" />' >> $@
	@for size in $(ICON_SIZE);do \
           test $$size != $(ICON_SIZE_D) && \
             echo "  <icon src=\"$(ICON_PREFIX)$$size$(ICON_SUFFIX)\" />" >> $@; \
         done
	sed -e '1,/@ICONS@/d' < $< >> $@

$(ICON_FILES): icons/pixplus.svg
	$(RSVG_CONVERT) $< -w $(@:$(ICON_PREFIX)%$(ICON_SUFFIX)=%) -o $@

$(SIGNATURE): $(SIGN_FILES)
	./create_signature.sh $^ > $@

$(OEX): $(DIST_FILES)
	@for kw in $(WARN_KEYWORDS);do \
           grep -Hn $$kw $(SRC_USERJS) | grep -v window.$$kw | grep -v '/\* WARN \*/' || : ; \
         done
	$(ZIP) -r $@ $^

clean:
	rm -f $(CONFIG_XML) $(ICON_FILES) $(SIGNATURE) $(OEX)
