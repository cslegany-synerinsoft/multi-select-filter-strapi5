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
The plugin can update a potentially hidden field on the Single Type Page form to ensure that Save and Publish buttons of the form work properly.
- You have to register Multi-Select Filter to the Single Type as a custom field. Set a unique name for each instance of your custom field. You can override default settings here.
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
  
  async getFeaturedNews(ctx) {
    return await strapi.service("api::article-filter.articlefilter").getFeaturedNews();
  },

  async getFilteredArticles(ctx) {
    const body = ctx.request.body;
    return await strapi.service('api::article-filter.articlefilter').getFilteredArticles(
      body.filter, body.publishedOnly, body.queryStart, body.queryLimit);
  },
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
    },
    {
      method: 'GET',
      path: '/featured-news',
      handler: 'articlefilter.getFeaturedNews',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    }
  ]
};
```

Now you can develop your own api endpoint to get results from the plugin.
Here we suppose that the Single Type page contains three instances of the custom field named as left_articles, main_articles and right_articles.
articlefilter.ts service is as follows
```
import type * as strapi from '@strapi/strapi';

type Settings = {
  mainField: string;
  defaultSortBy: string;
  defaultSortOrder: string;
};

interface DocumentResponse {
  id: number;
  documentId: string;
}

interface OrderedDocumentResponse extends DocumentResponse {
  order: number;
  tag: string;
}

interface GetDocumentsByTagResult {
  result: {
    uid: string;
    items: OrderedDocumentResponse[];
  }[];
  errorMessage: string;
}

interface FeaturedNewsResult {
  left_articles: DocumentResponse[];
  main_articles: DocumentResponse[];
  right_articles: DocumentResponse[];
}

export default ({ strapi }: { strapi: strapi.Core.Strapi }) => ({

  async getFeaturedNews() {
    const multiSelectFilter = strapi.plugin("multi-select-filter").service("multiSelectFilter");
    const documentResult: GetDocumentsByTagResult = await multiSelectFilter.getDocumentsGroupedByTag();
    if (documentResult.errorMessage)
      return;

    const articleResult = documentResult.result.find(x => x.uid === "api::article.article");
    if (!articleResult)
      return;

    let leftArticles = articleResult.items.filter(x => x.tag === "left_side_multi_select_filter");
    leftArticles = leftArticles.sort(x => x.order);

    let mainArticles = articleResult.items.filter(x => x.tag === "main_multi_select_filter");
    mainArticles = mainArticles.sort(x => x.order);

    let rightArticles = articleResult.items.filter(x => x.tag === "right_side_multi_select_filter");
    rightArticles = rightArticles.sort(x => x.order);

    return <FeaturedNewsResult>{
      left_articles: leftArticles.map(x => <DocumentResponse>{ id: x.id, documentId: x.documentId }),
      main_articles: mainArticles.map(x => <DocumentResponse>{ id: x.id, documentId: x.documentId }),
      right_articles: rightArticles.map(x => <DocumentResponse>{ id: x.id, documentId: x.documentId }),
    }
  },

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

Time to develop your Single Type page which will be called Highlight Settings. Generate a Single Type in src/api/highlight-setting.
Adjust schema.json in content-types as follows:

```
{
  "kind": "singleType",
  "collectionName": "highlight_settings",
  "info": {
    "singularName": "highlight-setting",
    "pluralName": "highlight-settings",
    "displayName": "Highlight Settings",
    "description": ""
  },
  "options": {
    "draftAndPublish": true
  },
  "pluginOptions": {},
  "attributes": {
    "name": {
      "type": "string"
    },
    "featured_news_info": {
      "type": "string"
    },
    "featured_news": {
      "type": "component",
      "repeatable": false,
      "component": "highlighted.highlighted-articles"
    }
  }
}
```

Make a lifecycles.ts file here and add the following code to ensure that multiselect items will get published when you publish your Single Type.

```
import * as Attribute from '@strapi/types/dist/modules/documents/params/attributes';
import { Event } from '@strapi/database/dist/lifecycles';

type LifecycleEvent<T> = Event & {
	result?: T; // since result is only available in `afterXXX` events
}
type MyEvent = LifecycleEvent<Attribute.GetValues<'api::highlight-setting.highlight-setting'>>;

interface MultiSelectItemId {
	id: number;
	documentId: string;
}

const publishByTag = async (tag: string) => {
	const pluginId = "plugin::multi-select-filter.multiselect";

	//delete existing published items
	const multiSelectsToDelete = (await strapi.documents(pluginId).findMany({
		fields: ['id', 'documentId'] as any,
		filters: {
			tag: { $eq: tag },
		},
		status: 'published',
	})) as MultiSelectItemId[];

	await Promise.all(multiSelectsToDelete.map(async (x) => {
		await strapi.documents(pluginId).delete({
			documentId: x.documentId,
			filters: {
				publishedAt: { $notNull: true },
			}
		})
	}))

	//publish not published items
	const multiSelectsToPublish = (await strapi.documents(pluginId).findMany({
		fields: ['id', 'documentId'] as any,
		filters: {
			$and: [
				{ tag: { $eq: tag } },
				{ publishedAt: { $null: true } },
			]
		},
	})) as MultiSelectItemId[];

	await Promise.all(multiSelectsToPublish.map(async (x) => {
		await strapi.documents(pluginId).publish({
			documentId: x.documentId,
		})
	}))
}

export default {

	async beforeDelete(event: MyEvent) {
		const where = event.params.where;

		//we receive the unpublished item's id in where?.id
		//get the documentId belonging to that item
		const unpublishedItem = await strapi.db.query("api::highlight-setting.highlight-setting").findOne({
			where,
			select: ['id', 'documentId']
		});

		//get the id of the published version of this item
		const publishedItem = await strapi.documents("api::highlight-setting.highlight-setting").findOne({
			documentId: unpublishedItem.documentId,
			fields: ['publishedAt'],
			status: 'published',
		})

		//save it to strapi as a temp storage
		strapi["highlight-updating-id"] = publishedItem.id;
	},

	async afterCreate(event: MyEvent) {
		// a publish means a delete and create
		// if there was a delete beforehand, try to get back our saved id which indicates id of the previous published version of the item
		const where = event.params.where;
		const item2UpdatingId = strapi["highlight-updating-id"];

		const unpublishedItem = await strapi.db.query("api::highlight-setting.highlight-setting").findOne({
			where,
			select: ['id', 'documentId']
		});

		const publishedItem = await strapi.documents("api::highlight-setting.highlight-setting").findOne({
			documentId: unpublishedItem.documentId,
			fields: ['publishedAt'],
			populate: ["featured_news"],
			status: 'published',
		})

		//if the current published item isn't the saved one, we published an item
		if (publishedItem.id !== item2UpdatingId || item2UpdatingId === undefined) {
			const multiFilterTags = Object.keys(publishedItem.featured_news).filter(x => x !== "id");

			await Promise.all(multiFilterTags.map(async (tag) => {
				await publishByTag(tag)
			}))
		}

		strapi["highlight-updating-id"] = undefined;
	}
}
```

Finally add the following code to components / highlighted / highlighted-articles.json to add the component required by the Single Type page.

```
{
  "collectionName": "components_highlighted_highlighted_articles",
  "info": {
    "displayName": "Highlighted Articles",
    "icon": "dashboard",
    "description": ""
  },
  "options": {},
  "attributes": {
    "left_side_multi_select_filter": {
      "type": "customField",
      "options": {
        "publishedOnly": true,
        "queryLimit": 20
      },
      "customField": "plugin::multi-select-filter.multiSelectFilter"
    },
    "main_multi_select_filter": {
      "type": "customField",
      "options": {
        "publishedOnly": true,
        "queryLimit": 20
      },
      "customField": "plugin::multi-select-filter.multiSelectFilter"
    },
    "right_side_multi_select_filter": {
      "type": "customField",
      "options": {
        "publishedOnly": true,
        "queryLimit": 20
      },
      "customField": "plugin::multi-select-filter.multiSelectFilter"
    }
  }
}
```

Here you go, now you can use your api endpoint to get highlighted articles in a Next JS application with the following code:

```
  const featuredNews = await fetchAPI(`/featured-news`, []);
  if (!featuredNews)
    return null;

  const mainArticles = featuredNews.main_articles ?? [];
  const leftSideArticles = featuredNews?.left_side_articles ?? [];
  const rightSideArticles = featuredNews?.right_side_articles ?? [];
```