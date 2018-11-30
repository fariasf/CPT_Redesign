'use strict';

const gulp = require('gulp');
const connect = require('gulp-connect');
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const louis = require('gulp-louis');
const PORT = 8080;
const Table = require('cli-table');
const chalk = require('chalk');

/**
 * Start server
 */
const startServer = function() {
  return connect.server({
    root: './',
    port: PORT,
  });
};

/**
 * Stop server
 */
const stopServer = function() {
  connect.serverClose();
};

/**
 * Run lighthouse
 */
 
function launchChromeAndRunLighthouse(url, flags = {}, config = null) {
  return chromeLauncher.launch(flags).then(chrome => {
    flags.port = chrome.port;
    return lighthouse(url, flags, config).then(results =>
      chrome.kill().then(() => results));
  });
}

const flags = {
  chromeFlags: ['--headless']
};

gulp.task('lighthouse', ['server'], function(done) {
  console.log('Running lighthouse audit');
  launchChromeAndRunLighthouse(`http://localhost:${PORT}/index.html`, flags).then(results => {
	const audits = results.lhr.audits;

	const metrics = [
		"first-contentful-paint",
		"first-meaningful-paint",
		"load-fast-enough-for-pwa",
		"speed-index",
		"first-cpu-idle",
		"interactive"
	];

	const table = new Table({
	    head: ['Metric', 'Score', 'Value', 'Pass'],
	    colWidths: [50, 10, 10, 7],
	    colAligns: ['left', 'right', 'right', 'center']
	});

	var passing = true;
	const threshold = 0.9;
	for ( var i in metrics ) {
		var metric = audits[metrics[i]];
		var status = metric.score < threshold ? chalk.red('✗'): chalk.green('✓');
		passing = metric.score < threshold ? false : passing;
		table.push([ metric.title, metric.score, Math.round(metric.rawValue*100)/100, status ]);
	}
	console.log(table.toString());
	done();
  });
});

gulp.task('louis', ['server'], function(done) {
  louis({
    url: `http://localhost:${PORT}/index.html`,
    timeout: 60,
    viewport: '1280x1024',
    engine: 'webkit',
    userAgent: 'Chrome/37.0.2062.120',
    noExternals: false,
    performanceBudget: {
      cssSize: 60000,
      htmlSize: 40000,
      imageSize: 10000,
      jsSize: 0
    }
  }, done);
});

gulp.task('server', startServer);
gulp.task('default', ['lighthouse', 'louis'], stopServer );