/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Sun, CloudRain, Snowflake, Wind, Zap, Heart, Clover, 
  Leaf, Trees, Cloud, HelpCircle, Calendar, MapPin, Eye, Info, X
} from 'lucide-react';

// Define available seasonal events & weather states
export type SeasonalEvent = 'default' | 'newyear' | 'valentines' | 'stpatricks' | 'earthday' | 'halloween' | 'thanksgiving' | 'christmas';
export type WeatherState = 'sunny' | 'rainy' | 'snowy' | 'windy' | 'thunderstorm' | 'rainbow' | 'clouds';

interface InteractiveLogoProps {
  onClick?: () => void;
}

export default function InteractiveLogo({ onClick }: InteractiveLogoProps) {
  // Determine date-based seasonal events automatically
  const getAutoEvent = (): SeasonalEvent => {
    const today = new Date();
    const month = today.getMonth(); // 0-indexed: Jan is 0, Dec is 11
    const date = today.getDate();

    if (month === 0 && date <= 7) return 'newyear';
    if (month === 1 && date >= 7 && date <= 16) return 'valentines';
    if (month === 2 && date >= 12 && date <= 20) return 'stpatricks';
    if (month === 3 && date >= 16 && date <= 25) return 'earthday';
    if (month === 9 && date >= 20 && date <= 31) return 'halloween';
    if (month === 10 && date >= 20 && date <= 30) return 'thanksgiving';
    if (month === 11) return 'christmas'; // All of December
    
    // Default fallback seasons
    if (month >= 11 || month <= 1) return 'christmas'; // Winter default
    if (month >= 2 && month <= 4) return 'earthday'; // Spring default
    return 'thanksgiving'; // Autumn default
  };

  // Determine weather based on calendar month
  const getAutoWeather = (): WeatherState => {
    const month = new Date().getMonth();
    if (month === 11 || month <= 1) return 'snowy'; // Dec, Jan, Feb -> Snowy
    if (month >= 2 && month <= 4) return 'rainbow'; // Mar, Apr, May -> Rainbow Spring rain
    if (month >= 5 && month <= 7) return 'sunny'; // Jun, Jul, Aug -> Sunny
    return 'windy'; // Autumn -> Windy
  };

  const currentEvent = getAutoEvent();
  const currentWeather = getAutoWeather();

  // State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Clean formatted date string
  const getFormattedDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Vibe Descriptions based on Active Events
  const getEventDescription = () => {
    switch (currentEvent) {
      case 'newyear':
        return "Happy New Year! 🎉 Celebrations are echoing across the globe. It is a fresh start for clean resolutions, bright connections, & exciting goals on Freebook!";
      case 'valentines':
        return "Happy Saint Valentine's Season! 💖 Freebook is celebrating love, friendship, & genuine connections. A lovely time of the year to send a warm note to your close friends.";
      case 'stpatricks':
        return "Season of Clovers! 🍀 May good luck and joyous moments follow your path today. Chat, discover, and search up your closest circles today!";
      case 'earthday':
        return "Happy Earth Day! 🌱 Spring has blossomed. Let's appreciate nature, plant beautiful habits, and nourish our global family tree.";
      case 'halloween':
        return "Spooky Halloween! 🎃 Autumn twilight is here. Keep a lookout for cute spiders, cozy pumpkins, and mystical shadows across the pages today.";
      case 'thanksgiving':
        return "Harvest Thanksgiving! 🦃 A heartwarming autumn season to count our blessings, appreciate the special connections we have in our lives, and enjoy sweet holiday vibes.";
      case 'christmas':
        return "Cozy Winter Holidays! 🎄 Twinkling Christmas lights and snow are filling the atmosphere. Cozy up with sweet cocoa, listen to carols, and check on family.";
      default:
        return "Today is a beautiful daily page! ✨ Every ordinary morning is a clean canvas to write something meaningful, reach out to old friends, and build forever bonds.";
    }
  };

  // Weather-specific notes
  const getWeatherDescription = () => {
    switch (currentWeather) {
      case 'sunny':
        return "Sunny & bright! ☀️ Summer sunshine is illuminating the virtual dashboard. Perfect weather to post active updates or share outdoor memories.";
      case 'rainy':
        return "Cozy gentle rainfall is pouring. 🌧️ An exquisite day to stay dry, sip hot coffee, and listen to relaxing beats while chatting on Freebook.";
      case 'snowy':
        return "Magical snowflakes are swirling! ❄️ Cozy winter weather covers everything in pristine silence. Stay nice & warm indoors.";
      case 'windy':
        return "A breezy, sweeping autumn wind! 🍂 Crispy colorful leaves are dancing across the screen with gentle micro-shakes.";
      case 'thunderstorm':
        return "Stormy rumbles! ⚡ High excitement levels and dramatic flashes of lightning in the twilight horizon. Stay safe on our secure lines.";
      case 'rainbow':
        return "Peaceful spring morning with a rainbow! 🌈 A lovely reminder of hope and fresh starts following last night's rainfall.";
      default:
        return "Calm clouds cover. ☁️ Peaceful, tranquil skies and pleasant daylight perfect for stress-free networking.";
    }
  };

  // Decorative logo badge and typography config
  const getLogoStyle = () => {
    switch (currentEvent) {
      case 'newyear':
        return {
          textClass: "bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-300 font-extrabold drop-shadow-[0_2px_8px_rgba(245,158,11,0.3)]",
          badge: "🎉",
          colorTheme: "text-amber-500",
          emoji: "✨",
          title: "New Year Celebration"
        };
      case 'valentines':
        return {
          textClass: "bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 font-extrabold drop-shadow-[0_2px_8px_rgba(244,63,94,0.3)]",
          badge: "💖",
          colorTheme: "text-rose-500",
          emoji: "🌹",
          title: "Valentine's Love"
        };
      case 'stpatricks':
        return {
          textClass: "bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 via-green-600 to-teal-500 font-extrabold drop-shadow-[0_2px_8px_rgba(16,185,129,0.3)]",
          badge: "🍀",
          colorTheme: "text-emerald-500",
          emoji: "🍀",
          title: "Luck of the Irish"
        };
      case 'earthday':
        return {
          textClass: "bg-clip-text text-transparent bg-gradient-to-r from-green-500 via-emerald-600 to-sky-500 font-extrabold drop-shadow-[0_2px_8px_rgba(16,185,129,0.2)]",
          badge: "🌱",
          colorTheme: "text-green-500",
          emoji: "🌍",
          title: "Earth & Spring Season"
        };
      case 'halloween':
        return {
          textClass: "bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-purple-600 to-amber-600 font-extrabold drop-shadow-[0_2px_8px_rgba(249,115,22,0.3)]",
          badge: "🎃",
          colorTheme: "text-orange-500",
          emoji: "🦇",
          title: "Spooky Autumn Halloween"
        };
      case 'thanksgiving':
        return {
          textClass: "bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 font-extrabold drop-shadow-[0_2px_8px_rgba(217,119,6,0.3)]",
          badge: "🦃",
          colorTheme: "text-orange-600",
          emoji: "🥧",
          title: "Harvest Thanksgiving"
        };
      case 'christmas':
        return {
          textClass: "bg-clip-text text-transparent bg-gradient-to-r from-red-600 via-emerald-600 to-red-500 font-extrabold drop-shadow-[0_2px_8px_rgba(220,38,38,0.2)]",
          badge: "🎄",
          colorTheme: "text-red-600",
          emoji: "❄️",
          title: "Winter Holidays Castle"
        };
      default:
        return {
          textClass: "text-blue-600 dark:text-blue-500 font-extrabold",
          badge: "✨",
          colorTheme: "text-blue-500",
          emoji: "💫",
          title: "Daily Spark Mode"
        };
    }
  };

  const logoStyle = getLogoStyle();

  // Handle Logo click: triggers feed scroll & opens/toggles the details popup
  const handleLogoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
    setClickCount(prev => prev + 1);
    
    // Call props to go to feed
    if (onClick) {
      onClick();
    }
  };

  // Render weather background atmospheric visual indicators
  const renderWeatherEffects = () => {
    if (!hovered && clickCount === 0) return null;

    switch (currentWeather) {
      case 'sunny':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
            animate={{ opacity: 0.7, scale: 1.1, rotate: 360 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            className="absolute -top-1.5 -left-2 text-amber-400 select-none pointer-events-none z-0"
          >
            <Sun className="w-5 h-5 fill-amber-400/20" />
          </motion.div>
        );
      case 'rainy':
        return (
          <div className="absolute inset-0 pointer-events-none select-none z-10 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ y: -8, x: i * 15, opacity: 0 }}
                animate={{ y: 24, opacity: [0, 1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.25, ease: 'linear' }}
                className="absolute w-0.5 h-2 bg-blue-400 rounded-full"
              />
            ))}
          </div>
        );
      case 'snowy':
        return (
          <div className="absolute inset-x-0 -top-2 h-10 pointer-events-none select-none z-10 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ y: -6, x: i * 18, opacity: 0, rotate: 0 }}
                animate={{ y: 30, opacity: [0, 1, 0], rotate: 360 }}
                transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.4, ease: 'easeInOut' }}
                className="absolute text-blue-300"
              >
                <Snowflake className="w-2 h-2" />
              </motion.div>
            ))}
          </div>
        );
      case 'windy':
        return (
          <motion.div
            initial={{ x: -15, opacity: 0 }}
            animate={{ x: 60, opacity: [0, 0.7, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1 }}
            className="absolute top-1 text-gray-300 dark:text-gray-600 pointer-events-none select-none z-10"
          >
            <Wind className="w-3 h-3" />
          </motion.div>
        );
      case 'thunderstorm':
        return (
          <motion.div
            animate={{ opacity: [0, 0.8, 0, 0.8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
            className="absolute -top-3 left-4 text-yellow-400 pointer-events-none select-none z-10"
          >
            <Zap className="w-3.5 h-3.5 fill-yellow-400/20" />
          </motion.div>
        );
      case 'rainbow':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.65, scale: 1.05 }}
            className="absolute -bottom-1 -right-1.5 w-7 h-4 border-t-2 border-r-2 rounded-tr-full border-gradient-to-r from-red-400 via-green-400 to-blue-400 pointer-events-none select-none z-0 opacity-40 blur-[0.5px]"
          />
        );
      default:
        return null;
    }
  };

  // Render floating magical particles (heart, sparkles, leaves) based on hover & click
  const renderParticles = () => {
    if (!hovered && clickCount === 0) return null;

    const particleIcons = {
      default: Sparkles,
      newyear: Sparkles,
      valentines: Heart,
      stpatricks: Clover,
      earthday: Leaf,
      halloween: HelpCircle,
      thanksgiving: Trees,
      christmas: Snowflake
    };

    const ParticleComp = particleIcons[currentEvent] || Sparkles;

    return (
      <div className="absolute inset-0 pointer-events-none select-none z-20">
        {[1, 2, 3].map((idx) => {
          const size = idx === 2 ? 'w-3 h-3' : 'w-2 h-2';
          const delay = idx * 0.35;
          const leftOffset = idx === 1 ? 'left-1' : idx === 2 ? 'left-1/2' : 'right-1';

          return (
            <motion.div
              key={idx}
              initial={{ y: 12, opacity: 0, scale: 0.5, rotate: 0 }}
              animate={{ y: -16, opacity: [0, 1, 0], scale: [0.5, 1.2, 0.6], rotate: 180 }}
              transition={{ duration: 1.5, repeat: Infinity, delay, ease: 'easeOut' }}
              className={`absolute top-0 ${leftOffset} ${logoStyle.colorTheme}`}
            >
              {currentEvent === 'halloween' ? (
                <span className="text-[10px] filter drop-shadow">👻</span>
              ) : currentEvent === 'thanksgiving' ? (
                <span className="text-[10px]">🍂</span>
              ) : currentEvent === 'valentines' ? (
                <Heart className={`${size} fill-current`} />
              ) : currentEvent === 'stpatricks' ? (
                <Clover className={`${size} fill-current`} />
              ) : currentEvent === 'earthday' ? (
                <Leaf className={`${size} fill-current`} />
              ) : (
                <ParticleComp className={size} />
              )}
            </motion.div>
          );
        })}
      </div>
    );
  };

  const weatherIconsMap = {
    sunny: Sun,
    rainy: CloudRain,
    snowy: Snowflake,
    windy: Wind,
    thunderstorm: Zap,
    rainbow: Sparkles,
    clouds: Cloud
  };
  const ActiveWeatherIcon = weatherIconsMap[currentWeather] || Sun;

  return (
    <div className="relative flex items-center gap-1" ref={containerRef}>
      {/* Interactive Main Logo Card */}
      <div 
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={handleLogoClick}
        className="relative px-2.5 py-1 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-850 border border-transparent hover:border-gray-100 dark:hover:border-gray-800 transition-all duration-300 overflow-visible select-none flex items-center gap-1 active:scale-97"
        id="interactive-brand-logo-freebook"
        title="Click to view today's atmosphere!"
      >
        {/* Dynamic Santa Hat overlay for Christmas */}
        {currentEvent === 'christmas' && (
          <motion.div
            initial={{ r: -20, y: -4, x: -6 }}
            animate={hovered ? { rotate: [-10, -5, -10], y: [-3, -5, -3] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute -top-3.5 -left-1 z-30 select-none pointer-events-none transform -rotate-12"
          >
            <svg width="22" height="18" viewBox="0 0 24 20" fill="none" className="filter drop-shadow-sm">
              <path d="M4 14C12 3 19 6 22 10C22 10 20 5 13 4C6 3 3 8 3 12Z" fill="#DC2626" />
              <path d="M2 12C2.5 12 18 12 19.5 12C20.5 12 21 13 21 14.5C21 16 19 16 18 16C15 16 6 16 3.5 16C1.5 16 1 15 1 14C1 13 1.5 12 2 12Z" fill="white" />
              <circle cx="21" cy="9.5" r="3.5" fill="white" />
            </svg>
          </motion.div>
        )}

        {/* Dynamic Spooky Spider web/hanging dangling for Halloween */}
        {currentEvent === 'halloween' && (
          <motion.div
            animate={hovered ? { y: [0, 8, 0], rotate: [-10, 10, -10] } : {}}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-7 left-3 z-30 select-none pointer-events-none"
          >
            <span className="text-[11px] block filter drop-shadow">🕷️</span>
          </motion.div>
        )}

        {/* Environmental atmospheric weather overlay */}
        {renderWeatherEffects()}
        
        {/* Particle sprinkles floating */}
        {renderParticles()}

        {/* The Text Logo containing custom shaders & styles */}
        <span className={`text-2.5xl tracking-tighter ${logoStyle.textClass} relative z-10 transition-all duration-300`}>
          freebook
        </span>

        {/* Animated Little Indicator Badge */}
        <motion.span 
          animate={hovered ? { scale: [1, 1.2, 1], rotate: [0, 15, -15, 0] } : {}}
          className="text-sm select-none z-10 relative pointer-events-none"
        >
          {logoStyle.badge}
        </motion.span>
      </div>

      {/* Popover Bubble showing simple details of the day - completely non-interactive for themes */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="absolute left-0 top-11 w-72 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl z-50 p-4 space-y-3.5 select-none"
          >
            {/* Header displaying Date */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-850">
              <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Atmosphere of the Day
              </span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(false);
                }}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-850 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Current Day Details */}
            <div className="space-y-3">
              {/* Day, Date & City/System representation */}
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">Current Date & Time</p>
                <p className="text-sm font-black text-gray-800 dark:text-gray-100 mt-0.5">{getFormattedDate()}</p>
              </div>

              {/* Event Badge Details */}
              <div className="flex items-start gap-2.5 bg-blue-50/40 dark:bg-blue-955/10 p-2.5 rounded-xl border border-blue-100/50 dark:border-blue-900/30">
                <span className="text-xl shrink-0">{logoStyle.emoji}</span>
                <div>
                  <h5 className="text-xs font-black text-blue-700 dark:text-blue-400">{logoStyle.title}</h5>
                  <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed mt-1">
                    {getEventDescription()}
                  </p>
                </div>
              </div>

              {/* Weather info details */}
              <div className="flex items-start gap-2.5 bg-gray-50 dark:bg-gray-900 p-2.5 rounded-xl border border-gray-200/50 dark:border-gray-800/600">
                <div className="p-1.5 bg-white dark:bg-gray-850 rounded-lg text-emerald-500 shrink-0">
                  <ActiveWeatherIcon className="w-4 h-4 text-emerald-500 fill-emerald-500/10" />
                </div>
                <div>
                  <h5 className="text-xs font-black text-gray-700 dark:text-gray-200">Weather Atmosphere</h5>
                  <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed mt-1">
                    {getWeatherDescription()}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-[9px] text-gray-400 dark:text-gray-500 font-mono text-center pt-2.5 border-t border-gray-100 dark:border-gray-850 leading-relaxed">
              Theme updates automatically! Enjoy everyday sparks on Freebook 💖✨
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
