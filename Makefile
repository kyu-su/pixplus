OEX = pixplus.oex

all: $(OEX)
dist: $(OEX)

pixplus_60.png: pixplus.svg
	rsvg-convert $< -w 60 -o $@
pixplus_200.png: pixplus.svg
	rsvg-convert $< -w 200 -o $@

$(OEX): config.xml includes pixplus_60.png pixplus_200.png
	zip -r $@ $^ --exclude '*/.svn/*'

clean:
	rm -f $(OEX)
