import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
  StyleSheet,
  GestureResponderEvent,
  ViewStyle,
  TextStyle,
} from 'react-native';

type Option = {
  id: string;
  label: string;
  value?: number | any;
};

type RatingMenuProps = {
  options?: Option[];
  onSelect: (option: Option) => void;
  buttonTitle?: string;
  buttonStyle?: ViewStyle;
  buttonTextStyle?: TextStyle;
  optionStyle?: ViewStyle;
  optionTextStyle?: TextStyle;
  accessibleLabel?: string;
};

export default function RatingMenu({
  options,
  onSelect,
  buttonTitle = 'Rate',
  buttonStyle,
  buttonTextStyle,
  optionStyle,
  optionTextStyle,
  accessibleLabel = 'Open rating menu',
}: RatingMenuProps) {
  // generate default numeric options (1.0 .. 5.0 step 0.5) when none are provided
  const defaultOptions: Option[] = React.useMemo(() => {
    if (options && options.length > 0) return options;
    const out: Option[] = [];
    for (let v = 1.0; v <= 5.0001; v += 0.5) {
      const val = Math.round(v * 10) / 10;
      out.push({ id: val.toFixed(1), label: val.toFixed(1), value: val });
    }
    return out;
  }, [options]);

  const [visible, setVisible] = useState(false);

  function openMenu(e?: GestureResponderEvent) {
    setVisible(true);
  }

  function closeMenu() {
    setVisible(false);
  }

  function handleSelect(option: Option) {
    closeMenu();
    onSelect(option);
  }

  return (
    <View>
      <Pressable
        onPress={openMenu}
        accessibilityLabel={accessibleLabel}
        style={[styles.button, buttonStyle]}
      >
        <Text style={[styles.buttonText, buttonTextStyle]}>{buttonTitle}</Text>
      </Pressable>

      <Modal
        visible={visible}
        animationType="fade"
        transparent
        onRequestClose={closeMenu}
      >
        <Pressable style={styles.backdrop} onPress={closeMenu} />

        <View style={styles.menuContainer} pointerEvents="box-none">
          <View style={styles.menu}>
            <FlatList
              data={defaultOptions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleSelect(item)}
                  style={({ pressed }) => [
                    styles.option,
                    pressed && styles.optionPressed,
                    optionStyle,
                  ]}
                >
                  <Text style={[styles.optionText, optionTextStyle]}>
                    {item.label}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)'
  },
  menuContainer: {
    position: 'absolute',
    top: '30%',
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  menu: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  optionPressed: {
    backgroundColor: '#eee',
  },
  optionText: {
    fontSize: 16,
  },
});
