import { ComponentPortal, DomPortalOutlet } from '@angular/cdk/portal';
import { AfterViewInit, ApplicationRef, Component, ComponentFactoryResolver, ComponentRef, Injector, OnInit } from '@angular/core';
import { DialogState } from 'src/app/state/dialog.state';
import { SerialOutputComponent } from '../serial-output/serial-output.component';

@Component({
  selector: 'app-serial-window',
  template: '',
  styleUrls: ['./serial-window.component.scss']
})
export class SerialWindowComponent {

  constructor(
    private injector: Injector,
    private componentFactoryResolver: ComponentFactoryResolver,
    private applicationRef: ApplicationRef,
    private dialogState: DialogState,
  ) { }

  styleSheetElement: any = null;
}
