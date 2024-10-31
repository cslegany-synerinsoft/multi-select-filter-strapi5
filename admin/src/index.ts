import { getTranslation } from './utils/getTranslation';
import { PLUGIN_ID } from './pluginId';
import { Initializer } from './components/Initializer';
import { PluginIcon } from './components/PluginIcon';
import { PluginSettingsResponse } from '../../typings';
import { getTranslation as getTrad } from './utils/getTranslation';
import { getCustomFieldSettings } from "./utils/getCustomFieldSettings";
import * as yup from 'yup';

type TradOptions = Record<string, string>;

const prefixPluginTranslations = (
	trad: TradOptions,
	pluginId: string
): TradOptions => {
	if (!pluginId) {
		throw new TypeError("pluginId can't be empty");
	}
	return Object.keys(trad).reduce((acc, current) => {
		acc[`${pluginId}.${current}`] = trad[current];
		return acc;
	}, {} as TradOptions);
};

export const register = async (app: any) => {

	try {
		app.customFields.register({
			name: "multiSelectFilter",
			pluginId: `${PLUGIN_ID}`,
			type: "string", // the selected value will be stored as a string

			intlLabel: {
				id: `${PLUGIN_ID}.plugin.label`,
				defaultMessage: "Multi Select Filter",
			},
			intlDescription: {
				id: `${PLUGIN_ID}.plugin.description`,
				defaultMessage: "Multi Select Dropdown with Filter",
			},
			icon: PluginIcon, // don't forget to create/import your icon component 
			components: {
				Input: async () => {
					const component = await import('./components/MultiSelectFilterManager');
					return component;
				},
			},
			options: {
				advanced: [
					{
						sectionTitle: {
							id: "global.settings",
							defaultMessage: "Settings",
						},
						items: [
							{
								name: "options.entityUid",
								type: "text",
								intlLabel: {
									id: getTrad("plugin.custom-field.advanced.entityUid.label"),
									defaultMessage: "Entity Id",
								},
								description: {
									id: getTrad("plugin.custom-field.advanced.entityUid.description"),
									defaultMessage: "Entity Id to be shown the Multi Select Dropdown",
								},
								placeholder: {
									id: getTrad("plugin.custom-field.advanced.entityUid.placeholder"),
									defaultMessage: '',
								},
								//defaultValue: (await getCustomFieldSettings<PluginSettingsResponse>()).defaultEntityUid,
							},
							{
								name: "options.apiEndpoint",
								type: "text",
								intlLabel: {
									id: getTrad("plugin.custom-field.advanced.apiEndpoint.label"),
									defaultMessage: "Api Endpoint",
								},
								description: {
									id: getTrad("plugin.custom-field.advanced.apiEndpoint.description"),
									defaultMessage: "Api Endpoint to load data for Multi Select Dropdown",
								},
								placeholder: {
									id: getTrad("plugin.custom-field.advanced.apiEndpoint.placeholder"),
									defaultMessage: '',
								},
								//defaultValue: (await getCustomFieldSettings<PluginSettingsResponse>()).defaultApiEndpoint,
							},
						],
					},
					{
						sectionTitle: null,
						items: [
							{
								name: "options.publishedOnly",
								type: "checkbox",
								intlLabel: {
									id: getTrad("plugin.custom-field.advanced.publishedOnly.label"),
									defaultMessage: "Show only published items",
								},
								description: {
									id: getTrad("plugin.custom-field.advanced.publishedOnly.description"),
									defaultMessage: "Show only published items in the Multi Select Dropdown",
								},
								//defaultValue: (await getCustomFieldSettings<PluginSettingsResponse>()).defaultPublishedOnly,
								withDefaultValue: true,
							},
							{
								name: 'options.queryLimit',
								type: 'checkbox-with-number-field',
								intlLabel: {
									id: getTrad("plugin.settings.fields.queryLimit.label"),
									defaultMessage: "Query Limit",
								},
								//defaultValue: (await getCustomFieldSettings<PluginSettingsResponse>()).defaultQueryLimit,
							},
						],
					},
				],
				// validator: (args: any) => ({
				// 	tag: yup.string().required({
				// 		id: "plugin.settings.errors.required",
				// 		defaultMessage: "Required Field",
				// 	}),
				// }),
			},
		});
	}
	catch (err: unknown) {
		// if (err instanceof yup.ValidationError) {
		// 	// Inside this block, err is known to be a ValidationError
		// 	throw new Error(`Custom Field Definition is invalid ${err.errors}`);
		// }
	}

	app.addMenuLink({
		to: `plugins/${PLUGIN_ID}`,
		icon: PluginIcon,
		intlLabel: {
			id: `${PLUGIN_ID}.plugin.name`,
			defaultMessage: PLUGIN_ID,
		},
		Component: async () => {
			const { App } = await import('./pages/App');

			return App;
		},
	});

	app.createSettingSection(
		{
			id: PLUGIN_ID,
			intlLabel: {
				id: `${PLUGIN_ID}.plugin.name`,
				defaultMessage: 'Multi Select Filter',
			},
		},
		[
			{
				intlLabel: {
					id: `${PLUGIN_ID}.plugin.configuration`,
					defaultMessage: 'Configuration',
				},
				id: 'settings',
				to: `${PLUGIN_ID}`,
				Component: () => import('./pages/Settings'),
			},
		]
	);

	app.registerPlugin({
		id: PLUGIN_ID,
		initializer: Initializer,
		isReady: false,
		name: PLUGIN_ID,
	});
}

export const registerTrads = async (app: any) => {
	const { locales } = app;

	const importedTranslations = await Promise.all(
		(locales as string[]).map((locale) => {
			return import(`./translations/${locale}.json`)
				.then(({ default: data }) => {
					return {
						data: prefixPluginTranslations(data, PLUGIN_ID),
						locale,
					};
				})
				.catch(() => {
					return {
						data: {},
						locale,
					};
				});
		})
	);

	return importedTranslations;
}

export default { register, registerTrads };
