import * as yup from 'yup';

export default (url, list) => yup
  .string()
  .url('unvalidUrlError')
  .notOneOf(list, 'blacklistError')
  .validateSync(url);
