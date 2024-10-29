export default {
    type: 'admin',
    routes: [
        {
            method: 'GET',
            path: '/settings',
            handler: 'settings.getSettings',
            //config: { policies: [] }
            config: {
                auth: false,
                policies: [],
                middlewares: [],
            }
        },
        {
            method: 'POST',
            path: '/settings',
            handler: 'settings.setSettings',
            //config: { policies: [] }
            config: {
                auth: false,
                policies: [],
                middlewares: [],
            }
        }
    ]
}