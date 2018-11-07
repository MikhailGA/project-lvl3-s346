#!/usr/bin/env node

import program from 'commander';
import pageLoader from '..';

program
  .description('Open file')
  .arguments('<path>')
  .action((path) => {
    pageLoader.open(path)
      .then(console.log)
      .catch(console.log);
  })
  .parse(process.argv);
