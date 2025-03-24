
import React, { useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { useInventory } from '@/context/InventoryContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search as SearchIcon, X } from 'lucide-react';
import InventoryItem from '@/components/inventory/InventoryItem';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import InventoryForm from '@/components/inventory/InventoryForm';
import MoveItemForm from '@/components/inventory/MoveItemForm';
import { InventoryItem as InventoryItemType } from '@/types/inventory';
import { useIsMobile } from '@/hooks/use-mobile';

const Search = () => {
  const { searchItems } = useInventory();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<InventoryItemType[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItemType | null>(null);
  const isMobile = useIsMobile();

  const handleSearch = () => {
    if (searchQuery.trim()) {
      const results = searchItems(searchQuery);
      setSearchResults(results);
      setHasSearched(true);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleEditItem = (item: InventoryItemType) => {
    setSelectedItem(item);
    setIsEditDialogOpen(true);
  };

  const handleMoveItem = (item: InventoryItemType) => {
    setSelectedItem(item);
    setIsMoveDialogOpen(true);
  };

  const closeDialogs = () => {
    setIsEditDialogOpen(false);
    setIsMoveDialogOpen(false);
    setSelectedItem(null);
    // Refresh search results after edit/move
    if (searchQuery.trim()) {
      const results = searchItems(searchQuery);
      setSearchResults(results);
    }
  };

  return (
    <PageLayout>
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-semibold title-gradient">Busca de Itens</h1>
          <p className="text-muted-foreground mt-1">Encontre itens por nome, código SAP ou localização</p>
        </div>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <div className="relative flex-1 w-full">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Busque por nome, código SAP ou localização (ex: A-1-2-B)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10 w-full"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6"
                    onClick={handleClearSearch}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Button 
                onClick={handleSearch} 
                className="bg-inventory-orange hover:bg-inventory-orange-dark w-full sm:w-auto"
              >
                Buscar
              </Button>
            </div>
          </CardContent>
        </Card>

        {hasSearched && (
          <div className="space-y-4">
            <h2 className="text-xl font-medium">
              Resultados da Busca {searchResults.length > 0 && `(${searchResults.length})`}
            </h2>
            
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {searchResults.map(item => (
                  <InventoryItem
                    key={item.id}
                    item={item}
                    onEdit={handleEditItem}
                    onMove={handleMoveItem}
                  />
                ))}
              </div>
            ) : (
              <Card className="glass-card">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <SearchIcon className="h-12 w-12 text-muted-foreground opacity-20 mb-4" />
                  <h3 className="text-lg font-medium">Nenhum item encontrado</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tente um termo de busca diferente ou verifique a ortografia
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="glass-card">
          {selectedItem && (
            <InventoryForm 
              item={selectedItem} 
              onSuccess={closeDialogs} 
              onCancel={closeDialogs}
            />
          )}
        </DialogContent>
      </Dialog>

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

export default Search;
