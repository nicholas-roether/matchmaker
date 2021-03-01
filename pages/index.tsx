import { Box, Container } from '@material-ui/core';
import Head from 'next/head'
import React from 'react';

const Home = () => {
  return (
    <>
      <Head>
        <title>Matchmaker | Home</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Container maxWidth="lg" component="main">
        <Box mt={3} textAlign="center">Page under construction</Box>
      </Container>
    </>
  )
}

export default Home;