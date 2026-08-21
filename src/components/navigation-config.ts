import {
  AlertTriangle,
  ArrowRightLeft,
  Bell,
  Building,
  Building2,
  Car,
  ClipboardCheck,
  Eye,
  FileText,
  Footprints,
  KeyRound,
  LayoutDashboard,
  Mail,
  Phone,
  Search,
  Settings,
  Shield,
  ShieldBan,
  Siren,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import type { PageType } from '@/lib/data';

export interface NavItem {
  page: PageType;
  label: string;
  icon: React.ElementType;
  primary?: boolean;
}

export const LEFT_NAV: NavItem[] = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { page: 'lembretes', label: 'Lembretes', icon: Bell },
];

export const CENTER_NAV: NavItem = {
  page: 'fluxo',
  label: 'Fluxo',
  icon: ArrowRightLeft,
  primary: true,
};

export const RIGHT_NAV: NavItem[] = [
  { page: 'cadastros', label: 'Cadastros', icon: UserPlus },
];

export const SECONDARY_NAV: NavItem[] = [
  { page: 'correspondencias', label: 'Correspondências', icon: Mail },
  { page: 'ocorrencias', label: 'Ocorrências', icon: AlertTriangle },
  { page: 'ronda', label: 'Rondas', icon: Footprints },
  { page: 'checklist-turno', label: 'Plantão', icon: ClipboardCheck },
  { page: 'inspecao-diaria', label: 'Inspeção', icon: Eye },
  { page: 'protocolos-emergencia', label: 'Emergência', icon: Siren },
  { page: 'veiculos', label: 'Veículos', icon: Car },
  { page: 'pre-autorizacao', label: 'Pré-autorização', icon: UserCheck },
  { page: 'departamentos', label: 'Departamentos', icon: Building2 },
  { page: 'empresas', label: 'Empresas', icon: Building },
  { page: 'relatorios', label: 'Relatórios', icon: FileText },
  { page: 'ramais', label: 'Ramais', icon: Phone },
  { page: 'avisos', label: 'Avisos', icon: Bell },
  { page: 'chaves', label: 'Chaves', icon: KeyRound },
  { page: 'lista-negra', label: 'Lista Negra', icon: ShieldBan },
  { page: 'achados-perdidos', label: 'Achados e Perdidos', icon: Search },
  { page: 'configuracoes', label: 'Configurações', icon: Settings },
  { page: 'admin', label: 'Administração', icon: Shield },
];

export const MAIN_NAV: NavItem[] = [
  ...LEFT_NAV,
  CENTER_NAV,
  ...RIGHT_NAV,
];

export const ALL_MAIN_NAV: NavItem[] = [...MAIN_NAV, ...SECONDARY_NAV];
