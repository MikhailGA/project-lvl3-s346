import cheerio from 'cheerio';
import path from 'path';
import _ from 'lodash';

const mapping = {
  img: 'src',
  script: 'src',
  link: 'href',
};

const preparePageName = body => body.split('')
  .map(char => (/[а-яА-ЯёЁa-zA-Z0-9]/.test(char) ? char : '-'))
  .join('');

const isLocalURL = url => !(/https:\/\/|http:\/\//.test(url));

const getPageUrls = (html) => {
  const $ = cheerio.load(html);
  const urls = _.keys(mapping).map(tag => (
    $(tag).map((i, el) => $(el).attr(mapping[tag])).get()));
  return _.flatten(urls).filter(isLocalURL);
};

const buildLocalPageUrls = fileUrls => fileUrls.map((url) => {
  const arr = url.substr(1).split('.');
  const ext = arr[arr.length - 1];
  const name = _.trim(arr.slice(0, arr.length - 1).join(''), '/.');
  return preparePageName(name).concat(`.${ext}`);
});

export default (html, dirName) => {
  const assetUrls = getPageUrls(html);
  const localAssetUrls = buildLocalPageUrls(assetUrls);
  const localPageHtml = assetUrls.reduce((acc, url, i) => {
    const localPath = path.join(dirName, localAssetUrls[i]);
    return _.replace(acc, url, localPath);
  }, html);

  return {
    html: localPageHtml,
    assetUrls,
    localAssetUrls,
  };
};
