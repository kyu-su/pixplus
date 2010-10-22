OEX = pixplus.oex

all: $(OEX)
dist: $(OEX)

pixplus_128.png: pixplus.svg
	rsvg-convert $< -w 128 -o $@

$(OEX): config.xml includes pixplus_128.png
	zip -r $@ $^ --exclude '*/.svn/*'

clean:
	rm -f $(OEX)
