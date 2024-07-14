import React, { useState, useEffect } from "react";
import "./App.css";
import "@aws-amplify/ui-react/styles.css";
import {
  Button,
  Flex,
  Heading,
  Text,
  TextField,
  Image,
  View,
  Card,
  Divider,
  withAuthenticator,
} from "@aws-amplify/ui-react";
import { listNotes } from "./graphql/queries";
import {
  createNote as createNoteMutation,
  deleteNote as deleteNoteMutation,
} from "./graphql/mutations";
import { generateClient } from 'aws-amplify/api';
import { uploadData, getUrl, remove } from 'aws-amplify/storage';

const client = generateClient();

const App = ({ signOut }) => {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    const apiData = await client.graphql({ query: listNotes });
    const notesFromAPI = apiData.data.listNotes.items;
    await Promise.all(
      notesFromAPI.map(async (note) => {
        if (note.image) {
          const url = await getUrl({ key: note.name });
          note.image = url.url;  
        }
        return note;
      })
    );
    setNotes(notesFromAPI);
  }

  async function createNote(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    const image = form.get("image");
    const data = {
      name: form.get("name"),
      description: form.get("description"),
      image: image.name,
    };
    if (!!data.image) await uploadData({
      key: data.name,
      data: image
    });
    await client.graphql({
      query: createNoteMutation,
      variables: { input: data },
    });
    fetchNotes();
    event.target.reset();
  }

  async function deleteNote({ id, name }) {
    const newNotes = notes.filter((note) => note.id !== id);
    setNotes(newNotes);
    await remove({ key: name });
    await client.graphql({
      query: deleteNoteMutation,
      variables: { input: { id } },
    });
  }

  return (
    <View className="App">
      <Heading level={1} textAlign="center" margin="2rem">
        My Notes App
      </Heading>
      <Card variation="elevated" padding="2rem" maxWidth="800px" margin="0 auto">
        <Heading level={3} margin="1rem 0">Create a New Note</Heading>
        <View as="form" margin="3rem 0" onSubmit={createNote}>
          <Flex direction="column" gap="1rem">
            <TextField
              name="name"
              placeholder="Note Name"
              label="Note Name"
              labelHidden
              variation="quiet"
              required
            />
            <TextField
              name="description"
              placeholder="Note Description"
              label="Note Description"
              labelHidden
              variation="quiet"
              required
            />
            <View
              name="image"
              as="input"
              type="file"
              style={{ alignSelf: "start" }}
            />
            <Button type="submit" variation="primary">
              Create Note
            </Button>
          </Flex>
        </View>
      </Card>
      <Heading level={2} textAlign="center" margin="2rem">
        Current Notes
      </Heading>
      <View margin="3rem 0" maxWidth="800px" margin="0 auto">
        {notes.map((note) => (
          <Card key={note.id || note.name} variation="outlined" margin="1rem 0">
            <Flex direction="column" padding="1rem" gap="1rem">
              <Text as="strong" fontWeight={700} fontSize="1.5rem">
                {note.name}
              </Text>
              <Text as="span">{note.description}</Text>
              {note.image && (
                <Image
                  src={note.image}
                  alt={`visual aid for ${note.name}`}
                  style={{ width: "100%", maxHeight: "400px", objectFit: "cover" }}
                />
              )}
              <Divider />
              <Flex justifyContent="space-between">
                <Button variation="link" onClick={() => deleteNote(note)}>
                  Delete note
                </Button>
              </Flex>
            </Flex>
          </Card>
        ))}
      </View>
      <Flex justifyContent="center" margin="2rem 0">
        <Button onClick={signOut} variation="primary">
          Sign Out
        </Button>
      </Flex>
    </View>
  );
};

export default withAuthenticator(App);