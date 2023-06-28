class WorkspaceManager {
    constructor(fs, dialog, app, logger) {
        this.fs = fs;
        this.dialog = dialog;
        this.app = app;
        this.logger = logger;
    }

    save = async (event, payload) => {
        this.fs.writeFileSync(payload.projectFilePath, payload.data);
        const message = { event: "WORKSPACE_SAVED", message: "WORKSPACE_SAVED", payload: payload.projectFilePath, displayTimeout: 3000 };
        event.sender.send('backend-message', message);
    }

    saveAs = async (event, payload) => {
        const saveAsOptions = {
            filters: [
                { name: `${payload.extension} files`, extensions: [payload.extension] }
            ]
        }
        if (payload.projectFilePath) {
            saveAsOptions.defaultPath = payload.projectFilePath;
        }
        const response = await this.dialog.showSaveDialog(saveAsOptions);
        if (response.canceled) {
            const message = { event: "WORKSPACE_SAVE_CANCELLED", message: "WORKSPACE_SAVE_CANCELLED", displayTimeout: 3000 };
            event.sender.send('backend-message', message);
            return;
        }
        this.fs.writeFileSync(response.filePath, payload.data);
        const message = { event: "WORKSPACE_SAVED", message: "WORKSPACE_SAVED", payload: response.filePath, displayTimeout: 3000 };
        event.sender.send('backend-message', message);
    }

    saveTemp = async (event, payload) => {
        const filePath = `${this.app.getPath("userData")}/tmp.${payload.extension}`
        this.fs.writeFileSync(filePath, payload.data);
        const message = { event: "WORKSPACE_SAVED_TEMP", message: "WORKSPACE_SAVED_TEMP", payload: filePath };
        event.sender.send('backend-message', message);
    }

    restoreTemp = async (event, extension) => {
        if(!extension) return;
        const data = this.fs.readFileSync(`${this.app.getPath("userData")}/tmp.${extension}`, "utf8");
        const payload = { data };
        const message = { event: "WORKSPACE_RESTORING_TEMP", message: "WORKSPACE_RESTORING_TEMP", payload: payload };
        event.sender.send('backend-message', message);
    }

    restoreWorkspace = async (event, extension) => {
        const openDialogOptions = {
            filters: [
                { name: `${extension} files`, extensions: [extension] }
            ]
        }
        const response = await this.dialog.showOpenDialog(openDialogOptions);
        if (response.canceled) {
            const message = { event: "WORKSPACE_RESTORE_CANCELLED", message: "WORKSPACE_RESTORE_CANCELLED" };
            event.sender.send('backend-message', message);
            return;
        }
        const data = this.fs.readFileSync(response.filePaths[0], "utf8");
        const payload = { projectFilePath: response.filePaths[0], data };
        const message = { event: "WORKSPACE_RESTORING", message: "WORKSPACE_RESTORING", payload: payload };
        event.sender.send('backend-message', message);
    }

    restoreCode = async (event, extension) => {
        const openDialogOptions = {
            filters: [
                { name: `${extension} files`, extensions: [extension] }
            ]
        }
        const response = await this.dialog.showOpenDialog(openDialogOptions);
        if (response.canceled) {
            const message = { event: "WORKSPACE_RESTORE_CANCELLED", message: "WORKSPACE_RESTORE_CANCELLED" };
            event.sender.send('backend-message', message);
            return;
        }
        const data = this.fs.readFileSync(response.filePaths[0], "utf8");
        const payload = { projectFilePath: response.filePaths[0], data };
        const message = { event: "WORKSPACE_CODE_RESTORING", message: "WORKSPACE_CODE_RESTORING", payload: payload };
        event.sender.send('backend-message', message);
    }

}

module.exports = WorkspaceManager;