// app/login.tsx
import { useRouter } from 'expo-router';
import { View, Text, Button } from 'react-native';

export default function Login() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Login Screen</Text>
      <Button title="Go Home" onPress={() => router.replace('/home')} />
    </View>
  );
}
