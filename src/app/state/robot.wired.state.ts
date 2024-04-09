import { Injectable } from '@angular/core';
import { ChartDataset } from 'chart.js';
import { ReplaySubject, BehaviorSubject, Observable} from 'rxjs';
import { map, scan } from 'rxjs/operators';
import { SerialPort as MockedSerialPort } from "web-serial-polyfill";


export type LeaphyPort = SerialPort|MockedSerialPort


@Injectable({
    providedIn: 'root'
})
export class RobotWiredState {

    public static SUPPORTED_VENDORS = [0x1a86, 9025, 2341, 0x0403, 0x2e8a]
    public serialPort: LeaphyPort = null;
    public abortController: AbortController = null;

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
        .pipe(scan((all, incoming) => {
            if (incoming == null) {
                return [];
            }
            if (all.length > 100) {
                return all.slice(1).concat(incoming);
            }
            return all.concat(incoming);
        }, []));


    public serialWrite: WritableStreamDefaultWriter<Uint8Array> = null;

    public serialChartDataSets$: Observable<ChartDataset[]> = this.serialData$
        .pipe(map(data => {
            const dataSets: ChartDataset[] = data.reduce((sets, item) => {
                const [label, valueStr] = item.data.split(' = ');

                // If it can't be parsed, move to next item
                if (!label || !valueStr) return sets;

                const value = Number(valueStr);

                const dataPoint = { x: item.time, y: value }
                // Find the set with the label
                const labelSet = sets.find(s => s.label === label);

                // If it's already there, push a data point into it
                if (labelSet) labelSet.data.push(dataPoint)
                // Else create the new dataset else sets.push({ label, data: [dataPoint] });

                return sets;
            }, [])
            return dataSets;
        }));


    set incomingSerialData(data: { time: Date, data: string }) {
        this.serialDataSubject$.next(data);
    }

    public clearSerialData(): void {
        this.serialDataSubject$.next(null);
    }

    public async requestSerialPort(forcePrompt = false, allowPrompt = true) {
        let port: LeaphyPort

        if (navigator.serial) {
            if (!forcePrompt) {
                const ports = await navigator.serial.getPorts()
                if (ports[0]) port = ports[0]
            }
            if (!port && allowPrompt) {
                port = await navigator.serial.requestPort({
                    filters: RobotWiredState.SUPPORTED_VENDORS.map(vendor => ({
                        usbVendorId: vendor
                    }))
                })
            }
        } else if (navigator.usb) {
            if (!forcePrompt) {
                const devices = await navigator.usb.getDevices()
                if (devices[0]) port = new MockedSerialPort(devices[0])
            }
            if (!port && allowPrompt) {
                const device = await navigator.usb.requestDevice({
                    filters: RobotWiredState.SUPPORTED_VENDORS.map(vendor => ({
                        vendorId: vendor
                    }))
                })
                try {
                    port = new MockedSerialPort(device)
                } catch {
                    throw new Error("WebUSB device is not supported")
                }
            }
        } else {
            throw new Error("WebSerial/WebUSB not supported")
        }

        return port
    }

    public addToUploadLog(log: string): void {
        this.uploadLogSubject$.next([...this.uploadLogSubject$.getValue(), log]);
    }

    public clearUploadLog(): void {
        this.uploadLogSubject$.next([]);
    }

    set pythonCodeRunning(isRunning: boolean) {
        this.isPythonCodeRunningSubject$.next(isRunning);
    }

    get pythonCodeRunning(): boolean {
        return this.isPythonCodeRunningSubject$.getValue();
    }

    set pythonDeviceConnected(isConnected: boolean) {
        this.isPythonDeviceConnectedSubject$.next(isConnected);
    }

    get pythonDeviceConnected(): boolean {
        return this.isPythonDeviceConnectedSubject$.getValue();
    }

    set pythonSerialMonitorListening(isListening: boolean) {
        this.isPythonSerialMonitorListeningSubject$.next(isListening);
    }

    get pythonSerialMonitorListening(): boolean {
        return this.isPythonSerialMonitorListeningSubject$.getValue();
    }

}
