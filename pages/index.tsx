import { Box, Button, Container } from '@material-ui/core';
import { signIn, useSession } from 'next-auth/client';
import Head from 'next/head'
import React from 'react';

const Home = () => {
  const [session, loading] = useSession();
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
            loading ? "Loading..." :
            session.user ? JSON.stringify(session.user) :
            <Button variant="contained" color="primary" onClick={() => signIn()}>Login</Button>
          }
        </Box>
      </Container>
    </>
  )
}

export default Home;