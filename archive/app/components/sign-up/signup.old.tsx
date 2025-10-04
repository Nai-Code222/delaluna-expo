import 'intl';
import 'intl/locale-data/jsonp/en';

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
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import ChatFlow, { StepConfig, FinalSignupPayload } from './components/signup/chat-flow';
import signUp from './service/auth.service';
import { UserCredential, sendEmailVerification } from 'firebase/auth';
import type { UserRecord } from './model/user-record';
import { createUserDoc } from './service/user.service';
import LoadingScreen from './components/utils/loading-screen';
import { useAuth } from './backend/auth-context';
import { StatusBar } from 'expo-status-bar';
import { scale, verticalScale, moderateScale } from '../src/utils/responsive';
import { DateTime } from 'luxon';
import { fetchSignsFromAPI } from './service/astrology.service';
import { parseBirthtime12h } from './components/signup/time.utils';


// ----- Defaults for "I don't know" -----
const FALLBACK_PLACE_LABEL = 'Greenwich, London, United Kingdom';
const FALLBACK_LAT = 51.4779;
const FALLBACK_LON = 0.0015;

export default function SignUpChatScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { user, initializing } = useAuth();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const { width } = useWindowDimensions();
  const modalCardWidth = width > 640 ? '55%' : width > 480 ? '70%' : '86%';
  const [headerHeight, setHeaderHeight] = useState(0);

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

  const setStepToKey = (key: StepConfig['key']) => {
    const index = steps.findIndex((s) => s.key === key);
    if (index !== -1) setStep(index);
  };

  const handleComplete = async (answers: FinalSignupPayload) => {
    try {
      const {
        firstName,
        lastName,
        pronouns,
        email: rawEmail,
        password,
        themeKey,
        birthday,               // "MM/DD/YYYY"
        birthtime,              // "hh:mm AM/PM"
        birthTimezone,          // IANA
        birthLat = FALLBACK_LAT,
        birthLon = FALLBACK_LON,
        placeOfBirth = FALLBACK_PLACE_LABEL,
        isBirthTimeUnknown,
        isPlaceOfBirthUnknown,
        birthDateTimeUTC,
        lastLoginDate,
        signUpDate,
      } = answers;

      const email = String(rawEmail ?? "").trim();

      // Auth
      const userCred: UserCredential = await signUp(email, password);
      const uid = userCred.user.uid;

      // Parse birthday
      const [month, day, year] = birthday.split("/").map(Number);
      const { hour, minute } = parseBirthtime12h(birthtime);

      // compute numeric offset (hours)
      let tZoneOffset = -5; // fallback
      if (birthTimezone) {
        const dt = DateTime.fromObject(
          { year, month, day, hour, minute },
          { zone: birthTimezone }
        );
        tZoneOffset = dt.offset / 60; // minutes -> hours
      }

      // fetch signs (now returns { sunSign, moonSign, risingSign })
      const { sunSign, moonSign, risingSign } = await fetchSignsFromAPI(
        day,
        month,
        year,
        hour,
        minute,
        birthLat,
        birthLon,
        tZoneOffset
      );

      // Build Firestore user record (store birthtime exactly as entered)
      const userRecord: UserRecord = {
        id: uid,
        firstName,
        lastName,
        pronouns,
        birthday,
        birthtime,
        placeOfBirth,
        email,
        isPaidMember: false,
        signUpDate,
        lastLoginDate,
        isBirthTimeUnknown,
        isPlaceOfBirthUnknown,
        themeKey: themeKey || "default",
        birthLat,
        birthLon,
        birthTimezone,
        birthDateTimeUTC,
        tZoneOffset,       // numeric offset in hours
        sunSign,
        moonSign,
        risingSign,
      };

      if (userCred.user) {
        await createUserDoc(uid, userRecord);

        // Progress animation
        setIsLoading(true);
        let currentProgress = 0;
        const interval = setInterval(() => {
          currentProgress += 0.2;
          setProgress(currentProgress);
          if (currentProgress >= 1) {
            clearInterval(interval);
            sendEmailVerification(userCred.user);
            router.replace("/home");
          }
        }, 200);
      }
    } catch (e: any) {
      if (e?.code === "auth/email-already-in-use") {
        setStepToKey("email");
        return;
      } else {
        console.warn("Signup error:", e?.message ?? e);
      }
    }
  };

  // Cancel flow
  const onCancelPress = () => {
    if (step !== 0) {
      setConfirmVisible(true);
    } else {
      setConfirmVisible(false);
      setTimeout(() => router.replace('/welcome'), 0);
    }
  };
  const confirmCancel = () => {
    setConfirmVisible(false);
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
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()} accessible={false}>
        <View style={{ flex: 1 }}>
          <StatusBar style="light" translucent backgroundColor="transparent" />
          <BlurView intensity={10} tint="dark" style={styles.overlay}>
            <View
              style={styles.header}
              onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
            >
              {step > 0 ? (
                <TouchableOpacity onPress={() => { Keyboard.dismiss(); setStep(step - 1); }}>
                  <Text style={styles.goBackText}>← Go Back</Text>
                </TouchableOpacity>
              ) : (
                <View />
              )}
              <TouchableOpacity onPress={onCancelPress}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.chatFlowWrapper}>
              <ChatFlow
                steps={steps}
                onComplete={handleComplete}
                step={step}
                setStep={setStep}
                keyboardOffset={headerHeight}
              />
            </View>
          </BlurView>
        </View>
      </TouchableWithoutFeedback>

      <Modal visible={confirmVisible} transparent animationType="fade" onRequestClose={dismissCancel}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { width: modalCardWidth }]}>
            <Text style={styles.modalTitle}>Discard signup?</Text>
            <Text style={styles.modalBody}>Your answers will be lost. You can start again anytime.</Text>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    marginBottom: verticalScale(8),
    position: 'relative',
  },
  goBackText: { color: '#6FFFE9', fontSize: moderateScale(18), fontWeight: '500' },
  cancelText: { color: '#6FFFE9', fontSize: moderateScale(18), fontWeight: '500' },

  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(12),
  },
  modalCard: {
    borderRadius: scale(14),
    paddingVertical: verticalScale(16),
    paddingHorizontal: scale(16),
    backgroundColor: 'rgba(20,20,24,0.92)',
    maxWidth: scale(500),
  },
  modalTitle: {
    color: '#fff',
    fontSize: moderateScale(18),
    fontWeight: '700',
    marginBottom: verticalScale(6),
    textAlign: 'center',
  },
  modalBody: { color: '#cfd3dc', fontSize: moderateScale(14), textAlign: 'center', marginBottom: verticalScale(16) },
  modalActions: { flexDirection: 'row', gap: scale(12), justifyContent: 'center' },
  modalBtn: {
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(14),
    borderRadius: scale(10),
    minWidth: scale(140),
    alignItems: 'center',
  },
  btnGhost: { backgroundColor: 'rgba(255,255,255,0.08)' },
  btnGhostText: { color: '#e6e9f0', fontWeight: '600' },
  btnDanger: { backgroundColor: '#ff4d4f' },
  btnDangerText: { color: '#fff', fontWeight: '700' },
  chatFlowWrapper: { flex: 1, width: '100%', alignSelf: 'stretch' },
});