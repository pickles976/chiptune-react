import {Midi} from "@tonejs/midi";
import { Buffer } from "buffer";
import Tone, {PolySynth,Synth, NoiseSynth, Part} from "tone";
import * as options from "./options.js";

const TRACK_NUM = 4;

// Get all midi data from uploaded file
export async function getMidi() {
    const midiFile = document.getElementById('file-selector').files[0];
    const midiURL = window.URL.createObjectURL(midiFile);
    let midi = await Midi.fromUrl(midiURL);
    return midi;
}

// Save Midi from http request response object
export async function saveMidi(response){
    const myBlob = new Blob([response.data],{type: "audio/mid"})
    var midiURL = URL.createObjectURL(myBlob);
    let midi = await Midi.fromUrl(midiURL);
    return midi;
}

// Get every instrument based on their instrument number
export function getInstruments(mapping) {
    let instruments = {};
    for (let track = 0; track < TRACK_NUM; track++) {
        let index = mapping[track];
        switch(track) {
            case 3:
                // Set drum synths (percussion)
                instruments[index] = new NoiseSynth(options.noiseOptions).toDestination();
                break;
            case 2:
                // Set triangle synths (bass instruments)
                instruments[index] = new PolySynth(Synth, options.triangleOptions).toDestination();
                break;
            default:

                // Tone has a bug loading from presets, I have to do this for some reason
                let p  = new PolySynth(Synth, options.pulseOptions).toDestination();
                p.set({"oscillator" : {
                    "type" : "pulse"
                }})
                // Set pulse synths for  all else
                instruments[index] = p;
                break;
        }
    }
    return instruments
}


// Get every note for every track with notes in it
export function getNotes(midiData) {
    let notes = {}
    
    // Add notes to track if it has, otherwise leave empty
    for (let track = 0; track < midiData.tracks.length; track++) {
        notes[track] = []
        let prevNoteTime = null

        if (midiData.tracks[track].notes.length > 0) {
            midiData.tracks[track].notes.forEach(note => {
                // If percussion track has two simultaneous notes only keep one
                if (midiData.tracks[track].instrument.percussion) {
                    if (prevNoteTime !== note.time) {
                        notes[track].push({
                            time: note.time,
                            duration: note.duration,
                            note: note.name,
                            velocity: note.velocity
                        })
                    }
                    prevNoteTime = note.time
                }
                // Otherwise add notes as normal
                else {
                    notes[track].push({
                        time: note.time,
                        duration: note.duration,
                        note: note.name,
                        velocity: note.velocity
                    })
                }
                
            })
        }
    }
        
    return notes
}

// Creates Tone.js "Part" for every track that has notes, then schedules for playback
export function getParts(notes, instruments) {
    let parts = {}

    for (let track = 0; track < Object.keys(notes).length; track++) {
        if (notes[track].length) {
            parts[track] = new Part(((time, value) => {
                // Check if the track is drums/noise and leave out note names if so
                if (instruments[track].name === 'NoiseSynth') {
                    instruments[track].triggerAttackRelease(value.duration, time, value.velocity);
                } else {
                    instruments[track].triggerAttackRelease(value.note, value.duration, time, value.velocity);
                }
            }), notes[track]).start(0);
        }
    } 
}
