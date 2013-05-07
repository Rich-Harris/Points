window.addEventListener( 'load', function () {

	'use strict';

	var parsed, browser, tweetBase, successReport, failureReport;

	// get browser information
	parsed = new UAParser().getResult();

	browser = parsed.browser.name + ' ' + parsed.browser.major + ' on ';

	if ( parsed.device.model ) {
		browser += parsed.device.model;
	} else {
		browser += parsed.os.name + ' ' + parsed.os.version;
	}

	// display browser information
	document.getElementById( 'browser-description' ).innerText = browser;

	// create Twitter intents
	tweetBase = 'https://twitter.com/intent/tweet?text=';
	successReport = tweetBase + encodeURIComponent( '@rich_harris Points.js works for me in ' + browser );
	failureReport = tweetBase + encodeURIComponent( '@rich_harris Points.js doesn\'t work for me in ' + browser );

	document.getElementById( 'it-works' ).setAttribute( 'href', successReport );
	document.getElementById( 'it-doesnt-work' ).setAttribute( 'href', failureReport );

});