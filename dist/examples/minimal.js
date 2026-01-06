import { MockAudioEngine } from "../core/audio/MockAudioEngine.js";
import { PlayerController } from "../core/player/PlayerController.js";
const engine = new MockAudioEngine();
const controller = new PlayerController(engine);
controller.store.subscribe((s) => {
    console.log({ status: s.status, mode: s.mode, index: s.currentIndex, positionMs: s.positionMs, volume: s.volume });
});
const tracks = [
    { id: "1", uri: "a.mp3", title: "A", artist: "X", durationMs: 1500 },
    { id: "2", uri: "b.mp3", title: "B", artist: "Y", durationMs: 1200 },
    { id: "3", uri: "c.mp3", title: "C", artist: "Z", durationMs: 1800 },
];
controller.load(tracks);
controller.setMode("ACTIVE");
await controller.playIndex(0);
setTimeout(() => controller.pause(), 700);
setTimeout(() => controller.resume(), 1100);
setTimeout(() => controller.seek(300), 1300);
setTimeout(() => controller.next(), 2000);
setTimeout(() => controller.setMode("CHILL"), 2600);
setTimeout(() => controller.next(), 3000);
setTimeout(() => controller.setMode("FOCUS"), 3600);
setTimeout(() => controller.next(), 4000);
