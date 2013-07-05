RSVG_CONVERT                    = rsvg-convert
ZIP                             = zip
CRXMAKE                         = $(CURDIR)/ext/crxmake/bin/crxmake
XAR                             = $(CURDIR)/ext/xar/xar/src/xar
PYTHON2                         = python2.7

LICENSE                         = LICENSE.TXT
ICON_SVG                        = pixplus.svg
SRC_USERJS                      = pixplus.js

BUILD_OEX                       = $(shell which "$(ZIP)" >/dev/null 2>&1 && echo yes || echo no)
BUILD_CRX                       = $(shell test -x "$(CRXMAKE)" && echo yes || echo no)
BUILD_SAFARIEXTZ                = $(shell test -x "$(XAR)" && $(XAR) --help 2>&1 | grep sign >/dev/null && echo yes || echo no)

VERSION                         = $(shell grep '^// @version' $(SRC_USERJS) | sed -e 's/.*@version *//')
DESCRIPTION                     = $(shell grep '^// @description' $(SRC_USERJS) | sed -e 's/.*@description *//')
WEBSITE                         = http://crckyl.ath.cx/pixplus/
WEBSITE_SED                     = $(shell echo $(WEBSITE) | sed -e 's/\//\\\//g')

BUILD_DIR                       = $(CURDIR)/temp
BUILD_DIR_ICON                  = $(BUILD_DIR)/icons
BUILD_DIR_OEX                   = $(BUILD_DIR)/oex
BUILD_DIR_CRX                   = $(BUILD_DIR)/crx
BUILD_DIR_SAFARIEXTZ            = $(BUILD_DIR)/pixplus.safariextension

FEED_ATOM                       = feed.atom
CHANGELOG_JSON                  = changelog.json

DIST_DIR                        = $(CURDIR)/bin
OPERA_USERJS                    = $(DIST_DIR)/pixplus.js
GREASEMONKEY_JS                 = $(DIST_DIR)/pixplus.user.js
OEX                             = $(DIST_DIR)/pixplus.oex
CRX                             = $(DIST_DIR)/pixplus.crx
SAFARIEXTZ                      = $(DIST_DIR)/pixplus.safariextz

LIB_JS                          = $(BUILD_DIR)/lib.js
DATA_JS                         = $(BUILD_DIR)/data.js
CONFIG_JSON                     = $(BUILD_DIR)/config.json
ICON_SIZE                       = 16 32 48 64 128
ICON_FILES                      = $(ICON_SIZE:%=$(BUILD_DIR_ICON)/%.png)
DIST_FILES_ROOT                 = $(LICENSE) common.js $(wildcard index.*) $(wildcard options.*)
DIST_FILES_BUILD                = $(notdir $(LIB_JS) $(DATA_JS))
DIST_FILES_ALL                  = $(DIST_FILES_ROOT) $(DIST_FILES_BUILD)

OEX_USERJS                      = $(BUILD_DIR_OEX)/includes/$(SRC_USERJS)
OEX_CONFIG_XML_IN               = $(CURDIR)/opera/config.xml.in
OEX_CONFIG_XML                  = $(BUILD_DIR_OEX)/config.xml
OEX_ICON_DIR                    = icons
OEX_ICON_FILES                  = $(ICON_SIZE:%=$(BUILD_DIR_OEX)/$(OEX_ICON_DIR)/%.png)
OEX_DIST_FILES                  = $(DIST_FILES_ALL:%=$(BUILD_DIR_OEX)/%) \
                                  $(OEX_USERJS) $(OEX_CONFIG_XML) $(OEX_ICON_FILES)

CRX_SIGN_KEY                    = $(CURDIR)/chrome/sign/$(notdir $(CRX)).pem
CRX_MANIFEST_JSON_IN            = $(CURDIR)/chrome/manifest.json.in
CRX_USERJS                      = $(BUILD_DIR_CRX)/$(SRC_USERJS)
CRX_MANIFEST_JSON               = $(BUILD_DIR_CRX)/manifest.json
CRX_ICON_DIR                    = icons
CRX_ICON_FILES                  = $(ICON_SIZE:%=$(BUILD_DIR_CRX)/$(CRX_ICON_DIR)/%.png)
CRX_DIST_FILES                  = $(DIST_FILES_ALL:%=$(BUILD_DIR_CRX)/%) \
                                  $(CRX_USERJS) $(CRX_MANIFEST_JSON) $(CRX_ICON_FILES)

SAFARIEXTZ_CERTS                = $(sort $(wildcard $(CURDIR)/safari/sign/cert??))
SAFARIEXTZ_SIGN_KEY             = $(CURDIR)/safari/sign/key.pem
SAFARIEXTZ_INFO_PLIST_IN        = $(CURDIR)/safari/Info.plist.in
SAFARIEXTZ_SETTINGS_PLIST_IN    = $(CURDIR)/safari/Settings.plist.in
SAFARIEXTZ_USERJS               = $(BUILD_DIR_SAFARIEXTZ)/$(SRC_USERJS)
SAFARIEXTZ_INFO_PLIST           = $(BUILD_DIR_SAFARIEXTZ)/Info.plist
SAFARIEXTZ_SETTINGS_PLIST       = $(BUILD_DIR_SAFARIEXTZ)/Settings.plist
SAFARIEXTZ_ICON_FILES           = $(ICON_SIZE:%=$(BUILD_DIR_SAFARIEXTZ)/Icon-%.png)
SAFARIEXTZ_DIST_FILES           = $(DIST_FILES_ALL:%=$(BUILD_DIR_SAFARIEXTZ)/%) \
                                  $(SAFARIEXTZ_USERJS) $(SAFARIEXTZ_INFO_PLIST) \
                                  $(SAFARIEXTZ_SETTINGS_PLIST) $(SAFARIEXTZ_ICON_FILES)

ALL_TARGETS                     = $(OPERA_USERJS) $(GREASEMONKEY_JS)

ifeq ($(BUILD_OEX),yes)
ALL_TARGETS                    += $(OEX)
endif

ifeq ($(BUILD_CRX),yes)
ALL_TARGETS                    += $(CRX)
endif

ifeq ($(BUILD_SAFARIEXTZ),yes)
ALL_TARGETS                    += $(SAFARIEXTZ)
endif

all: $(ALL_TARGETS) feeds
	@echo '$(notdir $(GREASEMONKEY_JS)):    yes'
	@echo '$(notdir $(OEX)):        $(BUILD_OEX)'
	@echo '$(notdir $(CRX)):        $(BUILD_CRX)'
	@echo '$(notdir $(SAFARIEXTZ)): $(BUILD_SAFARIEXTZ)'

deps: $(XAR)

$(XAR):
	@cd ext/xar/xar && ./autogen.sh && $(MAKE)

clean: clean-feeds
	@echo 'Cleaning'
	@rm -rf $(BUILD_DIR) $(DIST_DIR)

# ================ Feeds ================

$(FEED_ATOM): $(CHANGELOG_JSON)
	@echo 'Generate: $(@:$(CURDIR)/%=%)'
	@$(PYTHON2) feed_atom.py < $< > $@
	@echo

feeds: $(FEED_ATOM)

clean-feeds:
	@rm -f $(FEED_ATOM)

# ================ Opera UserJS ================

$(OPERA_USERJS): $(SRC_USERJS)
	@echo 'Copy: $(<:$(CURDIR)/%=%) => $(@:$(CURDIR)/%=%)'
	@mkdir -p $(dir $@)
	@cp $< $@

# ================ GreaseMonkey ================

$(GREASEMONKEY_JS): $(SRC_USERJS)
	@echo 'Generate: $(@:$(CURDIR)/%=%)'
	@mkdir -p $(dir $@)
	@sed -e '/__GREASEMONKEY_REMOVE__/d' < $< > $@
	@echo

# ================ Extension common files ================

$(LIB_JS): $(SRC_USERJS)
	@echo 'Generate: $(@:$(CURDIR)/%=%)'
	@mkdir -p $(dir $@)
	@echo '// this file was automatically generated from $<' > $@
	@echo '(function(g, w, d) {' >> $@
	@sed -e '1,/__LIBRARY_BEGIN__/d' -e '/__LIBRARY_END__/,$$d' < $(SRC_USERJS) | tr -d '\r' >> $@
	@echo '})(this, this.window, this.window.document);' >> $@

$(DATA_JS): $(SRC_USERJS)
	@echo 'Generate: $(@:$(CURDIR)/%=%)'
	@mkdir -p $(dir $@)
	@echo '// this file was automatically generated from $<' > $@
	@echo '(function(g, w, d, _) {' >> $@
	@sed -e '1,/__DATA_BEGIN__/d' -e '/__DATA_END__/,$$d' < $(SRC_USERJS) | tr -d '\r' >> $@
	@echo '})(this, this.window, this.window.document, this.window.pixplus);' >> $@

$(CONFIG_JSON): $(SRC_USERJS)
	@echo 'Generate: $(@:$(CURDIR)/%=%)'
	@mkdir -p $(dir $@)
	@echo '{"comment": "this file was automatically generated from $<", "data": [' > $@
	@sed -e '1,/__CONFIG_BEGIN__/d' -e '/__CONFIG_END__/,$$d' < $(SRC_USERJS) >> $@
	@echo ']}' >> $@

$(CHANGELOG_JSON): $(SRC_USERJS)
	@echo 'Generate: $(@:$(CURDIR)/%=%)'
	@echo '{"comment": "this file was automatically generated from $<", "data": [' > $@
	@sed -e '1,/__CHANGELOG_BEGIN__/d' -e '/__CHANGELOG_END__/,$$d' < $(SRC_USERJS) >> $@
	@echo ']}' >> $@

$(ICON_FILES): $(ICON_SVG)
	@echo 'Generate: $(@:$(CURDIR)/%=%)'
	@mkdir -p $(dir $@)
	@cp $< $@
	@$(RSVG_CONVERT) $< -w $(basename $(notdir $@)) -o $@

# ================ Opera ================

$(OEX_CONFIG_XML): $(OEX_CONFIG_XML_IN) $(SRC_USERJS) $(CONFIG_JSON)
	@echo 'Generate: $(@:$(CURDIR)/%=%)'
	@mkdir -p $(dir $@)
	@sed -e '/@LICENSE@/,$$d' \
             -e 's/@VERSION@/$(VERSION)/' \
             -e 's/@DESCRIPTION@/$(DESCRIPTION)/' \
             -e 's/@WEBSITE@/$(WEBSITE_SED)/' \
           < $< > $@
	@echo '  <license>' >> $@
	@cat $(LICENSE) >> $@
	@echo '  </license>' >> $@
	@sed -e '1,/@LICENSE@/d' -e '/@ICONS@/,$$d' < $< >> $@
	@for size in $(ICON_SIZE); do echo "  <icon src=\"$(OEX_ICON_DIR)/$$size.png\" />" >> $@; done
	@sed -e '1,/@ICONS@/d' -e '/@CONFIG@/,$$d' < $< >> $@
	@$(PYTHON2) conf-parser.py opera < $(CONFIG_JSON) >> $@
	@sed -e '1,/@CONFIG@/d' < $< >> $@

$(OEX_USERJS): $(SRC_USERJS)
	@echo 'Copy: $(<:$(CURDIR)/%=%) => $(@:$(CURDIR)/%=%)'
	@mkdir -p $(dir $@)
	@cp $< $@

$(DIST_FILES_ROOT:%=$(BUILD_DIR_OEX)/%): $(BUILD_DIR_OEX)/%: %
	@echo 'Copy: $(<:$(CURDIR)/%=%) => $(@:$(CURDIR)/%=%)'
	@mkdir -p $(dir $@)
	@cp $< $@

$(DIST_FILES_BUILD:%=$(BUILD_DIR_OEX)/%): $(BUILD_DIR_OEX)/%: $(BUILD_DIR)/%
	@echo 'Copy: $(<:$(CURDIR)/%=%) => $(@:$(CURDIR)/%=%)'
	@mkdir -p $(dir $@)
	@cp $< $@

$(OEX_ICON_FILES): $(BUILD_DIR_OEX)/$(OEX_ICON_DIR)/%: $(BUILD_DIR_ICON)/%
	@echo 'Copy: $(<:$(CURDIR)/%=%) => $(@:$(CURDIR)/%=%)'
	@mkdir -p $(dir $@)
	@cp $< $@

$(OEX): $(OEX_DIST_FILES)
	@echo 'Generate: $(@:$(CURDIR)/%=%)'
	@cd $(BUILD_DIR_OEX) && $(ZIP) -qr $@ *
	@echo

# ================ Chrome ================

$(CRX_MANIFEST_JSON): $(CRX_MANIFEST_JSON_IN) $(SRC_USERJS)
	@echo 'Generate: $(@:$(CURDIR)/%=%)'
	@sed -e '/@ICONS@/,$$d' \
             -e 's/@VERSION@/$(VERSION)/' \
             -e 's/@DESCRIPTION@/$(DESCRIPTION)/' \
           < $< | tr -d '\r' > $@
	@first=1;for size in $(ICON_SIZE); do \
           test $$first -eq 1 && first=0 || echo ',' >> $@; \
           /bin/echo -n "    \"$$size\": \"$(CRX_ICON_DIR)/$$size.png\"" >> $@; \
         done
	@echo >> $@;
	@sed -e '1,/@ICONS@/d' \
             -e 's/@VERSION@/$(VERSION)/' \
             -e 's/@WEBSITE@/$(WEBSITE_SED)/' \
           < $< | tr -d '\r' >> $@

$(CRX_USERJS): $(SRC_USERJS)
	@echo 'Copy: $(<:$(CURDIR)/%=%) => $(@:$(CURDIR)/%=%)'
	@mkdir -p $(dir $@)
	@cp $< $@

$(DIST_FILES_ROOT:%=$(BUILD_DIR_CRX)/%): $(BUILD_DIR_CRX)/%: %
	@echo 'Copy: $(<:$(CURDIR)/%=%) => $(@:$(CURDIR)/%=%)'
	@mkdir -p $(dir $@)
	@cp $< $@

$(DIST_FILES_BUILD:%=$(BUILD_DIR_CRX)/%): $(BUILD_DIR_CRX)/%: $(BUILD_DIR)/%
	@echo 'Copy: $(<:$(CURDIR)/%=%) => $(@:$(CURDIR)/%=%)'
	@mkdir -p $(dir $@)
	@cp $< $@

$(CRX_ICON_FILES): $(BUILD_DIR_CRX)/$(CRX_ICON_DIR)/%: $(BUILD_DIR_ICON)/%
	@echo 'Copy: $(<:$(CURDIR)/%=%) => $(@:$(CURDIR)/%=%)'
	@mkdir -p $(dir $@)
	@cp $< $@

$(CRX): $(CRX_DIST_FILES)
	@echo 'Generate: $(@:$(CURDIR)/%=%)'
ifeq ($(wildcard $(CRX_SIGN_KEY)),)
	@echo 'Warn: $(CRX_SIGN_KEY:$(CURDIR)/%=%) not found'
	@$(CRXMAKE) --pack-extension=$(BUILD_DIR_CRX) --extension-output=$@ --key-output=$(BUILD_DIR)/$(notdir $(CRX_SIGN_KEY))
else
	@$(CRXMAKE) --pack-extension=$(BUILD_DIR_CRX) --pack-extension-key=$(CRX_SIGN_KEY) --extension-output=$@
endif
	@echo

# ================ Safari ================

$(SAFARIEXTZ_INFO_PLIST): $(SAFARIEXTZ_INFO_PLIST_IN)
	@echo 'Generate: $(@:$(CURDIR)/%=%)'
	@mkdir -p $(dir $@)
	@sed -e 's/@VERSION@/$(VERSION)/' \
             -e 's/@WEBSITE@/$(WEBSITE_SED)/' \
           < $< > $@

$(SAFARIEXTZ_SETTINGS_PLIST): $(SAFARIEXTZ_SETTINGS_PLIST_IN) $(CONFIG_JSON)
	@echo 'Generate: $(@:$(CURDIR)/%=%)'
	@mkdir -p $(dir $@)
	@sed -e '/__SETTINGS__/,$$d' < $< > $@
	@$(PYTHON2) conf-parser.py safari < $(CONFIG_JSON) >> $@
	@sed -e '1,/__SETTINGS__/d' < $< >> $@

$(SAFARIEXTZ_USERJS): $(SRC_USERJS)
	@echo 'Copy: $(<:$(CURDIR)/%=%) => $(@:$(CURDIR)/%=%)'
	@mkdir -p $(dir $@)
	@cp $< $@

$(DIST_FILES_ROOT:%=$(BUILD_DIR_SAFARIEXTZ)/%): $(BUILD_DIR_SAFARIEXTZ)/%: %
	@echo 'Copy: $(<:$(CURDIR)/%=%) => $(@:$(CURDIR)/%=%)'
	@mkdir -p $(dir $@)
	@cp $< $@

$(DIST_FILES_BUILD:%=$(BUILD_DIR_SAFARIEXTZ)/%): $(BUILD_DIR_SAFARIEXTZ)/%: $(BUILD_DIR)/%
	@echo 'Copy: $(<:$(CURDIR)/%=%) => $(@:$(CURDIR)/%=%)'
	@mkdir -p $(dir $@)
	@cp $< $@

$(SAFARIEXTZ_ICON_FILES): $(BUILD_DIR_SAFARIEXTZ)/Icon-%: $(BUILD_DIR_ICON)/%
	@echo 'Copy: $(<:$(CURDIR)/%=%) => $(@:$(CURDIR)/%=%)'
	@mkdir -p $(dir $@)
	@cp $< $@

$(SAFARIEXTZ): $(SAFARIEXTZ_DIST_FILES)
	@echo 'Generate: $(@:$(CURDIR)/%=%)'
	@$(XAR) -C $(dir $(BUILD_DIR_SAFARIEXTZ)) -cf $@ $(notdir $(BUILD_DIR_SAFARIEXTZ))
ifeq ($(wildcard $(SAFARIEXTZ_SIGN_KEY)),)
	@echo 'Warn: $(SAFARIEXTZ_SIGN_KEY:$(CURDIR)/%=%) not found'
else
	@echo 'Sign: $(@:$(CURDIR)/%=%)'
	@: | openssl dgst -sign $(SAFARIEXTZ_SIGN_KEY) -binary | wc -c > $(BUILD_DIR)/siglen.txt
	@$(XAR) --sign -f $@ --digestinfo-to-sign $(BUILD_DIR)/digestinfo.dat \
           --sig-size `cat $(BUILD_DIR)/siglen.txt` $(SAFARIEXTZ_CERTS:%=--cert-loc %)
	@openssl rsautl -sign -inkey $(SAFARIEXTZ_SIGN_KEY) -in $(BUILD_DIR)/digestinfo.dat -out $(BUILD_DIR)/signature.dat
	@$(XAR) --inject-sig $(BUILD_DIR)/signature.dat -f $@ >/dev/null
endif
	@chmod 644 $@
	@echo
