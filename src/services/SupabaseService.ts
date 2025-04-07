
import { supabase, isOfflineMode, offlineStorage, checkSupabaseConnection } from "@/integrations/supabase/client";
import { InventoryItem, Address, Movement } from "@/types/inventory";
import { v4 as uuidv4 } from 'uuid';

// Maps our app's Address type to the database structure
const mapAddressToDb = (address: Address) => {
  return {
    rua: address.rua,
    bloco: address.bloco,
    altura: address.altura,
    lado: address.lado
  };
};

// Maps database address to our app's Address type
const mapDbToAddress = (dbAddress: any): Address => {
  return {
    rua: dbAddress.rua,
    bloco: dbAddress.bloco,
    altura: dbAddress.altura,
    lado: dbAddress.lado as 'A' | 'B'
  };
};

// Maps our InventoryItem to the database structure
const mapItemToDb = (item: Partial<InventoryItem>, addressId: string) => {
  return {
    cod_sap: item.codSAP,
    name: item.name,
    quantity: item.quantity,
    address_id: addressId
  };
};

// Maps database item to our app's InventoryItem type
const mapDbToItem = (dbItem: any, dbAddress: any): InventoryItem => {
  return {
    id: dbItem.id,
    codSAP: dbItem.cod_sap,
    name: dbItem.name,
    quantity: dbItem.quantity,
    address: mapDbToAddress(dbAddress),
    createdAt: new Date(dbItem.created_at),
    updatedAt: new Date(dbItem.updated_at)
  };
};

// Função para criar dados demo para modo offline
const generateDemoData = () => {
  if (offlineStorage.inventory.length > 0) return;
  
  console.log("Gerando dados de demonstração para modo offline");
  
  // Criar alguns endereços de demonstração
  const addresses = [
    { id: "addr1", rua: "A", bloco: "1", altura: "1", lado: "A", created_at: new Date().toISOString() },
    { id: "addr2", rua: "B", bloco: "2", altura: "2", lado: "B", created_at: new Date().toISOString() },
    { id: "addr3", rua: "C", bloco: "3", altura: "3", lado: "A", created_at: new Date().toISOString() }
  ];
  
  // Criar alguns itens de demonstração
  const items = [
    { 
      id: "item1", 
      cod_sap: "001", 
      name: "Item Demo 1", 
      quantity: 10, 
      address_id: "addr1", 
      created_at: new Date().toISOString(), 
      updated_at: new Date().toISOString() 
    },
    { 
      id: "item2", 
      cod_sap: "002", 
      name: "Item Demo 2", 
      quantity: 5, 
      address_id: "addr2", 
      created_at: new Date().toISOString(), 
      updated_at: new Date().toISOString() 
    }
  ];
  
  // Criar alguns movimentos de demonstração
  const movements = [
    {
      id: "mov1",
      item_id: "item1",
      from_address_id: null,
      to_address_id: "addr1",
      quantity: 10,
      type: "add",
      timestamp: new Date().toISOString()
    },
    {
      id: "mov2",
      item_id: "item2",
      from_address_id: null,
      to_address_id: "addr2",
      quantity: 5,
      type: "add",
      timestamp: new Date().toISOString()
    }
  ];
  
  offlineStorage.addresses = addresses;
  offlineStorage.inventory = items;
  offlineStorage.movements = movements;
};

export const SupabaseService = {
  // Fetch all inventory items
  fetchInventoryItems: async (): Promise<InventoryItem[]> => {
    try {
      const isOnline = await checkSupabaseConnection();
      
      if (!isOnline) {
        console.log("Modo offline: utilizando dados locais para fetchInventoryItems");
        generateDemoData();
        
        return offlineStorage.inventory.map(item => {
          const address = offlineStorage.addresses.find(addr => addr.id === item.address_id);
          return mapDbToItem(item, address);
        });
      }
      
      const { data: items, error } = await supabase
        .from('inventory_items')
        .select(`
          *,
          addresses:address_id (*)
        `);

      if (error) {
        console.error("Error fetching inventory items:", error);
        throw error;
      }

      return items.map(item => mapDbToItem(item, item.addresses));
    } catch (error) {
      console.error("Error fetching inventory items:", error);
      
      // Fallback para dados offline
      generateDemoData();
      
      return offlineStorage.inventory.map(item => {
        const address = offlineStorage.addresses.find(addr => addr.id === item.address_id);
        return mapDbToItem(item, address);
      });
    }
  },

  // Add new inventory item
  addInventoryItem: async (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<InventoryItem> => {
    try {
      const isOnline = await checkSupabaseConnection();
      
      if (!isOnline) {
        console.log("Modo offline: salvando item localmente");
        generateDemoData();
        
        // Criar novos IDs
        const addressId = `addr_${uuidv4()}`;
        const itemId = `item_${uuidv4()}`;
        const now = new Date().toISOString();
        
        // Criar endereço local
        const addressData = {
          id: addressId,
          ...mapAddressToDb(item.address),
          created_at: now
        };
        
        // Criar item local
        const itemData = {
          id: itemId,
          cod_sap: item.codSAP,
          name: item.name,
          quantity: item.quantity,
          address_id: addressId,
          created_at: now,
          updated_at: now
        };
        
        // Criar movimento local
        const movementData = {
          id: `mov_${uuidv4()}`,
          item_id: itemId,
          from_address_id: null,
          to_address_id: addressId,
          quantity: item.quantity,
          type: 'add',
          timestamp: now
        };
        
        // Adicionar aos arrays de armazenamento local
        offlineStorage.addresses.push(addressData);
        offlineStorage.inventory.push(itemData);
        offlineStorage.movements.push(movementData);
        
        return {
          id: itemId,
          ...item,
          createdAt: new Date(now),
          updatedAt: new Date(now)
        };
      }
      
      // 1. Create address record
      const { data: addressData, error: addressError } = await supabase
        .from('addresses')
        .insert(mapAddressToDb(item.address))
        .select()
        .single();

      if (addressError) {
        console.error("Error creating address:", addressError);
        throw addressError;
      }

      // 2. Create inventory item record
      const { data: itemData, error: itemError } = await supabase
        .from('inventory_items')
        .insert(mapItemToDb(item, addressData.id))
        .select(`
          *,
          addresses:address_id (*)
        `)
        .single();

      if (itemError) {
        console.error("Error creating inventory item:", itemError);
        throw itemError;
      }

      // 3. Create a movement record for the new item
      await supabase
        .from('movements')
        .insert({
          item_id: itemData.id,
          from_address_id: null,
          to_address_id: addressData.id,
          quantity: item.quantity,
          type: 'add'
        });

      return mapDbToItem(itemData, itemData.addresses);
    } catch (error) {
      console.error("Error creating inventory item:", error);
      throw error;
    }
  },

  // Update an inventory item
  updateInventoryItem: async (itemId: string, updatedItem: Partial<Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>>): Promise<InventoryItem> => {
    try {
      const isOnline = await checkSupabaseConnection();
      
      if (!isOnline) {
        console.log("Modo offline: atualizando item localmente");
        generateDemoData();
        
        // Encontrar o item no armazenamento local
        const itemIndex = offlineStorage.inventory.findIndex(item => item.id === itemId);
        if (itemIndex === -1) {
          throw new Error("Item não encontrado no modo offline");
        }
        
        const currentItem = offlineStorage.inventory[itemIndex];
        
        // Atualizar endereço se necessário
        if (updatedItem.address) {
          const addressIndex = offlineStorage.addresses.findIndex(addr => addr.id === currentItem.address_id);
          if (addressIndex !== -1) {
            offlineStorage.addresses[addressIndex] = {
              ...offlineStorage.addresses[addressIndex],
              ...mapAddressToDb(updatedItem.address)
            };
          }
        }
        
        // Atualizar item
        const now = new Date().toISOString();
        offlineStorage.inventory[itemIndex] = {
          ...currentItem,
          cod_sap: updatedItem.codSAP || currentItem.cod_sap,
          name: updatedItem.name || currentItem.name,
          quantity: updatedItem.quantity !== undefined ? updatedItem.quantity : currentItem.quantity,
          updated_at: now
        };
        
        // Retornar item atualizado
        const updatedDbItem = offlineStorage.inventory[itemIndex];
        const address = offlineStorage.addresses.find(addr => addr.id === updatedDbItem.address_id);
        return mapDbToItem(updatedDbItem, address);
      }

      // 1. Get the current item to find the address ID
      const { data: currentItem, error: fetchError } = await supabase
        .from('inventory_items')
        .select(`
          *,
          addresses:address_id (*)
        `)
        .eq('id', itemId)
        .single();

      if (fetchError) {
        console.error("Error fetching current item:", fetchError);
        throw fetchError;
      }

      // 2. Update the address if it's changed
      if (updatedItem.address) {
        const { error: addressError } = await supabase
          .from('addresses')
          .update(mapAddressToDb(updatedItem.address))
          .eq('id', currentItem.address_id);

        if (addressError) {
          console.error("Error updating address:", addressError);
          throw addressError;
        }
      }

      // 3. Update the inventory item
      const updateData: any = {};
      if (updatedItem.name) updateData.name = updatedItem.name;
      if (updatedItem.codSAP) updateData.cod_sap = updatedItem.codSAP;
      if (updatedItem.quantity !== undefined) updateData.quantity = updatedItem.quantity;

      const { data: itemData, error: itemError } = await supabase
        .from('inventory_items')
        .update(updateData)
        .eq('id', itemId)
        .select(`
          *,
          addresses:address_id (*)
        `)
        .single();

      if (itemError) {
        console.error("Error updating inventory item:", itemError);
        throw itemError;
      }

      return mapDbToItem(itemData, itemData.addresses);
    } catch (error) {
      console.error("Error updating inventory item:", error);
      throw error;
    }
  },

  // Delete an inventory item
  deleteInventoryItem: async (itemId: string): Promise<void> => {
    try {
      const isOnline = await checkSupabaseConnection();
      
      if (!isOnline) {
        console.log("Modo offline: excluindo item localmente");
        generateDemoData();
        
        // Encontrar o item
        const itemIndex = offlineStorage.inventory.findIndex(item => item.id === itemId);
        if (itemIndex === -1) {
          throw new Error("Item não encontrado no modo offline");
        }
        
        const addressId = offlineStorage.inventory[itemIndex].address_id;
        
        // Remover movimentos relacionados
        offlineStorage.movements = offlineStorage.movements.filter(mov => mov.item_id !== itemId);
        
        // Remover o item
        offlineStorage.inventory.splice(itemIndex, 1);
        
        // Remover o endereço
        const addressIndex = offlineStorage.addresses.findIndex(addr => addr.id === addressId);
        if (addressIndex !== -1) {
          offlineStorage.addresses.splice(addressIndex, 1);
        }
        
        return;
      }

      // 1. Get the current item to find the address ID
      const { data: currentItem, error: fetchError } = await supabase
        .from('inventory_items')
        .select('address_id')
        .eq('id', itemId)
        .single();

      if (fetchError) {
        console.error("Error fetching current item:", fetchError);
        throw fetchError;
      }

      // 2. Delete related movements
      const { error: movementError } = await supabase
        .from('movements')
        .delete()
        .eq('item_id', itemId);

      if (movementError) {
        console.error("Error deleting movements:", movementError);
        throw movementError;
      }

      // 3. Delete the inventory item
      const { error: itemError } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', itemId);

      if (itemError) {
        console.error("Error deleting inventory item:", itemError);
        throw itemError;
      }

      // 4. Delete the address
      const { error: addressError } = await supabase
        .from('addresses')
        .delete()
        .eq('id', currentItem.address_id);

      if (addressError) {
        console.error("Error deleting address:", addressError);
        throw addressError;
      }
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      throw error;
    }
  },

  // Move an inventory item to a new location
  moveInventoryItem: async (itemId: string, newAddress: Address, quantity?: number): Promise<void> => {
    try {
      const isOnline = await checkSupabaseConnection();
      
      if (!isOnline) {
        console.log("Modo offline: movendo item localmente");
        generateDemoData();
        
        // Encontrar o item
        const itemIndex = offlineStorage.inventory.findIndex(item => item.id === itemId);
        if (itemIndex === -1) {
          throw new Error("Item não encontrado no modo offline");
        }
        
        const currentItem = offlineStorage.inventory[itemIndex];
        const oldAddressId = currentItem.address_id;
        
        // Criar novo endereço
        const now = new Date().toISOString();
        const newAddressId = `addr_${uuidv4()}`;
        const addressData = {
          id: newAddressId,
          ...mapAddressToDb(newAddress),
          created_at: now
        };
        
        // Adicionar novo endereço
        offlineStorage.addresses.push(addressData);
        
        // Atualizar item com novo endereço
        offlineStorage.inventory[itemIndex] = {
          ...currentItem,
          address_id: newAddressId,
          quantity: quantity !== undefined ? quantity : currentItem.quantity,
          updated_at: now
        };
        
        // Criar movimento
        const movementData = {
          id: `mov_${uuidv4()}`,
          item_id: itemId,
          from_address_id: oldAddressId,
          to_address_id: newAddressId,
          quantity: quantity !== undefined ? quantity : currentItem.quantity,
          type: 'move',
          timestamp: now
        };
        
        offlineStorage.movements.push(movementData);
        
        return;
      }

      // 1. Get the current item to find the current address
      const { data: currentItem, error: fetchError } = await supabase
        .from('inventory_items')
        .select(`
          *,
          addresses:address_id (*)
        `)
        .eq('id', itemId)
        .single();

      if (fetchError) {
        console.error("Error fetching current item:", fetchError);
        throw fetchError;
      }

      // 2. Create a new address for the destination
      const { data: newAddressData, error: addressError } = await supabase
        .from('addresses')
        .insert(mapAddressToDb(newAddress))
        .select()
        .single();

      if (addressError) {
        console.error("Error creating new address:", addressError);
        throw addressError;
      }

      // 3. Update the inventory item to point to the new address
      const updateData: any = { address_id: newAddressData.id };
      if (quantity !== undefined) updateData.quantity = quantity;

      const { error: itemError } = await supabase
        .from('inventory_items')
        .update(updateData)
        .eq('id', itemId);

      if (itemError) {
        console.error("Error updating inventory item location:", itemError);
        throw itemError;
      }

      // 4. Create a movement record
      const { error: movementError } = await supabase
        .from('movements')
        .insert({
          item_id: itemId,
          from_address_id: currentItem.address_id,
          to_address_id: newAddressData.id,
          quantity: quantity !== undefined ? quantity : currentItem.quantity,
          type: 'move'
        });

      if (movementError) {
        console.error("Error creating movement record:", movementError);
        throw movementError;
      }
    } catch (error) {
      console.error("Error moving inventory item:", error);
      throw error;
    }
  },

  // Fetch movement history
  fetchMovements: async (): Promise<Movement[]> => {
    try {
      const isOnline = await checkSupabaseConnection();
      
      if (!isOnline) {
        console.log("Modo offline: obtendo movimentos locais");
        generateDemoData();
        
        return offlineStorage.movements.map(movement => {
          const fromAddress = movement.from_address_id 
            ? offlineStorage.addresses.find(addr => addr.id === movement.from_address_id) 
            : null;
          
          const toAddress = movement.to_address_id 
            ? offlineStorage.addresses.find(addr => addr.id === movement.to_address_id) 
            : null;
          
          return {
            id: movement.id,
            itemId: movement.item_id,
            fromAddress: fromAddress ? mapDbToAddress(fromAddress) : null,
            toAddress: toAddress ? mapDbToAddress(toAddress) : null,
            quantity: movement.quantity,
            type: movement.type as 'add' | 'move' | 'remove',
            timestamp: new Date(movement.timestamp)
          };
        }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      }

      const { data: movements, error } = await supabase
        .from('movements')
        .select(`
          *,
          inventory_items:item_id (*),
          from_addresses:from_address_id (*),
          to_addresses:to_address_id (*)
        `)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error("Error fetching movements:", error);
        throw error;
      }

      return movements.map(movement => ({
        id: movement.id,
        itemId: movement.item_id,
        fromAddress: movement.from_addresses ? mapDbToAddress(movement.from_addresses) : null,
        toAddress: movement.to_addresses ? mapDbToAddress(movement.to_addresses) : null,
        quantity: movement.quantity,
        type: movement.type as 'add' | 'move' | 'remove',
        timestamp: new Date(movement.timestamp)
      }));
    } catch (error) {
      console.error("Error fetching movements:", error);
      
      // Fallback para dados offline
      generateDemoData();
      
      return offlineStorage.movements.map(movement => {
        const fromAddress = movement.from_address_id 
          ? offlineStorage.addresses.find(addr => addr.id === movement.from_address_id) 
          : null;
        
        const toAddress = movement.to_address_id 
          ? offlineStorage.addresses.find(addr => addr.id === movement.to_address_id) 
          : null;
        
        return {
          id: movement.id,
          itemId: movement.item_id,
          fromAddress: fromAddress ? mapDbToAddress(fromAddress) : null,
          toAddress: toAddress ? mapDbToAddress(toAddress) : null,
          quantity: movement.quantity,
          type: movement.type as 'add' | 'move' | 'remove',
          timestamp: new Date(movement.timestamp)
        };
      }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
  },

  // Search inventory items
  searchInventoryItems: async (query: string): Promise<InventoryItem[]> => {
    try {
      const isOnline = await checkSupabaseConnection();
      
      if (!isOnline) {
        console.log("Modo offline: buscando itens localmente");
        generateDemoData();
        
        // Filtrar itens localmente
        const filteredItems = offlineStorage.inventory.filter(item => 
          item.name.toLowerCase().includes(query.toLowerCase()) || 
          item.cod_sap.toLowerCase().includes(query.toLowerCase())
        );
        
        return filteredItems.map(item => {
          const address = offlineStorage.addresses.find(addr => addr.id === item.address_id);
          return mapDbToItem(item, address);
        });
      }

      const { data: items, error } = await supabase
        .from('inventory_items')
        .select(`
          *,
          addresses:address_id (*)
        `)
        .or(`name.ilike.%${query}%,cod_sap.ilike.%${query}%`);

      if (error) {
        console.error("Error searching inventory items:", error);
        throw error;
      }

      return items.map(item => mapDbToItem(item, item.addresses));
    } catch (error) {
      console.error("Error searching inventory items:", error);
      
      // Fallback para busca offline
      generateDemoData();
      
      // Filtrar itens localmente
      const filteredItems = offlineStorage.inventory.filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase()) || 
        item.cod_sap.toLowerCase().includes(query.toLowerCase())
      );
      
      return filteredItems.map(item => {
        const address = offlineStorage.addresses.find(addr => addr.id === item.address_id);
        return mapDbToItem(item, address);
      });
    }
  }
};
