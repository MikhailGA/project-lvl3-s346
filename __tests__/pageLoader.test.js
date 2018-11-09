// @flow
import nock from 'nock';
import axios from 'axios';
import httpAdapter from 'axios/lib/adapters/http';
import fs from 'fs';
import os from 'os';
import path from 'path';
import pageLoad from '../src';

const fsPromises = fs.promises;
axios.defaults.adapter = httpAdapter;

const host = 'https://Hexlet.io';
const downloadPagePath = '/courses';
const assetCSSPath = '/assets/application.css';
const assetJSPath = '/assets/application.js';
const assetImgPath = '/assets/test.svg';
const assetBadRequest = '/assets/BadRequestImg.img';

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
    .delay(1000)
    .reply(200, downloadPage);

  nock(host)
    .get(assetCSSPath)
    .delay(2000)
    .reply(200, appCss);

  nock(host)
    .get(assetJSPath)
    .delay(3000)
    .reply(200, appJs);

  nock(host)
    .get(assetImgPath)
    .delay(1000)
    .reply(200, img);

  nock(host)
    .get(assetBadRequest)
    .delay(1000)
    .reply(404, '');

  nock(host)
    .get('/unknownUrl')
    .reply(404, '');
});

test('PageLoafer test', async () => {
  const tmpPath = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'test-'));

  await pageLoad(downloadPageUrl.href, tmpPath);

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
  expect(() => pageLoad('/InvalidUrl/', '/var/tmp/test')).toThrowError('Invalid URL: /InvalidUrl/');

  await expect(pageLoad(unknownPageUrl.href, '/var/tmp/test')).rejects.toThrowError(/code 404/);
  await expect(pageLoad(downloadPageUrl.href, '/unknownPath')).rejects.toThrowError(/ENOENT/);
});
