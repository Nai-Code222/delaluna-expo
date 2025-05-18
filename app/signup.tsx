// screens/SignUpChatScreen.tsx
import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ImageBackground,
  Platform,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { ChatFlow, StepConfig, AnswerRecord } from '@/components/sign up/ChatFlow';
//import { signUp } from '@/backend/Auth-service';
import { registerNewUser } from '@/service/userService';

// Import policy modals and static text if needed
// import PrivacyText from '../assets/privacy.txt';
// import TermsText from '../assets/terms.txt';

export default function SignUpChatScreen() {
  const router = useRouter();

  const steps: StepConfig[] = [
    {
      key: 'firstName',
      renderQuestion: () =>
        `Hey, I’m glad you’re here! I have to ask a few quick questions for astrological reasons. Let’s start with some basic info to get you set up. 
      \n\ What’s your name?`,
      inputType: 'text',
      placeholder: 'First name…',
    },
    {
      key: 'lastName',
      renderQuestion: (answers) =>
        `Alright, ${answers.firstName || '[First Name]'}! And, what is your last name?`,
      inputType: 'text',
      placeholder: 'Last name…',
    },
    {
      key: 'pronouns',
      renderQuestion: (answers) =>
        `What are your pronouns, ${answers.firstName || '[First Name]'}?`,
      inputType: 'choices',
      choices: ['She/Her', 'He/Him', 'They/Them', 'Other'],
      placeholder: 'Pronouns…',
    },
    {
      key: 'birthday',
      renderQuestion: () =>
        `I need to calculate your birth chart. It’s basically a map of the planets and their coordinates at the time you were born. What is your birthdate?`,
      inputType: 'date',
      placeholder: 'Birth date…',
    },
    {
      key: 'birthtime',
      renderQuestion: () =>
        `Would you happen to know what time you were born?`,
      inputType: 'time',
      placeholder: 'Birth time…',
    },
    {
      key: 'placeOfBirth',
      renderQuestion: () =>
        `…and do you know where you were born?`,
      inputType: 'location',
      placeholder: 'Birth place…',
    },
    {
      key: 'email',
      renderQuestion: () =>
        `What’s your email?`,
      inputType: 'email',
      placeholder: 'Email…',
    },
    {
      key: 'password',
      renderQuestion: () =>
        `Alright, that’s it! The last thing I need you to do is create a password.`,
      inputType: 'secure',
      placeholder: 'Password…',
    },
    {
      key: 'final',
      renderQuestion: () =>
        `Your secrets are safe with us 🔒`,
      inputType: 'final',
    },
  ];

  const handleComplete = async (answers: AnswerRecord) => {
  console.log('Signup answers:', answers);
  try {
    // 1) Create the Firebase Auth user
    //await signUp(answers.email!, answers.password!);

    // 2) Write the user doc to Firestore
    await registerNewUser(answers);

    // 3) Navigate into your authenticated app
    router.replace('/');
  } catch (e: any) {
    console.error('Signup failed', e);
    Alert.alert('Signup Error', e.message);
  }
};

  return (
    <ImageBackground
      source={require('../assets/images/background.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <BlurView intensity={80} tint="dark" style={styles.overlay}>
        {/* Header with Cancel button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/')}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* ChatFlow component handles the conversation UI */}
        <ChatFlow steps={steps} onComplete={handleComplete} />
      </BlurView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: { flex: 1, paddingTop: Platform.OS === 'ios' ? 60 : 40, },
  header: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 },
  cancelText: { color: '#6FFFE9', fontSize: 16, fontWeight: '500', marginRight: 16 },  
});


