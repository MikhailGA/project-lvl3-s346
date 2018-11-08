#!/usr/bin/env node
import program from 'commander';
import pageLoader from '..';
import pjson from '../../package.json';

const { version, description } = pjson;

program
  .version(version, '-v, --version')
  .description(description)
  .option('-o, --output [path]', 'output path', './')
  .arguments('<url>')
  .action((url, options) => {
    try {
      pageLoader.pageLoad(url, options.output)
        .then(console.log)
        .catch(console.error);
    } catch (e) {
      console.error(e.message);
      process.exitCode = 5;
    }
  })
  .parse(process.argv);

process.on('exit', (code) => {
  console.error(`About to exit with code: ${code}`);
});
