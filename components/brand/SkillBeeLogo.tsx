import { Image } from 'expo-image';
import { StyleSheet, View, type ViewStyle } from 'react-native';

const logoSource = require('@/assets/images/skillbee-logo.png');

type Props = {
  /** Visual size preset */
  size?: 'header' | 'authHero' | 'splash';
  style?: ViewStyle;
};

/** Transparent PNG — width-led sizing (logo is wider than tall). */
const WIDTH_BY_SIZE = {
  header: 200,
  authHero: 300,
  splash: 320,
} as const;

const HEIGHT_BY_SIZE = {
  header: 134,
  authHero: 168,
  splash: 214,
} as const;

export function SkillBeeLogo({ size = 'header', style }: Props) {
  const width = WIDTH_BY_SIZE[size];
  const height = HEIGHT_BY_SIZE[size];
  return (
    <View style={[styles.wrap, style]}>
      <Image
        source={logoSource}
        style={{ width, height }}
        contentFit="contain"
        accessibilityLabel="SkillBee logo"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});
