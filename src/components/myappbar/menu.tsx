import { Box, Divider, Drawer, IconButton, List, ListItem, ListItemIcon, ListItemText, makeStyles, SwipeableDrawer, useMediaQuery, useTheme } from "@material-ui/core";
import { CloseTwoTone as CloseIcon, DashboardTwoTone as DashboardIcon, HomeTwoTone as HomeIcon, MenuTwoTone as MenuIcon, QuestionAnswerTwoTone as HelpIcon, VideoLibraryTwoTone as TutorialIcon } from "@material-ui/icons";
import React from "react";
import { useRouter } from "next/router";

const menuWidth = 240;

const useStyles = makeStyles(theme => ({
	drawer: {
		width: menuWidth,
		flexShrink: 0,
		[theme.breakpoints.down("xs")]: {
			width: "100%"
		}
	},
	drawerPaper: {
		width: menuWidth,
		[theme.breakpoints.down("xs")]: {
			width: "100%"
		}
	},
	toolbar: theme.mixins.toolbar
}));

interface MenuOptionProps {
	icon?: React.ReactElement,
	href?: string,
	onClick?: () => void,
	children?: React.ReactNode
}

const MenuOption = ({icon, href, onClick, children}: MenuOptionProps) => {
	const router = useRouter();
	const callback = () => {
		if(onClick) onClick();
		router.push(href);
	}
	return (
		<span onClick={() => callback()}>
			<ListItem button>
				{icon && <ListItemIcon>{icon}</ListItemIcon>}
				{children && <ListItemText>{children}</ListItemText>}
			</ListItem>
		</span>
	);
}

interface MenuOptionsProps {
	onClick?: () => void;
}

const MenuOptions = ({onClick}: MenuOptionsProps) => {
	return (
		<List>
			<MenuOption onClick={onClick} icon={<HomeIcon />} href="/">Home</MenuOption>
			<MenuOption onClick={onClick} icon={<DashboardIcon />} href="/dashboard">Dashboard</MenuOption>
			<MenuOption onClick={onClick} icon={<TutorialIcon />} href="/tutorials">Tutorials</MenuOption>
			<MenuOption onClick={onClick} icon={<HelpIcon />} href="/help">Help</MenuOption>
		</List>
	)
}

interface DrawerContentProps {
	onOptionClick?: () => void;
	onClose: () => void;
}

const DrawerContent = ({onOptionClick, onClose}: DrawerContentProps) => {
	const classes = useStyles();
	return (
		<>
			<Box className={classes.toolbar} display="flex" alignItems="center">
				<ListItem>
					<ListItemIcon>
						<IconButton edge="start" onClick={onClose}><CloseIcon /></IconButton>
					</ListItemIcon>
				</ListItem>
			</Box>
			<Divider />
			<MenuOptions onClick={onOptionClick} />
		</>
	)
}

interface MenuVariantProps {
	open: boolean,
	onClose: () => void,
	onOpen: () => void
}

const DesktopMenu = ({open, onClose}: MenuVariantProps) => {
	const classes = useStyles();
	return (
		<Drawer
			variant="persistent"
			anchor="left"
			open={open}
			className={classes.drawer}
			classes={{
				paper: classes.drawerPaper
			}}
		>
			<DrawerContent onClose={onClose} />
		</Drawer>
	)
}


const MobileMenu = ({open, onClose, onOpen}: MenuVariantProps) => {
	const classes = useStyles();
	return (
		<SwipeableDrawer
			anchor="left"
			open={open}
			onClose={onClose}
			onOpen={onOpen}
			className={classes.drawer}
			classes={{
				paper: classes.drawerPaper
			}}
		>
			<DrawerContent onClose={onClose} onOptionClick={onClose} />
		</SwipeableDrawer>
	)
}

interface MenuProps extends MenuVariantProps {
	variant: "desktop" | "mobile"
}

const Menu = ({variant, ...variantProps}: MenuProps) => {
	switch(variant) {
		case "desktop": return <DesktopMenu {...variantProps} />
		case "mobile": return <MobileMenu {...variantProps} />
	}
}

export default Menu;
export {
	menuWidth
}