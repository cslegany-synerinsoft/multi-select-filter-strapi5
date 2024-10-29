import { Box, Grid, Typography, Flex, IconButton } from "@strapi/design-system";
import { Drag, Trash } from "@strapi/icons";
import { CSSProperties, forwardRef, HTMLAttributes } from "react"
import { MultiSelectItem } from "../../../../typings";

type CustomItemProps = {
	item: MultiSelectItem;
	isOpacityEnabled?: boolean;
	isDragging?: boolean;
	onRemoveItem: (item: MultiSelectItem) => void;
} & HTMLAttributes<HTMLDivElement>

const CustomItem = forwardRef<HTMLDivElement, CustomItemProps>(
	({ item, isOpacityEnabled, isDragging, style, onRemoveItem, ...props }, ref) => {
		const styles: CSSProperties = {
			opacity: isOpacityEnabled ? "0.4" : "1",
			cursor: isDragging ? "grabbing" : "grab",
			lineHeight: "0.5",
			transform: isDragging ? "scale(1.05)" : "scale(1)",
			...style
		}

		const ellipsis = (str: string, num: number = str.length, ellipsisStr = "...") =>
			str.length >= num
				? str.slice(0, num >= ellipsisStr.length ? num - ellipsisStr.length : num) +
				ellipsisStr
				: str;

		item.title = ellipsis(item.title ?? "", 120);

		return (
			<div ref={ref} style={styles} {...props}>
				<Box
					style={{ zIndex: 10, cursor: 'all-scroll', userSelect: 'none' }}
					background="neutral0"
					hasRadius
					shadow="filterShadow"
					padding={2}
				>
					<Box paddingBottom={2} paddingTop={2} width={'100%'}>
						<Flex justifyContent="space-between">
							<Flex>
								<Drag />
								<Typography>
									{item.title}
								</Typography>
							</Flex>
							<Box paddingRight={1}>
								<IconButton withTooltip={false} variant="secondary" onClick={() => onRemoveItem(item)}>
									<Trash />
								</IconButton>
							</Box>
						</Flex>
					</Box>
				</Box>
			</div>
		)
	}
)

export default CustomItem;