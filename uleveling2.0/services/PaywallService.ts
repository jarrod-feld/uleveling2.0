// @ts-ignore
import Superwall from '@superwall/react-native-expo';

class PaywallService {
  static async initialize() {
    // TODO: Replace with your actual Superwall API key
    const apiKey = 'YOUR_SUPERWALL_API_KEY';
    try {
      console.log('[PaywallService] Initializing Superwall...');
      await Superwall.configure(apiKey);
      console.log('[PaywallService] Superwall initialized successfully.');
    } catch (error) {
      console.error('[PaywallService] Error initializing Superwall:', error);
    }
  }

  static async presentPaywall() {
    try {
      console.log('[PaywallService] Attempting to present paywall...');
      // Present the default paywall configured in your Superwall dashboard
      await Superwall.present();
      console.log('[PaywallService] Paywall presentation attempted.');
    } catch (error) {
      console.error('[PaywallService] Error presenting paywall:', error);
    }
  }
}

export default PaywallService;
