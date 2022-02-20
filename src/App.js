import './App.css';
import React from "react";
import "./DraggableList.jsx";
import DraggableList from './DraggableList.jsx';
import {Buffer} from 'buffer';
import axios from "axios";
import {Transport, Draw, getDestination} from "tone";
import {getMidi, getInstruments, getNotes, getParts} from "./midi.js";
import {getAnalysers, allContext, drawWave} from "./visualize";

function App() {

  let instrumentNums = [80,80,39,118];
  // let instrumentNames = ["synth lead", "synth lead", "strings", "percussive"]
  // let instrument = {                   // and object representing the program change events
  //   family: "Lead",               // the family of instruments, read only.
  //   number : 81,              // the instrument number 0-127
  //   name : "Synth"                // the name of the instrument
  // }

  let instruments = [];
  let notes = [];
  let mapping = [0,1,2,3];
  let midi = null;

  // stop playback
  function stop() {
    Transport.stop();
  }
  
  // Start playback
  function playPause() {
    if (Transport.state === 'started') {
        Transport.pause();
    }
    else {
        Transport.start()
    }  
  }

  function updateContext(){

    Transport.cancel();

    // Load and schedule each part for tracks that have notes
    getAnalysers(instruments,mapping);
    allContext(instruments);
    getParts(notes, instruments);

    // Schedule drawing to take place as soon as playback starts
    Transport.schedule((time) => {
      Draw.schedule(() => { 
          drawWave();
        }, time);
    });
  }

  //load midifile
  function loadFile() {

    // Stop any playback and clear current song
    stop();
    Transport.cancel();
  
    // Set initial volume
    getDestination().volume.value = 1.0;
    
    // Get all the midi data
    const midiData = getMidi();    
  
    // If a midi file has been  it for playback
    midiData.then((midiData) => {

        midi = midiData;
        mapping = [0,1,2,3];
        instruments = getInstruments(midi,mapping);
        notes = getNotes(midi);

        updateContext();

    })
  }

  function updateMap(newMapping){
    if (midi) {
      mapping = newMapping;
      instruments = getInstruments(midi,mapping);
      notes = getNotes(midi);
      // Transport.cancel();
      updateContext();
    }
  }

  // download the midi
  function downloadMidi(){
    console.log(midi)

    for(let i = 0; i < midi.tracks.length;i++){
      midi.tracks[i].instrument.number = instrumentNums[mapping[i]]
      midi.tracks[i].channel = 3-i
    }
    const url = window.URL.createObjectURL(new Blob([midi.toArray()]));
    const link = document.createElement('a');
    link.href = url;
    // TODO: Allow user to name their song
    link.setAttribute('download', 'song.mid');
    document.body.appendChild(link);
    link.click();
  }

  return (
    <div>
      <input type='file' id='file-selector' accept=".mid" onInput={loadFile}></input>
      <button onClick={playPause}>Play</button>
      <button onClick={stop}>Stop</button>
      <DraggableList length={4} callback={updateMap}/>
      <button onClick={downloadMidi}>Download</button>
    </div>
  );
}

export default App;
