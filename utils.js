import readline from "readline";
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
export async function waitForEnter() {
  return new Promise((resolve) => {
    rl.question("\n\x1b[32mGot it! Press Enter for next step..\x1b[0m", () => resolve());
  });
}
