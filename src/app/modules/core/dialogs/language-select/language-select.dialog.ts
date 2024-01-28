import { Component } from '@angular/core';
import { MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';
import { Language } from 'src/app/domain/language';
import { AppState } from 'src/app/state/app.state';

@Component({
  selector: 'app-language-select',
  templateUrl: './language-select.dialog.html',
  styleUrls: ['./language-select.dialog.scss']
})
export class LanguageSelectDialog  {
  constructor(
    public dialogRef: MatDialogRef<LanguageSelectDialog>,
    public appState: AppState
  ) { }

  public onLanguageSelected(language: Language) {
    this.appState.setCurrentLanguage(language);
    this.dialogRef.close();
  }
}
