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
		x1: 100,
		y1: 50,
		x2: 400,
		y2: 500
	}

	var PARTICLE_COUNT = 50,
		PARTICLE_RADIUS = 5,
		temperature = 294,
		pressure = 101.3,
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
	}

	// Determine if P is on QR if P, Q & R are colinear
	var onSegment = function (P, Q, R) {
		return Math.min(Q.x, R.x) <= P.x && P.x <= Math.max(Q.x, R.x) &&
			Math.min(Q.y, R.y) <= P.y && P.y <= Math.max(Q.y, R.y);
	};

	// Find the orientation of (P, Q, R)
	// 0 = colinear, 1 = cw, 2 = ccw
	var orientation = function(P, Q, R) {
		var val = (r.x - p.x) * (q.y - p.y) - (q.x - p.x) * (r.y - q.y);

		return (val === 0) ? 0 : ((val > 0) ? 1 : 2);
	};

	// Determine if segments PQ and RS intersect
	var intersect = function (P, Q, R, S) {
		var o1 = orientation(P, Q, R);
		var o2 = orientation(P, Q, S);
		var o3 = orientation(R, S, P);
		var o4 = orientation(R, S, Q);

		if (o1 !== o2 && o3 !== o4) return true;

		if ((o1 === 0 && onSegment(P, R, Q)) ||
			(o2 === 0 && onSegment(P, S, Q)) ||
			(o3 === 0 && onSegment(R, P, S)) ||
			(o4 === 0 && onSegment(R, Q, S)))
			return true;

		return false;
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

			//particle.draw();
			// ctx.restore();
		});

		particles.forEach(function (particle) { particle.draw(); });

		window.requestAnimationFrame(animate);
	};

	$('#temp').addEventListener('mousedown', function () {
		$('#temp').classList.add('active');
	});

	$('#temp').addEventListener('mousemove', function () {
		if ($('#temp').classList.contains('active')) {
			temperature = $('#temp').value;
			computeSpeed();
		}
	});

	$('#temp').addEventListener('mouseup', function () {
		$('#temp').classList.remove('active');
	});

	init();
	window.requestAnimationFrame(animate);
})();
