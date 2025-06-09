import React, { useState, useCallback } from 'react';
import { Box, Button, Typography, CircularProgress, Paper, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import { Upload as UploadIcon, Description as DescriptionIcon, Image as ImageIcon } from '@mui/icons-material';
import { DocumentProcessor } from '../services/DocumentProcessor';
import { useDropzone } from 'react-dropzone';

interface ProcessedDocument {
  id: string;
  originalName: string;
  type: 'pdf' | 'image';
  content: string;
  metadata: {
    pageCount?: number;
    dimensions?: {
      width: number;
      height: number;
    };
    wordCount: number;
    processedAt: string;
    mimeType: string;
  };
}

export const DocumentUploader: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedDocuments, setProcessedDocuments] = useState<ProcessedDocument[]>([]);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsProcessing(true);
    setError(null);

    try {
      for (const file of acceptedFiles) {
        if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
          const processedDoc = await DocumentProcessor.processFile(file);
          setProcessedDocuments(prev => [...prev, processedDoc]);
        } else {
          setError(`Unsupported file type: ${file.type}`);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while processing the file');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    }
  });

  return (
    <Box sx={{ p: 3 }}>
      <Paper
        {...getRootProps()}
        sx={{
          p: 3,
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'divider'
        }}
      >
        <input {...getInputProps()} />
        <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {isDragActive ? 'Drop the files here' : 'Drag and drop files here, or click to select files'}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Supported formats: PDF, PNG, JPG, JPEG, GIF
        </Typography>
      </Paper>

      {isProcessing && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}

      {processedDocuments.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Processed Documents
          </Typography>
          <List>
            {processedDocuments.map((doc) => (
              <ListItem key={doc.id}>
                <ListItemIcon>
                  {doc.type === 'pdf' ? <DescriptionIcon /> : <ImageIcon />}
                </ListItemIcon>
                <ListItemText
                  primary={doc.originalName}
                  secondary={
                    <>
                      <Typography component="span" variant="body2">
                        Type: {doc.type.toUpperCase()}
                      </Typography>
                      <br />
                      <Typography component="span" variant="body2">
                        Word Count: {doc.metadata.wordCount}
                      </Typography>
                      {doc.metadata.pageCount && (
                        <>
                          <br />
                          <Typography component="span" variant="body2">
                            Pages: {doc.metadata.pageCount}
                          </Typography>
                        </>
                      )}
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
}; 