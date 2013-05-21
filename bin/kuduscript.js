var commander = require('commander');
var deploymentScript = require('../lib/deploymentScript');

var log = {};
log.info = function (msg) {
  console.log(msg);
};
log.help = function (msg) {
  console.log(msg);
};
log.error = function (msg) {
  console.error("error: " + msg);
};

exports.main = function () {
  commander.version('0.0.1');
  // commander.helpInformation = function () { };

  deploymentScript.addDeploymentScriptOptions(commander);

  commander.parse(process.argv);

  if (!commander.suppressPrompt) {
    log.error('Unsuppressed prompt mode is not supported, please add -y flag');
    process.exit(1);
  }

  deploymentScript.deploymentScriptExecute(
    '',
    commander,
    log,
    null,
    function (err) {
      if (err) {
        log.error(err.message);
        process.exit(1);
      }
      process.exit(0);
    });
}
