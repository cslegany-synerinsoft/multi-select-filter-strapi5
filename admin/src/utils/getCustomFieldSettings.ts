import { PluginSettingsResponse } from "../../../typings";

export const getCustomFieldSettings = async <T>() => {
	const settings = await fetch(`/multi-select-filter/settings`, {
		method: "GET",
	});
	return settings.json() as T;
}