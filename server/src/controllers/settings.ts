import type { Core } from '@strapi/strapi';

export default ({ strapi }: { strapi: Core.Strapi }) => ({

  async getSettings(ctx) {
        const settingService = strapi.plugin("multi-select-filter").service("settings");

        try {
            ctx.body = await settingService.getSettings();
        }
        catch (err) {
            ctx.throw(500, err);
        }
    },

    async setSettings(ctx) {
        const settingService = strapi.plugin("multi-select-filter").service("settings");
        const { body } = ctx.request;
        
        try {
            await settingService.setSettings(body.body);
            ctx.body = await settingService.getSettings();
        }
        catch (err) {
            ctx.throw(500, err);
        }
    }

});