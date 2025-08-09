declare module 'react-native-nodemediaclient' {
  export class NodeMediaClient {
    static setLicense(license: string): void;
    static setAudioSessionMode(mode: number): void;
  }
  
  export interface NodePublisherRef {
    start(): void;
    stop(): void;
    getStatus(): any;
  }
  
  export const NodePublisher: any;
  
  export default NodeMediaClient;
}
