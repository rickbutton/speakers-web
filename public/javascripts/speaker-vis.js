function setupVis(analyser) {
  (function() {
  CanvasRenderingContext2D.prototype.line = function(x1, y1, x2, y2) {
    this.lineCap = 'round';
    this.beginPath();
    this.moveTo(x1, y1);
    this.lineTo(x2, y2);
    this.closePath();
    this.stroke();
  }
  CanvasRenderingContext2D.prototype.circle = function(x, y, r, fill_opt) {
    this.beginPath();
    this.arc(x, y, r, 0, Math.PI * 2, true);
    this.closePath();
    if (fill_opt) {
      this.fillStyle = 'rgba(0,0,0,1)';
      this.fill();
      this.stroke();
    } else {
      this.stroke();
    }
  }
  CanvasRenderingContext2D.prototype.rectangle = function(x, y, w, h, fill_opt) {
    this.beginPath();
    this.rect(x, y, w, h);
    this.closePath();
    if (fill_opt) {
      this.fillStyle = 'rgba(0,0,0,1)';
      this.fill();
    } else {
      this.stroke();
    }
  }
  CanvasRenderingContext2D.prototype.triangle = function(p1, p2, p3, fill_opt) {
    // Stroked triangle.
    this.beginPath();
    this.moveTo(p1.x, p1.y);
    this.lineTo(p2.x, p2.y);
    this.lineTo(p3.x, p3.y);
    this.closePath();
    if (fill_opt) {
      this.fillStyle = 'rgba(0,0,0,1)';
      this.fill();
    } else {
      this.stroke();
    }
  }
  CanvasRenderingContext2D.prototype.clear = function() {
    this.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
  }

  // var canvas = document.getElementById('playbutton');
  // var ctx = canvas.getContext('2d');
  // ctx.lineWidth = 4;
  // 
  // var R = canvas.width / 2;
  // var STROKE_AND_FILL = false;
  // 
  // canvas.addEventListener('mouseover', function(e) {
  //   if (this.classList.contains('playing')) {
  //     drawPauseButton(STROKE_AND_FILL);
  //   } else {
  //     drawPlayButton(STROKE_AND_FILL);
  //   }
  //   ctx.save();
  //   ctx.lineWidth += 3;
  //   ctx.circle(R, R, R - ctx.lineWidth + 1);
  //   ctx.restore();
  // }, true);

  // canvas.addEventListener('mouseout', function(e) {
  //   if (this.classList.contains('playing')) {
  //     drawPauseButton(STROKE_AND_FILL);
  //   } else {
  //     drawPlayButton(STROKE_AND_FILL);
  //   }
  // }, true);
  // 
  // canvas.addEventListener('click', function(e) {
  //   this.classList.toggle('playing');
  //   if (this.classList.contains('playing')) {
  //     drawPauseButton(STROKE_AND_FILL);
  //     //audio.play();
  //   } else {
  //     drawPlayButton(STROKE_AND_FILL);
  //     //audio.pause();
  //   }
  // }, true);

  // function drawPlayButton(opt_fill) {
  //     ctx.clear();
  //     ctx.circle(R, R, R - ctx.lineWidth + 1, opt_fill);
  //     ctx.triangle({x: R*0.8, y: R*0.56}, {x: R*1.45, y: R}, {x: R*0.8, y: R*1.45}, true);
  //   }
  // 
  //   function drawPauseButton(opt_fill) {
  //     ctx.clear();
  //     ctx.circle(R, R, R - ctx.lineWidth + 1, opt_fill);
  //     ctx.save();
  //     ctx.lineWidth += 4;
  //     ctx.line(R*0.8, R/2, R*0.8, R*1.5);
  //     ctx.line(R+(R/5), R/2, R+(R/5), R*1.5);
  //     ctx.restore();
  //   }
  //   drawPlayButton(STROKE_AND_FILL);

  // window.playButton = canvas;
  })();

  (function() {
  var canvas = document.getElementById('fft');
  var ctx = canvas.getContext('2d');
  canvas.width = document.body.clientWidth / 1.4;

  var canvas2 = document.getElementById('fft2');
  var ctx2 = canvas2.getContext('2d');
  canvas2.width = canvas.width;

  const CANVAS_HEIGHT = canvas.height;
  const CANVAS_WIDTH = canvas.width;


  var currenTimeNode = document.querySelector('#current-time');
  

  // Check for non Web Audio API browsers.
  if (!window.webkitAudioContext) {
    alert("Web Audio isn't available in your browser. But...you can still play the HTML5 audio :)");
    document.querySelector('#myaudio').classList.toggle('show');
    document.querySelector('aside').style.marginTop = '7em';
    return;
  }
  
  function rafCallback(time) {
    window.webkitRequestAnimationFrame(rafCallback, canvas);

    var freqByteData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(freqByteData); //analyser.getByteTimeDomainData(freqByteData);

    var SPACER_WIDTH = 10;
    var BAR_WIDTH = 5;
    var OFFSET = 100;
    var CUTOFF = 23;
    var numBars = Math.round(CANVAS_WIDTH / SPACER_WIDTH);

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = '#F6D565';
    ctx.lineCap = 'round';

    ctx2.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx2.fillStyle = '#3A5E8C';
    ctx2.lineCap = 'round';

    // Draw rectangle for each frequency bin.
    /*for (var i = 0; i < numBars / 2 - CUTOFF; ++i) {
      var magnitude = freqByteData[i + OFFSET];
      ctx.fillRect(i * SPACER_WIDTH, CANVAS_HEIGHT, BAR_WIDTH, -magnitude);
    }
    for (var i = numBars / 2 + CUTOFF; i < numBars; ++i) {
      var magnitude = freqByteData[i + OFFSET];
      ctx2.fillRect(i * SPACER_WIDTH, CANVAS_HEIGHT, BAR_WIDTH, -magnitude);
    }*/
    for (var i = 0; i < numBars; ++i) {
      var magnitude = freqByteData[i + OFFSET];
      ctx.fillRect(i * SPACER_WIDTH, CANVAS_HEIGHT, BAR_WIDTH, -magnitude);
      ctx2.fillRect(i * SPACER_WIDTH, CANVAS_HEIGHT, BAR_WIDTH, -magnitude);
    }
  }

  rafCallback();

  })();

  window.addEventListener('keydown', function(e) {
    if (e.keyCode == 32) { // space
      // Simulate link click on an element.
      var evt = document.createEvent('Event');
      evt.initEvent('click', false, false);
      window.playButton.dispatchEvent(evt);
    }
  }, false);
};