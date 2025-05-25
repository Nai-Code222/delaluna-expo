// screens/SignUpChatScreen.tsx
import React, { useState } from 'react';
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
import { signUp } from '../service/Auth.service';
import { UserCredential } from 'firebase/auth';
import { UserRecord } from '@/model/UserRecord';
import { createUserDoc } from '@/service/userService';

// Import policy modals and static text if needed
// import PrivacyText from '../assets/privacy.txt';
// import TermsText from '../assets/terms.txt';

export default function SignUpChatScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);

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

  const setStepToKey = (key: keyof AnswerRecord) => {
    const index = steps.findIndex(s => s.key === key);
    if (index !== -1) {
      setStep(index);
    }
  };


  const handleComplete = async (answers: AnswerRecord) => {
    console.log('Signup answers:', answers);
    try {
      // 1) Create the Firebase Auth user
      let userCred: UserCredential = await signUp(answers.email!, answers.password!);
      const uid = userCred.user.uid;
      console.log('User created:', uid);

      const userRecord: UserRecord = {
        id: uid,
        firstName: answers.firstName!,
        lastName: answers.lastName,
        pronouns: answers.pronouns!,
        birthday: answers.birthday!.toISOString().slice(0, 10),
        birthtime: answers.birthtime instanceof Date
          ? new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          }).format(answers.birthtime)
          : typeof answers.birthtime === 'string'
            ? answers.birthtime
            : '',

        placeOfBirth: answers.placeOfBirth!,
        zodiacSign: null,
        risingSign: null,
        moonSign: null,
        email: answers.email,
        emailVerified: false,
        isPaidMember: false,
        signUpDate: new Date().toISOString(),
        lastLoginDate: new Date().toISOString(),
      };

      await new Promise(resolve => setTimeout(resolve, 1000));
      await createUserDoc(uid, userRecord);
      setTimeout(() => {
        router.replace('/');
      }, 500);
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') {
        Alert.alert('Email already in use', 'Please go back and use a different email.');
        setStepToKey('email');
        return;
      }
      else {
        Alert.alert('Signup Error', e.message);
      }
    }
  };
  return (
    <ImageBackground
      source={require('../assets/images/background.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <BlurView intensity={80} tint="dark" style={styles.overlay}>
        <View style={styles.header}>
          {step > 0 && (
            <TouchableOpacity onPress={() => setStep(step - 1)}>
              <Text style={styles.goBackText}>← Go Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => router.replace('/')} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
        <ChatFlow
          steps={steps}
          onComplete={handleComplete}
          step={step}
          setStep={setStep}
        />
      </BlurView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: { flex: 1, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    marginBottom: 8,
    position: 'relative',
    fontFamily: 'Futura-Generic',
  },
  cancelButton: {
    position: 'absolute',
    right: 16,
  },
  goBackText: { color: '#6FFFE9', fontSize: 18, fontWeight: '500' },
  cancelText: { color: '#6FFFE9', fontSize: 18, fontWeight: '500' },
});
