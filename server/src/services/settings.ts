import type { Core } from '@strapi/strapi';
import { PluginSettingsResponse } from '../../../typings';

const getPluginStore = () => {
    return strapi.store({
        environment: '',
        type: 'plugin',
        name: 'multi-select-filter',
    });
};

const createDefaultConfig = async () => {
    const pluginStore = getPluginStore();

    const value: PluginSettingsResponse = {
        defaultEntityUid: "api::article.article",
        defaultApiEndpoint: "",
        defaultPublishedOnly: false,
        defaultQueryLimit: 50,
    };
    await pluginStore.set({ key: 'settings', value });
    return pluginStore.get({ key: 'settings' });
};

export default ({ strapi }: { strapi: Core.Strapi }) => ({

    async getSettings() {
        const pluginStore = getPluginStore();
        let config = await pluginStore.get({ key: 'settings' });
        if (!config) {
            config = await createDefaultConfig();
        }
        return config;
    },

    async setSettings(settings) {
        const value = settings;
        const pluginStore = getPluginStore();

        await pluginStore.set({ key: 'settings', value });
        return pluginStore.get({ key: 'settings' });
    },

});