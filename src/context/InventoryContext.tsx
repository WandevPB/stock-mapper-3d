import React, { createContext, useContext, useState } from 'react';
import { InventoryItem, Address, Movement } from '@/types/inventory';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SheetsService } from '@/services/SheetsService';
import { v4 as uuidv4 } from 'uuid';
import { isOfflineMode, offlineStorage } from '@/integrations/supabase/client';

interface InventoryContextType {
  items: InventoryItem[];
  movements: Movement[];
  isLoading: boolean;
  isError: boolean;
  addItem: (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<InventoryItem>;
  updateItem: (id: string, item: Partial<Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  moveItem: (id: string, newAddress: Address, quantity?: number) => Promise<void>;
  searchItems: (query: string) => Promise<InventoryItem[]>;
  refreshData: () => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

// Helper function to fetch items from Google Sheets
const fetchItemsFromSheets = async (): Promise<InventoryItem[]> => {
  try {
    // If we have items in offline storage, use those first
    if (offlineStorage.inventory.length > 0) {
      console.log("Using cached inventory items:", offlineStorage.inventory.length);
      return [...offlineStorage.inventory];
    }
    
    // Otherwise fetch from Google Sheets
    const items = await SheetsService.getAllItemsFromSheet();
    
    // Store in offline storage for later use
    offlineStorage.inventory = [...items];
    
    return items;
  } catch (error) {
    console.error("Error fetching items from sheets:", error);
    return [];
  }
};

// Mock function for movements as they might not be in the sheets yet
const fetchMovementsFromSheets = async (): Promise<Movement[]> => {
  return [];
};

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch inventory items
  const { 
    data: items = [], 
    isLoading: isItemsLoading, 
    isError: isItemsError,
    refetch: refetchItems
  } = useQuery({
    queryKey: ['inventoryItems'],
    queryFn: fetchItemsFromSheets,
    retry: 1, // Only retry once to avoid excessive failed requests
    refetchOnWindowFocus: false, // Don't refetch on window focus to reduce API calls
  });

  // Fetch movements
  const { 
    data: movements = [], 
    isLoading: isMovementsLoading, 
    isError: isMovementsError,
    refetch: refetchMovements
  } = useQuery({
    queryKey: ['movements'],
    queryFn: fetchMovementsFromSheets
  });

  // Add item mutation
  const addItemMutation = useMutation({
    mutationFn: (newItem: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date();
      const completeItem: InventoryItem = {
        id: uuidv4(),
        ...newItem,
        createdAt: now,
        updatedAt: now
      };
      
      // Add to offline storage
      offlineStorage.inventory.push(completeItem);
      
      return Promise.resolve(completeItem);
    },
    onSuccess: (newItem) => {
      queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
      
      // Try to sync with Google Sheets in the background
      SheetsService.addItemToSheet(newItem).then(success => {
        if (!success) {
          console.warn("Item added to local storage but failed to sync with Google Sheets");
        }
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: `Não foi possível adicionar o item: ${error.message}`,
      });
    }
  });

  // Update item mutation
  const updateItemMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: any }) => {
      // Find the item in the current state
      const itemIndex = items.findIndex(item => item.id === id);
      if (itemIndex === -1) {
        throw new Error("Item not found");
      }
      
      // Create updated item
      const updatedItem = {
        ...items[itemIndex],
        ...updates,
        updatedAt: new Date()
      };
      
      // Update in offline storage
      const offlineIndex = offlineStorage.inventory.findIndex(item => item.id === id);
      if (offlineIndex >= 0) {
        offlineStorage.inventory[offlineIndex] = updatedItem;
      }
      
      return Promise.resolve(updatedItem);
    },
    onSuccess: (updatedItem) => {
      queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
      
      // Try to sync with Google Sheets in the background
      SheetsService.updateItemInSheet(updatedItem).then(success => {
        if (!success) {
          console.warn("Item updated in local storage but failed to sync with Google Sheets");
        }
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: `Não foi possível atualizar o item: ${error.message}`,
      });
    }
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const success = await SheetsService.deleteItemFromSheet(id);
      if (!success) {
        throw new Error("Failed to delete item from sheet");
      }
      
      // Remove from offline storage
      offlineStorage.inventory = offlineStorage.inventory.filter(item => item.id !== id);
      
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
      toast({
        title: "Item removido",
        description: "O item foi removido com sucesso do inventário.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: `Não foi possível remover o item: ${error.message}`,
      });
    }
  });

  // Move item mutation
  const moveItemMutation = useMutation({
    mutationFn: async ({ id, newAddress, quantity }: { id: string, newAddress: Address, quantity?: number }) => {
      // Update in Google Sheets
      const success = await SheetsService.moveItemInSheet(id, newAddress);
      if (!success) {
        throw new Error("Failed to move item in sheet");
      }
      
      // Update in offline storage
      const offlineIndex = offlineStorage.inventory.findIndex(item => item.id === id);
      if (offlineIndex >= 0) {
        offlineStorage.inventory[offlineIndex] = {
          ...offlineStorage.inventory[offlineIndex],
          address: newAddress,
          quantity: quantity !== undefined ? quantity : offlineStorage.inventory[offlineIndex].quantity,
          updatedAt: new Date()
        };
      }
      
      return { id, newAddress, quantity };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
      toast({
        title: "Item movido",
        description: "O item foi movido com sucesso para o novo endereço.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: `Não foi possível mover o item: ${error.message}`,
      });
    }
  });

  const isLoading = isItemsLoading || isMovementsLoading;
  const isError = isItemsError || isMovementsError;

  const addItem = async (newItem: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<InventoryItem> => {
    return await addItemMutation.mutateAsync(newItem);
  };

  const updateItem = async (id: string, updates: Partial<Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>>) => {
    await updateItemMutation.mutateAsync({ id, updates });
  };

  const deleteItem = async (id: string) => {
    await deleteItemMutation.mutateAsync(id);
  };

  const moveItem = async (id: string, newAddress: Address, quantity?: number) => {
    await moveItemMutation.mutateAsync({ id, newAddress, quantity });
  };

  const searchItems = async (query: string): Promise<InventoryItem[]> => {
    const lowerQuery = query.toLowerCase();
    
    // Search in the current items array
    const filteredItems = items.filter(item => 
      item.name.toLowerCase().includes(lowerQuery) ||
      item.codSAP.toLowerCase().includes(lowerQuery) ||
      `${item.address.rua}-${item.address.bloco}-${item.address.altura}-${item.address.lado}`.toLowerCase().includes(lowerQuery)
    );
    
    return filteredItems;
  };

  const refreshData = () => {
    refetchItems();
    refetchMovements();
  };

  const value = {
    items,
    movements,
    isLoading,
    isError,
    addItem,
    updateItem,
    deleteItem,
    moveItem,
    searchItems,
    refreshData
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = (): InventoryContextType => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
