import { Peer, DataConnection } from 'peerjs';

// 国内可用的 STUN 服务器列表，确保中国用户直连成功率
const DOMESTIC_STUN_SERVERS = [
  { urls: 'stun:stun.qq.com:3478' },
  { urls: 'stun:stun.miwifi.com:3478' },
  { urls: 'stun:stun.l.google.com:19302' } // 备用
];

export interface GameMessage {
  type: 'DICE_ROLL' | 'CHAT' | 'SYNC_STATE' | 'ACTION';
  sender: string;
  payload: any;
}

export class NetworkManager {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private onMessageCallback: (msg: GameMessage) => void = () => {};

  constructor() {}

  async init(userId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.peer = new Peer(userId, {
        config: {
          iceServers: DOMESTIC_STUN_SERVERS,
          sdpSemantics: 'unified-plan'
        }
      });

      this.peer.on('open', (id) => {
        console.log('Peer ID:', id);
        resolve(id);
      });

      this.peer.on('connection', (conn) => {
        this.setupConnection(conn);
      });

      this.peer.on('error', (err) => {
        console.error('Peer error:', err);
        reject(err);
      });
    });
  }

  connect(targetPeerId: string) {
    if (!this.peer) return;
    const conn = this.peer.connect(targetPeerId);
    this.setupConnection(conn);
  }

  private setupConnection(conn: DataConnection) {
    conn.on('open', () => {
      this.connections.set(conn.peer, conn);
      console.log('Connected to:', conn.peer);
    });

    conn.on('data', (data) => {
      this.onMessageCallback(data as GameMessage);
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
    });
  }

  broadcast(msg: GameMessage) {
    this.connections.forEach((conn) => {
      if (conn.open) {
        conn.send(msg);
      }
    });
  }

  onMessage(callback: (msg: GameMessage) => void) {
    this.onMessageCallback = callback;
  }

  getConnectedPeers() {
    return Array.from(this.connections.keys());
  }

  disconnect() {
    this.peer?.destroy();
    this.connections.clear();
  }
}

export const networkManager = new NetworkManager();
