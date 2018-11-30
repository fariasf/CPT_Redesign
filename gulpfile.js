'use strict';

const gulp = require('gulp');
const connect = require('gulp-connect');
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
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

gulp.task('lighthouse', function() {
  console.log('Running lighthouse audit');
  startServer();
  return launchChromeAndRunLighthouse(`http://localhost:${PORT}/index.html`, flags).then(results => {
	stopServer();

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

  });
});

gulp.task('default', ['lighthouse']);