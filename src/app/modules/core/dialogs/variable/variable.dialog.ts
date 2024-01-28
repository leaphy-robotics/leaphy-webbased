import { Component } from '@angular/core';
import { MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';
import { AppState } from 'src/app/state/app.state';

@Component({
  selector: 'name-variable-dialog',
  templateUrl: './variable.dialog.html',
  styleUrls: ['./variable.dialog.scss']
})
export class VariableDialog {
  constructor(
    public dialogRef: MatDialogRef<VariableDialog>,
    public appState: AppState
  ) { }

  public onSubmit(name: string) {
    this.dialogRef.close(name);
  }

  protected readonly document = document;
}
