import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { HTMLAttributes } from "react"
import CustomItem from "./CustomItem"
import { MultiSelectItem } from "../../../../typings"

type SortableListItemProps = {
	item: MultiSelectItem;
	disabled: boolean;
	onRemoveItem: (item: MultiSelectItem) => void;
} & HTMLAttributes<HTMLDivElement>

const SortableListItem = ({ item, ...props }: SortableListItemProps) => {
	const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({
		id: item.id,
	})

	const styles = {
		transform: CSS.Transform.toString(transform),
		transition: transition || undefined,
	}

	return (
		<CustomItem
			item={item}
			ref={setNodeRef}
			style={styles}
			isOpacityEnabled={isDragging}
			{...props}
			{...attributes}
			{...listeners}
		/>
	)
}

export default SortableListItem;