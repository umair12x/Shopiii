import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StatusBar,
  StyleSheet,
  View,
  Text,
  Dimensions,
} from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  Circle,
  G,
  Polygon,
} from 'react-native-svg';
import { COLORS } from '../config/colors'; // Adjust path as needed

const { width, height } = Dimensions.get('window');
const SPLASH_VISIBLE_MS = 2800;

// ------------------------------------------------------------------
// 1. MINIMALIST CODE LOGO (Using COLORS from config)
// ------------------------------------------------------------------
const AnimatedSvg = Animated.createAnimatedComponent(Svg);

const CodeGeneratedLogo = ({ scaleAnim }) => {
  return (
    <AnimatedSvg
      width="160"
      height="160"
      viewBox="0 0 120 120"
      style={{ transform: [{ scale: scaleAnim }] }}
    >
      <Defs>
        {/* Refined metallic gradient using splash colors */}
        <LinearGradient id="metallic" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={COLORS.splashMetalLight} stopOpacity="0.95" />
          <Stop offset="0.5" stopColor={COLORS.splashMetalMid} stopOpacity="1" />
          <Stop offset="1" stopColor={COLORS.splashMetalDark} stopOpacity="1" />
        </LinearGradient>

        {/* Pure cyan gradient from splash colors */}
        <LinearGradient id="cyanGlow" x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor={COLORS.splashAccentSoft} stopOpacity="1" />
          <Stop offset="1" stopColor={COLORS.splashAccent} stopOpacity="1" />
        </LinearGradient>
      </Defs>

      {/* Minimalist ring - using splashRing color */}
      <Circle
        cx="60"
        cy="60"
        r="54"
        stroke={COLORS.splashRing}
        strokeWidth="0.8"
        fill="none"
      />

      {/* Cart - Simplified, cleaner paths */}
      <G>
        {/* Main cart body */}
        <Path
          d="M14,35 L30,35 L44,82 L96,82 L103,54"
          stroke="url(#metallic)"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Growth arrow - clean diagonal line */}
        <Path
          d="M32,62 L52,42 L70,56 L104,18"
          stroke="url(#metallic)"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Arrowhead */}
        <Polygon points="94,10 110,8 108,26" fill="url(#metallic)" />

        {/* Wheels - minimal */}
        <Circle cx="48" cy="98" r="7" fill="url(#metallic)" />
        <Circle cx="82" cy="98" r="7" fill="url(#metallic)" />
      </G>

      {/* Minimal data bars - pure cyan accents */}
      <G stroke="url(#cyanGlow)" strokeWidth="3.5" strokeLinecap="round">
        <Path d="M58,70 L58,60" />
        <Path d="M68,70 L68,50" />
        <Path d="M78,70 L78,57" />
      </G>

      {/* Single node connection - minimal */}
      <G fill={COLORS.splashAccent}>
        <Circle cx="54" cy="52" r="2" />
        <Circle cx="64" cy="44" r="2" />
        <Circle cx="74" cy="48" r="2" />
        <Path
          d="M54,52 L64,44 L74,48"
          stroke={COLORS.splashAccent}
          strokeWidth="1"
          fill="none"
          opacity="0.5"
        />
      </G>
    </AnimatedSvg>
  );
};

// ------------------------------------------------------------------
// 2. MINIMAL BACKGROUND (Single subtle glow)
// ------------------------------------------------------------------
const MinimalGlow = () => {
  const glowAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.6,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [glowAnim]);

  return (
    <Animated.View
      style={[
        styles.glowOrb,
        {
          backgroundColor: COLORS.splashAccent,
          opacity: glowAnim.interpolate({
            inputRange: [0.6, 1],
            outputRange: [0.08, 0.15],
          }),
          transform: [{ scale: glowAnim }],
        },
      ]}
    />
  );
};

// ------------------------------------------------------------------
// 3. MINIMALIST SPLASH (Using COLORS)
// ------------------------------------------------------------------
export const AppSplashScreen = ({ onFinish }) => {
  const containerOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoY = useRef(new Animated.Value(15)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textY = useRef(new Animated.Value(12)).current;
  const lineWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance - clean, elegant sequence
    const entrance = Animated.sequence([
      Animated.timing(containerOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 55,
          useNativeDriver: true,
        }),
        Animated.timing(logoY, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 700,
          delay: 200,
          useNativeDriver: true,
        }),
        Animated.timing(textY, {
          toValue: 0,
          duration: 600,
          delay: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(lineWidth, {
          toValue: 40,
          duration: 800,
          delay: 300,
          useNativeDriver: false,
        }),
      ]),
    ]);

    entrance.start();

    // Exit
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(containerOpacity, {
          toValue: 0,
          duration: 400,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 0.9,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished && onFinish) onFinish();
      });
    }, SPLASH_VISIBLE_MS);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.splashBackground} />

      {/* Minimal background - clean dark using splash colors */}
      <View style={[styles.bgDark, { backgroundColor: COLORS.splashBackgroundAlt }]} />

      {/* Single subtle glow */}
      <MinimalGlow />

      {/* Main content - centered naturally */}
      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ translateY: logoY }],
          },
        ]}
      >
        <View style={styles.logoWrapper}>
          <CodeGeneratedLogo scaleAnim={logoScale} />
        </View>

        <Animated.View
          style={[
            styles.textBlock,
            {
              opacity: textOpacity,
              transform: [{ translateY: textY }],
            },
          ]}
        >
          <Text style={[styles.title, { color: COLORS.splashText }]}>SHOPIII</Text>
          <Animated.View style={[styles.line, { width: lineWidth, backgroundColor: COLORS.splashAccent }]} />
          <Text style={[styles.subtitle, { color: COLORS.splashMuted }]}>
            Track daily entries. Grow with clarity.
          </Text>
        </Animated.View>
      </Animated.View>

      {/* Minimal footer - thin line, small text */}
      <Animated.View style={[styles.footer, { opacity: textOpacity }]}>
        <Text style={[styles.footerText, { color: COLORS.splashMuted }]}>READY</Text>
      </Animated.View>
    </Animated.View>
  );
};

// ------------------------------------------------------------------
// 4. MINIMALIST STYLES
// ------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgDark: {
    ...StyleSheet.absoluteFillObject,
  },
  glowOrb: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    alignSelf: 'center',
    top: height * 0.5 - width * 0.3,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  logoWrapper: {
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    alignItems: 'center',
  },
  title: {
    fontSize: 34,
    letterSpacing: 6,
    fontWeight: '300',
    marginBottom: 14,
    fontFamily: 'System',
  },
  line: {
    height: 1.5,
    marginBottom: 18,
    opacity: 0.6,
  },
  subtitle: {
    fontSize: 13,
    letterSpacing: 1.2,
    fontWeight: '400',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    letterSpacing: 2.5,
    fontWeight: '300',
  },
});