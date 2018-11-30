const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

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

launchChromeAndRunLighthouse('http://act.vip.xunlei.com/pc/kn/2017/wky/index.html', flags).then(results => {
    results.artifacts = 'ignore'
    results.reportCategories = 'ignore '
   console.log(JSON.stringify(results, null, 4))
});