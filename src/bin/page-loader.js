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
    pageLoader.pageLoad(url, options.output)
      .then(console.log)
      .catch(console.log);
  })
  .parse(process.argv);
