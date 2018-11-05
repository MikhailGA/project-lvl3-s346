import program from 'commander';
import pageLoader from '..';

program
  .description('Open file')
  .arguments('<path>')
  .action((path) => {
    pageLoader.open(path)
      .then(data => console.log(data))
      .catch(err => console.log(err));
  })
  .parse(process.argv);
