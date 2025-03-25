
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutGrid, 
  BoxesIcon, 
  MoveIcon, 
  SearchIcon,
  Menu,
  X,
  Shield,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/context/AuthContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const isMobile = useIsMobile();
  const { user, isAdmin, signOut } = useAuth();

  const navItems = [
    { path: '/', icon: <LayoutGrid size={18} />, label: 'Painel' },
    { path: '/inventory', icon: <BoxesIcon size={18} />, label: 'Estoque' },
    { path: '/movements', icon: <MoveIcon size={18} />, label: 'Movimentações' },
    { path: '/search', icon: <SearchIcon size={18} />, label: 'Busca' },
  ];

  // Add admin route if user is admin
  if (isAdmin) {
    navItems.push({ path: '/admin', icon: <Shield size={18} />, label: 'Admin' });
  }

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <NavLink to="/" className="flex items-center space-x-2">
            <BoxesIcon className="h-6 w-6 text-inventory-orange" />
            <span className="font-semibold text-lg text-inventory-orange">
              CDPB
            </span>
          </NavLink>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                cn(
                  "flex items-center gap-1 text-sm font-medium animate-hover",
                  isActive 
                    ? "text-inventory-orange" 
                    : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}

          {user && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout} 
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <LogOut size={18} className="mr-1" />
              <span>Sair</span>
            </Button>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="fixed inset-0 top-16 z-50 grid h-[calc(100vh-4rem)] grid-flow-row auto-rows-max overflow-auto p-6 pb-32 shadow-md animate-fade-in md:hidden bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="relative z-20 grid gap-6 rounded-md bg-white p-4">
              <nav className="grid grid-flow-row auto-rows-max text-sm">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) => 
                      cn(
                        "flex items-center gap-2 py-2 animate-hover",
                        isActive 
                          ? "text-inventory-orange" 
                          : "text-muted-foreground hover:text-foreground"
                      )
                    }
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </NavLink>
                ))}
                
                {user && (
                  <Button 
                    variant="ghost"
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="flex items-center justify-start gap-2 py-2 h-auto text-muted-foreground hover:text-foreground"
                  >
                    <LogOut size={18} />
                    <span>Sair</span>
                  </Button>
                )}
              </nav>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
