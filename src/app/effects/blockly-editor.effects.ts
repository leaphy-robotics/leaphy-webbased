import {Injectable} from '@angular/core';
import {BlocklyEditorState} from '../state/blockly-editor.state';
import {filter, pairwise, withLatestFrom} from 'rxjs/operators';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {combineLatest, Observable} from 'rxjs';
import {AppState} from '../state/app.state';
import {CodeEditorType} from '../domain/code-editor.type';
import * as Blockly from 'blockly';
import '@blockly/field-bitmap'

import {CATEGORIES, THEME, EXTENSIONS, translations, arduino, getBlocks} from "@leaphy-robotics/leaphy-blocks"
import {LeaphyCategory} from "../services/toolbox/category";
import {LeaphyToolbox} from "../services/toolbox/toolbox";
import {CodeEditorState} from "../state/code-editor.state";
import {genericRobotType, microPythonRobotType} from "../domain/robots";
import {RobotType} from "../domain/robot.type";
import {WorkspaceService} from "../services/workspace.service";
import {LocalStorageService} from "../services/localstorage.service";

@Injectable({
    providedIn: 'root',
})

// Defines the effects on the Blockly Editor that different state changes have
export class BlocklyEditorEffects {

    constructor(
        private blocklyState: BlocklyEditorState,
        private appState: AppState,
        private codeEditorState: CodeEditorState,
        private http: HttpClient,
        private workspaceService: WorkspaceService,
        private localStorage: LocalStorageService
    ) {
        Blockly.registry.register(
            Blockly.registry.Type.TOOLBOX_ITEM,
            Blockly.ToolboxCategory.registrationName,
            LeaphyCategory, true);
        Blockly.registry.register(Blockly.registry.Type.TOOLBOX, Blockly.CollapsibleToolboxCategory.registrationName, LeaphyToolbox);
        Blockly.registry.register(Blockly.registry.Type.SERIALIZER, "lists", new CATEGORIES.ListSerializer())

        Blockly.Extensions.register('appendStatementInputStack', EXTENSIONS.APPEND_STATEMENT_INPUT_STACK)
        Blockly.Extensions.register('list_select_extension', EXTENSIONS.LIST_SELECT_EXTENSION);

        // When the current language is set: Find and set the blockly translations
        this.appState.currentLanguage$
            .pipe(filter(language => !!language))
            .subscribe(async language => {
                Blockly.setLocale(translations[language.code]);
            });

        // When the language is changed, save the workspace temporarily
        this.appState.changedLanguage$
            .pipe(filter(language => !!language))
            .pipe(withLatestFrom(this.blocklyState.workspaceJSON$, this.appState.selectedRobotType$))
            .subscribe(([, workspaceXml]) => {
                this.workspaceService.saveWorkspaceTemp(workspaceXml).then(() => {});
                this.localStorage.store("changedLanguage", this.appState.getSelectedRobotType().id);
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
                config.theme = Blockly.Theme.defineTheme('leaphy', {
                    'blockStyles': THEME.defaultBlockStyles,
                    'categoryStyles': THEME.categoryStyles,
                    'componentStyles': THEME.componentStyles,
                    name: 'leaphy',
                });
                const toolboxXmlString = this.loadToolBox(baseToolboxXml, leaphyToolboxXml, robotType);
                config.toolbox = toolboxXmlString;
                // @ts-ignore
                const workspace = Blockly.inject(element, config);
                const toolbox = workspace.getToolbox();
                workspace.registerToolboxCategoryCallback('LISTS', CATEGORIES.LISTS);
                toolbox.getFlyout().autoClose = false;
                const xml = Blockly.utils.xml.textToDom(startWorkspaceXml);
                Blockly.Xml.domToWorkspace(xml, workspace);
                this.blocklyState.setWorkspace(workspace);
                this.blocklyState.setToolboxXml(toolboxXmlString);
                if (this.appState.getCurrentEditor() == CodeEditorType.Beginner) {
                    this.workspaceService.restoreWorkspaceTemp().then(() => {});
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
                    this.codeEditorState.setCode(arduino.workspaceToCode(workspace, this.appState.getSelectedRobotType().id));
                    this.blocklyState.setWorkspaceJSON(JSON.stringify(Blockly.serialization.workspaces.save(workspace)));
                });
            });

        // When the user presses undo or redo, trigger undo or redo on the workspace
        this.blocklyState.undo$
            .pipe(withLatestFrom(this.blocklyState.workspace$))
            .pipe(filter(([, workspace]) => !!workspace))
            .subscribe(([redo, workspace]) => workspace.undo(redo));


        // When Advanced CodeEditor is Selected, hide the sideNav
        this.appState.codeEditor$
            .pipe(
                pairwise(),
                filter(([previous, current]) => (current === CodeEditorType.CPP || current === CodeEditorType.Python ) && current !== previous)
            )
            .subscribe(() => {
                this.blocklyState.setIsSideNavOpen(false);
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
