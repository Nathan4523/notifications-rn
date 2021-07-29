import React, { useEffect, useState, useRef } from 'react';
import Constants from 'expo-constants';
import { Button, Platform, Text, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

//firebase
import firebase from 'firebase/app';
import "firebase/database";
import "firebase/auth";
import { useCallback } from 'react';

/**
 * Insert the secrets firebase
 * here
 */

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseSecrets);
}

//notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>('');
  const [notification, setNotification] = useState<any>(false);
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    firebase.auth().signInAnonymously().then(async () => {
      //do something
      console.log('||===FIREBASE LOGGED===||');
    }).catch((error) => {
      console.log(error.message);
    });

    registerForPushNotificationsAsync().then((token) => setExpoPushToken(token));

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log("estou no notificationListener.current");
      console.log(notification)
      console.log("acabou o notificationListener.current");
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log(response);
    });

    executeCustom();

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  const executeCustom = useCallback(() => {
    const notificationsFirebase = firebase.database().ref(`notifications`);
    const notificationsWithQuery = notificationsFirebase.orderByChild('filter_cduser_visualized').equalTo("649b0e84-3176-4454-9606-1f555e57f4c7|false").limitToLast(1);

    notificationsWithQuery.on('child_added', async (snapshot) => {
      const data = snapshot.val();
      const idNotification = await AsyncStorage.getItem('@appNoti:started');

      if (idNotification != null) {
        if (JSON.parse(idNotification) === snapshot.key) return false;

        let title = '';

        if (data.type == 'room') title = 'Você tem um novo atendimento!';

        if (data.type == 'message') title = 'Você tem um nova messange!';

        if (data.type == 'message' || data.type == 'room') {
          schedulePushNotification(title, data.message, { data: 'goes here' });
        }
      }

      await AsyncStorage.setItem("@appNoti:started", JSON.stringify(snapshot.key));
    });
  }, []);

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-around',
      }}>
      <Text>Your expo push token: {expoPushToken}</Text>
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Text>Title: {notification && notification.request.content.title} </Text>
        <Text>Body: {notification && notification.request.content.body}</Text>
        <Text>Data: {notification && JSON.stringify(notification.request.content.data)}</Text>
      </View>
      <Button
        title="Press to schedule a notification"
        onPress={async () => {
          await schedulePushNotification("Você tem uma mensagem", "Isso daqui é um teste ta ligado", { data: 'goes here' });
        }}
      />
      <Button
        title="Ver storage"
        onPress={async () => {
          const notificationsStarted = await AsyncStorage.getItem('@appNoti:started');
          console.log(notificationsStarted);
        }}
      />
      <Button
        title="Limpar storage"
        onPress={async () => {
          await AsyncStorage.removeItem('@appNoti:started');
        }}
      />
    </View>
  );
}

async function schedulePushNotification(title: string, message: string, data = { data: '' }) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: title,
      body: message,
      data: data,
    },
    trigger: { seconds: 2 },
  });
}

async function registerForPushNotificationsAsync() {
  let token;
  if (Constants.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log(token);
  } else {
    alert('Must use physical device for Push Notifications');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}
