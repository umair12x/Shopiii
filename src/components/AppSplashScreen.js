import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StatusBar, StyleSheet, Text, View, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, THEME } from '../config/colors';

const { width, height } = Dimensions.get('window');
const SPLASH_VISIBLE_MS = 1500;

const FloatingParticle = ({ index, color, size, initialOpacity }) => {
  const yAnimation = useRef(new Animated.Value(0)).current;
  const opacityAnimation = useRef(new Animated.Value(initialOpacity)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const createFloatingAnimation = () => {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(yAnimation, {
              toValue: -20 - Math.random() * 30,
              duration: 2000 + Math.random() * 2000,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(yAnimation, {
              toValue: 0,
              duration: 2000 + Math.random() * 2000,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(opacityAnimation, {
              toValue: initialOpacity * 0.3,
              duration: 1500 + Math.random() * 1500,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnimation, {
              toValue: initialOpacity,
              duration: 1500 + Math.random() * 1500,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
          Animated.loop(
            Animated.sequence([
              Animated.timing(scaleAnimation, {
                toValue: 1.2,
                duration: 2500 + Math.random() * 1500,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
              Animated.timing(scaleAnimation, {
                toValue: 1,
                duration: 2500 + Math.random() * 1500,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
            ])
          ),
        ])
      ).start();
    };

    createFloatingAnimation();
  }, []);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity: opacityAnimation,
          transform: [{ translateY: yAnimation }, { scale: scaleAnimation }],
        },
      ]}
    />
  );
};

const ShimmerRing = ({ size, delay }) => {
  const rotateAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(0.8)).current;
  const opacityAnimation = useRef(new Animated.Value(0.15)).current;

  useEffect(() => {
    const shimmerEffect = Animated.loop(
      Animated.parallel([
        Animated.timing(rotateAnimation, {
          toValue: 1,
          duration: 8000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(opacityAnimation, {
            toValue: 0.05,
            duration: 2000 + delay,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnimation, {
            toValue: 0.15,
            duration: 2000 + delay,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    shimmerEffect.start();
  }, []);

  const rotate = rotateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.shimmerRing,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          opacity: opacityAnimation,
          transform: [{ rotate }, { scale: scaleAnimation }],
        },
      ]}
    >
      <View style={[styles.shimmerArc, { borderColor: COLORS.accent }]} />
    </Animated.View>
  );
};

export const AppSplashScreen = ({ onFinish }) => {
  const containerOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(18)).current;
  const contentScale = useRef(new Animated.Value(0.95)).current;
  const iconScale = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const blurOpacity = useRef(new Animated.Value(0)).current;

  // Particle configuration
  const particles = [
    { x: 60, y: 120, size: 6, color: 'rgba(196,154,108,0.4)', opacity: 0.6 },
    { x: width - 80, y: 200, size: 4, color: 'rgba(255,255,255,0.3)', opacity: 0.5 },
    { x: 100, y: height - 200, size: 8, color: 'rgba(196,154,108,0.3)', opacity: 0.7 },
    { x: width - 100, y: 300, size: 5, color: 'rgba(255,255,255,0.4)', opacity: 0.6 },
    { x: width * 0.3, y: 80, size: 7, color: 'rgba(196,154,108,0.35)', opacity: 0.5 },
    { x: width * 0.7, y: height - 150, size: 5, color: 'rgba(255,255,255,0.35)', opacity: 0.55 },
  ];

  useEffect(() => {
    // Staggered entrance animation
    const enterAnimation = Animated.parallel([
      Animated.timing(containerOpacity, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslateY, {
        toValue: 0,
        duration: 550,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(contentScale, {
        toValue: 1,
        duration: 550,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(200),
        Animated.spring(iconScale, {
          toValue: 1,
          friction: 3,
          tension: 100,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(400),
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(600),
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]);

    enterAnimation.start();

    // Exit animation
    const hideTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(containerOpacity, {
          toValue: 0,
          duration: 350,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(contentScale, {
          toValue: 0.95,
          duration: 350,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished && onFinish) {
          onFinish();
        }
      });
    }, SPLASH_VISIBLE_MS);

    return () => {
      clearTimeout(hideTimer);
    };
  }, [containerOpacity, contentScale, contentTranslateY, iconScale, titleOpacity, subtitleOpacity, onFinish]);

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Gradient backdrops */}
      <View style={styles.backdropTop} />
      <View style={styles.backdropMiddle} />
      <View style={styles.backdropBottom} />
      
      {/* Floating particles */}
      {particles.map((particle, index) => (
        <View
          key={index}
          style={[
            styles.particleContainer,
            {
              left: particle.x,
              top: particle.y,
            },
          ]}
        >
          <FloatingParticle
            index={index}
            color={particle.color}
            size={particle.size}
            initialOpacity={particle.opacity}
          />
        </View>
      ))}
      
      {/* Shimmer rings */}
      <ShimmerRing size={250} delay={0} />
      <ShimmerRing size={350} delay={500} />
      
      {/* Center content */}
      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ translateY: contentTranslateY }, { scale: contentScale }],
          },
        ]}
      >
        {/* Icon with glow effect */}
        <Animated.View style={[styles.iconOuterGlow, { transform: [{ scale: iconScale }] }]}>
          <View style={styles.iconInnerGlow}>
            <View style={styles.logoWrap}>
              <MaterialCommunityIcons 
                name="storefront-outline" 
                size={48} 
                color={COLORS.accent}
                style={styles.iconShadow}
              />
            </View>
          </View>
        </Animated.View>
        
        {/* Title with letter spacing and shadow */}
        <Animated.View style={{ opacity: titleOpacity }}>
          <Text style={styles.title}>Shopiii</Text>
          <View style={styles.titleUnderline} />
        </Animated.View>
        
        {/* Subtitle */}
        <Animated.View style={{ opacity: subtitleOpacity }}>
          <Text style={styles.subtitle}>Track daily entries. Grow with clarity.</Text>
        </Animated.View>
      </Animated.View>
      
      {/* Bottom decorative line */}
      <View style={styles.bottomLine} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  backdropTop: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    top: -100,
    right: -100,
    backgroundColor: 'rgba(196,154,108,0.12)',
    transform: [{ scale: 1.2 }],
  },
  backdropMiddle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: '35%',
    left: -80,
    backgroundColor: 'rgba(196,154,108,0.08)',
    transform: [{ scale: 1.5 }],
  },
  backdropBottom: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    bottom: -70,
    left: -60,
    backgroundColor: 'rgba(255,255,255,0.04)',
    transform: [{ scale: 1.3 }],
  },
  particleContainer: {
    position: 'absolute',
  },
  particle: {
    position: 'absolute',
  },
  shimmerRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(196,154,108,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shimmerArc: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(196,154,108,0.15)',
    borderTopColor: 'rgba(196,154,108,0.4)',
    borderRightColor: 'rgba(196,154,108,0.3)',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.lg,
    zIndex: 10,
  },
  iconOuterGlow: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(196,154,108,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.xl,
  },
  iconInnerGlow: {
    width: 106,
    height: 106,
    borderRadius: 53,
    backgroundColor: 'rgba(196,154,108,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
  },
  logoWrap: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(196,154,108,0.3)',
  },
  iconShadow: {
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  title: {
    color: COLORS.white,
    fontSize: THEME.fonts.xxl + 8,
    letterSpacing: 2,
    fontWeight: '800',
    textShadowColor: 'rgba(196,154,108,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  titleUnderline: {
    width: 40,
    height: 2,
    backgroundColor: COLORS.accent,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: THEME.spacing.md,
    borderRadius: 1,
    opacity: 0.7,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.75)',
    marginTop: THEME.spacing.xs,
    fontSize: THEME.fonts.md,
    textAlign: 'center',
    letterSpacing: 0.5,
    lineHeight: 22,
    fontWeight: '400',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bottomLine: {
    position: 'absolute',
    bottom: 60,
    width: 60,
    height: 3,
    backgroundColor: 'rgba(196,154,108,0.4)',
    borderRadius: 1.5,
    opacity: 0.6,
  },
});