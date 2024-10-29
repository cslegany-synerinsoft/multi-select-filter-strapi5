export default {
  //type: admin: internal and can be accessible only by the admin part (front-end part) of the plugin
  //type: content-api: accessible from external classical rest api, need to set access in strapi's Users & Permissions plugin
  //call: http://localhost:1337/multi-select-filter/welcome and you'll receive getWelcomeMessage()

  type: 'admin', //changed from content-api to admin
  routes: [
    {
      method: 'GET',
      path: '/welcome',
      handler: 'multiSelectFilter.welcome',
      config: {
        policies: [],
        auth: false,
      }
    },
    {
      method: 'POST',
      path: '/filter',
      handler: 'multiSelectFilter.filter',
      config: {
        policies: [],
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/items/:tag',
      handler: 'multiSelectFilter.itemsByTag',
      config: {
        policies: [],
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/update',
      handler: 'multiSelectFilter.updateByTag',
      config: {
        policies: [],
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/documents',
      handler: 'multiSelectFilter.documentsGroupedByTag',
      config: {
        policies: [],
        auth: false,
      },
    },
  ]
}