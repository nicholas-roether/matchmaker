import { Avatar, Box, Button, CircularProgress } from "@material-ui/core";
import { signIn, signOut, useSession } from "next-auth/client";
import React from "react";

export interface UserDisplayProps {
	mobile?: boolean
}

const UserDisplay = ({mobile = false}: UserDisplayProps) => {
	const [session, loading] = useSession();
	if(loading) return <CircularProgress />;
	if(!session) return (
		<Button variant="contained" onClick={() => signIn()}>Sign In</Button>
	)
	return (
		<>
			{session.user.image && <Avatar src={session.user.image} alt={session.user.name} />}
			<Box mr={1} />
			{mobile || (
				<>
					<span>{session.user.name}</span>
					<Box mr={2} />
				</>
			)}
			<Button variant="outlined" onClick={() => signOut()}>Sign Out</Button>
		</>
	)
}

export default UserDisplay;