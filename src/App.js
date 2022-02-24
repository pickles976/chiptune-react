import './App.css';
import React, {useEffect} from "react";
import "./DraggableList.jsx";
import DraggableList from './DraggableList.jsx';
import {Buffer} from 'buffer';
import axios from "axios";
import {Transport, Draw, getDestination} from "tone";
import {getMidi, getInstruments, getNotes, getParts, saveMidi} from "./midi.js";
import {getAnalysers, allContext, drawWave, onLoad} from "./visualize";
import { Grid, Typography, Toolbar, Button, IconButton, AppBar, Input, InputLabel} from "@material-ui/core";
import { Audio } from  "react-loader-spinner";

function App() {

  let instrumentNums = [80,80,39,118];
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

    const midistuff = document.getElementById("midistuff");
    console.log(midistuff)
    midistuff.style.display = "block";

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

  function volumeCallback(e) {
    getDestination().volume.value = e.target.value;
  }

  //load midifile
  function loadFile() {

    // Stop any playback and clear current song
    stop();
    Transport.cancel();
    
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

  function showbar(){
    // show loading bar
    const songRequester = document.getElementById("songRequester");
    const loadingBar = document.getElementById("loadingBar");
    loadingBar.style.display = "block";
    songRequester.style.display = "none";
  }

  function hidebar(){
    // show loading bar
    const songRequester = document.getElementById("songRequester");
    const loadingBar = document.getElementById("loadingBar");
    loadingBar.style.display = "none";
    songRequester.style.display = "block";
  }

  function requestSong(){

    showbar();

    axios.get(url,{ responseType: 'blob',Accept: "*/*", Connection: "keep-alive" }).then((response) => {

      // Stop any playback and clear current song
      stop();
      Transport.cancel();

      const midiData = saveMidi(response);

      midiData.then((midiData) => {

        midi = midiData;
        mapping = [0,1,2,3];
        instruments = getInstruments(midi,mapping);
        notes = getNotes(midi);

        updateContext();
        hidebar();

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

  useEffect(() => {
    // call initializers
    onLoad();
    getDestination().volume.value = document.getElementById('volSlider').value;
  },[])

  return (
    <>
    {/* HEADER */}
    <div>
      <AppBar position="static">
          <Toolbar>
            <Typography variant="h6"
              component="div" sx={{ flexGrow: 1 }}>
              Chiptune Generator v1.0
            </Typography>
          </Toolbar>
      </AppBar>
    </div>
    {/* BODY */}
    <div style={{padding: "10px", alignItems: "center"}}>
    <Grid container spacing={2}>
      <Grid item xs={6}>
          <div id="songRequester">
            <td><label>Generate A Song</label></td>
            <button onClick={requestSong}>Generate</button>
          </div>
          <div id="loadingBar" style={{display: "none"}}>
            <Audio color="#00BFFF" height={60} width={60}/>
          </div>
      </Grid>
      <Grid item xs={6}>
        <td><label>Load a File Locally</label></td>
        <input type='file' id='file-selector' accept=".mid" onInput={loadFile}></input>
      </Grid>
    </Grid>
    <Grid container spacing={2} id="midistuff" style={{display: "none"}}>
      <Grid item xs={12}>
        <button onClick={playPause}>Play</button>
        <button onClick={stop}>Stop</button>
        <input type="range" min="-60" max="0" defaultValue="-15" class="slider" id="volSlider" onInput={volumeCallback}></input>
      </Grid>
      <Grid item xs={12}>
        <DraggableList id="scope" length={4} callback={updateMap}/>
      </Grid>
      <Grid item xs={12}>
        <Typography variant="h6" 
            component="div" sx={{ flexGrow: 1 }}>
            Drag and Drop the channels to switch waveforms
          </Typography>
      </Grid>
      <Grid item xs={12}>
        <button onClick={downloadMidi}>Download</button>
      </Grid>
    </Grid>
    </div>
    </>
  );
}

export default App;
