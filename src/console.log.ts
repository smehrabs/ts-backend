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
  BrightRed = '\x1b[91m',
  BrightGreen = '\x1b[92m',
  BrightYellow = '\x1b[93m',
  BrightBlue = '\x1b[94m',
  BrightMagenta = '\x1b[95m',
  BrightCyan = '\x1b[96m',
  BrightWhite = '\x1b[97m',
  LightOrange = '\x1b[38;5;214m',
  // اضافه کردن رنگ‌های بیشتر
  DarkRed = '\x1b[38;5;124m',
  DarkGreen = '\x1b[38;5;22m',
  DarkYellow = '\x1b[38;5;130m',
  DarkBlue = '\x1b[38;5;24m',
  DarkMagenta = '\x1b[38;5;125m',
  DarkCyan = '\x1b[38;5;36m',
}

const colorMapping: Record<string, LogColor> = {
  err: LogColor.Red,
  error: LogColor.Red,
  info: LogColor.Green,
  warn: LogColor.Yellow,
  debug: LogColor.Blue,
  success: LogColor.Cyan,
  critical: LogColor.BrightRed,
  app: LogColor.Green,
  start: LogColor.BrightGreen,
  // اضافه کردن نگاشت برای رنگ‌ها با عدد
  '1': LogColor.Red,
  '2': LogColor.Green,
  '3': LogColor.Yellow,
  '4': LogColor.Blue,
  '5': LogColor.Magenta,
  '6': LogColor.Cyan,
  '7': LogColor.White,
  '8': LogColor.BrightRed,
  '9': LogColor.BrightGreen,
  '10': LogColor.BrightYellow,
  '11': LogColor.BrightBlue,
  '12': LogColor.BrightMagenta,
  '13': LogColor.BrightCyan,
  '14': LogColor.BrightWhite,
  // اضافه کردن استایل‌ها
  bold: LogColor.Bold,
  italic: LogColor.Italic,
  underline: LogColor.Underline,
  blink: LogColor.Blink,
  reverse: LogColor.Reverse,
  hidden: LogColor.Hidden,
};

// const colorizeTag = (tag: string): string => {
//   const normalizedTag = tag.replace(/[^a-zA-Z]/g, '').toLowerCase();
//   const color = colorMapping[normalizedTag];
//   return color ? `${color}[${tag}]${LogColor.Default}` : `[${tag}]`;
// };

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

// مثال استفاده
const message =
  'This is a ~{Italic}`Italic text`, and this is a ~{Green}`green text`, and this is a normal message. [info] __ ~{1}`Fucker`';
console.log(colorizeMessage(message));

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

        const isErrorMessage = /(\berr\b|\berror\b)/i.test(arg);
        const isWarningMessage = /\bwarn\b/i.test(arg);
        const isInfoMessage = /\binfo\b/i.test(arg);
        const isDebugMessage = /\bdebug\b/i.test(arg);
        const isCoreMessage = /\bcore\b/i.test(arg);

        const processed = colorizeMessage(arg);
        cache.set(arg, processed);

        if (isErrorMessage) {
          logger.error(arg);
          console.error(processed);
        } else if (isWarningMessage) {
          logger.warn(arg);
          console.warn(processed);
        } else if (isInfoMessage) {
          logger.info(arg);
          console.info(processed);
        } else if (isDebugMessage) {
          logger.debug(arg);
          console.debug(processed);
        } else if (isCoreMessage) {
          logger.core(arg);
          return processed;
        } else {
          logger.info(arg);
          return processed;
        }
      }
      return arg;
    });

    if (
      !coloredArgs.some(
        (arg) =>
          typeof arg === 'string' &&
          /\berr\b|\berror\b|\bwarn\b|\binfo\b|\bdebug\b/i.test(arg)
      )
    ) {
      originalConsoleLog.apply(console, coloredArgs);
    }
  };
};
