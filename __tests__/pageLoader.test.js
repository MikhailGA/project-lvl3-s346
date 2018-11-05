// @flow
import nock from 'nock';
import axios from 'axios';
import httpAdapter from 'axios/lib/adapters/http';
import fs from 'fs';
import os from 'os';
import path from 'path';
import pageLoader from '../src';

const host = 'https://Hexlet.io';
const urlPath = '/courses';

const data = 'test data';

const fsPromises = fs.promises;
const url = new URL(urlPath, host);

beforeAll(() => {
  axios.defaults.adapter = httpAdapter;
});

beforeEach(() => {
  nock('https://Hexlet.io')
    .get(urlPath)
    .reply(200, data);
});

test('PageLoafer test', async () => {
  const tmpPath = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'test-'));

  await pageLoader.pageLoad(url.href, tmpPath);

  const filePath = path.join(tmpPath, '/hexlet-io-courses.html');
  const result = await pageLoader.open(filePath);

  expect(result).toBe(data);
});

test('Test errors', async () => {
  expect.assertions(2);
  try {
    await pageLoader.pageLoad('badURL', './');
  } catch (e) {
    expect(e.message).toMatch('Invalid URL');
  }

  try {
    await pageLoader.pageLoad(url.href, '/badDirectory/');
  } catch (e) {
    expect(e.message).toMatch('ENOENT');
  }
});
