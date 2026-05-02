import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StatusBar, StyleSheet, View, Text, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, G, Polygon } from 'react-native-svg';

const { width, height } = Dimensions.get('window');
const SPLASH_VISIBLE_MS = 2800; // Slightly longer to appreciate the visual setup

// ------------------------------------------------------------------
// 1. PURE CODE LOGO (Recreating the metallic cart + arrow)
// ------------------------------------------------------------------
const AnimatedSvg = Animated.createAnimatedComponent(Svg);

const CodeGeneratedLogo = ({ scaleAnim }) => {
  return (
    <AnimatedSvg
      width="180"
      height="180"
      viewBox="0 0 120 120"
      style={{ transform: [{ scale: scaleAnim }] }}
    >
      <Defs>
        {/* Metallic Silver Gradient for the Cart and Arrow */}
        <LinearGradient id="metallic" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="1" />
          <Stop offset="0.3" stopColor="#A0AABF" stopOpacity="1" />
          <Stop offset="0.7" stopColor="#E0E5EC" stopOpacity="1" />
          <Stop offset="1" stopColor="#78839C" stopOpacity="1" />
        </LinearGradient>
        
        {/* Cyan Glow for the inner data elements */}
        <LinearGradient id="cyanGlow" x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor="#005A70" stopOpacity="1" />
          <Stop offset="1" stopColor="#00E5FF" stopOpacity="1" />
        </LinearGradient>
      </Defs>

      {/* Main Cart Body & Growth Trend Line */}
      <G stroke="url(#metallic)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* Back handle and main diagonal cart frame */}
        <Path d="M15,35 L30,35 L45,85 L95,85 L102,55" />
        {/* Growth Arrow line overlapping the cart */}
        <Path d="M35,60 L55,40 L70,55 L100,20" />
      </G>

      {/* Arrowhead at the top right */}
      <Polygon points="90,15 108,12 105,30" fill="url(#metallic)" />

      {/* Cart Wheels */}
      <Circle cx="55" cy="100" r="6" fill="url(#metallic)" />
      <Circle cx="85" cy="100" r="6" fill="url(#metallic)" />

      {/* Inner Glowing Cyan Data Bars */}
      <G stroke="url(#cyanGlow)" strokeWidth="5" strokeLinecap="round">
        <Path d="M58,72 L58,62" />
        <Path d="M68,72 L68,52" />
        <Path d="M78,72 L78,60" />
      </G>

      {/* Connected Data Nodes (Hexagon abstraction) */}
      <G fill="#00E5FF">
        <Circle cx="55" cy="52" r="2.5" />
        <Circle cx="65" cy="46" r="2.5" />
        <Circle cx="75" cy="50" r="2.5" />
        {/* Connecting lines between nodes */}
        <Path d="M55,52 L65,46 L75,50" stroke="#00E5FF" strokeWidth="1" fill="none" />
      </G>
    </AnimatedSvg>
  );
};

// ------------------------------------------------------------------
// 2. AMBIENT BACKGROUND GLOW
// ------------------------------------------------------------------
const PulseGlow = ({ size, color, delay }) => {
  const pulseAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 2000,
            delay: delay,
            easing: Easing.out(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.15,
            duration: 2000,
            delay: delay,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 0.8,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, [delay, opacityAnim, pulseAnim]);

  return (
    <Animated.View
      style={[
        styles.absoluteCenter,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity: opacityAnim,
          transform: [{ scale: pulseAnim }],
        },
      ]}
    />
  );
};

// ------------------------------------------------------------------
// 3. MAIN SPLASH COMPONENT
// ------------------------------------------------------------------
export const AppSplashScreen = ({ onFinish }) => {
  const containerOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const contentTranslateY = useRef(new Animated.Value(30)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Entrance Animation Sequence
    Animated.sequence([
      Animated.timing(containerOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 5,
          tension: 45,
          useNativeDriver: true,
        }),
        Animated.timing(contentTranslateY, {
          toValue: 0,
          duration: 700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 800,
          delay: 300, // Wait for logo to pop before showing text
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // 2. Exit Animation
    const hideTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(containerOpacity, {
          toValue: 0,
          duration: 400,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1.1, // Slight push forward on exit
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished && onFinish) onFinish();
      });
    }, SPLASH_VISIBLE_MS);

    return () => clearTimeout(hideTimer);
  }, [containerOpacity, logoScale, contentTranslateY, textOpacity, onFinish]);

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0F1724" />

      {/* Abstract Background Elements matching the dark theme */}
      <View style={styles.darkGradientOverlay} />
      
      {/* Cyan & Metallic Ambient Glows representing the tech/commerce vibe */}
      <PulseGlow size={width * 0.8} color="#00E5FF" delay={0} />
      <PulseGlow size={width * 1.1} color="#A0AABF" delay={1000} />

      {/* Main Content Wrap */}
      <Animated.View style={[styles.contentWrap, { transform: [{ translateY: contentTranslateY }] }]}>
        
        {/* 100% Code-Generated Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoShadow}>
            <CodeGeneratedLogo scaleAnim={logoScale} />
          </View>
        </View>

        {/* Brand Typography */}
        <Animated.View style={[styles.textWrap, { opacity: textOpacity }]}>
          <Text style={styles.title}>Shopiii</Text>
          <View style={styles.titleUnderline} />
          <Text style={styles.subtitle}>Track daily entries. Grow with clarity.</Text>
        </Animated.View>

      </Animated.View>

      {/* Professional Footer Indicator */}
      <Animated.View style={[styles.footerWrap, { opacity: textOpacity }]}>
        <Text style={styles.footerText}>SYSTEM INITIALIZING</Text>
        <View style={styles.footerLine} />
      </Animated.View>
    </Animated.View>
  );
};

// ------------------------------------------------------------------
// 4. STYLES
// ------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1724', // Your exact requested dark primary background
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  darkGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)', // Adds subtle depth
  },
  absoluteCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  logoContainer: {
    marginBottom: 40,
  },
  logoShadow: {
    shadowColor: '#00E5FF', // Cyan glowing shadow matching the inner logo
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 15,
  },
  textWrap: {
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 42,
    letterSpacing: 3,
    fontWeight: '900',
    marginBottom: 10,
    textShadowColor: 'rgba(255,255,255,0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  titleUnderline: {
    width: 30,
    height: 3,
    backgroundColor: '#00E5FF', // Match the cyan from the logo chart
    borderRadius: 2,
    marginBottom: 15,
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  subtitle: {
    color: '#8C9BB3', // Muted metallic blue-grey
    fontSize: 15,
    letterSpacing: 1.2,
    fontWeight: '500',
    textAlign: 'center',
  },
  footerWrap: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
  },
  footerText: {
    color: '#4B5A73',
    fontSize: 10,
    letterSpacing: 2.5,
    fontWeight: '700',
    marginBottom: 8,
  },
  footerLine: {
    width: 100,
    height: 1,
    backgroundColor: 'rgba(160, 170, 191, 0.2)',
  },
});