var ws;
var roomId;
var context;

var dataStart = false;

$(document).ready(function() {
  roomId = $("#room").data('room');  
  setupSocket();
  
});

var delta = 0;

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
    sendClockSync(ws);
    setInterval(function() {
      sendClockSync(ws);
    }, 100);
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
        if (msg.event == 'clock.sync') {
          recvClockSync(msg);
        }
      }
    }
  }
}

function sendClockSync(ws) {
  t0 = new Date().getTime();
  msg = {
    event: 'clock.sync',
    data: {
      t0: t0
    }
  }
  ws.send(JSON.stringify(msg));
}

function sendLatencySync(ws, delta) {
  msg = {
    event: 'latency.sync',
    data: delta
  }
  ws.send(JSON.stringify(msg));
}

function recvClockSync(msg) {
  t3 = Date.now();
  
  t0 = msg.data.t0;
  t1 = msg.data.t1;
  t2 = msg.data.t2;
  
  delta = ((t1 - t0) + (t2 - t3))/2;
  //console.log("calc delta, is: " + delta);
}

var timeSpan = 0;
var startTime;
function setupAudio() {
  context = new webkitAudioContext();
  timeSpan = context.currentTime;
  startTime = Date.now();
  
  analyser = context.createAnalyser();
  analyser.connect(context.destination);
  setupVis(analyser);

}


queue = [];

var timeSpanStart = -1;

function handleAudio(data) {
  head = new Float64Array(data, 0, 4);
  audioBytes = new Uint8Array(data, 8 * 4);
  
  t0 = head[2];
  t1 = head[0];
  t2 = head[1];
  
  t = head[3];
  if (timeSpanStart == -1)
    timeSpanStart = t;

  i = new Zlib.Inflate(audioBytes);  
  all = new Float32Array(i.decompress().buffer);
  
  delta = ((t1 - t0) + (t2 - t3)) / 2;
  t3 = Date.now();
  //handleLatencySync(ws, delta);
  
  next = {
    left: all,
    //right: right,
    t0: t0,
    t1: t1,
    t2: t2,
    t3: t3,
    delta: delta,
    timeSpan: t
  };
  playQueue(next);
}

function playQueue(next) {
  source = context.createBufferSource();
  source.connect(analyser);
  source.buffer = context.createBuffer(1, next.left.length, 22050);
  source.buffer.getChannelData(0).set(next.left);
  //source.buffer.getChannelData(1).set(next.right);
  source.loop = false;
  if (true) {
    s = (context.currentTime + delta/1000);
    if (true || s > timeSpan*4) {
      console.log(s - timeSpan*4);
      source.start(s);
    } else {
      console.error("skipped");
    }
  }
  else
    console.error("skipped packet");
  timeSpan += source.buffer.duration/4;
}

