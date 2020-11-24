import * as yup from 'yup';

const schema1 = yup.object().shape({
  website: yup.string().url(),
});
const schema2 = (list) => yup.mixed().notOneOf(list);

export const isUrlValid = (url) => schema1
  .isValidSync({
    website: url,
  });

export const isRssListHasUrl = (url, list) => schema2(list).isValidSync(url);
