import type { Core } from '@strapi/strapi';
import { GetItemsByTagResult, MultiSelectItem, MultiSelectItemCreateRequest, MultiSelectItemId, PluginQueryResponse, PluginSettingsResponse } from '../../../typings';

type Settings = {
  mainField: string;
  defaultSortBy: string;
  defaultSortOrder: string;
};

const getPluginStore = () => {
  return strapi.store({
    environment: '',
    type: 'plugin',
    name: 'multi-select-filter',
  });
};

export default ({ strapi }: { strapi: Core.Strapi }) => ({

  getWelcomeMessage() {
    return {
      body: 'Welcome to Strapi 🚀'
    };
  },

  async getFilteredItems(uid, filter: string, publishedOnly: boolean, queryStart?: number, queryLimit?: number) {
    let res: PluginQueryResponse = {
      result: [],
      errorMessage: "",
      mainField: "",
    };

    try {
      const { findConfiguration } = strapi.plugin('content-manager').service('content-types');
      const { settings }: Record<string, Settings> = await findConfiguration(strapi.contentType(uid));
      const { mainField, defaultSortBy, defaultSortOrder } = settings; //defaultSortBy is 'title' in case of an article

      const pluginStore = getPluginStore();
      let config = (await pluginStore.get({ key: 'settings' })) as PluginSettingsResponse;

      const filters = (!filter) ? undefined : {
        [mainField]: {
          $contains: filter
        }
      };

      const fields = ["id", "publishedAt", mainField];
      const start = queryStart ? queryStart : 0;
      const limit = queryLimit ? queryLimit : config.defaultQueryLimit ?? undefined;
      const sort = publishedOnly ? `publishedAt:desc` : `${defaultSortBy}:${defaultSortOrder}`;

      const total = await strapi.documents(uid).count({
        filters,
        status: publishedOnly ? 'published' : undefined,
        sort: sort as any,
      });

      const result: any[] = await strapi.documents(uid).findMany(
        {
          fields,
          filters,
          status: publishedOnly ? 'published' : undefined,
          start,
          limit,
          sort,
        }
      );

      const hasMeta = limit !== undefined;
      const meta = !hasMeta ? undefined : {
        total, // gets the total number of records
        pageSize: limit, // gets the limit we set earlier
        pageCount: Math.ceil(total / limit), // gives us the number of total pages
        currentPage: start / limit + 1, // returns the current page      
      };

      return <PluginQueryResponse>{ result, mainField, meta };
    }
    catch (error) {
      console.error(error);

      res.result = [];
      res.errorMessage = error;
    }
    return res;
  },

  async updateByTag(tag: string, request: MultiSelectItemCreateRequest[]) {
    const pluginId = "plugin::multi-select-filter.multiselect";

    const multiSelectsToDelete = (await strapi.documents(pluginId).findMany({
      fields: ['id'],
      filters: {
        tag: {
          $eq: tag
        }
      },
    })) as any as MultiSelectItemId[];

    multiSelectsToDelete.forEach(x => {
      strapi.documents(pluginId).delete({
        documentId: x.documentId,
      })
    })

    request.forEach(async (x, index) => {
      await strapi.documents(pluginId).create({
        data: {
          tag,
          ref_uid: x.ref_uid,
          ref_entity_id: x.ref_entity_id,
          ref_published: x.ref_published,
          order: x.order,
        }
      })
    })
  },

  async getItemsByTag(tag: string) {
    const pluginId = "plugin::multi-select-filter.multiselect";

    let res: GetItemsByTagResult = {
      result: [],
      errorMessage: "",
    };

    try {
      const { findConfiguration } = strapi.plugin('content-manager').service('content-types');

      const multiSelects = (await strapi.documents(pluginId).findMany({
        fields: ['tag', 'ref_entity_id', 'ref_published', 'order', 'ref_uid'],
        filters: {
          tag: {
            $eq: tag
          }
        },
        sort: `order:asc`
      })) as any as MultiSelectItem[];

      //map MultiSelectItems by ref_uid (i.e. by api::article.article, api::author.author etc.)
      const multiSelectMap = new Map<string, MultiSelectItem[]>();
      multiSelects.forEach(x => {
        if (multiSelectMap.has(x.ref_uid)) {
          const mapItem = multiSelectMap.get(x.ref_uid);
          mapItem.push(x);
          multiSelectMap.set(x.ref_uid, mapItem);
        }
        else {
          multiSelectMap.set(x.ref_uid, [x]);
        }
      });

      for (const key of multiSelectMap.keys()) {
        const uid = key;

        const { settings }: Record<string, Settings> = await findConfiguration(strapi.contentType(uid as any));
        const { mainField } = settings; //mainField is 'title' in case of an article

        const multiSelectsByEntityId = multiSelectMap.get(key);
        const refPublishedEntityIds = multiSelectsByEntityId.filter(x => x.ref_published).map(x => x.ref_entity_id);
        const refNotPublishedEntityIds = multiSelectsByEntityId.filter(x => !x.ref_published).map(x => x.ref_entity_id);

        let refPublishedEntities: { id: number }[] = [];
        if (refPublishedEntityIds.length > 0)
          refPublishedEntities = (await strapi.db.query(uid)
            .findMany({
              filters: {
                $and: [
                  { id: { $in: refPublishedEntityIds } },
                  { published_at: { $notNull: true } },
                ]
              },
              select: ['id', mainField],
            }));

        let refNotPublishedEntities: { id: number }[] = [];
        if (refNotPublishedEntityIds.length > 0)
          refNotPublishedEntities = (await strapi.db.query(uid)
            .findMany({
              filters: {
                $and: [
                  { id: { $in: refNotPublishedEntityIds } },
                  { published_at: { $null: true } },
                ]
              },
              select: ['id', mainField],
            }));

        multiSelectsByEntityId.forEach(x => {
          if (x.ref_published) {
            const entity = refPublishedEntities.find(y => y.id === x.ref_entity_id);
            if (entity)
              x.title = entity[mainField];
          } else {
            const entity = refNotPublishedEntities.find(y => y.id === x.ref_entity_id);
            if (entity)
              x.title = entity[mainField];
          }
        })
        res.result.push(...multiSelectsByEntityId);
      }
    }
    catch (error) {
      console.error(error);
      res.result = [];
      res.errorMessage = error;
    }
    return res;
  },

});
