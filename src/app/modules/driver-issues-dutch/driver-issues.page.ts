import { Component, ElementRef } from '@angular/core';

@Component({
  selector: 'driver-issues-dutch-page',
  templateUrl: './driver-issues.page.html',
  styleUrls: ['./driver-issues.page.scss']
})
export class DriverIssuesDutchPage {

  constructor(private elementRef: ElementRef) { }

  scrollTo(targetId: string): void {
    const targetElement = this.elementRef.nativeElement.querySelector(`#${targetId}`);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
