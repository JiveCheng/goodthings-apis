import type { Core } from '@strapi/strapi';

const controller = ({ strapi }: { strapi: Core.Strapi }) => ({
  index(ctx) {
    const {
      query: { id }
    } = ctx;
    console.log('id', id);
  },
});

export default controller;
