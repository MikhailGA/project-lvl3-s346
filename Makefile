install: install-deps install-flow-typed

run:
	npx babel-node -- 'src/bin/page-loader.js' -o /var/tmp https://Hexlet.io/courses

run_open:
	npx babel-node -- 'src/bin/open.js' /var/tmp/hexlet-io-courses.html

run_h:
	npx babel-node -- 'src/bin/page-loader.js' -h

install-deps:
	npm install

install-flow-typed:
	npx flow-typed install

build:
	rm -rf dist
	npm run build

test:
	npm test

check-types:
	npx flow

lint:
	npx eslint .

publish:
	npm publish

.PHONY: test

patch:
	npm version patch

minor:
	npm version minor

major:
	npm version major