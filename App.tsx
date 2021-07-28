import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

//firebase
import firebase from 'firebase/app';
import "firebase/database";
import "firebase/auth";


if (!firebase.apps.length) {
  firebase.initializeApp(firebaseSecrets);
}

export default function App() {
  useEffect(() => {
    firebase.auth().signInAnonymously().then(async () => {
      //do something
      console.log('||===FIREBASE LOGGED===||');
    }).catch((error) => {
      console.log(error.message);
    });
  }, []);


  return (
    <View style={styles.container}>
      <Text>Open up App.tsx to start working on your app!</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
