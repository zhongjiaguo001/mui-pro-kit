import type { NavMenuTheme } from './types';

export interface NavMenuPalette {
  bg: string;
  subMenuBg: string;
  popupBg: string;
  borderColor: string;
  dividerColor: string;
  text: string;
  textMuted: string;
  textHover: string;
  itemHoverBg: string;
  itemSelectedBg: string;
  itemSelectedText: string;
  ancestorSelectedText: string;
  activeIndicator: string;
  dangerText: string;
  dangerHoverBg: string;
  dangerSelectedBg: string;
  disabledText: string;
  groupTitleText: string;
  popupShadow: string;
}

export const NAV_MENU_PALETTES: Record<NavMenuTheme, NavMenuPalette> = {
  light: {
    bg: '#FFFFFF',
    subMenuBg: '#FAFAFA',
    popupBg: '#FFFFFF',
    borderColor: '#E5E7EB',
    dividerColor: 'rgba(15, 23, 42, 0.08)',
    text: '#1E293B',
    textMuted: '#64748B',
    textHover: '#0F172A',
    itemHoverBg: 'rgba(15, 23, 42, 0.045)',
    itemSelectedBg: '#EBF4FF',
    itemSelectedText: '#1976D2',
    ancestorSelectedText: '#1976D2',
    activeIndicator: '#1976D2',
    dangerText: '#DC2626',
    dangerHoverBg: 'rgba(220, 38, 38, 0.08)',
    dangerSelectedBg: '#DC2626',
    disabledText: 'rgba(15, 23, 42, 0.3)',
    groupTitleText: '#64748B',
    popupShadow:
      '0 6px 16px 0 rgba(15, 23, 42, 0.08), 0 3px 6px -4px rgba(15, 23, 42, 0.12), 0 9px 28px 8px rgba(15, 23, 42, 0.05)',
  },
  dark: {
    bg: '#001529',
    subMenuBg: '#000C17',
    popupBg: '#001529',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    dividerColor: 'rgba(255, 255, 255, 0.1)',
    text: 'rgba(255, 255, 255, 0.72)',
    textMuted: 'rgba(255, 255, 255, 0.48)',
    textHover: '#FFFFFF',
    itemHoverBg: 'rgba(255, 255, 255, 0.08)',
    itemSelectedBg: '#1976D2',
    itemSelectedText: '#FFFFFF',
    ancestorSelectedText: '#FFFFFF',
    activeIndicator: '#38BDF8',
    dangerText: '#F87171',
    dangerHoverBg: 'rgba(248, 113, 113, 0.16)',
    dangerSelectedBg: '#DC2626',
    disabledText: 'rgba(255, 255, 255, 0.28)',
    groupTitleText: 'rgba(255, 255, 255, 0.45)',
    popupShadow:
      '0 10px 28px rgba(0, 0, 0, 0.42), 0 4px 12px rgba(0, 0, 0, 0.32)',
  },
};
