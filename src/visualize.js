import {Analyser} from "tone";

let analysers = null;
let contexts = null;
// Blue, Red, Yellow, Black
let colors = {0: "#569dcb", 1: "#f9b131", 2: "#a92326", 3: "#242121"};

// Create analysers for each instrument then connect them
export function getAnalysers(instruments) {
    const allAnalysers = {};
    for (let instrument = 0; instrument < Object.keys(instruments).length; instrument ++) {
        allAnalysers[instrument] = new Analyser("waveform", 1024);
        instruments[instrument].fan(allAnalysers[instrument]);
    }

    analysers = allAnalysers;
}


// Create a context object for each insturment
export function allContext(instruments) {
  const allContexts = {};

  for (let instrument = 0; instrument < Object.keys(instruments).length; instrument ++) {
    try {
      allContexts[instrument] = document.querySelector('#wave' + instrument).getContext('2d');
    }
    catch (DOMException) {}
  }
  contexts = allContexts;
}


// Create soundwave of each instrument
export function createWave(context, values, color) {
    const canvasWidth = 250, canvasHeight = 100;

    context.clearRect(0, 0, canvasWidth, canvasHeight);
    context.beginPath();
  
    context.lineJoin = "round";
    context.lineWidth = 2;
    
  
    context.moveTo(0, (values[0] / 255) * canvasHeight);
    for (let i = 1, len = values.length; i < len; i++){
      let val = values[i];
      let x = canvasWidth * (i / len);
      let y = val * canvasHeight;
      context.lineTo(x, y);
    }
    context.stroke();
    context.strokeStyle = colors[color % 4];
  }


// Draw them all to canvas
export function drawWave() {
    requestAnimationFrame(drawWave);
    
    for (let i = 0; i < Object.keys(analysers).length; i ++) {
      createWave(contexts[i], analysers[i].getValue(), i);
    }
}
