import type { Core } from '@strapi/strapi';
import { MultiSelectCreateRequestBody, MultiSelectPublishRequestBody, PluginQueryRequestBody } from '../../../typings';

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

    if(!ctx.params.status) {
      ctx.throw(400, 'status is required');
    }

    const multiSelectFilter = strapi.plugin("multi-select-filter").service("multiSelectFilter");

    const items = await multiSelectFilter.getItemsByTag(ctx.params.tag, ctx.params.status);
      ctx.type = 'application/json; charset=utf-8';
      ctx.send(items);
  },

  async updateByTag(ctx) {
    const body: MultiSelectCreateRequestBody = ctx.request.body;
    if(!body.tag) {
      ctx.throw(400, 'tag is required');
    }

    const multiSelectFilter = strapi.plugin("multi-select-filter").service("multiSelectFilter");
    const res = await multiSelectFilter.updateByTag(body.tag, body.data);
    ctx.type = 'application/json; charset=utf-8';
    ctx.send(res);
  },

  async publishByTag(ctx) {
    const body: MultiSelectPublishRequestBody = ctx.request.body;
    if(!body.tag) {
      ctx.throw(400, 'tag is required');
    }

    const multiSelectFilter = strapi.plugin("multi-select-filter").service("multiSelectFilter");
    const res = await multiSelectFilter.publishByTag(body.tag);
    ctx.type = 'application/json; charset=utf-8';
    ctx.send(res);
  },

  async documentsGroupedByTag(ctx) {
    const multiSelectFilter = strapi.plugin("multi-select-filter").service("multiSelectFilter");

    const items = await multiSelectFilter.getDocumentsGroupedByTag();
      ctx.type = 'application/json; charset=utf-8';
      ctx.send(items);
  },

});
