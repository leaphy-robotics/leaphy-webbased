import { AppState } from "src/app/state/app.state";

export enum Board {
    ALL = 1,

    L_ORIGINAL_ALL,
    L_ORIGINAL_UNO,
    L_ORIGINAL_NANO_ALL,
    L_ORIGINAL_NANO,

    L_FLITZ_ALL,
    L_FLITZ_UNO,
    L_FLITZ_NANO,

    L_CLICK,

    L_ARDUINO,
    L_UNO,
    L_NANO_ALL,
    L_NANO,
    L_MEGA,
}

export const BoardNames = {
    "*": Board.ALL,

    "l_original_*": Board.L_ORIGINAL_ALL,
    l_original_uno: Board.L_ORIGINAL_UNO,
    "l_original_nano_*": Board.L_ORIGINAL_NANO_ALL,
    l_original_nano: Board.L_ORIGINAL_NANO,

    "l_flitz_*": Board.L_FLITZ_ALL,
    l_flitz_uno: Board.L_FLITZ_UNO,
    l_flitz_nano: Board.L_FLITZ_NANO,

    l_click: Board.L_CLICK,

    "l_arduino_*": Board.L_ARDUINO,
    l_uno: Board.L_UNO,
    "l_nano_*": Board.L_NANO_ALL,
    l_nano: Board.L_NANO,
    l_mega: Board.L_MEGA,
};

export const BoardNamesArray = Object.values(BoardNames);

export interface Example {
    name: string;
    sketch: string;
    image: string;
    boards: Board[];
}

export default [
    {
        name: "Blink",
        sketch: "blink.l_example",
        image: "blink.svg",
        boards: [Board.ALL, -Board.L_FLITZ_ALL],
    },
    {
        name: "Snake",
        sketch: "snake.l_example",
        image: "snake.svg",
        boards: [Board.L_ARDUINO],
    },
] as Example[];
