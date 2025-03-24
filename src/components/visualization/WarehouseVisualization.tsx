
import React, { useRef, useEffect, useMemo } from 'react';
import { useInventory } from '@/context/InventoryContext';
import { Address } from '@/types/inventory';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search } from 'lucide-react';

interface ShelveProps {
  address: Address;
  isActive: boolean;
  itemCount: number;
  onClick: () => void;
}

const Shelve: React.FC<ShelveProps> = ({ address, isActive, itemCount, onClick }) => {
  return (
    <div 
      className={cn(
        "relative flex flex-col h-20 w-16 transform-gpu transition-all duration-300 cursor-pointer",
        isActive 
          ? "bg-inventory-orange text-white scale-110 shadow-lg z-10" 
          : itemCount > 0 
            ? "bg-blue-100 hover:bg-blue-200" 
            : "bg-gray-100 hover:bg-gray-200"
      )}
      onClick={onClick}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-xs font-semibold">{`${address.rua}-${address.bloco}`}</div>
      </div>
      <div className="absolute bottom-1 left-0 right-0 flex justify-center">
        <div className="text-xs">{`${address.altura}-${address.lado}`}</div>
      </div>
      {itemCount > 0 && (
        <div className="absolute top-1 right-1 bg-white text-inventory-orange-dark text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
          {itemCount}
        </div>
      )}
    </div>
  );
};

interface WarehouseVisualizationProps {
  onSelectAddress?: (address: Address) => void;
  activeAddress?: Address | null;
}

const WarehouseVisualization: React.FC<WarehouseVisualizationProps> = ({ 
  onSelectAddress, 
  activeAddress 
}) => {
  const { items } = useInventory();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRotated, setIsRotated] = React.useState(false);
  const [isZoomed, setIsZoomed] = React.useState(false);

  const uniqueAddresses = useMemo(() => {
    const addresses = new Map<string, { address: Address, count: number }>();
    
    items.forEach(item => {
      const { rua, bloco, altura, lado } = item.address;
      const key = `${rua}-${bloco}-${altura}-${lado}`;
      
      if (addresses.has(key)) {
        const current = addresses.get(key)!;
        addresses.set(key, {
          ...current,
          count: current.count + 1
        });
      } else {
        addresses.set(key, {
          address: { rua, bloco, altura, lado },
          count: 1
        });
      }
    });
    
    return [...addresses.values()];
  }, [items]);

  const rows = useMemo(() => {
    const uniqueRows = new Set<string>();
    uniqueAddresses.forEach(({ address }) => {
      uniqueRows.add(address.rua);
    });
    return [...uniqueRows].sort();
  }, [uniqueAddresses]);

  const isAddressActive = (address: Address) => {
    if (!activeAddress) return false;
    return (
      address.rua === activeAddress.rua &&
      address.bloco === activeAddress.bloco &&
      address.altura === activeAddress.altura &&
      address.lado === activeAddress.lado
    );
  };

  const toggleRotation = () => {
    setIsRotated(!isRotated);
  };

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  return (
    <Card className="glass-card relative overflow-hidden">
      <CardContent className="p-4">
        <div className="absolute top-4 right-4 flex space-x-2 z-10">
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-white/80 backdrop-blur-sm"
            onClick={toggleRotation}
          >
            {isRotated ? 'Top View' : '3D View'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-white/80 backdrop-blur-sm"
            onClick={toggleZoom}
          >
            {isZoomed ? 'Zoom Out' : 'Zoom In'}
          </Button>
        </div>
        
        <div 
          ref={containerRef}
          className={cn(
            "relative transition-all duration-700 ease-in-out transform-gpu",
            isRotated ? "rotate-[35deg] perspective-[1000px] rotateX-[45deg]" : "",
            isZoomed ? "scale-125" : ""
          )}
          style={{ 
            transformStyle: 'preserve-3d', 
            minHeight: '500px',
            transform: isRotated 
              ? 'rotateX(45deg) rotateZ(45deg)' 
              : 'rotateX(0deg) rotateZ(0deg)'
          }}
        >
          <div className="flex flex-col items-center justify-center h-full">
            {rows.map((row, rowIndex) => (
              <div key={row} className="flex mb-8 relative">
                <div className="absolute -left-10 top-1/2 transform -translate-y-1/2 text-inventory-orange font-bold">
                  {row}
                </div>
                {uniqueAddresses
                  .filter(({ address }) => address.rua === row)
                  .sort((a, b) => {
                    if (a.address.bloco !== b.address.bloco) {
                      return a.address.bloco.localeCompare(b.address.bloco);
                    }
                    if (a.address.altura !== b.address.altura) {
                      return a.address.altura.localeCompare(b.address.altura);
                    }
                    return a.address.lado.localeCompare(b.address.lado);
                  })
                  .map(({ address, count }, index) => (
                    <div 
                      key={`${address.rua}-${address.bloco}-${address.altura}-${address.lado}`} 
                      className="mx-2"
                      style={{ 
                        transform: isRotated ? `translateZ(${index * 5}px)` : 'none',
                        transition: 'transform 0.7s ease-in-out'
                      }}
                    >
                      <Shelve 
                        address={address} 
                        isActive={isAddressActive(address)}
                        itemCount={count} 
                        onClick={() => onSelectAddress && onSelectAddress(address)}
                      />
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WarehouseVisualization;
