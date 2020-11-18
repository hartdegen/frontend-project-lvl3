import * as yup from 'yup';

const schema = yup.object().shape({
  website: yup.string().url(),
});

export default (url) => schema
  .isValidSync({
    website: url,
  });
