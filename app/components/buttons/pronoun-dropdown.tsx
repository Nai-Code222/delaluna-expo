import React from 'react';
import { StyleSheet } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import AntDesign from '@expo/vector-icons/AntDesign';

const data = ['She/Her', 'He/Him', 'They/Them', 'Non Binary'].map(pronoun => ({ label: pronoun, value: pronoun }));

type PronounDropdownProps = {
  value: string;
  onChange: (value: string) => void;
};

const PronounDropdown: React.FC<PronounDropdownProps> = ({ value, onChange }) => {
  return (
    <Dropdown
      style={styles.dropdown}
      placeholderStyle={styles.placeholderStyle}
      selectedTextStyle={styles.selectedTextStyle}
      inputSearchStyle={styles.inputSearchStyle}
      iconStyle={styles.iconStyle}
      data={data}
      maxHeight={300}
      labelField="label"
      valueField="value"
      placeholder="Select pronouns"
      value={value}
      onChange={item => {
        onChange(item.value);
      }}
      
    />
  );
};

export default PronounDropdown;

const styles = StyleSheet.create({
  dropdown: {
    marginVertical: 8,
    height: 44,
    borderBottomColor: 'gray',
    borderBottomWidth: 0.5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  icon: {
    marginRight: 5,
  },
  placeholderStyle: {
    fontSize: 16,
    color: '#fff',
  },
  selectedTextStyle: {
    fontSize: 16,
    color: '#fff',
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
    color: '#fff',
  },
});