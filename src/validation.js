import * as yup from 'yup';

export default (url, list) => {
  const schema = yup
    .string()
    .notOneOf(list)
    .url()
    .matches(/(\.rss)$/);

  return schema
    .validate(url)
    .catch((err) => {
      switch (err.type) {
        case 'notOneOf':
          throw new Error('alreadyExists');
        case 'url':
          throw new Error('urlNotValid');
        case 'matches':
          throw new Error('urlNotValidAsRssLink');
        default:
          throw new Error(`Unknown error type: ${err.type}`);
      }
    });
};
