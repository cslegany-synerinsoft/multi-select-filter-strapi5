import {
	Box,
	Flex,
	SingleSelect,
	SingleSelectOption,
	TextInput,
	Field,
} from "@strapi/design-system";
import { CloudUpload, Information, Trash } from "@strapi/icons";
import { useIntl } from "react-intl";
import { getTranslation as getTrad } from '../utils/getTranslation';
import TooltipIconButton from "./TooltipIconButton";
import { DocumentResponse, GetItemsByTagResult, MultiSelectItem, MultiSelectItemCreateRequest, PluginQueryResponse } from "../../../typings";
import SortableList from "./DragDrop/SortableList";
import { SortEndParams } from "./DragDrop/typings";
import { useEffect, useRef, useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { useFetchClient, useNotification } from "@strapi/strapi/admin";
import { unstable_useContentManagerContext as useContentManagerContext } from '@strapi/strapi/admin';
import moment from "moment";

interface MultiSelectListProps {
	displayName?: string;
	customFieldName: string;
	tag?: string;
	queryResponse: PluginQueryResponse;
	filter: string;
	setFilter: (filter: string) => void;
	onSelectReachEnd: () => void;
	publishedOnly: boolean;
	entityUid: string;
	disabled: boolean;
}

const MultiSelectList = (props: MultiSelectListProps) => {
	const { displayName, customFieldName, tag, queryResponse, filter, setFilter, onSelectReachEnd, publishedOnly, entityUid, disabled } = props;

	const { get, post } = useFetchClient();
	const { toggleNotification } = useNotification();
	const isMounted = useRef(true);

	const [isLoading, setIsLoading] = useState(true);
	const [multiSelectItems, setMultiSelectItems] = useState<MultiSelectItem[]>([]);

	const { form } = useContentManagerContext();
	const { initialValues, values, onChange } = form;

	useEffect(() => {
		const fetchData = async () => {
			setIsLoading(true);

			const status = disabled ? 'published' : 'draft';
			const { data } = await get<GetItemsByTagResult>(`/multi-select-filter/items/${tag}/${status}`);
			const sortedResult = data.result.sort(x => x.order);
			setMultiSelectItems(sortedResult);

			setIsLoading(false);
		}
		fetchData();

		// unmount
		return () => {
			isMounted.current = false;
		};
	}, []);

	const { formatMessage } = useIntl();

	const onClearFilter = () => {
		setFilter("");
	}

	const getComboboxDisplayValue = (item: DocumentResponse, mainField: string) => {
		if (mainField in item)
			return (item as any)[mainField];
		return null;
	}

	const onUpdateMultiSelectItems = async (itemRequest: MultiSelectItemCreateRequest[]) => {
		setIsLoading(true);

		const requestData = {
			tag,
			data: itemRequest,
		};
		await post<PluginQueryResponse>(`/multi-select-filter/update`, requestData);
		const status = disabled ? 'published' : 'draft';
		const { data } = await get<GetItemsByTagResult>(`/multi-select-filter/items/${tag}/${status}`);
		const sortedResult = data.result.sort(x => x.order);
		setMultiSelectItems(sortedResult);

		setIsLoading(false);

		onChange('featured_news_info', `Last update: ${moment().format('YYYY-MM-DD HH:mm:ss')}`);
	}

	const convertMultiSelectItems = (multiSelectItems: MultiSelectItem[]) => {
		const requestList: MultiSelectItemCreateRequest[] = [];
		multiSelectItems.forEach(x => {
			requestList.push({
				ref_entity_id: x.ref_entity_id,
				ref_published: x.ref_published,
				ref_uid: x.ref_uid,
				order: x.order,
			})
		})
		return requestList;
	}

	const onDocumentSelected = async (documentId: string) => {
		if (!documentId || !tag)
			return;

		const alreadyContains = multiSelectItems.find(x => x.ref_entity_id === documentId);
		if (alreadyContains) {
			toggleNotification({
				type: 'info',
				message: formatMessage({
					id: getTrad('plugin.list.notification.alreadyContains'),
					defaultMessage: 'Selected item has already been added to the list',
				}, {
					"itemList": displayName,
				}),
			});
			return;
		}

		const requestList = convertMultiSelectItems(multiSelectItems);
		requestList.push({
			order: multiSelectItems.length + 1,
			ref_uid: entityUid,
			ref_published: publishedOnly,
			ref_entity_id: documentId,
		});

		await onUpdateMultiSelectItems(requestList);
	}

	const onSortEnd = async (params: SortEndParams) => {
		const { oldIndex, newIndex } = params;
		if (oldIndex !== newIndex) {
			let updatedMultiSelectItems = multiSelectItems.map(item => ({ ...item }));
			updatedMultiSelectItems = arrayMove<MultiSelectItem>(updatedMultiSelectItems, oldIndex, newIndex);
			updatedMultiSelectItems.forEach((x, index) => {
				x.order = index + 1;
			});
			const requestList = convertMultiSelectItems(updatedMultiSelectItems);
			await onUpdateMultiSelectItems(requestList);
		}
	}

	const onRemoveItem = async (item: MultiSelectItem) => {
		let documentIndex = multiSelectItems.findIndex(x => x.ref_entity_id === item.ref_entity_id);
		if (documentIndex === -1)
			return;

		const updatedMultiSelectItems = multiSelectItems.filter((item, itemIndex) => itemIndex !== documentIndex);
		updatedMultiSelectItems.forEach((x, index) => {
			x.order = index + 1;
		});
		const requestList = convertMultiSelectItems(updatedMultiSelectItems);
		await onUpdateMultiSelectItems(requestList);
	}

	return (
		<>
			<Field.Root name={`field_${customFieldName}`}
				error={queryResponse.errorMessage ? queryResponse.errorMessage : ""}
				hint={formatMessage({ id: getTrad("plugin.dropdown.info.hint") })}>
				{displayName && (
					<Field.Label>
						{displayName}
					</Field.Label>
				)}
				<Flex justifyContent="space-between">
					<Box style={{ width: '100%' }}>
						<TextInput
							name={`input_${customFieldName}`}
							placeholder={"Filter items"}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilter(e.target.value)}
							value={filter}
							disabled={disabled}
						/>
					</Box>
					<Box marginLeft={2}>
						<Flex>
							<TooltipIconButton disabled={filter === "" || disabled} onClick={onClearFilter}
								label={formatMessage({ id: getTrad("plugin.dropdown.buttons.clear") })}
								showBorder={true} variant='ghost'>
								<Trash />
							</TooltipIconButton>
							<Box paddingLeft={2}>
								<TooltipIconButton label={formatMessage({ id: getTrad("plugin.dropdown.info.tooltip") })} showBorder={true} variant='ghost'>
									<Information />
								</TooltipIconButton>
							</Box>
						</Flex>
					</Box>
				</Flex>
				{
					queryResponse.result.length > 0 && (
						<Box style={{ width: '100%' }} paddingTop={2}>
							<SingleSelect onReachEnd={onSelectReachEnd} disabled={disabled}
								onChange={(e: string) => onDocumentSelected(e)}
								placeholder="Select an item...">
								{queryResponse.result.map((item) => {
									return (
										<SingleSelectOption key={item.documentId} value={item.documentId}>
											{getComboboxDisplayValue(item, queryResponse.mainField)}
										</SingleSelectOption>
									);
								})}
							</SingleSelect>
						</Box>
					)
				}
				<Field.Hint />
				{queryResponse.errorMessage && <Field.Error />}
			</Field.Root>

			<Box paddingTop={4}>
				<SortableList data={multiSelectItems} onSortEnd={onSortEnd} onRemoveItem={onRemoveItem} disabled={disabled}></SortableList>
			</Box>
		</>
	)
}

export default MultiSelectList;