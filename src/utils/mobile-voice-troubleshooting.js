/**
 * Mobile Voice Recognition Troubleshooting and Fixes
 * Common issues and solutions for mobile voice recognition
 */

// Common mobile voice recognition issues and solutions
export const MobileVoiceTroubleshooting = {
  
  // Check all prerequisites for mobile voice recognition
  async checkPrerequisites() {
    console.log('🔍 Checking mobile voice recognition prerequisites...');
    
    const results = {
      https: window.location.protocol === 'https:' || window.location.hostname === 'localhost',
      speechRecognition: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
      microphone: null,
      userGesture: true, // We assume this check is called from a user gesture
      browser: this.getBrowserInfo(),
      mobile: this.isMobileDevice()
    };
    
    // Check microphone permissions
    try {
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'microphone' });
        results.microphone = permission.state;
      }
    } catch (error) {
      console.log('Cannot check microphone permissions:', error);
      results.microphone = 'unknown';
    }
    
    console.log('Prerequisites check results:', results);
    return results;
  },
  
  // Get detailed browser information
  getBrowserInfo() {
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Chrome') && userAgent.includes('Mobile')) {
      return { name: 'Chrome Mobile', supported: true };
    } else if (userAgent.includes('Safari') && userAgent.includes('Mobile')) {
      return { name: 'Safari Mobile', supported: true };
    } else if (userAgent.includes('Firefox') && userAgent.includes('Mobile')) {
      return { name: 'Firefox Mobile', supported: false };
    } else if (userAgent.includes('Edge') && userAgent.includes('Mobile')) {
      return { name: 'Edge Mobile', supported: true };
    } else {
      return { name: 'Unknown Mobile', supported: false };
    }
  },
  
  // Check if device is mobile
  isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },
  
  // Test basic speech recognition functionality
  async testBasicRecognition() {
    console.log('🧪 Testing basic speech recognition...');
    
    return new Promise((resolve) => {
      if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        resolve({ success: false, error: 'Speech Recognition API not available' });
        return;
      }
      
      try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        // Set mobile-friendly options
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;
        
        let hasStarted = false;
        let hasResult = false;
        
        const timeout = setTimeout(() => {
          if (!hasStarted) {
            recognition.stop();
            resolve({ success: false, error: 'Recognition failed to start within timeout' });
          }
        }, 5000);
        
        recognition.onstart = () => {
          console.log('✅ Basic recognition test: Started');
          hasStarted = true;
          
          // Auto-stop after 2 seconds for testing
          setTimeout(() => {
            recognition.stop();
          }, 2000);
        };
        
        recognition.onresult = (event) => {
          console.log('✅ Basic recognition test: Got result');
          hasResult = true;
          clearTimeout(timeout);
          resolve({ success: true, transcript: event.results[0][0].transcript });
        };
        
        recognition.onerror = (event) => {
          console.error('❌ Basic recognition test: Error', event.error);
          clearTimeout(timeout);
          resolve({ success: false, error: event.error });
        };
        
        recognition.onend = () => {
          console.log('🏁 Basic recognition test: Ended');
          clearTimeout(timeout);
          if (!hasResult) {
            resolve({ success: false, error: 'No speech detected during test' });
          }
        };
        
        recognition.start();
        
      } catch (error) {
        console.error('❌ Basic recognition test: Exception', error);
        resolve({ success: false, error: error.message });
      }
    });
  },
  
  // Request microphone permissions explicitly
  async requestMicrophonePermission() {
    console.log('🎤 Requesting microphone permission...');
    
    try {
      // Try to get user media to trigger permission request
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Stop the stream immediately as we only needed permission
      stream.getTracks().forEach(track => track.stop());
      
      console.log('✅ Microphone permission granted');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Microphone permission denied:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Get mobile-specific recommendations
  getMobileRecommendations() {
    const userAgent = navigator.userAgent;
    const recommendations = [];
    
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
      recommendations.push('📱 iOS: Use Safari browser for best compatibility');
      recommendations.push('📱 iOS: Ensure "Listen for Hey Siri" is enabled in Settings > Siri & Search');
      recommendations.push('📱 iOS: Make sure microphone access is enabled for Safari');
    } else if (userAgent.includes('Android')) {
      recommendations.push('🤖 Android: Use Chrome browser for best compatibility');
      recommendations.push('🤖 Android: Enable microphone permissions for your browser');
      recommendations.push('🤖 Android: Ensure Google app has microphone access');
    }
    
    recommendations.push('🔒 Make sure you are on HTTPS (required for voice recognition)');
    recommendations.push('🎯 Tap the microphone button and speak clearly');
    recommendations.push('🔊 Ensure your device volume is up and microphone is not muted');
    recommendations.push('📵 Close other apps that might be using the microphone');
    
    return recommendations;
  },
  
  // Run comprehensive mobile voice test
  async runComprehensiveTest() {
    console.log('🚀 Running comprehensive mobile voice recognition test...');
    
    const prerequisites = await this.checkPrerequisites();
    const micPermission = await this.requestMicrophonePermission();
    const basicTest = await this.testBasicRecognition();
    const recommendations = this.getMobileRecommendations();
    
    const results = {
      prerequisites,
      micPermission,
      basicTest,
      recommendations,
      overall: prerequisites.https && prerequisites.speechRecognition && micPermission.success ? 'READY' : 'ISSUES_FOUND'
    };
    
    console.log('📊 Comprehensive test results:', results);
    
    // Log summary
    console.log('\n=== MOBILE VOICE RECOGNITION TEST SUMMARY ===');
    console.log(`Overall Status: ${results.overall}`);
    console.log(`HTTPS: ${prerequisites.https ? '✅' : '❌'}`);
    console.log(`Speech API: ${prerequisites.speechRecognition ? '✅' : '❌'}`);
    console.log(`Microphone: ${micPermission.success ? '✅' : '❌'}`);
    console.log(`Browser: ${prerequisites.browser.name} (${prerequisites.browser.supported ? 'Supported' : 'Not Supported'})`);
    
    if (results.overall === 'ISSUES_FOUND') {
      console.log('\n🔧 RECOMMENDATIONS:');
      recommendations.forEach(rec => console.log(rec));
    }
    
    return results;
  }
};

// Auto-run comprehensive test if on mobile and in development
if (typeof window !== 'undefined' && 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) &&
    process.env.NODE_ENV === 'development') {
  
  console.log('🚨 Mobile device detected in development mode - running voice recognition diagnostics...');
  
  // Run test after a delay to ensure page is loaded
  setTimeout(() => {
    MobileVoiceTroubleshooting.runComprehensiveTest();
  }, 3000);
}