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
    .option('--aspNetCoreMSBuild16 <projectFilePath>', 'Create a deployment script for ASP.NET Core web application using MSBuild16, specify the project file path') // could be project.json, xproj, csproj
    .option('--aspWebSite', 'Create a deployment script for basic website')
    .option('--go', 'Create a deployment script for Go website')
    .option('--node', 'Create a deployment script for node.js website')
    .option('--ruby', 'Create a deployment script for ruby website')
    .option('--php', 'Create a deployment script for php website')
    .option('--python', 'Create a deployment script for python website')
    .option('--functionApp [projectFilePath]', 'Create a deployment script for function App, specify the project file path if using msbuild')
    .option('--functionAppMSBuild16 [projectFilePath]', 'Create a deployment script for function App using MSBuild16, specify the project file path if using msbuild')
    .option('--basic', 'Create a deployment script for any other website')
    .option('--dotNetConsole <projectFilePath>', 'Create a deployment script for .NET console application, specify the project file path')
    .option('--dotNetConsoleMSBuild16 <projectFilePath>', 'Create a deployment script for .NET console application using MSBuild16, specify the project file path')
    .option('-s, --solutionFile <file path>', 'The solution file path (sln)')
    .option('-p, --sitePath <directory path>', 'The path to the site being deployed (default: same as repositoryRoot)')
    .option('-t, --scriptType <batch|bash|posh>', 'The script output type (default: batch)')
    .option('-o, --outputPath <output path>', 'The path to output generated script (default: same as repository root)')
    .option('-y, --suppressPrompt', 'Suppresses prompting to confirm you want to overwrite an existing destination file.')
    .option('--no-dot-deployment', 'Do not generate the .deployment file.')
    .option('--no-solution', 'Do not require a solution file path (only for --aspWAP otherwise ignored).')
    .option('--aspNetCoreMSBuild1607 <projectFilePath>', 'Create a deployment script for ASP.NET Core web application using MSBuild16.7.0, specify the project file path') // could be project.json, xproj, csproj;
    .option('--dotNetConsoleMSBuild1607 <projectFilePath>', 'Create a deployment script for .NET console application using MSBuild16.7.0, specify the project file path')
    .option('--functionAppMSBuild1607 [projectFilePath]', 'Create a deployment script for function App using MSBuild16.7.0, specify the project file path if using msbuild')
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
  var projectFile = options.aspWAP || options.dotNetConsole || options.aspNetCore ||
                    options.dotNetConsoleMSBuild16 || options.aspNetCoreMSBuild16 || options.aspNetCoreMSBuild1607 ||
                    options.dotNetConsoleMSBuild1607
                    tryOptionalInput(options.functionApp) || tryOptionalInput(options.functionAppMSBuild16) || tryOptionalInput(options.functionAppMSBuild1607);
  var solutionFile = options.solutionFile;
  var sitePath = options.sitePath || repositoryRoot;
  var noDotDeployment = options.dotDeployment === false;
  var noSolution = options.solution === false;

  var exclusionFlags = [options.aspWAP, options.php, options.python, options.aspWebSite, options.node, options.ruby,
                        options.basic, options.functionApp, options.dotNetConsole, options.aspNetCore, options.go,
                        options.functionAppMSBuild16, options.functionAppMSBuild1607, options.dotNetConsoleMSBuild16, options.dotNetConsoleMSBuild1607, options.aspNetCoreMSBuild16, options.aspNetCoreMSBuild1607] ;
  var flagCount = 0;
  for (var i in exclusionFlags) {
    if (exclusionFlags[i]) {
      flagCount++;
    }
  }

  if (flagCount === 0) {
    options.helpInformation();
    log.help('');
    log.help('Please specify one of these flags: --aspWAP, --aspNetCore, --aspWebSite, --php, --python, --dotNetConsole, ' + 
             '--basic, --ruby, --functionApp, --node, --aspNetCoreMSBuild16, --aspNetCoreMSBuild1607, --dotNetConsoleMSBuild16, --dotNetConsoleMSBuild1607, --functionAppMSBuild1607 or --functionAppMSBuild16');
    return;
  } else if (flagCount > 1) {
    throw new Error('Please specify only one of these flags: --aspWAP, --aspNetCore, --aspWebSite, --php, --python, --dotNetConsole, ' +
                    '--basic, --ruby, --functionApp, --node, --aspNetCoreMSBuild16, --aspNetCoreMSBuild1607, --dotNetConsoleMSBuild16, --dotNetConsoleMSBuild1607, --functionAppMSBuild1607 or --functionAppMSBuild16');
  }

  var projectType;
  if (options.aspWAP) {
    projectType = generator.ProjectType.wap;
  } else if (options.aspNetCore) {
    projectType = generator.ProjectType.aspNetCore;
  } else if (options.aspNetCoreMSBuild16) {
    projectType = generator.ProjectType.aspNetCoreMSBuild16;
  } else if(options.aspNetCoreMSBuild1607){
    projectType = generator.ProjectType.aspNetCoreMSBuild1607;
  }  else if (options.aspWebSite) {
    projectType = generator.ProjectType.website;
  } else if (options.go) {
    projectType = generator.ProjectType.go;
  } else if (options.node) {
    projectType = generator.ProjectType.node;
  } else if (options.python) {
    projectType = generator.ProjectType.python;
  } else if (options.dotNetConsole) {
    projectType = generator.ProjectType.dotNetConsole;
  } else if (options.dotNetConsoleMSBuild16) {
    projectType = generator.ProjectType.dotNetConsoleMSBuild16;
  } else if (options.dotNetConsoleMSBuild1607) {
    projectType = generator.ProjectType.dotNetConsoleMSBuild1607;
  } else if (options.functionApp) {
    projectType = generator.ProjectType.functionApp;
  } else if (options.functionAppMSBuild16) {
    projectType = generator.ProjectType.functionAppMSBuild16;
  } else if (options.functionAppMSBuild1607) {
    projectType = generator.ProjectType.functionAppMSBuild1607;
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
