import { Backpack as BaseBackpack } from '@blockly/workspace-backpack';
import Blockly from "blockly/core";

// TODO: Use inheritance on a newer typescript version
const Backpack = BaseBackpack;
Backpack.prototype.position = function(metrics: Blockly.MetricsManager.UiMetrics, savedPositions: Blockly.utils.Rect[]) {
    const toolbox = this.workspace_.getToolbox();

    this.left_ =
        metrics.absoluteMetrics.left +
        (toolbox.getFlyout().isVisible() ? toolbox.getFlyout().getWidth() : 0) +
        this.MARGIN_HORIZONTAL_;

    this.top_ =
        metrics.absoluteMetrics.top +
        metrics.viewMetrics.height -
        this.HEIGHT_ -
        this.MARGIN_VERTICAL_ -
        15;

    if (this.svgGroup_) {
        this.svgGroup_.setAttribute(
            'transform',
            `translate(${this.left_},${this.top_})`,
        );
    }
}
Backpack.prototype.initFlyout = function() {
    // Create flyout options.
    const flyoutWorkspaceOptions = new Blockly.Options({
        scrollbars: true,
        parentWorkspace: this.workspace_,
        rtl: this.workspace_.RTL,
        oneBasedIndex: this.workspace_.options.oneBasedIndex,
        renderer: this.workspace_.options.renderer,
        rendererOverrides: this.workspace_.options.rendererOverrides || undefined,
        move: {
            scrollbars: true,
        },
        toolboxPosition: 'left'
    });

    // Create flyout.
    const VerticalFlyout = Blockly.registry.getClassFromOptions(
        Blockly.registry.Type.FLYOUTS_VERTICAL_TOOLBOX,
        this.workspace_.options,
        true,
    );
    this.flyout_ = new VerticalFlyout(flyoutWorkspaceOptions);

    // Add flyout to DOM.
    const parentNode = this.workspace_.getParentSvg().parentNode;
    parentNode?.appendChild(this.flyout_?.createDom(Blockly.utils.Svg.SVG));
    this.flyout_.init(this.workspace_);
}
Backpack.prototype.addBlock = function(block: Blockly.Block) {
    if (block.type === 'leaphy_start') {
        return this.addBlocks(block.getChildren(false));
    }

    this.addItem(this.blockToJsonString(block));
}

export { Backpack };
