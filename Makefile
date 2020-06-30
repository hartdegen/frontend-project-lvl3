install:
	npm install
start:
	npx node ../..
build:
	npm run build
publish:
	npm publish --dry-run
lint:
	npx eslint .
test:
	npm test