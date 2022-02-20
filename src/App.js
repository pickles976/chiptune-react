import logo from './logo.svg';
import './App.css';
import React, {useEffect, useState} from "react";
import {DragDropContext,Droppable,Draggable} from "react-beautiful-dnd";
import {Midi} from "@tonejs/midi";
import "./DraggableList.jsx";
import DraggableList from './DraggableList.jsx';
import axios from "axios";

import {Transport, Draw, getDestination} from "tone";
import {getMidi, getInstruments, getNotes, getParts} from "./midi.js";
import {getAnalysers, allContext, drawWave} from "./visualize";
import { Tone } from 'tone/build/esm/core/Tone';

function App() {

  let instrumentNums = [81,81,40,119];
  let perc = [false,false,false,true];
  let instrument = {                   // and object representing the program change events
    number : 81,              // the instrument number 0-127
    family: "Lead",               // the family of instruments, read only.
    name : "Synth",                // the name of the instrument
    percussion: false          // if the instrument is a percussion instrument
  }

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

  function downloadMidi(){
    midi.tracks.forEach((track,index) => {
      let temp = instrument;
      temp.number = instrumentNums[mapping[index]];
      temp.percussion = perc[mapping[index]];
      midi.tracks[index].instrument = temp;
    })
    let temp = midi.toArray();
    // TODO: Node.js server to save off data
    // console.log(new Midi(temp))
    axios.post('https://localhost:8000/postMidi', midi.toArray()).then(response => console.log(response));
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
