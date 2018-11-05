// @flow

import fs from 'fs';
import path from 'path';
import axios from 'axios';

const fsPromises = fs.promises;

const buildFileName = str => str.split('')
  .map(char => (/^[а-яА-ЯёЁa-zA-Z0-9]/.test(char) ? char : '-'))
  .join('')
  .concat('.html');

const pageLoad = (url, filePath) => {
  const myUrl = new URL(url);
  const fileName = buildFileName(`${myUrl.host}${myUrl.pathname}`);

  return axios.get(myUrl.href)
    .then(({ data }) => (
      fsPromises.writeFile(path.join(filePath, fileName), data)));
};

const open = filePath => fsPromises.readFile(filePath, 'utf8');

export default {
  pageLoad,
  open,
};
