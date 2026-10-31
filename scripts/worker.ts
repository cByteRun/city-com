import { syncDue } from "../src/server/connectors";
console.log(
  "CityCom collector: checks authorized sources every minute; schedule <=60 min.",
);
let stopped = false;
process.on("SIGTERM", () => {
  stopped = true;
});
process.on("SIGINT", () => {
  stopped = true;
});
async function tick() {
  if (stopped) return;
  try {
    await syncDue();
  } catch (e) {
    console.error(
      "Collector error",
      e instanceof Error ? e.message : "unknown",
    );
  }
  if (!stopped) setTimeout(tick, 60000);
}
void tick();

