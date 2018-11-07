// @flow

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { resolve } from 'url';
import buildLocalPage from './pageBuilder';
import buildName from './nameBuilder';


const fsPromises = fs.promises;

const pageLoad = (url, filePath) => {
  const pageUrl = new URL(url);
  const downloadPageName = `${pageUrl.host}${pageUrl.pathname}`;

  const dirName = buildName(downloadPageName, '_files');
  const localPagePath = path.join(filePath, buildName(downloadPageName, '.html'));
  const assetDirPath = path.join(filePath, dirName);

  let localAssetUrlsGlobal;
  let assetUrlsGlobal;

  return new Promise((wrapResolve, wrapReject) => {
    axios.get(pageUrl.href)
      .then((response) => {
        const { html, assetUrls, localAssetUrls } = buildLocalPage(response.data, dirName);

        assetUrlsGlobal = assetUrls;
        localAssetUrlsGlobal = localAssetUrls;

        return fsPromises.writeFile(localPagePath, html);
      })
      .then(() => fsPromises.mkdir(assetDirPath))
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
      .then(() => wrapResolve('download and save was successful!'))
      .catch(err => wrapReject(err.message));
  });
};

const open = filePath => fsPromises.readFile(filePath, 'utf8');

export default {
  pageLoad,
  open,
};
