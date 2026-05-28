import { Image } from 'expo-image';
import { StyleSheet, View, type ImageStyle, type ViewStyle } from 'react-native';

const logoSource = require('@/assets/images/skillbee-logo.png');

type Props = {
  /** Visual size preset */
  size?: 'header' | 'authHero' | 'splash';
  style?: ViewStyle;
};

const WIDTH_BY_SIZE = {
  header: 168,
  authHero: 280,
  splash: 300,
} as const;

const HEIGHT_BY_SIZE = {
  header: 72,
  authHero: 120,
  splash: 128,
} as const;

export function SkillBeeLogo({ size = 'header', style }: Props) {
  const width = WIDTH_BY_SIZE[size];
  const height = HEIGHT_BY_SIZE[size];
  const imageStyle: ImageStyle = {
    width,
    height,
  };
  return (
    <View style={[styles.wrap, style]}>
      <Image source={logoSource} style={imageStyle} contentFit="contain" />
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
