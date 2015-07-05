
#
# Binaries.
#

export PATH := ./node_modules/.bin:${PATH}
BIN := ./node_modules/.bin

#
# Wildcards.
#

src = $(shell find src/**/*.js)
tests = $(shell find test/**/*.js)

#
# Targets.
#

$(src): node_modules
$(tests): node_modules

standalone: $(src)
	@mkdir -p dist
	@browserify --standalone deku src/index.js | bfc > dist/deku.js

test: build
	@duo-test browser --commands 'make build'

build: $(tests) $(src)
	@browserify --debug -e test/index.js -t [ babelify --optional es7.asyncFunctions --sourceMapRelative . ] > build.js

saucelabs: build
	@TRAVIS_BUILD_NUMBER=$(CIRCLE_BUILD_NUM) cd test && zuul -- build.js

node_modules: package.json
	@npm install

clean:
	@-rm -rf dist build.js node_modules

lint: $(src)
	standard src/**/*.js

size: standalone
	@minify dist/deku.js | gzip -9 | wc -c

#
# Releases.
#

release: standalone
	bump $$VERSION && \
	git changelog --tag $$VERSION && \
	git commit --all -m "Release $$VERSION" && \
	git tag $$VERSION && \
	git push origin master --tags && \
	npm publish

#
# These tasks will be run every time regardless of dependencies.
#

.PHONY: standalone
.PHONY: clean
.PHONY: lint
.PHONY: size
.PHONY: release
