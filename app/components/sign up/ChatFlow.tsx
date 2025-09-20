// ChatFlow.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Keyboard, StatusBar,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import LocationAutocomplete from './LocationAutocomplete';
import { checkEmailExists } from '../../service/auth.service';
import { auth } from '../../../firebaseConfig';
import { fetchSignInMethodsForEmail } from 'firebase/auth';
import PolicyModal from './PolicyModals';
import { termsAndConditions, privacyPolicy } from '../../assets/legal/legalTexts';
import { format as formatDate } from 'date-fns';
import { scale, verticalScale, moderateScale } from '../../../src/utils/responsive';
import PasswordInputField from '../utils/passwordInputField';
import { DateTime } from 'luxon';

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
  onComplete: (finalized: FinalSignupPayload) => void;   // 👈 updated
  step: number;
  setStep: React.Dispatch<React.SetStateAction<number>>;
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
  const hh = dt.hour % 12 === 0 ? 12 : dt.hour % 12;
  const mm = pad2(dt.minute);
  const ampm = dt.hour >= 12 ? 'PM' : 'AM';
  return `${pad2(hh)}:${mm}${NBSP_NARROW}${ampm}`;   // "11:07 AM"
};

const utcOffsetToken = (dt: DateTime) => {
  // offset (minutes) -> "UTC-6" or "UTC+5:30"
  const off = dt.offset; // minutes
  const sign = off >= 0 ? '+' : '-';
  const abs = Math.abs(off);
  const oh = Math.floor(abs / 60);
  const om = abs % 60;
  return om === 0 ? `UTC${sign}${oh}` : `UTC${sign}${oh}:${pad2(om)}`;
};

const fmtStampWithOffset = (dt: DateTime) => {
  // "MM/DD/YYYY hh:mm:ss  AM UTC-6"
  const clock = dt.toFormat(`MM/dd/yyyy hh:mm:ss'${NBSP_NARROW}'a`);
  return `${clock} ${utcOffsetToken(dt)}`;
};

const buildFinalPayload = (a: AnswerRecord): FinalSignupPayload => {
  // fallbacks
  const tz = a.birthTimezone || DEFAULT_PLACE.timezone;
  const place = a.placeOfBirth || DEFAULT_PLACE.label;
  const lat = a.birthLat ?? DEFAULT_PLACE.lat;
  const lon = a.birthLon ?? DEFAULT_PLACE.lon;

  // date/time defaults if unknown
  const birthdayDate = a.birthday ?? new Date();
  const birthtimeDate = a.birthtime ?? defaultNoon;

  // strings
  const birthdayStr = fmtBirthday(birthdayDate);     // "MM/DD/YYYY"
  const birthtimeStr = fmtBirthtime(birthtimeDate);  // "hh:mm  AM"

  // create a Luxon in birth TZ, using local (birth) wall clock
  // we only need the *offset* label, not converting to UTC wall time.
  const [mm, dd, yyyy] = birthdayStr.split('/'); // from "MM/DD/YYYY"
  const hh24 = birthtimeDate.getHours();
  const mn = birthtimeDate.getMinutes();

  const dtLocal = DateTime.fromObject(
    { year: Number(yyyy), month: Number(mm), day: Number(dd), hour: hh24, minute: mn, second: 0, millisecond: 0 },
    { zone: tz }
  );

  // birthDateTimeUTC: "MM/DD/YYYY - hh:mm:ss  AM UTC-6"
  const clockLocal = dtLocal.toFormat(`MM/dd/yyyy - hh:mm:ss'${NBSP_NARROW}'a`);
  const birthDateTimeUTC = `${clockLocal} ${utcOffsetToken(dtLocal)}`;

  // "now" stamps (use device zone/offset)
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

    birthDateTimeUTC,
    lastLoginDate,
    signUpDate,
  };
};

// -------------------- component --------------------
export default function ChatFlow({ steps, onComplete, step, setStep }: ChatFlowProps) {
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

  const emailInputRef = useRef<TextInput>(null);
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
  const [emailValidating, setEmailValidating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(null);

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const current = steps[step];

  // Generic, type-safe answer updater
  const updateAnswer = <K extends keyof AnswerRecord>(key: K, value: AnswerRecord[K]) => {
    setAnswers(a => ({ ...a, [key]: value }));
  };

  useEffect(() => {
    if (current.inputType === 'location') setTextInput(answers.placeOfBirth || '');
    else if (current.inputType === 'email') setTextInput(answers.email || '');
    else setTextInput('');

    setError(null);
    setLocationError(null);
    setSelectedPlace(null);
  }, [current.key]);

  // Live email validation
  useEffect(() => {
    if (current.inputType !== 'email') { setError(null); setEmailValidating(false); return; }
    if (!textInput) { setError(null); setEmailValidating(false); return; }
    if (!isValidEmail(textInput)) { setError('Invalid email address'); setEmailValidating(false); return; }

    let active = true;
    setEmailValidating(true);
    const timer = setTimeout(async () => {
      try {
        const exists = await checkEmailExists(textInput);
        if (!active) return;
        setError(exists ? 'Email already in use' : null);
      } catch {
        if (active) setError('Please enter valid email address');
      } finally {
        if (active) setEmailValidating(false);
      }
    }, 500);

    return () => { active = false; clearTimeout(timer); };
  }, [textInput, current.inputType]);

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
    const hh = d.getHours() % 12 === 0 ? 12 : d.getHours() % 12;
    const mm = pad2(d.getMinutes());
    const ampm = d.getHours() >= 12 ? 'PM' : 'AM';
    return `${pad2(hh)}:${mm}${NBSP_NARROW}${ampm}`;
  };

  useEffect(() => {
    if (current.inputType === 'email' && error && emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, [error, step]);

  const capitalizeName = (name: string) =>
    name.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());

  const saveAndNext = (value?: any) => {
    switch (current.inputType) {
      case 'text': {
        if (isAnswerKey(current.key)) {
          const val =
            current.key === 'firstName' || current.key === 'lastName'
              ? (capitalizeName(textInput) as AnswerRecord[typeof current.key])
              : (textInput as AnswerRecord[typeof current.key]);
          updateAnswer(current.key, val);
        }
        setTextInput('');
        break;
      }
      case 'secure': {
        if (isAnswerKey(current.key)) updateAnswer(current.key, textInput as AnswerRecord[typeof current.key]);
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
        const unknown = value === 'I don’t know';
        updateAnswer('birthtime', unknown ? defaultNoon : (value as Date));
        updateAnswer('birthtimeUnknown', unknown);
        setShowTimePicker(false);
        break;
      }
      case 'location': {
        const unknown = value === 'I don’t know';
        updateAnswer('placeOfBirth', unknown ? DEFAULT_PLACE.label : (value as string));
        updateAnswer('placeOfBirthUnknown', unknown);
        setTextInput('');
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
      setStep(s => s + 1);
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

  const renderInputArea = () => (
    <View>
      {(() => {
        switch (current.inputType) {
          case 'text':
            return (
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.textInput}
                  placeholder={current.placeholder}
                  placeholderTextColor="#fff"
                  value={textInput}
                  onChangeText={setTextInput}
                />
                <TouchableOpacity
                  style={[styles.sendButton, { opacity: textInput ? 1 : 0.5 }]}
                  disabled={!textInput}
                  onPress={() => { Keyboard.dismiss(); saveAndNext(textInput); }}
                >
                  <Text style={styles.sendText}>➔</Text>
                </TouchableOpacity>
              </View>
            );

          case 'secure': {
            const handleSend = () => {
              if (!textInput) setError('Please enter a password.');
              else if (textInput.length < 8) setError('Password must be at least 8 characters.');
              else if (!/[A-Z]/.test(textInput)) setError('Password must contain at least one uppercase letter.');
              else { setError(null); Keyboard.dismiss(); updateAnswer('password', textInput); saveAndNext(textInput); }
            };
            return (
              <View style={styles.inputContainer}>
                <View style={styles.inputRow}>
                  <PasswordInputField
                  style={[styles.textInput, styles.passwordWidth]}
                    value={textInput}
                    onChangeText={setTextInput}
                    placeholder={current.placeholder}
                    placeholderTextColor="#fff"
                  />
                  <TouchableOpacity style={[styles.sendButton, { opacity: 1 }]} onPress={handleSend}>
                    <Text style={styles.sendText}>➔</Text>
                  </TouchableOpacity>
                </View>
                {error && (
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
                    style={styles.datePickerButton}
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
                    <Text style={styles.sendText}>➔</Text>
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
            const canSendLocation = !!selectedPlace && !answers.placeOfBirthUnknown;

            const handleSend = () => {
              if (!canSendLocation || !selectedPlace) {
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
              setSelectedPlace({
                label: DEFAULT_PLACE.label,
                lat: DEFAULT_PLACE.lat,
                lon: DEFAULT_PLACE.lon,
                timezone: DEFAULT_PLACE.timezone,
              });
              setTextInput(DEFAULT_PLACE.label);
              setLocationError(null);

              updateAnswer('placeOfBirth', DEFAULT_PLACE.label);
              updateAnswer('placeOfBirthUnknown', true);
              updateAnswer('birthLat', DEFAULT_PLACE.lat);
              updateAnswer('birthLon', DEFAULT_PLACE.lon);
              updateAnswer('birthTimezone', DEFAULT_PLACE.timezone);

              saveAndNext('I don’t know');
            };

            return (
              <View style={styles.inputContainer}>
                {!!locationError && (
                  <View style={styles.errorContainer}><Text style={styles.errorText}>{locationError}</Text></View>
                )}

                <View style={styles.inputRow}>
                  <LocationAutocomplete
                    value={textInput}
                    onInputChange={text => {
                      setTextInput(text);
                      setSelectedPlace(null);
                      updateAnswer('placeOfBirthUnknown', false);
                      setLocationError(null);
                    }}
                    onResultsVisibilityChange={visible => setShowSendButton(!visible && !!(textInput || '').trim())}
                    onSelect={place => {
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
                  />

                  <TouchableOpacity
                    style={[styles.sendButton, { opacity: canSendLocation ? 1 : 0.5 }]}
                    disabled={!canSendLocation}
                    onPress={handleSend}
                  >
                    <Text style={styles.sendText}>➔</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={[styles.choiceButton, { alignSelf: 'center', marginTop: 16 }]} onPress={handleUnknown}>
                  <Text style={[styles.choiceText, { color: '#fff' }]}>I don’t know</Text>
                </TouchableOpacity>
              </View>
            );
          }

          case 'time': {
            const now = new Date();
            const birthDate = answers.birthday;
            const birthTime = answers.birthtime;
            const isBirthdayToday = birthDate?.toDateString() === now.toDateString();
            const isFutureTime =
              birthTime != null &&
              isBirthdayToday &&
              (birthTime instanceof Date
                ? (birthTime.getHours() > now.getHours() ||
                  (birthTime.getHours() === now.getHours() && birthTime.getMinutes() > now.getMinutes()))
                : false);

            return (
              <View style={styles.inputContainer}>
                {isFutureTime && (
                  <View style={styles.errorContainer}><Text style={styles.errorText}>Please select a valid time not in the future.</Text></View>
                )}
                <View style={styles.inputRow}>
                  <TouchableOpacity style={styles.datePickerButton} onPress={() => { Keyboard.dismiss(); setShowTimePicker(true); }}>
                    <Text style={styles.datePickerText}>
                      {birthTime ? formatTime12Hour(birthTime) : formatTime12Hour(null)}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.sendButton, { opacity: birthTime && !isFutureTime ? 1 : 0.5 }]}
                    disabled={!birthTime || isFutureTime}
                    onPress={() => { Keyboard.dismiss(); saveAndNext(birthTime!); }}
                  >
                    <Text style={styles.sendText}>➔</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={[styles.choiceButton, { alignSelf: 'center', marginTop: 16 }]} onPress={() => { Keyboard.dismiss(); saveAndNext('I don’t know'); }}>
                  <Text style={[styles.choiceText, birthTime === undefined && { color: '#fff' }]}>I don’t know</Text>
                </TouchableOpacity>
                <DateTimePickerModal
                  isVisible={showTimePicker}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  date={birthTime instanceof Date ? birthTime : new Date()}
                  onConfirm={time => { updateAnswer('birthtime', time); setShowTimePicker(false); }}
                  onCancel={() => setShowTimePicker(false)}
                />
              </View>
            );
          }

          case 'email': {
            const handleSend = async () => {
              if (!isValidEmail(textInput)) { setError('Please enter a valid email address.'); return; }
              setError(null);
              try {
                const methods = await fetchSignInMethodsForEmail(auth, textInput);
                if (methods.length > 0) { setError('That email is already registered. Please sign in or use a different address.'); return; }
                updateAnswer('email', textInput);
                Keyboard.dismiss();
                saveAndNext(textInput);
              } catch (firebaseErr: any) {
                console.error(firebaseErr);
                setError('Network error—please try again.');
              }
            };

            return (
              <View style={styles.inputContainer}>
                {error && (<View style={styles.errorContainer}><Text style={styles.errorText}>{error}</Text></View>)}
                <View style={styles.inputRow}>
                  <TextInput
                    ref={emailInputRef}
                    style={styles.textInput}
                    placeholder={current.placeholder}
                    placeholderTextColor="#fff"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={textInput}
                    onChangeText={setTextInput}
                  />
                  <TouchableOpacity
                    style={[styles.sendButton, { opacity: textInput ? 1 : 0.5 }]}
                    disabled={!textInput}
                    onPress={handleSend}
                  >
                    <Text style={styles.sendText}>➔</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }

          case 'final': {
            const isDisabled = !checkedPolicy || !checkedTerms;
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
                  onPress={() => {
                    if (isDisabled) return;
                    const finalized = buildFinalPayload({ ...answers, themeKey: 'default' });
                    onComplete(finalized);
                  }}
                  disabled={isDisabled}
                  activeOpacity={0.7}
                  style={[styles.continueButton, isDisabled && styles.continueButtonDisabled]}
                >
                  <Text style={[styles.continueText, isDisabled && styles.continueTextDisabled]}>Continue</Text>
                </TouchableOpacity>

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
      <ScrollView ref={scrollRef} contentContainerStyle={styles.container} onContentSizeChange={handleContentSizeChange}>
        {steps.slice(0, step + 1).map((s, i) => (
          <View key={i} style={styles.bubbleContainer}>
            <Text style={styles.bubbleText}>{s.renderQuestion(answers)}</Text>
            {renderAnswerBubble(s, i)}
          </View>
        ))}
      </ScrollView>
      {renderInputArea()}

      <PolicyModal
        visible={isPolicyModalVisible}
        onClose={closePolicyModal}
        title={policyModalContent}
        textContent={policyModalContent === 'Terms & Conditions' ? termsAndConditions : privacyPolicy}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: scale(20), paddingBottom: verticalScale(20) },
  bubbleContainer: { marginBottom: verticalScale(16), marginLeft: scale(2) },
  bubbleText: { alignSelf: 'flex-start', backgroundColor: '#3A506B', color: '#fff', padding: scale(12), borderRadius: scale(12), maxWidth: '75%' },
  answerBubble: { alignSelf: 'flex-end', backgroundColor: '#5BC0BE', padding: scale(12), borderRadius: scale(12), marginTop: verticalScale(8), maxWidth: '75%' },
  answerText: { color: '#000' },
  inputContainer: { flexDirection: 'column', padding: scale(15), backgroundColor: '#1C2541', width: '100%' },
  inputRow: { flexDirection: 'row', padding: scale(15), backgroundColor: '#1C2541', width: '100%' },
  textInput: { flex: 1, backgroundColor: '#3A506B', borderRadius: scale(24), paddingHorizontal: scale(15), color: '#fff', height: verticalScale(50), marginBottom: verticalScale(Platform.OS === 'ios' ? 10 : 5), alignSelf: 'center' },
  sendButton: { marginLeft: scale(12), alignSelf: 'center', padding: scale(12) },
  sendText: { fontSize: moderateScale(18), color: '#fff' },
  choiceRow: { flexDirection: 'row', justifyContent: 'space-around', padding: scale(5) },
  choiceButton: { borderWidth: 1, borderColor: '#e2e2e2ff', borderRadius: scale(20), paddingVertical: verticalScale(10), paddingHorizontal: scale(15), marginBottom: verticalScale(25) },
  choiceSelected: { backgroundColor: '#5BC0BE' },
  choiceText: { color: '#fff' },
  datePickerButton: { flex: 1, backgroundColor: '#3A506B', borderRadius: scale(24), justifyContent: 'center', paddingHorizontal: scale(16), height: verticalScale(48) },
  datePickerText: { color: '#fff' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: scale(12), marginBottom: verticalScale(8) },
  finalArea: { padding: scale(12), backgroundColor: '#1C2541' },
  footerText: { color: '#fff', marginLeft: scale(8) },
  link: { textDecorationLine: 'underline', color: '#6FFFE9' },
  continueButton: { marginTop: verticalScale(12), backgroundColor: '#6FFFE9', paddingVertical: verticalScale(14), borderRadius: scale(24), alignItems: 'center', marginBottom: verticalScale(Platform.OS === 'ios' ? 30 : 12) },
  continueText: { color: '#000', fontWeight: '600', fontSize: moderateScale(16) },
  continueButtonDisabled: { backgroundColor: '#A0A0A0' },
  continueTextDisabled: { color: '#666' },
  errorContainer: { borderRadius: scale(12), padding: scale(12), marginTop: verticalScale(8), marginHorizontal: scale(10), maxWidth: '75%', alignSelf: 'center' },
  errorText: { color: 'red', marginTop: verticalScale(4), marginLeft: scale(12), textAlign: 'center', fontSize: moderateScale(15), fontWeight: 'bold' },
  backButton: { alignSelf: 'flex-start', paddingHorizontal: scale(12), paddingVertical: verticalScale(8), marginBottom: 0, marginLeft: scale(8), justifyContent: 'center' },
  backText: { fontSize: moderateScale(18), color: '#fff', fontWeight: 'bold' },
  passwordWidth: { flex: 1, width: '100%'}
});
