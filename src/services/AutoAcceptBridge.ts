import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { AutoAcceptBridge } = NativeModules;

export interface SystemStatus {
  hasOverlay: boolean;
  isAccessibilityActive: boolean;
  isRootAvailable: boolean;
  isOverlayRunning: boolean;
}

export interface AutoAcceptConfig {
  isEnabled: boolean;
  minPrice: number;
  minKmRate: number;
  targetPackage: string;
  keywords: string;
  useRootClick: boolean;
  forceSwipe?: boolean;
  playCallSound?: boolean;
  viewId?: string;
  priceRegex?: string;
}

export interface RideEvent {
  price: number;
  accepted: boolean;
  elapsedMs: number;
  timestamp: number;
}

const eventEmitter = AutoAcceptBridge ? new NativeEventEmitter(AutoAcceptBridge) : null;

export const BridgeService = {
  openAccessibilitySettings: () => {
    if (AutoAcceptBridge?.openAccessibilitySettings) {
      AutoAcceptBridge.openAccessibilitySettings();
    }
  },

  openOverlaySettings: () => {
    if (AutoAcceptBridge?.openOverlaySettings) {
      AutoAcceptBridge.openOverlaySettings();
    }
  },

  checkPermissions: async (): Promise<SystemStatus> => {
    if (AutoAcceptBridge?.checkPermissions) {
      return await AutoAcceptBridge.checkPermissions();
    }
    return {
      hasOverlay: false,
      isAccessibilityActive: false,
      isRootAvailable: false,
      isOverlayRunning: false,
    };
  },

  updateConfig: (config: AutoAcceptConfig) => {
    if (AutoAcceptBridge?.updateConfig) {
      AutoAcceptBridge.updateConfig(config);
    }
  },

  startFloatingHUD: () => {
    if (AutoAcceptBridge?.startFloatingHUD) {
      AutoAcceptBridge.startFloatingHUD();
    }
  },

  stopFloatingHUD: () => {
    if (AutoAcceptBridge?.stopFloatingHUD) {
      AutoAcceptBridge.stopFloatingHUD();
    }
  },

  subscribeRideEvents: (callback: (event: RideEvent) => void) => {
    if (!eventEmitter) return { remove: () => {} };
    return eventEmitter.addListener('onRideProcessed', callback);
  },
};
