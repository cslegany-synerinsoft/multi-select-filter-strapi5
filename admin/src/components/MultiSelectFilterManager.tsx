import { useEffect, useRef, useState } from "react";
import { PluginSettingsResponse } from "../../../typings";
import { useFetchClient } from "@strapi/strapi/admin";
import MultiSelectFilter from "./MultiSelectFilter";

interface MultiSelectFilterManagerOptions {
	entityUid?: string;
	apiEndpoint?: string;
	publishedOnly?: boolean;
	queryLimit?: number;
	tag?: string;
}

interface MultiSelectFilterManagerProps {
	attribute: {
		type: string;
		customField: string;
		options?: MultiSelectFilterManagerOptions;
	},
	label: string;
}

const MultiSelectFilterManager = (props: MultiSelectFilterManagerProps) => {
	const { attribute, label } = props;

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
	let tag = attribute.options?.tag;
	let customFieldName = attribute.customField;

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

	if (publishedOnly === undefined || entityUid === undefined || tag === undefined)
		return;

	return (
		<MultiSelectFilter customFieldName={customFieldName} displayName={displayName} apiEndpoint={apiEndpoint} entityUid={entityUid}
			publishedOnly={publishedOnly} queryLimit={queryLimit} tag={tag}
		/>
	);
}

export default MultiSelectFilterManager;