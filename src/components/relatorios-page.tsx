'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  ArrowRightLeft, Car, Mail, UserCheck, AlertTriangle, Route, ClipboardCheck,
  ClipboardList, Flame, Megaphone, Ban, Search, Key, BellRing, Building2,
  Network, Users, Phone, ShieldCheck, Briefcase, Filter, Download, Printer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useAppStore } from '@/lib/store';
import {
  CATEGORIAS_FLUXO, OPCOES_DEPARTAMENTOS,
  TIPOS_OCORRENCIA, GRAVIDADES_OCORRENCIA, STATUS_OCORRENCIA,
  TIPOS_EMERGENCIA, getTipoPessoaLabel,
  type CategoriaFluxo, type RegistroFluxo,
} from '@/lib/data';
import { toast } from 'sonner';

type RelatorioTab =
  | 'fluxo' | 'veiculos' | 'correspondencias' | 'pre-autorizacao'
  | 'ocorrencias' | 'rondas' | 'checklists' | 'inspecoes' | 'ativacoes'
  | 'avisos' | 'lista-negra' | 'achados' | 'chaves' | 'lembretes'
  | 'empresas' | 'departamentos' | 'pessoas' | 'ramais' | 'postos' | 'cargos';

type DateRange = 'hoje' | 'ontem' | 'semana' | 'mes' | 'personalizado';

const TABS: { value: RelatorioTab; label: string; icon: React.ElementType; hasDate: boolean }[] = [
  { value: 'fluxo', label: 'Fluxo', icon: ArrowRightLeft, hasDate: true },
  { value: 'veiculos', label: 'Veículos', icon: Car, hasDate: true },
  { value: 'correspondencias', label: 'Correspondências', icon: Mail, hasDate: true },
  { value: 'pre-autorizacao', label: 'Pré-Autorização', icon: UserCheck, hasDate: true },
  { value: 'ocorrencias', label: 'Ocorrências', icon: AlertTriangle, hasDate: true },
  { value: 'rondas', label: 'Rondas', icon: Route, hasDate: true },
  { value: 'checklists', label: 'Checklist de Turno', icon: ClipboardCheck, hasDate: true },
  { value: 'inspecoes', label: 'Inspeção Diária', icon: ClipboardList, hasDate: true },
  { value: 'ativacoes', label: 'Emergência', icon: Flame, hasDate: true },
  { value: 'avisos', label: 'Avisos', icon: Megaphone, hasDate: true },
  { value: 'lista-negra', label: 'Lista Negra', icon: Ban, hasDate: true },
  { value: 'achados', label: 'Achados & Perdidos', icon: Search, hasDate: true },
  { value: 'chaves', label: 'Chaves', icon: Key, hasDate: true },
  { value: 'lembretes', label: 'Lembretes', icon: BellRing, hasDate: true },
  { value: 'empresas', label: 'Empresas', icon: Building2, hasDate: false },
  { value: 'departamentos', label: 'Departamentos', icon: Network, hasDate: false },
  { value: 'pessoas', label: 'Pessoas', icon: Users, hasDate: false },
  { value: 'ramais', label: 'Ramais', icon: Phone, hasDate: false },
  { value: 'postos', label: 'Postos', icon: ShieldCheck, hasDate: false },
  { value: 'cargos', label: 'Cargos', icon: Briefcase, hasDate: false },
];

const FLUXO_HEADERS = [
  'Categoria', 'Data', 'Horário Entrada', 'Horário Saída', 'Status',
  'Nome Principal', 'Nome', 'Nome Empresa', 'Empresa', 'Departamento',
  'RG/CPF', 'Placa', 'Motorista', 'Tipo Movimentação', 'Autorizado Por',
  'Remetente', 'Tipo', 'Quem Retirou', 'Porteiro Entrada', 'Porteiro Saída',
  'Peso Entrada', 'Peso Saída', 'Diferença', 'Tipo Reboque', 'Veículo',
  'Peso Carregado', 'Peso Vazio', 'Material', 'Peso', 'Detalhes',
  'Ocorrência', 'Observação',
];

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

function parseDate(d: string): Date {
  if (!d) return new Date(0);
  const parts = d.split('/');
  if (parts.length === 3) return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  return new Date(d);
}

function csvEscape(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function buildCSV(headers: string[], rows: unknown[][]): string {
  return [headers, ...rows].map(row => row.map(csvEscape).join(',')).join('\n');
}

// Remove columns that have no values in any row, keeping the CSV compact.
function compactColumns(headers: string[], rows: unknown[][]): { headers: string[]; rows: unknown[][] } {
  if (rows.length === 0) return { headers, rows };
  const keep = headers.map((_, i) =>
    rows.some(row => {
      const v = row[i];
      return v !== '' && v !== null && v !== undefined;
    })
  );
  return {
    headers: headers.filter((_, i) => keep[i]),
    rows: rows.map(row => row.filter((_, i) => keep[i])),
  };
}

function fluxoRow(r: RegistroFluxo): unknown[] {
  const c = r as any;
  const cat = r.categoria;
  const status = 'horarioSaida' in r && c.horarioSaida !== '' ? 'Concluído' : 'Pendente';
  const col: unknown[] = new Array(FLUXO_HEADERS.length).fill('');
  col[0] = CATEGORIAS_FLUXO.find(x => x.value === cat)?.label || cat;
  col[1] = c.data ?? '';
  col[2] = c.horarioEntrada ?? '';
  col[3] = c.horarioSaida ?? '';
  col[4] = status;
  switch (cat) {
    case 'entregas1':
      col[5] = c.nome; col[6] = c.nome; col[8] = c.empresa; col[10] = c.rgCpf;
      break;
    case 'visitantes':
    case 'prestadores':
      col[5] = c.nomeEmpresa; col[6] = c.nome; col[7] = c.nomeEmpresa; col[8] = c.empresa;
      col[9] = c.departamento; col[10] = c.rgCpf;
      break;
    case 'pesagem':
      col[5] = c.motorista; col[8] = c.empresa; col[11] = c.placa; col[12] = c.motorista;
      col[10] = c.rgCpf; col[20] = c.pesoEntrada; col[21] = c.pesoSaida;
      col[22] = c.resultadoDiferenca ?? (c.pesoEntrada && c.pesoSaida ? c.pesoSaida - c.pesoEntrada : '');
      col[18] = c.porteiroEntrada; col[19] = c.porteiroSaida;
      break;
    case 'entregas2':
      col[5] = c.motorista; col[12] = c.motorista; col[10] = c.cpfRg; col[8] = c.empresa;
      col[9] = c.departamento; col[11] = c.placa; col[20] = c.pesoEntrada; col[21] = c.pesoSaida;
      break;
    case 'coleta':
      col[5] = c.motorista; col[12] = c.motorista; col[10] = c.rgCpf; col[11] = c.placa;
      col[8] = c.empresa; col[20] = c.pesoEntrada; col[21] = c.pesoSaida;
      break;
    case 'movimentacao':
      col[5] = c.nomeColaborador; col[6] = c.nomeColaborador; col[10] = c.rgCpf;
      col[13] = c.tipoMovimentacao; col[14] = c.autorizadoPor; col[18] = c.porteiro;
      break;
    case 'correspondencias':
      col[5] = c.destinatario; col[6] = c.destinatario; col[15] = c.remetente; col[16] = c.tipo;
      col[9] = c.departamento; col[17] = c.quemRetirou; col[18] = c.porteiro;
      break;
    case 'pesagem_apara':
      col[5] = c.condutor; col[6] = c.condutor; col[23] = c.tipoReboque; col[24] = c.veiculo;
      col[25] = c.pesoCarregado; col[26] = c.pesoVazio; col[18] = c.porteiro;
      break;
    case 'pesagem_tinta':
      col[5] = c.condutor; col[6] = c.condutor; col[27] = c.material; col[24] = c.veiculo;
      col[28] = c.peso; col[18] = c.porteiro;
      break;
  }
  col[29] = c.detalhes ?? '';
  col[30] = c.ocorrencia ?? '';
  col[31] = c.observacao ?? '';
  return col;
}

const INSPECAO_STATUS: Record<string, string> = {
  em_andamento: 'Em Andamento', concluida: 'Concluída', aprovada: 'Aprovada',
};

const RECORRENCIA: Record<string, string> = {
  unica: 'Única', diaria: 'Diária', semanal: 'Semanal', mensal: 'Mensal', anual: 'Anual',
};

export default function RelatoriosPage() {
  const registrosFluxo = useAppStore(s => s.registrosFluxo);
  const veiculos = useAppStore(s => s.veiculos);
  const preAutorizacoes = useAppStore(s => s.preAutorizacoes);
  const ocorrencias = useAppStore(s => s.ocorrencias);
  const rondas = useAppStore(s => s.rondas);
  const checklists = useAppStore(s => s.checklists);
  const inspecoes = useAppStore(s => s.inspecoes);
  const protocolos = useAppStore(s => s.protocolos);
  const ativacoes = useAppStore(s => s.ativacoes);
  const avisos = useAppStore(s => s.avisos);
  const listaNegra = useAppStore(s => s.listaNegra);
  const achadosPerdidos = useAppStore(s => s.achadosPerdidos);
  const lembretes = useAppStore(s => s.lembretes);
  const registrosChaves = useAppStore(s => s.registrosChaves);
  const empresas = useAppStore(s => s.empresas);
  const departamentos = useAppStore(s => s.departamentos);
  const pessoas = useAppStore(s => s.pessoas);
  const ramais = useAppStore(s => s.ramais);
  const postos = useAppStore(s => s.postos);
  const cargos = useAppStore(s => s.cargos);

  const [activeTab, setActiveTab] = useState<RelatorioTab>('fluxo');
  const [dateRange, setDateRange] = useState<DateRange>('hoje');
  const [dataInicio, setDataInicio] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dataFim, setDataFim] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [categoriaFiltro, setCategoriaFiltro] = useState<CategoriaFluxo | 'todos'>('todos');
  const [departamentoFiltro, setDepartamentoFiltro] = useState('todos');
  const [statusFiltro, setStatusFiltro] = useState<'todos' | 'pendente' | 'concluido'>('todos');

  const currentTab = TABS.find(t => t.value === activeTab) || TABS[0];

  const dateRangeObj = useMemo(() => {
    const hoje = new Date();
    let inicio: Date, fim: Date;
    switch (dateRange) {
      case 'ontem':
        inicio = fim = new Date(hoje.getTime() - 86400000);
        break;
      case 'semana':
        inicio = new Date(hoje.getTime() - 7 * 86400000);
        fim = hoje;
        break;
      case 'mes':
        inicio = new Date(hoje.getTime() - 30 * 86400000);
        fim = hoje;
        break;
      case 'personalizado':
        inicio = new Date(dataInicio);
        fim = new Date(dataFim);
        break;
      default:
        inicio = fim = hoje;
    }
    return { inicio, fim };
  }, [dateRange, dataInicio, dataFim]);

  const withinRange = useMemo(() => (dateStr?: string) => {
    if (!dateStr) return true;
    const d = parseDate(dateStr);
    if (isNaN(d.getTime())) return true;
    const { inicio, fim } = dateRangeObj;
    const start = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
    const end = new Date(fim.getFullYear(), fim.getMonth(), fim.getDate());
    end.setDate(end.getDate() + 1);
    return d >= start && d < end;
  }, [dateRangeObj]);

  const fluxoFiltered = useMemo(() => {
    return registrosFluxo.filter(r => {
      if (categoriaFiltro !== 'todos' && r.categoria !== categoriaFiltro) return false;
      if (departamentoFiltro !== 'todos') {
        const dep = 'departamento' in r ? (r as any).departamento : '';
        if (dep !== departamentoFiltro) return false;
      }
      const hasSaida = 'horarioSaida' in r && (r as any).horarioSaida !== '';
      if (statusFiltro === 'pendente' && hasSaida) return false;
      if (statusFiltro === 'concluido' && !hasSaida) return false;
      if (!withinRange('data' in r ? (r as any).data : '')) return false;
      return true;
    });
  }, [registrosFluxo, categoriaFiltro, departamentoFiltro, statusFiltro, withinRange]);

  const veiculosFiltered = useMemo(() => veiculos.filter(v => withinRange(v.data)), [veiculos, withinRange]);
  const correspondenciasFiltered = useMemo(() =>
    registrosFluxo.filter(r => r.categoria === 'correspondencias' && withinRange((r as any).data)),
  [registrosFluxo, withinRange]);
  const preAutorizacoesFiltered = useMemo(() =>
    preAutorizacoes.filter(p => withinRange(p.dataPrevista)), [preAutorizacoes, withinRange]);
  const ocorrenciasFiltered = useMemo(() => ocorrencias.filter(o => withinRange(o.data)), [ocorrencias, withinRange]);
  const rondasFiltered = useMemo(() => rondas.filter(r => withinRange(r.data)), [rondas, withinRange]);
  const checklistsFiltered = useMemo(() => checklists.filter(c => withinRange(c.data)), [checklists, withinRange]);
  const inspecoesFiltered = useMemo(() => inspecoes.filter(i => withinRange(i.data)), [inspecoes, withinRange]);
  const ativacoesFiltered = useMemo(() => ativacoes.filter(a => withinRange(a.data)), [ativacoes, withinRange]);
  const avisosFiltered = useMemo(() => avisos.filter(a => withinRange(a.data)), [avisos, withinRange]);
  const listaNegraFiltered = useMemo(() => listaNegra.filter(l => withinRange(l.data)), [listaNegra, withinRange]);
  const achadosFiltered = useMemo(() => achadosPerdidos.filter(a => withinRange(a.data)), [achadosPerdidos, withinRange]);
  const chavesFiltered = useMemo(() => registrosChaves.filter(c => withinRange(c.data)), [registrosChaves, withinRange]);
  const lembretesFiltered = useMemo(() => lembretes.filter(l => withinRange(l.data)), [lembretes, withinRange]);

  const getExportData = useMemo(() => {
    const rows: unknown[][] = [];
    let headers: string[] = [];

    switch (activeTab) {
      case 'fluxo':
        headers = FLUXO_HEADERS;
        fluxoFiltered.forEach(r => rows.push(fluxoRow(r)));
        break;
      case 'veiculos':
        headers = ['Placa', 'Modelo', 'Cor', 'Tipo', 'Motorista', 'Documento', 'Empresa', 'Vaga', 'Data', 'Entrada', 'Saída', 'Status', 'Porteiro', 'Observações'];
        veiculosFiltered.forEach(v => rows.push([
          v.placa, v.modelo, v.cor, v.tipo, v.motoristaNome, v.motoristaDoc, v.empresa,
          v.vaga, v.data, v.horarioEntrada, v.horarioSaida || '',
          v.horarioSaida ? 'Saiu' : 'Estacionado', v.porteiro, v.observacoes,
        ]));
        break;
      case 'correspondencias':
        headers = ['Destinatário', 'Remetente', 'Tipo', 'Departamento', 'Data', 'Entrada', 'Retirada', 'Quem Retirou', 'Porteiro', 'Status'];
        correspondenciasFiltered.forEach(r => {
          const c = r as any;
          rows.push([
            c.destinatario, c.remetente, c.tipo, c.departamento, c.data, c.horarioEntrada,
            c.horarioSaida || '', c.quemRetirou || '-', c.porteiro,
            c.horarioSaida ? 'Retirada' : 'Pendente',
          ]);
        });
        break;
      case 'pre-autorizacao':
        headers = ['Visitante', 'Documento', 'Empresa', 'Departamento', 'Autorizado Por', 'Motivo', 'Data Prevista', 'Horário Previsto', 'Status', 'Data Confirmação', 'Porteiro', 'Criado Por'];
        preAutorizacoesFiltered.forEach(p => rows.push([
          p.visitanteNome, p.visitanteDoc, p.visitanteEmpresa, p.departamento, p.autorizadoPor,
          p.motivo, p.dataPrevista, p.horarioPrevisto, cap(p.status), p.dataConfirmacao || '',
          p.porteiro || '', p.criadoPor || '',
        ]));
        break;
      case 'ocorrencias':
        headers = ['Título', 'Tipo', 'Gravidade', 'Status', 'Data', 'Horário', 'Local', 'Descrição', 'Envolvidos', 'Ação Tomada', 'Porteiro', 'Resolução'];
        ocorrenciasFiltered.forEach(o => rows.push([
          o.titulo,
          TIPOS_OCORRENCIA.find(t => t.value === o.tipo)?.label || o.tipo,
          GRAVIDADES_OCORRENCIA.find(g => g.value === o.gravidade)?.label || o.gravidade,
          STATUS_OCORRENCIA.find(s => s.value === o.status)?.label || o.status,
          o.data, o.horario, o.local, o.descricao, o.envolvidos, o.acaoTomada, o.porteiro, o.resolucao || '',
        ]));
        break;
      case 'rondas':
        headers = ['Rota', 'Data', 'Início', 'Fim', 'Status', 'Porteiro', 'Pontos OK', 'Pontos Irregular', 'Total Pontos', 'Detalhe dos Pontos'];
        rondasFiltered.forEach(r => {
          const ok = r.pontos.filter(p => p.status === 'ok').length;
          const irr = r.pontos.filter(p => p.status !== 'ok').length;
          const detalhe = r.pontos.map(p =>
            `${p.ponto} (${p.horarioReal || p.horarioPrevisto}) - ${p.status === 'ok' ? 'OK' : 'Irregularidade'}${p.observacao ? ': ' + p.observacao : ''}`
          ).join(' | ');
          rows.push([r.rota, r.data, r.horarioInicio, r.horarioFim, cap(r.status), r.porteiro, ok, irr, r.pontos.length, detalhe]);
        });
        break;
      case 'checklists':
        headers = ['Data', 'Horário Passagem', 'Porteiro Saindo', 'Porteiro Entrando', 'Status', 'Itens Concluídos', 'Total Itens', 'Ocorrências Repassadas', 'Correspondências Pendentes', 'Chaves Pendentes', 'Observações Gerais', 'Detalhe dos Itens'];
        checklistsFiltered.forEach(c => {
          const concluidos = c.itens.filter(i => i.checked).length;
          const detalhe = c.itens.map(i => `${i.item} - ${i.checked ? 'OK' : 'Pendente'}${i.observacao ? ': ' + i.observacao : ''}`).join(' | ');
          rows.push([
            c.data, c.horarioPassagem, c.porteiroSaindo, c.porteiroEntrando, cap(c.status),
            concluidos, c.itens.length, c.ocorrenciasRepassadas, c.correspondenciasPendentes,
            c.chavesPendentes, c.observacoesGerais, detalhe,
          ]);
        });
        break;
      case 'inspecoes':
        headers = ['Data', 'Turno', 'Status', 'Porteiro', 'Supervisor', 'Data Aprovação', 'Itens OK', 'Não Conformes', 'Inoperantes', 'Total Itens', 'Observações Gerais', 'Detalhe dos Itens'];
        inspecoesFiltered.forEach(i => {
          const ok = i.itens.filter(x => x.status === 'ok').length;
          const nao = i.itens.filter(x => x.status === 'nao_conforme').length;
          const inop = i.itens.filter(x => x.status === 'inoperante').length;
          const detalhe = i.itens.map(x => `${x.item} - ${x.status === 'ok' ? 'OK' : x.status === 'nao_conforme' ? 'Não Conforme' : 'Inoperante'}${x.observacao ? ': ' + x.observacao : ''}`).join(' | ');
          rows.push([
            i.data, cap(i.turno), INSPECAO_STATUS[i.status] || i.status, i.porteiro, i.supervisor,
            i.dataAprovacao || '', ok, nao, inop, i.itens.length, i.observacoesGerais, detalhe,
          ]);
        });
        break;
      case 'ativacoes':
        headers = ['Data', 'Horário', 'Protocolo', 'Tipo de Emergência', 'Acionado Por', 'Observação'];
        ativacoesFiltered.forEach(a => {
          const proto = protocolos.find(p => p.id === a.protocoloId);
          const tipo = proto ? TIPOS_EMERGENCIA.find(t => t.value === proto.tipo)?.label || proto.tipo : '';
          rows.push([a.data, a.horario, proto?.titulo || a.protocoloId, tipo, a.acionadoPor, a.observacao]);
        });
        break;
      case 'avisos':
        headers = ['Título', 'Conteúdo', 'Prioridade', 'Data', 'Autor', 'Turno', 'Categoria', 'Data Expiração', 'Fixado', 'Lido Por'];
        avisosFiltered.forEach(a => rows.push([
          a.titulo, a.conteudo, cap(a.prioridade), a.data, a.autor, cap(a.turno || ''),
          a.categoria || '', a.dataExpiracao || '', a.fixado ? 'Sim' : 'Não', (a.lidoPor || []).join('; '),
        ]));
        break;
      case 'lista-negra':
        headers = ['Nome', 'Motivo', 'Data', 'Status', 'Empresa'];
        listaNegraFiltered.forEach(l => rows.push([l.nome, l.motivo, l.data, cap(l.status), l.empresa || '']));
        break;
      case 'achados':
        headers = ['Descrição', 'Local Encontrado', 'Data', 'Status', 'Cor', 'Observações'];
        achadosFiltered.forEach(a => rows.push([a.descricao, a.localEncontrado, a.data, cap(a.status), a.cor || '', a.observacoes || '']));
        break;
      case 'chaves':
        headers = ['Nome', 'Chave', 'Data', 'Horário Retirada', 'Horário Devolução', 'Porteiro Retirada', 'Porteiro Devolução', 'Observação', 'Status'];
        chavesFiltered.forEach(c => rows.push([
          c.nome, c.chave, c.data, c.horarioRetirada, c.horarioDevolucao || '',
          c.porteiroRetirada, c.porteiroDevolucao || '', c.observacao || '',
          c.horarioDevolucao ? 'Devolvida' : 'Retirada',
        ]));
        break;
      case 'lembretes':
        headers = ['Título', 'Descrição', 'Data', 'Hora', 'Recorrente', 'Tipo Recorrência', 'Minutos Antes', 'Ativo', 'Data Criação'];
        lembretesFiltered.forEach(l => rows.push([
          l.titulo, l.descricao, l.data, l.hora, l.recorrente ? 'Sim' : 'Não',
          RECORRENCIA[l.tipoRecorrencia] || l.tipoRecorrencia, l.minutosAntes, l.ativo ? 'Sim' : 'Não', l.dataCriacao,
        ]));
        break;
      case 'empresas':
        headers = ['Nome', 'CNPJ', 'Contato'];
        empresas.forEach(e => rows.push([e.nome, e.cnpj || '', e.contato || '']));
        break;
      case 'departamentos':
        headers = ['Nome', 'Empresa', 'Responsável'];
        departamentos.forEach(d => rows.push([d.nome, d.empresa || '', d.responsavel || '']));
        break;
      case 'pessoas':
        headers = ['Nome', 'Tipo', 'Empresa', 'Departamento', 'Cargo', 'RG/CPF', 'Placa', 'Telefone', 'Email', 'Data Cadastro', 'Status', 'Ticket'];
        pessoas.forEach(p => rows.push([
          p.nome, getTipoPessoaLabel(p.tipo), p.empresa, p.departamento, p.cargo, p.rgCpf,
          p.placa, p.telefone, p.email, p.dataCadastro || '', p.inativo ? 'Inativo' : 'Ativo', p.ticket || '',
        ]));
        break;
      case 'ramais':
        headers = ['Nome', 'Departamento', 'Ramal'];
        ramais.forEach(r => rows.push([r.nome, r.departamento, r.ramal]));
        break;
      case 'postos':
        headers = ['Nome', 'Ativo'];
        postos.forEach(p => rows.push([p.nome, p.ativo ? 'Sim' : 'Não']));
        break;
      case 'cargos':
        headers = ['Nome', 'Ativo'];
        cargos.forEach(c => rows.push([c.nome, c.ativo ? 'Sim' : 'Não']));
        break;
    }

    const compacted = compactColumns(headers, rows);
    return { headers: compacted.headers, rows: compacted.rows };
  }, [activeTab, fluxoFiltered, veiculosFiltered, correspondenciasFiltered, preAutorizacoesFiltered,
    ocorrenciasFiltered, rondasFiltered, checklistsFiltered, inspecoesFiltered, ativacoesFiltered,
    avisosFiltered, listaNegraFiltered, achadosFiltered, chavesFiltered, lembretesFiltered,
    protocolos, empresas, departamentos, pessoas, ramais, postos, cargos]);

  const handleExportCSV = () => {
    const { headers, rows } = getExportData;
    const csv = buildCSV(headers, rows);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_${activeTab}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${rows.length} registro(s) exportado(s) com sucesso!`);
  };

  const handlePrint = () => window.print();

  const showDateFilter = currentTab.hasDate;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full overflow-y-auto overflow-x-hidden scrollable-list p-4 md:p-6 pb-24 space-y-4">
      <div>
        <h2 className="text-xl font-bold">Relatórios</h2>
        <p className="text-sm text-muted-foreground">Exporte dados dos módulos do sistema</p>
      </div>

      {/* Tabs de módulo */}
      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as RelatorioTab)}>
        <div className="overflow-x-auto pb-1 -mx-1 px-1">
          <TabsList className="inline-flex w-max h-auto gap-1 p-1 flex-nowrap">
            {TABS.map(t => (
              <TabsTrigger key={t.value} value={t.value} className="text-xs px-3 py-1.5 whitespace-nowrap data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                <t.icon className="h-3.5 w-3.5 mr-1" />{t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><Filter className="h-4 w-4" />Filtros</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {showDateFilter && (
              <>
                <div className="space-y-1">
                  <Label className="text-xs">Período</Label>
                  <Select value={dateRange} onValueChange={v => setDateRange(v as DateRange)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hoje">Hoje</SelectItem>
                      <SelectItem value="ontem">Ontem</SelectItem>
                      <SelectItem value="semana">Última Semana</SelectItem>
                      <SelectItem value="mes">Último Mês</SelectItem>
                      <SelectItem value="personalizado">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {dateRange === 'personalizado' && (
                  <>
                    <div className="space-y-1"><Label className="text-xs">Início</Label><Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="h-9 text-sm" /></div>
                    <div className="space-y-1"><Label className="text-xs">Fim</Label><Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="h-9 text-sm" /></div>
                  </>
                )}
              </>
            )}
            {activeTab === 'fluxo' && (
              <>
                <div className="space-y-1">
                  <Label className="text-xs">Categoria</Label>
                  <Select value={categoriaFiltro} onValueChange={v => setCategoriaFiltro(v as CategoriaFluxo | 'todos')}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas</SelectItem>
                      {CATEGORIAS_FLUXO.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Departamento</Label>
                  <Select value={departamentoFiltro} onValueChange={v => setDepartamentoFiltro(v)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {OPCOES_DEPARTAMENTOS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Status</Label>
                  <Select value={statusFiltro} onValueChange={v => setStatusFiltro(v as typeof statusFiltro)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="pendente">Pendentes</SelectItem>
                      <SelectItem value="concluido">Concluídos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            {!showDateFilter && (
              <p className="col-span-full text-xs text-muted-foreground">Exportação completa do cadastro sem filtro de período.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Exportação */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1"><Download className="h-4 w-4" /><span className="text-sm font-medium">Exportar Dados — {currentTab.label}</span></div>
          <p className="text-xs text-muted-foreground mb-3">
            {getExportData.rows.length} registro(s) correspondem aos filtros aplicados. O CSV inclui todos os campos do módulo para análise completa.
          </p>
          <div className="flex gap-2">
            <Button onClick={handleExportCSV} className="bg-emerald-600 hover:bg-emerald-700 flex-1">
              <Download className="h-4 w-4 mr-2" />Exportar CSV
            </Button>
            <Button variant="outline" onClick={handlePrint} className="flex-1">
              <Printer className="h-4 w-4 mr-2" />Imprimir
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
