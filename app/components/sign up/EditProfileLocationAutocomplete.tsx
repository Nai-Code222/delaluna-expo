import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  ViewStyle,
  TextStyle,
  Dimensions,
} from 'react-native';

type PhotonFeature = {
  properties: {
    name: string;
    city?: string;
    state?: string;
    country?: string;
    osm_id: number;
  };
  geometry: { coordinates: [number, number] };
};

interface GenericAutocompleteProps {
  value: string;
  onChange: (text: string) => void;
  onSelect: (item: PhotonFeature) => void;
  fetchSuggestions: (query: string) => Promise<PhotonFeature[]>;
  placeholder?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  listStyle?: ViewStyle;
}

export default function EditProfileLocationAutocomplete({
  value,
  onChange,
  onSelect,
  fetchSuggestions,
  placeholder = '',
  containerStyle,
  inputStyle,
  listStyle,
}: GenericAutocompleteProps) {
  const [results, setResults] = useState<PhotonFeature[]>([]);
  const [showList, setShowList] = useState(false);
  const isSelecting = useRef(false);
  const blurTimeout = useRef<NodeJS.Timeout>();
  const inputRef = useRef<TextInput>(null);

  // Fixed width for the autocomplete (adjust as needed)
  const AUTOCOMPLETE_WIDTH = Dimensions.get('window').width - 40; // 20px padding each side

  useEffect(() => {
    if (!showList || value.length < 3) {
      setResults([]);
      return;
    }
    const handler = setTimeout(() => {
      fetchSuggestions(value)
        .then(setResults)
        .catch(() => setResults([]));
    }, 300);
    return () => clearTimeout(handler);
  }, [value, showList, fetchSuggestions]);

  const handleBlur = () => {
    blurTimeout.current = setTimeout(() => {
      if (!isSelecting.current) setShowList(false);
    }, 100);
  };

  const handleSelectItem = (item: PhotonFeature) => {
    isSelecting.current = true;
    const { name, city, state, country } = item.properties;
    const label = [name, city, state, country].filter(Boolean).join(', ');
    onSelect(item);
    onChange(label);
    clearTimeout(blurTimeout.current!);
    setShowList(false);
    setTimeout(() => {
      isSelecting.current = false;
    }, 200);
  };

  return (
    <View
      style={[
        styles.container,
        { width: AUTOCOMPLETE_WIDTH, minHeight: 48, maxHeight: 48 }, // fixed height for input
        containerStyle,
      ]}
    >
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={text => {
          onChange(text);
          setShowList(true);
        }}
        placeholder={placeholder}
        placeholderTextColor="#999"
        style={[
          styles.input,
          { height: 48, width: '100%' }, // fixed height/width
          inputStyle,
        ]}
        onFocus={() => setShowList(true)}
        onBlur={handleBlur}
        autoCorrect={false}
        keyboardType="default"
      />
      {showList && results.length > 0 && (
        <View
          style={[
            styles.listContainer,
            {
              position: 'absolute',
              top: 48, // exactly below the input
              left: 0,
              width: '100%',
              zIndex: 1000,
            },
            listStyle,
          ]}
        >
          <FlatList
            keyboardShouldPersistTaps="handled"
            data={results}
            keyExtractor={item => item.properties.osm_id.toString()}
            renderItem={({ item }) => {
              const { name, city, state, country } = item.properties;
              const label = [name, city, state, country].filter(Boolean).join(', ');
              return (
                <TouchableOpacity
                  style={styles.item}
                  onPress={() => handleSelectItem(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.itemText}>{label}</Text>
                </TouchableOpacity>
              );
            }}
            style={{ maxHeight: 200 }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: Platform.OS === 'ios' ? 999 : 1,
    // width and height are set inline above
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    marginBottom: 0,
    ...Platform.select({ ios: { height: 48 }, android: { height: 48 } }),
  },
  listContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  item: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  itemText: {
    color: '#333',
  },
});
