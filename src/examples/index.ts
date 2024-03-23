import {AppState} from "src/app/state/app.state";

export enum Board {
    ALL = '*',

    L_ORIGINAL_ALL = 'l_original_*',
    L_ORIGINAL_UNO = 'l_original_uno',
    L_ORIGINAL_NANO = 'l_original_nano',

    L_FLITZ_ALL = 'l_flitz_*',
    L_FLITZ_UNO = 'l_flitz_uno',
    L_FLITZ_NANO = 'l_flitz_nano',

    L_CLICK = 'l_click',

    L_ARDUINO = 'l_arduino_*',
    L_UNO = 'l_uno',
    L_NANO = 'l_nano',
    L_MEGA = 'l_mega'
}

export interface Example {
    name: string,
    sketch: string,
    image: string,
    boards: Board[]
}

export default [
    {
        name: 'Blink',
        sketch: 'blink.l_example',
        image: 'blink.svg',
        boards: [Board.ALL]
    },
    {
        name: 'Snake',
        sketch: 'snake.l_example',
        image: 'snake.svg',
        boards: [Board.L_ARDUINO]
    }
] as Example[]
