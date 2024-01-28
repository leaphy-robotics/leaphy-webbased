import { Component } from '@angular/core';
import { MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';
import { AppState } from 'src/app/state/app.state';

@Component({
  selector: 'app-info-dialog',
  templateUrl: './info.dialog.html',
  styleUrls: ['./info.dialog.scss']
})
export class InfoDialog  {
  constructor(
    public appState: AppState,
    public dialogRef: MatDialogRef<InfoDialog>
  ) { }

  public onDialogClosed() {
    this.dialogRef.close();
  }
}
