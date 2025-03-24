
import React, { createContext, useContext, useState, useEffect } from 'react';
import { InventoryItem, Movement, Address } from '@/types/inventory';
import { toast } from '@/components/ui/use-toast';
import { v4 as uuidv4 } from 'uuid';

interface InventoryContextType {
  items: InventoryItem[];
  movements: Movement[];
  addItem: (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateItem: (id: string, updates: Partial<Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  deleteItem: (id: string) => void;
  moveItem: (itemId: string, toAddress: Address, quantity?: number) => void;
  getItemsByAddress: (address: Partial<Address>) => InventoryItem[];
  getItemById: (id: string) => InventoryItem | undefined;
  searchItems: (query: string) => InventoryItem[];
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const STORAGE_KEY_ITEMS = 'inventory-items';
const STORAGE_KEY_MOVEMENTS = 'inventory-movements';

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<InventoryItem[]>(() => {
    const storedItems = localStorage.getItem(STORAGE_KEY_ITEMS);
    if (storedItems) {
      try {
        const parsedItems = JSON.parse(storedItems);
        return parsedItems.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt)
        }));
      } catch (error) {
        console.error('Failed to parse stored items', error);
        return [];
      }
    }
    return [];
  });

  const [movements, setMovements] = useState<Movement[]>(() => {
    const storedMovements = localStorage.getItem(STORAGE_KEY_MOVEMENTS);
    if (storedMovements) {
      try {
        const parsedMovements = JSON.parse(storedMovements);
        return parsedMovements.map((movement: any) => ({
          ...movement,
          timestamp: new Date(movement.timestamp)
        }));
      } catch (error) {
        console.error('Failed to parse stored movements', error);
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MOVEMENTS, JSON.stringify(movements));
  }, [movements]);

  const addItem = (itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date();
    const newItem: InventoryItem = {
      ...itemData,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now
    };

    setItems(prevItems => [...prevItems, newItem]);
    
    const movement: Movement = {
      id: uuidv4(),
      itemId: newItem.id,
      fromAddress: null,
      toAddress: newItem.address,
      quantity: newItem.quantity,
      type: 'add',
      timestamp: now
    };
    
    setMovements(prevMovements => [...prevMovements, movement]);
    
    toast({
      title: "Item Added",
      description: `${newItem.name} has been added to inventory.`,
    });
  };

  const updateItem = (id: string, updates: Partial<Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>>) => {
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === id 
          ? { ...item, ...updates, updatedAt: new Date() } 
          : item
      )
    );
    
    toast({
      title: "Item Updated",
      description: "The inventory item has been updated.",
    });
  };

  const deleteItem = (id: string) => {
    const itemToDelete = items.find(item => item.id === id);
    
    if (!itemToDelete) return;
    
    setItems(prevItems => prevItems.filter(item => item.id !== id));
    
    const movement: Movement = {
      id: uuidv4(),
      itemId: id,
      fromAddress: itemToDelete.address,
      toAddress: null,
      quantity: itemToDelete.quantity,
      type: 'remove',
      timestamp: new Date()
    };
    
    setMovements(prevMovements => [...prevMovements, movement]);
    
    toast({
      title: "Item Removed",
      description: `${itemToDelete.name} has been removed from inventory.`,
    });
  };

  const moveItem = (itemId: string, toAddress: Address, quantity?: number) => {
    const itemToMove = items.find(item => item.id === itemId);
    
    if (!itemToMove) return;
    
    const fromAddress = { ...itemToMove.address };
    
    updateItem(itemId, { address: toAddress, quantity });
    
    const movement: Movement = {
      id: uuidv4(),
      itemId,
      fromAddress,
      toAddress,
      quantity,
      type: 'move',
      timestamp: new Date()
    };
    
    setMovements(prevMovements => [...prevMovements, movement]);
    
    toast({
      title: "Item Moved",
      description: `${itemToMove.name} has been moved to a new location.`,
    });
  };

  const getItemsByAddress = (addressFilter: Partial<Address>) => {
    return items.filter(item => {
      const address = item.address;
      return (
        (!addressFilter.rua || address.rua === addressFilter.rua) &&
        (!addressFilter.bloco || address.bloco === addressFilter.bloco) &&
        (!addressFilter.altura || address.altura === addressFilter.altura) &&
        (!addressFilter.lado || address.lado === addressFilter.lado)
      );
    });
  };

  const getItemById = (id: string) => {
    return items.find(item => item.id === id);
  };

  const searchItems = (query: string) => {
    const lowercaseQuery = query.toLowerCase();
    return items.filter(item => 
      item.name.toLowerCase().includes(lowercaseQuery) ||
      item.codSAP.toLowerCase().includes(lowercaseQuery) ||
      `${item.address.rua}-${item.address.bloco}-${item.address.altura}-${item.address.lado}`.toLowerCase().includes(lowercaseQuery)
    );
  };

  const value = {
    items,
    movements,
    addItem,
    updateItem,
    deleteItem,
    moveItem,
    getItemsByAddress,
    getItemById,
    searchItems
  };

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
