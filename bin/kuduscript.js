var commander = require('commander');
var generator = require('../lib/generator');

function addDeploymentScriptOptions(command) {
  command
       .usage('[options]')
       .description('Generate custom deployment script')
       .option('-r, --repositoryRoot [dir path]', 'The root path for the repository (default: .)')
       .option('--aspWAP <projectFilePath>', 'Create a deployment script for .NET web application, specify the project file path')
       .option('--aspWebSite', 'Create a deployment script for basic website')
       .option('--node', 'Create a deployment script for node.js website')
       .option('--php', 'Create a deployment script for php website')
       .option('--python', 'Create a deployment script for python website')
       .option('--basic', 'Create a deployment script for any other website')
       .option('-s, --solutionFile [file path]', 'The solution file path (sln)')
       .option('-p, --sitePath [directory path]', 'The path to the site being deployed (default: same as repositoryRoot)')
       .option('-t, --scriptType [batch|bash]', 'The script output type (default: batch)')
       .option('-o, --outputPath <output path>', 'The path to output generated script (default: same as repository root)')
       .option('-y, --suppressPrompt', 'Suppresses prompting to confirm you want to overwrite an existing destination file.')
       .option('--no-dot-deployment', 'Do not generate the .deployment file.')
       .option('--no-solution', 'Do not require a solution file path (only for --aspWAP otherwise ignored).')
}

function deploymentScriptExecute(name, options, log, confirm, _) {
  var repositoryRoot = options.repositoryRoot || '.';
  var outputPath = options.outputPath || repositoryRoot;
  var scriptType = options.scriptType;
  var projectFile = options.aspWAP;
  var solutionFile = options.solutionFile;
  var sitePath = options.sitePath || repositoryRoot;
  var noDotDeployment = options.dotDeployment === false;
  var noSolution = options.solution === false;

  var exclusionFlags = [options.aspWAP, options.php, options.python, options.aspWebSite, options.node, options.basic];
  var flagCount = 0;
  for (var i in exclusionFlags) {
    if (exclusionFlags[i]) {
      flagCount++;
    }
  }

  if (flagCount === 0) {
    options.helpInformation();
    log.help('');
    log.help('Please specify one of these flags: --aspWAP, --aspWebSite, --php, --python, --basic or --node');
    return;
  } else if (flagCount > 1) {
    throw new Error('Please specify only one of these flags: --aspWAP, --aspWebSite, --php, --python, --basic or --node');
  }

  var projectType;
  if (options.aspWAP) {
    projectType = generator.ProjectType.wap;
  } else if (options.aspWebSite) {
    projectType = generator.ProjectType.website;
  } else if (options.node) {
    projectType = generator.ProjectType.node;
  } else {
    projectType = generator.ProjectType.basic;
  }

  var confirmFunc = confirm;
  if (options.suppressPrompt) {
    confirmFunc = function (message, callback) { callback(undefined, true); };
  }

  var scriptGenerator = new generator.ScriptGenerator(repositoryRoot, projectType, projectFile, solutionFile, sitePath, scriptType, outputPath, noDotDeployment, noSolution, log, confirmFunc);
  scriptGenerator.generateDeploymentScript(_);
}

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

function main() {
  commander.version('0.0.1');

  addDeploymentScriptOptions(commander);

  commander.parse(process.argv);

  if (!commander.suppressPrompt) {
    log.error('Unsuppressed prompt mode is not supported, please add -y flag');
    process.exit(1);
  }

  deploymentScriptExecute(
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

exports.addDeploymentScriptOptions = addDeploymentScriptOptions;
exports.deploymentScriptExecute = deploymentScriptExecute;
exports.copyIisNodeWhenServerJsPresent = generator.copyIisNodeWhenServerJsPresent;
exports.main = main;
