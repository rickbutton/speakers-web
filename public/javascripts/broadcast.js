var ws;
var streamEnabled = false;

$(document).ready(function() {
  
  roomId = $("#room").data('room');
  
  host = window.document.location.host.replace(/:.*/, '');
  ws = new WebSocket('ws://' + host + ':' + window.location.port);
  ws.onopen = function() {
    msg = {
      event: 'broadcast',
      room: roomId
    }
    ws.send(JSON.stringify(msg));
  }
  ws.onclose = function() {

  }
  ws.onmessage = function(event, flags) {
    msg = JSON.parse(event.data);
    if ('event' in msg) {
      if (msg.event == 'broadcast.error') {
        alert("Cannot use room " + roomId + ". " + msg.reason);
      }
      if (msg.event == 'broadcast.success') {
        setupAudio();
      }
    }
  }
  
  $("#toggle").click(toggleStream);
  
});

function setupAudio() {
  navigator.getUserMedia = (navigator.getUserMedia ||
                            navigator.webkitGetUserMedia ||
                            navigator.mozGetUserMedia ||
                            navigator.msGetUserMedia);
  
  navigator.getUserMedia({audio:true, video:false}, function(stream) {
    
    context = new webkitAudioContext();
    analyser = context.createAnalyser();
    setupVis(analyser);
    
    
    node = context.createScriptProcessor(4096*4, 1, 1);
    node.connect(context.destination);
    
    mediaSS = context.createMediaStreamSource(stream);
    mediaSS.connect(analyser);
    
    analyser.connect(node);
    
        
    node.onaudioprocess = onGotAudio;
    
  }, function(err) {
    
  });
}

timeSpan = 0;
function onGotAudio(event) {
  
  r = new Resampler(44100, 22050, 1, 4096*2, false);
  left  = event.inputBuffer.getChannelData(0);
  
  timeSpan += left.length / 44100;
  console.log(timeSpan);
  
  newLeft = r.resampler(left);
    
  
  mixed = newLeft;
  
  
  opts = {
    compressionType: Zlib.Deflate.CompressionType.DYNAMIC
  }
  compressed = new Zlib.Deflate(new Uint8Array(mixed.buffer), opts).compress();
  
  buf = compressed.buffer;
  
  container = new ArrayBuffer(16 + compressed.length);
  a64 = new Float64Array(container, 0, 2);
  a8 = new Uint8Array(container);
  a8.set(compressed, 16);
  t0 = Date.now();
  a64[0] = t0;
  a64[1] = timeSpan;
  
  
  
  
  ws.send(new Uint8Array(container));
}

function toggleStream() {
  streamEnabled = !streamEnabled;
  if (streamEnabled) {
    $("#toggle").text("Stop");
    $("#status").text("Status: Started");
  }
  else {
    $("#toggle").text("Start");
    $("status").text("Status: Stopped");
  }
}
