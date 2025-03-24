
export interface Address {
  rua: string;
  bloco: string;
  altura: string;
  lado: 'A' | 'B';
}

export interface InventoryItem {
  id: string;
  codSAP: string;
  name: string;
  quantity?: number;
  address: Address;
  createdAt: Date;
  updatedAt: Date;
}

export interface Movement {
  id: string;
  itemId: string;
  fromAddress: Address | null;
  toAddress: Address | null;
  quantity?: number;
  type: 'add' | 'move' | 'remove';
  timestamp: Date;
}
