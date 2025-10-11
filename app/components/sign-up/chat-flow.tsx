// ChatFlow.tsx
import 'intl';
import 'intl/locale-data/jsonp/en';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Keyboard,
  StatusBar,
  KeyboardAvoidingView,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { fetchSignInMethodsForEmail } from 'firebase/auth';
import { format as formatDate } from 'date-fns';
import { scale, verticalScale, moderateScale } from '@/src/utils/responsive';
import { DateTime } from 'luxon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '@/firebaseConfig';
import PasswordInputField from '../component-utils/password-input-field';
import LocationAutocomplete from './location-autocomplete';
import PolicyModal from './policy-modals';
import { privacyPolicy, termsAndConditions } from '@/app/assets/legal/legal-texts';

const INPUT_H = verticalScale(50);
const FIELD_BORDER = 'rgba(142, 68, 173, 0.6)';
const LEADING_WS_RE = /^[\s\u00A0\u2007\u202F]+/u;

// canonical fallback place (Royal Observatory, Greenwich)
const DEFAULT_PLACE = {
  label: 'Greenwich, London, United Kingdom',
  lat: 51.4779,
  lon: 0.0015,
  timezone: 'Europe/London',
};

// canonical fallback time for unknown birth time (noon is common)
const DEFAULT_TIME_HOUR = 12;
const DEFAULT_TIME_MIN = 0;
const defaultNoon = new Date();
defaultNoon.setHours(DEFAULT_TIME_HOUR, DEFAULT_TIME_MIN, 0, 0);
const isIDK = (s?: string | null) => {
  const t = (s || '').trim().toLowerCase();
  return t === "i don't know" || t === 'i don’t know';
};

// -------------------- types --------------------
export interface AnswerRecord {
  firstName: string;
  lastName: string;
  pronouns: string;
  birthday: Date | null;         // internal for picker
  birthtime: Date | null;        // internal for picker
  birthtimeUnknown: boolean;
  placeOfBirth: string | null;
  placeOfBirthUnknown: boolean;
  birthLat?: number;
  birthLon?: number;
  birthTimezone?: string;        // IANA
  email: string;
  password: string;
  themeKey?: string;
}

export type FinalSignupPayload = {
  firstName: string;
  lastName: string;
  pronouns: string;
  email: string;
  password: string;
  themeKey?: string;

  // normalized/required fields:
  birthday: string;              // "MM/DD/YYYY"

  birthtime: string;             // "hh:mm  AM"
  birthTimezone: string;         // "Europe/Rome"
  birthLat: number;
  birthLon: number;
  placeOfBirth: string;
  isBirthTimeUnknown: boolean;
  isPlaceOfBirthUnknown: boolean;

  // derived
  birthDateTimeUTC: string;      // "MM/DD/YYYY - hh:mm:ss  AM UTC-6"
  lastLoginDate: string;         // "MM/DD/YYYY hh:mm:ss  AM UTC-5"
  signUpDate: string;            // same format as above

  // Add big three
  sunSign?: string;
  moonSign?: string;
  risingSign?: string;

  // raw values for convenience (not stored in DB)
  rawBirthdayDate: Date;
  rawBirthtimeDate: Date;
};

export type StepConfig = {
  key: keyof AnswerRecord | 'final';
  renderQuestion: (answers: AnswerRecord) => string;
  inputType: 'text' | 'location' | 'secure' | 'choices' | 'date' | 'time' | 'email' | 'final';
  placeholder?: string;
  choices?: string[];
  hasUnknownSwitch?: boolean;
};

type ChatFlowProps = {
  steps: StepConfig[];
  onComplete: (finalized: FinalSignupPayload) => void;
  step: number;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  keyboardOffset?: number;
};

type SelectedPlace = { label: string; lat: number; lon: number; timezone: string };

// -------------------- helpers --------------------
const NBSP_NARROW = '\u202F';
const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);

const fmtBirthday = (d: Date) => {
  const dt = DateTime.fromJSDate(d);
  return dt.toFormat('MM/dd/yyyy');
};

const fmtBirthtime = (d: Date) => {
  const dt = DateTime.fromJSDate(d);
  const twelve = dt.hour % 12 === 0 ? 12 : dt.hour % 12;
  const mm = pad2(dt.minute);
  const ampm = dt.hour >= 12 ? 'PM' : 'AM';
  return `${twelve}:${mm}${NBSP_NARROW}${ampm}`;
};

const utcOffsetToken = (dt: DateTime) => {
  const off = dt.offset; // minutes
  const sign = off >= 0 ? '+' : '-';
  const abs = Math.abs(off);
  const oh = Math.floor(abs / 60);
  const om = abs % 60;
  return om === 0 ? `UTC${sign}${oh}` : `UTC${sign}${oh}:${pad2(om)}`;
};

const fmtStampWithOffset = (dt: DateTime) => {
  const clock = dt.toFormat(`MM/dd/yyyy hh:mm:ss'${NBSP_NARROW}'a`);
  return `${clock} ${utcOffsetToken(dt)}`;
};

const buildFinalPayload = (a: AnswerRecord): FinalSignupPayload => {
  const tz = a.birthTimezone || DEFAULT_PLACE.timezone;
  const place = a.placeOfBirth || DEFAULT_PLACE.label;
  const lat = a.birthLat ?? DEFAULT_PLACE.lat;
  const lon = a.birthLon ?? DEFAULT_PLACE.lon;

  const birthdayDate = a.birthday ?? new Date();
  const birthtimeDate = a.birthtime ?? defaultNoon;

  const birthdayStr = fmtBirthday(birthdayDate);
  const birthtimeStr = fmtBirthtime(birthtimeDate);

  const now = DateTime.now();
  const lastLoginDate = fmtStampWithOffset(now);
  const signUpDate = fmtStampWithOffset(now);

  return {
    firstName: a.firstName,
    lastName: a.lastName,
    pronouns: a.pronouns,
    email: a.email,
    password: a.password,
    themeKey: a.themeKey,
    birthday: birthdayStr,
    birthtime: birthtimeStr,
    birthTimezone: tz,
    birthLat: lat,
    birthLon: lon,
    placeOfBirth: place,
    isBirthTimeUnknown: !!a.birthtimeUnknown,
    isPlaceOfBirthUnknown: !!a.placeOfBirthUnknown,
    birthDateTimeUTC: "",
    lastLoginDate,
    signUpDate,
    rawBirthdayDate: birthdayDate,
    rawBirthtimeDate: birthtimeDate,
  };
};

const submitProps = (enabled: boolean, onSubmit: () => void, returnKey: 'next' | 'done') => ({
  onSubmitEditing: () => { if (enabled) onSubmit(); },
  returnKeyType: Platform.select({ ios: returnKey, android: returnKey }) as any,
  blurOnSubmit: true,
  enablesReturnKeyAutomatically: true,
});

// -------------------- component --------------------
export default function ChatFlow({
  steps,
  onComplete,
  step,
  setStep,
  keyboardOffset = 0,
}: ChatFlowProps) {
  const insets = useSafeAreaInsets();

  const [answers, setAnswers] = useState<AnswerRecord>({
    firstName: '',
    lastName: '',
    pronouns: '',
    birthday: null,
    birthtime: null,
    birthtimeUnknown: false,
    placeOfBirth: '',
    placeOfBirthUnknown: false,
    birthLat: undefined,
    birthLon: undefined,
    birthTimezone: undefined,
    email: '',
    password: '',
  });

  // refs for auto-focus
  const textRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);

  const [textInput, setTextInput] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [checkedPolicy, setCheckedPolicy] = useState(false);
  const [checkedTerms, setCheckedTerms] = useState(false);
  const [showSendButton, setShowSendButton] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPolicyModalVisible, setIsPolicyModalVisible] = useState(false);
  const [policyModalContent, setPolicyModalContent] =
    useState<'Privacy Policy' | 'Terms & Conditions'>('Privacy Policy');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(null);
  const [loadingBigThree, setLoadingBigThree] = useState(false);
  const [bigThreeError, setBigThreeError] = useState<string | null>(null);

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const current = steps[step];

  // where email/final/last-input sit
  const emailStepIndex = useMemo(() => steps.findIndex(s => s.inputType === 'email'), [steps]);
  const finalStepIndex = useMemo(() => steps.findIndex(s => s.inputType === 'final'), [steps]);
  const lastInputIndex = useMemo(
    () => (finalStepIndex > -1 ? finalStepIndex - 1 : steps.length - 1),
    [finalStepIndex, steps.length]
  );
  const isCurrentLastInput = step === lastInputIndex;

  const nextButtonLabel = current.inputType === 'final' ? 'Continue' : 'Next';
  const nextReturnKey: 'next' | 'done' = isCurrentLastInput ? 'done' : 'next';

  // Generic, type-safe answer updater
  const updateAnswer = <K extends keyof AnswerRecord>(key: K, value: AnswerRecord[K]) => {
    setAnswers(a => ({ ...a, [key]: value }));
  };

  // step changes: reset errors, hydrate value, focus inputs
  useEffect(() => {
    setError(null);
    if (current.inputType === 'text' && isAnswerKey(current.key)) {
      const saved = (answers as any)[current.key];
      setTextInput(typeof saved === 'string' ? saved : '');
      setSelectedPlace(null);
    } else if (current.inputType === 'email') {
      setTextInput(answers.email || '');
      setSelectedPlace(null);
    } else if (current.inputType === 'location') {
      if (answers.placeOfBirthUnknown) {
        setTextInput("I don't know");
        setSelectedPlace(null);
      } else {
        setTextInput(answers.placeOfBirth || '');
        if (answers.placeOfBirth) {
          setSelectedPlace({
            label: answers.placeOfBirth,
            lat: answers.birthLat ?? DEFAULT_PLACE.lat,
            lon: answers.birthLon ?? DEFAULT_PLACE.lon,
            timezone: answers.birthTimezone ?? DEFAULT_PLACE.timezone,
          });
        } else {
          setSelectedPlace(null);
        }
      }
    } else {
      setTextInput('');
      setSelectedPlace(null);
    }

    // defer focus slightly so layout settles
    const needsKeyboard =
      current.inputType === 'text' ||
      current.inputType === 'email' ||
      current.inputType === 'secure';
    const t = setTimeout(() => {
      if (current.inputType === 'email') emailRef.current?.focus();
      else if (current.inputType === 'text') textRef.current?.focus();
      else if (current.inputType === 'secure') passwordRef.current?.focus();
    }, 100);
    return () => clearTimeout(t);
  }, [
    step,
    current.key,
    current.inputType,
    answers.firstName,
    answers.lastName,
    answers.pronouns,
    answers.email,
    answers.placeOfBirth,
    answers.placeOfBirthUnknown,
    answers.birthLat,
    answers.birthLon,
    answers.birthTimezone,
  ]);

  const openPolicyModal = (content: 'Privacy Policy' | 'Terms & Conditions') => {
    setPolicyModalContent(content);
    setIsPolicyModalVisible(true);
  };
  const closePolicyModal = () => setIsPolicyModalVisible(false);

  const handleContentSizeChange = () => {
    scrollRef.current?.scrollToEnd({ animated: true });
  };

  const formatTime12Hour = (date: Date | string | null | undefined) => {
    if (!date) return 'Select birth time';
    const d = typeof date === 'string' ? new Date(date) : date;
    const twelve = d.getHours() % 12 === 0 ? 12 : d.getHours() % 12;
    const mm = pad2(d.getMinutes());
    const ampm = d.getHours() >= 12 ? 'PM' : 'AM';
    return `${twelve}:${mm}${NBSP_NARROW}${ampm}`;
  };

  const capitalizeName = (name: string) =>
    name.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
  const advanceStep = () => setStep(s => s + 1);

  const saveAndNext = (value?: any) => {
    switch (current.inputType) {
      case 'text': {
        if (isAnswerKey(current.key)) {
          const trimmed = (textInput || '').trim();
          if (!trimmed) { setError((current.placeholder || 'This field') + ' is required'); return; }
          const val =
            current.key === 'firstName' || current.key === 'lastName'
              ? (capitalizeName(trimmed) as AnswerRecord[typeof current.key])
              : (trimmed as AnswerRecord[typeof current.key]);
          updateAnswer(current.key, val);
        }
        setTextInput('');
        break;
      }
      case 'secure': {
        const pwd = (textInput || '').trim();
        if (!pwd) { setError('Please enter a password.'); return; }
        if (pwd.length < 8) { setError('Password must be at least 8 characters.'); return; }
        if (!/[A-Z]/.test(pwd)) { setError('Password must contain at least one uppercase letter.'); return; }

        if (isAnswerKey(current.key)) {
          updateAnswer(current.key, pwd as AnswerRecord[typeof current.key]);
        }
        setError(null);
        setTextInput('');
        break;
      }
      case 'choices': {
        if (isAnswerKey(current.key)) updateAnswer(current.key, value as AnswerRecord[typeof current.key]);
        break;
      }
      case 'date': {
        updateAnswer('birthday', value as Date);
        setShowDatePicker(false);
        break;
      }
      case 'time': {
        const unknown = typeof value === 'string' && isIDK(value);
        updateAnswer('birthtime', unknown ? defaultNoon : (value as Date));
        updateAnswer('birthtimeUnknown', unknown);
        setShowTimePicker(false);
        break;
      }
      case 'location': {
        const unknown = typeof value === 'string' && isIDK(value);
        if (unknown) {
          updateAnswer('placeOfBirth', DEFAULT_PLACE.label);
          updateAnswer('placeOfBirthUnknown', true);
          updateAnswer('birthLat', DEFAULT_PLACE.lat);
          updateAnswer('birthLon', DEFAULT_PLACE.lon);
          updateAnswer('birthTimezone', DEFAULT_PLACE.timezone);
          setTextInput("I don't know");
        } else {
          updateAnswer('placeOfBirth', value as string);
          updateAnswer('placeOfBirthUnknown', false);
        }
        break;
      }
      case 'email': {
        const e = (textInput || '').trim();
        if (!isValidEmail(e)) { setError('Please enter a valid email address.'); return; }
        updateAnswer('email', e);
        break;
      }
    }

    if (step === steps.length - 1) {
      setAnswers(a => {
        const finalized = buildFinalPayload({ ...a, themeKey: 'default' });
        onComplete(finalized);
        return a;
      });
    } else {
      setError(null);
      Keyboard.dismiss();
      advanceStep();
    }
  };

  const isAnswerKey = (k: StepConfig['key']): k is keyof AnswerRecord => k !== 'final';

  const renderAnswerBubble = (s: StepConfig, idx: number) => {
    if (idx >= step || s.inputType === 'final') return null;
    const raw = (answers as any)[s.key];
    let display = raw;
    if (s.key === 'placeOfBirth' && answers.placeOfBirthUnknown) display = "I don't know";
    if (s.inputType === 'date' && raw instanceof Date) display = formatDate(raw, 'MM/dd/yyyy');
    if (s.inputType === 'time') display = answers.birthtimeUnknown ? "I don't know" : formatTime12Hour(raw);
    if (s.inputType === 'secure') display = raw ? '******' : '';
    if (!display) display = "I don't know";

    return (
      <View style={styles.answerBubble}>
        <Text style={styles.answerText}>{display}</Text>
      </View>
    );
  };

  const emailKeyboardProps = {
    keyboardType: 'email-address' as const,
    textContentType: 'emailAddress' as const,
    autoCapitalize: 'none' as const,
    autoCorrect: false,
  };

  const renderInputArea = () => (
    <View>
      {(() => {
        switch (current.inputType) {
          case 'text': {
            const isBlank = !textInput.trim();
            const handleSend = () => saveAndNext();
            return (
              <View style={styles.inputContainer}>
                <View style={styles.inputRow}>
                  <TextInput
                    ref={textRef}
                    style={styles.textInput}
                    placeholder={current.placeholder}
                    placeholderTextColor="#fff"
                    value={textInput}
                    onChangeText={(val) => {
                      if (LEADING_WS_RE.test(val)) {
                        setTextInput(val.replace(LEADING_WS_RE, ''));
                        return;
                      }
                      setTextInput(val);
                    }}
                    onBlur={() => {
                      const trimmed = (textInput || '').trim();
                      if (!trimmed) setError((current.placeholder || 'This field') + ' is required');
                    }}
                    keyboardType={Platform.OS === 'ios' ? 'ascii-capable' : 'default'}
                    autoCapitalize="sentences"
                    autoCorrect
                    {...submitProps(!isBlank, handleSend, nextReturnKey)}
                  />
                  <TouchableOpacity
                    style={[styles.sendButton, { opacity: isBlank ? 0.5 : 1 }]}
                    disabled={isBlank}
                    onPress={handleSend}
                  >
                    <Text style={styles.sendText}>{nextButtonLabel}</Text>
                  </TouchableOpacity>
                </View>
                {!!error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}
              </View>
            );
          }

          case 'secure': {
            const handleSend = () => saveAndNext(textInput);
            return (
              <View style={[styles.inputContainer]}>
                <View style={[styles.inputRow, { width: '90%', justifyContent: 'space-between' }]}>
                  <PasswordInputField
                    ref={passwordRef}
                    style={[styles.textInput, styles.passwordStyle, { height: 90, marginRight: 10,  }]}
                    inputStyle={{}}
                    value={textInput}
                    onChangeText={setTextInput}
                    placeholder="Password..."
                    placeholderTextColor="#fff"
                    textContentType="newPassword"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onSubmitEditing={handleSend}
                    returnKeyType={nextReturnKey}
                    blurOnSubmit
                  />

                  <TouchableOpacity
                    style={[
                      styles.sendButton,
                      {
                        opacity: 1,
                        height: INPUT_H,            // aligns with field height
                        marginLeft: scale(-12),
                        paddingVertical: 0,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: scale(5),
                      },
                    ]}
                    onPress={handleSend}
                  >
                    <Text style={styles.sendText}>{nextButtonLabel}</Text>
                  </TouchableOpacity>
                </View>

                {!!error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}
              </View>
            );
          }

          case 'choices':
            return (
              <View style={styles.choiceRow}>
                {current.choices!.map(opt => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.choiceButton, (answers as any)[current.key] === opt && styles.choiceSelected]}
                    onPress={() => { Keyboard.dismiss(); saveAndNext(opt); }}
                  >
                    <Text style={[styles.choiceText, (answers as any)[current.key] === opt && { color: '#fff' }]}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            );

          case 'date': {
            const today = new Date();
            const selected: Date | null = answers.birthday;
            const isFuture = selected ? selected > today : false;
            const isUnder18 = selected
              ? today.getFullYear() - selected.getFullYear() < 18 ||
              (today.getFullYear() - selected.getFullYear() === 18 &&
                (today.getMonth() < selected.getMonth() ||
                  (today.getMonth() === selected.getMonth() && today.getDate() < selected.getDate())))
              : false;

            return (
              <View style={styles.inputContainer}>
                <View style={styles.inputRow}>
                  <TouchableOpacity
                    style={[styles.datePickerButton, styles.textInput]}
                    onPress={() => { Keyboard.dismiss(); setShowDatePicker(true); }}
                  >
                    <Text style={styles.datePickerText}>
                      {answers.birthday ? formatDate(answers.birthday, 'MM/dd/yyyy') : 'Select your birthdate'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.sendButton, { opacity: selected && !isFuture && !isUnder18 ? 1 : 0.5 }]}
                    disabled={!selected || isFuture || isUnder18}
                    onPress={() => { Keyboard.dismiss(); saveAndNext(selected!); }}
                  >
                    <Text style={styles.sendText}>{nextButtonLabel}</Text>
                  </TouchableOpacity>
                </View>

                <DateTimePickerModal
                  isVisible={showDatePicker}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  date={answers.birthday || today}
                  onConfirm={date => { updateAnswer('birthday', date); setShowDatePicker(false); }}
                  onCancel={() => setShowDatePicker(false)}
                />

                {isFuture && (
                  <View style={styles.errorContainer}><Text style={styles.errorText}>Please select a valid date not in the future.</Text></View>
                )}
                {isUnder18 && !isFuture && (
                  <View style={styles.errorContainer}><Text style={styles.errorText}>You must be at least 18 years old to register.</Text></View>
                )}
              </View>
            );
          }

          case 'location': {
            const isUnknownLoc = answers.placeOfBirthUnknown;
            const canProceedLocation = isUnknownLoc || !!selectedPlace;

            const handleSend = () => {
              if (isUnknownLoc) {
                Keyboard.dismiss();
                saveAndNext("I don't know");
                return;
              }
              if (!selectedPlace) {
                setLocationError('Please pick a location from suggestions or tap “I don’t know.”');
                return;
              }
              Keyboard.dismiss();
              setLocationError(null);

              updateAnswer('placeOfBirth', selectedPlace.label);
              updateAnswer('placeOfBirthUnknown', false);
              updateAnswer('birthLat', selectedPlace.lat);
              updateAnswer('birthLon', selectedPlace.lon);
              updateAnswer('birthTimezone', selectedPlace.timezone);

              saveAndNext(selectedPlace.label);
            };

            const handleUnknown = () => {
              Keyboard.dismiss();
              setSelectedPlace(null);
              setTextInput("I don't know");
              setLocationError(null);

              updateAnswer('placeOfBirth', DEFAULT_PLACE.label);
              updateAnswer('placeOfBirthUnknown', true);
              updateAnswer('birthLat', DEFAULT_PLACE.lat);
              updateAnswer('birthLon', DEFAULT_PLACE.lon);
              updateAnswer('birthTimezone', DEFAULT_PLACE.timezone);

              saveAndNext("I don't know");
            };

            return (
              <View style={styles.inputContainer}>
                <View style={styles.inputRow}>
                  <LocationAutocomplete
                    value={textInput}
                    onInputChange={(text) => {
                      setTextInput(text);
                      setLocationError(null);

                      if (text === '') {
                        updateAnswer('placeOfBirthUnknown', false);
                        updateAnswer('placeOfBirth', '');
                        updateAnswer('birthLat', undefined);
                        updateAnswer('birthLon', undefined);
                        updateAnswer('birthTimezone', undefined);
                        setSelectedPlace(null);
                        return;
                      }

                      if (isIDK(text)) {
                        updateAnswer('placeOfBirthUnknown', true);
                        setSelectedPlace(null);
                        return;
                      }

                      updateAnswer('placeOfBirthUnknown', false);
                      setSelectedPlace(null);
                    }}
                    onResultsVisibilityChange={visible =>
                      setShowSendButton(!visible && !!(textInput || '').trim())
                    }
                    onSelect={(place) => {
                      setSelectedPlace(place);
                      setTextInput(place.label);
                      setLocationError(null);

                      updateAnswer('placeOfBirth', place.label);
                      updateAnswer('placeOfBirthUnknown', false);
                      updateAnswer('birthLat', place.lat);
                      updateAnswer('birthLon', place.lon);
                      updateAnswer('birthTimezone', place.timezone);

                      Keyboard.dismiss();
                    }}
                    onSubmitRequest={handleSend}
                  />

                  <TouchableOpacity
                    style={[styles.sendButton, { opacity: canProceedLocation ? 1 : 0.5 }]}
                    disabled={!canProceedLocation}
                    onPress={handleSend}
                  >
                    <Text style={styles.sendText}>{nextButtonLabel}</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={[styles.choiceButton, { alignSelf: 'center', marginTop: 16 }]} onPress={handleUnknown}>
                  <Text style={[styles.choiceText, { color: '#fff' }]}>I don’t know</Text>
                </TouchableOpacity>

                {!!locationError && (
                  <View style={styles.errorContainer}><Text style={styles.errorText}>{locationError}</Text></View>
                )}
              </View>
            );
          }

          case 'time': {
            const now = new Date();
            const birthDate = answers.birthday;
            const birthTime = answers.birthtime;
            const isUnknownTime = !!answers.birthtimeUnknown;
            const isBirthdayToday = birthDate?.toDateString() === now.toDateString();
            const isFutureTime =
              !isUnknownTime && birthTime != null &&
              isBirthdayToday &&
              (birthTime instanceof Date
                ? (birthTime.getHours() > now.getHours() ||
                  (birthTime.getHours() === now.getHours() && birthTime.getMinutes() > now.getMinutes()))
                : false);

            const displayTime = isUnknownTime
              ? "I don't know"
              : (birthTime ? formatTime12Hour(birthTime) : formatTime12Hour(null));

            return (
              <View style={styles.inputContainer}>
                <View style={styles.inputRow}>
                  <TouchableOpacity
                    style={[styles.datePickerButton, styles.textInput]}
                    onPress={() => { Keyboard.dismiss(); setShowTimePicker(true); }}
                  >
                    <Text style={styles.datePickerText}>{displayTime}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.sendButton, { opacity: (isUnknownTime || (!!birthTime && !isFutureTime)) ? 1 : 0.5 }]}
                    disabled={!(isUnknownTime || (!!birthTime && !isFutureTime))}
                    onPress={() => {
                      Keyboard.dismiss();
                      if (isUnknownTime) {
                        saveAndNext("I don't know");
                      } else {
                        saveAndNext(birthTime!);
                      }
                    }}
                  >
                    <Text style={styles.sendText}>{nextButtonLabel}</Text>
                  </TouchableOpacity>
                </View>

                {isFutureTime && (
                  <View style={styles.errorContainer}><Text style={styles.errorText}>Please select a valid time not in the future.</Text></View>
                )}

                <TouchableOpacity
                  style={[styles.choiceButton, { alignSelf: 'center', marginTop: 16 }]}
                  onPress={() => { Keyboard.dismiss(); saveAndNext("I don’t know"); }}
                >
                  <Text style={[styles.choiceText, isUnknownTime && { color: '#fff', fontWeight: '700' }]}>
                    I don’t know
                  </Text>
                </TouchableOpacity>

                <DateTimePickerModal
                  isVisible={showTimePicker}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  date={birthTime instanceof Date ? birthTime : new Date()}
                  onConfirm={time => { updateAnswer('birthtime', time); updateAnswer('birthtimeUnknown', false); setShowTimePicker(false); }}
                  onCancel={() => setShowTimePicker(false)}
                />
              </View>
            );
          }

          case 'email': {
            const handleSend = async () => {
              const e = (textInput || '').trim();
              if (!isValidEmail(e)) { setError('Please enter a valid email address.'); return; }
              try {
                const methods = await fetchSignInMethodsForEmail(auth, e);
                if (methods.length > 0) { setError('That email is already registered. Please sign in or use a different address.'); return; }
                updateAnswer('email', e);
                Keyboard.dismiss();
                saveAndNext(e);
              } catch {
                setError('Network error—please try again.');
              }
            };

            const canSend = !!textInput.trim();

            return (
              <View style={styles.inputContainer}>
                {error && (<View style={styles.errorContainer}><Text style={styles.errorText}>{error}</Text></View>)}
                <View style={styles.inputRow}>
                  <TextInput
                    ref={emailRef}
                    style={styles.textInput}
                    placeholder={current.placeholder}
                    placeholderTextColor="#fff"
                    value={textInput}
                    onChangeText={setTextInput}
                    {...emailKeyboardProps}
                    {...submitProps(canSend, handleSend, nextReturnKey)}
                  />
                  <TouchableOpacity
                    style={[styles.sendButton, { opacity: canSend ? 1 : 0.5 }]}
                    disabled={!canSend}
                    onPress={handleSend}
                  >
                    <Text style={styles.sendText}>{nextButtonLabel}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }

          case 'final': {
            const isDisabled = !checkedPolicy || !checkedTerms || loadingBigThree;
            return (
              <View style={styles.finalArea}>
                <View style={styles.row}>
                  <TouchableOpacity style={{ marginRight: 8 }} onPress={() => setCheckedTerms(!checkedTerms)}>
                    <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#6FFFE9', backgroundColor: checkedTerms ? '#6FFFE9' : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                      {checkedTerms && <Text style={{ color: '#1C2541', fontWeight: 'bold' }}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.footerText}>
                    I agree to the <Text style={styles.link} onPress={() => openPolicyModal('Terms & Conditions')}>Terms & Conditions</Text>
                  </Text>
                </View>

                <View style={styles.row}>
                  <TouchableOpacity style={{ marginRight: 8 }} onPress={() => setCheckedPolicy(!checkedPolicy)}>
                    <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#6FFFE9', backgroundColor: checkedPolicy ? '#6FFFE9' : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                      {checkedPolicy && <Text style={{ color: '#1C2541', fontWeight: 'bold' }}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.footerText}>
                    I agree to the <Text style={styles.link} onPress={() => openPolicyModal('Privacy Policy')}>Privacy Policy</Text>
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={async () => {
                    if (isDisabled) return;
                    setLoadingBigThree(true);
                    setBigThreeError(null);
                    const finalized = buildFinalPayload({ ...answers, themeKey: 'default' });
                    try {

                      onComplete({
                        ...finalized,
                      });
                    } catch (e) {
                      setBigThreeError('Could not fetch astrology data. Please try again.');
                    } finally {
                      setLoadingBigThree(false);
                    }
                  }}
                  disabled={isDisabled}
                  activeOpacity={0.7}
                  style={[styles.continueButton, isDisabled && styles.continueButtonDisabled]}
                >
                  <Text style={[styles.continueText, isDisabled && styles.continueTextDisabled]}>
                    {loadingBigThree ? 'Loading...' : 'Continue'}
                  </Text>
                </TouchableOpacity>
                {bigThreeError && (
                  <View style={styles.errorContainer}><Text style={styles.errorText}>{bigThreeError}</Text></View>
                )}
                {error && (
                  <View style={styles.errorContainer}><Text style={styles.errorText}>{error}</Text></View>
                )}
              </View>
            );
          }
          default:
            return null;
        }
      })()}
    </View>
  );

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1C2541" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + keyboardOffset}
      >
        <ScrollView ref={scrollRef} contentContainerStyle={styles.container} onContentSizeChange={handleContentSizeChange}>
          {steps.slice(0, step + 1).map((s, i) => (
            <View key={i} style={styles.bubbleContainer}>
              <Text style={styles.bubbleText}>{s.renderQuestion(answers)}</Text>
              {renderAnswerBubble(s, i)}
            </View>
          ))}
        </ScrollView>
        {renderInputArea()}
      </KeyboardAvoidingView>
      <PolicyModal
        visible={isPolicyModalVisible}
        onClose={closePolicyModal}
        title={policyModalContent}
        textContent={policyModalContent === 'Terms & Conditions' ? termsAndConditions : privacyPolicy}
      />
    </>
  );
}

// 🔒 Styles unchanged from your original file
const styles = StyleSheet.create({
  container: { paddingHorizontal: scale(20), paddingBottom: verticalScale(20) },
  bubbleContainer: { marginBottom: verticalScale(16), marginLeft: scale(2) },
  bubbleText: { alignSelf: 'flex-start', backgroundColor: '#3A506B', color: '#fff', padding: scale(12), borderRadius: scale(12), maxWidth: '75%' },
  answerBubble: { alignSelf: 'flex-end', backgroundColor: '#5BC0BE', padding: scale(12), borderRadius: scale(12), marginTop: verticalScale(8), maxWidth: '75%' },
  answerText: { color: '#000' },
  inputContainer: { flexDirection: 'column', padding: scale(15), backgroundColor: '#1C2541', width: '100%' },
  inputRow: {
    flexDirection: 'row',
    alignContent: 'center',
    marginTop: scale(5),
    backgroundColor: '#1C2541',
    width: '100%',
  },
  col75: { flex: 3 },
  col25: { flex: 0, paddingLeft: scale(10), justifyContent: 'center' },
  textInput: {
    flex: 1,
    backgroundColor: '#3A506B',
    borderRadius: scale(24),
    paddingHorizontal: scale(15),
    color: '#fff',
    height: verticalScale(50),
    marginBottom: verticalScale(Platform.OS === 'ios' ? 10 : 5),
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(142, 68, 173, 0.6)',
  },
  choiceRow: { flexDirection: 'row', justifyContent: 'space-around', padding: scale(5) },
  choiceButton: {
    borderWidth: 1,
    borderColor: '#e2e2e2ff',
    borderRadius: scale(20),
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(15),
    marginBottom: verticalScale(25),
  },
  choiceSelected: { backgroundColor: '#5BC0BE' },
  choiceText: { color: '#fff' },
  datePickerButton: {
    flex: 1,
    backgroundColor: '#3A506B',
    borderRadius: scale(24), justifyContent: 'center',
    paddingHorizontal: scale(16),
    height: verticalScale(48)
  },
  datePickerText: { color: '#fff' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: scale(12), marginBottom: verticalScale(8) },
  finalArea: { padding: scale(12), backgroundColor: '#1C2541' },
  footerText: { color: '#fff', marginLeft: scale(8) },
  link: { textDecorationLine: 'underline', color: '#6FFFE9' },
  continueButton: {
    marginTop: verticalScale(12),
    backgroundColor: '#6FFFE9',
    paddingVertical: verticalScale(14),
    borderRadius: scale(24),
    alignItems: 'center',
    marginBottom: verticalScale(Platform.OS === 'ios' ? 30 : 12),
  },
  continueText: { color: '#000', fontWeight: '600', fontSize: moderateScale(16) },
  continueButtonDisabled: { backgroundColor: '#A0A0A0' },
  continueTextDisabled: { color: '#666' },
  errorContainer: {
    flexDirection: 'row',
    marginTop: Platform.OS === 'ios' ? verticalScale(4) : verticalScale(6),
    marginBottom: Platform.OS === 'ios' ? verticalScale(4) : verticalScale(6),
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    fontSize: moderateScale(14),
    fontWeight: 'bold',
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    marginBottom: 0, marginLeft: scale(8),
    justifyContent: 'center'
  },
  backText: { fontSize: moderateScale(18), color: '#fff', fontWeight: 'bold' },
  passwordStyle: {
    width: '95%', flex: 1,
    backgroundColor: '#3A506B',
    borderRadius: scale(24),
    color: '#fff', height: verticalScale(50),
    marginBottom: verticalScale(Platform.OS === 'ios' ? 10 : 5),
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(142, 68, 173, 0.6)',
  },
  fieldFrame: {
    height: INPUT_H,
    borderRadius: scale(24),
    borderWidth: 1,
    borderColor: FIELD_BORDER,
    backgroundColor: '#3A506B',
    paddingHorizontal: scale(16),
    justifyContent: 'center',
  },
  inputInner: {
    color: '#fff',
    fontSize: moderateScale(16),
  },
  sendButton: {
    alignSelf: 'stretch',
    height: INPUT_H,
    borderRadius: scale(24),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(10),
  },
  sendText: { fontSize: moderateScale(18), color: '#fff' },
});
