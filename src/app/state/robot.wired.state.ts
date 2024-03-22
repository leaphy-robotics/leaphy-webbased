import { Injectable } from '@angular/core';
import { ChartDataset } from 'chart.js';
import { ReplaySubject, BehaviorSubject, Observable} from 'rxjs';
import { filter, map, scan } from 'rxjs/operators';


@Injectable({
    providedIn: 'root'
})
export class RobotWiredState {

    public SUPPORTED_VENDORS = [0x1a86, 9025, 2341, 0x0403, 0x2e8a]

    private serialPortSubject$: BehaviorSubject<SerialPort> = new BehaviorSubject(null);
    public serialPort$: Observable<SerialPort> = this.serialPortSubject$.asObservable();

    private abortControllerSubject$: BehaviorSubject<AbortController> = new BehaviorSubject(null);
    public abortController$: Observable<AbortController> = this.abortControllerSubject$.asObservable();

    // Upload log, a Log of list of strings
    private uploadLogSubject$ = new BehaviorSubject<string[]>([]);
    public uploadLog$: Observable<string[]> = this.uploadLogSubject$.asObservable();

    private isPythonCodeRunningSubject$ = new BehaviorSubject<boolean>(false);
    public isPythonCodeRunning$: Observable<boolean> = this.isPythonCodeRunningSubject$.asObservable();

    private isPythonDeviceConnectedSubject$ = new BehaviorSubject<boolean>(false);
    public isPythonDeviceConnected$: Observable<boolean> = this.isPythonDeviceConnectedSubject$.asObservable();

    public isPythonSerialMonitorListeningSubject$ = new BehaviorSubject<boolean>(false);
    public isPythonSerialMonitorListening$: Observable<boolean> = this.isPythonSerialMonitorListeningSubject$.asObservable();

    private serialDataSubject$ = new ReplaySubject<{ time: Date, data: string }>();
    public serialData$: Observable<{ time: Date, data: string }[]> = this.serialDataSubject$
        .pipe(filter(output => !!output))
        .pipe(scan((all, incoming) => {
            if (incoming.data === this.poisonPill) {
                return [];
            }
            if (all.length > 100) {
                return all.slice(1).concat(incoming);
            }
            return all.concat(incoming);
        }, []));


    private serialWriteSubject$ = new BehaviorSubject<WritableStreamDefaultWriter<Uint8Array>>(null);
    public serialWrite$: Observable<WritableStreamDefaultWriter<Uint8Array>> = this.serialWriteSubject$.asObservable();


    public serialChartDataSets$: Observable<ChartDataset[]> = this.serialData$
        .pipe(map(data => {
            const dataSets: ChartDataset[] = data.reduce((sets, item) => {
                var [label, valueStr] = item.data.split(' = ');

                // If it can't be parsed, move to next item
                if (!label || !valueStr) return sets;

                var value = Number(valueStr);

                const dataPoint = { x: item.time, y: value }
                // Find the set with the label
                const labelSet = sets.find(s => s.label === label);

                // If it's already there, push a data point into it
                if (labelSet) labelSet.data.push(dataPoint)
                // Else create the new dataset
                else sets.push({ label, data: [dataPoint] });

                return sets;
            }, [])
            return dataSets;
        }));


    public setIncomingSerialData(data: { time: Date, data: string }): void {
        this.serialDataSubject$.next(data);
    }

    public setSerialWrite(data: WritableStreamDefaultWriter<Uint8Array>): void {
        this.serialWriteSubject$.next(data);
    }

    public getSerialWrite(): WritableStreamDefaultWriter<Uint8Array> {
        return this.serialWriteSubject$.getValue();
    }

    public clearSerialData(): void {
        this.setIncomingSerialData({ time: new Date(), data: this.poisonPill });
    }

    public setSerialPort(port: SerialPort): void {
        this.serialPortSubject$.next(port);
    }

    public getSerialPort(): SerialPort {
        return this.serialPortSubject$.getValue();
    }

    public setAbortController(abortController: AbortController): void {
        this.abortControllerSubject$.next(abortController);
    }

    public getAbortController(): AbortController {
        return this.abortControllerSubject$.getValue();
    }

    public addToUploadLog(log: string): void {
        this.uploadLogSubject$.next([...this.uploadLogSubject$.getValue(), log]);
    }

    public clearUploadLog(): void {
        this.uploadLogSubject$.next([]);
    }

    public setPythonCodeRunning(isRunning: boolean): void {
        this.isPythonCodeRunningSubject$.next(isRunning);
    }

    public getPythonCodeRunning(): boolean {
        return this.isPythonCodeRunningSubject$.getValue();
    }

    public setPythonDeviceConnected(isConnected: boolean): void {
        this.isPythonDeviceConnectedSubject$.next(isConnected);
    }

    public getPythonDeviceConnected(): boolean {
        return this.isPythonDeviceConnectedSubject$.getValue();
    }

    public setPythonSerialMonitorListening(isListening: boolean): void {
        this.isPythonSerialMonitorListeningSubject$.next(isListening);
    }

    public getPythonSerialMonitorListening(): boolean {
        return this.isPythonSerialMonitorListeningSubject$.getValue();
    }

    private readonly poisonPill: string = "caaa61a6-a666-4c0b-83b4-ebc75b08fecb"
}
