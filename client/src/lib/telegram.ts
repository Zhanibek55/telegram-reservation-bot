type WebApp = {
  initData: string;
  initDataUnsafe: {
    query_id: string;
    user: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
    auth_date: string;
    hash: string;
  };
  colorScheme: 'light' | 'dark';
  themeParams: {
    bg_color: string;
    text_color: string;
    hint_color: string;
    link_color: string;
    button_color: string;
    button_text_color: string;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  ready: () => void;
  expand: () => void;
  close: () => void;
  showPopup: (params: any) => void;
  showAlert: (message: string) => void;
  showConfirm: (message: string) => Promise<boolean>;
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText: (text: string) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive: boolean) => void;
    hideProgress: () => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
  };
  BackButton: {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  openLink: (url: string) => void;
  closeLink: () => void;
  setHeaderColor: (color: string) => void;
};

// Define a global Telegram type
declare global {
  interface Window {
    Telegram?: {
      WebApp?: WebApp;
    };
  }
}

// Get telegram webapp instance
export const tg = window.Telegram?.WebApp;

// Initialize Telegram WebApp
export const initTelegramApp = () => {
  if (tg) {
    tg.ready();
    tg.expand();
  }
};

// Get user data from Telegram
export const getTelegramUser = () => {
  if (tg?.initDataUnsafe?.user) {
    return tg.initDataUnsafe.user;
  }
  return null;
};

// Get user's telegram ID
export const getTelegramUserId = (): string | null => {
  const user = getTelegramUser();
  return user ? user.id.toString() : null;
};

// Check if dark mode is enabled
export const isDarkMode = (): boolean => {
  return tg?.colorScheme === 'dark';
};

// Handle back button
export const setupBackButton = (callback: () => void) => {
  if (tg?.BackButton) {
    tg.BackButton.show();
    tg.BackButton.onClick(callback);
    return () => {
      tg.BackButton.offClick(callback);
      tg.BackButton.hide();
    };
  }
  return () => {};
};

// Handle main button
export const setupMainButton = (text: string, callback: () => void) => {
  if (tg?.MainButton) {
    tg.MainButton.setText(text);
    tg.MainButton.onClick(callback);
    tg.MainButton.show();
    return () => {
      tg.MainButton.offClick(callback);
      tg.MainButton.hide();
    };
  }
  return () => {};
};

// Show alert
export const showAlert = (message: string) => {
  if (tg) {
    tg.showAlert(message);
  } else {
    alert(message);
  }
};

// Show confirm dialog
export const showConfirm = async (message: string): Promise<boolean> => {
  if (tg) {
    return tg.showConfirm(message);
  }
  return window.confirm(message);
};

// Vibration feedback
export const hapticFeedback = (type: 'success' | 'error' | 'warning') => {
  if (tg?.HapticFeedback) {
    tg.HapticFeedback.notificationOccurred(type);
  }
};

export default {
  tg,
  initTelegramApp,
  getTelegramUser,
  getTelegramUserId,
  isDarkMode,
  setupBackButton,
  setupMainButton,
  showAlert,
  showConfirm,
  hapticFeedback
};
