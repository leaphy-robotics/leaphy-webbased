import * as Blockly from "blockly/core";

/**
 * Class for a toolbox.
 * Creates the toolbox's Blockly.utils.dom.
 *
 * @alias Blockly.Toolbox
 */
export class LeaphyToolbox
    extends Blockly.DeleteArea
    implements
        Blockly.IAutoHideable,
        Blockly.IKeyboardAccessible,
        Blockly.IStyleable,
        Blockly.IToolbox
{
    /**
     * The unique ID for this component that is used to register with the
     * ComponentManager.
     */
    override id = "toolbox";
    protected toolboxDef_: Blockly.utils.toolbox.ToolboxInfo;
    private readonly horizontalLayout_: boolean;

    /** The html container for the toolbox. */
    HtmlDiv: HTMLDivElement | null = null;

    /** The html container for the contents of a toolbox. */
    protected contentsDiv_: HTMLDivElement | null = null;

    /** Whether the toolbox is visible. */
    protected isVisible_ = false;

    /** The list of items in the toolbox. */
    protected contents_: Blockly.IToolboxItem[] = [];

    /** The width of the toolbox. */
    protected width_ = 0;

    /** The height of the toolbox. */
    protected height_ = 0;
    RTL: boolean;

    /** The flyout for the toolbox. */
    private flyout_: Blockly.IFlyout | null = null;
    protected contentMap_: { [key: string]: Blockly.IToolboxItem };
    toolboxPosition: Blockly.utils.toolbox.Position;

    /** The currently selected item. */
    protected selectedItem_: Blockly.ISelectableToolboxItem | null = null;

    /** The previously selected item. */
    protected previouslySelectedItem_: Blockly.ISelectableToolboxItem | null =
        null;

    /**
     * Array holding info needed to unbind event handlers.
     * Used for disposing.
     * Ex: [[node, name, func], [node, name, func]].
     */
    protected boundEvents_: Blockly.utils.browserEvents.Data[] = [];
    override wouldDelete_: any;

    /** The workspace this toolbox is on. */
    protected readonly workspace_: Blockly.WorkspaceSvg;

    /** @param workspace The workspace in which to create new blocks. */
    constructor(workspace: Blockly.WorkspaceSvg) {
        super();

        this.workspace_ = workspace;

        /** The JSON describing the contents of this toolbox. */
        // any because:  Type 'ToolboxInfo | { contents: never[]; }'
        // is not assignable to type 'ToolboxInfo'.
        this.toolboxDef_ = (workspace.options.languageTree || {
            contents: [],
        }) as any;

        /** Whether the toolbox should be laid out horizontally. */
        this.horizontalLayout_ = workspace.options.horizontalLayout;

        /** Is RTL vs LTR. */
        this.RTL = workspace.options.RTL;

        /** A map from toolbox item IDs to toolbox items. */
        this.contentMap_ = Object.create(null);

        /** Position of the toolbox and flyout relative to the workspace. */
        this.toolboxPosition = workspace.options.toolboxPosition;
    }

    /**
     * Handles the given keyboard shortcut.
     *
     * @param _shortcut The shortcut to be handled.
     * @returns True if the shortcut has been handled, false otherwise.
     */
    onShortcut(_shortcut: Blockly.ShortcutRegistry.KeyboardShortcut): boolean {
        return false;
    }

    /** Initializes the toolbox */
    init() {
        const workspace = this.workspace_;
        const svg = workspace.getParentSvg();

        this.flyout_ = this.createFlyout_();

        this.HtmlDiv = this.createDom_(this.workspace_);
        Blockly.utils.dom.insertAfter(this.flyout_.createDom("svg"), svg);
        this.setVisible(true);
        this.flyout_.init(workspace);

        this.render(this.toolboxDef_);
        const themeManager = workspace.getThemeManager();
        themeManager.subscribe(
            this.HtmlDiv,
            "toolboxBackgroundColour",
            "background-color",
        );
        themeManager.subscribe(
            this.HtmlDiv,
            "toolboxForegroundColour",
            "color",
        );
        this.workspace_.getComponentManager().addComponent({
            component: this,
            weight: 1,
            capabilities: [
                Blockly.ComponentManager.Capability.AUTOHIDEABLE,
                Blockly.ComponentManager.Capability.DELETE_AREA,
                Blockly.ComponentManager.Capability.DRAG_TARGET,
            ],
        });
    }

    /**
     * Creates the DOM for the toolbox.
     *
     * @param workspace The workspace this toolbox is on.
     * @returns The HTML container for the toolbox.
     */
    protected createDom_(workspace: Blockly.WorkspaceSvg): HTMLDivElement {
        const svg = workspace.getParentSvg();

        const container = this.createContainer_();

        this.contentsDiv_ = this.createContentsContainer_();
        this.contentsDiv_.tabIndex = 0;
        Blockly.utils.aria.setRole(
            this.contentsDiv_,
            Blockly.utils.aria.Role.TREE,
        );
        container.appendChild(this.contentsDiv_);

        svg.parentNode!.insertBefore(container, svg);

        this.attachEvents_(container, this.contentsDiv_);
        return container;
    }

    /**
     * Creates the container div for the toolbox.
     *
     * @returns The HTML container for the toolbox.
     */
    protected createContainer_(): HTMLDivElement {
        const toolboxContainer = document.createElement("div");
        toolboxContainer.setAttribute(
            "layout",
            this.isHorizontal() ? "h" : "v",
        );
        Blockly.utils.dom.addClass(toolboxContainer, "blocklyToolboxDiv");
        Blockly.utils.dom.addClass(toolboxContainer, "blocklyNonSelectable");
        toolboxContainer.setAttribute("dir", this.RTL ? "RTL" : "LTR");
        return toolboxContainer;
    }

    /**
     * Creates the container for all the contents in the toolbox.
     *
     * @returns The HTML container for the toolbox contents.
     */
    protected createContentsContainer_(): HTMLDivElement {
        const contentsContainer = document.createElement("div");
        Blockly.utils.dom.addClass(contentsContainer, "blocklyToolboxContents");
        if (this.isHorizontal()) {
            contentsContainer.style.flexDirection = "row";
        }
        return contentsContainer;
    }

    /**
     * Adds event listeners to the toolbox container div.
     *
     * @param container The HTML container for the toolbox.
     * @param contentsContainer The HTML container for the contents of the
     *     toolbox.
     */
    protected attachEvents_(
        container: HTMLDivElement,
        contentsContainer: HTMLDivElement,
    ) {
        // Clicking on toolbox closes popups.
        const clickEvent = Blockly.utils.browserEvents.conditionalBind(
            container,
            "click",
            this,
            this.onClick_,
            /* opt_noCaptureIdentifier */ false,
        );
        this.boundEvents_.push(clickEvent);

        const keyDownEvent = Blockly.utils.browserEvents.conditionalBind(
            contentsContainer,
            "keydown",
            this,
            this.onKeyDown_,
            /* opt_noCaptureIdentifier */ false,
        );
        this.boundEvents_.push(keyDownEvent);
    }

    /**
     * Handles on click events for when the toolbox or toolbox items are clicked.
     *
     * @param e Click event to handle.
     */
    protected onClick_(e: MouseEvent) {
        if (
            Blockly.utils.browserEvents.isRightButton(e) ||
            e.target === this.HtmlDiv
        ) {
            // Close flyout.
            (
                Blockly.common.getMainWorkspace() as Blockly.WorkspaceSvg
            ).hideChaff(false);
        } else {
            const targetElement = e.target;
            const itemId = (targetElement as Element).getAttribute("id");
            if (itemId) {
                const item = this.getToolboxItemById(itemId);
                if (item!.isSelectable()) {
                    this.setSelectedItem(item);
                    (item as Blockly.ISelectableToolboxItem).onClick(e);
                }
            }
            // Just close popups.
            (
                Blockly.common.getMainWorkspace() as Blockly.WorkspaceSvg
            ).hideChaff(true);
        }
        Blockly.Touch.clearTouchIdentifier();
    }

    /**
     * Handles key down events for the toolbox.
     *
     * @param e The key down event.
     */
    protected onKeyDown_(e: KeyboardEvent) {
        let handled = false;
        switch (e.keyCode) {
            case Blockly.utils.KeyCodes.DOWN:
                handled = this.selectNext_();
                break;
            case Blockly.utils.KeyCodes.UP:
                handled = this.selectPrevious_();
                break;
            case Blockly.utils.KeyCodes.LEFT:
                handled = this.selectParent_();
                break;
            case Blockly.utils.KeyCodes.RIGHT:
                handled = this.selectChild_();
                break;
            case Blockly.utils.KeyCodes.ENTER:
            case Blockly.utils.KeyCodes.SPACE:
                if (this.selectedItem_ && this.selectedItem_.isCollapsible()) {
                    const collapsibleItem = this
                        .selectedItem_ as Blockly.ICollapsibleToolboxItem;
                    collapsibleItem.toggleExpanded();
                    handled = true;
                }
                break;
            default:
                handled = false;
                break;
        }
        if (!handled && this.selectedItem_) {
            // TODO(#6097): Figure out who implements onKeyDown and which interface it
            // should be part of.
            const untypedItem = this.selectedItem_ as any;
            if (untypedItem.onKeyDown) {
                handled = untypedItem.onKeyDown(e);
            }
        }

        if (handled) {
            e.preventDefault();
        }
    }

    /**
     * Creates the flyout based on the toolbox layout.
     *
     * @returns The flyout for the toolbox.
     * @throws {Error} If missing a require for `Blockly.HorizontalFlyout`,
     *     `Blockly.VerticalFlyout`, and no flyout plugin is specified.
     */
    protected createFlyout_(): Blockly.IFlyout {
        const workspace = this.workspace_;
        // TODO (#4247): Look into adding a makeFlyout method to Blockly Options.
        const workspaceOptions = new Blockly.Options({
            parentWorkspace: workspace,
            rtl: workspace.RTL,
            oneBasedIndex: workspace.options.oneBasedIndex,
            horizontalLayout: workspace.horizontalLayout,
            renderer: workspace.options.renderer,
            rendererOverrides: workspace.options.rendererOverrides,
            move: {
                scrollbars: true,
            },
        } as Blockly.BlocklyOptions);
        // Options takes in either 'end' or 'start'. This has already been parsed to
        // be either 0 or 1, so set it after.
        workspaceOptions.toolboxPosition = workspace.options.toolboxPosition;
        let FlyoutClass;
        if (workspace.horizontalLayout) {
            FlyoutClass = Blockly.registry.getClassFromOptions(
                Blockly.registry.Type.FLYOUTS_HORIZONTAL_TOOLBOX,
                workspace.options,
                true,
            );
        } else {
            FlyoutClass = Blockly.registry.getClassFromOptions(
                Blockly.registry.Type.FLYOUTS_VERTICAL_TOOLBOX,
                workspace.options,
                true,
            );
        }
        return new FlyoutClass!(workspaceOptions);
    }

    /**
     * Fills the toolbox with new toolbox items and removes any old contents.
     *
     * @param toolboxDef Object holding information for creating a toolbox.
     * @internal
     */
    render(toolboxDef: Blockly.utils.toolbox.ToolboxInfo) {
        this.toolboxDef_ = toolboxDef;
        for (let i = 0; i < this.contents_.length; i++) {
            const toolboxItem = this.contents_[i];
            if (toolboxItem) {
                toolboxItem.dispose();
            }
        }
        this.contents_ = [];
        this.contentMap_ = Object.create(null);
        this.renderContents_(toolboxDef["contents"]);
        this.position();
        this.handleToolboxItemResize();
    }

    /**
     * Adds all the toolbox items to the toolbox.
     *
     * @param toolboxDef Array holding objects containing information on the
     *     contents of the toolbox.
     */
    protected renderContents_(
        toolboxDef: Blockly.utils.toolbox.ToolboxItemInfo[],
    ) {
        // This is for performance reasons. By using document fragment we only have
        // to add to the DOM once.
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < toolboxDef.length; i++) {
            const toolboxItemDef = toolboxDef[i];
            this.createToolboxItem_(toolboxItemDef, fragment);
        }
        this.contentsDiv_!.appendChild(fragment);
    }

    /**
     * Creates and renders the toolbox item.
     *
     * @param toolboxItemDef Any information that can be used to create an item in
     *     the toolbox.
     * @param fragment The document fragment to add the child toolbox elements to.
     */
    private createToolboxItem_(
        toolboxItemDef: Blockly.utils.toolbox.ToolboxItemInfo,
        fragment: DocumentFragment,
    ) {
        let registryName = toolboxItemDef["kind"];

        // Categories that are collapsible are created using a class registered
        // under a different name.
        if (
            registryName.toUpperCase() === "CATEGORY" &&
            Blockly.utils.toolbox.isCategoryCollapsible(
                toolboxItemDef as Blockly.utils.toolbox.CategoryInfo,
            )
        ) {
            registryName = Blockly.CollapsibleToolboxCategory.registrationName;
        }

        const ToolboxItemClass = Blockly.registry.getClass(
            Blockly.registry.Type.TOOLBOX_ITEM,
            registryName.toLowerCase(),
        );
        if (ToolboxItemClass) {
            const toolboxItem = new ToolboxItemClass(toolboxItemDef, this);
            toolboxItem.init();
            this.addToolboxItem_(toolboxItem);
            const toolboxItemDom = toolboxItem.getDiv();
            if (toolboxItemDom) {
                fragment.appendChild(toolboxItemDom);
            }
            // Adds the ID to the HTML element that can receive a click.
            // This is used in onClick_ to find the toolboxItem that was clicked.
            if (toolboxItem.getClickTarget()) {
                toolboxItem
                    .getClickTarget()!
                    .setAttribute("id", toolboxItem.getId());
            }
        }
    }

    /**
     * Adds an item to the toolbox.
     *
     * @param toolboxItem The item in the toolbox.
     */
    protected addToolboxItem_(toolboxItem: Blockly.IToolboxItem) {
        this.contents_.push(toolboxItem);
        this.contentMap_[toolboxItem.getId()] = toolboxItem;
        if (toolboxItem.isCollapsible()) {
            const collapsibleItem =
                toolboxItem as Blockly.ICollapsibleToolboxItem;
            const childToolboxItems = collapsibleItem.getChildToolboxItems();
            for (let i = 0; i < childToolboxItems.length; i++) {
                const child = childToolboxItems[i];
                this.addToolboxItem_(child);
            }
        }
    }

    /**
     * Gets the items in the toolbox.
     *
     * @returns The list of items in the toolbox.
     */
    getToolboxItems(): Blockly.IToolboxItem[] {
        return this.contents_;
    }

    /**
     * Adds a style on the toolbox. Usually used to change the cursor.
     *
     * @param style The name of the class to add.
     * @internal
     */
    addStyle(style: string) {
        if (style && this.HtmlDiv) {
            Blockly.utils.dom.addClass(this.HtmlDiv, style);
        }
    }

    /**
     * Removes a style from the toolbox. Usually used to change the cursor.
     *
     * @param style The name of the class to remove.
     * @internal
     */
    removeStyle(style: string) {
        if (style && this.HtmlDiv) {
            Blockly.utils.dom.removeClass(this.HtmlDiv, style);
        }
    }

    /**
     * Returns the bounding rectangle of the drag target area in pixel units
     * relative to viewport.
     *
     * @returns The component's bounding box. Null if drag target area should be
     *     ignored.
     */
    override getClientRect(): Blockly.utils.Rect | null {
        if (!this.HtmlDiv || !this.isVisible_) {
            return null;
        }
        // BIG_NUM is offscreen padding so that blocks dragged beyond the toolbox
        // area are still deleted.  Must be smaller than Infinity, but larger than
        // the largest screen size.
        const BIG_NUM = 10000000;
        const toolboxRect = this.HtmlDiv.getBoundingClientRect();

        const top = toolboxRect.top;
        const bottom = top + toolboxRect.height;
        const left = toolboxRect.left;
        const right = left + toolboxRect.width;

        // Assumes that the toolbox is on the SVG edge.  If this changes
        // (e.g. toolboxes in mutators) then this code will need to be more complex.
        if (this.toolboxPosition === Blockly.utils.toolbox.Position.TOP) {
            return new Blockly.utils.Rect(-BIG_NUM, bottom, -BIG_NUM, BIG_NUM);
        } else if (
            this.toolboxPosition === Blockly.utils.toolbox.Position.BOTTOM
        ) {
            return new Blockly.utils.Rect(top, BIG_NUM, -BIG_NUM, BIG_NUM);
        } else if (
            this.toolboxPosition === Blockly.utils.toolbox.Position.LEFT
        ) {
            return new Blockly.utils.Rect(-BIG_NUM, BIG_NUM, -BIG_NUM, right);
        } else {
            // Right
            return new Blockly.utils.Rect(-BIG_NUM, BIG_NUM, left, BIG_NUM);
        }
    }

    /**
     * Returns whether the provided block or bubble would be deleted if dropped on
     * this area.
     * This method should check if the element is deletable and is always called
     * before onDragEnter/onDragOver/onDragExit.
     *
     * @param element The block or bubble currently being dragged.
     * @param _couldConnect Whether the element could could connect to another.
     * @returns Whether the element provided would be deleted if dropped on this
     *     area.
     */
    override wouldDelete(
        element: Blockly.IDraggable,
        _couldConnect: boolean,
    ): boolean {
        if (element instanceof Blockly.BlockSvg) {
            const block = element;
            // Prefer dragging to the toolbox over connecting to other blocks.
            this.updateWouldDelete_(!block.getParent() && block.isDeletable());
        } else {
            this.updateWouldDelete_(element.isDeletable());
        }
        return this.wouldDelete_;
    }

    /**
     * Handles when a cursor with a block or bubble enters this drag target.
     *
     * @param _dragElement The block or bubble currently being dragged.
     */
    override onDragEnter(_dragElement: Blockly.IDraggable) {
        this.updateCursorDeleteStyle_(true);
    }

    /**
     * Handles when a cursor with a block or bubble exits this drag target.
     *
     * @param _dragElement The block or bubble currently being dragged.
     */
    override onDragExit(_dragElement: Blockly.IDraggable) {
        this.updateCursorDeleteStyle_(false);
    }

    /**
     * Handles when a block or bubble is dropped on this component.
     * Should not handle delete here.
     *
     * @param _dragElement The block or bubble currently being dragged.
     */
    override onDrop(_dragElement: Blockly.IDraggable) {
        this.updateCursorDeleteStyle_(false);
    }

    /**
     * Updates the internal wouldDelete_ state.
     *
     * @param wouldDelete The new value for the wouldDelete state.
     */
    protected override updateWouldDelete_(wouldDelete: boolean) {
        if (wouldDelete === this.wouldDelete_) {
            return;
        }
        // This logic handles updating the deleteStyle properly if the delete state
        // changes while the block is over the toolbox. This could happen if the
        // implementation of wouldDeleteBlock depends on the couldConnect parameter
        // or if the isDeletable property of the block currently being dragged
        // changes during the drag.
        this.updateCursorDeleteStyle_(false);
        this.wouldDelete_ = wouldDelete;
        this.updateCursorDeleteStyle_(true);
    }

    /**
     * Adds or removes the CSS style of the cursor over the toolbox based whether
     * the block or bubble over it is expected to be deleted if dropped (using the
     * internal this.wouldDelete_ property).
     *
     * @param addStyle Whether the style should be added or removed.
     */
    protected updateCursorDeleteStyle_(addStyle: boolean) {
        const style = this.wouldDelete_
            ? "blocklyToolboxDelete"
            : "blocklyToolboxGrab";
        if (addStyle) {
            this.addStyle(style);
        } else {
            this.removeStyle(style);
        }
    }

    /**
     * Gets the toolbox item with the given ID.
     *
     * @param id The ID of the toolbox item.
     * @returns The toolbox item with the given ID, or null if no item exists.
     */
    getToolboxItemById(id: string): Blockly.IToolboxItem | null {
        return this.contentMap_[id] || null;
    }

    /**
     * Gets the width of the toolbox.
     *
     * @returns The width of the toolbox.
     */
    getWidth(): number {
        return this.width_;
    }

    /**
     * Gets the height of the toolbox.
     *
     * @returns The width of the toolbox.
     */
    getHeight(): number {
        return this.height_;
    }

    /**
     * Gets the toolbox flyout.
     *
     * @returns The toolbox flyout.
     */
    getFlyout(): Blockly.IFlyout | null {
        return this.flyout_;
    }

    /**
     * Gets the workspace for the toolbox.
     *
     * @returns The parent workspace for the toolbox.
     */
    getWorkspace(): Blockly.WorkspaceSvg {
        return this.workspace_;
    }

    /**
     * Gets the selected item.
     *
     * @returns The selected item, or null if no item is currently selected.
     */
    getSelectedItem(): Blockly.ISelectableToolboxItem | null {
        return this.selectedItem_;
    }

    /**
     * Gets the previously selected item.
     *
     * @returns The previously selected item, or null if no item was previously
     *     selected.
     */
    getPreviouslySelectedItem(): Blockly.ISelectableToolboxItem | null {
        return this.previouslySelectedItem_;
    }

    /**
     * Gets whether or not the toolbox is horizontal.
     *
     * @returns True if the toolbox is horizontal, false if the toolbox is
     *     vertical.
     */
    isHorizontal(): boolean {
        return this.horizontalLayout_;
    }

    /**
     * Positions the toolbox based on whether it is a horizontal toolbox and
     * whether the workspace is in rtl.
     */
    position() {
        const workspaceMetrics = this.workspace_.getMetrics();
        const toolboxDiv = this.HtmlDiv;
        if (!toolboxDiv) {
            // Not initialized yet.
            return;
        }

        if (this.horizontalLayout_) {
            toolboxDiv.style.left = "0";
            toolboxDiv.style.height = "auto";
            toolboxDiv.style.width = "100%";
            this.height_ = toolboxDiv.offsetHeight;
            this.width_ = workspaceMetrics.viewWidth;
            if (this.toolboxPosition === Blockly.utils.toolbox.Position.TOP) {
                toolboxDiv.style.top = "0";
            } else {
                // Bottom
                toolboxDiv.style.bottom = "0";
            }
        } else {
            if (this.toolboxPosition === Blockly.utils.toolbox.Position.RIGHT) {
                toolboxDiv.style.right = "0";
            } else {
                // Left
                toolboxDiv.style.left = "0";
            }
            toolboxDiv.style.height = "100%";
            this.width_ = toolboxDiv.offsetWidth;
            this.height_ = workspaceMetrics.viewHeight;
        }
        this.flyout_!.position();
    }

    /**
     * Handles resizing the toolbox when a toolbox item resizes.
     *
     * @internal
     */
    handleToolboxItemResize() {
        // Reposition the workspace so that (0,0) is in the correct position
        // relative to the new absolute edge (ie toolbox edge).
        const workspace = this.workspace_;
        const rect = this.HtmlDiv!.getBoundingClientRect();
        const newX =
            this.toolboxPosition === Blockly.utils.toolbox.Position.LEFT
                ? workspace.scrollX + rect.width
                : workspace.scrollX;
        const newY =
            this.toolboxPosition === Blockly.utils.toolbox.Position.TOP
                ? workspace.scrollY + rect.height
                : workspace.scrollY;
        workspace.translate(newX, newY);

        // Even though the div hasn't changed size, the visible workspace
        // surface of the workspace has, so we may need to reposition everything.
        Blockly.common.svgResize(workspace);
    }

    /** Unhighlights any previously selected item. */
    clearSelection() {
        this.setSelectedItem(null);
    }

    /**
     * Updates the category colours and background colour of selected categories.
     *
     * @internal
     */
    refreshTheme() {
        for (let i = 0; i < this.contents_.length; i++) {
            const child = this.contents_[i];
            // TODO(#6097): Fix types or add refreshTheme to IToolboxItem.
            const childAsCategory = child as Blockly.ToolboxCategory;
            if (childAsCategory.refreshTheme) {
                childAsCategory.refreshTheme();
            }
        }
    }

    /**
     * Updates the flyout's content without closing it.  Should be used in
     * response to a change in one of the dynamic categories, such as variables or
     * procedures.
     */
    refreshSelection() {
        if (
            this.selectedItem_ &&
            this.selectedItem_.isSelectable() &&
            this.selectedItem_.getContents().length
        ) {
            this.flyout_!.show(this.selectedItem_.getContents());
        }
    }

    /**
     * Shows or hides the toolbox.
     *
     * @param isVisible True if toolbox should be visible.
     */
    setVisible(isVisible: boolean) {
        if (this.isVisible_ === isVisible) {
            return;
        }

        this.HtmlDiv!.style.display = isVisible ? "block" : "none";
        this.isVisible_ = isVisible;
        // Invisible toolbox is ignored as drag targets and must have the drag
        // target updated.
        this.workspace_.recordDragTargets();
    }

    /**
     * Hides the component. Called in WorkspaceSvg.hideChaff.
     *
     * @param onlyClosePopups Whether only popups should be closed.
     *     Flyouts should not be closed if this is true.
     */
    autoHide(onlyClosePopups: boolean) {
        if (!onlyClosePopups && this.flyout_ && this.flyout_.autoClose) {
            this.clearSelection();
        }
    }

    /**
     * Sets the given item as selected.
     * No-op if the item is not selectable.
     *
     * @param newItem The toolbox item to select.
     */
    setSelectedItem(newItem: Blockly.IToolboxItem | null) {
        const oldItem = this.selectedItem_;

        if ((!newItem && !oldItem) || (newItem && !newItem.isSelectable())) {
            return;
        }
        newItem = newItem as Blockly.ISelectableToolboxItem;

        // any because:  Argument of type 'IToolboxItem' is not
        // assignable to parameter of type 'ISelectableToolboxItem'.
        if (
            this.shouldDeselectItem_(oldItem, newItem as any) &&
            oldItem !== null
        ) {
            this.deselectItem_(oldItem);
        }

        // any because:  Argument of type 'IToolboxItem' is not
        // assignable to parameter of type 'ISelectableToolboxItem'.
        if (
            this.shouldSelectItem_(oldItem, newItem as any) &&
            newItem !== null
        ) {
            // any because:  Argument of type 'IToolboxItem' is not
            // assignable to parameter of type 'ISelectableToolboxItem'.
            this.selectItem_(oldItem, newItem as any);
        }

        // any because:  Argument of type 'IToolboxItem' is not
        // assignable to parameter of type 'ISelectableToolboxItem'.
        this.updateFlyout_(oldItem, newItem as any);
        // any because:  Argument of type 'IToolboxItem' is not
        // assignable to parameter of type 'ISelectableToolboxItem'.
        this.fireSelectEvent_(oldItem, newItem as any);
    }

    /**
     * Decides whether the old item should be deselected.
     *
     * @param oldItem The previously selected toolbox item.
     * @param newItem The newly selected toolbox item.
     * @returns True if the old item should be deselected, false otherwise.
     */
    protected shouldDeselectItem_(
        oldItem: Blockly.ISelectableToolboxItem | null,
        newItem: Blockly.ISelectableToolboxItem | null,
    ): boolean {
        // Deselect the old item unless the old item is collapsible and has been
        // previously clicked on.
        return (
            oldItem !== null &&
            (!oldItem.isCollapsible() || oldItem !== newItem)
        );
    }

    /**
     * Decides whether the new item should be selected.
     *
     * @param oldItem The previously selected toolbox item.
     * @param newItem The newly selected toolbox item.
     * @returns True if the new item should be selected, false otherwise.
     */
    protected shouldSelectItem_(
        oldItem: Blockly.ISelectableToolboxItem | null,
        newItem: Blockly.ISelectableToolboxItem | null,
    ): boolean {
        // Select the new item unless the old item equals the new item.
        return newItem !== null && newItem !== oldItem;
    }

    /**
     * Deselects the given item, marks it as unselected, and updates aria state.
     *
     * @param item The previously selected toolbox item which should be
     *     deselected.
     */
    protected deselectItem_(item: Blockly.ISelectableToolboxItem) {
        this.selectedItem_ = null;
        this.previouslySelectedItem_ = item;
        item.setSelected(false);
        Blockly.utils.aria.setState(
            this.contentsDiv_ as Element,
            Blockly.utils.aria.State.ACTIVEDESCENDANT,
            "",
        );
    }

    /**
     * Selects the given item, marks it selected, and updates aria state.
     *
     * @param oldItem The previously selected toolbox item.
     * @param newItem The newly selected toolbox item.
     */
    protected selectItem_(
        oldItem: Blockly.ISelectableToolboxItem | null,
        newItem: Blockly.ISelectableToolboxItem,
    ) {
        this.selectedItem_ = newItem;
        this.previouslySelectedItem_ = oldItem;
        newItem.setSelected(true);
        Blockly.utils.aria.setState(
            this.contentsDiv_ as Element,
            Blockly.utils.aria.State.ACTIVEDESCENDANT,
            newItem.getId(),
        );
    }

    /**
     * Selects the toolbox item by its position in the list of toolbox items.
     *
     * @param position The position of the item to select.
     */
    selectItemByPosition(position: number) {
        if (position > -1 && position < this.contents_.length) {
            const item = this.contents_[position];
            if (item.isSelectable()) {
                this.setSelectedItem(item);
            }
        }
    }

    /**
     * Decides whether to hide or show the flyout depending on the selected item.
     *
     * @param oldItem The previously selected toolbox item.
     * @param newItem The newly selected toolbox item.
     */
    protected updateFlyout_(
        oldItem: Blockly.ISelectableToolboxItem | null,
        newItem: Blockly.ISelectableToolboxItem | null,
    ) {
        if (
            !newItem ||
            (oldItem === newItem && !newItem.isCollapsible()) ||
            !newItem.getContents().length
        ) {
            this.flyout_!.hide();
        } else {
            this.flyout_!.show(newItem.getContents());
            this.flyout_!.scrollToStart();
        }
    }

    /**
     * Emits an event when a new toolbox item is selected.
     *
     * @param oldItem The previously selected toolbox item.
     * @param newItem The newly selected toolbox item.
     */
    private fireSelectEvent_(
        oldItem: Blockly.ISelectableToolboxItem | null,
        newItem: Blockly.ISelectableToolboxItem | null,
    ) {
        const oldElement = oldItem && oldItem.getName();
        let newElement = newItem && newItem.getName();
        // In this case the toolbox closes, so the newElement should be null.
        if (oldItem === newItem) {
            newElement = null;
        }
        const event = new (Blockly.Events.get(
            Blockly.Events.TOOLBOX_ITEM_SELECT,
        ))(oldElement, newElement, this.workspace_.id);
        Blockly.Events.fire(event);
    }

    /**
     * Closes the current item if it is expanded, or selects the parent.
     *
     * @returns True if a parent category was selected, false otherwise.
     */
    private selectParent_(): boolean {
        if (!this.selectedItem_) {
            return false;
        }

        if (
            this.selectedItem_.isCollapsible() &&
            (this.selectedItem_ as Blockly.ICollapsibleToolboxItem).isExpanded()
        ) {
            const collapsibleItem = this
                .selectedItem_ as Blockly.ICollapsibleToolboxItem;
            collapsibleItem.toggleExpanded();
            return true;
        } else if (
            this.selectedItem_.getParent() &&
            this.selectedItem_.getParent()!.isSelectable()
        ) {
            this.setSelectedItem(this.selectedItem_.getParent());
            return true;
        }
        return false;
    }

    /**
     * Selects the first child of the currently selected item, or nothing if the
     * toolbox item has no children.
     *
     * @returns True if a child category was selected, false otherwise.
     */
    private selectChild_(): boolean {
        if (!this.selectedItem_ || !this.selectedItem_.isCollapsible()) {
            return false;
        }
        const collapsibleItem = this
            .selectedItem_ as Blockly.ICollapsibleToolboxItem;
        if (!collapsibleItem.isExpanded()) {
            collapsibleItem.toggleExpanded();
            return true;
        } else {
            this.selectNext_();
            return true;
        }
    }

    /**
     * Selects the next visible toolbox item.
     *
     * @returns True if a next category was selected, false otherwise.
     */
    private selectNext_(): boolean {
        if (!this.selectedItem_) {
            return false;
        }

        let nextItemIdx = this.contents_.indexOf(this.selectedItem_) + 1;
        if (nextItemIdx > -1 && nextItemIdx < this.contents_.length) {
            let nextItem = this.contents_[nextItemIdx];
            while (nextItem && !nextItem.isSelectable()) {
                nextItem = this.contents_[++nextItemIdx];
            }
            if (nextItem && nextItem.isSelectable()) {
                this.setSelectedItem(nextItem);
                return true;
            }
        }
        return false;
    }

    /**
     * Selects the previous visible toolbox item.
     *
     * @returns True if a previous category was selected, false otherwise.
     */
    private selectPrevious_(): boolean {
        if (!this.selectedItem_) {
            return false;
        }

        let prevItemIdx = this.contents_.indexOf(this.selectedItem_) - 1;
        if (prevItemIdx > -1 && prevItemIdx < this.contents_.length) {
            let prevItem = this.contents_[prevItemIdx];
            while (prevItem && !prevItem.isSelectable()) {
                prevItem = this.contents_[--prevItemIdx];
            }
            if (prevItem && prevItem.isSelectable()) {
                this.setSelectedItem(prevItem);
                return true;
            }
        }
        return false;
    }

    /** Disposes of this toolbox. */
    dispose() {
        this.workspace_.getComponentManager().removeComponent("toolbox");
        this.flyout_!.dispose();
        for (let i = 0; i < this.contents_.length; i++) {
            const toolboxItem = this.contents_[i];
            toolboxItem.dispose();
        }

        for (let j = 0; j < this.boundEvents_.length; j++) {
            Blockly.utils.browserEvents.unbind(this.boundEvents_[j]);
        }
        this.boundEvents_ = [];
        this.contents_ = [];

        // any because:  Argument of type 'HTMLDivElement | null' is
        // not assignable to parameter of type 'Element'.
        this.workspace_.getThemeManager().unsubscribe(this.HtmlDiv as any);
        Blockly.utils.dom.removeNode(this.HtmlDiv);
    }
}

/** CSS for toolbox.  See css.js for use. */
Blockly.Css.register(`
.blocklyToolboxDelete {
  cursor: url("<<<PATH>>>/handdelete.cur"), auto;
}

.blocklyToolboxGrab {
  cursor: url("<<<PATH>>>/handclosed.cur"), auto;
  cursor: grabbing;
  cursor: -webkit-grabbing;
}

/* Category tree in Toolbox. */
.blocklyToolboxDiv {
  background-color: #ddd;
  overflow-x: visible;
  overflow-y: auto;
  padding: 0px 0 0px 0;
  position: absolute;
  z-index: 70;  /* so blocks go under toolbox when dragging */
  -webkit-tap-highlight-color: transparent;  /* issue #1345 */
}

.blocklyToolboxContents {
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
}

.blocklyToolboxContents:focus {
  outline: none;
}
`);
