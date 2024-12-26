/* eslint-disable @typescript-eslint/no-duplicate-enum-values */
import { LRUCache } from 'lru-cache';

import { CustomLogger } from './logger.js';

enum LogColor {
  Default = '\x1b[0m',
  Bold = '\x1b[1m',
  Italic = '\x1b[3m',
  Underline = '\x1b[4m',
  Blink = '\x1b[5m',
  Reverse = '\x1b[7m',
  Hidden = '\x1b[8m',
  Red = '\x1b[31m',
  Green = '\x1b[32m',
  Yellow = '\x1b[33m',
  Blue = '\x1b[34m',
  Magenta = '\x1b[35m',
  Cyan = '\x1b[36m',
  White = '\x1b[37m',

  // Bright Colors
  BrR = '\x1b[91m',
  BrG = '\x1b[92m',
  BrY = '\x1b[93m',
  BrB = '\x1b[94m',
  BrM = '\x1b[95m',
  BrC = '\x1b[96m',
  BrW = '\x1b[97m',

  // Extended Colors
  SpB = '\x1b[38;5;39m', // Special Blue
  FrW = '\x1b[38;5;255m', // Frost White
  MiP = '\x1b[38;5;93m', // Midnight Purple
  AuG = '\x1b[38;5;46m', // Autumn Green
  IcC = '\x1b[38;5;51m', // Ice Cyan
  TwM = '\x1b[38;5;125m', // Twilight Magenta
  WiG = '\x1b[38;5;240m', // Winter Gray
  NeP = '\x1b[38;5;200m', // Neon Pink

  // New Custom Colors
  LavaRed = '\x1b[38;5;196m',
  SkyBlue = '\x1b[38;5;117m',
  ForestGreen = '\x1b[38;5;22m',
  SunsetOrange = '\x1b[38;5;202m',
  OceanBlue = '\x1b[38;5;75m',
  Violet = '\x1b[38;5;177m',
  Peach = '\x1b[38;5;216m',
  Mint = '\x1b[38;5;121m',
  Gold = '\x1b[38;5;220m',
  Silver = '\x1b[38;5;247m',

  // Extra Styles
  StrikeThrough = '\x1b[9m',
  Overline = '\x1b[53m',
  DoubleUnderline = '\x1b[21m',
}

const colorMapping: Record<string, LogColor> = {
  // Basic Mappings
  err: LogColor.Red,
  error: LogColor.Red,
  info: LogColor.Green,
  warn: LogColor.Yellow,
  debug: LogColor.Blue,
  success: LogColor.Cyan,
  critical: LogColor.BrR,

  // New Keywords
  lava: LogColor.LavaRed,
  sky: LogColor.SkyBlue,
  forest: LogColor.ForestGreen,
  sunset: LogColor.SunsetOrange,
  ocean: LogColor.OceanBlue,
  violet: LogColor.Violet,
  peach: LogColor.Peach,
  mint: LogColor.Mint,
  gold: LogColor.Gold,
  silver: LogColor.Silver,

  // Numbers 1-100 as examples
  '1': LogColor.Red,
  '2': LogColor.Green,
  '3': LogColor.Yellow,
  '4': LogColor.Blue,
  '5': LogColor.Magenta,
  '6': LogColor.Cyan,
  '7': LogColor.White,
  '8': LogColor.BrR,
  '9': LogColor.BrG,
  '10': LogColor.BrY,
  '11': LogColor.BrB,
  '12': LogColor.BrM,
  '13': LogColor.BrC,
  '14': LogColor.BrW,
  '15': LogColor.SpB,
  '16': LogColor.FrW,
  '17': LogColor.MiP,
  '18': LogColor.AuG,
  '19': LogColor.IcC,
  '20': LogColor.TwM,
  '21': LogColor.WiG,
  '22': LogColor.NeP,
  '23': LogColor.LavaRed,
  '24': LogColor.SkyBlue,
  '25': LogColor.ForestGreen,
  '26': LogColor.SunsetOrange,
  '27': LogColor.OceanBlue,
  '28': LogColor.Violet,
  '29': LogColor.Peach,
  '30': LogColor.Mint,
  '31': LogColor.Gold,
  '32': LogColor.Silver,

  // Styles
  bold: LogColor.Bold,
  italic: LogColor.Italic,
  underline: LogColor.Underline,
  blink: LogColor.Blink,
  reverse: LogColor.Reverse,
  hidden: LogColor.Hidden,
  strikethrough: LogColor.StrikeThrough,
  overline: LogColor.Overline,
  doubleunderline: LogColor.DoubleUnderline,
};

const colorizeWord = (word: string): string => {
  const lowerCaseWord = word.toLowerCase();
  for (const [key, color] of Object.entries(colorMapping)) {
    if (lowerCaseWord.includes(key)) {
      return `${color}${word}${LogColor.Default}`;
    }
  }
  return word;
};

const colorizeMessage = (message: string): string => {
  const regex = /~{(.*?)}`(.*?)`/g;

  const colorizedMessage = message.split(' ').map(colorizeWord).join(' ');

  return colorizedMessage.replace(regex, (_match, colorName, text) => {
    const color = LogColor[colorName as keyof typeof LogColor];
    const styledText = color ? `${color}${text}${LogColor.Default}` : text;
    return styledText;
  });
};

// 'This is a ~{Italic}`Italic text`, and this is a ~{Green}`green text`, and this is a normal message. [info] __ ~{sp}`Salam`';

const originalConsoleLog = console.log;

const options = {
  max: 250,
};

const cache = new LRUCache<string, string>(options);

export const initLog = (debug: boolean, logger: CustomLogger): void => {
  console.log = (...args: any[]): void => {
    if (!debug) {
      return;
    }

    const coloredArgs = args.map((arg) => {
      if (typeof arg === 'string') {
        const cachedMessage = cache.get(arg);
        if (cachedMessage) {
          return cachedMessage;
        }

        // level of Logger class
        const isErrorMessage = /(\berr\b|\berror\b)/i.test(arg);
        const isWarningMessage = /\bwarn\b/i.test(arg);
        const isInfoMessage = /\binfo\b/i.test(arg);
        const isDebugMessage = /\bdebug\b/i.test(arg);
        const isCoreMessage = /\bcore\b/i.test(arg);

        if (isErrorMessage) {
          logger.error(arg);
        } else if (isWarningMessage) {
          logger.warn(arg);
        } else if (isInfoMessage) {
          logger.info(arg);
        } else if (isDebugMessage) {
          logger.debug(arg);
        } else if (isCoreMessage) {
          logger.core(arg);
        } else {
          logger.info(arg);
        }

        const processed = colorizeMessage(arg);
        cache.set(arg, processed);
        return processed;
      }
      return arg;
    });

    originalConsoleLog.apply(console, coloredArgs);
  };
};
