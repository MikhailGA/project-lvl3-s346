// @flow
import debug from 'debug';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { resolve } from 'url';
import Listr from 'listr';
import StateMachine from 'javascript-state-machine';
import buildLocalPage from './pageBuilder';
import buildName from './nameBuilder';

const d = debug('page-loader');
d('booting PageLoader application');

const fsPromises = fs.promises;

const Resource = StateMachine.factory({
  init: 'inititState',
  transitions: [
    { name: 'download', from: 'inititState', to: 'downloaded' },
    { name: 'save', from: 'downloaded', to: 'saved' },
  ],
});

const writePageToFile = (ctx, dirName, localPagePath) => {
  const { html, assetUrls, localAssetUrls } = buildLocalPage(ctx.page, dirName);
  d(`Assets URL: ${assetUrls}`);
  d(`LocalAssets URL: ${localAssetUrls}`);
  ctx.assetUrls = assetUrls;
  ctx.localAssetUrls = localAssetUrls;
  return fsPromises.writeFile(localPagePath, html);
};

const getAssets = (ctx, pageUrl) => {
  d(`Directory '${ctx.assetDirPath}' was successfully created`);
  d(`Get asset from URL: ${pageUrl}`);
  const localFileData = ctx.assetUrls.map(assetUrl => (
    axios.get(resolve(pageUrl.href, assetUrl), 'arraybuffer')));
  return Promise.all(localFileData);
};

const writeAssetsToFiles = (ctx, assetDirPath) => {
  d('Local file uploaded successfully!');
  return fsPromises.mkdir(assetDirPath).then(() => {
    const writeLocalAssets = ctx.localAssetUrls.map((localAssetUrl, i) => (
      fsPromises.writeFile(path.join(assetDirPath, localAssetUrl), ctx.assetsArr[i].data)));
    Promise.all(writeLocalAssets);
  });
};

const pageLoad = (url, filePath) => {
  d('Run pageLoad');
  const pageUrl = new URL(url);
  const downloadPageName = `${pageUrl.host}${pageUrl.pathname}`;

  const dirName = buildName(downloadPageName, '_files');
  const localPagePath = path.join(filePath, buildName(downloadPageName, '.html'));
  const assetDirPath = path.join(filePath, dirName);

  const page = new Resource();
  const assets = new Resource();

  const task = new Listr([
    {
      title: 'Start download page',
      task: ctx => axios.get(pageUrl.href).then((res) => {
        ctx.page = res.data;
        page.download();
      }),
    },
    {
      title: 'Write Page To File',
      enabled: page.state === 'downloaded',
      task: ctx => writePageToFile(ctx, dirName, localPagePath).then(() => {
        page.save();
      }),
    },
    {
      title: 'Load page assets',
      enabled: page.state === 'downloaded',
      task: ctx => getAssets(ctx, pageUrl).then((assetsArr) => {
        ctx.assetsArr = assetsArr;
        assets.download();
      }),
    },
    {
      title: 'Save assets to dir',
      enabled: assets.state === 'downloaded',
      task: ctx => writeAssetsToFiles(ctx, assetDirPath).then(() => {
        assets.save();
      }),
    },
    {
      title: 'Download and save was successful!',
      enabled: () => page.state === 'saved' && assets.state === 'saved',
      task: () => 'Download and save was successful!',
    },
  ]);
  return task.run({}).catch((err) => {
    process.exitCode = 10;
    return Promise.reject(err);
  });
};

const open = filePath => fsPromises.readFile(filePath, 'utf8');

export default {
  pageLoad,
  open,
};
