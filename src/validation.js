import * as yup from 'yup';

export default (url, list) => yup
  .string()
  .url('url')
  .notOneOf(list, 'notOneOf')
  .validateSync(url);
