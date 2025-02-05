import chalk from 'chalk';
import { LRUCache } from 'lru-cache';

import { CustomLogger } from './logger.js';

const colorMapping: Record<string, (...args: any[]) => string> = {
  err: chalk.red,
  error: chalk.red,
  info: chalk.green,
  warn: chalk.yellow,
  debug: chalk.blue,
  success: chalk.cyan,
  critical: chalk.bgRed.white,
  core: chalk.bgRed.white,

  lava: chalk.hex('#c21e56'),
  sky: chalk.hex('#76aaff'),
  forest: chalk.hex('#228b22'),
  sunset: chalk.hex('#fd5e53'),
  ocean: chalk.hex('#4f83cc'),
  violet: chalk.hex('#9b59b6'),
  peach: chalk.hex('#ffb6b9'),
  mint: chalk.hex('#98ff98'),
  gold: chalk.hex('#ffd700'),
  silver: chalk.hex('#c0c0c0'),

  '1': chalk.red,
  '2': chalk.green,
  '3': chalk.yellow,
  '4': chalk.blue,
  '5': chalk.magenta,
  '6': chalk.cyan,
  '7': chalk.white,
  '8': chalk.bgRed.white,
  '9': chalk.bgGreen.white,
  '10': chalk.bgYellow.white,
  '11': chalk.bgBlue.white,
  '12': chalk.bgMagenta.white,
  '13': chalk.bgCyan.white,
  '14': chalk.bgWhite.black,
  '15': chalk.bgBlue.white,
  '16': chalk.bgWhite.black,
  '17': chalk.hex('#93A8C6'),
  '18': chalk.hex('#B45F06'),
  '19': chalk.hex('#51B4D1'),
  '20': chalk.hex('#745EB0'),
  '21': chalk.hex('#4B4E53'),
  '22': chalk.hex('#FB59BB'),

  bold: chalk.bold,
  italic: chalk.italic,
  underline: chalk.underline,
  blink: chalk.bgYellow.black,
  reverse: chalk.inverse,
  hidden: chalk.hidden,
  strikethrough: chalk.strikethrough,
  overline: chalk.overline,
  doubleunderline: chalk.underline.bold,
};

const specialWords: string[] = [
  'info',
  'warn',
  'error',
  'success',
  'debug',
  'core',
];

const colorizeMessage = (message: string): string => {
  const regex = /~{(.*?)}`(.*?)`/g;
  message = message.replace(regex, (_match, colorName, text) => {
    const colorFn = colorMapping[colorName as keyof typeof colorMapping];
    return colorFn ? colorFn(text) : text;
  });

  const wordRegex = new RegExp(`\\b(${specialWords.join('|')})\\b`, 'gi');
  message = message.replace(wordRegex, (match) => {
    const colorFn =
      colorMapping[match.toLowerCase() as keyof typeof colorMapping];
    return colorFn ? colorFn(match) : match;
  });

  return message;
};

export const addSpecialWord = (word: string): void => {
  if (!specialWords.includes(word)) {
    specialWords.push(word);
  }
};

export const initLog = (debug: boolean, logger: CustomLogger): void => {
  const originalConsoleLog = console.log;
  const cache = new LRUCache<string, string>({ max: 250 });

  const levelMapping: Record<string, (msg: string) => void> = {
    err: logger.error.bind(logger),
    error: logger.error.bind(logger),
    warn: logger.warn.bind(logger),
    info: logger.info.bind(logger),
    debug: logger.debug.bind(logger),
    core: logger.core.bind(logger),
  };

  console.log = (...args: any[]): void => {
    if (!debug) return;

    const coloredArgs = args.map((arg) => {
      if (typeof arg === 'string') {
        const cachedMessage = cache.get(arg);
        if (cachedMessage) return cachedMessage;

        const level =
          Object.keys(levelMapping).find((key) =>
            new RegExp(`\\b${key}\\b`, 'i').test(arg)
          ) || 'info';
        levelMapping[level](arg);

        const processed = colorizeMessage(arg);
        cache.set(arg, processed);
        return processed;
      }
      return arg;
    });

    originalConsoleLog(...coloredArgs);
  };
};
