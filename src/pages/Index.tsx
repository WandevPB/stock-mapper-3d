
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { SupabaseService } from '@/services/SupabaseService';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BoxesIcon, ArrowRight, PlusCircle, UserPlus, Activity, ClipboardList, PackageCheck } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, Pie, PieChart, Cell, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend, Tooltip } from 'recharts';
import { InventoryItem, Movement } from '@/types/inventory';

const Index = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setIsDataLoading(true);
    try {
      const items = await SupabaseService.fetchInventoryItems();
      const movs = await SupabaseService.fetchMovements();
      setInventoryItems(items);
      setMovements(movs);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsDataLoading(false);
    }
  };

  // Generate data for top items chart
  const topItemsData = React.useMemo(() => {
    return inventoryItems
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
      .map(item => ({
        name: item.name.length > 15 ? `${item.name.substring(0, 15)}...` : item.name,
        quantidade: item.quantity,
        cod: item.codSAP
      }));
  }, [inventoryItems]);

  // Generate data for movement types chart
  const movementTypesData = React.useMemo(() => {
    const counts = movements.reduce((acc, movement) => {
      const type = movement.type === 'add' ? 'Adição' : 
                 movement.type === 'move' ? 'Movimentação' : 'Remoção';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [movements]);

  // Generate data for recent movements chart
  const recentMovementsData = React.useMemo(() => {
    // Group by date
    const last10Days = [...Array(10)].map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const movementsByDate = movements.reduce((acc, movement) => {
      const date = new Date(movement.timestamp).toISOString().split('T')[0];
      if (!acc[date]) acc[date] = { add: 0, move: 0, remove: 0 };
      acc[date][movement.type] += 1;
      return acc;
    }, {} as Record<string, { add: number, move: number, remove: number }>);

    return last10Days.map(date => ({
      date,
      Adição: movementsByDate[date]?.add || 0,
      Movimentação: movementsByDate[date]?.move || 0,
      Remoção: movementsByDate[date]?.remove || 0,
    }));
  }, [movements]);

  const pieColors = ['#ff9800', '#4caf50', '#2196f3', '#f44336'];

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  }

  return (
    <PageLayout>
      <div className="min-h-[80vh] animate-fade-in space-y-8">
        {/* Welcome Card */}
        <Card className="glass-card">
          <CardContent className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 pb-8">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-inventory-orange/10 flex items-center justify-center">
                <BoxesIcon className="h-8 w-8 text-inventory-orange" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Bem-vindo ao CDPB</h1>
                <p className="text-muted-foreground">Sistema de controle de estoque</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button 
                className="bg-inventory-orange hover:bg-inventory-orange-dark"
                onClick={() => navigate('/inventory')}
              >
                Ver Estoque
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/search')}
              >
                Buscar Item
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats Row */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
              <BoxesIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inventoryItems.length}</div>
              <p className="text-xs text-muted-foreground">Itens em estoque</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Movimentações</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{movements.length}</div>
              <p className="text-xs text-muted-foreground">Total de movimentações</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produtos Reservados</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Nenhum produto reservado</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Top Items Chart */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Itens com Maior Estoque</CardTitle>
              <CardDescription>Os 5 itens com maior quantidade em estoque</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {isDataLoading ? (
                <div className="flex h-full items-center justify-center">Carregando dados...</div>
              ) : (
                <ChartContainer config={{}} className="h-80">
                  <BarChart data={topItemsData} layout="vertical">
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={100} />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                              <div className="grid grid-cols-2 gap-2">
                                <div className="font-medium">Item:</div>
                                <div>{payload[0].payload.name}</div>
                                <div className="font-medium">Código SAP:</div>
                                <div>{payload[0].payload.cod}</div>
                                <div className="font-medium">Quantidade:</div>
                                <div>{payload[0].payload.quantidade}</div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="quantidade" fill="#FF9800" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Movement Types Chart */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Tipos de Movimentação</CardTitle>
              <CardDescription>Distribuição dos tipos de movimentação no estoque</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {isDataLoading ? (
                <div className="flex h-full items-center justify-center">Carregando dados...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={movementTypesData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {movementTypesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>Movimentações nos últimos 10 dias</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {isDataLoading ? (
              <div className="flex h-full items-center justify-center">Carregando dados...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={recentMovementsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Adição" stroke="#4caf50" activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="Movimentação" stroke="#2196f3" />
                  <Line type="monotone" dataKey="Remoção" stroke="#f44336" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Button 
            variant="outline" 
            className="flex h-20 flex-col items-center justify-center gap-1"
            onClick={() => navigate('/inventory')}
          >
            <PlusCircle className="h-5 w-5" />
            <span>Adicionar Item</span>
          </Button>
          <Button 
            variant="outline" 
            className="flex h-20 flex-col items-center justify-center gap-1"
            onClick={() => navigate('/movements')}
          >
            <PackageCheck className="h-5 w-5" />
            <span>Ver Movimentações</span>
          </Button>
          <Button 
            variant="outline" 
            className="flex h-20 flex-col items-center justify-center gap-1"
            onClick={() => navigate('/admin')}
          >
            <UserPlus className="h-5 w-5" />
            <span>Gerenciar Usuários</span>
          </Button>
        </div>
      </div>
    </PageLayout>
  );
};

export default Index;
