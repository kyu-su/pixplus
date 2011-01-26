RSVG_CONVERT         = rsvg-convert
ZIP                  = zip
XAR                  = xar
CHROME               = $(shell ./find_chrome.sh)
OEX                  = pixplus.oex
CRX                  = pixplus.crx
SAFARIEXTZ           = pixplus.safariextz
OEX_TMP_DIR          = .oex
BUILD_OEX            = $(shell which "$(ZIP)" >/dev/null && echo yes || echo no)
BUILD_CRX            = $(shell which "$(CHROME)" >/dev/null && echo yes || echo no)
BUILD_SAFARIEXTZ     = $(shell which "$(XAR)" >/dev/null && $(XAR) --help 2>&1 | grep sign >/dev/null && echo yes || echo no)

CONFIG_JSON          = config.json
CONFIG_JS            = config.js
GREASEMONKEY_JS      = pixplus.user.js
ICON_SVG             = pixplus.svg
SRC_USERJS           = pixplus.js
DIST_FILES           = common.js index.html index.js options.html options.css options.js

OPERA_ROOT           = opera
OPERA_CONFIG_XML     = $(OPERA_ROOT)/config.xml
OPERA_ICON_SIZE      = 64 16 32 48
OPERA_ICON_DIR       = icons
OPERA_ICON_FILES     = $(OPERA_ICON_SIZE:%=$(OPERA_ROOT)/$(OPERA_ICON_DIR)/%.png)
OPERA_DIST_FILES     = $(OPERA_CONFIG_XML) $(OPERA_ROOT)/includes/$(SRC_USERJS) $(OPERA_ICON_FILES) $(OPERA_ROOT)/$(CONFIG_JS) $(DIST_FILES:%=$(OPERA_ROOT)/%)

ALL_TARGETS          =

ifeq ($(BUILD_OEX),yes)
ALL_TARGETS         += $(OEX)
endif
#ifeq ($(BUILD_CRX),yes)
#ALL_TARGETS         += $(CRX)
#endif
#ifeq ($(BUILD_SAFARIEXTZ),yes)
#ALL_TARGETS         += $(SAFARIEXTZ)
#endif

all: $(ALL_TARGETS)
	echo $(ALL_TARGETS)

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

clean: clean-opera
	rm -f $(CONFIG_JSON) $(CONFIG_JS)

# ================ Opera ================

$(OPERA_CONFIG_XML): $(OPERA_CONFIG_XML).in $(SRC_USERJS) $(CONFIG_JSON)
	sed -e '/@ICONS@/,$$d' -e 's/@VERSION@/$(VERSION)/' -e 's/@DESCRIPTION@/$(DESCRIPTION)/' < $< > $@
	@for size in $(OPERA_ICON_SIZE); do echo "  <icon src=\"$(OPERA_ICON_DIR)//$$size.png\" />" >> $@; done
	sed -e '1,/@ICONS@/d' -e '/@CONFIG@/,$$d' < $< >> $@
	python conf-parser.py opera < $(CONFIG_JSON) >> $@
	echo '  <preference name="conf_bookmark_tag_order" value="" />' >> $@
	echo '  <preference name="conf_bookmark_tag_aliases" value="" />' >> $@
	sed -e '1,/@CONFIG@/d' < $< >> $@

$(OPERA_ROOT)/includes/$(SRC_USERJS): $(SRC_USERJS)
	mkdir -p `dirname $@`
	cp $< $@

$(OPERA_ICON_FILES): $(ICON_SVG)
	mkdir -p `dirname $@`
	$(RSVG_CONVERT) $< -w $(@:$(OPERA_ROOT)/$(OPERA_ICON_DIR)/%.png=%) -o $@

$(OPERA_ROOT)/$(CONFIG_JS): $(CONFIG_JS)
	cp $< $@

$(DIST_FILES:%=$(OPERA_ROOT)/%): $(OPERA_ROOT)/%: %
	cp $< $@

$(OEX): $(OPERA_DIST_FILES)
	rm -rf $(OEX_TMP_DIR)
	@for file in $(^:$(OPERA_ROOT)/%=%); do \
           mkdir -p $(OEX_TMP_DIR)/`dirname $$file`; \
           cp $(OPERA_ROOT)/$$file $(OEX_TMP_DIR)/$$file; \
         done
	cd $(OEX_TMP_DIR) && $(ZIP) -r ../$@ *

clean-opera:
	rm -f $(OEX) $(OPERA_CONFIG_XML) $(OPERA_ROOT)/$(CONFIG_JS) $(DIST_FILES:%=$(OPERA_ROOT)/%)
	rm -rf $(OEX_TMP_DIR) $(OPERA_ROOT)/includes $(OPERA_ROOT)/$(OPERA_ICON_DIR)
