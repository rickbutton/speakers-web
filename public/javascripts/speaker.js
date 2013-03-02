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

function recvClockSync(msg) {
  t3 = Date.now();
  
  t0 = msg.data.t0;
  t1 = msg.data.t1;
  t2 = msg.data.t2;
  
  delta = ((t1 - t0) + (t2 - t3))/2;
  console.log("calc delta, is: " + delta);
}

var timeSpan = 0;
function setupAudio() {
  context = new webkitAudioContext();
  timeSpan = context.currentTime;

}

function handleAudio(data) {
  head = new Float64Array(data, 0, 1);
  
  audioBytes = new Uint8Array(data, 8);

  i = new Zlib.Inflate(audioBytes);
  all = new Float32Array(i.decompress().buffer);
  
  console.log(avg(new Float32Array(all.buffer)));
  
  left = all.subarray(2, all.length/2 + 2);
  right = all.subarray(2 + all.length/2);
  
  var playTime = (Date.now() - head[0] - delta) / 1000 + 3;
  
  source = context.createBufferSource();
  source.connect(context.destination);
  source.buffer = context.createBuffer(2, left.length, 44100);
  source.buffer.getChannelData(0).set(left);
  source.buffer.getChannelData(1).set(right);
  source.loop = false;
  source.start(timeSpan + playTime);
  timeSpan += source.buffer.duration;
}

function avg(a) {
  sum = 0;
  for (var i = 0; i < a.length; i++)
    sum += a[i];
  return sum / a.length;
}

setInterval(function() {
  sendClockSync(ws);
}, 1000);



