window.addEventListener( 'load', function () {

	'use strict';

	var overlay, toggleOverlay, container, paintboard, colors, layers, undo, palette, getColor, selectedColor, selectedColorOption;

	// show/hide the overlay
	overlay = document.getElementById( 'overlay' );
	toggleOverlay = document.getElementById( 'toggle-overlay' );
	toggleOverlay.addEventListener( 'pointerdown', function () {
		if ( overlay.classList.contains( 'collapsed' ) ) {
			overlay.classList.remove( 'collapsed' );
		} else {
			overlay.classList.add( 'collapsed' );
		}
	});

	container = document.getElementById( 'container' );
	paintboard = new PaintBoard( container );

	// create layer registry
	layers = {};

	// select 9 random colors from the list of CSS3 named colors
	colors = getColors( 9 );

	// add color options to our menu bar
	palette = document.getElementById( 'palette' );

	selectedColor = 'random';
	selectedColorOption = document.getElementById( 'random' );

	colors.forEach( function ( color ) {
		var option = document.createElement( 'div' );
		option.className = 'palette-option';
		option.setAttribute( 'data-color', color );
		option.style.backgroundColor = color;

		palette.appendChild( option );
	});

	getColor = function () {
		if ( selectedColor === 'random' ) {
			return colors[ Math.floor( Math.random() * colors.length ) ];
		}

		return selectedColor;
	};

	// when user taps on a color, select it
	palette.addEventListener( 'pointerdown', function ( event ) {
		var target, color;

		target = event.target;
		if ( !target.classList.contains( 'palette-option' ) ) {
			return;
		}

		if ( !target.classList.contains( 'selected' ) ) {
			selectedColorOption.classList.remove( 'selected' );
		}

		selectedColorOption = target;
		selectedColorOption.classList.add( 'selected' );

		selectedColor = selectedColorOption.getAttribute( 'data-color' );
	});


	// when user puts pointer down on the canvas, create a new layer
	container.addEventListener( 'pointerdown', function ( event ) {
		var pointer, layer;

		event.preventDefault();

		layer = paintboard.addLayer( getColor(), 0.8 );

		layers[ event.pointerId ] = layer;
		layer.start( event.clientX, event.clientY );
	});

	// when user moves the pointer, paint
	window.addEventListener( 'pointermove', function ( event ) {
		var layer = layers[ event.pointerId ];

		if ( layer ) {
			layer.paint( event.clientX, event.clientY, event.pressure );
		}
	});

	// when user lifts the pointer, remove the layer from the registry
	window.addEventListener( 'pointerup', function ( event ) {
		delete layers[ event.pointerId ];
	});

	// when user taps 'undo', remove the uppermost layer (until we run out of
	// layers in the undo stack - after a while the bottom ones get merged for
	// performance reasons)
	undo = document.getElementById( 'undo' );
	undo.addEventListener( 'pointerdown', function () {
		paintboard.undo();
	});

});