import React, { useState, useEffect } from "react";
import "./App.css";
import "@aws-amplify/ui-react/styles.css";
//import { API } from "aws-amplify";
// import { Amplify } from 'aws-amplify';
// import Storage from '@aws-amplify/storage';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';
import {uploadData } from 'aws-amplify/storage';
import { getUrl } from 'aws-amplify/storage';
import { remove } from 'aws-amplify/storage';
import config from './amplifyconfiguration.json';
import { createNote, updateNote, deleteNote } from './graphql/mutations';
import { listNotes } from './graphql/queries';
import {
  Button,
  Flex,
  Heading,
  Image,
  Text,
  TextField,
  View,
  withAuthenticator,
} from "@aws-amplify/ui-react";
import {
  createNote as createNoteMutation,
  deleteNote as deleteNoteMutation,
} from "./graphql/mutations";


Amplify.configure(config);

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
          const url = await //getUrl(note.name);
          getUrl({
            key: note.name,
            options: {
              accessLevel: 'guest' , // can be 'private', 'protected', or 'guest' but defaults to `guest`
              targetIdentityId: 'XXXXXXX', // id of another user, if `accessLevel` is `guest`
              validateObjectExistence: false,  // defaults to false
              expiresIn: 20 // validity of the URL, in seconds. defaults to 900 (15 minutes) and maxes at 3600 (1 hour)
              //useAccelerateEndpoint: true; // Whether to use accelerate endpoint.
            },
          });
          note.image = url;
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
    if (!!data.image) await //uploadData(data.name, image);
    uploadData({
      key: data.name,
      data: image,
      options: {
        accessLevel: 'guest' // defaults to `guest` but can be 'private' | 'protected' | 'guest'
        
      }
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
    await //remove(name);
    remove({ key: name });
    await client.graphql({
      query: deleteNoteMutation,
      variables: { input: { id } },
    });
  }

  return (
    <View className="App">
      <Heading level={1}>My Notes App</Heading>
      <View as="form" margin="3rem 0" onSubmit={createNote}>
        <Flex direction="row" justifyContent="center">
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
            style={{ alignSelf: "end" }}
          />
          <Button type="submit" variation="primary">
            Create Note
          </Button>
        </Flex>
      </View>
      <Heading level={2}>Current Notes</Heading>
      <View margin="3rem 0">
      {notes.map((note) => (
  <Flex
    key={note.id || note.name}
    direction="row"
    justifyContent="center"
    alignItems="center"
  >
    <Text as="strong" fontWeight={700}>
      {note.name}
    </Text>
    <Text as="span">{note.description}</Text>
    {note.image && (
      <Image
        src={note.image}
        alt={`visual aid for ${notes.name}`}
        style={{ width: 400 }}
      />
    )}
    <Button variation="link" onClick={() => deleteNote(note)}>
      Delete note
    </Button>
  </Flex>
))}
      </View>
      <Button onClick={signOut}>Sign Out</Button>
    </View>
  );
};

export default withAuthenticator(App);