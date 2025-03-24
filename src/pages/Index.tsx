
import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BoxesIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  return (
    <PageLayout>
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 animate-fade-in">
        <Card className="w-full max-w-md glass-card">
          <CardContent className="flex flex-col items-center gap-6 pt-8 pb-8">
            <div className="h-20 w-20 rounded-full bg-inventory-orange/10 flex items-center justify-center">
              <BoxesIcon className="h-10 w-10 text-inventory-orange" />
            </div>
            
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold title-gradient">Controle de Estoque</h1>
              <p className="text-xl font-medium">CDPB</p>
              <p className="text-muted-foreground">Gerencie seu inventário de forma simples e eficiente</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full mt-4">
              <Button 
                className="flex-1 bg-inventory-orange hover:bg-inventory-orange-dark"
                onClick={() => navigate('/inventory')}
              >
                Ver Estoque
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => navigate('/search')}
              >
                Buscar Item
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default Index;
