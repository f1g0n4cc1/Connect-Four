export class AudioManager {
    constructor() {
        this.sounds = new Map();
        this.soundPaths = {
            'chip-drop': '/sounds/chip-drop.wav',
            'win': '/sounds/win.wav',
            'click': '/sounds/click.wav'
            // Add other sounds here
        };
        this.loadSounds();
    }

    loadSounds() {
        for (const [name, path] of Object.entries(this.soundPaths)) {
            const audio = new Audio(path);
            audio.preload = 'auto';
            this.sounds.set(name, audio);
        }
    }

    play(soundName) {
        const audio = this.sounds.get(soundName);
        if (audio) {
            // Clone the node to allow multiple plays without waiting for the current one to finish
            const clone = audio.cloneNode();
            clone.play().catch(e => console.warn(`Error playing sound ${soundName}:`, e));
        } else {
            console.warn(`Sound "${soundName}" not found.`);
        }
    }
}