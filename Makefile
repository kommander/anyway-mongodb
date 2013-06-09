test:
	@ANYWAY_STORE_PACKAGE="./" ./node_modules/.bin/mocha \
	  ../anyway/test/store.test.js \
		--require should \
		--check-leaks \
		--reporter dot

.PHONY: test