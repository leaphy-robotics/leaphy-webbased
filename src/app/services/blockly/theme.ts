// check if user is using dark or light theme
import * as Blockly from "blockly";
import { ITheme, Theme } from "blockly/core/theme";

function getTheme(themeStr): Theme {
    let theme: ITheme;
    if (themeStr === "dark") {
        console.log("Dark mode");
        theme = {
            blockStyles: {
                leaphy_blocks: { colourPrimary: "#06434f", hat: "cap" },
                loop_blocks: { colourPrimary: "#69530d" },
                math_blocks: { colourPrimary: "#45662a" },
                text_blocks: { colourPrimary: "#45662a" },
                logic_blocks: { colourPrimary: "#45662a" },
                variable_blocks: { colourPrimary: "#87451a" },
                list_blocks: { colourPrimary: "#3f144a" },
                procedure_blocks: { colourPrimary: "#10324a" },
            },

            categoryStyles: {
                leaphy_category: { colour: "#06434f" },
                situation_category: { colour: "#69530d" },
                numbers_category: { colour: "#45662a" },
                variables_category: { colour: "#87451a" },
                lists_category: { colour: "#3f144a" },
                functions_category: { colour: "#10324a" },
            },
            componentStyles: {
                workspaceBackgroundColour: "#1e1e1e",
                toolboxBackgroundColour: "#343444",
                toolboxForegroundColour: "#fff",
                flyoutBackgroundColour: "#1e1e1e",
                flyoutForegroundColour: "#ccc",
                scrollbarColour: "#9c9a9a",
                flyoutOpacity: 1,
            },
            name: "dark",
        };
    } else if (themeStr === "light") {
        theme = {
            blockStyles: {
                leaphy_blocks: { colourPrimary: "#06778f", hat: "cap" },
                loop_blocks: { colourPrimary: "#D9B53F" },
                math_blocks: { colourPrimary: "#75B342" },
                text_blocks: { colourPrimary: "#75B342" },
                logic_blocks: { colourPrimary: "#75B342" },
                variable_blocks: { colourPrimary: "#DE7C3B" },
                list_blocks: { colourPrimary: "#a500cf" },
                procedure_blocks: { colourPrimary: "#4095CE" },
            },

            categoryStyles: {
                leaphy_category: { colour: "#06778f" },
                situation_category: { colour: "#D9B53F" },
                numbers_category: { colour: "#75B342" },
                variables_category: { colour: "#DE7C3B" },
                lists_category: { colour: "#a500cf" },
                functions_category: { colour: "#4095CE" },
            },
            componentStyles: {
                workspaceBackgroundColour: "#E5E5E5",
                toolboxBackgroundColour: "#343444",
                toolboxForegroundColour: "#fff",
                flyoutBackgroundColour: "#FFFFFF",
                flyoutForegroundColour: "#ccc",
                insertionMarkerColour: "#000",
                scrollbarColour: "#ccc",
                flyoutOpacity: 1,
            },
            name: "light",
        };
    }

    return Blockly.Theme.defineTheme(themeStr, theme);
}

export default getTheme;
