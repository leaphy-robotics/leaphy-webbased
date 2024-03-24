import * as Blockly from "blockly/core";

/**
 * Class for a category in a toolbox.
 *
 * @alias Blockly.ToolboxCategory
 */
export class LeaphyCategory
    extends Blockly.ToolboxCategory
    implements Blockly.ISelectableToolboxItem
{
    /** Name used for registering a toolbox category. */
    static registrationName = "category";

    /** The number of pixels to move the category over at each nested level. */
    static nestedPadding = 19;

    /** The width in pixels of the strip of colour next to each category. */
    static borderWidth = 8;

    /**
     * The default colour of the category. This is used as the background colour
     * of the category when it is selected.
     */
    static defaultBackgroundColour = "#57e";

    // TODO(b/109816955): remove '!', see go/strict-prop-init-fix.
    override toolboxItemDef_!: Blockly.utils.toolbox.CategoryInfo;

    /** The name that will be displayed on the category. */
    protected name_ = "";

    /** The colour of the category. */
    protected colour_ = "";

    /** The html container for the category. */
    protected htmlDiv_: HTMLDivElement | null = null;

    /** The html element for the category row. */
    protected rowDiv_: HTMLDivElement | null = null;

    /** The html element that holds children elements of the category row. */
    protected rowContents_: HTMLDivElement | null = null;

    /** The html element for the toolbox icon. */
    protected iconDom_: Element | null = null;

    /** The html element for the toolbox label. */
    protected labelDom_: Element | null = null;
    protected cssConfig_: CssConfig;

    /** True if the category is meant to be hidden, false otherwise. */
    protected isHidden_ = false;

    /** True if this category is disabled, false otherwise. */
    protected isDisabled_ = false;

    /** The flyout items for this category. */
    protected flyoutItems_: string | Blockly.utils.toolbox.FlyoutItemInfoArray =
        [];

    /**
     * @param categoryDef The information needed to create a category in the
     *     toolbox.
     * @param parentToolbox The parent toolbox for the category.
     * @param opt_parent The parent category or null if the category does not have
     *     a parent.
     */
    constructor(
        categoryDef: Blockly.utils.toolbox.CategoryInfo,
        parentToolbox: Blockly.IToolbox,
        opt_parent?: Blockly.ICollapsibleToolboxItem,
    ) {
        super(categoryDef, parentToolbox, opt_parent);

        /** All the css class names that are used to create a category. */
        this.cssConfig_ = this.makeDefaultCssConfig_();
    }

    /**
     * Initializes the toolbox item.
     * This includes creating the DOM and updating the state of any items based
     * on the info object.
     * Init should be called immediately after the construction of the toolbox
     * item, to ensure that the category contents are properly parsed.
     */
    override init() {
        this.parseCategoryDef_(this.toolboxItemDef_);
        this.parseContents_(this.toolboxItemDef_);
        this.createDom_();
        if (this.toolboxItemDef_["hidden"] === "true") {
            this.hide();
        }
    }

    /**
     * Creates an object holding the default classes for a category.
     *
     * @returns The configuration object holding all the CSS classes for a
     *     category.
     */
    protected makeDefaultCssConfig_(): CssConfig {
        return {
            container: "blocklyToolboxCategory",
            row: "blocklyTreeRow",
            rowcontentcontainer: "blocklyTreeRowContentContainer",
            icon: "blocklyTreeIcon",
            label: "blocklyTreeLabel",
            contents: "blocklyToolboxContents",
            selected: "blocklyTreeSelected",
            openicon: "blocklyTreeIconOpen",
            closedicon: "blocklyTreeIconClosed",
        };
    }

    /**
     * Parses the contents array depending on if the category is a dynamic
     * category, or if its contents are meant to be shown in the flyout.
     *
     * @param categoryDef The information needed to create a category.
     */
    protected parseContents_(categoryDef: Blockly.utils.toolbox.CategoryInfo) {
        if ("custom" in categoryDef) {
            this.flyoutItems_ = categoryDef["custom"];
        } else {
            const contents = categoryDef["contents"];
            if (!contents) return;

            for (let i = 0; i < contents.length; i++) {
                const itemDef = contents[i];
                const flyoutItem =
                    itemDef as Blockly.utils.toolbox.FlyoutItemInfo;
                if (Array.isArray(this.flyoutItems_)) {
                    this.flyoutItems_.push(flyoutItem);
                }
            }
        }
    }

    /**
     * Parses the non-contents parts of the category def.
     *
     * @param categoryDef The information needed to create a category.
     */
    protected parseCategoryDef_(
        categoryDef: Blockly.utils.toolbox.CategoryInfo,
    ) {
        this.name_ =
            "name" in categoryDef
                ? Blockly.utils.parsing.replaceMessageReferences(
                      categoryDef["name"],
                  )
                : "";
        this.colour_ = this.getColour_(categoryDef);
        Object.assign(
            this.cssConfig_,
            categoryDef["cssconfig"] || (categoryDef as any)["cssConfig"],
        );
    }

    /**
     * Creates the DOM for the category.
     *
     * @returns The parent element for the category.
     */
    protected createDom_(): HTMLDivElement {
        this.htmlDiv_ = this.createContainer_();
        Blockly.utils.aria.setRole(
            this.htmlDiv_,
            Blockly.utils.aria.Role.TREEITEM,
        );
        Blockly.utils.aria.setState(
            this.htmlDiv_,
            Blockly.utils.aria.State.SELECTED,
            false,
        );
        Blockly.utils.aria.setState(
            this.htmlDiv_,
            Blockly.utils.aria.State.LEVEL,
            this.level_,
        );

        this.rowDiv_ = this.createRowContainer_();
        this.rowDiv_.style.pointerEvents = "auto";
        this.htmlDiv_.appendChild(this.rowDiv_);

        this.rowContents_ = this.createRowContentsContainer_();
        this.rowContents_.style.pointerEvents = "none";
        this.rowDiv_.appendChild(this.rowContents_);

        // This is disabled because the icon is now created within the
        // createLabelDom_ method.
        // TODO: We should evaluate whether it would not be better to just use the
        // createIconDom_ for this because it is a better fit semantically.
        // this.iconDom_ = this.createIconDom_();
        // aria.setRole(this.iconDom_, aria.Role.PRESENTATION);
        // this.rowContents_.appendChild(this.iconDom_);

        // This is changed to a separate method that creates the label in the Leaphy
        // way See other comments for possible improvements in this area.
        this.labelDom_ = this.createLeaphyLabelDom_(this.name_);
        // this.labelDom_ = this.createLabelDom_(this.name_);
        this.rowContents_.appendChild(this.labelDom_);

        const id = this.labelDom_.getAttribute("id");
        if (id) {
            Blockly.utils.aria.setState(
                this.htmlDiv_,
                Blockly.utils.aria.State.LABELLEDBY,
                id,
            );
        }

        // This is disabled because we have this inside the Leaphy Client now.
        // TODO: We should try to have this back into Blockly
        // this.addColourBorder_(this.colour_);

        return this.htmlDiv_;
    }

    /**
     * Creates the container that holds the row and any subcategories.
     *
     * @returns The div that holds the icon and the label.
     */
    protected createContainer_(): HTMLDivElement {
        const container = document.createElement("div");
        const className = this.cssConfig_["container"];
        if (className) {
            Blockly.utils.dom.addClass(container, className);
        }
        return container;
    }

    /**
     * Creates the parent of the contents container. All clicks will happen on
     * this div.
     *
     * @returns The div that holds the contents container.
     */
    protected createRowContainer_(): HTMLDivElement {
        const rowDiv = document.createElement("div");
        const className = this.cssConfig_["row"];
        if (className) {
            Blockly.utils.dom.addClass(rowDiv, className);
        }
        const nestedPadding = `${Blockly.ToolboxCategory.nestedPadding * this.getLevel()}px`;
        this.workspace_.RTL
            ? (rowDiv.style.paddingRight = nestedPadding)
            : (rowDiv.style.paddingLeft = nestedPadding);
        return rowDiv;
    }

    /**
     * Creates the container for the label and icon.
     * This is necessary so we can set all subcategory pointer events to none.
     *
     * @returns The div that holds the icon and the label.
     */
    protected createRowContentsContainer_(): HTMLDivElement {
        const contentsContainer = document.createElement("div");
        const className = this.cssConfig_["rowcontentcontainer"];
        if (className) {
            Blockly.utils.dom.addClass(contentsContainer, className);
        }
        return contentsContainer;
    }

    /**
     * Creates the span that holds the category icon.
     *
     * @returns The span that holds the category icon.
     */
    protected createIconDom_(): Element {
        const toolboxIcon = document.createElement("span");
        if (!this.parentToolbox_.isHorizontal()) {
            const className = this.cssConfig_["icon"];
            if (className) {
                Blockly.utils.dom.addClass(toolboxIcon, className);
            }
        }

        toolboxIcon.style.display = "inline-block";
        return toolboxIcon;
    }

    /**
     * Creates the span that holds the Leaphy category label.
     * This should have an ID for accessibility purposes.
     *
     * @param {string} name The name of the category.
     * @return {!Element} The span that holds the category label.
     * @protected
     */
    createLeaphyLabelDom_(name: string) {
        const toolboxLabelContainer = document.createElement("div");
        toolboxLabelContainer.style.position = "relative";

        const toolboxIcon = document.createElement("img");
        toolboxIcon.setAttribute("src", "media/" + this.getId() + ".svg");
        toolboxIcon.setAttribute("height", "72px");
        toolboxIcon.setAttribute("width", "72px");
        toolboxIcon.style.marginLeft = "0px";

        toolboxLabelContainer.appendChild(toolboxIcon);

        const toolboxTextLabel = document.createElement("div");

        toolboxTextLabel.style.top = "40px";
        toolboxTextLabel.style.width = "50px";
        toolboxTextLabel.style.marginLeft = "11px";
        toolboxTextLabel.style.position = "absolute";
        toolboxTextLabel.style.fontSize = "10px";
        toolboxTextLabel.style.lineHeight = "12px";
        toolboxTextLabel.style.lineHeight = "99%";
        toolboxTextLabel.style.textAlign = "center";
        toolboxTextLabel.style.verticalAlign = "top";
        toolboxTextLabel.style.whiteSpace = "pre-wrap";

        toolboxTextLabel.textContent = name;

        toolboxLabelContainer.appendChild(toolboxTextLabel);

        return toolboxLabelContainer;
    }

    /**
     * Creates the span that holds the category label.
     * This should have an ID for accessibility purposes.
     *
     * @param name The name of the category.
     * @returns The span that holds the category label.
     */
    protected createLabelDom_(name: string): Element {
        const toolboxLabel = document.createElement("span");
        toolboxLabel.setAttribute("id", this.getId() + ".label");
        toolboxLabel.textContent = name;
        const className = this.cssConfig_["label"];
        if (className) {
            Blockly.utils.dom.addClass(toolboxLabel, className);
        }
        return toolboxLabel;
    }

    /** Updates the colour for this category. */
    refreshTheme() {
        this.colour_ = this.getColour_(this.toolboxItemDef_);
        this.addColourBorder_(this.colour_);
    }

    /**
     * Add the strip of colour to the toolbox category.
     *
     * @param colour The category colour.
     */
    protected addColourBorder_(colour: string) {
        if (colour) {
            const border =
                Blockly.ToolboxCategory.borderWidth +
                "px solid " +
                (colour || "#ddd");
            if (this.workspace_.RTL) {
                this.rowDiv_!.style.borderRight = border;
            } else {
                this.rowDiv_!.style.borderLeft = border;
            }
        }
    }

    /**
     * Gets the HTML element that is clickable.
     * The parent toolbox element receives clicks. The parent toolbox will add an
     * ID to this element so it can pass the onClick event to the correct
     * toolboxItem.
     *
     * @returns The HTML element that receives clicks.
     */
    override getClickTarget(): Element {
        return this.rowDiv_ as Element;
    }

    /**
     * Adds appropriate classes to display an open icon.
     *
     * @param iconDiv The div that holds the icon.
     */
    protected openIcon_(iconDiv: Element | null) {
        if (!iconDiv) {
            return;
        }
        const closedIconClass = this.cssConfig_["closedicon"];
        if (closedIconClass) {
            Blockly.utils.dom.removeClasses(iconDiv, closedIconClass);
        }
        const className = this.cssConfig_["openicon"];
        if (className) {
            Blockly.utils.dom.addClass(iconDiv, className);
        }
    }

    /**
     * Adds appropriate classes to display a closed icon.
     *
     * @param iconDiv The div that holds the icon.
     */
    protected closeIcon_(iconDiv: Element | null) {
        if (!iconDiv) {
            return;
        }
        const openIconClass = this.cssConfig_["openicon"];
        if (openIconClass) {
            Blockly.utils.dom.removeClasses(iconDiv, openIconClass);
        }
        const className = this.cssConfig_["closedicon"];
        if (className) {
            Blockly.utils.dom.addClass(iconDiv, className);
        }
    }

    /**
     * Sets whether the category is visible or not.
     * For a category to be visible its parent category must also be expanded.
     *
     * @param isVisible True if category should be visible.
     */
    override setVisible_(isVisible: boolean) {
        this.htmlDiv_!.style.display = isVisible ? "block" : "none";
        this.isHidden_ = !isVisible;

        if (this.parentToolbox_.getSelectedItem() === this) {
            this.parentToolbox_.clearSelection();
        }
    }

    /** Hide the category. */
    hide() {
        this.setVisible_(false);
    }

    /**
     * Show the category. Category will only appear if its parent category is also
     * expanded.
     */
    show() {
        this.setVisible_(true);
    }

    /**
     * Whether the category is visible.
     * A category is only visible if all of its ancestors are expanded and
     * isHidden_ is false.
     *
     * @returns True if the category is visible, false otherwise.
     */
    isVisible(): boolean {
        return !this.isHidden_ && this.allAncestorsExpanded_();
    }

    /**
     * Whether all ancestors of a category (parent and parent's parent, etc.) are
     * expanded.
     *
     * @returns True only if every ancestor is expanded
     */
    protected allAncestorsExpanded_(): boolean {
        /* eslint-disable-next-line @typescript-eslint/no-this-alias */
        let category: Blockly.IToolboxItem = this;
        while (category.getParent()) {
            category = category.getParent()!;
            if (!(category as Blockly.ICollapsibleToolboxItem).isExpanded()) {
                return false;
            }
        }
        return true;
    }

    override isSelectable() {
        return this.isVisible() && !this.isDisabled_;
    }

    /**
     * Handles when the toolbox item is clicked.
     *
     * @param _e Click event to handle.
     */
    onClick(_e: Event) {}

    /**
     * Sets whether the category is disabled.
     *
     * @param isDisabled True to disable the category, false otherwise.
     */
    setDisabled(isDisabled: boolean) {
        this.isDisabled_ = isDisabled;
        this.getDiv()!.setAttribute("disabled", `${isDisabled}`);
        isDisabled
            ? this.getDiv()!.setAttribute("disabled", "true")
            : this.getDiv()!.removeAttribute("disabled");
    }

    /**
     * Gets the name of the category. Used for emitting events.
     *
     * @returns The name of the toolbox item.
     */
    getName(): string {
        return this.name_;
    }

    override getParent() {
        return this.parent_;
    }

    override getDiv() {
        return this.htmlDiv_;
    }

    /**
     * Gets the contents of the category. These are items that are meant to be
     * displayed in the flyout.
     *
     * @returns The definition of items to be displayed in the flyout.
     */
    getContents(): Blockly.utils.toolbox.FlyoutItemInfoArray | string {
        return this.flyoutItems_;
    }

    /**
     * Updates the contents to be displayed in the flyout.
     * If the flyout is open when the contents are updated, refreshSelection on
     * the toolbox must also be called.
     *
     * @param contents The contents to be displayed in the flyout. A string can be
     *     supplied to create a dynamic category.
     */
    updateFlyoutContents(
        contents: Blockly.utils.toolbox.FlyoutDefinition | string,
    ) {
        this.flyoutItems_ = [];

        if (typeof contents === "string") {
            this.toolboxItemDef_ = {
                kind: this.toolboxItemDef_.kind,
                custom: contents,
                id: this.toolboxItemDef_.id,
                categorystyle: this.toolboxItemDef_.categorystyle,
                colour: this.toolboxItemDef_.colour,
                cssconfig: this.toolboxItemDef_.cssconfig,
                hidden: this.toolboxItemDef_.hidden,
            };
        } else {
            this.toolboxItemDef_ = {
                kind: this.toolboxItemDef_.kind,
                name:
                    "name" in this.toolboxItemDef_
                        ? this.toolboxItemDef_["name"]
                        : "",
                contents:
                    Blockly.utils.toolbox.convertFlyoutDefToJsonArray(contents),
                id: this.toolboxItemDef_.id,
                categorystyle: this.toolboxItemDef_.categorystyle,
                colour: this.toolboxItemDef_.colour,
                cssconfig: this.toolboxItemDef_.cssconfig,
                hidden: this.toolboxItemDef_.hidden,
            };
        }
        this.parseContents_(this.toolboxItemDef_);
    }

    override dispose() {
        Blockly.utils.dom.removeNode(this.htmlDiv_);
    }
}

export namespace ToolboxCategory {
    /** All the CSS class names that are used to create a category. */
    export interface CssConfig {
        container?: string;
        row?: string;
        rowcontentcontainer?: string;
        icon?: string;
        label?: string;
        contents?: string;
        selected?: string;
        openicon?: string;
        closedicon?: string;
    }
}

export type CssConfig = ToolboxCategory.CssConfig;

/** CSS for toolbox.  See css.js for use. */
Blockly.Css.register(`
.blocklyTreeRow:not(.blocklyTreeSelected):hover {
  background-color: rgba(255, 255, 255, .2);
}

.blocklyToolboxDiv[layout="h"] .blocklyToolboxCategory {
  margin: 1px 0px 1px 0;
}

.blocklyToolboxDiv[dir="RTL"][layout="h"] .blocklyToolboxCategory {
  margin: 1px 0 1px 0px;
}

.blocklyTreeRow {
  text-align: center;
  height: 72px;
  max-width: 72px;
  margin-bottom: 0px;
  padding: 0px;
}

.blocklyToolboxDiv[dir="RTL"] .blocklyTreeRow {
  margin-left: 8px;
  padding-right: 0;
}

.blocklyTreeIcon {
  background-image: url(<<<PATH>>>/sprites.png);
  height: 16px;
  vertical-align: middle;
  visibility: hidden;
  width: 16px;
}

.blocklyTreeIconClosed {
  background-position: -32px -1px;
}

.blocklyToolboxDiv[dir="RTL"] .blocklyTreeIconClosed {
  background-position: 0 -1px;
}

.blocklyTreeSelected>.blocklyTreeIconClosed {
  background-position: -32px -17px;
}

.blocklyToolboxDiv[dir="RTL"] .blocklyTreeSelected>.blocklyTreeIconClosed {
  background-position: 0 -17px;
}

.blocklyTreeIconOpen {
  background-position: -16px -1px;
}

.blocklyTreeSelected>.blocklyTreeIconOpen {
  background-position: -16px -17px;
}

.blocklyTreeLabel {
  cursor: default;
  font: 16px sans-serif;
  padding: 0 3px;
  vertical-align: middle;
}

.blocklyToolboxDelete .blocklyTreeLabel {
  cursor: url("<<<PATH>>>/handdelete.cur"), auto;
}

.blocklyTreeSelected .blocklyTreeLabel {
  color: #fff;
}
`);
