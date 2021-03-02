import { AppBar, Box, IconButton, Toolbar, Typography } from "@material-ui/core";
import { MenuTwoTone as MenuIcon } from "@material-ui/icons";
import React from "react";
import UserDisplay from "./user_display";

const MyAppBar = () => {
	return (
		<AppBar>
			<Toolbar>
				<IconButton edge="start"><MenuIcon /></IconButton>
				<Box mr={1} />
				<Typography variant="h5">Matchmaker</Typography>
				<Box flexGrow={1} />
				<UserDisplay />
			</Toolbar>
		</AppBar>
	)
}

export default  MyAppBar;