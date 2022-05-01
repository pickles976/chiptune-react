// import './App.css';
import "./DraggableList.jsx";
import DraggableList from './DraggableList.jsx';

import React, {useEffect} from "react";
import axios from "axios";
import {Transport, Draw, getDestination} from "tone";
import { Grid, Typography, Toolbar,AppBar,InputLabel} from "@material-ui/core";
import { Audio } from  "react-loader-spinner";

// local files
import {getMidi, getInstruments, getNotes, getParts, saveMidi, saveMidiFromString} from "./utils/midi.js";
import {getAnalysers, allContext, drawWave, onLoad} from "./utils/visualize";

import "98.css";

function App() {

  const MAX_TRACKS = 5;

  // Hard-coded instrumnet nums per channel
  const instrumentNums = [80,80,39,118];
  let mapping = [0,1,2,3];
  let bpm = 120;

  // The Global value of our MIDI object w/ channels and notes
  let midi = null;
  let instruments = [];
  let notes = [];

  const url_new = "http://localhost:5000/getMidi";
  const url_shuffle = "http://localhost:5000/shuffleMidi";
  // const url = "https://vlpmiuk1fk.execute-api.us-east-2.amazonaws.com/default/midi-generator"

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

  // refreshes the Canvas Contexts for drawing, part of initialization
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

  function bpmCallback(e) {
    bpm = e.target.value;
    const bpmlabel = document.getElementById("bpmLabel");
    bpmlabel.innerHTML = "bpm: " + bpm
    Transport.bpm.value = e.target.value;
  }

  //load midifile into player
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

  // show loading bar
  function showShuffle(){
    const songRequester = document.getElementById("songShuffler");
    const loadingBar = document.getElementById("shuffleBar");
    loadingBar.style.display = "block";
    songRequester.style.display = "none";
  }

  // hide loading bar
  function hideShuffle(){
    const songRequester = document.getElementById("songShuffler");
    const loadingBar = document.getElementById("shuffleBar");
    loadingBar.style.display = "none";
    songRequester.style.display = "block";
  }

  function getRandomInt() {
    let min = Math.ceil(1000000000); // 1B
    let max = 0;
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
  }

  function randomizeSeed(){
    document.getElementById("seed").value = getRandomInt();
  }

  function axiosPost(url,data){
    axios.post(url,data,{ "Access-Control-Allow-Origin": '*', Connection: "keep-alive" }).then((response) => {

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
        hideShuffle();

      })
    }).catch((error) => {
      // throw error
      document.getElementById('errorText').style.display = "block";
      hidebar();
      hideShuffle();
    });
  }

  // Request a MIDI from server
  function requestSong(){

    // hide error text
    document.getElementById('errorText').style.display = "none";
    showbar();

    let formData = new FormData();
    formData.append('seed', document.getElementById("seed").value);

    // request generated midi song from server
    // axios.get(url,{ responseType: 'blob',Accept: "*/*", Connection: "keep-alive" }).then((response) => {
    // axios.get(url, { "Access-Control-Allow-Origin": '*', Connection: "keep-alive" }).then((response) => {
    axiosPost(url_new,formData);

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

  // lets us click a separate button
  function midiClick(){
    document.getElementById('file-selector').click();
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

  // Send our midi back to the server with constraints
  function shuffleTracks(){

    showShuffle();

    // re-shuffle midi tracks to match
    for(let i = 0; i < midi.tracks.length;i++){
      midi.tracks[i].instrument.number = instrumentNums[mapping[i]]
      midi.tracks[i].channel = 3-i
    }

    // midi to blob
    const midiBlob = new Blob([midi.toArray()]);
    let midiString = "";

    // blob to base64 string
    let reader = new FileReader();
    reader.readAsDataURL(midiBlob); 
    reader.onloadend = function() {
      midiString = reader.result; 
      console.log(midiString);
      let formData = new FormData();
      formData.append('seed', document.getElementById("seed").value);
      formData.append('midi', midiString);
      formData.append("tracks",document.getElementById("channels").value);
  
      axiosPost(url_shuffle,formData);               
    }
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
          {/* <Toolbar>
            <Typography variant="h1"
              component="div" sx={{ flexGrow: 1 }} style={{fontSize: 32}}>
              Chiptune Generator v1.1
            </Typography>
          </Toolbar> */}
          <div class="title-bar">
            <div class="title-bar-text">Chiptune Generator v1.2</div>
          </div>
      </AppBar>
    </div>
    {/* BODY */}
    <div style={{padding: "10px", alignItems: "center"}}>
    <Grid container spacing={2}>
      <Grid item xs={1}>
          <div id="songRequester">
            <td><label>Generate A Song</label></td>
            <button onClick={requestSong}>Generate</button>
          </div>
          <div id="loadingBar" style={{display: "none"}}>
            <div class="status-bar">
              <p class="status-bar-field" id="loading-text">Your song is loading</p>
            </div>
          </div>
          <text id="errorText" style={{display: "none", color: "rgb(1.0,0.0,0.0)"}}>Error connecting to server!</text>
      </Grid>
      <Grid item xs={5}>
        <div>
              <td><label for="seed">Seed</label></td>
              <input type="number" id="seed" name="seed" defaultValue={getRandomInt()}/>
              <button onClick={randomizeSeed}>Random</button>
        </div>
      </Grid>
      <Grid item xs={6}>
        <td><label>Load a File Locally</label></td>
        <button onClick={midiClick}>File Upload</button>
        <text id="channelError" style={{display: "none", color: "rgb(1.0,0.0,0.0)"}}>Cannot load MIDI-- too many channels!</text>
      </Grid>
    </Grid>
    <Grid container spacing={2} id="midistuff" style={{display: "none"}}>
      <Grid item xs={12} style={{ display: "flex", justifyContent: "flex-start", spacing: 20 }}>
        <button onClick={playPause}>Play</button>
        <button onClick={stop}>Stop</button>
        <div>
          <InputLabel style={{textAlign: 'center'}}>volume</InputLabel>
          <input type="range" min="-60" max="0" defaultValue="-15" class="slider" id="volSlider" onInput={volumeCallback} />
        </div>
        <div>
          <InputLabel id="bpmLabel" style={{textAlign: 'center'}}>bpm: {bpm}</InputLabel>
          <input type="range" min="60" max="240" defaultValue="120" class="slider" id="bpmSlider" onInput={bpmCallback} />
        </div>
      </Grid>
      <Grid item xs={12}>
        <DraggableList id="scope" length={4} callback={updateMap}/>
      </Grid>
      <Grid item xs={12}>
        Drag and Drop the channels to switch waveforms
      </Grid>
      <Grid item xs={12}> 
        <select id="channels" name="channels">
          <option selected="">0</option>
          <option>1</option>
          <option>2</option>
          <option>3</option>
        </select>
        Number of waveforms to keep. Starting with first on the left.
      </Grid>
      <Grid item xs={12}>
        <div id="songShuffler">
            <td><label>Generate new Tracks</label></td>
            <button onClick={shuffleTracks}>Generate</button>
        </div>
        <div id="shuffleBar" style={{display: "none"}}>
          <div class="status-bar">
            <p class="status-bar-field" id="loading-text">Your song is loading</p>
          </div>
        </div>
      </Grid>
      <Grid item xs={12}>
        <button onClick={downloadMidi}>Download</button>
      </Grid>
    </Grid>
    </div>
    {/* file upload dialog */}
    <input type='file' id='file-selector' accept=".mid" onInput={loadFile} style={{display: "none"}}></input>
    </>
  );
}

export default App;
