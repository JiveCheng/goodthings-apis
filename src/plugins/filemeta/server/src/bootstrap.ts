import type { Core } from '@strapi/strapi';

const bootstrap = ({ strapi }: { strapi: Core.Strapi }) => {
  // bootstrap phase
  console.log(strapi.plugin('upload').contentTypes.file.schema)
};

export default bootstrap;
