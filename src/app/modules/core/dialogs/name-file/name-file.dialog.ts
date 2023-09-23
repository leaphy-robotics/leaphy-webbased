import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { AppState } from 'src/app/state/app.state';

@Component({
  selector: 'app-language-select',
  templateUrl: './name-file.dialog.html',
  styleUrls: ['./name-file.dialog.scss']
})
export class NameFileDialog {
  constructor(
    public dialogRef: MatDialogRef<NameFileDialog>,
    public appState: AppState
  ) { }

  public onNameSelected(name: string) {
    this.dialogRef.close(name);
  }

  protected readonly document = document;
}
