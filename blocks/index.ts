export type BlockModule<TModule extends Record<string, any> = {}> = {
  default: (props: any, request: Request, context: any) => any;
} & TModule;

export interface BlockInterface {
  resolverId: string;
  type: string;
  module: BlockModule;
  execute: (props: any, request: Request, context: any) => any;
}

export class Block implements BlockInterface {
  public resolverId: string;
  public type: string;
  public module: BlockModule;
  public static readonly type: string = "block";

  constructor(resolverId: string, type: string, module: BlockModule) {
    this.resolverId = resolverId;
    this.type = type;
    this.module = module;
  }

  public execute(_props: any, _request: Request, _context: any) {
    throw new Error(`${this.resolverId} block not implemented`);
  }
}
