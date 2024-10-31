import { useEffect, useRef, useState } from "react";
import { useFetchClient } from "@strapi/strapi/admin";
import { useDebounce } from "use-debounce";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom"; //In react-router-dom v6 useHistory() is replaced by useNavigate().

import { ApiEndpointRequestBody, PluginQueryRequestBody, PluginQueryResponse, PluginSettingsResponse } from "../../../typings";
import MultiSelectList from "./MultiSelectList";

interface MultiSelectFilterProps {
	entityUid: string;
	apiEndpoint?: string;
	publishedOnly: boolean;
	queryLimit?: number;
	displayName: string;
	customFieldName: string;
	tag: string;
}

const MultiSelectFilter = (props: MultiSelectFilterProps) => {
	const { apiEndpoint, customFieldName, entityUid, publishedOnly, queryLimit, displayName, tag } = props;

	const { post } = useFetchClient();
	const { pathname } = useLocation();
	const [searchParams] = useSearchParams();

	const [queryResponse, setQueryResponse] = useState<PluginQueryResponse>({
		mainField: '', result: [],
	});
	const [isLoading, setIsLoading] = useState(true);
	const [queryStart, setQueryStart] = useState(0);

	const [filter, setFilter] = useState<string>("");
	const [debouncedFilter] = useDebounce(filter, 500);

	const fetchApiEndpoint = async (apiEndpoint: string, filter: string, queryStart: number) => {
		if (apiEndpoint.startsWith("/api"))
			apiEndpoint = apiEndpoint.substring(4);
		if (apiEndpoint.startsWith("/"))
			apiEndpoint = apiEndpoint?.substring(1);

		const endpointRequestData: ApiEndpointRequestBody = {
			apiEndpoint,
			filter,
			publishedOnly: true,
			queryStart,
			queryLimit,
		}

		const res = await post<PluginQueryResponse>(`/api/${apiEndpoint}`, endpointRequestData);
		return res.data;
	}

	const fetchEntityByUid = async (entityUid: string, filter: string, queryStart: number) => {
		const queryRequestData: PluginQueryRequestBody = {
			uid: entityUid,
			filter,
			publishedOnly: true,
			queryStart,
			queryLimit,
		}

		const res = await post<PluginQueryResponse>(`/multi-select-filter/filter`, queryRequestData);
		return res.data;
	}

	const calculateQueryStart = () => {
		if (queryResponse) {
			const pageSize = queryResponse.meta?.pageSize ?? 0;
			if (pageSize) {
				const newQueryStart = queryStart + pageSize;
				return newQueryStart;
			}
		}
		return 0;
	}

	const mergeQueryResponse = (newQueryResponse: PluginQueryResponse) => {
		const mergedQueryResponse: PluginQueryResponse = { ...newQueryResponse };
		const oldQueryResponse = { ...queryResponse };
		if (oldQueryResponse) {
			mergedQueryResponse.result = [...oldQueryResponse.result, ...newQueryResponse.result];
		}
		return mergedQueryResponse;
	}

	const fetchFilteredItems = async (filterParam: string) => {
		setIsLoading(true);
		setQueryStart(0);

		if (!entityUid && !apiEndpoint) {
			setIsLoading(false);
			return;
		}

		if (apiEndpoint) {
			const res = await fetchApiEndpoint(apiEndpoint, filterParam, 0);
			setQueryResponse(res);
		}
		else if (entityUid) {
			const res = await fetchEntityByUid(entityUid, filterParam, 0);
			setQueryResponse(res);
		}

		setIsLoading(false);
	}

	const fetchMoreFilteredItems = async () => {
		if (queryResponse && queryResponse.meta?.currentPage === queryResponse.meta?.pageCount)
			return;

		setIsLoading(true);

		if (!entityUid && !apiEndpoint) {
			setIsLoading(false);
			return;
		}

		if (apiEndpoint) {
			let res = await fetchApiEndpoint(apiEndpoint, filter, queryStart);
			res = mergeQueryResponse(res);
			setQueryResponse(res);
		}
		else if (entityUid) {
			let res = await fetchEntityByUid(entityUid, filter, queryStart);
			res = mergeQueryResponse(res);
			setQueryResponse(res);
		}

		setIsLoading(false);
	}


	useEffect(() => {
		const fetchData = async () => {
			setIsLoading(true);

			await fetchFilteredItems(filter);
			setIsLoading(false);
		}
		fetchData();
	}, []);

	useEffect(() => {
		const fetchData = async () => {
			await fetchFilteredItems(debouncedFilter);
		}
		fetchData();
	}, [debouncedFilter]);

	// if scrolling indicated that we reached the bottom, we set the calculated new queryStart
	// since there isn't a proper callback function we fetch more items only if queryStart isn't 0
	// https://stackoverflow.com/questions/54954091/how-to-use-callback-with-usestate-hook-in-react
	// setQueryStart invokes the bottom useEffect that depends on queryStart
	const onSelectReachEnd = async () => {
		const newQueryStart = calculateQueryStart();
		setQueryStart(newQueryStart);
	}

	useEffect(() => {
		const fetchData = async () => {
			await fetchMoreFilteredItems();
		}

		if (queryStart > 0)
			fetchData();
	}, [queryStart])

	const status = searchParams.get('status')?.toLocaleLowerCase();

	return (
		<>
			<MultiSelectList displayName={displayName} customFieldName={customFieldName} tag={tag} entityUid={entityUid} disabled={status === "published"}
				filter={filter} publishedOnly={publishedOnly} setFilter={setFilter}
				queryResponse={queryResponse} onSelectReachEnd={onSelectReachEnd} />
		</>
	);
}

export default MultiSelectFilter;