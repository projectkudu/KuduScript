/**
* Copyright (c) Microsoft.  All rights reserved.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

var package = require('../package.json');

var fs = require('fs');
var path = require('path');

var isWindows = process.platform === 'win32';

// Making sure this works on node 0.6.20 as well as 0.8
fs.existsSync = fs.existsSync || path.existsSync;
path.sep = path.sep || (isWindows ? '\\' : '/');

var templatesDir = path.join(__dirname, 'templates');
var log = { info: function () { } };
var confirm = function () { return false; };

var ScriptType = {
  batch: 'BATCH',
  bash: 'BASH',
  posh: 'POSH'
};

var ProjectType = {
  wap: 'WAP',
  website: 'WEBSITE',
  node: 'NODE',
  python: 'PYTHON',
  basic: 'BASIC',
  functionApp: 'FUNCTIONAPP',
  dotNetConsole: 'DOT_NET_CONSOLE',
  aspNetCore: 'ASP_NET_CORE',
  go: 'GO',
  ruby: "RUBY",
  php: "PHP"
};

exports.ScriptType = ScriptType;
exports.ProjectType = ProjectType;

function ScriptGenerator(repositoryRoot, projectType, projectPath, solutionPath, sitePath, scriptType, scriptOutputPath, noDotDeployment, noSolution, logger, confirmFunc, useMSBuild) {
  argNotNull(repositoryRoot, 'repositoryRoot');
  argNotNull(scriptOutputPath, 'scriptOutputPath');
  argNotNull(projectType, 'projectType');
  argNotNull(sitePath, 'sitePath');

  projectType = projectType.toUpperCase();

  if (!scriptType) {
    // If no script type is passed, use the default one
    if (projectType === ProjectType.wap || projectType === ProjectType.website || projectType === ProjectType.python || projectType === ProjectType.go) {
      // For .NET the default script type is batch
      scriptType = ScriptType.batch;
    } else {
      // Otherwise the default depends on the os
      scriptType = isWindows ? ScriptType.batch : ScriptType.bash;
    }
  } else {
    scriptType = scriptType.toUpperCase();
    if (scriptType !== ScriptType.batch && scriptType !== ScriptType.bash && scriptType !== ScriptType.posh) {
      throw new Error('Script type should be either batch or bash or posh');
    }
  }
  this.scriptType = scriptType;

  log = logger || log;
  confirm = confirmFunc || confirm;

  if (projectPath) {
    if (!isPathSubDir(repositoryRoot, projectPath)) {
      throw new Error('The project file path should be a sub-directory of the repository root');
    }

    var relativeProjectPath = path.relative(repositoryRoot, projectPath);
    log.info('Project file path: .' + path.sep + relativeProjectPath);
    this.projectPath = relativeProjectPath;
    this.absoluteProjectPath = projectPath;
  }

  if (solutionPath) {
    if (!isPathSubDir(repositoryRoot, solutionPath)) {
      throw new Error('The solution file path should be the same as repository root or a sub-directory of it.');
    }

    var relativeSolutionPath = path.relative(repositoryRoot, solutionPath);
    log.info('Solution file path: .' + path.sep + relativeSolutionPath);
    this.solutionPath = relativeSolutionPath;
  }

  if (!isPathSubDir(repositoryRoot, sitePath)) {
    throw new Error('The site directory path should be the same as repository root or a sub-directory of it.');
  }

  var relativeSitePath = path.relative(repositoryRoot, sitePath);
  if (relativeSitePath) {
    relativeSitePath = path.sep + relativeSitePath;
    log.info('The site directory path: .' + relativeSitePath);
  }
  this.sitePath = relativeSitePath || '';

  this.repositoryRoot = repositoryRoot;
  this.scriptOutputPath = scriptOutputPath;
  this.projectType = projectType;
  this.noDotDeployment = noDotDeployment;
  this.noSolution = noSolution;
  this.absoluteSitePath = path.join(this.repositoryRoot, this.sitePath);
  this.useMSBuild = useMSBuild;

  this.generators = [];
  this.generators[ProjectType.wap] = generateWapDeploymentScript;
  this.generators[ProjectType.website] = generateWebSiteDeploymentScript;
  this.generators[ProjectType.node] = generateNodeDeploymentScript;
  this.generators[ProjectType.python] = generatePythonDeploymentScript;
  this.generators[ProjectType.basic] = generateBasicWebSiteDeploymentScript;
  this.generators[ProjectType.functionApp] = generateFunctionAppDeploymentScript;
  this.generators[ProjectType.dotNetConsole] = generateDotNetConsoleDeploymentScript;
  this.generators[ProjectType.aspNetCore] = generateAspNetCoreDeploymentScript;
  this.generators[ProjectType.go] = generateGoDeploymentScript;
  this.generators[ProjectType.ruby] = generateRubyDeploymentScript;
  this.generators[ProjectType.php] = generatePHPDeploymentScript;
}

function generateGoDeploymentScript(scriptGenerator, _) {
  scriptGenerator.generateGoDeploymentScript(_);
}

function generateAspNetCoreDeploymentScript(scriptGenerator, _) {
  scriptGenerator.generateAspNetCoreDeploymentScript(_);
}

function generateDotNetConsoleDeploymentScript(scriptGenerator, _) {
  scriptGenerator.generateDotNetConsoleDeploymentScript(_);
}

function generateWapDeploymentScript(scriptGenerator, _) {
  scriptGenerator.generateWapDeploymentScript(_);
}

function generateWebSiteDeploymentScript(scriptGenerator, _) {
  scriptGenerator.generateWebSiteDeploymentScript(_);
}

function generateNodeDeploymentScript(scriptGenerator, _) {
  scriptGenerator.generateNodeDeploymentScript(_);
}

function generatePythonDeploymentScript(scriptGenerator, _) {
  scriptGenerator.generatePythonDeploymentScript(_);
}

function generateRubyDeploymentScript(scriptGenerator, _) {
  scriptGenerator.generateRubyDeploymentScript(_);
}

function generatePHPDeploymentScript(scriptGenerator, _) {
  scriptGenerator.generatePHPDeploymentScript(_);
}

function generateBasicWebSiteDeploymentScript(scriptGenerator, _) {
  if (scriptGenerator.solutionPath) {
    throw new Error('Solution path is not supported with this website type');
  }
  scriptGenerator.generateWebSiteDeploymentScript(_);
}

function generateFunctionAppDeploymentScript(scriptGenerator, _) {
    scriptGenerator.generateFunctionAppDeploymentScript(_);
}

ScriptGenerator.prototype.generateDeploymentScript = function (_) {
  var generator = this.generators[this.projectType];
  if (!generator) {
    throw new Error('Invalid project type received: ' + this.projectType);
  }

  generator(this, _);
};

function isPathSubDir(parentPath, childPath) {
  var relativePath = path.relative(parentPath, childPath);

  // The parent path is actually the parent of the child path if the result of path.relative:
  // a. Doesn't contain '..' at the start
  // b. Doesn't equal to the child path entirely
  return relativePath.indexOf('..') !== 0 &&
    relativePath !== path.resolve(childPath);
}

ScriptGenerator.prototype.generateGoDeploymentScript = function (_) {
  log.info('Generating deployment script for Go Web Site');

  this.generateBasicDeploymentScript('go.template', _);
};

ScriptGenerator.prototype.generateNodeDeploymentScript = function (_) {
  log.info('Generating deployment script for node.js Web Site');

  this.generateBasicDeploymentScript('node.template', _);
};

ScriptGenerator.prototype.generateFunctionAppDeploymentScript = function(_) {
  log.info('Generating deployment script for function App');

  if (this.scriptType != ScriptType.batch) {
    throw new Error('Only batch script files are supported for function App');
  }

  options = {}
  if (this.solutionPath) {
    options.solutionPath = fixPathSeparatorToWindows(this.solutionPath);
    options.projectPath = fixPathSeparatorToWindows(this.projectPath);
    this.generateFunctionAppScript('functionmsbuild.template', options, _);
  } else {
    options.sitePath = fixPathSeparatorToWindows(this.sitePath);
    this.generateFunctionAppScript('functionbasic.template', options, _);
  }

};

ScriptGenerator.prototype.generatePythonDeploymentScript = function (_) {
  log.info('Generating deployment script for python Web Site');

  if (this.scriptType != ScriptType.batch) {
    throw new Error('Only batch script files are supported for python Web Site');
  }

  this.generateBasicDeploymentScript('python.template', _);
};

ScriptGenerator.prototype.generateRubyDeploymentScript = function (_) {
  log.info('Generating deployment script for Ruby Web Site');

  this.generateBasicDeploymentScript('ruby.template', _);
};

ScriptGenerator.prototype.generatePHPDeploymentScript = function (_) {
  log.info('Generating deployment script for PHP Web Site');

  this.generateBasicDeploymentScript('php.template', _);
};

ScriptGenerator.prototype.generateWapDeploymentScript = function (_) {
  argNotNull(this.projectPath, 'projectPath');

  if (this.scriptType != ScriptType.batch && this.scriptType != ScriptType.posh) {
    throw new Error('Only batch and posh script files are supported for .NET Web Application');
  }

  if (!this.solutionPath && !this.noSolution) {
    throw new Error('Missing solution file path (--solutionFile), to explicitly not require a solution use the flag --no-solution');
  }

  log.info('Generating deployment script for .NET Web Application');

  var msbuildArguments, msbuildArgumentsForInPlace;

  if (this.scriptType == ScriptType.batch) {
    msbuildArguments = '"%DEPLOYMENT_SOURCE%\\' + this.projectPath + '" /nologo /verbosity:m /t:Build /t:pipelinePreDeployCopyAllFilesToOneFolder /p:_PackageTempDir="%DEPLOYMENT_TEMP%";AutoParameterizationWebConfigConnectionStrings=false;Configuration=Release;UseSharedCompilation=false';
    msbuildArgumentsForInPlace = '"%DEPLOYMENT_SOURCE%\\' + this.projectPath + '" /nologo /verbosity:m /t:Build /p:AutoParameterizationWebConfigConnectionStrings=false;Configuration=Release;UseSharedCompilation=false';

    if (this.solutionPath) {
      var solutionDir = path.dirname(this.solutionPath),
          solutionArgs = ' /p:SolutionDir="%DEPLOYMENT_SOURCE%\\' + solutionDir + '\\\\\"';
      msbuildArguments += solutionArgs;
      msbuildArgumentsForInPlace += solutionArgs;
    }

    msbuildArguments += ' %SCM_BUILD_ARGS%';
    msbuildArgumentsForInPlace += ' %SCM_BUILD_ARGS%';
  } else {
    msbuildArguments = '"$DEPLOYMENT_SOURCE\\' + this.projectPath + '" /nologo /verbosity:m /t:Build /t:pipelinePreDeployCopyAllFilesToOneFolder /p:_PackageTempDir="$DEPLOYMENT_TEMP"`;AutoParameterizationWebConfigConnectionStrings=false`;Configuration=Release`;UseSharedCompilation=false';
    msbuildArgumentsForInPlace = '"$DEPLOYMENT_SOURCE\\' + this.projectPath + '" /nologo /verbosity:m /t:Build /p:AutoParameterizationWebConfigConnectionStrings=false`;Configuration=Release`;UseSharedCompilation=false';

    if (this.solutionPath) {
      var solutionDir = path.dirname(this.solutionPath),
          solutionArgs = ' /p:SolutionDir="$DEPLOYMENT_SOURCE\\' + solutionDir + '\\\\\"';
      msbuildArguments += solutionArgs;
      msbuildArgumentsForInPlace += solutionArgs;
    }

    msbuildArguments += ' $env:SCM_BUILD_ARGS';
    msbuildArgumentsForInPlace += ' $env:SCM_BUILD_ARGS';
  }

  var options = {
    msbuildArguments: msbuildArguments,
    msbuildArgumentsForInPlace: msbuildArgumentsForInPlace
  };

  this.generateDotNetDeploymentScript('aspnet.wap.template', options, _);
};

ScriptGenerator.prototype.generateAspNetCoreDeploymentScript = function (_) {
  argNotNull(this.absoluteProjectPath, 'absoluteProjectPath');
  // no need to check scriptType since dotnet core is supported on both linux and windows

  // this.solutionPath and this.projectPath are both relative
  var options = {};
  options.RestoreArguments = ((this.solutionPath) ? this.solutionPath:this.projectPath);
  options.DotnetpublishArguments = this.projectPath;

  this.generateAspNetCoreScript('aspnet.core.template', options, _);

};

ScriptGenerator.prototype.generateDotNetConsoleDeploymentScript = function (_) {
  argNotNull(this.projectPath, 'projectPath');

  if (this.scriptType != ScriptType.batch && this.scriptType != ScriptType.posh) {
    throw new Error('Only batch and posh script files are supported for .NET Web Application');
  }

  if (!this.solutionPath && !this.noSolution) {
    throw new Error('Missing solution file path (--solutionFile), to explicitly not require a solution use the flag --no-solution');
  }

  log.info('Generating deployment script for .NET console application');

  var msbuildArguments;

  if (this.scriptType == ScriptType.batch) {
    msbuildArguments = '"%DEPLOYMENT_SOURCE%\\' + this.projectPath + '" /nologo /verbosity:m /t:Build /p:Configuration=Release;OutputPath="%DEPLOYMENT_TEMP%\\app_data\\jobs\\continuous\\deployedJob";UseSharedCompilation=false';

    if (this.solutionPath) {
      var solutionDir = path.dirname(this.solutionPath),
          solutionArgs = ' /p:SolutionDir="%DEPLOYMENT_SOURCE%\\' + solutionDir + '\\\\\"';
      msbuildArguments += solutionArgs;
    }

    msbuildArguments += ' %SCM_BUILD_ARGS%';
  } else {
    msbuildArguments = '"$DEPLOYMENT_SOURCE\\' + this.projectPath + '" /nologo /verbosity:m /t:Build /p:Configuration=Release`;OutputPath="$DEPLOYMENT_TEMP\\app_data\\jobs\\continuous\\deployedJob"`;UseSharedCompilation=false';

    if (this.solutionPath) {
      var solutionDir = path.dirname(this.solutionPath),
          solutionArgs = ' /p:SolutionDir="$DEPLOYMENT_SOURCE\\' + solutionDir + '\\\\\"';
      msbuildArguments += solutionArgs;
    }

    msbuildArguments += ' $env:SCM_BUILD_ARGS';
  }

  var options = {
    msbuildArguments: msbuildArguments,
    msbuildArgumentsForInPlace: msbuildArguments
  };

  this.generateDotNetDeploymentScript('dotnetconsole.template', options, _);
};

ScriptGenerator.prototype.generateWebSiteDeploymentScript = function (_) {
  if (this.solutionPath) {
    // Solution based website (.NET)
    log.info('Generating deployment script for .NET Web Site');

    if (this.scriptType != ScriptType.batch && this.scriptType != ScriptType.posh) {
      throw new Error('Only batch and posh script files are supported for .NET Web Site');
    }

  	var msbuildArguments;

    if (this.scriptType == ScriptType.batch) {
    	msbuildArguments = '"%DEPLOYMENT_SOURCE%\\' + fixPathSeparatorToWindows(this.solutionPath) + '" /verbosity:m /nologo %SCM_BUILD_ARGS%';
    } else {
    	msbuildArguments = '"$DEPLOYMENT_SOURCE\\' + fixPathSeparatorToWindows(this.solutionPath) + '" /verbosity:m /nologo $env:SCM_BUILD_ARGS';
    }

    this.generateDotNetDeploymentScript('aspnet.website.template', { msbuildArguments: msbuildArguments }, _);
  } else {
    // Basic website
    log.info('Generating deployment script for Web Site');
    this.generateBasicDeploymentScript('basic.template', _);
  }
};

ScriptGenerator.prototype.generateBasicDeploymentScript = function (templateFileName, _) {
  argNotNull(templateFileName, 'templateFileName');

  var lowerCaseScriptType = this.scriptType.toLowerCase();
  var fixedSitePath = this.scriptType === ScriptType.batch ? fixPathSeparatorToWindows(this.sitePath) : fixPathSeparatorToUnix(this.sitePath);
  var templateContent = getTemplatesContent([
    'deploy.' + lowerCaseScriptType + '.prefix.template',
    'deploy.' + lowerCaseScriptType + '.' + templateFileName,
    'deploy.' + lowerCaseScriptType + '.postfix.template'
  ]).replace(/{SitePath}/g, fixedSitePath);

  this.writeDeploymentFiles(templateContent, _);
};

ScriptGenerator.prototype.generateFunctionAppScript = function(templateFileName, options, _){
  argNotNull(templateFileName, 'templateFileName');

  var lowerCaseScriptType = this.scriptType.toLowerCase();
  var templateContent = getTemplatesContent([
    'deploy.' + lowerCaseScriptType + '.prefix.template',
    'deploy.' + lowerCaseScriptType + '.' + templateFileName,
    'deploy.' + lowerCaseScriptType + '.postfix.template'
  ]).replace(/{SitePath}/g, options.sitePath)
    .replace(/{SolutionPath}/g, options.solutionPath)
    .replace(/{ProjectPath}/g, options.projectPath);

  this.writeDeploymentFiles(templateContent, _);
}

ScriptGenerator.prototype.generateDotNetDeploymentScript = function (templateFileName, options, _) {
  argNotNull(templateFileName, 'templateFileName');


  var lowerCaseScriptType = this.scriptType.toLowerCase();
  var solutionDir = this.solutionPath ? path.dirname(this.solutionPath) : '';
  var templateContent = getTemplatesContent([
    'deploy.' + lowerCaseScriptType + '.prefix.template',
    'deploy.' + lowerCaseScriptType + '.aspnet.template',
    'deploy.' + lowerCaseScriptType + '.' + templateFileName,
    'deploy.' + lowerCaseScriptType + '.postfix.template'
  ]).replace(/{MSBuildArguments}/g, options.msbuildArguments || "")
    .replace(/{MSBuildArgumentsForInPlace}/g, options.msbuildArgumentsForInPlace || "")
    .replace(/{SolutionPath}/g, this.solutionPath || "")
    .replace(/{SolutionDir}/g, solutionDir)
    .replace(/{SitePath}/g, fixPathSeparatorToWindows(this.sitePath));

  this.writeDeploymentFiles(templateContent, _);
};

ScriptGenerator.prototype.generateAspNetCoreScript = function (templateFileName, options, _) {
  argNotNull(templateFileName, 'templateFileName');

  if (this.scriptType === ScriptType.batch) {
      for (var prop in options) {
          options[prop] = fixPathSeparatorToWindows(options[prop])
      }
  } else {
      for (var prop in options) {
          options[prop] = fixPathSeparatorToUnix(options[prop])
      }
  }

  var lowerCaseScriptType = this.scriptType.toLowerCase();
  var templateContent = getTemplatesContent([
    'deploy.' + lowerCaseScriptType + '.prefix.template',
    'deploy.' + lowerCaseScriptType + '.aspnet.template',
    'deploy.' + lowerCaseScriptType + '.' + templateFileName,
    'deploy.' + lowerCaseScriptType + '.postfix.template'
]).replace(/{DotnetpublishArguments}/g, options.DotnetpublishArguments)
    .replace(/{RestoreArguments}/g, options.RestoreArguments);

  this.writeDeploymentFiles(templateContent, _);
};

function getTemplatesContent(fileNames) {
  var content = '';

  for (var i in fileNames) {
    content += getTemplateContent(fileNames[i]);
  }

  content = content.replace(/{Version}/g, package.version);

  return content;
}

function fixPathSeparatorToWindows(pathStr) {
  return pathStr ? pathStr.replace(/\//g, '\\') : pathStr;
}

function fixPathSeparatorToUnix(pathStr) {
  return pathStr ? pathStr.replace(/\\/g, '/') : pathStr;
}

function fixLineEndingsToUnix(contentStr) {
  return contentStr.replace(/\r\n/g, '\n');
}

function fixLineEndingsToWindows(contentStr) {
  return contentStr.replace(/(?:\r\n|\n)/g, '\r\n');
}

ScriptGenerator.prototype.writeDeploymentFiles = function (templateContent, _) {
  argNotNull(templateContent, 'templateContent');

  var deployScriptFileName;
  var deploymentCommand;
  if (this.scriptType == ScriptType.batch) {
    deployScriptFileName = 'deploy.cmd';
    deploymentCommand = deployScriptFileName;
    templateContent = fixLineEndingsToWindows(templateContent);
  } else if (this.scriptType == ScriptType.posh) {
    deployScriptFileName = 'deploy.ps1';
    deploymentCommand = 'powershell -NoProfile -NoLogo -ExecutionPolicy Unrestricted -Command "& "$pwd\\' + deployScriptFileName + '" 2>&1 | echo"';
    templateContent = fixLineEndingsToWindows(templateContent);
  } else {
    deployScriptFileName = 'deploy.sh';
    deploymentCommand = 'bash ' + deployScriptFileName;
    templateContent = fixLineEndingsToUnix(templateContent);
  }

  var deployScriptPath = path.join(this.scriptOutputPath, deployScriptFileName);
  var deploymentFilePath = path.join(this.repositoryRoot, '.deployment');

  // Write the custom deployment script
  writeContentToFile(deployScriptPath, templateContent, _);

  if (!this.noDotDeployment) {
    // Write the .deployment file
    writeContentToFile(deploymentFilePath, '[config]\ncommand = ' + deploymentCommand, _);
  }

  log.info('Generated deployment script files');
};

function getTemplateContent(templateFileName) {
  return fs.readFileSync(getTemplatePath(templateFileName), 'utf8');
}

function getTemplatePath(fileName) {
  return path.join(templatesDir, fileName);
}

function writeContentToFile(path, content, _) {
  // TODO: Add check whether file exist
  if (fs.existsSync(path)) {
    if (!confirm('The file: "' + path + '" already exists\nAre you sure you want to overwrite it (y/n): ', _)) {
      // Do not overwrite the file
      return;
    }
  }

  fs.writeFile(path, content, _);
}

function argNotNull(arg, argName) {
  if (arg === null || arg === undefined) {
    throw new Error('The argument "' + argName + '" is null');
  }
}

exports.ScriptGenerator = ScriptGenerator;
