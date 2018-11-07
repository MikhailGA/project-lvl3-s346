// @flow
import debug from 'debug';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { resolve } from 'url';
import buildLocalPage from './pageBuilder';
import buildName from './nameBuilder';

const d = debug('page-loader');
d('booting PageLoader application');

const fsPromises = fs.promises;

const pageLoad = (url, filePath) => {
  d('Run pageLoad');
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
        d(`Response from URL: ${pageUrl.href} was received`);
        const { html, assetUrls, localAssetUrls } = buildLocalPage(response.data, dirName);
        d(`Assets URL: ${assetUrls}`);
        d(`LocalAssets URL: ${localAssetUrls}`);
        assetUrlsGlobal = assetUrls;
        localAssetUrlsGlobal = localAssetUrls;
        return fsPromises.writeFile(localPagePath, html);
      })
      .then(() => fsPromises.mkdir(assetDirPath))
      .then(() => {
        d(`Directory '${assetDirPath}' was successfully created`);
        const localFileData = assetUrlsGlobal.map(assetUrl => (
          axios.get(resolve(pageUrl.href, assetUrl), 'arraybuffer')));
        return Promise.all(localFileData);
      })
      .then((assetArr) => {
        d('Local file data uploaded successfully!');
        const writeLocalAssets = localAssetUrlsGlobal.map((localAssetUrl, i) => (
          fsPromises.writeFile(path.join(assetDirPath, localAssetUrl), assetArr[i].data)));
        return Promise.all(writeLocalAssets);
      })
      .then(() => {
        d(`Local file data is successfully saved in the directory: '${assetDirPath}'`);
        return wrapResolve('download and save was successful!');
      })
      .catch((err) => {
        d(`Application failed with error: '${err.message}'`);
        return wrapReject(err.message);
      });
  });
};

const open = filePath => fsPromises.readFile(filePath, 'utf8');

export default {
  pageLoad,
  open,
};
