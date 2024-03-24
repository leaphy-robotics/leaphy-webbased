import {Injectable} from '@angular/core';
import {BlocklyEditorState} from '../state/blockly-editor.state';
import {SketchStatus} from '../domain/sketch.status';
import {BackEndState} from '../state/backend.state';
import {filter, pairwise, withLatestFrom} from 'rxjs/operators';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {combineLatest, Observable} from 'rxjs';
import {WorkspaceStatus} from '../domain/workspace.status';
import {AppState} from '../state/app.state';
import {CodeEditorType} from '../domain/code-editor.type';
import * as Blockly from 'blockly/core';
import '@blockly/field-bitmap'
import Arduino from '@leaphy-robotics/leaphy-blocks/generators/arduino';
import getBlocks from "@leaphy-robotics/leaphy-blocks/blocks/blocks";
import {
    APPEND_STATEMENT_INPUT_STACK,
    CONTROLS_IF_MUTATOR_MIXIN,
    CONTROLS_IF_TOOLTIP_EXTENSION,
    CUSTOM_CONTEXT_MENU_VARIABLE_GETTER_SETTER_MIXIN,
    IS_DIVISIBLE_MUTATOR_EXTENSION,
    IS_DIVISIBLEBY_MUTATOR_MIXIN,
    LIST_MODES_MUTATOR_EXTENSION,
    LIST_MODES_MUTATOR_MIXIN,
    LIST_SELECT_EXTENSION,
    LOGIC_TOOLTIPS_BY_OP,
    MATH_TOOLTIPS_BY_OP,
    TEXT_QUOTES_EXTENSION,
    WHILE_UNTIL_TOOLTIPS,
} from "@leaphy-robotics/leaphy-blocks/blocks/extensions";
import {LISTS, ListSerializer} from "@leaphy-robotics/leaphy-blocks/categories/all";
import {categoryStyles, componentStyles, defaultBlockStyles} from "@leaphy-robotics/leaphy-blocks/theme/theme";
import {LeaphyCategory} from "../services/toolbox/category";
import {LeaphyToolbox} from "../services/toolbox/toolbox";
import * as translationsEn from '@leaphy-robotics/leaphy-blocks/msg/js/en.js';
import * as translationsNl from '@leaphy-robotics/leaphy-blocks/msg/js/nl.js';
import {CodeEditorState} from "../state/code-editor.state";
import {genericRobotType, microPythonRobotType, RobotType} from "../domain/robot.type";
import {WorkspaceService} from "../services/workspace.service";

function isJSON(data: string) {
    try {
        JSON.parse(data)
        return true
    } catch (e) {
        return false
    }
}

const translationsMap = {
    en: translationsEn.default,
    nl: translationsNl.default,
}

const Extensions = Blockly.Extensions;

@Injectable({
    providedIn: 'root',
})

// Defines the effects on the Blockly Editor that different state changes have
export class BlocklyEditorEffects {

    constructor(
        private blocklyState: BlocklyEditorState,
        private backEndState: BackEndState,
        private appState: AppState,
        private codeEditorState: CodeEditorState,
        private http: HttpClient,
        private workspaceService: WorkspaceService
    ) {
        // Variables:
        Extensions.registerMixin(
            'contextMenu_variableSetterGetter',
            CUSTOM_CONTEXT_MENU_VARIABLE_GETTER_SETTER_MIXIN);
        // Lists:
        Extensions.register('list_select_extension', LIST_SELECT_EXTENSION);
        // // Math:
        Extensions.registerMutator(
            'math_is_divisibleby_mutator', IS_DIVISIBLEBY_MUTATOR_MIXIN,
            IS_DIVISIBLE_MUTATOR_EXTENSION);

        // Update the tooltip of 'math_change' block to reference the variable.
        Extensions.register(
            'math_change_tooltip',
            Extensions.buildTooltipWithFieldText('%{BKY_MATH_CHANGE_TOOLTIP}', 'VAR'));

        Blockly.registry.register(
            Blockly.registry.Type.TOOLBOX_ITEM,
            Blockly.ToolboxCategory.registrationName,
            LeaphyCategory, true);
        Blockly.registry.register(Blockly.registry.Type.TOOLBOX, Blockly.CollapsibleToolboxCategory.registrationName, LeaphyToolbox);
        Blockly.registry.register(Blockly.registry.Type.SERIALIZER, "lists", new ListSerializer())

        Extensions.registerMutator(
            'math_modes_of_list_mutator', LIST_MODES_MUTATOR_MIXIN,
            LIST_MODES_MUTATOR_EXTENSION);
        //
        Extensions.register('text_quotes', TEXT_QUOTES_EXTENSION)
        Extensions.register('appendStatementInputStack', APPEND_STATEMENT_INPUT_STACK)
        // // Tooltip extensions
        Extensions.register('controls_whileUntil_tooltip', Extensions.buildTooltipForDropdown('MODE', WHILE_UNTIL_TOOLTIPS));
        Extensions.register(
            'logic_op_tooltip',
            Extensions.buildTooltipForDropdown('OP', LOGIC_TOOLTIPS_BY_OP));
        Extensions.register(
            'math_op_tooltip',
            Extensions.buildTooltipForDropdown('OP', MATH_TOOLTIPS_BY_OP));
        //
        Extensions.registerMutator(
            'controls_if_mutator', CONTROLS_IF_MUTATOR_MIXIN, null,
            ['controls_if_elseif', 'controls_if_else']);
        Extensions.register('controls_if_tooltip', CONTROLS_IF_TOOLTIP_EXTENSION);

        // When the current language is set: Find and set the blockly translations
        this.appState.currentLanguage$
            .pipe(filter(language => !!language))
            .subscribe(async language => {
                // import translations from the language file @leaphy-robotics/leaphy-blocks/msg/js/${language.code}.js
                const translations = translationsMap[language.code];
                Blockly.setLocale(translations);
            });

        // When the language is changed, save the workspace temporarily
        this.appState.changedLanguage$
            .pipe(filter(language => !!language))
            .subscribe(() => {
                this.blocklyState.setWorkspaceStatus(WorkspaceStatus.SavingTemp);
            });

        // When all prerequisites are there, Create a new workspace and open the codeview if needed
        combineLatest([this.blocklyState.blocklyElement$, this.blocklyState.blocklyConfig$])
            .pipe(withLatestFrom(this.appState.selectedRobotType$))
            .pipe(filter(([[element, config], robotType]) => !!element && !!config && !!robotType && (robotType !== genericRobotType && robotType !== microPythonRobotType)))
            .pipe(withLatestFrom(
                this.getXmlContent('./assets/blockly/base-toolbox.xml'),
                this.getXmlContent('./assets/blockly/leaphy-toolbox.xml'),
                this.getXmlContent('./assets/blockly/leaphy-start.xml')
            ))
            .subscribe(([[[element, config], robotType], baseToolboxXml, leaphyToolboxXml, startWorkspaceXml]) => {
                const leaphyBlocks = getBlocks(this.appState.getSelectedRobotType().id);
                Blockly.defineBlocksWithJsonArray(leaphyBlocks.block)
                for (const [name, block] of Object.entries(leaphyBlocks.blockJs)) {
                    Blockly.Blocks[name] = block;
                }
                config.theme = Blockly.Theme.defineTheme('leaphy', {
                    'blockStyles': defaultBlockStyles,
                    'categoryStyles': categoryStyles,
                    'componentStyles': componentStyles,
                    name: 'leaphy',
                });
                const toolboxXmlString = this.loadToolBox(baseToolboxXml, leaphyToolboxXml, robotType);
                config.toolbox = toolboxXmlString;
                // @ts-ignore
                const workspace = Blockly.inject(element, config);
                const toolbox = workspace.getToolbox();
                workspace.registerToolboxCategoryCallback('LISTS', LISTS);
                toolbox.getFlyout().autoClose = false;
                const xml = Blockly.utils.xml.textToDom(startWorkspaceXml);
                Blockly.Xml.domToWorkspace(xml, workspace);
                this.blocklyState.setWorkspace(workspace);
                this.blocklyState.setToolboxXml(toolboxXmlString);
                if (this.appState.getCurrentEditor() == CodeEditorType.Beginner) {
                    this.workspaceService.restoreWorkspaceTemp();
                }
                toolbox.selectItemByPosition(0);
                toolbox.refreshTheme();

                setTimeout(() => this.blocklyState.setIsSideNavOpen(robotType.features.showCodeOnStart), 200);
            });

        // When a new project is started, reset the blockly code
        this.appState.selectedRobotType$
            .pipe(filter(robotType => !robotType))
            .subscribe(() => this.codeEditorState.setCode(''))

        // When the robot selection changes, set the toolbox and initialWorkspace
        this.appState.selectedRobotType$
            .pipe(withLatestFrom(this.blocklyState.workspace$))
            .pipe(filter(([robotType, workspace]) => !!robotType && !!workspace))
            .pipe(withLatestFrom(
                this.getXmlContent('./assets/blockly/base-toolbox.xml'),
                this.getXmlContent('./assets/blockly/leaphy-toolbox.xml'),
                this.getXmlContent('./assets/blockly/leaphy-start.xml'),
            ))
            .subscribe(([[robotType, workspace], baseToolboxXml, leaphyToolboxXml, startWorkspaceXml]) => {
                const toolboxXmlString = this.loadToolBox(baseToolboxXml, leaphyToolboxXml, robotType);
                this.blocklyState.setToolboxXml(toolboxXmlString);

                workspace.clear();
                const xml = Blockly.utils.xml.textToDom(startWorkspaceXml);
                Blockly.Xml.domToWorkspace(xml, workspace);
            });

        // Update the toolbox when it changes
        this.blocklyState.toolboxXml$
            .pipe(withLatestFrom(this.blocklyState.workspace$))
            .pipe(filter(([toolbox, workspace]) => !!toolbox && !!workspace))
            .subscribe(([toolbox, workspace]) => workspace.updateToolbox(toolbox))

        // Subscribe to changes when the workspace is set
        this.blocklyState.workspace$
            .pipe(filter(workspace => !!workspace))
            .subscribe(workspace => {
                workspace.clearUndo();
                workspace.addChangeListener(Blockly.Events.disableOrphans);
                workspace.addChangeListener(async () => {
                    this.codeEditorState.setCode(Arduino.workspaceToCode(workspace, this.appState.getSelectedRobotType().id));
                    this.blocklyState.setWorkspaceJSON(JSON.stringify(Blockly.serialization.workspaces.save(workspace)));
                });
            });

        // When the WorkspaceStatus is set to loading, load in the latest workspace XML
        this.blocklyState.workspaceStatus$
            .pipe(filter(status => status === WorkspaceStatus.Restoring))
            .pipe(withLatestFrom(this.blocklyState.workspaceJSON$, this.blocklyState.workspace$))
            .subscribe(async ([, workspaceXml, workspace]) => {
                if (!workspace) return;
                if (!workspaceXml) return;
                workspace.clear();

                if (isJSON(workspaceXml)) Blockly.serialization.workspaces.load(JSON.parse(workspaceXml), workspace)
                else {
                    const xml = Blockly.utils.xml.textToDom(workspaceXml);
                    Blockly.Xml.domToWorkspace(xml, workspace);
                }

                this.blocklyState.setWorkspaceStatus(WorkspaceStatus.Clean);
            });

        // When the user presses undo or redo, trigger undo or redo on the workspace
        this.blocklyState.undo$
            .pipe(withLatestFrom(this.blocklyState.workspace$))
            .pipe(filter(([, workspace]) => !!workspace))
            .subscribe(([redo, workspace]) => workspace.undo(redo));


        // When Advanced CodeEditor is Selected, set the workspace status to SavingTemp and hide the sideNav
        this.appState.codeEditor$
            .pipe(
                pairwise(),
                filter(([previous, current]) => (current === CodeEditorType.CPP || current === CodeEditorType.Python ) && current !== previous)
            )
            .subscribe(() => {
                this.blocklyState.setIsSideNavOpen(false);
                //this.blocklyState.setWorkspaceStatus(WorkspaceStatus.SavingTemp) ? no reason to do this?
            });

        // Toggle the isSideNavOpen state
        this.blocklyState.isSideNavOpenToggled$
            .pipe(filter(isToggled => !!isToggled), withLatestFrom(this.blocklyState.isSideNavOpen$))
            .subscribe(([, isSideNavOpen]) => {
                this.blocklyState.setIsSideNavOpen(!isSideNavOpen);
            });

        // Toggle the isSoundOn state
        this.blocklyState.isSoundToggled$
            .pipe(filter(isToggled => !!isToggled), withLatestFrom(this.blocklyState.isSoundOn$))
            .subscribe(([, isSoundOn]) => {
                this.blocklyState.setIsSoundOn(!isSoundOn);
            });

        // When the sound is turned on off, update the Blockly function
        this.blocklyState.isSoundOn$
            .pipe(withLatestFrom(this.blocklyState.playSoundFunction$))
            .subscribe(([isSoundOn, basePlay]) => {
                if (!basePlay) {
                    basePlay = Blockly.WorkspaceAudio.prototype.play;
                    this.blocklyState.setPlaySoundFunction(basePlay);
                }
                Blockly.WorkspaceAudio.prototype.play = function (name, opt_volume) {
                    if (isSoundOn) {
                        basePlay.call(this, name, opt_volume);
                    }
                };
            });

        // When the code editor is changed, clear the projectFilePath
        this.appState.codeEditor$
            .subscribe(() => this.blocklyState.setProjectFileHandle(null));

        // React to messages received from the Backend
        this.backEndState.backEndMessages$
            .pipe(filter(message => !!message))
            .subscribe(message => {
                switch (message.event) {
                    case 'PREPARING_COMPILATION_ENVIRONMENT':
                    case 'COMPILATION_STARTED':
                    case 'COMPILATION_COMPLETE':
                    case 'UPDATE_STARTED':
                        this.blocklyState.setSketchStatusMessage(message.message);
                        break;
                    case 'ROBOT_REGISTERED':
                    case 'UPDATE_COMPLETE':
                        this.blocklyState.setSketchStatus(SketchStatus.ReadyToSend);
                        this.blocklyState.setSketchStatusMessage(null);
                        break;
                    case 'COMPILATION_FAILED':
                    case 'UPDATE_FAILED':
                        this.blocklyState.setSketchStatus(SketchStatus.UnableToSend);
                        this.blocklyState.setSketchStatusMessage(null);
                        break;
                    case 'WORKSPACE_SAVE_CANCELLED':
                        this.blocklyState.setWorkspaceStatus(WorkspaceStatus.Clean);
                        break;
                    case 'WORKSPACE_SAVED':
                        this.blocklyState.setProjectFileHandle(message.payload);
                        this.blocklyState.setWorkspaceStatus(WorkspaceStatus.Clean);
                        break;
                    case 'WORKSPACE_SAVED_TEMP':
                        this.blocklyState.setWorkspaceStatus(WorkspaceStatus.Clean);
                        break;
                    case 'WORKSPACE_RESTORING':
                        console.log("WORKSPACE_RESTORING");
                        if (message.payload.type == 'advanced' || message.payload.type == 'python') {
                            this.codeEditorState.getAceEditor().session.setValue(message.payload.data as string);
                            this.codeEditorState.setOriginalCode(message.payload.data as string);
                            this.codeEditorState.setCode(message.payload.data as string);
                            if (message.payload.type == 'advanced') {
                                this.appState.setSelectedCodeEditor(CodeEditorType.CPP);
                            } else if (message.payload.type == 'python') {
                                this.appState.setSelectedCodeEditor(CodeEditorType.Python);
                            }
                            this.blocklyState.setProjectFileHandle(message.payload.projectFilePath);
                            this.blocklyState.setWorkspaceStatus(WorkspaceStatus.Restoring);
                            this.appState.setSelectedRobotType(genericRobotType, true);
                            return;
                        }
                        this.appState.setSelectedRobotType(AppState.idToRobotType[message.payload.extension.replace('.', '')], true);
                        this.blocklyState.setWorkspaceJSON(message.payload.data as string);
                        this.blocklyState.setProjectFileHandle(message.payload.projectFilePath);
                        this.blocklyState.setWorkspaceStatus(WorkspaceStatus.Restoring);
                        break;
                    default:
                        console.log('Unknown message received from backend: ' + message.event);
                        break;
                }
            });
    }

    private parseCategory(root: Document, category: HTMLElement, robotType: RobotType,) : HTMLElement {
        // Remove blocks that aren't in robots list
        Array.from(category.querySelectorAll('block'))
            .filter(block => {
                const robots = block.querySelector('robots');
                if (!robots) return false;

                block.removeChild(robots);
                return !robots.querySelector(robotType.id);
            })
            .forEach(block => block.remove());

        // Add separator between groups
        Array.from(category.querySelectorAll('group'))
            .forEach(group => {
                const items = Array.from(group.querySelectorAll('block'))
                    .map((block, index, array) => {
                        if (index === array.length - 1) return block

                        const separator = root.createElement('sep')
                        separator.setAttribute('gap', '8')
                        return [block, separator]
                    })
                    .flat()

                group.before(...items)
                group.remove()
            })

        return category
    }

    private loadToolBox(baseToolboxXml: string, leaphyToolboxXml: string, robotType: RobotType) : string {
        const parser = new DOMParser();
        const toolboxXmlDoc = parser.parseFromString(baseToolboxXml, 'text/xml');
        const toolboxElement = toolboxXmlDoc.getElementById('easyBloqsToolbox');
        const leaphyCategories = parser.parseFromString(leaphyToolboxXml, 'text/xml');
        const leaphyRobotCategory = leaphyCategories.getElementById(robotType.id);
        if (robotType.features.showLeaphyOperators) {
            toolboxElement.removeChild(toolboxXmlDoc.getElementById("l_numbers"))
        } else {
            toolboxElement.removeChild(toolboxXmlDoc.getElementById("l_operators"))
        }
        if (robotType.features.showLeaphyActuators) {
            const leaphyExtraCategory = leaphyCategories.getElementById("l_actuators");
            leaphyExtraCategory.setAttribute("toolboxitemid", `${robotType.id}_actuators`)

            toolboxElement.prepend(this.parseCategory(leaphyCategories, leaphyExtraCategory, robotType));
        }
        if (robotType.features.showLeaphySensors) {
            const leaphySensorCategory = leaphyCategories.getElementById("l_sensors");
            leaphySensorCategory.setAttribute("toolboxitemid", `${robotType.id}_sensors`);

            toolboxElement.prepend(this.parseCategory(leaphyCategories, leaphySensorCategory, robotType));
        }
        if (!robotType.features.showLeaphyLists) {
            toolboxElement.removeChild(toolboxXmlDoc.getElementById("l_lists"))
        }
        if (leaphyRobotCategory) {
            toolboxElement.prepend(leaphyRobotCategory);
        }
        const serializer = new XMLSerializer();
        return serializer.serializeToString(toolboxXmlDoc);
    }

    private getXmlContent(path: string): Observable<string> {
        return this.http
            .get(path, {
                headers: new HttpHeaders()
                    .set('Content-Type', 'text/xml')
                    .append('Access-Control-Allow-Methods', 'GET')
                    .append('Access-Control-Allow-Origin', '*')
                    .append('Access-Control-Allow-Headers',
                        'Access-Control-Allow-Headers, Access-Control-Allow-Origin, Access-Control-Request-Method'),
                responseType: 'text'
            })
    }
}
