var ws;

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
  
});

function setupAudio() {
  navigator.getUserMedia = (navigator.getUserMedia ||
                            navigator.webkitGetUserMedia ||
                            navigator.mozGetUserMedia ||
                            navigator.msGetUserMedia);
  
  navigator.getUserMedia({audio:true, video:false}, function(stream) {
    
    context = new webkitAudioContext();
    
    node = context.createScriptProcessor(4096, 1, 1);
    node.connect(context.destination);
    
    mediaSS = context.createMediaStreamSource(stream);
    mediaSS.connect(node);
      
        
    node.onaudioprocess = onGotAudio;
    
  }, function(err) {
    
  });
}

function onGotAudio(event) {
  r = new Resampler(44100, 22050, 1, 2048, false);
  left  = event.inputBuffer.getChannelData(0);
  
  newLeft = r.resampler(left);
    
  
  mixed = newLeft;
  
  
  opts = {
    compressionType: Zlib.Deflate.CompressionType.DYNAMIC
  }
  compressed = new Zlib.Deflate(new Uint8Array(mixed.buffer), opts).compress();
  
  buf = compressed.buffer;
  
  container = new ArrayBuffer(8 + compressed.length);
  a64 = new Float64Array(container, 0, 1);
  a8 = new Uint8Array(container);
  a8.set(compressed, 8);
  console.log(compressed[0]);
  t0 = Date.now();
  a64[0] = t0;
  
  
  
  
  ws.send(new Uint8Array(container));
}



function concat(a, b) {
  var l = a.length;
  var r = new Float32Array(a.length + b.length);
  r.set(a);
  r.set(b, l);
  return r;
}

function avg(a) {
  sum = 0;
  for (var i = 0; i < a.length; i++)
    sum += a[i];
  return sum / a.length;
}

