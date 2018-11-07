// @flow

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { resolve } from 'url';
import buildLocalPage from './pageBuilder';

const fsPromises = fs.promises;

const prepareName = body => body.split('')
  .map(char => (/[а-яА-ЯёЁa-zA-Z0-9]/.test(char) ? char : '-'))
  .join('');

let localAssetUrlsGlobal;
let assetUrlsGlobal;

const pageLoad = (url, filePath) => {
  const pageUrl = new URL(url);
  const downloadPageName = prepareName(`${pageUrl.host}${pageUrl.pathname || ''}`);

  const dirName = downloadPageName.concat('_files');
  const localPagePath = path.join(filePath, downloadPageName.concat('.html'));
  const assetDirPath = path.join(filePath, dirName);

  return fsPromises.mkdir(assetDirPath)
    .then(() => axios.get(pageUrl.href))
    .then((response) => {
      const { html, assetUrls, localAssetUrls } = buildLocalPage(response.data, dirName);

      assetUrlsGlobal = assetUrls;
      localAssetUrlsGlobal = localAssetUrls;

      return fsPromises.writeFile(localPagePath, html);
    })
    .then(() => {
      const localFileData = assetUrlsGlobal.map(assetUrl => (
        axios.get(resolve(pageUrl.href, assetUrl), 'arraybuffer')));

      return Promise.all(localFileData);
    })
    .then((assetArr) => {
      const writeLocalAssets = localAssetUrlsGlobal.map((localAssetUrl, i) => (
        fsPromises.writeFile(path.join(assetDirPath, localAssetUrl), assetArr[i].data)));

      return Promise.all(writeLocalAssets);
    })
    .catch(console.log);
};

const open = filePath => fsPromises.readFile(filePath, 'utf8');

export default {
  pageLoad,
  open,
};
