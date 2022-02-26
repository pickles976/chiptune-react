import './App.css';
import "./DraggableList.jsx";
import DraggableList from './DraggableList.jsx';

import React, {useEffect} from "react";
import axios from "axios";
import {Transport, Draw, getDestination} from "tone";
import { Grid, Typography, Toolbar,AppBar} from "@material-ui/core";
import { Audio } from  "react-loader-spinner";

// local files
import {getMidi, getInstruments, getNotes, getParts, saveMidi, saveMidiFromString} from "./utils/midi.js";
import {getAnalysers, allContext, drawWave, onLoad} from "./utils/visualize";

function App() {

  const MAX_TRACKS = 5;

  // Hard-coded instrumnet nums per channel
  const instrumentNums = [80,80,39,118];
  let mapping = [0,1,2,3];

  // The Global value of our MIDI object w/ channels and notes
  let midi = null;
  let instruments = [];
  let notes = [];

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
    
    // Show midi control panel
    const midistuff = document.getElementById("midistuff");
    midistuff.style.display = "block";

    // stop transport object
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

    // hide error message
    document.getElementById('channelError').style.display = "none";

    // Stop any playback and clear current song
    stop();
    Transport.cancel();
    
    // Get all the midi data
    const midiData = getMidi();    
  
    // If a midi file has been  it for playback
    midiData.then((midiData) => {

        // if midi has proper number of tracks
        if(midiData.tracks.length <= MAX_TRACKS)
        {
          midi = midiData;
          mapping = [0,1,2,3];
          instruments = getInstruments(mapping);
          notes = getNotes(midi);
          updateContext();
        }else{
          document.getElementById('channelError').style.display = "block";
        }

    })
  }

  // show loading bar
  function showbar(){
    const songRequester = document.getElementById("songRequester");
    const loadingBar = document.getElementById("loadingBar");
    loadingBar.style.display = "block";
    songRequester.style.display = "none";
  }

  // hide loading bar
  function hidebar(){
    const songRequester = document.getElementById("songRequester");
    const loadingBar = document.getElementById("loadingBar");
    loadingBar.style.display = "none";
    songRequester.style.display = "block";
  }

  // Request a MIDI from server
  function requestSong(){

    // hide error text
    document.getElementById('errorText').style.display = "none";
    showbar();

    // request generated midi song from server
    // axios.get(url,{ responseType: 'blob',Accept: "*/*", Connection: "keep-alive" }).then((response) => {
    axios.get(url).then((response) => {

      // Stop any playback and clear current song
      stop();
      Transport.cancel();

      // save midi
      // const midiData = saveMidi(response);
      const midiData = saveMidiFromString(response);

      midiData.then((midiData) => {

        midi = midiData;
        mapping = [0,1,2,3];
        instruments = getInstruments(mapping);
        notes = getNotes(midi);

        updateContext();
        hidebar();

      })
    }).catch((error) => {
      // throw error
      document.getElementById('errorText').style.display = "block";
      hidebar();
    });

  }

  // update the channel mapping based on Waveforms
  function updateMap(newMapping){
    if (midi) {
      mapping = newMapping;
      instruments = getInstruments(mapping);
      notes = getNotes(midi);
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

  // Runs once on component mount
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
          <text id="errorText" style={{display: "none", color: "rgb(1.0,0.0,0.0)"}}>Error connecting to server!</text>
      </Grid>
      <Grid item xs={6}>
        <td><label>Load a File Locally</label></td>
        <input type='file' id='file-selector' accept=".mid" onInput={loadFile}></input>
        <text id="channelError" style={{display: "none", color: "rgb(1.0,0.0,0.0)"}}>Cannot load MIDI-- too many channels!</text>
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
