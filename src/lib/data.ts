// Type definitions and lookup constants for APEX Portaria
// Seed data (fictional initial records) has been moved to ./seed-data.ts

export type PageType =
  | 'login'
  | 'dashboard'
  | 'fluxo'
  | 'correspondencias'
  | 'veiculos'
  | 'pre-autorizacao'
  | 'relatorios'
  | 'cadastros'
  | 'departamentos'
  | 'empresas'
  | 'ramais'
  | 'avisos'
  | 'lista-negra'
  | 'achados-perdidos'
  | 'ocorrencias'
  | 'ronda'
  | 'checklist-turno'
  | 'inspecao-diaria'
  | 'protocolos-emergencia'
  | 'configuracoes'
  | 'perfil'
  | 'lembretes'
  | 'admin';

export type CategoriaFluxo =
  | 'entregas1'
  | 'visitantes'
  | 'prestadores'
  | 'pesagem'
  | 'entregas2'
  | 'coleta'
  | 'movimentacao'
  | 'correspondencias';

export const CATEGORIAS_FLUXO: { value: CategoriaFluxo; label: string }[] = [
  { value: 'visitantes', label: 'VISITANTE' },
  { value: 'prestadores', label: 'PRESTADOR DE SERVIÇOS' },
  { value: 'pesagem', label: 'PESAGEM DE CARGA' },
  { value: 'entregas2', label: 'ENTREGA' },
  { value: 'coleta', label: 'COLETA' },
  { value: 'movimentacao', label: 'MOVIMENTAÇÃO INTERNA COLABORADOR' },
];

export interface BaseRegistroFluxo {
  id: string;
  inativo?: boolean;
  versaoAnteriorId?: string;
  dataInativacao?: string;
  motivoRefacao?: string;
  observacao?: string;
  isRascunho?: boolean;
}

export interface RegistroEntregas1 extends BaseRegistroFluxo {
  categoria: 'entregas1';
  data: string;
  horarioEntrada: string;
  nome: string;
  empresa: string;
  rgCpf: string;
  horarioSaida: string;
  detalhes?: string;
  ocorrencia?: string;
}

export interface RegistroVisitantes extends BaseRegistroFluxo {
  categoria: 'visitantes';
  nomeEmpresa: string;
  nome?: string;
  empresa?: string;
  departamento: string;
  rgCpf: string;
  data: string;
  horarioEntrada: string;
  horarioSaida: string;
  detalhes?: string;
  ocorrencia?: string;
}

export interface RegistroPrestadores extends BaseRegistroFluxo {
  categoria: 'prestadores';
  nomeEmpresa: string;
  nome?: string;
  empresa?: string;
  departamento: string;
  rgCpf: string;
  data: string;
  horarioEntrada: string;
  horarioSaida: string;
  detalhes?: string;
  ocorrencia?: string;
}

export interface RegistroPesagem extends BaseRegistroFluxo {
  categoria: 'pesagem';
  data: string;
  empresa: string;
  placa: string;
  motorista: string;
  rgCpf: string;
  horarioEntrada: string;
  pesoEntrada: number;
  horarioSaida: string;
  pesoSaida: number;
  resultadoDiferenca?: number;
  porteiroEntrada?: string;
  porteiroSaida?: string;
  detalhes?: string;
  ocorrencia?: string;
}

export interface RegistroEntregas2 extends BaseRegistroFluxo {
  categoria: 'entregas2';
  data: string;
  horarioEntrada: string;
  motorista: string;
  cpfRg: string;
  empresa: string;
  departamento: string;
  placa?: string;
  horarioSaida: string;
  pesoEntrada?: number;
  pesoSaida?: number;
  detalhes?: string;
  ocorrencia?: string;
}

export interface RegistroColeta extends BaseRegistroFluxo {
  categoria: 'coleta';
  rgCpf: string;
  horarioEntrada: string;
  placa: string;
  empresa: string;
  motorista: string;
  data: string;
  horarioSaida: string;
  pesoEntrada?: number;
  pesoSaida?: number;
  detalhes?: string;
  ocorrencia?: string;
}

export interface RegistroMovimentacao extends BaseRegistroFluxo {
  categoria: 'movimentacao';
  nomeColaborador: string;
  rgCpf: string;
  horarioEntrada: string;
  horarioSaida: string;
  tipoMovimentacao: 'entrando' | 'saindo';
  autorizadoPor: string;
  porteiro: string;
  data: string;
  detalhes?: string;
  ocorrencia?: string;
}

export interface RegistroCorrespondencias extends BaseRegistroFluxo {
  categoria: 'correspondencias';
  destinatario: string;
  remetente: string;
  tipo: string;
  departamento: string;
  horarioEntrada: string;
  horarioSaida: string;
  quemRetirou: string;
  porteiro: string;
  data: string;
  detalhes?: string;
  ocorrencia?: string;
}

export type RegistroFluxo =
  | RegistroEntregas1
  | RegistroVisitantes
  | RegistroPrestadores
  | RegistroPesagem
  | RegistroEntregas2
  | RegistroColeta
  | RegistroMovimentacao
  | RegistroCorrespondencias;

export interface Empresa {
  id: string;
  nome: string;
  cnpj?: string;
  contato?: string;
}

export interface Departamento {
  id: string;
  nome: string;
  empresa?: string;
  responsavel?: string;
}

export type TipoPessoa = 'Colaborador' | 'Visitante' | 'Prestador' | 'Entregador' | 'Motorista' | 'Outro';

export const TIPOS_PESSOA: { value: TipoPessoa; label: string }[] = [
  { value: 'Colaborador', label: 'Colaborador' },
  { value: 'Visitante', label: 'Visitante' },
  { value: 'Prestador', label: 'Prestador de Serviço' },
  { value: 'Entregador', label: 'Entregador' },
  { value: 'Motorista', label: 'Motorista' },
  { value: 'Outro', label: 'Outro' },
];

export interface Pessoa {
  id: string;
  nome: string;
  tipo: TipoPessoa;
  empresa: string;
  departamento: string;
  cargo: string;
  rgCpf: string;
  placa: string;
  telefone: string;
  email: string;
  dataCadastro?: string; // YYYY-MM-DD
  inativo?: boolean;     // soft-delete flag
  ticket?: string;       // código do ticket único para visitantes recorrentes
}

// Deprecated alias — kept for backward compatibility with Fluxo records
export type Funcionario = Pessoa;

export interface Ramal {
  id: string;
  departamento: string;
  nome: string;
  ramal: string;
}

export type TurnoAviso = 'todos' | 'diurno' | 'noturno';
export type CategoriaAviso = 'Segurança' | 'Operacional' | 'Administrativo' | 'Urgente';

export interface Aviso {
  id: string;
  titulo: string;
  conteudo: string;
  prioridade: 'alta' | 'media' | 'baixa';
  data: string;
  autor: string;
  turno?: TurnoAviso;
  categoria?: CategoriaAviso;
  dataExpiracao?: string;
  fixado?: boolean;
  lidoPor?: string[];
}

export interface ListaNegraEntry {
  id: string;
  nome: string;
  motivo: string;
  data: string;
  status: 'ativo' | 'inativo';
  empresa?: string;
}

export interface AchadosPerdidosItem {
  id: string;
  descricao: string;
  localEncontrado: string;
  data: string;
  status: 'achado' | 'perdido' | 'devolvido';
  cor?: string;
  observacoes?: string;
}

export interface Posto {
  id: string;
  nome: string;
  ativo: boolean;
}

export interface Cargo {
  id: string;
  nome: string;
  ativo: boolean;
}

export interface User {
  id: string;
  nome: string;
  email: string;
  cpf?: string;
  cargo?: string;
  dataCadastro?: string;
  mapconfig?: 'padrao' | 'satelite';
  senha?: string; // Armazenada com hash em produção
  ativo: boolean;
  permissoes: PageType[]; // Páginas que o usuário pode acessar
  postoId?: string; // ID do posto associado
}

// ── Veículos ──
export type TipoVeiculo = 'Visitante' | 'Prestador' | 'Entregador' | 'Colaborador';

export interface RegistroVeiculo {
  id: string;
  placa: string;
  modelo: string;
  cor: string;
  tipo: TipoVeiculo;
  motoristaNome: string;
  motoristaDoc: string;
  empresa: string;
  vaga: string;
  data: string;
  horarioEntrada: string;
  horarioSaida: string;
  observacoes?: string;
  registroFluxoId?: string;
  porteiro: string;
}

// ── Pré-Autorização ──
export type StatusPreAutorizacao = 'agendado' | 'confirmado' | 'cancelado' | 'expirado';

export interface PreAutorizacao {
  id: string;
  visitanteNome: string;
  visitanteDoc: string;
  visitanteEmpresa: string;
  departamento: string;
  autorizadoPor: string;
  motivo: string;
  dataPrevista: string;
  horarioPrevisto: string;
  status: StatusPreAutorizacao;
  registroFluxoId?: string;
  dataConfirmacao?: string;
  porteiro?: string;
  criadoPor?: string;
}

// ── Ocorrências ──
export type TipoOcorrencia = 'invasao' | 'furto' | 'vandalismo' | 'incendio' | 'inundacao' | 'alarme' | 'perturbacao' | 'veiculo_suspeito' | 'outra';
export type GravidadeOcorrencia = 'leve' | 'moderada' | 'grave' | 'critica';
export type StatusOcorrencia = 'aberta' | 'em_andamento' | 'resolvida' | 'encaminhada';

export const TIPOS_OCORRENCIA: { value: TipoOcorrencia; label: string }[] = [
  { value: 'invasao', label: 'Invasão' },
  { value: 'furto', label: 'Furto' },
  { value: 'vandalismo', label: 'Vandalismo' },
  { value: 'incendio', label: 'Incêndio' },
  { value: 'inundacao', label: 'Inundação' },
  { value: 'alarme', label: 'Alarme' },
  { value: 'perturbacao', label: 'Perturbação' },
  { value: 'veiculo_suspeito', label: 'Veículo Suspeito' },
  { value: 'outra', label: 'Outra' },
];

export const GRAVIDADES_OCORRENCIA: { value: GravidadeOcorrencia; label: string }[] = [
  { value: 'leve', label: 'Leve' },
  { value: 'moderada', label: 'Moderada' },
  { value: 'grave', label: 'Grave' },
  { value: 'critica', label: 'Crítica' },
];

export const STATUS_OCORRENCIA: { value: StatusOcorrencia; label: string }[] = [
  { value: 'aberta', label: 'Aberta' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'resolvida', label: 'Resolvida' },
  { value: 'encaminhada', label: 'Encaminhada' },
];

export interface Ocorrencia {
  id: string;
  titulo: string;
  tipo: TipoOcorrencia;
  gravidade: GravidadeOcorrencia;
  status: StatusOcorrencia;
  data: string;
  horario: string;
  local: string;
  descricao: string;
  envolvidos: string;
  acaoTomada: string;
  porteiro: string;
  resolucao?: string;
}

// ── Ronda / Patrulhamento (Geolocalização) ──
export type StatusRonda = 'aguardando' | 'em_andamento' | 'concluida' | 'parcial';

export interface PontoRota {
  id: string;
  nome: string;
  latitude: number;
  longitude: number;
  altitude?: number; // em metros
  raio: number; // em metros
  horarioExecucao: string; // HH:mm
  recorrente: boolean;
  diasSemana?: string[]; // Ex: ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom']
}

export interface RotaGeoreferenciada {
  id: string;
  nome: string;
  pontos: PontoRota[];
  criadoEm?: string; // ISO string
  atualizadoEm?: string; // ISO string
  recorrente?: boolean;
  diasSemana?: string[]; // Ex: ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom']
  postoId?: string; // ID do posto associado
  horariosPlantao?: string[]; // Ex: ['00:00', '02:00', '04:00', '06:00']
  minutosAlerta?: number; // Padrão: 10 (minutos antes de cada horário)
}

export interface PontoRonda {
  id: string;
  rondaId: string;
  ponto: string;
  horarioPrevisto: string;
  horarioReal: string;
  status: 'ok' | 'irregularidade';
  observacao: string;
  latitude?: number;
  longitude?: number;
  raio?: number;
  fotoUrl?: string;
}

export interface Ronda {
  id: string;
  rota: string;
  rotaId?: string; // ID da RotaGeoreferenciada
  postoId?: string; // ID do posto associado
  data: string;
  horarioInicio: string;
  horarioFim: string;
  status: StatusRonda;
  porteiro: string;
  pontos: PontoRonda[];
  recorrente?: boolean;
  diasSemana?: string[]; // Ex: ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom']
  semanaAno?: number; // Semana do ano para recorrência
  ano?: number;
  horarioPlantao?: string; // Ex: '00:00'
  cicloCompleto?: boolean; // true quando todos os horários do plantão foram concluídos
  fotoUrl?: string; // URL da foto tirada na abertura geral da ronda (opcional)
}

export const ROTAS_RONDA = [
  'Rota Principal — Portaria > Garagem > Área de Carga > Corredores',
  'Rota Externa — Perímetro > Estacionamento > Área Verde',
  'Rota Noturna — Portaria > Pisos > Escadas > Terraço',
  'Rota CFTV — Salão de Câmeras > Equipamentos > Gerador',
];

export const PONTOS_RONDA_PREDEFINIDOS = [
  'Portaria Principal',
  'Garagem Subsolo',
  'Garagem Térreo',
  'Área de Carga/Descarga',
  'Corredor Ala A',
  'Corredor Ala B',
  'Recepção',
  'Refeitório',
  'Sala de Equipamentos',
  'Estacionamento Externo',
  'Perímetro Norte',
  'Perímetro Sul',
  'Terraço',
  'Casa de Máquinas',
  'Gerador',
  'Depósito',
];

// ── Checklist de Turno / Passagem de Plantão ──
export type StatusChecklist = 'pendente' | 'concluido';

export interface ItemChecklist {
  id: string;
  checklistId: string;
  item: string;
  checked: boolean;
  observacao: string;
}

export interface ChecklistTurno {
  id: string;
  data: string;
  horarioPassagem: string;
  porteiroSaindo: string;
  porteiroEntrando: string;
  itens: ItemChecklist[];
  ocorrenciasRepassadas: string;
  correspondenciasPendentes: string;
  chavesPendentes: string;
  observacoesGerais: string;
  status: StatusChecklist;
}

export const ITENS_CHECKLIST_PADRAO = [
  'Chaves entregues e conferidas',
  'Ocorrências em aberto repassadas',
  'Visitantes pendentes de saída informados',
  'Correspondências não retiradas informadas',
  'Alarmes ativados e conferidos',
  'Equipamentos de segurança conferidos',
  'CFTV funcionando normalmente',
  'Rádio comunicador testado',
  'Iluminação de emergência verificada',
  'Extintores conferidos',
  'Portões e cancelas funcionando',
  'Interfone testado',
  'Relatório de turno preenchido',
  'Materiais e ferramentas da portaria conferidos',
];

// ── Inspeção Diária ──
export type StatusItemInspecao = 'ok' | 'nao_conforme' | 'inoperante';
export type StatusInspecao = 'em_andamento' | 'concluida' | 'aprovada';

export interface ItemInspecao {
  id: string;
  inspecaoId: string;
  item: string;
  status: StatusItemInspecao;
  observacao: string;
  acaoCorretiva: string;
}

export interface InspecaoDiaria {
  id: string;
  data: string;
  turno: 'diurno' | 'noturno';
  itens: ItemInspecao[];
  observacoesGerais: string;
  porteiro: string;
  supervisor: string;
  dataAprovacao?: string;
  status: StatusInspecao;
}

export const ITENS_INSPECAO_PADRAO = [
  'Portão principal — abertura/fechamento',
  'Cancela de entrada — funcionamento',
  'Cancela de saída — funcionamento',
  'Interfone — comunicação e áudio',
  'Sistema CFTV — câmeras e gravação',
  'Monitor de câmeras — imagem nítida',
  'Alarme perimetral — status e teste',
  'Alarme interno — status e teste',
  'Extintores — validade e lacre',
  'Iluminação de emergência — teste',
  'Rádio comunicador — bateria e sinal',
  'Sirene de emergência — teste',
  'Sistema de combate a incêndio — manômetro',
  'Senhas e chaves de emergência — conferência',
  'No-break / UPS — status e bateria',
  'Gerador de energia — nível combustível',
  'Catracas / controle de acesso — funcionamento',
  'Iluminação externa — geral',
  'Iluminação interna — corredores e escadas',
  'Sinalização de emergência — visibilidade',
];

// ── Protocolos de Emergência ──
export type TipoEmergencia = 'incendio' | 'inundacao' | 'invasao' | 'ameaca_bomba' | 'acidente' | 'evacuacao' | 'corte_energia';

export const TIPOS_EMERGENCIA: { value: TipoEmergencia; label: string; icon: string }[] = [
  { value: 'incendio', label: 'Incêndio', icon: 'flame' },
  { value: 'inundacao', label: 'Inundação', icon: 'droplets' },
  { value: 'invasao', label: 'Invasão', icon: 'shield-alert' },
  { value: 'ameaca_bomba', label: 'Ameaça de Bomba', icon: 'bomb' },
  { value: 'acidente', label: 'Acidente Pessoal', icon: 'heart' },
  { value: 'evacuacao', label: 'Evacuação', icon: 'door-open' },
  { value: 'corte_energia', label: 'Corte de Energia', icon: 'zap-off' },
];

export interface EtapaProtocolo {
  id: string;
  ordem: number;
  descricao: string;
}

export interface ContatoEmergencia {
  id: string;
  nome: string;
  funcao: string;
  telefone: string;
  tipo: 'interno' | 'externo';
}

export interface ProtocoloEmergencia {
  id: string;
  tipo: TipoEmergencia;
  titulo: string;
  descricao: string;
  etapas: EtapaProtocolo[];
  contatos: ContatoEmergencia[];
  observacoes: string;
  ativo: boolean;
}

export interface AtivacaoProtocolo {
  id: string;
  protocoloId: string;
  data: string;
  horario: string;
  acionadoPor: string;
  observacao: string;
}

// Chart data for dashboard
export const DADOS_GRAFICO_BARRAS = [
  { hora: '06h', entradas: 4, saidas: 1 },
  { hora: '07h', entradas: 8, saidas: 2 },
  { hora: '08h', entradas: 12, saidas: 3 },
  { hora: '09h', entradas: 15, saidas: 5 },
  { hora: '10h', entradas: 10, saidas: 7 },
  { hora: '11h', entradas: 7, saidas: 9 },
  { hora: '12h', entradas: 3, saidas: 12 },
  { hora: '13h', entradas: 6, saidas: 8 },
  { hora: '14h', entradas: 9, saidas: 6 },
  { hora: '15h', entradas: 5, saidas: 4 },
  { hora: '16h', entradas: 3, saidas: 7 },
  { hora: '17h', entradas: 1, saidas: 10 },
];

export const DADOS_GRAFICO_LINHA = [
  { dia: 'Seg', movimentacoes: 42 },
  { dia: 'Ter', movimentacoes: 38 },
  { dia: 'Qua', movimentacoes: 55 },
  { dia: 'Qui', movimentacoes: 47 },
  { dia: 'Sex', movimentacoes: 61 },
  { dia: 'Sáb', movimentacoes: 18 },
  { dia: 'Dom', movimentacoes: 8 },
];

export const DADOS_GRAFICO_PIZZA = [
  { name: 'Entregas', value: 35, fill: '#10b981' },
  { name: 'Visitantes', value: 25, fill: '#14b8a6' },
  { name: 'Prestadores', value: 20, fill: '#059669' },
  { name: 'Pesagem', value: 12, fill: '#0d9488' },
  { name: 'Coleta', value: 8, fill: '#047857' },
  { name: 'Mov. Interna', value: 10, fill: '#065f46' },
  { name: 'Correspondências', value: 7, fill: '#047857' },
];

export const DADOS_GRAFICO_AREA = [
  { periodo: 'Manhã (6h-12h)', fluxo: 68 },
  { periodo: 'Tarde (12h-18h)', fluxo: 45 },
  { periodo: 'Noite (18h-0h)', fluxo: 12 },
  { periodo: 'Madrugada (0h-6h)', fluxo: 3 },
];

export const OPCOES_EMPRESAS = [
  'Transportes Silva Ltda',
  'Logística Rápida S.A.',
  'Distribuidora Central',
  'Serviços Gerais Premium',
  'Coleta Verde Ambiental',
  'Manutenção Total EIRELI',
];

export const OPCOES_VAGAS = [
  'V1', 'V2', 'V3', 'V4', 'V5',
  'V6', 'V7', 'V8', 'V9', 'V10',
  'CD1', 'CD2', 'CD3',
  'PCD1', 'PCD2',
];

export const OPCOES_CORES_VEICULO = [
  'Preto', 'Branco', 'Prata', 'Cinza', 'Vermelho',
  'Azul', 'Verde', 'Amarelo', 'Marrom', 'Bege', 'Outro',
];

export const OPCOES_DEPARTAMENTOS = [
  'Recepção',
  'Segurança',
  'RH',
  'Financeiro',
  'Logística',
  'Almoxarifado',
  'TI',
  'Diretoria',
  'Comercial',
  'Compras',
];

// ── Lembretes ──
export type TipoRecorrencia = 'unica' | 'diaria' | 'semanal' | 'mensal' | 'anual';

export interface Lembrete {
  id: string;
  usuarioEmail: string;
  titulo: string;
  descricao: string;
  data: string; // YYYY-MM-DD
  hora: string; // HH:mm
  recorrente: boolean;
  tipoRecorrencia: TipoRecorrencia;
  minutosAntes: number; // 0 para não lembrar antes
  notificadoAntes: boolean; // se já notificou x minutos antes
  notificadoNoHorario: boolean; // se já notificou no horário exato
  dataCriacao: string; // ISO date string
  ativo: boolean;
}
