import type { Core } from '@strapi/strapi';

const register = ({ strapi }: { strapi: Core.Strapi }) => {
  // register phase
  console.log(strapi.plugin('upload').contentTypes.file.schema)
  strapi.plugin('upload').contentTypes.file.schema.attributes.metadata = {
    type: 'json',
  };
};

export default register;
