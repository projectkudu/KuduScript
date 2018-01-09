var commander = require('commander');
var generator = require('../lib/generator');
if (!String.prototype.endsWith) {
  String.prototype.endsWith = require('../lib/polyfill.js').endsWith;
}
var version = require('../package.json').version;

function addDeploymentScriptOptions(command) {
  command
    .usage('[options]')
    .description('Generate custom deployment script')
    .option('-r, --repositoryRoot [dir path]', 'The root path for the repository (default: .)')
    .option('--aspWAP <projectFilePath>', 'Create a deployment script for .NET web application, specify the project file path')
    .option('--aspNetCore <projectFilePath>', 'Create a deployment script for ASP.NET Core web application, specify the project file path') // could be project.json, xproj, csproj
    .option('--aspWebSite', 'Create a deployment script for basic website')
    .option('--go', 'Create a deployment script for Go website')
    .option('--node', 'Create a deployment script for node.js website')
    .option('--ruby', 'Create a deployment script for ruby website')
    .option('--php', 'Create a deployment script for php website')
    .option('--python', 'Create a deployment script for python website')
    .option('--functionApp [projectFilePath]', 'Create a deployment script for function App, specify the project file path if using msbuild')
    .option('--basic', 'Create a deployment script for any other website')
    .option('--dotNetConsole <projectFilePath>', 'Create a deployment script for .NET console application, specify the project file path')
    .option('-s, --solutionFile <file path>', 'The solution file path (sln)')
    .option('-p, --sitePath <directory path>', 'The path to the site being deployed (default: same as repositoryRoot)')
    .option('-t, --scriptType <batch|bash|posh>', 'The script output type (default: batch)')
    .option('-o, --outputPath <output path>', 'The path to output generated script (default: same as repository root)')
    .option('-y, --suppressPrompt', 'Suppresses prompting to confirm you want to overwrite an existing destination file.')
    .option('--no-dot-deployment', 'Do not generate the .deployment file.')
    .option('--no-solution', 'Do not require a solution file path (only for --aspWAP otherwise ignored).');
}

function tryOptionalInput(argument) {
  // if argument == true, means option is specified, but optional input IS NOT provided
  // if argument != true, value of its optional input is stored in argument
  return argument === true ? undefined : argument;
}

function deploymentScriptExecute(name, options, log, confirm, _) {
  var repositoryRoot = options.repositoryRoot || '.';
  var outputPath = options.outputPath || repositoryRoot;
  var scriptType = options.scriptType;
  var projectFile = options.aspWAP || options.dotNetConsole || options.aspNetCore || tryOptionalInput(options.functionApp);
  var solutionFile = options.solutionFile;
  var sitePath = options.sitePath || repositoryRoot;
  var noDotDeployment = options.dotDeployment === false;
  var noSolution = options.solution === false;

  var exclusionFlags = [options.aspWAP, options.php, options.python, options.aspWebSite, options.node, options.ruby, options.basic, options.functionApp, options.dotNetConsole, options.aspNetCore, options.go];
  var flagCount = 0;
  for (var i in exclusionFlags) {
    if (exclusionFlags[i]) {
      flagCount++;
    }
  }

  if (flagCount === 0) {
    options.helpInformation();
    log.help('');
    log.help('Please specify one of these flags: --aspWAP, --aspNetCore, --aspWebSite, --php, --python, --dotNetConsole, --basic, --ruby, --functionApp or --node');
    return;
  } else if (flagCount > 1) {
    throw new Error('Please specify only one of these flags: --aspWAP, --aspNetCore, --aspWebSite, --php, --python, --dotNetConsole, --basic, --ruby, --functionApp or --node');
  }

  var projectType;
  if (options.aspWAP) {
    projectType = generator.ProjectType.wap;
  } else if (options.aspNetCore) {
    projectType = generator.ProjectType.aspNetCore;
  } else if (options.aspWebSite) {
    projectType = generator.ProjectType.website;
  } else if (options.go) {
    projectType = generator.ProjectType.go;
  } else if (options.node) {
    projectType = generator.ProjectType.node;
  } else if (options.python) {
    projectType = generator.ProjectType.python;
  } else if (options.dotNetConsole) {
    projectType = generator.ProjectType.dotNetConsole;
  } else if (options.functionApp) {
    projectType = generator.ProjectType.functionApp;
  } else if (options.ruby) {
    projectType = generator.ProjectType.ruby;
  } else if (options.php) {
    projectType = generator.ProjectType.php;
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
  commander.version(version);

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
exports.main = main;
