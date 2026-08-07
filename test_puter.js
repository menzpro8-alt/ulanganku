const puter = require('puter');
async function run() {
  try {
    const result = await puter.ai.chat("Hello");
    console.log("Success:", result);
  } catch (err) {
    console.error("Error:", err);
  }
}
run();
