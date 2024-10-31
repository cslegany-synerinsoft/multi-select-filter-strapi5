import { useEffect, useRef, useState } from "react";
import { PluginSettingsResponse } from "../../../typings";
import { useFetchClient } from "@strapi/strapi/admin";
import MultiSelectFilter from "./MultiSelectFilter";

interface MultiSelectFilterManagerOptions {
	entityUid?: string;
	apiEndpoint?: string;
	publishedOnly?: boolean;
	queryLimit?: number;
}

interface MultiSelectFilterManagerProps {
	attribute: {
		type: string;
		customField: string;
		options?: MultiSelectFilterManagerOptions;
	},
	label: string;
	name: string;
}

const MultiSelectFilterManager = (props: MultiSelectFilterManagerProps) => {
	const { attribute, label, name } = props;

	const { get } = useFetchClient();

	const defaultSettingsBody: PluginSettingsResponse | null = null;
	const [settings, setSettings] = useState<PluginSettingsResponse | null>(defaultSettingsBody);
	const [isLoading, setIsLoading] = useState(true);
	const isMounted = useRef(true);

	let entityUid = attribute.options?.entityUid;
	let apiEndpoint = attribute.options?.apiEndpoint;
	let publishedOnly = attribute.options?.publishedOnly;
	let queryLimit = attribute.options?.queryLimit;
	let displayName = label;
	let customFieldName = attribute.customField;
	let updateFieldName = undefined;

	useEffect(() => {
		const fetchData = async () => {
			setIsLoading(true);

			const { data } = await get<PluginSettingsResponse>(`/multi-select-filter/settings`);
			setSettings(data);

			setIsLoading(false);
		}
		fetchData();

		// unmount
		return () => {
			isMounted.current = false;
		};
	}, []);

	if (!settings || isLoading)
		return;

	if (!entityUid)
		entityUid = settings?.defaultEntityUid;
	if (!apiEndpoint)
		apiEndpoint = settings?.defaultApiEndpoint;
	if (publishedOnly === undefined)
		publishedOnly = settings?.defaultPublishedOnly ?? false;
	if (queryLimit === undefined)
		queryLimit = settings?.defaultQueryLimit;
	if(updateFieldName === undefined)
		updateFieldName = settings?.updateFieldName;

	if (publishedOnly === undefined || entityUid === undefined)
		return;

	const tagItems = name.split(".");
	const tag = tagItems[tagItems.length - 1];

	return (
		<MultiSelectFilter customFieldName={customFieldName} displayName={displayName} tag={tag} apiEndpoint={apiEndpoint} entityUid={entityUid}
			publishedOnly={publishedOnly} updateFieldName={updateFieldName} queryLimit={queryLimit}
		/>
	);
}

export default MultiSelectFilterManager;