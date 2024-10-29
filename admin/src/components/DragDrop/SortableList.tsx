import React, { useState } from 'react';
import {
	DndContext,
	PointerSensor,
	useSensor,
	useSensors,
	DragStartEvent,
	DragEndEvent,
	TouchSensor,
	closestCenter
} from "@dnd-kit/core"
import {
	arrayMove,
	SortableContext,
} from "@dnd-kit/sortable"
import SortableListItem from './SortableListItem';
import { SortEndParams } from './typings';
import { Box } from '@strapi/design-system';
import { MultiSelectItem } from '../../../../typings';

interface SortableListProps {
	data: MultiSelectItem[];
	onSortEnd: (item: SortEndParams) => void;
	onRemoveItem: (item: MultiSelectItem) => void;
};

const SortableList = ({ data, onSortEnd, onRemoveItem }: SortableListProps) => {
	const defaultItems = data;
	const [items, setItems] = useState<MultiSelectItem[]>(defaultItems);
	if (items.length !== defaultItems.length)
		setItems(defaultItems);

	// for drag overlay
	const [activeItem, setActiveItem] = useState<MultiSelectItem>();

	// for input methods detection
	// https://stackoverflow.com/questions/77415442/listeners-from-dnd-kit-are-interfering-with-the-inputcheckboxs-onchange-event
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
		useSensor(TouchSensor, {
			activationConstraint: {
				delay: 50,
				tolerance: 6,
			},
		}),
	);

	// triggered when dragging starts
	const handleDragStart = (event: DragStartEvent) => {
		const { active } = event;
		setActiveItem(items.find((item) => item.id === active.id));
	}

	// triggered when dragging ends
	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (!over) return;

		const activeItem = items.find((item) => item.id === active.id);
		const overItem = items.find((item) => item.id === over.id);

		if (!activeItem || !overItem) {
			return;
		}

		const activeIndex = items.findIndex((item) => item.id === active.id);
		const overIndex = items.findIndex((item) => item.id === over.id);

		if (activeIndex !== overIndex) {
			setItems((prev) => arrayMove<MultiSelectItem>(prev, activeIndex, overIndex))
		}
		setActiveItem(undefined);
		onSortEnd({ oldIndex: activeIndex, newIndex: overIndex });
	}

	const handleDragCancel = () => {
		setActiveItem(undefined);
	}

	return (
		<Box style={{ width: "100%" }}>
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragStart={handleDragStart}
				onDragEnd={handleDragEnd}
				onDragCancel={handleDragCancel}
			>
				<SortableContext items={items}>
					{items.map((item) => (
						<SortableListItem key={item.id} item={item} onRemoveItem={onRemoveItem} />
					))}
				</SortableContext>
			</DndContext>
		</Box>
	);
}

export default SortableList;