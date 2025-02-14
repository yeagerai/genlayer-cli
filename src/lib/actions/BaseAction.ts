import inquirer from "inquirer";
import chalk from "chalk";
import ora, { Ora } from "ora";

export class BaseAction {
  private spinner: Ora;

  constructor() {
    this.spinner = ora({ text: "", spinner: "dots" });
  }

  protected async confirmPrompt(message: string): Promise<void> {
    const answer = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirmAction",
        message: chalk.yellow(message),
        default: true,
      },
    ]);

    if (!answer.confirmAction) {
      this.logError("Operation aborted!");
      process.exit(0);
    }
  }

  private formatOutput(data: any): string {
    if (data instanceof Error) {
      const errorDetails = {
        name: data.name,
        message: data.message,
        ...(Object.keys(data).length ? data : {}),
      };
      return JSON.stringify(errorDetails, null, 2);
    }
    return typeof data === "object" ? JSON.stringify(data, null, 2) : String(data);
  }

  protected log(message: string, data?: any): void {
    console.log(chalk.white(`\n${message}`));
    if (data) console.log(this.formatOutput(data));
  }

  protected logSuccess(message: string, data?: any): void {
    console.log(chalk.green(`\n✔ ${message}`));
    if (data) console.log(chalk.green(this.formatOutput(data)));
  }

  protected logInfo(message: string, data?: any): void {
    console.log(chalk.blue(`\nℹ ${message}`));
    if (data) console.log(chalk.blue(this.formatOutput(data)));
  }

  protected logWarning(message: string, data?: any): void {
    console.log(chalk.yellow(`\n⚠ ${message}`));
    if (data) console.log(chalk.yellow(this.formatOutput(data)));
  }

  protected logError(message: string, error?: any): void {
    console.error(chalk.red(`\n✖ ${message}`));
    if (error) console.error(chalk.red(this.formatOutput(error)));
  }

  protected startSpinner(message: string) {
    this.spinner.text = chalk.blue(`${message}`);
    this.spinner.start();
  }

  protected succeedSpinner(message: string, data?: any): void {
    if (data) this.log('Result:', data);
    this.spinner.succeed(chalk.green(message));
  }

  protected failSpinner(message: string, error?:any): void {
    if (error) this.log('Error:', error);
    this.spinner.fail(chalk.red(message));
  }

  protected stopSpinner(): void {
    this.spinner.stop();
  }

  protected setSpinnerText(message: string): void {
    this.spinner.text = chalk.blue(message);
  }
}