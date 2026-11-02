/**
 * ===================================================================
 * LOCAL STORAGE & STATS MANAGER
 * ===================================================================
 */

const STORAGE_KEY_HIGH_SCORES = 'fypms_typing_high_scores';
const STORAGE_KEY_SETTINGS = 'fypms_typing_settings';

export const storageManager = {
  getHighScores() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_HIGH_SCORES);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  getHighScore(mode, difficulty) {
    const scores = this.getHighScores();
    const key = `${mode}_${difficulty}`;
    return scores[key] || 0;
  },

  saveHighScore(mode, difficulty, score) {
    try {
      const scores = this.getHighScores();
      const key = `${mode}_${difficulty}`;
      if (score > (scores[key] || 0)) {
        scores[key] = score;
        localStorage.setItem(STORAGE_KEY_HIGH_SCORES, JSON.stringify(scores));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_SETTINGS);
      return data ? JSON.parse(data) : { muted: false, theme: 'dark' };
    } catch {
      return { muted: false, theme: 'dark' };
    }
  },

  saveSettings(settings) {
    try {
      const current = this.getSettings();
      const merged = { ...current, ...settings };
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(merged));
    } catch {
      // storage unavailable guard
    }
  },

  resetAllData() {
    try {
      localStorage.removeItem(STORAGE_KEY_HIGH_SCORES);
      localStorage.removeItem(STORAGE_KEY_SETTINGS);
    } catch {
      // guard
    }
  }
};
