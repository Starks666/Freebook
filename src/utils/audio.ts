/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Web Audio API synthesizer that plays custom emotional chimes
 * corresponding to the Freebook post reaction hover selections.
 */
export const playReactionTone = (type: 'like' | 'love' | 'haha' | 'sad' | 'angry') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    
    // Master gain for comfortable volume
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.08, ctx.currentTime);

    if (type === 'like') {
      // Like tone: happy ascending double chime
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start();
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.stop(ctx.currentTime + 0.35);
    } 
    else if (type === 'love') {
      // Love tone: slow heartbeat double pulse
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.type = 'triangle';
      osc2.type = 'sine';
      
      // Beat 1 of heart
      osc1.frequency.setValueAtTime(261.63, ctx.currentTime); // C4
      gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      
      // Beat 2 of heart
      osc2.frequency.setValueAtTime(349.23, ctx.currentTime + 0.15); // F4
      const gainNode2 = ctx.createGain();
      gainNode2.gain.setValueAtTime(0.12, ctx.currentTime + 0.15);
      gainNode2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      
      osc1.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc2.connect(gainNode2);
      gainNode2.connect(ctx.destination);
      
      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.45);
    } 
    else if (type === 'haha') {
      // Haha tone: bubbly laughing bouncing arpeggio
      const osc = ctx.createOscillator();
      osc.type = 'square';
      
      gainNode.gain.setValueAtTime(0.04, ctx.currentTime);
      
      const t = ctx.currentTime;
      osc.frequency.setValueAtTime(392.00, t); // G4
      gainNode.gain.setValueAtTime(0.04, t);
      
      osc.frequency.setValueAtTime(493.88, t + 0.08); // B4
      
      osc.frequency.setValueAtTime(587.33, t + 0.16); // D5
      gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start();
      osc.stop(t + 0.4);
    } 
    else if (type === 'sad') {
      // Sad tone: slowly sighing descending slide (E4 down to A3)
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      
      osc.frequency.setValueAtTime(329.63, ctx.currentTime); // E4
      osc.frequency.exponentialRampToValueAtTime(220.00, ctx.currentTime + 0.55); // A3
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start();
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.stop(ctx.currentTime + 0.65);
    } 
    else if (type === 'angry') {
      // Angry tone: detuned dual Sawtooth growl (A2 + detuned A2)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      
      osc1.frequency.setValueAtTime(110.00, ctx.currentTime); // A2
      osc2.frequency.setValueAtTime(112.50, ctx.currentTime); // Detuned growl
      
      const dist = ctx.createGain();
      dist.gain.setValueAtTime(0.12, ctx.currentTime);
      dist.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      
      osc1.connect(dist);
      osc2.connect(dist);
      dist.connect(ctx.destination);
      
      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.5);
      osc2.stop(ctx.currentTime + 0.5);
    }
  } catch (err) {
    console.warn("Web Audio Context not activated: ", err);
  }
};
