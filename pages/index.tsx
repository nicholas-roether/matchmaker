import { Box, Button, Container } from '@material-ui/core';
import { signIn, signOut, useSession } from 'next-auth/client';
import Head from 'next/head'
import React from 'react';

const Home = () => {
  const [session, loading] = useSession();
  if(loading) return null;
  return (
    <>
      <Head>
        <title>Matchmaker | Home</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Container maxWidth="lg" component="main">
        <Box mt={3} textAlign="center">
          Page under construction
          <br />
          {
            session ? (
              <>
                <code>{JSON.stringify(session.user)}</code>
                <Button variant="contained" color="primary" onClick={() => signOut()}>Logout</Button>
              </>
            ) :
            <Button variant="contained" color="primary" onClick={() => signIn()}>Login</Button>
          }
        </Box>
      </Container>
    </>
  )
}

export default Home;