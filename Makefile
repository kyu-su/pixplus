OEX = pixplus.oex

all: $(OEX)
dist: $(OEX)

$(OEX): config.xml includes pixplus_16.png pixplus_64.png
	zip -r $@ $^ --exclude '*/.svn/*'

clean:
	rm -f $(OEX)
