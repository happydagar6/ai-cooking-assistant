/**
 * Mobile Voice Recognition Test Utility
 * This utility helps debug and test voice recognition functionality on mobile devices
 */

export const MobileVoiceTest = {
  // Check browser compatibility
  checkBrowserSupport() {
    const results = {
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      hasWebkitSpeechRecognition: 'webkitSpeechRecognition' in window,
      hasSpeechRecognition: 'SpeechRecognition' in window,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language
    };
    
    console.log('Browser Support Check:', results);
    return results;
  },

  // Test basic speech recognition initialization
  testInitialization() {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        throw new Error('Speech Recognition not supported');
      }
      
      const recognition = new SpeechRecognition();
      console.log('Speech Recognition initialized successfully');
      console.log('Recognition properties:', {
        continuous: recognition.continuous,
        interimResults: recognition.interimResults,
        lang: recognition.lang,
        maxAlternatives: recognition.maxAlternatives
      });
      
      return { success: true, recognition };
    } catch (error) {
      console.error('Speech Recognition initialization failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Test mobile-specific settings
  testMobileSettings() {
    const initResult = this.testInitialization();
    if (!initResult.success) {
      return initResult;
    }
    
    const recognition = initResult.recognition;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      try {
        // Apply mobile-specific settings
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognition.lang = 'en-US';
        
        console.log('Mobile settings applied:', {
          continuous: recognition.continuous,
          interimResults: recognition.interimResults,
          maxAlternatives: recognition.maxAlternatives,
          lang: recognition.lang
        });
        
        return { success: true, settings: 'mobile' };
      } catch (error) {
        console.error('Failed to apply mobile settings:', error);
        return { success: false, error: error.message };
      }
    } else {
      console.log('Desktop detected, using desktop settings');
      return { success: true, settings: 'desktop' };
    }
  },

  // Test microphone permissions
  async testMicrophonePermissions() {
    try {
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'microphone' });
        console.log('Microphone permission status:', permission.state);
        return { success: true, permission: permission.state };
      } else {
        console.log('Permissions API not available');
        return { success: true, permission: 'unknown' };
      }
    } catch (error) {
      console.error('Failed to check microphone permissions:', error);
      return { success: false, error: error.message };
    }
  },

  // Run a quick recognition test
  async runQuickTest() {
    console.log('Starting Mobile Voice Recognition Test...');
    
    const browserSupport = this.checkBrowserSupport();
    const initTest = this.testInitialization();
    const settingsTest = this.testMobileSettings();
    const permissionTest = await this.testMicrophonePermissions();
    
    const results = {
      browserSupport,
      initialization: initTest,
      settings: settingsTest,
      permissions: permissionTest,
      overall: browserSupport.hasWebkitSpeechRecognition || browserSupport.hasSpeechRecognition ? 'SUPPORTED' : 'NOT_SUPPORTED'
    };
    
    console.log('=== MOBILE VOICE TEST RESULTS ===');
    console.table({
      'Mobile Device': browserSupport.isMobile ? 'YES' : 'NO',
      'Speech Recognition': results.overall,
      'Microphone Permission': permissionTest.permission || 'Unknown',
      'Browser': browserSupport.userAgent.includes('Chrome') ? 'Chrome' : 
                 browserSupport.userAgent.includes('Safari') ? 'Safari' :
                 browserSupport.userAgent.includes('Edge') ? 'Edge' : 'Other'
    });
    
    return results;
  },

  // Provide troubleshooting tips
  getTroubleshootingTips() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    const tips = [
      '🎤 Ensure microphone permissions are granted',
      '🌐 Use HTTPS (required for speech recognition)',
      '📱 Test on Chrome or Safari mobile browsers'
    ];
    
    if (isMobile) {
      tips.push('📲 Tap the microphone button and speak clearly');
      tips.push('🔊 Ensure device volume is up');
      tips.push('🚫 Close other apps that might use the microphone');
    }
    
    if (isIOS) {
      tips.push('🍎 iOS: Voice recognition works best in Safari');
      tips.push('🍎 iOS: Ensure "Listen for Siri" is enabled in Settings');
    }
    
    if (isAndroid) {
      tips.push('🤖 Android: Chrome provides the best voice recognition support');
      tips.push('🤖 Android: Check Google app permissions for microphone access');
    }
    
    console.log('=== TROUBLESHOOTING TIPS ===');
    tips.forEach(tip => console.log(tip));
    
    return tips;
  }
};

// Auto-run test in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Run test after a short delay to ensure page is loaded
  setTimeout(() => {
    MobileVoiceTest.runQuickTest();
    MobileVoiceTest.getTroubleshootingTips();
  }, 2000);
}