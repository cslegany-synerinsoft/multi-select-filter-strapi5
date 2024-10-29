import type { Core } from '@strapi/strapi';
import { MultiSelectCreateRequestBody, PluginQueryRequestBody } from '../../../typings';

export default ({ strapi }: { strapi: Core.Strapi }) => ({

  async welcome(ctx) {
    const multiSelectFilter = strapi.plugin("multi-select-filter").service("multiSelectFilter");

    try {
      ctx.body = await multiSelectFilter.getWelcomeMessage();
    }
    catch (err) {
      ctx.throw(500, err);
    }
  },

  async filter(ctx) {
    const body: PluginQueryRequestBody = ctx.request.body;
    if (!body.uid) {
      ctx.throw(400, 'uid is required');
    }

    const multiSelectFilter = strapi.plugin("multi-select-filter").service("multiSelectFilter");

    const filteredItems = await multiSelectFilter.getFilteredItems(body.uid, body.filter, body.publishedOnly, body.queryStart, body.queryLimit);
    ctx.type = 'application/json; charset=utf-8';
    ctx.send(filteredItems);
  },

  async itemsByTag(ctx) {
    
    if(!ctx.params.tag) {
      ctx.throw(400, 'tag is required');
    }

    const multiSelectFilter = strapi.plugin("multi-select-filter").service("multiSelectFilter");

    const items = await multiSelectFilter.getItemsByTag(ctx.params.tag);
      ctx.type = 'application/json; charset=utf-8';
      ctx.send(items);
  },

  async updateByTag(ctx) {
    const body: MultiSelectCreateRequestBody = ctx.request.body;
    if(!body.tag) {
      ctx.throw(400, 'tag is required');
    }

    const multiSelectFilter = strapi.plugin("multi-select-filter").service("multiSelectFilter");
    const filteredItems = await multiSelectFilter.updateByTag(body.tag, body.data);
    ctx.type = 'application/json; charset=utf-8';
    ctx.send(filteredItems);
  }

});
