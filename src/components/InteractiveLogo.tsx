/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Sun, CloudRain, Snowflake, Wind, Zap, Heart, Clover, 
  Leaf, Trees, Cloud, HelpCircle, ChevronDown, Check, Globe
} from 'lucide-react';

// Define the available events & weather states
export type SeasonalEvent = 'default' | 'newyear' | 'valentines' | 'stpatricks' | 'earthday' | 'pride' | 'halloween' | 'thanksgiving' | 'christmas';
export type WeatherState = 'sunny' | 'rainy' | 'snowy' | 'windy' | 'thunderstorm' | 'rainbow' | 'clouds';

interface InteractiveLogoProps {
  onClick?: () => void;
}

export default function InteractiveLogo({ onClick }: InteractiveLogoProps) {
  // Determine default date-based seasonal event
  const getAutoEvent = (): SeasonalEvent => {
    const today = new Date();
    const month = today.getMonth(); // 0-indexed: Jan is 0, Dec is 11
    const date = today.getDate();

    if (month === 0 && date <= 7) return 'newyear';
    if (month === 1 && date >= 7 && date <= 16) return 'valentines';
    if (month === 2 && date >= 12 && date <= 20) return 'stpatricks';
    if (month === 3 && date >= 16 && date <= 25) return 'earthday';
    if (month === 5) return 'pride'; // June Pride
    if (month === 9 && date >= 20 && date <= 31) return 'halloween';
    if (month === 10 && date >= 20 && date <= 30) return 'thanksgiving';
    if (month === 11) return 'christmas'; // All of December
    
    // Default season mapping
    if (month >= 11 || month <= 1) return 'christmas'; // Winter default
    if (month >= 2 && month <= 4) return 'earthday'; // Spring default
    if (month >= 5 && month <= 7) return 'pride'; // Summer default
    return 'thanksgiving'; // Autumn default
  };

  // State
  const [selectedEvent, setSelectedEvent] = useState<SeasonalEvent>('default');
  const [selectedWeather, setSelectedWeather] = useState<WeatherState>('sunny');
  const [isAuto, setIsAuto] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  
  // Custom click ripple count or trigger for sparks
  const [clickCount, setClickCount] = useState(0);

  const menuRef = useRef<HTMLDivElement>(null);

  // Auto detect event on mount
  useEffect(() => {
    if (isAuto) {
      const autoEv = getAutoEvent();
      setSelectedEvent(autoEv);
      
      // Select weather appropriately mapping to season/month
      const month = new Date().getMonth();
      if (month === 11 || month <= 1) setSelectedWeather('snowy');
      else if (month >= 2 && month <= 4) setSelectedWeather('rainbow');
      else if (month >= 5 && month <= 7) setSelectedWeather('sunny');
      else setSelectedWeather('windy');
    }
  }, [isAuto]);

  // Click outside listener for the popover menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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

  // Get visual state overrides based on selections
  const currentEvent = isAuto ? getAutoEvent() : selectedEvent;
  const currentWeather = selectedWeather;

  // Visual Theme Config for the text logo "freebook"
  const getLogoStyle = () => {
    switch (currentEvent) {
      case 'newyear':
        return {
          textClass: "bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-300 font-extrabold drop-shadow-[0_2px_8px_rgba(245,158,11,0.3)]",
          badge: "🎉",
          colorTheme: "text-amber-500"
        };
      case 'valentines':
        return {
          textClass: "bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 font-extrabold drop-shadow-[0_2px_8px_rgba(244,63,94,0.3)]",
          badge: "💖",
          colorTheme: "text-rose-500"
        };
      case 'stpatricks':
        return {
          textClass: "bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 via-green-600 to-teal-500 font-extrabold drop-shadow-[0_2px_8px_rgba(16,185,129,0.3)]",
          badge: "🍀",
          colorTheme: "text-emerald-500"
        };
      case 'earthday':
        return {
          textClass: "bg-clip-text text-transparent bg-gradient-to-r from-green-500 via-emerald-600 to-sky-500 font-extrabold drop-shadow-[0_2px_8px_rgba(16,185,129,0.2)]",
          badge: "🌱",
          colorTheme: "text-green-500"
        };
      case 'pride':
        return {
          textClass: "bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-yellow-400 via-green-500 via-blue-500 to-purple-600 font-black animate-[gradient-shift_6s_ease_infinite] bg-[length:200%_auto] drop-shadow-[0_2px_6px_rgba(59,130,246,0.2)]",
          badge: "🌈",
          colorTheme: "text-purple-500"
        };
      case 'halloween':
        return {
          textClass: "bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-purple-600 to-amber-600 font-extrabold drop-shadow-[0_2px_8px_rgba(249,115,22,0.3)]",
          badge: "🎃",
          colorTheme: "text-orange-500"
        };
      case 'thanksgiving':
        return {
          textClass: "bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 font-extrabold drop-shadow-[0_2px_8px_rgba(217,119,6,0.3)]",
          badge: "🦃",
          colorTheme: "text-orange-600"
        };
      case 'christmas':
        return {
          textClass: "bg-clip-text text-transparent bg-gradient-to-r from-red-600 via-emerald-600 to-red-500 font-extrabold drop-shadow-[0_2px_8px_rgba(220,38,38,0.2)]",
          badge: "🎄",
          colorTheme: "text-red-600"
        };
      default:
        return {
          textClass: "text-blue-600 dark:text-blue-500 font-extrabold",
          badge: "✨",
          colorTheme: "text-blue-500"
        };
    }
  };

  const logoStyle = getLogoStyle();

  // Handle Logo click for fun animations or default actions
  const handleLogoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setClickCount(prev => prev + 1);
    
    // Call props click if any
    if (onClick) {
      onClick();
    }
  };

  // Render weather background atmospheric assets around the logo
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
      pride: Sparkles, // Uses Sparkles with rainbow scale
      halloween: HelpCircle, // Will represent spooky ghosts
      thanksgiving: Trees, // Pine cones/trees
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
                // Custom ghostly face
                <span className="text-[10px] filter drop-shadow">👻</span>
              ) : currentEvent === 'thanksgiving' ? (
                // Maple leaf or acorn emoji
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

  return (
    <div className="relative flex items-center gap-1.5" ref={menuRef}>
      {/* Interactive Main Logo Card */}
      <div 
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={handleLogoClick}
        className="relative px-2.5 py-1 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-850 border border-transparent hover:border-gray-100 dark:hover:border-gray-800 transition-all duration-300 overflow-visible select-none flex items-center gap-1"
        id="interactive-brand-logo-freebook"
      >
        {/* Dynamic Santa Hat overlay for Christmas */}
        {currentEvent === 'christmas' && (
          <motion.div
            initial={{ r: -20, y: -4, x: -6 }}
            animate={hovered ? { rotate: [-10, -5, -10], y: [-3, -5, -3] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute -top-3.5 -left-1 z-30 select-none pointer-events-none transform -rotate-12"
          >
            {/* Elegant SVG Santa Hat */}
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

      {/* Elegant Toggle Switch Widget next to logo to manage the year/weather simulation */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className={`p-1 rounded-lg border text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer transition ${
          isMenuOpen 
            ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-900/40 text-blue-500' 
            : 'bg-transparent border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
        title="Simulate Seasonal Events & Weather mood!"
        id="weather-mood-picker-trigger"
      >
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Simulator Dashboard */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="absolute left-0 top-11 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl z-50 p-4 space-y-3.5 select-none"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-1.5 border-b border-gray-100 dark:border-gray-800">
              <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                Theme Atmosphere
              </span>
              <button
                onClick={() => setIsAuto(!isAuto)}
                className={`px-1.5 py-0.5 rounded text-[8px] font-black tracking-wide uppercase transition ${
                  isAuto 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200'
                }`}
                title="Automatically schedule events based on the calendar day!"
              >
                {isAuto ? 'Auto Sched' : 'Manual'}
              </button>
            </div>

            {/* Weather Selection */}
            <div className="space-y-1.5">
              <span className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Everyday Weather Simulation
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {(['sunny', 'rainy', 'snowy', 'windy', 'thunderstorm', 'rainbow', 'clouds'] as WeatherState[]).map((w) => {
                  const isActive = currentWeather === w;
                  const iconsMap = {
                    sunny: Sun,
                    rainy: CloudRain,
                    snowy: Snowflake,
                    windy: Wind,
                    thunderstorm: Zap,
                    rainbow: Sparkles,
                    clouds: Cloud
                  };
                  const Icon = iconsMap[w] || Sun;

                  return (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setSelectedWeather(w)}
                      className={`py-1.5 flex flex-col items-center justify-center gap-1 rounded-xl border transition cursor-pointer ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400'
                          : 'bg-gray-50/50 dark:bg-gray-850/40 border-transparent text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                      title={w}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="text-[7.5px] font-bold capitalize truncate max-w-full px-0.5">{w}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Seasonal Events selection (only visible/interactable if manual overdrive is on) */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  Seasonal Events of the Year
                </span>
                {isAuto && (
                  <span className="text-[8px] text-emerald-500 font-mono italic">Controlled by calendar</span>
                )}
              </div>
              
              <div className="max-h-[140px] overflow-y-auto space-y-1 divide-y divide-gray-50 dark:divide-gray-850 pr-1 select-none">
                {[
                  { value: 'newyear', label: 'New Year Party', emoji: '🎉' },
                  { value: 'valentines', label: "Valentine's Love", emoji: '💖' },
                  { value: 'stpatricks', label: "St. Patrick's Clover", emoji: '🍀' },
                  { value: 'earthday', label: 'Earth Day / Spring 🌱', emoji: '🌱' },
                  { value: 'pride', label: 'Summer Pride / Rainbow', emoji: '🌈' },
                  { value: 'halloween', label: 'Spooky Halloween 🎃', emoji: '🎃' },
                  { value: 'thanksgiving', label: 'Harvest Thanksgiving', emoji: '🦃' },
                  { value: 'christmas', label: 'Winter Holidays / Christmas', emoji: '🎄' }
                ].map((item) => {
                  const isActive = currentEvent === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      disabled={isAuto}
                      onClick={() => {
                        setSelectedEvent(item.value as SeasonalEvent);
                      }}
                      className={`w-full flex items-center justify-between text-left py-1.5 px-2 rounded-lg text-xs leading-none transition cursor-pointer ${
                        isAuto ? 'opacity-65 cursor-not-allowed' : ''
                      } ${
                        isActive
                          ? 'bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-extrabold'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-850'
                      }`}
                    >
                      <span className="flex items-center gap-2 font-medium">
                        <span className="text-sm">{item.emoji}</span>
                        <span>{item.label}</span>
                      </span>
                      {isActive && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom note */}
            <div className="text-[9px] text-gray-400 dark:text-gray-500 font-mono text-center pt-2 border-t border-gray-100 dark:border-gray-800 leading-relaxed">
              Hover/Click the logo to spark falling holiday particles & weather dynamics! 🍂❄️✨
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
