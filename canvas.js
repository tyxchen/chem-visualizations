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
		y1: 50,
		x2: canvas.width / 2 + 100,
		y2: 550
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
			if (!data2.hasOwnProperty('P') || !data2.P) {
				data2.P = (data1.P * data1.V * data2.T) / (data1.T * data2.V);
			} else if (!data2.hasOwnProperty('V') || !data2.V) {
				data2.V = (data1.P * data1.V * data2.T) / (data1.T * data2.P);
			} else if (!data2.hasOwnProperty('T') || !data2.T) {
				data2.T = (data2.P * data2.V * data1.T) / (data1.P * data1.V);
			}
		} else {
			data2 = data1;

			if (!data2.hasOwnProperty('P') || !data2.P) {
				data2.P = K * data2.T / data2.V;
			} else if (!data2.hasOwnProperty('V') || !data2.V) {
				data2.V = K * data2.T / data2.P;
			} else if (!data2.hasOwnProperty('T') || !data2.T) {
				data2.T = data2.P * data2.V / K;
			}
		}

		return data2;
	};

	var computeSpeed = function () {
		speed = temperature / 50;
	};

	var computeVolume = function () {
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

		computeSpeed();
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

	var mousedown = function () {
		var el = this;

		if (!el.disabled) {
			if (!el.classList.contains('active')) {
				el.classList.add('active');
				el.dataset.original = el.value;
			}

			setTimeout(function () {
				if (el.value !== parseInt(el.dataset.original))
					el.parentNode.classList.add('changed');
				else
					el.parentNode.classList.remove('changed');

				el.dispatchEvent(new Event('change'));
			}, 1);
		}
	}, mousemove = function () {
		var el = this;

		if (!el.disabled && el.classList.contains('active')) {
			if (el.value !== parseInt(el.dataset.original))
				el.parentNode.classList.add('changed');
			else
				el.parentNode.classList.remove('changed');

			$(el.parentNode, 'span').textContent = el.value;

			el.dispatchEvent(new Event('change'));
		}
	}, mouseup = function () {
		var el = this;

		if (!el.disabled) {
			el.classList.remove('active');
			el.dataset.original = null;

			el.dispatchEvent(new Event('change'))
		}
	};

	var wrapperMousedown = function (e) {
		var name = this.id.split('-')[0];

		if (!this.classList.contains('selected')) {
			this.classList.add('selected');
			selected[name] = true;

			if (selected.pressure && selected.volume) {
				$('#temperature-wrapper').classList.add('disabled');
				$('#temp').setAttribute('disabled', true);
			}

			if (selected.pressure && selected.temperature) {
				$('#volume-wrapper').classList.add('disabled');
				$('#vol').setAttribute('disabled', true);
			}

			if (selected.volume && selected.temperature) {
				$('#pressure-wrapper').classList.add('disabled');
				$('#pre').setAttribute('disabled', true);
			}

		} else {
			if (e.target.tagName !== 'INPUT') {
				this.classList.remove('selected');
				selected[name] = false;

				$('#controls .disabled').classList.remove('disabled');
				$('#controls [disabled]').removeAttribute('disabled');
			}
		}
		console.log(selected);
	};

	var selected = { pressure: false, volume: false, temperature: false };

	// Pressure
	var pressureListener = function () {
		pressure = this.value;
	};

	$('#pressure-wrapper').addEventListener('mousedown', wrapperMousedown);

	$('#pre').addEventListener('mousedown', mousedown);

	$('#pre').addEventListener('mousemove', mousemove);

	$('#pre').addEventListener('mouseup', mouseup);

	$('#pre').addEventListener('change', pressureListener);

	// Volume
	var volumeListener = function () {
		volume = this.value;
		computeVolume();
	};

	$('#volume-wrapper').addEventListener('mousedown', wrapperMousedown);

	$('#vol').addEventListener('mousedown', mousedown);

	$('#vol').addEventListener('mousemove', mousemove);

	$('#vol').addEventListener('mouseup', mouseup);

	$('#vol').addEventListener('change', volumeListener);

	// Temperature
	var temperatureListener = function (t) {
		temperature = this.value;
		computeSpeed();
	};

	$('#temperature-wrapper').addEventListener('mousedown', wrapperMousedown);

	$('#temp').addEventListener('mousedown', mousedown);

	$('#temp').addEventListener('mousemove', mousemove);

	$('#temp').addEventListener('mouseup', mouseup);

	$('#temp').addEventListener('change', temperatureListener);

	init();
	window.requestAnimationFrame(animate);
})();
