import { Component } from '@angular/core';
import { MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';

@Component({
  selector: 'app-credits',
  templateUrl: './credits.dialog.html',
  styleUrls: ['./credits.dialog.scss']
})
export class CreditsDialog  {
  constructor(
    public dialogRef: MatDialogRef<CreditsDialog>
  ) { }

  public onDialogClosed() {
    this.dialogRef.close();
  }
}
