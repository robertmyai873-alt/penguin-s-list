// Japanese Design System - Washi + Moegi (Young Bamboo Green)
// Inspired by Mingei (folk craft) and Tea Ceremony aesthetics

export const theme = {
  colors: {
    // Washi (Japanese paper) palette
    washi: '#F5F2EB',           // Primary background - warm paper white
    washiCream: '#EDE8DC',      // Secondary background
    washiWarm: '#E5DFD0',       // Subtle highlights, borders

    // Sumi (ink) palette
    sumi: '#1A1A1A',            // Primary text - deep ink
    sumiMedium: '#3D3D3D',      // Secondary text
    sumiLight: '#6B6B6B',       // Muted text, placeholders

    // Moegi (young bamboo) - the green accent she loves
    moegi: '#5B7553',           // Primary accent - natural forest green
    moegiLight: '#7A9472',      // Lighter green for hover/active
    moegiSoft: '#E8EDE6',       // Very soft green tint

    // Legacy mappings for compatibility
    primary: '#5B7553',         // moegi
    background: '#F5F2EB',      // washi
    text: '#1A1A1A',            // sumi
    card: '#FFFFFF',
    placeholder: '#6B6B6B',     // sumiLight
    border: '#E5DFD0',          // washiWarm
  },

  // Ma (間) - meaningful spacing
  spacing: {
    ma1: 4,    // Minimal breathing
    ma2: 8,    // Tight grouping
    ma3: 12,   // Related elements
    ma4: 16,   // Standard
    ma5: 24,   // Section breathing
    ma6: 32,   // Major sections
    ma7: 48,   // Page-level
    ma8: 64,   // Dramatic pause
    ma9: 96,   // Contemplative space
  },

  // Gentle border radii (not too round, not too sharp)
  borderRadius: {
    subtle: 2,
    gentle: 4,
    soft: 8,
    round: 16,
    full: 9999,
  },

  // Soft shadows like natural light
  shadows: {
    whisper: '0 1px 2px rgba(0,0,0,0.04)',
    breath: '0 2px 4px rgba(0,0,0,0.06)',
    float: '0 4px 12px rgba(0,0,0,0.08)',
  },
};

export default theme;
