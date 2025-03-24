
import React, { useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search as SearchIcon, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { InventoryItem as InventoryItemType } from '@/types/inventory';
import { useInventory } from '@/context/InventoryContext';
import { Skeleton } from '@/components/ui/skeleton';

const Search = () => {
  const { searchItems } = useInventory();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<InventoryItemType[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setHasSearched(true);
    
    try {
      const results = await searchItems(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching inventory items:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
  };

  const formatAddress = (item: InventoryItemType) => {
    const { rua, bloco, altura, lado } = item.address;
    return `${rua}-${bloco}-${altura}-${lado}`;
  };

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-inventory-orange mb-6">Buscar Item</h1>
        
        <Card className="glass-card mb-8">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Digite o código SAP ou nome do item..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button type="submit" className="bg-inventory-orange hover:bg-inventory-orange-dark">
                Buscar
              </Button>
            </form>
          </CardContent>
        </Card>

        {isSearching ? (
          <div className="space-y-4">
            {Array(3).fill(0).map((_, index) => (
              <Card key={index} className="glass-card">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : hasSearched ? (
          searchResults.length > 0 ? (
            <div className="space-y-4">
              {searchResults.map((item) => (
                <Card key={item.id} className="glass-card hover:shadow-md transition-all duration-300">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <h3 className="font-medium">Nome</h3>
                        <p>{item.name}</p>
                      </div>
                      <div>
                        <h3 className="font-medium">Código SAP</h3>
                        <p>{item.codSAP}</p>
                      </div>
                      <div>
                        <h3 className="font-medium">Localização</h3>
                        <p>{formatAddress(item)}</p>
                      </div>
                      <div>
                        <h3 className="font-medium">Quantidade</h3>
                        <p>{item.quantity !== undefined ? item.quantity : 'Não contado'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum item encontrado para "{searchQuery}".</p>
            </div>
          )
        ) : null}
      </div>
    </PageLayout>
  );
};

export default Search;
