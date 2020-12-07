import * as yup from 'yup';

export const isValid = (url) => {
  const schema = yup.object().shape({
    website: yup.string().url(),
  });
  return schema.isValidSync({
    website: url,
  });
};

export const isIncluded = (url, list) => {
  const schema = yup.string().notOneOf(list);
  return schema.isValidSync(url);
};
