import _ from 'lodash';

export default (name, extName) => {
  const newName = name.split('')
    .map(char => (/[а-яА-ЯёЁa-zA-Z0-9]/.test(char) ? char : '-'))
    .join('');
  _.words(newName, /-/g);
  const nameWithoutDuplicate = _.words(newName, /[^-]+/g).join('-');
  return `${nameWithoutDuplicate}${extName}`;
};
