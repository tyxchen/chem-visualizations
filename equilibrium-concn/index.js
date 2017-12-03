(function(){
  var $ = document.querySelector.bind(document);

  var inputA = $('#inputA'),
      inputB = $('#inputB'),
      inputC = $('#inputC'),
      btnChange = $('#change'),
      btnReset = $('#reset');

  var canvas = $('canvas'),
      ctx = canvas.getContext('2d');

  var state = {
    A: 5,
    B: 3,
    C: 1,
    K: 2.857142857,
    x: 50,
    count: 0,
    curveA: null,
    curveB: null,
    curveC: null,
    isCurve: false,
    animFrame: null
  };

  // A <-> B + C
  function calQ() {
    return state.B*state.C/state.A;
  }

  function molsToPx(n) {
    return 100*n;
  }

  function pxToMols(p) {
    return p/100;
  }

  function solveChange(newA, newB, newC) {
    if (newA === null || newA === undefined || 
        newB === null || newB === undefined || 
        newC === null || newC === undefined) {
      newA = state.A;
      newB = state.B;
      newC = state.C;
    }
    
    var x1 = (-(newB+newC+state.K)+Math.sqrt((newB+newC+state.K)*(newB+newC+state.K)-4*(newB*newC-state.K*newA)))/2,
        x2 = (-(newB+newC+state.K)-Math.sqrt((newB+newC+state.K)*(newB+newC+state.K)-4*(newB*newC-state.K*newA)))/2;

    if ((newA-x1)<0) {
      return x2;
    } else {
      return x1;
    }
  }

  function createNewCurve(start, dx, mult) {
    start = molsToPx(start);
    dx = molsToPx(dx);

    var t = Math.floor(Math.E*Math.abs(dx)), i = 0, innerState = [];

    while (i < t) {
      //yield start + (dx/(Math.expm1(-300/72)))*Math.expm1(-(Math.abs(dx)*i++)/(72*Math.E))*mult;
      //yield pxToMols(start + (dx/Math.log1p((Math.abs(dx)*Math.abs(dx))/40))*Math.log1p((Math.abs(dx)*i++)/(40*Math.E))*mult);
      innerState.push(pxToMols(start + (dx/Math.log((Math.abs(dx)*Math.abs(dx))/40+1))*Math.log((Math.abs(dx)*i++)/(40*Math.E)+1)*mult));
    }
    innerState.push(pxToMols(start + dx * mult));

    return {
      next: function() {
        return {
          value: innerState.shift(),
          done: innerState.length > 0
        }
      }
    }
  }

  function moveTo(x, y) {
    ctx.moveTo(x, canvas.height - y);
  }
  function lineTo(x, y) {
    ctx.lineTo(x, canvas.height - y);
  }

  function updateStats() {
    $('#statA').querySelector('a').textContent = state.A.toFixed(3);
    $('#statB').querySelector('a').textContent = state.B.toFixed(3);
    $('#statC').querySelector('a').textContent = state.C.toFixed(3);
    $('#statQ').querySelector('a').textContent = calQ().toFixed(3);
    $('#statK').querySelector('a').textContent = state.K.toFixed(3);
    $('#statE').querySelector('span').innerHTML = (calQ() - state.K > 0) ? '&larr;' : '&rarr;';
    $('#statE').querySelector('input').value = calQ() - state.K;
  }

  function stroke(sstate) {
    if (!sstate.hasOwnProperty('offset')) sstate.offset = 1;
    ctx.save();
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.strokeStyle = 'red';
    moveTo(state.x, molsToPx(sstate.A));
    lineTo(state.x+sstate.offset, molsToPx(state.A));
    ctx.stroke();
    ctx.beginPath();
    ctx.strokeStyle = 'green';
    moveTo(state.x, molsToPx(sstate.B));
    lineTo(state.x+sstate.offset, molsToPx(state.B));
    ctx.stroke();
    ctx.beginPath();
    ctx.strokeStyle = 'blue';
    moveTo(state.x, molsToPx(sstate.C));
    lineTo(state.x+sstate.offset, molsToPx(state.C));
    ctx.stroke();
    ctx.restore();
  }

  function drawTime(s, ox, oy, p) {
    if (ox === null || ox === undefined) ox = 2;
    if (oy === null || oy === undefined) oy = 3;
    ctx.font = '12px monospace';
    ctx.fillText((state.count / 100).toFixed(p) + (s ? 's' : ''), state.x + ox, canvas.height - oy);
  }

  function draw(anim) {
    var oldA = state.A,
        oldB = state.B,
        oldC = state.C;

    if (state.x >= canvas.width - 80) {
      ctx.save();
      ctx.globalCompositeOperation = 'copy';
      ctx.translate(-1, 0);
      ctx.drawImage(canvas, 0, 0);
      ctx.restore();
    } else {
      state.x++;
    }

    if (state.count % 100 === 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-over';
      ctx.fillStyle = '#ccc';
      ctx.fillRect(state.x, 0, 1, canvas.height);
      ctx.fillStyle = '#888';
      drawTime();
      ctx.restore();
    }

    if (state.isCurve) {
      var valA = state.curveA.next().value,
          valB = state.curveB.next().value,
          valC = state.curveC.next().value;

      if (valA !== undefined && valB !== undefined && valC !== undefined) {
        state.A = valA;
        state.B = valB;
        state.C = valC;

        updateStats();
      } else {
        ctx.save();
        ctx.fillStyle = 'purple';
        ctx.fillRect(state.x, 0, 1, canvas.height);
        drawTime(true, null, 18, 2);
        ctx.restore();
        $('#statE').querySelector('span').innerHTML = '&#8652';
        state.isCurve = false;
      }
    }

    stroke({
      A: oldA,
      B: oldB,
      C: oldC
    });

    state.count++;

    ctx.save();
    ctx.clearRect(0, 0, 50, canvas.height);
//    ctx.clearRect(canvas.width - 130, 0, 130, canvas.height);
    ctx.fillStyle = '#555';
    ctx.font = '12px monospace';

    ctx.fillRect(50, 0, 1, canvas.height);
    ctx.fillRect(50, canvas.height - 1, canvas.width - 130, 1);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Concentration (mol/L)", -canvas.height/2 - 75, 30);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    ctx.fillStyle = '#888';
    ctx.fillText('0', 40, canvas.height - 6);
    for (var i=1; i<pxToMols(canvas.height); i++) {
      ctx.fillText(i, 40, canvas.height - molsToPx(i));
    }
    ctx.restore();

    if (anim)
      state.animFrame = requestAnimationFrame(draw);
  }

  function onChange() {
    var setDisabled = function(a, b) {
      a.disabled = true;
      b.disabled = true;
    }, value = parseFloat(this.value);

    switch (this.id) {
    case 'inputA':
      setDisabled(inputB, inputC);
      break;
    case 'inputB':
      setDisabled(inputA, inputC);
      break;
    case 'inputC':
      setDisabled(inputA, inputB);
      break;
    }

    this.previousElementSibling.firstElementChild.textContent = (value>0?'+':'') + value.toFixed(1);
    btnChange.disabled = false;
    btnReset.disabled = false;
  }

  function mousedown() {
    if (!this.disabled) this.classList.add('active');
  }

  function mousemove() {
    if (this.classList.contains('active')) {
      onChange.call(this);
    }
  }

  function mouseup() {
    this.classList.remove('active');
    if (parseFloat(this.value) == 0)
      setTimeout(reset, 1);
  }

  function keyup() {
    onChange.call(this);
    if (parseFloat(this.value) == 0)
      reset();
  }

  function reset() {
    inputA.value = 0.0; //state.A;
    inputA.disabled = false;
    inputA.previousElementSibling.firstElementChild.textContent = '0.0';
    inputB.value = 0.0; //state.B;
    inputB.disabled = false;
    inputB.previousElementSibling.firstElementChild.textContent = '0.0';
    inputC.value = 0.0; //state.C;
    inputC.disabled = false;
    inputC.previousElementSibling.firstElementChild.textContent = '0.0';
    btnChange.disabled = true;
    btnReset.disabled = true;
  };

  canvas.onclick = function() {
    inputA.disabled = false;
    inputB.disabled = false;
    inputC.disabled = false;

    ctx.clearRect(canvas.width/2 - 43, canvas.height/2 - 53, 86, 106);
    draw(true);

    canvas.onclick = function() {
      if (state.animFrame) {
        cancelAnimationFrame(state.animFrame);
        state.animFrame = null;
      } else {
        draw(true);
      }
    };
  };

  inputA.onmousedown = mousedown;
  inputA.onmousemove = mousemove;
  inputA.onmouseup = mouseup;
  inputA.onkeyup = keyup;

  inputB.onmousedown = mousedown;
  inputB.onmousemove = mousemove;
  inputB.onmouseup = mouseup;
  inputB.onkeyup = keyup;

  inputC.onmousedown = mousedown;
  inputC.onmousemove = mousemove;
  inputC.onmouseup = mouseup;
  inputC.onkeyup = keyup;
  
  btnChange.onclick = function(e) {
    e.preventDefault();

    var oldA = state.A,
        oldB = state.B,
        oldC = state.C;

    state.A += parseFloat(inputA.value);
    state.B += parseFloat(inputB.value);
    state.C += parseFloat(inputC.value);

    if (state.A < 0) state.A = 0;
    if (state.B < 0) state.B = 0;
    if (state.C < 0) state.C = 0;

    var x = solveChange();

    console.log('dx', x);

    state.curveA = createNewCurve(state.A, x, -1);
    state.curveB = createNewCurve(state.B, x, 1);
    state.curveC = createNewCurve(state.C, x, 1);

    ctx.save();
    ctx.fillStyle = 'orange';
    ctx.fillRect(state.x, 0, 1, canvas.height);
    drawTime(true, null, 30, 2);
    ctx.restore();

    stroke({
      A: oldA,
      B: oldB,
      C: oldC,
      offset: 0
    });

    console.log('change')

    state.isCurve = true;

    if (!state.animFrame) {
      draw(true);
    }

    reset();
  };

  btnReset.onclick = function(e) {
    e.preventDefault();
    reset();
  };

  canvas.height = window.innerHeight - 40 - parseInt(window.getComputedStyle(canvas, null).fontSize);
  canvas.width = window.innerWidth - 320;

  state.curveA = createNewCurve(state.A, solveChange(), -1);
  state.curveB = createNewCurve(state.B, solveChange(), 1);
  state.curveC = createNewCurve(state.C, solveChange(), 1);
  state.isCurve = true;

  ctx.save();
  ctx.strokeStyle = '#555';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(canvas.width/2 - 40, canvas.height/2);
  ctx.lineTo(canvas.width/2 - 40, canvas.height/2-50);
  ctx.lineTo(canvas.width/2 + 40, canvas.height/2);
  ctx.lineTo(canvas.width/2 - 40, canvas.height/2+50);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  updateStats();
  draw();
  reset();

  inputA.disabled = true;
  inputB.disabled = true;
  inputC.disabled = true;
})();
