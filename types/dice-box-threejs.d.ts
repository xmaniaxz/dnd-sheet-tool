// types/dice-box-threejs.d.ts
declare module "@3d-dice/dice-box-threejs/dist/dice-box-threejs.es.js" {
  export default class DiceBox {
    constructor(container: string, config?: Record<string, unknown>);
    initialize(): Promise<void>;
    clear(): void;
    updateConfig(config: Record<string, unknown>): Promise<void> | void;
    roll(notation: string): Promise<void> | void;
    onRoll?: unknown;
  }
}
