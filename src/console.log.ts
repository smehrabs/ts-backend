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
  R = '\x1b[31m',
  G = '\x1b[32m',
  Y = '\x1b[33m',
  B = '\x1b[34m',
  M = '\x1b[35m',
  C = '\x1b[36m',
  W = '\x1b[37m',
  BrR = '\x1b[91m',
  BrG = '\x1b[92m',
  BrY = '\x1b[93m',
  BrB = '\x1b[94m',
  BrM = '\x1b[95m',
  BrC = '\x1b[96m',
  BrW = '\x1b[97m',
  SpB = '\x1b[38;5;39m',
  FrW = '\x1b[38;5;255m',
  MiP = '\x1b[38;5;93m',
  AuG = '\x1b[38;5;46m',
  IcC = '\x1b[38;5;51m',
  TwM = '\x1b[38;5;125m',
  WiG = '\x1b[38;5;240m',
  NeP = '\x1b[38;5;200m',
}

const colorMapping: Record<string, LogColor> = {
  err: LogColor.R,
  error: LogColor.R,
  info: LogColor.G,
  warn: LogColor.Y,
  debug: LogColor.B,
  success: LogColor.C,
  critical: LogColor.BrR,
  app: LogColor.G,
  start: LogColor.BrG,
  '1': LogColor.R,
  '2': LogColor.G,
  '3': LogColor.Y,
  '4': LogColor.B,
  '5': LogColor.M,
  '6': LogColor.C,
  '7': LogColor.W,
  '8': LogColor.BrR,
  '9': LogColor.BrG,
  '10': LogColor.BrY,
  '11': LogColor.BrB,
  '12': LogColor.BrM,
  '13': LogColor.BrC,
  '14': LogColor.BrW,
  bold: LogColor.Bold,
  italic: LogColor.Italic,
  underline: LogColor.Underline,
  blink: LogColor.Blink,
  reverse: LogColor.Reverse,
  hidden: LogColor.Hidden,
  sp: LogColor.SpB,
  fr: LogColor.FrW,
  mi: LogColor.MiP,
  au: LogColor.AuG,
  ic: LogColor.IcC,
  tw: LogColor.TwM,
  wi: LogColor.WiG,
  ne: LogColor.NeP,
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

// مثال استفاده
const message =
  'This is a ~{Italic}`Italic text`, and this is a ~{Green}`green text`, and this is a normal message. [info] __ ~{sp}`Salam`';
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
