/* eslint-disable no-var */
import { ConfigManager } from './config.js';

declare global {
  var configs: ConfigManager;
  function cwd(resolvePath?: string, join?: string): string;
}

export {};
