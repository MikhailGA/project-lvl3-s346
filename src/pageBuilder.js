import cheerio from 'cheerio';
import path from 'path';
import _ from 'lodash';
import buildName from './nameBuilder';

const mapping = {
  img: 'src',
  script: 'src',
  link: 'href',
};

const isLocalURL = url => !(/https:\/\/|http:\/\//.test(url));

const getPageUrls = (html) => {
  const $ = cheerio.load(html);
  const urls = _.keys(mapping).map(tag => (
    $(tag).map((i, el) => $(el).attr(mapping[tag])).get()));
  return _.flatten(urls).filter(isLocalURL);
};

const buildLocalPageUrls = fileUrls => fileUrls.map((url) => {
  const pagePath = path.parse(url);
  const rawName = `${pagePath.dir}/${pagePath.name}`;
  const extName = pagePath.ext;
  return buildName(rawName, extName);
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
