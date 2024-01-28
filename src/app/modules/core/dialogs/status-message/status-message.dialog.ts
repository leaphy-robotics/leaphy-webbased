import { Component, Inject } from '@angular/core';
import { MAT_LEGACY_SNACK_BAR_DATA as MAT_SNACK_BAR_DATA } from '@angular/material/legacy-snack-bar';
import { BackEndMessage } from 'src/app/domain/backend.message';

@Component({
  selector: 'app-status-message',
  templateUrl: './status-message.dialog.html',
  styleUrls: ['./status-message.dialog.scss']
})
export class StatusMessageDialog {
  constructor(@Inject(MAT_SNACK_BAR_DATA) public message: BackEndMessage) { }
}
