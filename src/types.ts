import { RelativeLengthUnitSuffix, Unit } from "@karibash/pixel-units/defs";

export type CSSLengthUnit = Unit<RelativeLengthUnitSuffix>

export type CustomBrush = {
	image: string
	width: CSSLengthUnit
	height: CSSLengthUnit
}

export type CustomCheckZone = {
	x: number
	y: number
	width: CSSLengthUnit
	height: CSSLengthUnit
}

export type ScratchCardProps = {
	width: CSSLengthUnit
	height: CSSLengthUnit
	image: string
	finishPercent?: number
	onComplete: () => void
	brushSize?: number
	fadeOutOnComplete: boolean
	children: React.ReactNode
	customBrush?: CustomBrush
	customCheckZone?: CustomCheckZone
	transitionProps?: TransitionProps
}
export type TransitionProps ={
    timeout: number
}

export type Coordinate = {
    x: number
    y: number
}
