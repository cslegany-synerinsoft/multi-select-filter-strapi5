import type { Core } from '@strapi/strapi';

const register = ({ strapi }: { strapi: Core.Strapi }) => {
  // register phase
  strapi.customFields.register({
    name: 'multiSelectFilter',
    plugin: 'multi-select-filter',
    type: 'string',
  })

};

export default register;
