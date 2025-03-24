
import React, { useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { useInventory } from '@/context/InventoryContext';
import InventoryItem from '@/components/inventory/InventoryItem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import InventoryForm from '@/components/inventory/InventoryForm';
import MoveItemForm from '@/components/inventory/MoveItemForm';
import { InventoryItem as InventoryItemType } from '@/types/inventory';
import { BoxesIcon, Plus, Search, Filter } from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const Inventory = () => {
  const { items, getItemsByAddress } = useInventory();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItemType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRua, setFilterRua] = useState<string>('all');

  const handleEditItem = (item: InventoryItemType) => {
    setSelectedItem(item);
    setIsDialogOpen(true);
  };

  const handleMoveItem = (item: InventoryItemType) => {
    setSelectedItem(item);
    setIsMoveDialogOpen(true);
  };

  const closeDialogs = () => {
    setIsDialogOpen(false);
    setIsMoveDialogOpen(false);
    setSelectedItem(null);
  };

  const uniqueRuas = [...new Set(items.map(item => item.address.rua))].sort();

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      searchQuery === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.codSAP.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRua = filterRua === 'all' || item.address.rua === filterRua;
    
    return matchesSearch && matchesRua;
  });

  return (
    <PageLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-semibold title-gradient">Inventory Management</h1>
            <p className="text-muted-foreground mt-1">View, add, and manage inventory items</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-inventory-orange hover:bg-inventory-orange-dark">
                <Plus className="mr-2 h-4 w-4" /> Add New Item
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card">
              <InventoryForm 
                item={selectedItem || undefined} 
                onSuccess={closeDialogs} 
                onCancel={closeDialogs}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by name or SAP code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="text-muted-foreground h-4 w-4" />
            <Select value={filterRua} onValueChange={setFilterRua}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by Rua" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ruas</SelectItem>
                {uniqueRuas.map(rua => (
                  <SelectItem key={rua} value={rua}>{rua}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center">
            <Badge variant="outline" className="bg-inventory-orange/10 text-inventory-orange">
              {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
            </Badge>
          </div>
        </div>

        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map(item => (
              <InventoryItem
                key={item.id}
                item={item}
                onEdit={handleEditItem}
                onMove={handleMoveItem}
              />
            ))}
          </div>
        ) : (
          <div className="h-60 flex flex-col items-center justify-center text-muted-foreground">
            <BoxesIcon className="h-16 w-16 mb-4 opacity-20" />
            <h3 className="text-xl font-medium">No items found</h3>
            <p className="text-sm mt-2">
              {searchQuery || filterRua !== 'all'
                ? "Try changing your search or filter criteria"
                : "Add your first inventory item to get started"}
            </p>
          </div>
        )}
      </div>
      
      <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
        <DialogContent className="glass-card">
          {selectedItem && (
            <MoveItemForm 
              item={selectedItem} 
              onSuccess={closeDialogs} 
              onCancel={closeDialogs}
            />
          )}
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default Inventory;
