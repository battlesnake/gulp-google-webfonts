PATH := ./node_modules/.bin:$(PATH)

out := out

fonts_list := fonts.list
fonts_dir := fonts
css_dir := css
css_filename := fonts.css

.PHONY: default fonts clean

default: fonts

clean:
	rm -rf -- $(out)

fonts:
	google-webfonts < $(fonts_list) --out-base-dir $(out) --fonts-dir $(fonts_dir) --css-dir $(css_dir) --css-filename $(css_filename)
