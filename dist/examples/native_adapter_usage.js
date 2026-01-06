import { NativeAudioEngine } from "../core/audio/NativeAudioEngine.js";
import { PlayerController } from "../core/player/PlayerController.js";
import { resolveAudioEngine } from "../core/audio/resolveAudioEngine.js";
const engine = await resolveAudioEngine();
const controller = new PlayerController(engine);
controller.store.subscribe((s) => {
    console.log({ status: s.status, index: s.currentIndex, positionMs: s.positionMs });
});
const tracks = [
    { id: "1", uri: "app://assets/a.mp3", title: "A", durationMs: 0 },
];
controller.load(tracks);
await controller.playIndex(0);
