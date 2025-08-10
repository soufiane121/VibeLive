// Global color scheme for VibeLive Boost Flow
// Nightlife-friendly neon colors optimized for dark environments

export const BoostColors = {
  // Primary brand colors
  primary: '#00FFFF',        // Cyan - Main brand color
  secondary: '#FF1493',      // Deep Pink - Premium features
  accent: '#FFD700',         // Gold - Ultimate tier
  
  // Background colors
  background: {
    primary: '#0a0a0a',      // Deep black - Main background
    secondary: '#1a1a1a',    // Dark gray - Card backgrounds
    overlay: 'rgba(0, 0, 0, 0.8)', // Modal overlay
  },
  
  // Text colors
  text: {
    primary: '#FFFFFF',      // White - Primary text
    secondary: '#CCCCCC',    // Light gray - Secondary text
    muted: '#888888',        // Gray - Muted text
    inverse: '#000000',      // Black - Text on light backgrounds
  },
  
  // Boost tier colors
  tiers: {
    basic: {
      primary: '#00FFFF',     // Cyan
      background: 'rgba(0, 255, 255, 0.1)',
      border: 'rgba(0, 255, 255, 0.3)',
    },
    premium: {
      primary: '#FF1493',     // Deep Pink
      background: 'rgba(255, 20, 147, 0.1)',
      border: 'rgba(255, 20, 147, 0.3)',
    },
    ultimate: {
      primary: '#FFD700',     // Gold
      background: 'rgba(255, 215, 0, 0.1)',
      border: 'rgba(255, 215, 0, 0.3)',
    },
  },
  
  // UI element colors
  ui: {
    border: '#333333',       // Default border
    borderActive: '#00FFFF', // Active border
    success: '#4ECDC4',      // Success green
    error: '#FF6B6B',        // Error red
    warning: '#FFA500',      // Warning orange
    divider: 'rgba(255, 255, 255, 0.1)', // Divider lines
  },
  
  // Button colors
  buttons: {
    primary: {
      background: '#00FFFF',
      text: '#000000',
      border: '#00FFFF',
    },
    secondary: {
      background: 'rgba(255, 20, 147, 0.1)',
      text: '#FF1493',
      border: '#FF1493',
    },
    ghost: {
      background: 'transparent',
      text: '#CCCCCC',
      border: '#666666',
    },
    disabled: {
      background: '#333333',
      text: '#666666',
      border: '#333333',
    },
  },
  
  // Animation colors
  animations: {
    pulse: 'rgba(0, 255, 255, 0.3)',
    glow: 'rgba(255, 20, 147, 0.2)',
    flash: 'rgba(255, 20, 147, 0.6)',
  },
  
  // Semantic colors
  semantic: {
    urgency: '#FF1493',      // Pink for urgency
    scarcity: '#FFD700',     // Gold for scarcity
    socialProof: '#00FFFF',  // Cyan for social proof
    competition: '#FFA500',  // Orange for competition
  },
};

// Utility functions for color manipulation
export const BoostColorUtils = {
  // Add alpha to any color
  withAlpha: (color: string, alpha: number): string => {
    if (color.startsWith('rgba')) {
      return color.replace(/[\d\.]+\)$/g, `${alpha})`);
    }
    if (color.startsWith('rgb')) {
      return color.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
    }
    if (color.startsWith('#')) {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return color;
  },
  
  // Get tier color by tier ID
  getTierColor: (tierId: 'basic' | 'premium' | 'ultimate'): string => {
    return BoostColors.tiers[tierId].primary;
  },
  
  // Get tier background by tier ID
  getTierBackground: (tierId: 'basic' | 'premium' | 'ultimate'): string => {
    return BoostColors.tiers[tierId].background;
  },
  
  // Get tier border by tier ID
  getTierBorder: (tierId: 'basic' | 'premium' | 'ultimate'): string => {
    return BoostColors.tiers[tierId].border;
  },
};

export default BoostColors;
