// TestFirestore.tsx
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { firestore } from '../firebaseConfig'; // Adjust the import path as necessary

export default function FirebaseService() {
  const [message, setMessage] = useState('No data');

  useEffect(() => {
    async function testFirestore() {
      try {
        // 1. Write a test document
        const testRef = doc(firestore, 'testCollection', 'testDoc');
        await setDoc(testRef, { hello: 'world' });

        // 2. Read the document back
        const snapshot = await getDoc(testRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          setMessage(`Document data: ${JSON.stringify(data)}`);
        } else {
          setMessage('No document found');
        }
      } catch (error) {
        let errorMessage = 'An unknown error occurred';
        if (error instanceof Error) {
          errorMessage = error.message;
        } else {
          errorMessage = String(error);
        }
        setMessage(`Error: ${errorMessage}`);
      }
    }

    testFirestore();
  }, []);

  return (
    <View style={{ padding: 20 }}>
      <Text>{message}</Text>
    </View>
  );
}
