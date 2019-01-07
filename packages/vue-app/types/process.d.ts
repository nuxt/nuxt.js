/**
 * Extends NodeJS.Process interface
 */

declare namespace NodeJS {
  interface Process {
    browser: boolean;
    client: boolean;
    server: boolean;
    static: boolean;
  }
}
