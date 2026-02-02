const chalk = require("chalk");

class Logger {
  static client(text) {
    console.log(chalk.blue.bold(`[CLIENT] `) + text);
  }

  static event(text) {
    console.log(chalk.magenta.bold(`[EVENT] `) + text);
  }

  static command(text) {
    console.log(chalk.green.bold(`[COMMAND] `) + text);
  }

  static button(text) {
    console.log(chalk.cyan.bold(`[BUTTON] `) + text);
  }

  static select(text) {
    console.log(chalk.yellow.bold(`[SELECT] `) + text);
  }

  static warn(text) {
    console.log(chalk.yellow.bold(`[WARN] `) + text);
  }

  static error(text) {
    console.log(chalk.red.bold(`[ERROR] `) + text);
  }

  static success(text) {
    console.log(chalk.green.bold(`[SUCCESS] `) + text);
  }

  static info(text) {
    console.log(chalk.white.bold(`[INFO] `) + text);
  }

  static db(text) {
    console.log(chalk.blueBright.bold(`[DATABASE] `) + text);
  }
}

module.exports = Logger;
