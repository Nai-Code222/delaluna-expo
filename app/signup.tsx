// screens/SignUpChatScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ImageBackground,
  Platform,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import ChatFlow, { StepConfig, AnswerRecord } from '@/app/components/sign up/ChatFlow';
import signUp from '../app/service/Auth.service';
import { UserCredential, sendEmailVerification } from 'firebase/auth';
import type { UserRecord } from '@/app/model/UserRecord';
import { createUserDoc } from '@/app/service/userService';
import LoadingScreen from '@/app/components/utils/LoadingScreen';
import { useAuth } from '@/app/backend/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { scale, verticalScale, moderateScale } from '../src/utils/responsive';

function formatTime12Hour(date: Date | null | undefined): string {
  if (!(date instanceof Date)) return '';
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours === 0 ? 12 : hours;
  const minStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hours}:${minStr} ${ampm}`;
}

export default function SignUpChatScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { user, initializing } = useAuth();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const hasAnyAnswer = step > 0;
  const { width } = useWindowDimensions();
  const modalCardWidth = width > 640 ? '55%' : width > 480 ? '70%' : '86%';

  useEffect(() => {
    if (!initializing && user) {
      router.replace('/home');
    }
  }, [initializing, user]);

  const steps: StepConfig[] = [
    { key: 'firstName', renderQuestion: () => `Hey, I’m glad you’re here! I have to ask a few quick questions for astrological reasons. Let’s start with some basic info to get you set up. \n\n What’s your name?`, inputType: 'text', placeholder: 'First name…' },
    { key: 'lastName', renderQuestion: (answers) => `Alright, ${answers.firstName || '[First Name]'}! And, what is your last name?`, inputType: 'text', placeholder: 'Last name…' },
    { key: 'pronouns', renderQuestion: (answers) => `What are your pronouns, ${answers.firstName || '[First Name]'}?`, inputType: 'choices', choices: ['She/Her', 'He/Him', 'They/Them', 'Non Binary'], placeholder: 'Pronouns…' },
    { key: 'birthday', renderQuestion: () => `I need to calculate your birth chart. It’s basically a map of the planets and their coordinates at the time you were born. What is your birthdate?`, inputType: 'date', placeholder: 'Birth date…' },
    { key: 'birthtime', renderQuestion: () => `Would you happen to know what time you were born?`, inputType: 'time', placeholder: 'Birth time…' },
    { key: 'placeOfBirth', renderQuestion: () => `…and do you know where you were born?`, inputType: 'location', placeholder: 'Birth place…' },
    { key: 'email', renderQuestion: () => `What’s your email?`, inputType: 'email', placeholder: 'Email…' },
    { key: 'password', renderQuestion: () => `Alright, that’s it! The last thing I need you to do is create a password.`, inputType: 'secure', placeholder: 'Password…' },
    { key: 'final', renderQuestion: () => `Your secrets are safe with us 🔐`, inputType: 'final' },
  ];

  const setStepToKey = (key: keyof AnswerRecord) => {
    const index = steps.findIndex(s => s.key === key);
    if (index !== -1) setStep(index);
  };

  const handleComplete = async (answers: AnswerRecord) => {
    try {
      let userCred: UserCredential = await signUp(answers.email!.trim(), answers.password!);
      const uid = userCred.user.uid;

      const userRecord: UserRecord = {
        id: uid,
        firstName: answers.firstName!,
        lastName: answers.lastName,
        pronouns: answers.pronouns!,
        birthday: answers.birthday!.toISOString().slice(0, 10),
        birthtime:
          answers.birthtime instanceof Date
            ? formatTime12Hour(answers.birthtime)
            : typeof answers.birthtime === 'string'
              ? answers.birthtime
              : '',
        placeOfBirth: answers.placeOfBirth!,
        zodiacSign: null,
        risingSign: null,
        moonSign: null,
        email: answers.email,
        isPaidMember: false,
        signUpDate: new Date().toISOString(),
        lastLoginDate: new Date().toISOString(),
        isBirthTimeUnknown: answers.birthtimeUnknown,
        isPlaceOfBirthUnknown: answers.placeOfBirthUnknown,
        themeKey: answers.themeKey || 'default',
      };

      if (userCred.user) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await createUserDoc(uid, userRecord);
        setIsLoading(true);
        let currentProgress = 0;

        const interval = setInterval(() => {
          currentProgress += 0.2;
          setProgress(currentProgress);
          if (currentProgress >= 1) {
            clearInterval(interval);
            sendEmailVerification(userCred.user);
            router.replace('/home');
          }
        }, 200);
      }
    } catch (e: any) {
      // keep your existing email-in-use handling, but avoid native Alert if you prefer
      if (e.code === 'auth/email-already-in-use') {
        // navigate back to email step
        setStepToKey('email');
        return;
      } else {
        // surface a generic error UI in ChatFlow if you have one
        console.warn('Signup error:', e?.message ?? e);
      }
    }
  };

  // Handle Cancel
  const onCancelPress = () => setConfirmVisible(true);
  const confirmCancel = () => {
    setConfirmVisible(false);
    // reset local progress/step so returning to signup is clean
    setStep(0);
    // navigate after modal closes to avoid UI tearing
    setTimeout(() => router.replace('/welcome'), 0);
  };
  const dismissCancel = () => setConfirmVisible(false);

  if (isLoading || initializing) {
    return <LoadingScreen progress={progress} message="Reading your stars..." />;
  }

  return (
    <ImageBackground
      source={require('../app/assets/images/mainBackground.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <BlurView intensity={10} tint="dark" style={styles.overlay}>
        {/* New cancel bar stacked above */}
        <View style={styles.cancelBar}>
          <TouchableOpacity onPress={onCancelPress}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* Keep Go Back on its own row below the cancel bar */}
        <View style={styles.header}>
          {step > 0 && (
            <TouchableOpacity onPress={() => setStep(step - 1)}>
              <Text style={styles.goBackText}>← Go Back</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.chatFlowWrapper}>
          <ChatFlow steps={steps} onComplete={handleComplete} step={step} setStep={setStep} />
        </View>
      </BlurView>
      <Modal
        visible={confirmVisible}
        transparent
        animationType="fade"
        onRequestClose={dismissCancel} // Android back button
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { width: modalCardWidth }]}>
            <Text style={styles.modalTitle}>Discard signup?</Text>
            <Text style={styles.modalBody}>
              Your answers will be lost. You can start again anytime.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={dismissCancel} style={[styles.modalBtn, styles.btnGhost]}>
                <Text style={styles.btnGhostText}>Keep editing</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmCancel} style={[styles.modalBtn, styles.btnDanger]}>
                <Text style={styles.btnDangerText}>Discard & Exit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: { 
    flex: 1, 
    paddingTop: verticalScale(Platform.OS === 'ios' ? 60 : 40),
    paddingHorizontal: scale(0),
    width: '100%',
  },
  // New: full-width bar for Cancel button
  cancelBar: {
    width: '100%',
    paddingHorizontal: scale(15),
    marginTop: verticalScale(10),
    marginBottom: verticalScale(15), // small gap above chat/header
    alignItems: 'flex-end',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: scale(16),
    marginBottom: verticalScale(8),
    position: 'relative',
  },
  goBackText: { color: '#6FFFE9', fontSize: moderateScale(18), fontWeight: '500' },
  cancelText: { color: '#6FFFE9', fontSize: moderateScale(18), fontWeight: '500' },

  // modal
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(12),
  },
  modalCard: {
    // width overridden dynamically
    borderRadius: scale(14),
    paddingVertical: verticalScale(16),
    paddingHorizontal: scale(16),
    backgroundColor: 'rgba(20,20,24,0.92)',
    maxWidth: scale(500),
  },
  modalTitle: { color: '#fff', fontSize: moderateScale(18), fontWeight: '700', marginBottom: verticalScale(6), textAlign: 'center' },
  modalBody: { color: '#cfd3dc', fontSize: moderateScale(14), textAlign: 'center', marginBottom: verticalScale(16) },
  modalActions: { flexDirection: 'row', gap: scale(12), justifyContent: 'center' },
  modalBtn: { paddingVertical: verticalScale(10), paddingHorizontal: scale(14), borderRadius: scale(10), minWidth: scale(140), alignItems: 'center' },
  btnGhost: { backgroundColor: 'rgba(255,255,255,0.08)' },
  btnGhostText: { color: '#e6e9f0', fontWeight: '600' },
  btnDanger: { backgroundColor: '#ff4d4f' },
  btnDangerText: { color: '#fff', fontWeight: '700' },
  chatFlowWrapper: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
    // Optionally add a tiny top/left inset if needed:
    // paddingTop: verticalScale(5),
    // paddingLeft: scale(5),
  },
});
