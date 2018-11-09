// @flow
import debug from 'debug';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { resolve } from 'url';
import Listr from 'listr';
import { isNull } from 'lodash';
import buildLocalPage from './pageBuilder';
import buildName from './nameBuilder';

const d = debug('page-loader');
d('booting PageLoader application');

const fsPromises = fs.promises;

const writePageToFile = (ctx, dirName, localPagePath) => {
  const { html, assetUrls, localAssetUrls } = buildLocalPage(ctx.html, dirName);
  d(`Assets URL: ${assetUrls}`);
  d(`LocalAssets URL: ${localAssetUrls}`);
  ctx.assetUrls = assetUrls;
  ctx.localAssetUrls = localAssetUrls;
  return fsPromises.writeFile(localPagePath, html);
};

const getAssetsLoadTasks = (ctx, pageUrl) => {
  d(`Directory '${ctx.assetDirPath}' was successfully created`);
  d(`Get asset from URL: ${pageUrl}`);
  return ctx.assetUrls.map((assetUrl, i) => (
    {
      title: `Download: "${assetUrl}"`,
      task: (context, teskObj) => axios.get(resolve(pageUrl.href, assetUrl), 'arraybuffer')
        .then(({ data }) => {
          context.assetsArr[i] = data; //eslint-disable-line
        })
        .catch(() => {
          context.assetsArr[i] = null; //eslint-disable-line
          context.localAssetUrls[i] = null; //eslint-disable-line
          teskObj.skip(`${assetUrl} load failed!!! Skipping!`);
        }),
    }
  ));
};

const getWriteToFileTasks = (ctx, assetDirPath) => {
  d(`Local file uploaded ${ctx.localAssetUrls}!`);
  const assetsArr = ctx.assetsArr.filter(el => !isNull(el));
  const localAssetUrls = ctx.localAssetUrls.filter(el => !isNull(el));
  return localAssetUrls.map((localAssetUrl, i) => (
    {
      title: `Write assets "${localAssetUrl}" to: "${assetDirPath}"`,
      task: () => fsPromises.writeFile(path.join(assetDirPath, localAssetUrl), assetsArr[i]),
    }
  ));
};

const pageLoad = (url, filePath) => {
  d('Run pageLoad');
  const pageUrl = new URL(url);
  const downloadPageName = `${pageUrl.host}${pageUrl.pathname}`;

  const dirName = buildName(downloadPageName, '_files');
  const localPagePath = path.join(filePath, buildName(downloadPageName, '.html'));
  const assetDirPath = path.join(filePath, dirName);

  const task = new Listr([
    {
      title: `Download page. URL: "${pageUrl.href}"`,
      task: ctx => axios.get(pageUrl.href).then((res) => {
        ctx.html = res.data;
      }),
    },
    {
      title: `Write page to: "${localPagePath}"`,
      task: ctx => writePageToFile(ctx, dirName, localPagePath),
    },
    {
      title: 'Load page assets',
      task: ctx => new Listr(getAssetsLoadTasks(ctx, pageUrl), { concurrent: true }),
    },
    {
      title: `Make dir for page assets. Path ${assetDirPath}`,
      task: () => fsPromises.mkdir(assetDirPath),
    },
    {
      title: 'Save assets to dir',
      task: ctx => new Listr(getWriteToFileTasks(ctx, assetDirPath), { concurrent: true }),
    },
    {
      title: 'Page download and save completed',
      task: () => 'Finish',
    },
  ]);
  return task.run({ assetsArr: [] }).catch((err) => {
    process.exitCode = 10;
    return Promise.reject(err);
  });
};

const open = filePath => fsPromises.readFile(filePath, 'utf8');

export default {
  pageLoad,
  open,
};
