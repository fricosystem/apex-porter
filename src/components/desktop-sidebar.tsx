'use client';

import { LogOut, Ticket } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import {
  ALL_MAIN_NAV,
  CENTER_NAV,
  LEFT_NAV,
  RIGHT_NAV,
  SECONDARY_NAV,
  type NavItem,
} from './navigation-config';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const OPERATION_NAV: NavItem[] = SECONDARY_NAV.filter((item) => [
  'correspondencias',
  'ocorrencias',
  'ronda',
  'checklist-turno',
  'inspecao-diaria',
  'protocolos-emergencia',
  'veiculos',
  'pre-autorizacao',
].includes(item.page));

const MANAGEMENT_NAV: NavItem[] = SECONDARY_NAV.filter((item) => [
  'departamentos',
  'empresas',
  'relatorios',
  'ramais',
  'avisos',
  'chaves',
  'lista-negra',
  'achados-perdidos',
].includes(item.page));

const SYSTEM_NAV: NavItem[] = SECONDARY_NAV.filter((item) => [
  'configuracoes',
  'admin',
].includes(item.page));

function initials(name?: string) {
  return name
    ? name.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2)
    : 'US';
}

export default function DesktopSidebar() {
  const { user, setCurrentPage, logout, setTicketModalOpen, currentPage } = useAppStore();
  const { state } = useSidebar();
  const userPermissions = user?.permissoes || [];

  const isPageAllowed = (page: string) => {
    if (!user?.ativo) return false;
    if (page === 'perfil' || page === 'login') return true;
    const cargo = (user.cargo || '').toUpperCase();
    if (cargo === 'DESENVOLVEDOR' || cargo === 'DIRETOR') return true;
    return userPermissions.includes(page as never);
  };

  const filterAllowed = (items: NavItem[]) => items.filter((item) => isPageAllowed(item.page));
  const allowedNav = {
    primary: filterAllowed([...LEFT_NAV, CENTER_NAV, ...RIGHT_NAV]),
    operation: filterAllowed(OPERATION_NAV),
    management: filterAllowed(MANAGEMENT_NAV),
    system: filterAllowed(SYSTEM_NAV),
  };

  const renderItems = (items: NavItem[]) => (
    <SidebarMenu>
      {items.map((item) => {
        const Icon = item.icon;
        const active = currentPage === item.page;
        return (
          <SidebarMenuItem key={item.page}>
            <SidebarMenuButton
              isActive={active}
              tooltip={state === 'collapsed' ? item.label : undefined}
              onClick={() => setCurrentPage(item.page)}
              className={cn(
                'h-10 rounded-lg text-sm transition-colors',
                item.page === 'fluxo' && 'font-semibold',
              )}
            >
              <Icon className={cn('size-4', item.page === 'fluxo' && 'text-emerald-500')} />
              <span>{item.label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );

  return (
    <Sidebar collapsible="icon" variant="inset" className="border-r border-sidebar-border">
      <SidebarHeader className="p-3">
        <div className="flex items-center gap-2.5 rounded-xl px-1 py-1">
          <img src="/icons/APEX_LOGO.png" alt="APEX Portaria" className="size-9 shrink-0 object-contain" />
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-bold tracking-wide">APEX PORTARIA</p>
            <p className="truncate text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Controle de acesso</p>
          </div>
        </div>
        <SidebarTrigger className="absolute right-2 top-4 size-7" />
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent className="px-2 py-3">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="px-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground group-data-[collapsible=icon]:hidden">
            Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>{renderItems(allowedNav.primary)}</SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4 p-0">
          <SidebarGroupLabel className="px-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground group-data-[collapsible=icon]:hidden">
            Operação
          </SidebarGroupLabel>
          <SidebarGroupContent>{renderItems(allowedNav.operation)}</SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4 p-0">
          <SidebarGroupLabel className="px-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground group-data-[collapsible=icon]:hidden">
            Gestão
          </SidebarGroupLabel>
          <SidebarGroupContent>{renderItems(allowedNav.management)}</SidebarGroupContent>
        </SidebarGroup>

        {allowedNav.system.length > 0 && (
          <SidebarGroup className="mt-4 p-0">
            <SidebarGroupLabel className="px-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground group-data-[collapsible=icon]:hidden">
              Sistema
            </SidebarGroupLabel>
            <SidebarGroupContent>{renderItems(allowedNav.system)}</SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="gap-2 p-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 rounded-lg bg-background group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2"
          onClick={() => setTicketModalOpen(true)}
        >
          <Ticket className="size-4" />
          <span className="group-data-[collapsible=icon]:hidden">Usar ticket</span>
        </Button>
        <SidebarSeparator />
        <div className="flex items-center gap-2 rounded-lg px-1 py-1.5">
          <Avatar className="size-8 shrink-0">
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {initials(user?.nome)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-xs font-semibold">{user?.nome || 'Usuário'}</p>
            <Badge variant="secondary" className="mt-0.5 max-w-full truncate px-1.5 py-0 text-[9px] uppercase">
              {user?.cargo || 'Operador'}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-muted-foreground hover:text-destructive group-data-[collapsible=icon]:hidden"
            title="Sair"
            onClick={logout}
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
