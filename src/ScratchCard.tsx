import { convertUnits }                                               from "@karibash/pixel-units";
import React, { MouseEvent, TouchEvent, useEffect, useRef, useState } from "react";
import styled                                                         from "styled-components";
import type { CSSLengthUnit, Coordinate, ScratchCardProps }           from "./types";

type StyledDivProps = {
	$width: CSSLengthUnit
	$height: CSSLengthUnit
}

const StyledDiv = styled.div<StyledDivProps>`
	width: ${ props => props.$width };
	height: ${ props => props.$height };
	position: relative;
	user-select:none;
	-webkit-user-select: none;
	-moz-user-select: none;
	-ms-user-select: none;
`;

const StyledCanvas = styled.canvas`
	position : absolute ;
	top      : 0;
	left:0;
	z-index   : 1;
`;

const StyledResult = styled.div<ResultType>`
visibility: ${ ( props: { isLoaded: boolean } ) => props.isLoaded ? "visible" : "hidden" };
	width      : 100%;
	height     : 100%;
`;

type ResultType = {
	isLoaded: boolean
}

const ScratchCard = ( props: ScratchCardProps ) => {
	const {
		height,
		image,
		width,
		brushSize = 20,
		children,
		customBrush,
		customCheckZone,
		fadeOutOnComplete = true,
		finishPercent = 70,
		onComplete,
		transitionProps = {
			timeout : 1
		}
	} = props;

	const [ isDrawing, setIsDrawing ]   = useState ( false );
	const [ isLoaded, setLoaded ]       = useState ( false );
	const [ isFinished, setIsFinished ] = useState ( false );
	const [ lastPoint, setLastPoint ]   = useState<Coordinate | null> ( null );

	const canvasRef     = useRef<HTMLCanvasElement> ( null );
	const brushImageRef = useRef<HTMLImageElement | null> ( null );
	const imageRef      = useRef<CanvasImageSource | null> ( null );

	useEffect ( () => {
		setIsDrawing ( false );
		setLastPoint ( null );
		const canvas = canvasRef.current;
		const ctx    = canvas?.getContext ( "2d", { willReadFrequently : true } ) as CanvasRenderingContext2D;

		imageRef.current             = new Image ();
		imageRef.current.crossOrigin = "Anonymous";
		imageRef.current.onload = () => {
			if ( imageRef.current !== null ) {
				const x = parseInt ( convertUnits ( width, "px" ) );
				const y = parseInt ( convertUnits ( height, "px" ) );

				ctx.drawImage ( imageRef.current, 0, 0, x, y );
				setLoaded ( true );
			}
		};

		imageRef.current.src = image;

		if ( customBrush ) {
			brushImageRef.current     = new Image ( parseInt ( convertUnits ( customBrush.height, "px" ) ), parseInt ( convertUnits ( customBrush.height, "px" ) ) );
			brushImageRef.current.src = customBrush.image;
		}
	}, [ customBrush, height, image, width ] );

	const getFilledInPixels = ( stride: number ) => {
		if ( !stride || stride < 1 ) {
			stride = 1;
		}

		let x      = 0;
		let y      = 0;
		let width  = canvasRef.current?.width;
		let height = canvasRef.current?.height;

		if ( customCheckZone ) {
			x      = customCheckZone.x;
			y      = customCheckZone.y;
			width  = convertUnits ( customCheckZone.width, "px" );
			height = convertUnits ( customCheckZone.height, "px" );
		}

		const ctx    = canvasRef.current?.getContext ( "2d" );
		const pixels = ctx?.getImageData ( x, y, width || 0, height || 0 );

		if ( pixels ) {
			const total = pixels.data.length / stride;
			let count   = 0;

			for ( let i = 0; i < pixels.data.length; i += stride ) {
				if ( pixels.data[i] === 0 ) {
					count ++;
				}
			}

			return Math.round ( ( count / total ) * 100 );
		}
	};

	/* const reset = (canvas: HTMLCanvasElement) => {
		if (canvas) {
			canvas.style.opacity = "1";
		}

		const ctx = canvas?.getContext("2d") as CanvasRenderingContext2D;

		if (ctx) {
			ctx.globalCompositeOperation = "source-over";
		}

		if (ctx && image && width && height) {
			ctx.drawImage(image, 0, 0, width, height);
		}

		setIsFinished(false);
	}; */

	const handleMouse = ( e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement> ): Coordinate => {
		const canvas = canvasRef.current;
		let canvasRect;

		if ( canvas ) {
			canvasRect = canvas.getBoundingClientRect ();
		}
		const scrollTop  = window.pageYOffset || document.documentElement.scrollTop;
		const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

		let x = 0;
		let y = 0;

		if ( e && "pageX" in e && "pageY" in e && canvasRect ) {
			x = ( e as MouseEvent<HTMLCanvasElement> ).pageX - canvasRect.left - scrollLeft;
			y = ( e as MouseEvent<HTMLCanvasElement> ).pageY - canvasRect.top - scrollTop;
		} else if ( e && "touches" in e && canvasRect ) {
			x = ( e as TouchEvent<HTMLCanvasElement> ).touches[0].clientX - canvasRect.left - scrollLeft;
			y = ( e as TouchEvent<HTMLCanvasElement> ).touches[0].clientY - canvasRect.top - scrollTop;
		}

		return { x, y };
	};
	const distanceBetween = ( point1: Coordinate | null, point2: Coordinate | null ) => {
		if ( point1 && point2 ) {
			return Math.sqrt ( Math.pow ( point2.x - point1.x, 2 ) + Math.pow ( point2.y - point1.y, 2 ) );
		}

		return 0;
	};

	const angleBetween = ( point1: Coordinate | null, point2: Coordinate | null ) => {
		if ( point1 && point2 ) {
			return Math.atan2 ( point2.x - point1.x, point2.y - point1.y );
		}

		return 0;
	};

	const handlePercentage = ( filledInPixels = 0 ) => {
		const canvas = canvasRef.current;

		if ( isFinished ) {
			return;
		}

		if ( filledInPixels > finishPercent && canvas ) {
			if ( fadeOutOnComplete ) {
				canvas.style.transition = transitionProps.timeout / 1000 + "s";
			}
			canvas.style.opacity = "0";

			setIsFinished ( true );
			if ( onComplete ) {
				onComplete ();
			}

			// Update any other state variables or trigger functions if needed
		}
	};

	const handleMouseDown = ( e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement> ) => {
		setIsDrawing ( true );
		setLastPoint ( handleMouse ( e ) );
	};

	const handleMouseMove = ( e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement> ) => {
		if ( !isDrawing ) {
			return;
		}

		e.preventDefault ();

		const currentPoint = handleMouse ( e );
		const distance     = distanceBetween ( lastPoint, currentPoint );
		const angle        = angleBetween ( lastPoint, currentPoint );

		let x: number, y: number;
		const canvas = canvasRef.current;
		const ctx    = canvas?.getContext ( "2d", { willReadFrequently : true } ) as CanvasRenderingContext2D;

		for ( let i = 0; i < distance; i ++ ) {
			x                            = lastPoint ? lastPoint.x + Math.sin ( angle ) * i : 0;
			y                            = lastPoint ? lastPoint.y + Math.cos ( angle ) * i : 0;
			ctx.globalCompositeOperation = "destination-out";

			if ( brushImageRef.current && customBrush ) {
				ctx.drawImage ( brushImageRef.current, x, y, convertUnits ( customBrush.width, "px" ), convertUnits ( customBrush.height, "px" ) );
			} else {
				ctx.beginPath ();
				ctx.arc ( x, y, brushSize || 20, 0, 2 * Math.PI, false );
				ctx.fill ();
			}
		}

		setLastPoint ( currentPoint );
		handlePercentage ( getFilledInPixels ( 32 ) );
	};

	const handleMouseUp = () => {
		setIsDrawing ( false );
	};

	return (
		<StyledDiv
			$height   = { height }
			$width    = { width }
			className = "ScratchCard__Container"
		>
			<StyledCanvas
				ref          = { canvasRef }
				className    = "ScratchCard__Canvas"
				height       = { convertUnits ( height, "px" ) }
				onMouseDown  = { handleMouseDown }
				onMouseMove  = { handleMouseMove }
				onMouseUp    = { handleMouseUp }
				onTouchEnd   = { handleMouseUp }
				onTouchMove  = { handleMouseMove }
				onTouchStart = { handleMouseDown }
				width        = { convertUnits ( width, "px" ) }
			/>

			<StyledResult
				className = "ScratchCard__Result"
				isLoaded  = { isLoaded }
			>
				{children}
			</StyledResult>
		</StyledDiv>
	);
};

export default ScratchCard;