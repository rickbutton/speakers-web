var ws;
var roomId;
var context;

var dataStart = false;

$(document).ready(function() {
  roomId = $("#room").data('room');  
  setupSocket();
  
});

function setupSocket() {
  host = window.document.location.host.replace(/:.*/, '');
  ws = new WebSocket('ws://' + host + ':' + window.location.port);
  ws.binaryType = "arraybuffer";
  ws.onopen = function() {
    msg = {
      event: 'speaker',
      room: roomId
    }
    ws.send(JSON.stringify(msg));
  }
  ws.onclose = function() {

  }
  ws.onmessage = function(event, flags) {
    if (event.data instanceof ArrayBuffer) {
      if (!dataStart) {
        console.log("Started data receiving");
        dataStart = true;
      }
      handleAudio(event.data);
    } else {
      msg = JSON.parse(event.data);
      if ('event' in msg) {
        if (msg.event == 'speaker.error') {
          alert("Cannot use room " + roomId + ". " + msg.reason);
        }
        if (msg.event == 'speaker.success') {
          setupAudio();
        }
      }
    }
  }
}

var timeSpan = 0;
function setupAudio() {
  context = new webkitAudioContext();
  timeSpan = context.currentTime;

}

function handleAudio(data) {
  all = new Float32Array(data);
  left = all.subarray(0, all.length/2);
  right = all.subarray(all.length/2);
  
  source = context.createBufferSource();
  source.connect(context.destination);
  source.buffer = context.createBuffer(2, left.length, 44100);
  source.buffer.getChannelData(0).set(left);
  source.buffer.getChannelData(1).set(right);
  source.loop = false;
  source.start(timeSpan + 3);
  timeSpan += source.buffer.duration;
}



