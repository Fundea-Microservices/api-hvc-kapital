import { AsyncLocalStorage } from 'async_hooks';

export interface ExecutionContextState {
  isAuthorizedExecution: boolean;
  permisoCodigo?: string; 
}

export const ExecutionContextCls = new AsyncLocalStorage<ExecutionContextState>();