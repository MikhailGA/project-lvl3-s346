import _ from 'lodash';

export default (name, extName) => {
  const newName = name.split('')
    .map(char => (/\w/.test(char) ? char : '-'))
    .join('');
  const nameWithoutDuplicate = _.words(newName, /[^-]+/g).join('-');
  return `${nameWithoutDuplicate}${extName}`;
};
