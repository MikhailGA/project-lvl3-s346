// @flow
import nock from 'nock';
import axios from 'axios';
import httpAdapter from 'axios/lib/adapters/http';
import fs from 'fs';
import os from 'os';
import path from 'path';
import pageLoader from '../src';


const fsPromises = fs.promises;
axios.defaults.adapter = httpAdapter;

const host = 'https://Hexlet.io';
const downloadPagePath = '/courses';
const assetCSSPath = '/assets/application.css';
const assetJSPath = '/assets/application.js';
const assetImgPath = '/assets/test.svg';


const downloadPageUrl = new URL(downloadPagePath, host);

let downloadPage;
let localPage;


const appCss = "font-family: 'IBM Plex Sans'";
const appJs = 'const a = 2';
let img;

beforeAll(async () => {
  downloadPage = await fsPromises.readFile('./__tests__/__fixtures__/index.html', 'utf8');
  localPage = await fsPromises.readFile('./__tests__/__fixtures__/indexLocal.html', 'utf8');
  img = await fsPromises.readFile('./__tests__/__fixtures__/test.svg');
});

beforeEach(() => {
  nock(host)
    .get(downloadPagePath)
    .reply(200, downloadPage);

  nock(host)
    .get(assetCSSPath)
    .reply(200, appCss);

  nock(host)
    .get(assetJSPath)
    .reply(200, appJs);

  nock(host)
    .get(assetImgPath)
    .reply(200, img);

  nock(host)
    .get('/unknownUrl')
    .reply(404, '');
});

test('PageLoafer test', async () => {
  const tmpPath = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'test-'));

  await pageLoader.pageLoad(downloadPageUrl.href, tmpPath);

  const filePath = path.join(tmpPath, '/hexlet-io-courses.html');
  const result = await fsPromises.readFile(filePath, 'utf8');

  const cssPath = path.join(tmpPath, '/hexlet-io-courses_files/assets-application.css');
  const cssAsset = await fsPromises.readFile(cssPath, 'utf8');

  const svgPath = path.join(tmpPath, '/hexlet-io-courses_files/assets-test.svg');
  const svgAsset = await fsPromises.readFile(svgPath);

  expect(result).toMatch(localPage);
  expect(cssAsset).toMatch(appCss);
  expect(svgAsset).toEqual(img);
});

const unknownPageUrl = new URL('/unknownUrl', host);
test('Test errors', async () => {
  expect(() => pageLoader.pageLoad('/badUrl./', '/var/tmp/test')).toThrow();

  await expect(pageLoader.pageLoad(unknownPageUrl.href, '/var/tmp/test')).rejects.toMatch(/404/);
  await expect(pageLoader.pageLoad(downloadPageUrl.href, '|/badPath|/')).rejects.toMatch(/ENOENT/);
});
