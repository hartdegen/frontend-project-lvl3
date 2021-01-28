import * as yup from 'yup';

export default (url, list) => yup
  .string()
  .notOneOf(list)
  .url()
  .matches(/(\.rss)$/)
  .validateSync(url);
