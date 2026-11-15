import { test } from "node:test";
import assert from "node:assert";
import { ku } from "../i18n/translations.ts";
import { useAppStore } from "../store/appStore.ts";
import { NAV_ITEMS } from "../components/Sidebar.tsx";
import { CANONICAL_GRADE_12_CHEMISTRY_OUTLINE } from "../server/api/curriculum/outline.ts";

test("Redesign - Kurdish Sorani translations integrity", () => {
  assert.strictEqual(ku.appName, "زانا");
  assert.strictEqual(ku.nav.home, "ماڵەوە");
  assert.strictEqual(ku.nav.chat, "زانا");
  assert.strictEqual(ku.nav.rooms, "ژووری خوێندن");
  assert.strictEqual(ku.nav.profile, "پرۆفایل");
  assert.strictEqual(ku.nav.settings, "ڕێکخستن");

  assert.ok(ku.home.welcomeTitle.includes("بەخێربێی"));
  assert.strictEqual(ku.home.streakUnit, "ڕۆژ");
  assert.strictEqual(ku.home.lessonsUnit, "وانە");
  assert.strictEqual(ku.home.scoreUnit, "خاڵ");
});

test("Redesign - Sidebar NAV_ITEMS structure", () => {
  assert.strictEqual(NAV_ITEMS.length, 10);
  const keys = NAV_ITEMS.map((n) => n.key);
  assert.deepStrictEqual(keys, [
    "home",
    "chat",
    "subjects",
    "practice",
    "labs",
    "assessment",
    "plan",
    "rooms",
    "report",
    "profile",
  ]);
});

test("Redesign - AppStore state and actions", () => {
  const store = useAppStore.getState();

  // Test active chapter setting
  store.setActiveChapter(5);
  assert.strictEqual(useAppStore.getState().activeChapter, 5);

  // Test notification adding and removing
  store.addNotification("success", "سەرکەوتوو بوو");
  const notifications = useAppStore.getState().notifications;
  assert.ok(notifications.length > 0);
  const toastId = notifications[notifications.length - 1].id;
  assert.strictEqual(notifications[notifications.length - 1].type, "success");
  assert.strictEqual(notifications[notifications.length - 1].message, "سەرکەوتوو بوو");

  store.removeNotification(toastId);
  const remaining = useAppStore.getState().notifications.filter((n) => n.id === toastId);
  assert.strictEqual(remaining.length, 0);

  // Test profile updating
  store.updateProfile({ name: "شکار کەریم", stream: "scientific" });
  assert.strictEqual(useAppStore.getState().user.name, "شکار کەریم");
  assert.strictEqual(useAppStore.getState().user.stream, "scientific");

  // Test message addition
  store.addChatMessage({
    id: "test-msg-1",
    sender: "user",
    content: "بەندی ١٠ چییە؟",
    timestamp: "12:00",
  });
  const msgs = useAppStore.getState().chatMessages;
  assert.ok(msgs.some((m) => m.id === "test-msg-1"));
});

test("Redesign - Canonical Grade 12 Chemistry outline has all 10 chapters (2025 curriculum)", () => {
  assert.strictEqual(CANONICAL_GRADE_12_CHEMISTRY_OUTLINE.length, 10);
  assert.strictEqual(CANONICAL_GRADE_12_CHEMISTRY_OUTLINE[0].id, 1);
  assert.strictEqual(CANONICAL_GRADE_12_CHEMISTRY_OUTLINE[0].title, "ئایۆنەکان لە ئاوەگیراوەکاندا و ڕەوشە کۆکارییەکان");
  assert.strictEqual(CANONICAL_GRADE_12_CHEMISTRY_OUTLINE[0].pages, "8-36");

  assert.strictEqual(CANONICAL_GRADE_12_CHEMISTRY_OUTLINE[8].id, 9);
  assert.strictEqual(CANONICAL_GRADE_12_CHEMISTRY_OUTLINE[8].title, "کاربۆن و هایدرۆکاربۆنەکان");
  assert.strictEqual(CANONICAL_GRADE_12_CHEMISTRY_OUTLINE[8].pages, "226-261");

  assert.strictEqual(CANONICAL_GRADE_12_CHEMISTRY_OUTLINE[9].id, 10);
  assert.strictEqual(CANONICAL_GRADE_12_CHEMISTRY_OUTLINE[9].title, "ئاوێتە ئەندامییەکانی تر");
  assert.strictEqual(CANONICAL_GRADE_12_CHEMISTRY_OUTLINE[9].pages, "262-297");
});
