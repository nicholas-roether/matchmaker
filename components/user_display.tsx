import { Button, CircularProgress } from "@material-ui/core";
import { signIn, signOut, useSession } from "next-auth/client";
import React from "react";

const UserDisplay = () => {
	const [session, loading] = useSession();
	if(loading) return <CircularProgress />;
	if(!session) return (
		<Button variant="contained" color="secondary" onClick={() => signIn()}>Sign In</Button>
	)
	return (
		<>
			{session.user.image && <img src={session.user.image} alt="Profile Picture" />}
			<span>{session.user.name}</span>
			<Button variant="outlined" onClick={() => signOut()}>Sign Out</Button>
		</>
	)
}

export default UserDisplay;