// src/components/ToneMixer.tsx
import React, { useState, useRef, useEffect } from 'react';
import * as Tone from 'tone';
import { Play, Square, Volume2 } from 'lucide-react';

interface ToneMixerProps {
  onAudioStateChange: (state: {
    freq1: number;
    freq2: number;
    volume1: number;
    volume2: number;
    isPlaying1: boolean;
    isPlaying2: boolean;
    isMixPlaying: boolean;
  }) => void;
}

// Function to convert frequency to nearest musical note
const frequencyToNote = (frequency: number): string => {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  // Calculate the number of semitones from A4 (440 Hz)
  const A4 = 440;
  const semitones = Math.round(12 * Math.log2(frequency / A4));
  
  // Calculate octave and note index
  const octave = Math.floor((semitones + 9) / 12) + 4;
  const noteIndex = ((semitones + 9) % 12 + 12) % 12;
  
  return `${noteNames[noteIndex]}${octave}`;
};

// Function to get the exact frequency of a musical note for comparison
const getExactNoteFrequency = (frequency: number): number => {
  const A4 = 440;
  const semitones = Math.round(12 * Math.log2(frequency / A4));
  return A4 * Math.pow(2, semitones / 12);
};

// Function to calculate cents deviation from the nearest note
const getCentsDeviation = (frequency: number): number => {
  const exactFreq = getExactNoteFrequency(frequency);
  return Math.round(1200 * Math.log2(frequency / exactFreq));
};

// Function to convert note name to frequency
const noteToFrequency = (noteName: string): number | null => {
  const noteRegex = /^([A-G])(#|b)?(\d{1,2})$/i;
  const match = noteName.trim().toUpperCase().match(noteRegex);
  
  if (!match) return null;
  
  const [, note, accidental, octaveStr] = match;
  const octave = parseInt(octaveStr);
  
  if (octave < 0 || octave > 10) return null;
  
  // Note to semitone mapping (C = 0)
  const noteValues: { [key: string]: number } = {
    'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11
  };
  
  let semitone = noteValues[note];
  if (accidental === '#') semitone += 1;
  else if (accidental === 'B') semitone -= 1;
  
  // Calculate frequency using A4 = 440 Hz as reference
  const A4 = 440;
  const semitonesFromA4 = (octave - 4) * 12 + (semitone - 9);
  const frequency = A4 * Math.pow(2, semitonesFromA4 / 12);
  
  // Clamp to valid range
  return Math.max(20, Math.min(2000, frequency));
};

const ToneMixer: React.FC<ToneMixerProps> = ({ onAudioStateChange }) => {
  const [freq1, setFreq1] = useState(440); // A4
  const [freq2, setFreq2] = useState(880); // A5
  const [freq1Input, setFreq1Input] = useState('440.0');
  const [freq2Input, setFreq2Input] = useState('880.0');
  const [volume1Input, setVolume1Input] = useState('50');
  const [volume2Input, setVolume2Input] = useState('50');
  const [note1Input, setNote1Input] = useState('A4');
  const [note2Input, setNote2Input] = useState('A5');
  const [isEditingFreq1, setIsEditingFreq1] = useState(false);
  const [isEditingFreq2, setIsEditingFreq2] = useState(false);
  const [isEditingVolume1, setIsEditingVolume1] = useState(false);
  const [isEditingVolume2, setIsEditingVolume2] = useState(false);
  const [isEditingNote1, setIsEditingNote1] = useState(false);
  const [isEditingNote2, setIsEditingNote2] = useState(false);
  const [isPlaying1, setIsPlaying1] = useState(false);
  const [isPlaying2, setIsPlaying2] = useState(false);
  const [isMixPlaying, setIsMixPlaying] = useState(false);
  const [volume1, setVolume1] = useState(0.5);
  const [volume2, setVolume2] = useState(0.5);
  const [isAudioStarted, setIsAudioStarted] = useState(false);

  const osc1 = useRef<Tone.Oscillator | null>(null);
  const osc2 = useRef<Tone.Oscillator | null>(null);
  const gain1 = useRef<Tone.Gain | null>(null);
  const gain2 = useRef<Tone.Gain | null>(null);

  // Notify parent component of audio state changes
  useEffect(() => {
    onAudioStateChange({
      freq1,
      freq2,
      volume1,
      volume2,
      isPlaying1,
      isPlaying2,
      isMixPlaying
    });
  }, [freq1, freq2, volume1, volume2, isPlaying1, isPlaying2, isMixPlaying, onAudioStateChange]);

  useEffect(() => {
    // Initialize audio nodes
    gain1.current = new Tone.Gain(volume1).toDestination();
    gain2.current = new Tone.Gain(volume2).toDestination();
    
    return () => {
      // Cleanup
      if (osc1.current) {
        osc1.current.dispose();
      }
      if (osc2.current) {
        osc2.current.dispose();
      }
      if (gain1.current) {
        gain1.current.dispose();
      }
      if (gain2.current) {
        gain2.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    if (gain1.current) {
      gain1.current.gain.value = volume1;
    }
  }, [volume1]);

  useEffect(() => {
    if (gain2.current) {
      gain2.current.gain.value = volume2;
    }
  }, [volume2]);

  // Only update input if not editing
  useEffect(() => {
    if (!isEditingFreq1) setFreq1Input(freq1.toString());
  }, [freq1, isEditingFreq1]);

  useEffect(() => {
    if (!isEditingFreq2) setFreq2Input(freq2.toString());
  }, [freq2, isEditingFreq2]);

  useEffect(() => {
    if (!isEditingVolume1) setVolume1Input(Math.round(volume1 * 100).toString());
  }, [volume1, isEditingVolume1]);

  useEffect(() => {
    if (!isEditingVolume2) setVolume2Input(Math.round(volume2 * 100).toString());
  }, [volume2, isEditingVolume2]);

  useEffect(() => {
    if (!isEditingNote1) setNote1Input(frequencyToNote(freq1));
  }, [freq1, isEditingNote1]);

  useEffect(() => {
    if (!isEditingNote2) setNote2Input(frequencyToNote(freq2));
  }, [freq2, isEditingNote2]);

  const startAudio = async () => {
    if (Tone.context.state !== 'running') {
      await Tone.start();
      setIsAudioStarted(true);
    }
  };

  const toggleOsc1 = async () => {
    await startAudio();
    
    if (!isPlaying1) {
      if (gain1.current) {
        // Create proper sine wave oscillator with explicit settings
        osc1.current = new Tone.Oscillator({
          frequency: freq1,
          type: 'sine',
          phase: 0
        }).connect(gain1.current);
        osc1.current.start();
        setIsPlaying1(true);
      }
    } else {
      if (osc1.current) {
        osc1.current.stop();
        osc1.current.dispose();
        osc1.current = null;
      }
      setIsPlaying1(false);
    }
  };

  const toggleOsc2 = async () => {
    await startAudio();
    
    if (!isPlaying2) {
      if (gain2.current) {
        // Create proper sine wave oscillator with explicit settings
        osc2.current = new Tone.Oscillator({
          frequency: freq2,
          type: 'sine',
          phase: 0
        }).connect(gain2.current);
        osc2.current.start();
        setIsPlaying2(true);
      }
    } else {
      if (osc2.current) {
        osc2.current.stop();
        osc2.current.dispose();
        osc2.current = null;
      }
      setIsPlaying2(false);
    }
  };

  const toggleMix = async () => {
    await startAudio();
    
    if (!(isPlaying1 && isPlaying2)) {
      // Start both oscillators with proper sine wave settings
      if (!isPlaying1 && gain1.current) {
        osc1.current = new Tone.Oscillator({
          frequency: freq1,
          type: 'sine',
          phase: 0
        }).connect(gain1.current);
        osc1.current.start();
        setIsPlaying1(true);
      }
      if (!isPlaying2 && gain2.current) {
        osc2.current = new Tone.Oscillator({
          frequency: freq2,
          type: 'sine',
          phase: 0
        }).connect(gain2.current);
        osc2.current.start();
        setIsPlaying2(true);
      }
      setIsMixPlaying(true);
    } else {
      // Stop both oscillators
      if (osc1.current) {
        osc1.current.stop();
        osc1.current.dispose();
        osc1.current = null;
        setIsPlaying1(false);
      }
      if (osc2.current) {
        osc2.current.stop();
        osc2.current.dispose();
        osc2.current = null;
        setIsPlaying2(false);
      }
      setIsMixPlaying(false);
    }
  };

  const updateFreq1 = (newFreq: number) => {
    setFreq1(newFreq);
    if (osc1.current && isPlaying1) {
      osc1.current.frequency.value = newFreq;
    }
  };

  const updateFreq2 = (newFreq: number) => {
    setFreq2(newFreq);
    if (osc2.current && isPlaying2) {
      osc2.current.frequency.value = newFreq;
    }
  };

  const stopAll = () => {
    if (osc1.current) {
      osc1.current.stop();
      osc1.current.dispose();
      osc1.current = null;
    }
    if (osc2.current) {
      osc2.current.stop();
      osc2.current.dispose();
      osc2.current = null;
    }
    setIsPlaying1(false);
    setIsPlaying2(false);
    setIsMixPlaying(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-gray-900/80 backdrop-blur-md rounded-xl shadow-2xl border border-gray-700/50 flex flex-col overflow-hidden">
      <div className="text-center p-8 pb-4">
        <h1 className="text-3xl font-bold text-white mb-2">Tone Mixer</h1>
        <p className="text-gray-300 text-lg">Mix and blend sine wave frequencies</p>
      </div>



      {/* Main Content Area */}
      <div className="flex-1 flex flex-col px-6 pb-6">
        {/* Oscillators Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 flex-1">
          {/* Oscillator 1 - Blue Theme */}
          <div className={`bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border transition-all duration-500 flex flex-col shadow-lg hover:shadow-xl ${
            isPlaying1 
              ? 'border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.4)] shadow-blue-500/20' 
              : 'border-gray-600/50 hover:border-gray-500/50'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Oscillator 1</h3>
              <button
                onClick={toggleOsc1}
                className={`flex items-center gap-3 px-5 py-2.5 rounded-lg font-medium text-base transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                  isPlaying1
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/25'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30'
                }`}
              >
                {isPlaying1 ? <Square size={16} /> : <Play size={16} />}
                {isPlaying1 ? 'Stop' : 'Play'}
              </button>
            </div>
            
            <div className="space-y-4 flex-1">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-gray-300 text-sm font-medium">Frequency</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="20"
                      max="2000"
                      step="0.1"
                      value={freq1Input}
                      onFocus={() => setIsEditingFreq1(true)}
                      onBlur={e => {
                        setIsEditingFreq1(false);
                        const val = parseFloat(e.target.value);
                        if (isNaN(val) || val < 20) {
                          updateFreq1(440);
                          setFreq1Input('440.0');
                        } else if (val > 2000) {
                          updateFreq1(2000);
                          setFreq1Input('2000.0');
                        } else {
                          updateFreq1(val);
                          setFreq1Input(val.toFixed(1));
                        }
                      }}
                      onChange={e => setFreq1Input(e.target.value)}
                      onKeyPress={e => {
                        if (e.key === 'Enter') {
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                      className="w-20 px-3 py-1.5 text-sm bg-gray-700/50 border border-gray-600 rounded font-mono text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 hover:border-gray-500"
                    />
                    <span className="text-gray-300 text-sm font-medium">Hz</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="20"
                  max="2000"
                  step="1"
                  value={freq1}
                  onChange={(e) => updateFreq1(parseFloat(e.target.value))}
                  className="w-full h-3 bg-gray-700/50 rounded-lg appearance-none cursor-pointer slider-blue transition-all duration-200 hover:bg-gray-600/50"
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-gray-300 text-sm font-medium flex items-center gap-2">
                    <Volume2 size={16} />
                    Volume
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={volume1Input}
                      onFocus={() => setIsEditingVolume1(true)}
                      onBlur={e => {
                        setIsEditingVolume1(false);
                        const val = parseFloat(e.target.value);
                        if (isNaN(val) || val < 0) {
                          setVolume1(0.5);
                          setVolume1Input('50');
                        } else if (val > 100) {
                          setVolume1(1);
                          setVolume1Input('100');
                        } else {
                          setVolume1(val / 100);
                          setVolume1Input(Math.round(val).toString());
                        }
                      }}
                      onChange={e => setVolume1Input(e.target.value)}
                      onKeyPress={e => {
                        if (e.key === 'Enter') {
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                      className="w-16 px-3 py-1.5 text-sm bg-gray-700/50 border border-gray-600 rounded font-mono text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 hover:border-gray-500"
                    />
                    <span className="text-gray-300 text-sm font-medium">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume1}
                  onChange={(e) => setVolume1(parseFloat(e.target.value))}
                  className="w-full h-3 bg-gray-700/50 rounded-lg appearance-none cursor-pointer slider-blue transition-all duration-200 hover:bg-gray-600/50"
                />
              </div>
            </div>
          </div>

          {/* Oscillator 2 - Purple Theme */}
          <div className={`bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border transition-all duration-500 flex flex-col shadow-lg hover:shadow-xl ${
            isPlaying2 
              ? 'border-purple-500/50 shadow-[0_0_30px_rgba(139,92,246,0.4)] shadow-purple-500/20' 
              : 'border-gray-600/50 hover:border-gray-500/50'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Oscillator 2</h3>
              <button
                onClick={toggleOsc2}
                className={`flex items-center gap-3 px-5 py-2.5 rounded-lg font-medium text-base transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                  isPlaying2
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/25'
                    : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30'
                }`}
              >
                {isPlaying2 ? <Square size={16} /> : <Play size={16} />}
                {isPlaying2 ? 'Stop' : 'Play'}
              </button>
            </div>
            
            <div className="space-y-4 flex-1">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-gray-300 text-sm font-medium">Frequency</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="20"
                      max="2000"
                      step="0.1"
                      value={freq2Input}
                      onFocus={() => setIsEditingFreq2(true)}
                      onBlur={e => {
                        setIsEditingFreq2(false);
                        const val = parseFloat(e.target.value);
                        if (isNaN(val) || val < 20) {
                          updateFreq2(880);
                          setFreq2Input('880.0');
                        } else if (val > 2000) {
                          updateFreq2(2000);
                          setFreq2Input('2000.0');
                        } else {
                          updateFreq2(val);
                          setFreq2Input(val.toFixed(1));
                        }
                      }}
                      onChange={e => setFreq2Input(e.target.value)}
                      onKeyPress={e => {
                        if (e.key === 'Enter') {
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                      className="w-20 px-3 py-1.5 text-sm bg-gray-700/50 border border-gray-600 rounded font-mono text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 hover:border-gray-500"
                    />
                    <span className="text-gray-300 text-sm font-medium">Hz</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="20"
                  max="2000"
                  step="1"
                  value={freq2}
                  onChange={(e) => updateFreq2(parseFloat(e.target.value))}
                  className="w-full h-3 bg-gray-700/50 rounded-lg appearance-none cursor-pointer slider-purple transition-all duration-200 hover:bg-gray-600/50"
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-gray-300 text-sm font-medium flex items-center gap-2">
                    <Volume2 size={16} />
                    Volume
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={volume2Input}
                      onFocus={() => setIsEditingVolume2(true)}
                      onBlur={e => {
                        setIsEditingVolume2(false);
                        const val = parseFloat(e.target.value);
                        if (isNaN(val) || val < 0) {
                          setVolume2(0.5);
                          setVolume2Input('50');
                        } else if (val > 100) {
                          setVolume2(1);
                          setVolume2Input('100');
                        } else {
                          setVolume2(val / 100);
                          setVolume2Input(Math.round(val).toString());
                        }
                      }}
                      onChange={e => setVolume2Input(e.target.value)}
                      onKeyPress={e => {
                        if (e.key === 'Enter') {
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                      className="w-16 px-3 py-1.5 text-sm bg-gray-700/50 border border-gray-600 rounded font-mono text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 hover:border-gray-500"
                    />
                    <span className="text-gray-300 text-sm font-medium">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume2}
                  onChange={(e) => setVolume2(parseFloat(e.target.value))}
                  className="w-full h-3 bg-gray-700/50 rounded-lg appearance-none cursor-pointer slider-purple transition-all duration-200 hover:bg-gray-600/50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Controls Section */}
        <div className="space-y-5">
          {/* Mix Controls */}
          <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-5 border border-gray-600/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <h3 className="text-xl font-semibold text-white mb-4">Mix Control</h3>
            <div className="flex gap-4 justify-center">
              <button
                onClick={toggleMix}
                className={`flex items-center gap-3 px-6 py-2.5 rounded-lg font-medium text-base transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                  (isPlaying1 && isPlaying2)
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/25'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-purple-500/30'
                }`}
              >
                {(isPlaying1 && isPlaying2) ? <Square size={18} /> : <Play size={18} />}
                {(isPlaying1 && isPlaying2) ? 'Stop Mix' : 'Play Mix'}
              </button>
              
              <button
                onClick={stopAll}
                className="flex items-center gap-3 px-6 py-2.5 rounded-lg font-medium text-base bg-gray-600 hover:bg-gray-700 text-white transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg shadow-gray-500/25 hover:shadow-xl hover:shadow-gray-500/30"
              >
                <Square size={18} />
                Stop All
              </button>
            </div>
          </div>

          {/* Frequency Display */}
          <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-5 border border-gray-600/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <h4 className="text-lg font-semibold text-white mb-3">Current Mix</h4>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="text-gray-300">
                <div className="text-2xl font-bold text-blue-400 font-mono">{freq1.toFixed(1)}</div>
                <div className="text-sm font-medium">Hz (Osc 1)</div>
                <div className="mt-2">
                  <input
                    type="text"
                    value={note1Input}
                    onFocus={() => setIsEditingNote1(true)}
                    onBlur={e => {
                      setIsEditingNote1(false);
                      const freq = noteToFrequency(e.target.value);
                      if (freq !== null) {
                        updateFreq1(freq);
                        setNote1Input(frequencyToNote(freq));
                      } else {
                        setNote1Input(frequencyToNote(freq1));
                      }
                    }}
                    onChange={e => setNote1Input(e.target.value)}
                    onKeyPress={e => {
                      if (e.key === 'Enter') {
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    className="w-16 px-2 py-1 text-lg font-semibold bg-gray-700/50 border border-gray-600 rounded text-blue-300 text-center placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 hover:border-gray-500"
                    placeholder="A4"
                  />
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {getCentsDeviation(freq1) > 0 ? '+' : ''}{getCentsDeviation(freq1)} cents
                </div>
              </div>
              <div className="text-gray-300">
                <div className="text-2xl font-bold text-purple-400 font-mono">{freq2.toFixed(1)}</div>
                <div className="text-sm font-medium">Hz (Osc 2)</div>
                <div className="mt-2">
                  <input
                    type="text"
                    value={note2Input}
                    onFocus={() => setIsEditingNote2(true)}
                    onBlur={e => {
                      setIsEditingNote2(false);
                      const freq = noteToFrequency(e.target.value);
                      if (freq !== null) {
                        updateFreq2(freq);
                        setNote2Input(frequencyToNote(freq));
                      } else {
                        setNote2Input(frequencyToNote(freq2));
                      }
                    }}
                    onChange={e => setNote2Input(e.target.value)}
                    onKeyPress={e => {
                      if (e.key === 'Enter') {
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    className="w-16 px-2 py-1 text-lg font-semibold bg-gray-700/50 border border-gray-600 rounded text-purple-300 text-center placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 hover:border-gray-500"
                    placeholder="A5"
                  />
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {getCentsDeviation(freq2) > 0 ? '+' : ''}{getCentsDeviation(freq2)} cents
                </div>
              </div>
            </div>
            {Math.abs(freq1 - freq2) > 0 && (
              <div className="text-center mt-3 text-blue-300">
                <div className="text-sm font-medium font-mono">Beat frequency: {Math.abs(freq1 - freq2).toFixed(1)} Hz</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .slider-blue::-webkit-slider-thumb {
          appearance: none;
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3B82F6, #1E40AF);
          cursor: pointer;
          border: 3px solid #1E40AF;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3);
          transition: all 0.2s ease;
        }
        
        .slider-blue::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.6), 0 4px 8px rgba(0, 0, 0, 0.4);
        }
        
        .slider-blue::-webkit-slider-thumb:active {
          transform: scale(1.1);
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.8), 0 1px 2px rgba(0, 0, 0, 0.5);
        }
        
        .slider-blue::-webkit-slider-track {
          background: linear-gradient(to right, #3B82F6 0%, #3B82F6 ${(freq1 - 20) / (2000 - 20) * 100}%, #4B5563 ${(freq1 - 20) / (2000 - 20) * 100}%, #4B5563 100%);
          border-radius: 8px;
          height: 12px;
          transition: all 0.2s ease;
        }
        
        .slider-blue::-moz-range-thumb {
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3B82F6, #1E40AF);
          cursor: pointer;
          border: 3px solid #1E40AF;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3);
          transition: all 0.2s ease;
        }

        .slider-purple::-webkit-slider-thumb {
          appearance: none;
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #8B5CF6, #6D28D9);
          cursor: pointer;
          border: 3px solid #6D28D9;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3);
          transition: all 0.2s ease;
        }
        
        .slider-purple::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 6px 16px rgba(139, 92, 246, 0.6), 0 4px 8px rgba(0, 0, 0, 0.4);
        }
        
        .slider-purple::-webkit-slider-thumb:active {
          transform: scale(1.1);
          box-shadow: 0 2px 8px rgba(139, 92, 246, 0.8), 0 1px 2px rgba(0, 0, 0, 0.5);
        }
        
        .slider-purple::-webkit-slider-track {
          background: linear-gradient(to right, #8B5CF6 0%, #8B5CF6 ${(freq2 - 20) / (2000 - 20) * 100}%, #4B5563 ${(freq2 - 20) / (2000 - 20) * 100}%, #4B5563 100%);
          border-radius: 8px;
          height: 12px;
          transition: all 0.2s ease;
        }
        
        .slider-purple::-moz-range-thumb {
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #8B5CF6, #6D28D9);
          cursor: pointer;
          border: 3px solid #6D28D9;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3);
          transition: all 0.2s ease;
        }

        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
};

export default ToneMixer; 