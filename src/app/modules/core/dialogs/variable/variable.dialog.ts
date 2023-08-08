import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Language } from 'src/app/domain/language';
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
    console.log(name);
    this.dialogRef.close(name);
  }

  protected readonly document = document;
}
