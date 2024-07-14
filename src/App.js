import React, { useState, useRef } from "react";
import "./App.css";
import "@aws-amplify/ui-react/styles.css";
import {
  Button,
  Flex,
  Heading,
  TextField,
  Image,
  View,
  Card,
  withAuthenticator,
} from "@aws-amplify/ui-react";
import { generateClient } from 'aws-amplify/api';
import { uploadData, getUrl, remove } from 'aws-amplify/storage';

const client = generateClient();

const App = ({ signOut }) => {
  const [file, setFile] = useState(null);
  const [imageKey, setImageKey] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef(null);

  const sanitizeFileName = (fileName) => {
    return fileName.replace(/[^a-zA-Z0-9-_\.]/g, '_');
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (file) {
      const originalName = sanitizeFileName(file.name);
      console.log(`Uploading file with key: ${originalName} and content type: ${file.type}`);
      
      try {
        await uploadData({
          key: originalName,
          data: file,
          contentType: file.type
        });

        const url = await getUrl({ key: originalName });
        setImageKey(originalName);
        setImageUrl(url.url);
        setFile(null);
        setMessage(`Uploaded successfully: ${originalName}`);
        // Reset the file input field
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        console.error("Error uploading file: ", error);
        setMessage('Error uploading file');
      }
    }
  };

  const handleRemove = async () => {
    if (imageKey) {
      try {
        await remove({ key: imageKey });
        setImageKey(null);
        setImageUrl(null);
        setMessage('Image removed successfully');
      } catch (error) {
        console.error("Error removing file: ", error);
        setMessage('Error removing file');
      }
    }
  };

  return (
    <View className="App">
      <Heading level={1} textAlign="center" margin="2rem">
        Image Recognition App
      </Heading>
      <Card variation="elevated" padding="2rem" maxWidth="600px" margin="0 auto">
        <Flex direction="column" gap="1rem" alignItems="center">
          <label className="file-input-label">
            Choose Image
            <input
              type="file"
              onChange={handleFileChange}
              ref={fileInputRef}
            />
          </label>
          {file && (
            <Button onClick={handleUpload} variation="primary">
              Upload Image
            </Button>
          )}
          {imageUrl && (
            <div className="image-container">
              <Image
                src={imageUrl}
                alt="Uploaded file"
                style={{ width: "100%", maxHeight: "400px", objectFit: "cover" }}
              />
            </div>
          )}
          {imageKey && (
            <Button onClick={handleRemove} variation="link" color="red">
              Remove Image
            </Button>
          )}
          {message && (
            <p className="message">{message}</p>
          )}
        </Flex>
      </Card>
      <Flex justifyContent="center" margin="2rem 0">
        <Button onClick={signOut} variation="primary">
          Sign Out
        </Button>
      </Flex>
    </View>
  );
};

export default withAuthenticator(App);