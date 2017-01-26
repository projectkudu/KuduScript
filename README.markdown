### Kudu Script

Tool for generating deployment scripts for Azure Websites

Here is the workflow to make fixes and propagate them:

- Make fix and commit it to this repo
- Run `npmpublish.cmd` to publish it to npm and create a tag with a new version. Check that the new version is on https://www.npmjs.com/package/kuduscript
- Push the fix to this repo. Use `git push --follow-tags` to push the new tag
- Go to https://github.com/Azure/azure-xplat-cli/blob/dev/package.json and send a PR to update the kuduscript reference to the new version. This will make it available in the xplat tool
- Change https://github.com/projectkudu/kudu/blob/master/Kudu.Services.Web/updateNodeModules.cmd to point to the new kuduscript commit. This will make Kudu use it

This project is under the benevolent umbrella of the [.NET Foundation](http://www.dotnetfoundation.org/).
