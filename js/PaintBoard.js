(function ( global ) {

	'use strict';

	var PaintBoard, Layer, Vector, resizeCanvas;


	resizeCanvas = function ( canvas, ctx, width, height ) {
		var imageData;

		ctx.save();
		imageData = ctx.getImageData( 0, 0, canvas.width, canvas.height );

		canvas.width = width;
		canvas.height = height;
		canvas.style.width = width + 'px';
		canvas.style.height = height + 'px';

		ctx.putImageData( imageData, 0, 0 );
		ctx.restore();
	};


	Vector = function ( x, y ) {
		this.x = x;
		this.y = y;

		this.magnitude = Math.sqrt( x * x + y * y );
	};

	Vector.prototype = {
		normalise: function () {
			return new Vector( this.x / this.magnitude, this.y / this.magnitude );
		},

		rotate: function () {
			// rotate vector 90 degrees clockwise
			return new Vector( -this.y, this.x );
		}
	};



	Layer = function ( board, color, opacity, maxThickness, thicknessMultiplier ) {
		this.canvas = document.createElement( 'canvas' );
		this.ctx = this.canvas.getContext( '2d' );

		this.resize( board.canvas.width, board.canvas.height );

		this.ctx.fillStyle = color;
		this.ctx.lineCap = 'round';
		
		this.opacity = this.canvas.style.opacity = opacity;

		this.maxThickness = maxThickness || 15;
		this.thicknessMultiplier = thicknessMultiplier || 10;

		this.velocity = [];
	};

	Layer.prototype = {
		start: function ( x, y ) {
			this.x = x;
			this.y = y;

			this.port = this.starboard = {
				x: x,
				y: y
			};

			this.lastPaint = Date.now();
		},

		paint: function ( x, y, pressure ) {
			var vector, normalised, rotated, cross, distance, timeNow, elapsed, velocity, averageVelocity, thickness, ctx, port, starboard;

			vector = new Vector( x - this.x, y - this.y );
			distance = vector.magnitude;

			normalised = vector.normalise();
			rotated = normalised.rotate();

			// get thickness
			timeNow = Date.now();
			elapsed = timeNow - this.lastPaint;
			velocity = distance / elapsed;
			this.velocity.push( velocity );
			if ( this.velocity.length > 5 ) {
				this.velocity.shift();
			}
			averageVelocity = this.averageVelocity();
			thickness = Math.min( pressure * ( this.thicknessMultiplier / averageVelocity ), this.maxThickness );

			cross = { x: thickness * rotated.x, y: thickness * rotated.y };

			port = { x: x - cross.x, y: y - cross.y };
			starboard = { x: x + cross.x, y: y + cross.y };
			
			ctx = this.ctx;

			// draw stroke
			ctx.beginPath();

			ctx.moveTo( this.port.x, this.port.y );
			
			ctx.lineTo( port.x, port.y );
			ctx.lineTo( starboard.x, starboard.y );
			ctx.lineTo( this.starboard.x, this.starboard.y );
			
			ctx.fill();

			// draw blob
			ctx.beginPath();
			ctx.arc( x, y, thickness, 0, Math.PI * 2 );
			ctx.fill();

			this.x = x;
			this.y = y;

			this.port = port;
			this.starboard = starboard;

			this.lastPaint = timeNow;
		},

		averageVelocity: function () {
			var i, len, total = 0;

			i = len = this.velocity.length;
			while ( i-- ) {
				total += this.velocity[i];
			}

			return total / len;
		},

		getImageData: function () {
			return this.ctx.getImageData( 0, 0, this.canvas.width, this.canvas.height );
		},

		resize: function ( width, height ) {
			resizeCanvas( this.canvas, this.ctx, width, height );
		}
	};


	PaintBoard = function ( el ) {
		this.el = el;

		this.canvas = document.createElement( 'canvas' );
		this.ctx = this.canvas.getContext( '2d' );

		this.el.appendChild( this.canvas );

		this.maxLayers = 5;
		this.layers = [];

		this.maxContainerWidth = this.maxContainerHeight = 0;
		this.margin = 100;
		this.resize();
	};

	PaintBoard.prototype = {
		addLayer: function ( color, opacity ) {
			var layer = new Layer( this, color, opacity );

			this.layers.push( layer );
			this.el.appendChild( layer.canvas );

			if ( this.layers.length > this.maxLayers ) {
				this.merge(); // too many layers for undo stack
			}

			return layer;
		},

		undo: function () {
			var layer = this.layers.pop();

			if ( !layer ) {
				return; // no more layers to pop
			}

			this.el.removeChild( layer.canvas );
		},

		merge: function () {
			var bottomLayer;

			bottomLayer = this.layers.shift();

			this.ctx.globalAlpha = bottomLayer.opacity;
			this.ctx.drawImage( bottomLayer.canvas, 0, 0 );

			this.el.removeChild( bottomLayer.canvas );
		},

		resize: function () {
			var containerWidth, containerHeight, canvasWidth, canvasHeight, i;

			containerWidth = this.el.clientWidth;
			containerHeight = this.el.clientHeight;

			if ( containerWidth > this.maxContainerWidth || containerHeight > this.maxContainerHeight ) {
				canvasWidth = containerWidth + this.margin;
				canvasHeight = containerHeight + this.margin;

				resizeCanvas( this.canvas, this.ctx, canvasWidth, canvasHeight );

				i = this.layers.length;
				while ( i-- ) {
					this.layers[i].resize( canvasWidth, canvasHeight );
				}

				this.maxContainerWidth = containerWidth;
				this.maxContainerHeight = containerHeight;
			}
		}
	};

	global.PaintBoard = PaintBoard;

}( this ));