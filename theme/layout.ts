import { space } from './spacing';

/** Icon row only — must match `app/(tabs)/_layout.tsx` */
export const TAB_BAR_ICON_ROW = 48;
/** Labels + padding under icons — must match `+22` in tab bar height there */
export const TAB_BAR_BOTTOM_CHROME = 22;

/** Floating tab bar height (same formula as `Tabs` `tabBarStyle.height`) */
export function tabBarStripHeight(bottomInset: number): number {
  return TAB_BAR_ICON_ROW + bottomInset + TAB_BAR_BOTTOM_CHROME;
}

export const layout = {
  screenPaddingX: space.lg,
  tabBarRadius: 28,
  tabIconSize: 26,
} as const;
