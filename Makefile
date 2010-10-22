RSVG_CONVERT ?= rsvg-convert
ZIP          ?= zip
ICON_SIZE    ?= 18 60 128
OEX           = pixplus.oex

ICON_FILES    = $(ICON_SIZE:%=icons/pixplus_%.png)

all: $(OEX)
dist: $(OEX)

$(ICON_FILES): icons/pixplus.svg
	$(RSVG_CONVERT) $< -w $(@:icons/pixplus_%.png=%) -o $@

$(OEX): config.xml includes/pixplus.js $(ICON_FILES)
	$(ZIP) -r $@ $^

clean:
	rm -f $(OEX) $(ICON_FILES)
