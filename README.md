# strapi5-multi-select-filter
> This package adds a customizable Multi-Select Filter to replace the default one.

## Installation

NPM:

> `npm install @cslegany/multi-select-filter-strapi5`

Yarn:

> `yarn add @cslegany/multi-select-filter-strapi5`

## Usage
- This plugin was created becase we wanted to display a list of articles on a Single Type Page to get something like
a list of selected articles for Featured News.
- Default Settings of this plugin are accessible via Settings / Multi Select Filter / Configuration. 
You can set a default Entity Uid (i.e. api::article.article), a custom api endpoint, the option to show only published items and a query limit.
- You have to register Multi-Select Filter to the Single Type as a custom field. Please fill in TAG with a valid value,
currently validation fails because of a Strapi 5 bug. Set a unique value for each instance of your custom field. You can override default settings here.
- Thereafter you can use the plugin on the Single Type Page. It supports infinite loading and query limit is the maximum amount of items loaded in one batch.
- It is highly recommended to show only published items since you don't want to display drafts in a Featured News section.
- If you don't provide an Api Endpoint, a basic query will be used by the plugin to query all items specified by the Entity Uid and sort them by the entity's mainField property.

## Custom Api Endpoint
You can write your custom api endpoint for your main Strapi project to suit your business needs. The following is an example that supports a scheduled_at field for articles.
Logic is that you need only those articles which were scheduled before the current date and we suppose that scheduled_at always has a value.
Meta pagination info is needed for infinite scrolling.
Return value of the service is fixed, it has to contain an object
``` 
{
  result: {"id", "documentId" }[],
  mainField: string,
  meta: {
     total: number;
     pageSize: number;
     pageCount: number;
     currentPage: number;
  } | undefined,
}
```

The api endpoint POST request also has a fixed format and have to supply the following values:
filter: string, publishedOnly?: boolean, queryStart?: number, queryLimit?: number

articlefilter.ts controller is as follows
```
import type * as strapi from '@strapi/strapi';

export default ({ strapi }: { strapi: strapi.Core.Strapi }) => ({
  async getFilteredArticles(ctx) {
    const body = ctx.request.body;
    return await strapi.service('api::article-filter.articlefilter').getFilteredArticles(
      body.filter, body.publishedOnly, body.queryStart, body.queryLimit)
  }
})
```

articlefilter.ts route is as follows
```
export default {
  routes: [
    {
      method: 'POST',
      path: '/article-filter',
      handler: 'articlefilter.getFilteredArticles',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    }
  ]
};
```

articlefilter.ts service is as follows
```
import type * as strapi from '@strapi/strapi';

type Settings = {
  mainField: string;
  defaultSortBy: string;
  defaultSortOrder: string;
};

export default ({ strapi }: { strapi: strapi.Core.Strapi }) => ({

  async getFilteredArticles(filter: string, publishedOnly?: boolean, queryStart?: number, queryLimit?: number) {
    let res = {
      result: [],
      errorMessage: "",
      mainField: "",
    };

    try {
      const { findConfiguration } = strapi.plugin('content-manager').service('content-types');
      const { settings }: Record<string, Settings> = await findConfiguration(strapi.contentType("api::article.article"));
      const { mainField, defaultSortBy, defaultSortOrder } = settings; //defaultSortBy is 'title' in case of an article

      const scheduledAtFilter = {
        scheduled_at: { $lte: (new Date).toISOString() }
      };

      const mainFieldFilter = {
        [mainField]: {
          $contains: filter
        }
      };

      const publishedFilter = {
        $and: [
          mainFieldFilter,
          { publishedAt: { $notNull: true } },
          scheduledAtFilter,
        ],
      };

      const notPublishedFilter = {
        $and: [
          mainFieldFilter,
          scheduledAtFilter,
        ],
      };

      let filters = (!filter) 
        ? scheduledAtFilter 
        : publishedOnly
          ? publishedFilter 
          : notPublishedFilter;

      const start = queryStart ?? 0;
      const limit = queryLimit ?? undefined;
      const sort = publishedOnly ? `scheduled_at:desc` : `${defaultSortBy}:${defaultSortOrder}`;

      const total = await strapi.documents("api::article.article").count({
        filters,
        status: publishedOnly ? 'published' : undefined,
        sort: sort as any,
      });

      const documents = await strapi.documents("api::article.article").findMany({
        fields: ["id", "publishedAt", "scheduled_at", mainField] as any,
        filters,
        status: publishedOnly ? 'published' : undefined,
        start,
        limit,
        sort: sort as any,
      });

      const hasMeta = limit !== undefined;
      const meta = !hasMeta ? undefined : {
        total, // gets the total number of records
        pageSize: limit, // gets the limit we set earlier
        pageCount: Math.ceil(total / limit), // gives us the number of total pages
        currentPage: start / limit + 1, // returns the current page      
      };

      return {
        result: documents,
        mainField,
        meta,
      }
    }
    catch (error) {
      console.error(error);

      res.result = [];
      res.errorMessage = error;
    }

    return res;
  }
})
```


