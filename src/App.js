import './App.css';
import React from "react";
import "./DraggableList.jsx";
import DraggableList from './DraggableList.jsx';
import {Buffer} from 'buffer';
import axios from "axios";
import {Transport, Draw, getDestination} from "tone";
import {getMidi, getInstruments, getNotes, getParts, saveMidi} from "./midi.js";
import {getAnalysers, allContext, drawWave} from "./visualize";

function App() {

  const headers =   {
        "User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:74.0) Gecko/20100101 Firefox/74.0",
        "Host": "www.my-url.com",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "fr,en;q=0.7,de;q=0.3",
        "Accept-Encoding": "gzip, deflate, br",
        "Referer": "https://www.my-url.com/",
        "DNT": "1",
        "Connection": "keep-alive",
        "Cookie": "JSESSIONID=345619E4B9164E346E099B23C2EA1762-mc5.koeb46-5_i01_1001; rbzid=DcpM4PC9zel6z+f6GAv5kAymylqw001/v299Eg/jfmAzp/jIzSZxjje6++LdfAPK5HlgwAtqDhYScjobif3t21F4I0MqlMIWC7WE61suzUrkmWGJiRvZE2iVsxOZTdeCYI8kt9yAltmgj5v+lz2+SY1rmnKSkCEiV/VfMZ5aaDZT/1WnWRZ/7HXIM5yRd+uzcG4SpJylPSwrNlEF4Z03GURur6nao2uLMV727hBs0GH5dW4run3KoQGS+GbTV4zBifAKIkqyhKoDlVP70w13z3jg5HOdDihROWDG0hROP4jVzbY92gYYQp11AkPhVJtn; rbzsessionid=aa17403285c68f873066a34ca3967ddf;",
        "Upgrade-Insecure-Requests": "1",
        "Cache-Control": "max-age=0",
        "Content-Type": "application/x-www-form-urlencoded",
      }

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

  const url = "http://localhost:5000/getMidi"

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

  function requestSong(){

    axios.get(url,{ responseType: 'blob',Accept: "*/*", Connection: "keep-alive" }).then((response) => {

      // Stop any playback and clear current song
      stop();
      Transport.cancel();
    
      // Set initial volume
      getDestination().volume.value = 1.0;
      const midiData = saveMidi(response);

      midiData.then((midiData) => {

        midi = midiData;
        mapping = [0,1,2,3];
        instruments = getInstruments(midi,mapping);
        notes = getNotes(midi);

        updateContext();

      })
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
      <button onClick={requestSong}>Generate Song</button>
      <button onClick={playPause}>Play</button>
      <button onClick={stop}>Stop</button>
      <DraggableList length={4} callback={updateMap}/>
      <button onClick={downloadMidi}>Download</button>
    </div>
  );
}

export default App;
