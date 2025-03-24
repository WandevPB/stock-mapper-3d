
import { supabase } from "@/integrations/supabase/client";
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

export const SupabaseService = {
  // Fetch all inventory items
  fetchInventoryItems: async (): Promise<InventoryItem[]> => {
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
  },

  // Add new inventory item
  addInventoryItem: async (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<InventoryItem> => {
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
  },

  // Update an inventory item
  updateInventoryItem: async (itemId: string, updatedItem: Partial<Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>>): Promise<InventoryItem> => {
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
  },

  // Delete an inventory item
  deleteInventoryItem: async (itemId: string): Promise<void> => {
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
  },

  // Move an inventory item to a new location
  moveInventoryItem: async (itemId: string, newAddress: Address, quantity?: number): Promise<void> => {
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
  },

  // Fetch movement history
  fetchMovements: async (): Promise<Movement[]> => {
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
  },

  // Search inventory items
  searchInventoryItems: async (query: string): Promise<InventoryItem[]> => {
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
  }
};
