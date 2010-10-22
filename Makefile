RSVG_CONVERT ?= rsvg-convert
ZIP          ?= zip
ICON_SIZE_D  ?= 60
ICON_SIZE    ?= 18 60 128
OEX           = pixplus.oex

CONFIG_XML    = config.xml
ICON_PREFIX   = icons/pixplus_
ICON_SUFFIX   = .png
ICON_FILES    = $(ICON_SIZE:%=$(ICON_PREFIX)%$(ICON_SUFFIX))

all: $(OEX)
dist: $(OEX)

$(CONFIG_XML): $(CONFIG_XML).in
	sed -e '/@ICONS@/,$$d' < $< > $@
	echo '  <icon src="$(ICON_PREFIX)$(ICON_SIZE_D)$(ICON_SUFFIX)" />' >> $@
	@for size in $(ICON_SIZE);do \
           test $$size != $(ICON_SIZE_D) && \
             echo "  <icon src=\"$(ICON_PREFIX)$$size$(ICON_SUFFIX)\" />" >> $@; \
         done
	sed -e '1,/@ICONS@/d' < $< >> $@

$(ICON_FILES): icons/pixplus.svg
	$(RSVG_CONVERT) $< -w $(@:$(ICON_PREFIX)%$(ICON_SUFFIX)=%) -o $@

$(OEX): $(CONFIG_XML) includes/pixplus.js $(ICON_FILES)
	$(ZIP) -r $@ $^

clean:
	rm -f $(CONFIG_XML) $(ICON_FILES) $(OEX)
