OEX = pixplus.oex

all: $(OEX)
dist: $(OEX)

pixplus.png: pixplus.svg
	rsvg-convert $< -w 60 -o $@

$(OEX): config.xml includes/pixplus.js pixplus.png
	zip -r $@ $^

clean:
	rm -f $(OEX)
