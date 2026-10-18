// Geometry of the floating tab bar. Shared so screens can leave room for it and
// the scan result animation can fly a photo straight into the Board tab.
export const TAB_BAR_HEIGHT = 60;
const TAB_BAR_MAX_WIDTH = 320;
const TAB_BAR_SIDE_MARGIN = 28;

export function tabBarFrame(screenWidth: number, bottomInset: number) {
  const width = Math.min(screenWidth - TAB_BAR_SIDE_MARGIN * 2, TAB_BAR_MAX_WIDTH);
  const bottom = bottomInset > 0 ? bottomInset - 4 : 16;
  return { width, left: (screenWidth - width) / 2, bottom, height: TAB_BAR_HEIGHT };
}

// Space to leave under scrolling content so the last item clears the tab bar.
export function tabBarClearance(bottomInset: number) {
  const { bottom, height } = tabBarFrame(0, bottomInset);
  return bottom + height + 16;
}

export const PAGES = { board: 0, scan: 1, impact: 2 } as const;
export type PageIndex = (typeof PAGES)[keyof typeof PAGES];
