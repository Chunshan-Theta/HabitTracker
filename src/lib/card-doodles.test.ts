import assert from "node:assert/strict";
import test from "node:test";
type SlotDoodleMap = Record<number, string>;

/**
 * Mirrors merge logic in getSlotDoodlesForCard: one doodle per slot index.
 */
function mergeSlotDoodles(
  events: Array<{ pointsAfter: number; doodle: string; createdAt: number }>
): SlotDoodleMap {
  const sorted = [...events].sort((a, b) => {
    if (a.pointsAfter !== b.pointsAfter) {
      return a.pointsAfter - b.pointsAfter;
    }
    return b.createdAt - a.createdAt;
  });

  const slotDoodles: SlotDoodleMap = {};
  for (const event of sorted) {
    if (slotDoodles[event.pointsAfter] !== undefined) {
      continue;
    }
    slotDoodles[event.pointsAfter] = event.doodle;
  }
  return slotDoodles;
}

test("each check-in slot keeps its own doodle", () => {
  const events = Array.from({ length: 30 }, (_, idx) => ({
    pointsAfter: idx + 1,
    doodle: `doodle-${idx + 1}`,
    createdAt: idx + 1,
  }));

  const map = mergeSlotDoodles(events);
  assert.equal(Object.keys(map).length, 30);
  for (let slot = 1; slot <= 30; slot += 1) {
    assert.equal(map[slot], `doodle-${slot}`);
  }
});

test("duplicate slot entries keep the latest doodle only", () => {
  const map = mergeSlotDoodles([
    { pointsAfter: 3, doodle: "old", createdAt: 1 },
    { pointsAfter: 3, doodle: "new", createdAt: 2 },
    { pointsAfter: 1, doodle: "first", createdAt: 1 },
  ]);

  assert.equal(map[1], "first");
  assert.equal(map[3], "new");
});
