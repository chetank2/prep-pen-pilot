import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import { DocumentUploader } from './components/DocumentUploader';

function App() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          UPSC Document Processor
        </Typography>
        <DocumentUploader />
      </Box>
    </Container>
  );
}

export default App;
