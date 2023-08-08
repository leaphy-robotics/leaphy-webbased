export class BackEndMessage {
    constructor(public event: string, public message: string, public payload: any, public displayTimeout: number) { }
}
