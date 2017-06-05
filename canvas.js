(function () {
	"use strict";

	var $ = function (ctx, sel) {
		return (!sel ? document : ctx).querySelector(sel || ctx);
	}, $$ = function (ctx, sel) {
		return Array.prototype.slice
			.call((!sel ? document : ctx).querySelectorAll(sel || ctx));
	};

	var canvas = $('#canvas'),
		ctx = canvas.getContext('2d');

	var container = {
		x1: canvas.width / 2 - 100,
		y1: 100,
		x2: canvas.width / 2 + 100,
		y2: 450
	}

	var PARTICLE_COUNT = 100,
		PARTICLE_RADIUS = 5,
		temperature = 294,
		pressure = 1,
		volume = 1;

	var K = pressure * volume / temperature;

	var speed = 0;

	var particles = new Array(PARTICLE_COUNT);

	var CGL = function (data1, data2) {
		if (!!data2) {
			if (!data2.hasOwnProperty('P')) {
				data2.P = (data1.P * data1.V * data2.T) / (data1.T * data2.V);
			} else if (!data2.hasOwnProperty('V')) {
				data2.V = (data1.P * data1.V * data2.T) / (data1.T * data2.P);
			} else if (!data2.hasOwnProperty('T')) {
				data2.T = (data2.P * data2.V * data1.T) / (data1.P * data1.V);
			}
		} else {
			data2 = data1;

			if (!data2.hasOwnProperty('P')) {
				data2.P = K * data2.T / data2.V;
			} else if (!data2.hasOwnProperty('V')) {
				data2.V = K * data2.T / data2.P;
			} else if (!data2.hasOwnProperty('T')) {
				data2.T = data2.P * data2.V / K;
			}
		}

		return data2;
	};

	var updateSpeed = function () {
		speed = temperature / 50;
	};

	var updateVolume = function () {
		container.x1 = canvas.width / 2 - 100 * volume;
		container.x2 = canvas.width / 2 + 100 * volume;
	};

	var inContainer = function (P) {
		if (container.x1 < P.x && P.x < container.x2 &&
			container.y1 < P.y && P.y < container.y2)
			return 0;
		else if ((container.x1 >= P.x || P.x >= container.x2) &&
			container.y1 < P.y && P.y < container.y2)
			return 1;
		else if ((container.y1 >= P.y || P.y >= container.y2) &&
			container.x1 < P.x && P.x < container.x2)
			return 2;
		else
			return 3;
	};

	var squareDist = function (p1, p2) {
		return (p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y);
	};

	var meet = function (p1, p2) {
		return 4 * PARTICLE_RADIUS * PARTICLE_RADIUS >= squareDist(p1, p2);
	};

	var init = function () {
		for (var i=0; i<particles.length; i++) {
			particles[i] = {
				x: (container.x2 - container.x1 - 1) * Math.random() + container.x1 + 1,
				y: (container.y2 - container.y1 - 1) * Math.random() + container.y1 + 1,
				dir: 2 * Math.PI * Math.random(),
				draw: function () {
					ctx.beginPath();
					ctx.moveTo(this.x + PARTICLE_RADIUS, this.y);
					ctx.arc(
						this.x, this.y,
						PARTICLE_RADIUS,
						0, 2 * Math.PI, true
					);
					ctx.closePath();
					ctx.fill();
				}
			};
		}

		updateSpeed();
	};

	var animate = function () {
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';

		ctx.beginPath();
		ctx.moveTo(container.x1 - PARTICLE_RADIUS, container.y1 - PARTICLE_RADIUS);
		ctx.lineTo(container.x2 + PARTICLE_RADIUS, container.y1 - PARTICLE_RADIUS);
		ctx.lineTo(container.x2 + PARTICLE_RADIUS, container.y2 + PARTICLE_RADIUS);
		ctx.lineTo(container.x1 - PARTICLE_RADIUS, container.y2 + PARTICLE_RADIUS);
		ctx.closePath();
		ctx.stroke();

		ctx.fillStyle = '#f52f2f';

		particles.forEach(function (particle, i) {
			particle.x += speed * Math.cos(particle.dir);
			particle.y += speed * Math.sin(particle.dir);

			var inCon = inContainer(particle);

			if (inCon === 1) {
				particle.dir = Math.PI - particle.dir;
				particle.x -= 2 * (particle.x > container.x2 ?
					particle.x - container.x2 :
					particle.x - container.x1);
			} else if (inCon === 2) {
				particle.dir = -particle.dir;
				particle.y -= 2 * (particle.y > container.y2 ?
					particle.y - container.y2 :
					particle.y - container.y1);
			} else if (inCon === 3) {
				particle.dir = Math.PI + particle.dir;
				particle.x -= 2 * (particle.x > container.x2 ?
					particle.x - container.x2 :
					particle.x - container.x1);
				particle.y -= 2 * (particle.y > container.y2 ?
					particle.y - container.y2 :
					particle.y - container.y1);
			}

			particles.slice(0, i).forEach(function (part) {
				if (meet(particle, part)) {
					if (squareDist(particle, part) < PARTICLE_RADIUS * PARTICLE_RADIUS) {
						return;
					}
					// determine bounce off angles
					var oldDir = particle.dir;
					particle.dir = part.dir;
					part.dir = oldDir;
				}
			});

			//particle.draw();
			// ctx.restore();
		});

		particles.forEach(function (particle) { particle.draw(); });

		window.requestAnimationFrame(animate);
	};

	var inputstart = function () {
		var el = this;

		if (!el.disabled) {
			if (!el.classList.contains('active')) {
				el.classList.add('active');
				el.parentNode.classList.remove('slave');
			}

			setTimeout(function () {
				if (selStack.indexOf(el.id) === -1) {
					selStack.push(el.id);

					if (selStack.length > 2) {
					var shifted = $('#' + selStack.shift());

						shifted.parentNode.classList.remove('slave');
					}
				}

				el.dispatchEvent(new Event('change'));

				onChange();
			}, 1);
		}
	}, inputchange = function () {
		var el = this;

		if (!el.disabled && el.classList.contains('active')) {
			if (selStack.indexOf(el.id) === -1) {
				selStack.push(el.id);

				if (selStack.length > 2) {
					var shifted = $('#' + selStack.shift());

					shifted.parentNode.classList.remove('slave');
				}
			}

			$(el.parentNode, 'span').textContent = el.value;

			el.dispatchEvent(new Event('change'));

			onChange();
		}
	}, inputend = function () {
		var el = this;

		if (!el.disabled) {
			el.classList.remove('active');

			el.dispatchEvent(new Event('change'))
		}
	};

	var selStack = [];

	var onChange = function () {
		var data = {}, prop, el;

		if (selStack.indexOf('pre') > -1) {
			data.P = pressure;
		}

		if (selStack.indexOf('vol') > -1) {
			data.V = volume;
		}

		if (selStack.indexOf('temp') > -1) {
			data.T = temperature;
		}

		if (selStack.length === 2) {
			data = CGL(data);

			if (selStack.indexOf('pre') === -1) {
				prop = 'pre';
			} else if (selStack.indexOf('vol') === -1) {
				prop = 'vol';
			} else if (selStack.indexOf('temp') === -1) {
				prop = 'temp';
			}

			data = data[prop[0].toUpperCase()];
			el = $('#' + prop);

			el.value = data;
			el.parentNode.classList.add('slave');
			el.dispatchEvent(new CustomEvent('change', { detail: data }));

			if (isFinite(data))
				$(el.parentNode, 'span').textContent = data.toString().substr(0, 5);
			else if (!isNaN(data))
				$(el.parentNode, 'span').innerHTML = '&infin;';
			else
				$(el.parentNode, 'span').textContent = 'waterudoingnodivide0by0';
		}

		// console.log(selStack);
	};

	// Pressure
	var pressureListener = function (e) {
		pressure = e.detail || this.value;
	};

	$('#pre').addEventListener('mousedown', inputstart);

	$('#pre').addEventListener('mousemove', inputchange);

	$('#pre').addEventListener('keydown', inputchange);

	$('#pre').addEventListener('mouseup', inputend);

	$('#pre').addEventListener('change', pressureListener);

	// Volume
	var volumeListener = function (e) {
		volume = e.detail || this.value;
		updateVolume();
	};

	$('#vol').addEventListener('mousedown', inputstart);

	$('#vol').addEventListener('mousemove', inputchange);

	$('#vol').addEventListener('keydown', inputchange);

	$('#vol').addEventListener('mouseup', inputend);

	$('#vol').addEventListener('change', volumeListener);

	// Temperature
	var temperatureListener = function (e) {
		temperature = e.detail || this.value;
		updateSpeed();
	};

	$('#temp').addEventListener('mousedown', inputstart);

	$('#temp').addEventListener('mousemove', inputchange);

	$('#temp').addEventListener('keydown', inputchange);

	$('#temp').addEventListener('mouseup', inputend);

	$('#temp').addEventListener('change', temperatureListener);

	init();
	window.requestAnimationFrame(animate);
})();
