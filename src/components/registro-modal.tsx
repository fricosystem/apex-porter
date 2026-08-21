'use client';

import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogPortal,
  DialogOverlay,
} from '@/components/ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ChevronDown, ChevronUp, Minus, Plus, Ticket, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppStore } from '@/lib/store';
import {
  CATEGORIAS_FLUXO,
  type CategoriaFluxo,
  type RegistroFluxo,
  type Pessoa,
  type PessoaExtra,
} from '@/lib/data';
import AutocompleteInput, { type AutocompleteSuggestion } from './autocomplete-input';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import { formatCpfRg } from '@/lib/utils';
import { buildReleaseMessage } from '@/lib/release-message';

// Unified data structure for autocomplete — stores ALL available info
// regardless of which category it came from
const EXTRA_PERSON_CATEGORIES: CategoriaFluxo[] = ['visitantes', 'prestadores', 'pesagem', 'entregas2', 'coleta'];

function supportsExtraPeople(categoria: CategoriaFluxo | ''): boolean {
  return Boolean(categoria && EXTRA_PERSON_CATEGORIES.includes(categoria));
}

export interface UnifiedSuggestionData {
  name: string;       // person's name
  company: string;    // company name
  doc: string;        // RG/CPF
  plate: string;      // vehicle plate
  department: string; // department
  origin?: string;    // source origin ('cadastro')
}

// Maps unified data → form fields for each category
export function mapToFormFields(categoria: CategoriaFluxo | '', data: UnifiedSuggestionData, targetField?: string): Record<string, string> {
  const mapped: Record<string, string> = {};

  // Special handling for Autorizado Por in movimentacao: only fill that field
  if (categoria === 'movimentacao' && targetField === 'autorizadoPor') {
    if (data.name) mapped.autorizadoPor = data.name;
    return mapped;
  }

  switch (categoria) {
    case 'entregas1':
      if (data.name) mapped.nome = data.name;
      if (data.company) mapped.empresa = data.company;
      if (data.doc) mapped.rgCpf = data.doc;
      break;
    case 'visitantes':
      if (data.name) mapped.nome = data.name;
      if (data.company) mapped.empresa = data.company;
      if (data.department) mapped.departamento = data.department;
      if (data.doc) mapped.rgCpf = data.doc;
      break;
    case 'prestadores':
      if (data.name) mapped.nome = data.name;
      if (data.company) mapped.empresa = data.company;
      if (data.department) mapped.departamento = data.department;
      if (data.doc) mapped.rgCpf = data.doc;
      break;
    case 'pesagem':
      if (data.name) mapped.motorista = data.name;
      if (data.doc) mapped.rgCpf = data.doc;
      if (data.company) mapped.empresa = data.company;
      if (data.plate) mapped.placa = data.plate;
      break;
    case 'entregas2':
        if (data.name) mapped.motorista = data.name;
        if (data.doc) mapped.cpfRg = data.doc;
        if (data.company) mapped.empresa = data.company;
        if (data.department) mapped.departamento = data.department;
        if (data.plate) mapped.placa = data.plate;
        break;
    case 'coleta':
      if (data.name) mapped.motorista = data.name;
      if (data.doc) mapped.rgCpf = data.doc;
      if (data.plate) mapped.placa = data.plate;
      if (data.company) mapped.empresa = data.company;
      break;
    case 'movimentacao':
      if (data.name) mapped.nomeColaborador = data.name;
      if (data.doc) mapped.rgCpf = data.doc;
      break;
    case 'correspondencias':
      if (data.name) mapped.destinatario = data.name;
      if (data.company) mapped.remetente = data.company;
      if (data.department) mapped.departamento = data.department;
      break;
    case 'pesagem_apara':
      if (data.name) mapped.condutor = data.name;
      if (data.plate) mapped.veiculo = data.plate;
      break;
    case 'pesagem_tinta':
      if (data.name) mapped.condutor = data.name;
      if (data.plate) mapped.veiculo = data.plate;
      break;
  }

  return mapped;
}

// Extract unified data from any RegistroFluxo
export function extractUnifiedFromRecord(r: RegistroFluxo): UnifiedSuggestionData {
  const data: UnifiedSuggestionData = { name: '', company: '', doc: '', plate: '', department: '' };

  switch (r.categoria) {
    case 'entregas1':
      data.name = r.nome;
      data.company = r.empresa;
      data.doc = r.rgCpf;
      break;
    case 'visitantes':
    case 'prestadores':
      data.name = (r as any).nome || r.nomeEmpresa;
      data.company = (r as any).empresa || '';
      data.department = r.departamento;
      data.doc = r.rgCpf;
      break;
    case 'pesagem':
      data.company = r.empresa;
      data.plate = r.placa;
      data.name = r.motorista;
      data.doc = (r as any).rgCpf || '';
      break;
    case 'entregas2':
      data.name = r.motorista;
      data.doc = r.cpfRg;
      data.company = r.empresa;
      data.department = r.departamento || '';
      data.plate = r.placa || '';
      break;
    case 'coleta':
      data.doc = r.rgCpf;
      data.plate = r.placa || '';
      data.company = r.empresa;
      data.name = r.motorista;
      break;
    case 'movimentacao':
      data.name = r.nomeColaborador;
      data.doc = r.rgCpf;
      break;
    case 'correspondencias':
      data.name = r.destinatario;
      data.company = r.remetente;
      data.department = r.departamento;
      break;
    case 'pesagem_apara':
      data.name = (r as any).condutor || '';
      data.plate = (r as any).veiculo || '';
      break;
    case 'pesagem_tinta':
      data.name = (r as any).condutor || '';
      data.plate = (r as any).veiculo || '';
      break;
  }

  return data;
}

// Merge data from multiple records with the same key (prefer more complete records)
function mergeUnified(existing: UnifiedSuggestionData, incoming: UnifiedSuggestionData): UnifiedSuggestionData {
  return {
    name: existing.name || incoming.name,
    company: existing.company || incoming.company,
    doc: existing.doc || incoming.doc,
    plate: existing.plate || incoming.plate,
    department: existing.department || incoming.department,
    origin: existing.origin || incoming.origin,
  };
}

interface RegistroModalProps {
  open: boolean;
  onClose: () => void;
  categoriaInicial: CategoriaFluxo;
  registroInicial?: RegistroFluxo;
  isRefacao?: boolean;
  isRascunho?: boolean;
  prefilledFormData?: Record<string, string>;
}

export default function RegistroModal({
  open,
  onClose: originalOnClose,
  categoriaInicial,
  registroInicial,
  isRefacao,
  isRascunho,
  prefilledFormData,
}: RegistroModalProps) {
  const { addRegistroFluxo, inativarRegistroFluxo, pessoas, empresas, departamentos, ramais, registrosFluxo, user, addRascunhoFluxo, updateRascunhoFluxo, removeRascunhoFluxo, addEmpresa, addPessoa, updatePessoa } = useAppStore();
  const [isRascunhoEditing, setIsRascunhoEditing] = useState(false);
  const [coletaMessage, setColetaMessage] = useState<string | null>(null);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [ticketGerado, setTicketGerado] = useState<string | null>(null);
  const [pessoasExtras, setPessoasExtras] = useState<PessoaExtra[]>([]);
  const [extrasOpen, setExtrasOpen] = useState(false);

  // Função para verificar recorrência por CPF
  const verificarRecorrencia = (cpf: string): { isRecorrente: boolean; pessoa?: Pessoa; contador: number } => {
    if (!cpf) return { isRecorrente: false, contador: 0 };
    
    const cpfLimpo = cpf.replace(/\D/g, '');
    const pessoa = pessoas.find(p => p.rgCpf.replace(/\D/g, '') === cpfLimpo && !p.inativo);
    
    if (!pessoa) return { isRecorrente: false, contador: 0 };
    
    // Contar registros no histórico
    const contador = registrosFluxo.filter(r => {
      const doc = extractUnifiedFromRecord(r).doc.replace(/\D/g, '');
      return doc === cpfLimpo;
    }).length;
    
    return { isRecorrente: contador >= 3, pessoa, contador };
  };

  // Função para gerar ticket no formato DDMNX
  const gerarTicket = (): string => {
    // Obter data atual
    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2, '0'); // DD com zero à esquerda
    const mes = String(hoje.getMonth() + 1).padStart(2, '0'); // MN com zero à esquerda
    const prefixo = dia + mes;

    // Contar quantos tickets já existem para hoje (início com prefixo DDMN)
    let count = 0;
    pessoas.forEach(p => {
      if (p.ticket && p.ticket.startsWith(prefixo)) {
        count++;
      }
    });

    // O próximo número é count + 1
    const numeroSequencial = count + 1;

    // Ticket é DDMNX
    return prefixo + numeroSequencial.toString();
  };

  // Função para verificar e gerar ticket único
  const handleCriarTicket = () => {
    // Pegar CPF do form data
    let cpf = '';
    if (formData.rgCpf) cpf = formData.rgCpf;
    else if (formData.cpfRg) cpf = formData.cpfRg;
    
    if (!cpf) {
      toast.error('Informe o CPF/RG primeiro');
      return;
    }

    const { pessoa } = verificarRecorrencia(cpf);
    if (!pessoa) {
      toast.error('Pessoa não cadastrada');
      return;
    }

    const novoTicket = gerarTicket();

    // Atualizar pessoa com o novo ticket
    updatePessoa({ ...pessoa, ticket: novoTicket });
    setTicketGerado(novoTicket);
    setTicketModalOpen(true);
    toast.success('Ticket criado com sucesso!');
  };

  const onClose = () => {
    limparCampos();
    originalOnClose();
  };

  // Cadastrar Empresa quick modal
  const [cadastrarEmpresaOpen, setCadastrarEmpresaOpen] = useState(false);
  const [categoria, setCategoria] = useState<CategoriaFluxo | ''>('');
  const [formData, setFormData] = useState<Record<string, string>>(() => ({
    data: format(new Date(), 'dd/MM/yyyy'),
    horarioEntrada: format(new Date(), 'HH:mm'),
    porteiro: user?.nome || '',
  }));

  const limparCampos = () => {
    setFormData({
      data: format(new Date(), 'dd/MM/yyyy'),
      horarioEntrada: format(new Date(), 'HH:mm'),
      porteiro: user?.nome || '',
      pesoCarregado: '',
      pesoVazio: '',
    });
    setPessoasExtras([]);
    setExtrasOpen(false);
    if (!categoriaInicial) {
      setCategoria('');
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (open) {
      if (prefilledFormData) {
        setFormData(prefilledFormData);
        setPessoasExtras([]);
        setExtrasOpen(false);
        setCategoria(categoriaInicial);
      } else if (registroInicial && (isRefacao || isRascunho)) {
        setCategoria(registroInicial.categoria);
        const { id: _i, inativo: _in, versaoAnteriorId: _v, dataInativacao: _di, motivoRefacao: _m, pessoasExtras: extrasSalvos, ...rest } = registroInicial as any;
        setFormData({ ...rest });
        setPessoasExtras(Array.isArray(extrasSalvos) ? extrasSalvos : []);
        setExtrasOpen(false);
      } else {
        setFormData({
          data: format(new Date(), 'dd/MM/yyyy'),
          horarioEntrada: format(new Date(), 'HH:mm'),
          porteiro: user?.nome || '',
        });
        setPessoasExtras([]);
        setExtrasOpen(false);
        if (!categoriaInicial) {
          setCategoria('');
        }
      }
    }
  }, [open, registroInicial, isRefacao, isRascunho, user, categoriaInicial, prefilledFormData]);

  // ── Unified suggestion builders ──
  // All suggestions store data using UnifiedSuggestionData keys
  // so that selecting any suggestion works for any category

  const nameSuggestions = useMemo(() => {
    const map = new Map<string, { data: UnifiedSuggestionData; sublabel: string }>();

    // From pessoas (cadastros) — PRIMARY source with FULL data
    pessoas.filter((f) => !f.inativo).forEach((f) => {
      if (!map.has(f.nome)) {
        map.set(f.nome, {
          data: {
            name: f.nome,
            company: f.empresa || '',
            doc: f.rgCpf || '',
            plate: f.placa || '',
            department: f.departamento || '',
            origin: 'cadastro',
          },
          sublabel: [
            f.tipo,
            f.empresa,
            f.cargo,
            f.departamento,
          ].filter(Boolean).join(' — ')
            || f.rgCpf
            || '',
        });
      }
    });

    // From ramais (cadastros) — adds person/sector names with ramal info
    ramais.forEach((r) => {
      if (!map.has(r.nome)) {
        map.set(r.nome, {
          data: { name: r.nome, company: '', doc: '', plate: '', department: r.departamento },
          sublabel: `${r.departamento} — Ramal ${r.ramal}`,
        });
      }
    });

    // From previous fluxo records — merge data for same names
    registrosFluxo.forEach((r) => {
      const unified = extractUnifiedFromRecord(r);
      const key = unified.name;
      if (!key) return;

      if (map.has(key)) {
        const existing = map.get(key)!;
        // Only upgrade sublabel if existing has none
        map.set(key, {
          data: mergeUnified(existing.data, unified),
          sublabel: existing.sublabel || unified.company,
        });
      } else {
        const sublabel = unified.company || unified.department || '';
        map.set(key, { data: { ...unified, origin: 'historico' }, sublabel });
      }
    });

    return Array.from(map.entries()).map(([label, { data, sublabel }]) => ({
      label,
      sublabel: sublabel || undefined,
      origin: (data.origin as 'cadastro' | 'historico' | undefined),
      data: data as unknown as Record<string, string>,
    }));
  }, [pessoas, ramais, registrosFluxo]);

  const empresaSuggestions = useMemo(() => {
    const map = new Map<string, { data: UnifiedSuggestionData; sublabel: string }>();

    // Apenas da coleção de empresas
    empresas.forEach((e) => {
      if (!map.has(e.nome)) {
        map.set(e.nome, {
          data: { name: '', company: e.nome, doc: '', plate: '', department: '', origin: 'cadastro' },
          sublabel: e.cnpj || '',
        });
      }
    });

    return Array.from(map.entries()).map(([label, { data, sublabel }]) => ({
      label,
      sublabel: sublabel || undefined,
      origin: (data.origin as 'cadastro' | 'historico' | undefined),
      data: data as unknown as Record<string, string>,
    }));
  }, [empresas]);

  const rgCpfSuggestions = useMemo(() => {
    const map = new Map<string, { data: UnifiedSuggestionData; sublabel: string }>();

    // From pessoas (cadastros) — RG/CPF field is a PRIMARY source
    pessoas.filter((p) => !p.inativo).forEach((p) => {
      if (p.rgCpf) {
        if (!map.has(p.rgCpf)) {
          map.set(p.rgCpf, {
            data: { name: p.nome, company: p.empresa || '', doc: p.rgCpf, plate: p.placa || '', department: p.departamento || '', origin: 'cadastro' },
            sublabel: p.nome,
          });
        } else {
          const existing = map.get(p.rgCpf)!;
          map.set(p.rgCpf, {
            data: mergeUnified(existing.data, { name: p.nome, company: p.empresa || '', doc: p.rgCpf, plate: p.placa || '', department: p.departamento || '', origin: 'cadastro' }),
            sublabel: existing.sublabel,
          });
        }
      }
    });

    registrosFluxo.forEach((r) => {
      const unified = extractUnifiedFromRecord(r);
      const doc = unified.doc;
      if (!doc) return;

      if (map.has(doc)) {
        const existing = map.get(doc)!;
        map.set(doc, {
          data: mergeUnified(existing.data, unified),
          sublabel: existing.sublabel,
        });
      } else {
        const sublabel = unified.name || '';
        map.set(doc, { data: { ...unified, origin: 'historico' }, sublabel });
      }
    });

    return Array.from(map.entries()).map(([label, { data, sublabel }]) => ({
      label,
      sublabel: sublabel || undefined,
      origin: (data.origin as 'cadastro' | 'historico' | undefined),
      data: data as unknown as Record<string, string>,
    }));
  }, [pessoas, registrosFluxo]);

  const placaSuggestions = useMemo(() => {
    const map = new Map<string, { data: UnifiedSuggestionData; sublabel: string }>();

    // From pessoas (cadastros) — placa field is a PRIMARY source
    pessoas.filter((p) => !p.inativo).forEach((p) => {
      if (p.placa) {
        if (!map.has(p.placa)) {
          map.set(p.placa, {
            data: { name: p.nome, company: p.empresa || '', doc: p.rgCpf || '', plate: p.placa, department: p.departamento || '' },
            sublabel: [p.nome, p.empresa].filter(Boolean).join(' — '),
          });
        } else {
          const existing = map.get(p.placa)!;
          map.set(p.placa, {
            data: mergeUnified(existing.data, { name: p.nome, company: p.empresa || '', doc: p.rgCpf || '', plate: p.placa, department: p.departamento || '' }),
            sublabel: existing.sublabel,
          });
        }
      }
    });

    registrosFluxo.forEach((r) => {
      const unified = extractUnifiedFromRecord(r);
      const plate = unified.plate;
      if (!plate) return;

      if (map.has(plate)) {
        const existing = map.get(plate)!;
        map.set(plate, {
          data: mergeUnified(existing.data, unified),
          sublabel: existing.sublabel,
        });
      } else {
        const sublabel = [unified.name, unified.company].filter(Boolean).join(' — ');
        map.set(plate, { data: { ...unified, origin: 'historico' }, sublabel });
      }
    });

    return Array.from(map.entries()).map(([label, { data, sublabel }]) => ({
      label,
      sublabel: sublabel || undefined,
      origin: (data.origin as 'cadastro' | 'historico' | undefined),
      data: data as unknown as Record<string, string>,
    }));
  }, [pessoas, registrosFluxo]);

  // ── Departamento suggestions from cadastros + pessoas (dynamic) ──
  const departamentoSuggestions = useMemo(() => {
    const names = new Set<string>();
    departamentos.forEach((d) => names.add(d.nome));
    // Also collect department names from pessoas cadastros
    pessoas.filter((p) => !p.inativo).forEach((p) => {
      if (p.departamento) names.add(p.departamento);
    });
    // Also collect department names from previous fluxo records
    registrosFluxo.forEach((r) => {
      const unified = extractUnifiedFromRecord(r);
      if (unified.department) names.add(unified.department);
    });
    return Array.from(names).sort().map((name) => ({
      label: name,
      sublabel: departamentos.find((d) => d.nome === name)?.responsavel
        ? `Resp: ${departamentos.find((d) => d.nome === name)?.responsavel}`
        : undefined,
      data: { name: '', company: '', doc: '', plate: '', department: name } as unknown as Record<string, string>,
    }));
  }, [departamentos, pessoas, registrosFluxo]);

  // ── Ramal suggestions from cadastros ──
  const ramalSuggestions = useMemo(() => {
    return ramais.map((r) => ({
      label: r.nome,
      sublabel: `${r.departamento} — Ramal ${r.ramal}`,
      data: { name: r.nome, company: '', doc: '', plate: '', department: r.departamento } as unknown as Record<string, string>,
    }));
  }, [ramais]);

  // ── Tipo de reboque suggestions (PESAGEM DE APARA) from histórico ──
  const reboqueSuggestions = useMemo(() => {
    const names = new Set<string>();
    registrosFluxo.forEach((r) => {
      const tipo = (r as any).tipoReboque;
      if (typeof tipo === 'string' && tipo.trim()) names.add(tipo.trim());
    });
    return Array.from(names).sort().map((name) => ({
      label: name,
      sublabel: undefined,
      data: { name: '', company: '', doc: '', plate: '', department: '', tipoReboque: name } as unknown as Record<string, string>,
    }));
  }, [registrosFluxo]);

  // ── Material suggestions (PESAGEM DE TINTA/SOLVENTE) from histórico ──
  const materialSuggestions = useMemo(() => {
    const names = new Set<string>();
    registrosFluxo.forEach((r) => {
      const material = (r as any).material;
      if (typeof material === 'string' && material.trim()) names.add(material.trim());
    });
    return Array.from(names).sort().map((name) => ({
      label: name,
      sublabel: undefined,
      data: { name: '', company: '', doc: '', plate: '', department: '', material: name } as unknown as Record<string, string>,
    }));
  }, [registrosFluxo]);

  // ── Handlers ──

  const handleCategoriaChange = (v: string) => {
    const novaCategoria = v as CategoriaFluxo;
    
    // Transferir dados entre campos equivalentes ao mudar de categoria
    setFormData((prev) => {
      const novoFormData = { ...prev };
      
      // Obter o nome principal do formulário atual
      let nomePrincipal = prev.nome || prev.motorista || prev.nomeColaborador || prev.destinatario || '';
      
      // Obter o documento principal do formulário atual
      let docPrincipal = prev.rgCpf || prev.cpfRg || '';
      
      // Preencher campos equivalentes na nova categoria
      switch (novaCategoria) {
        case 'entregas1':
        case 'visitantes':
        case 'prestadores':
          if (nomePrincipal && !prev.nome) novoFormData.nome = nomePrincipal;
          if (docPrincipal && !prev.rgCpf) novoFormData.rgCpf = docPrincipal;
          break;
          
        case 'pesagem':
        case 'coleta':
          if (nomePrincipal && !prev.motorista) novoFormData.motorista = nomePrincipal;
          if (docPrincipal && !prev.rgCpf) novoFormData.rgCpf = docPrincipal;
          break;
          
        case 'entregas2':
          if (nomePrincipal && !prev.motorista) novoFormData.motorista = nomePrincipal;
          if (docPrincipal && !prev.cpfRg) novoFormData.cpfRg = docPrincipal;
          break;
          
        case 'movimentacao':
          if (nomePrincipal && !prev.nomeColaborador) novoFormData.nomeColaborador = nomePrincipal;
          if (docPrincipal && !prev.rgCpf) novoFormData.rgCpf = docPrincipal;
          break;
          
        case 'correspondencias':
          if (nomePrincipal && !prev.destinatario) novoFormData.destinatario = nomePrincipal;
          break;

        case 'pesagem_apara':
          if (nomePrincipal && !prev.condutor) novoFormData.condutor = nomePrincipal;
          // Pesos sempre limpos para novos valores numéricos
          novoFormData.pesoCarregado = '';
          novoFormData.pesoVazio = '';
          break;

        case 'pesagem_tinta':
          if (nomePrincipal && !prev.condutor) novoFormData.condutor = nomePrincipal;
          // Peso sempre limpo para novo valor numérico
          novoFormData.peso = '';
          break;
      }
      
      return novoFormData;
    });
    
    setCategoria(novaCategoria);
    setPessoasExtras([]);
    setExtrasOpen(false);
  };

  const updateField = (field: string, value: string) => {
    if (field === 'empresa' && supportsExtraPeople(categoria)) {
      const empresaAnterior = formData.empresa || '';
      setPessoasExtras((extras) => extras.map((extra) => (
        !extra.empresa || extra.empresa === empresaAnterior
          ? { ...extra, empresa: value }
          : extra
      )));
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addPessoaExtra = () => {
    setPessoasExtras((extras) => [
      ...extras,
      {
        id: `extra_${Date.now()}_${extras.length}`,
        nome: '',
        rgCpf: '',
        empresa: formData.empresa || '',
      },
    ]);
    setExtrasOpen(true);
  };

  const updatePessoaExtra = (id: string, field: keyof PessoaExtra, value: string) => {
    setPessoasExtras((extras) => extras.map((extra) => (
      extra.id === id ? { ...extra, [field]: value } : extra
    )));
  };

  const handlePessoaExtraSelect = (id: string, suggestionData: Record<string, string>) => {
    const unified = suggestionData as unknown as UnifiedSuggestionData;
    setPessoasExtras((extras) => extras.map((extra) => (
      extra.id === id
        ? {
            ...extra,
            nome: unified.name || extra.nome,
            rgCpf: unified.doc ? formatCpfRg(unified.doc) : extra.rgCpf,
            empresa: extra.empresa || formData.empresa || unified.company || '',
          }
        : extra
    )));
  };

  const handlePessoaExtraEmpresaSelect = (id: string, suggestionData: Record<string, string>) => {
    const unified = suggestionData as unknown as UnifiedSuggestionData;
    if (unified.company) updatePessoaExtra(id, 'empresa', unified.company);
  };

  const removePessoaExtra = (id: string) => {
    setPessoasExtras((extras) => extras.filter((extra) => extra.id !== id));
  };

  const getPessoasExtrasParaSalvar = (): PessoaExtra[] => pessoasExtras
    .map((extra) => ({
      id: extra.id,
      nome: extra.nome.trim(),
      rgCpf: extra.rgCpf.trim(),
      empresa: extra.empresa.trim(),
      ...(extra.horarioSaida ? { horarioSaida: extra.horarioSaida } : {}),
    }))
    .filter((extra) => extra.nome || extra.rgCpf || extra.empresa);

  const validatePessoasExtras = (): PessoaExtra[] | null => {
    if (!supportsExtraPeople(categoria)) return [];
    const extras = getPessoasExtrasParaSalvar();
    const incompleto = extras.find((extra) => !extra.nome || !extra.rgCpf || !extra.empresa);
    if (incompleto) {
      toast.error('Preencha Nome Completo, RG/CPF e Empresa de todas as pessoas extras');
      setExtrasOpen(true);
      return null;
    }
    return extras;
  };

  const handleSaveDraft = () => {
    if (!categoria) {
      toast.error('Selecione uma categoria para salvar rascunho');
      return;
    }

    const id = (isRascunho && registroInicial) ? registroInicial.id : `draft_${Date.now()}`;
    
    let registro: any = {
      id,
      categoria,
      data: formData.data || format(new Date(), 'dd/MM/yyyy'),
      horarioEntrada: formData.horarioEntrada || format(new Date(), 'HH:mm'),
      horarioSaida: '',
      isRascunho: true,
      observacao: formData.observacao?.trim() || ''
    };

    switch (categoria) {
      case 'entregas1':
        registro = { ...registro, nome: formData.nome || '', empresa: formData.empresa || '', rgCpf: formData.rgCpf || '' };
        break;
      case 'visitantes':
      case 'prestadores':
        registro = { ...registro, nome: formData.nome || '', empresa: formData.empresa || '', nomeEmpresa: `${formData.nome || ''} / ${formData.empresa || ''}`, departamento: formData.departamento || '', rgCpf: formData.rgCpf || '' };
        break;
      case 'pesagem':
        registro = { ...registro, empresa: formData.empresa || '', placa: formData.placa || '', motorista: formData.motorista || '', pesoEntrada: Number(formData.pesoEntrada) || 0, pesoSaida: 0, porteiroEntrada: user?.nome || '' };
        break;
      case 'entregas2':
        registro = { ...registro, motorista: formData.motorista || '', cpfRg: formData.cpfRg || '', empresa: formData.empresa || '', departamento: formData.departamento || '' };
        break;
      case 'coleta':
        registro = { ...registro, rgCpf: formData.rgCpf || '', placa: formData.placa || '', empresa: formData.empresa || '', motorista: formData.motorista || '' };
        break;
      case 'movimentacao':
        registro = { ...registro, nomeColaborador: formData.nomeColaborador || '', rgCpf: formData.rgCpf || '', tipoMovimentacao: (formData.tipoMovimentacao as 'entrando' | 'saindo') || 'entrando', autorizadoPor: formData.autorizadoPor || '', porteiro: formData.porteiro || user?.nome || '' };
        break;
      case 'correspondencias':
        registro = { ...registro, destinatario: formData.destinatario || '', remetente: formData.remetente || '', tipo: formData.tipo || '', departamento: formData.departamento || '', quemRetirou: '', porteiro: formData.porteiro || user?.nome || '' };
        break;
      case 'pesagem_apara':
        registro = { ...registro, condutor: formData.condutor || '', tipoReboque: formData.tipoReboque || '', veiculo: formData.veiculo || '', pesoCarregado: Number(formData.pesoCarregado) || 0, pesoVazio: Number(formData.pesoVazio) || 0, porteiro: user?.nome || '' };
        break;
      case 'pesagem_tinta':
        registro = { ...registro, condutor: formData.condutor || '', material: formData.material || '', veiculo: formData.veiculo || '', peso: Number(formData.peso) || 0, porteiro: user?.nome || '' };
        break;
    }

    if (supportsExtraPeople(categoria)) {
      const extras = getPessoasExtrasParaSalvar();
      if (extras.length > 0) registro.pessoasExtras = extras;
    }

    if (isRascunho) {
      updateRascunhoFluxo(registro);
      toast.success('Rascunho atualizado com sucesso!');
    } else {
      addRascunhoFluxo(registro);
      toast.success('Rascunho salvo com sucesso!');
    }
    limparCampos();
    onClose();
  };

  const handleDeleteDraft = () => {
    if (isRascunho && registroInicial) {
      removeRascunhoFluxo(registroInicial.id);
      toast.success('Rascunho excluído!');
      onClose();
    }
  };

  // When user selects an autocomplete suggestion, map unified data → current category fields
  // Always preserve data and horarioEntrada (auto-filled from current date/time)
  const handleAutoSelect = (suggestionData: Record<string, string>, targetField?: string) => {
    const unified = suggestionData as unknown as UnifiedSuggestionData;
    const activeCatForAuto = categoria || categoriaInicial || 'entregas2';
    const mapped = mapToFormFields(activeCatForAuto, unified, targetField);

    setFormData((prev) => ({
      ...prev,
      ...mapped,
      // Always preserve auto date/time — never overwrite with historical values
      data: format(new Date(), 'dd/MM/yyyy'),
      horarioEntrada: format(new Date(), 'HH:mm'),
      porteiro: prev.porteiro || user?.nome || '',
    }));
    if (mapped.empresa && supportsExtraPeople(activeCatForAuto)) {
      setPessoasExtras((extras) => extras.map((extra) => (
        !extra.empresa ? { ...extra, empresa: mapped.empresa } : extra
      )));
    }
  };

  const handleEmpresaSelect = (suggestionData: Record<string, string>) => {
    const unified = suggestionData as unknown as UnifiedSuggestionData;
    if (unified.company) updateField('empresa', unified.company);
  };

  const handleReboqueSelect = (suggestionData: Record<string, string>) => {
    const valor = suggestionData.tipoReboque;
    if (valor) {
      updateField('tipoReboque', valor);
    }
  };

  const handleVeiculoSelect = (suggestionData: Record<string, string>) => {
    const unified = suggestionData as unknown as UnifiedSuggestionData;
    if (unified.plate) {
      setFormData((prev) => ({
        ...prev,
        veiculo: unified.plate,
      }));
    }
  };

  const handleMaterialSelect = (suggestionData: Record<string, string>) => {
    const material = (suggestionData as unknown as { material?: string }).material;
    if (material) {
      updateField('material', material);
    }
  };

  const handleSubmit = () => {
    if (!categoria) {
      toast.error('Selecione uma categoria obrigatória');
      return;
    }

    const checkAndCadastrarEmpresa = (nomeEmpresa?: string) => {
      if (!nomeEmpresa) return;
      const nome = nomeEmpresa.trim();
      if (!nome) return;
      const existe = empresas.some(
        (e) => e.nome.toLowerCase() === nome.toLowerCase()
      );
      if (!existe) {
        addEmpresa({ id: `emp_${Date.now()}`, nome });
        toast.success(`Empresa "${nome}" cadastrada automaticamente!`);
      }
    };

    // Salva ou atualiza a pessoa na coleção Cadastros
    const checkAndCadastrarPessoa = (
      nome: string,
      opts: { empresa?: string; departamento?: string; rgCpf?: string; tipo?: string; placa?: string }
    ) => {
      const nomeTrim = nome.trim();
      if (!nomeTrim) return;
      const existing = pessoas.find(
        (p) => p.nome.trim().toLowerCase() === nomeTrim.toLowerCase()
      );
      if (existing) {
        // Mantém um único cadastro por nome e completa os dados com o registro atual.
        const updates: Partial<typeof existing> = {};
        const empresaAtual = opts.empresa?.trim() || '';
        const documentoAtual = opts.rgCpf?.trim() || '';
        const departamentoAtual = opts.departamento?.trim() || '';
        const placaAtual = opts.placa?.trim() || '';
        if (empresaAtual && empresaAtual !== (existing.empresa || '').trim()) updates.empresa = empresaAtual;
        if (departamentoAtual && departamentoAtual !== (existing.departamento || '').trim()) updates.departamento = departamentoAtual;
        if (documentoAtual && documentoAtual !== (existing.rgCpf || '').trim()) updates.rgCpf = documentoAtual;
        if (placaAtual && placaAtual !== (existing.placa || '').trim()) updates.placa = placaAtual;
        if (existing.inativo) updates.inativo = false;
        if (Object.keys(updates).length > 0) {
          updatePessoa({ ...existing, ...updates });
        }
      } else {
        addPessoa({
          id: `pessoa_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          nome: nomeTrim,
          tipo: (opts.tipo || 'Visitante') as import('@/lib/data').TipoPessoa,
          empresa: opts.empresa?.trim() || '',
          departamento: opts.departamento?.trim() || '',
          rgCpf: opts.rgCpf?.trim() || '',
          placa: opts.placa?.trim() || '',
          cargo: '',
          telefone: '',
          email: '',
        });
      }
    };

    const extrasPersistidos = validatePessoasExtras();
    if (extrasPersistidos === null) return;

    if (formData.empresa) {
      checkAndCadastrarEmpresa(formData.empresa);
    }

    const id = `fl_${Date.now()}`;
    let registro: RegistroFluxo;

    switch (categoria) {
      case 'entregas1':
        if (!formData.nome || !formData.empresa) {
          toast.error('Preencha os campos obrigatórios');
          return;
        }
        registro = {
          id,
          categoria: 'entregas1',
          data: formData.data || format(new Date(), 'dd/MM/yyyy'),
          horarioEntrada: formData.horarioEntrada || format(new Date(), 'HH:mm'),
          nome: formData.nome,
          empresa: formData.empresa,
          rgCpf: formData.rgCpf || '',
          horarioSaida: '',
        };
        break;
      case 'visitantes':
        if (!formData.nome || !formData.empresa || !formData.departamento) {
          toast.error('Preencha os campos obrigatórios');
          return;
        }
        registro = {
          id,
          categoria: 'visitantes',
          nome: formData.nome,
          empresa: formData.empresa,
          nomeEmpresa: `${formData.nome} / ${formData.empresa}`,
          departamento: formData.departamento,
          rgCpf: formData.rgCpf || '',
          data: formData.data || format(new Date(), 'dd/MM/yyyy'),
          horarioEntrada: formData.horarioEntrada || format(new Date(), 'HH:mm'),
          horarioSaida: '',
        };
        break;
      case 'prestadores':
        if (!formData.nome || !formData.empresa || !formData.departamento) {
          toast.error('Preencha os campos obrigatórios');
          return;
        }
        registro = {
          id,
          categoria: 'prestadores',
          nome: formData.nome,
          empresa: formData.empresa,
          nomeEmpresa: `${formData.nome} / ${formData.empresa}`,
          departamento: formData.departamento,
          rgCpf: formData.rgCpf || '',
          data: formData.data || format(new Date(), 'dd/MM/yyyy'),
          horarioEntrada: formData.horarioEntrada || format(new Date(), 'HH:mm'),
          horarioSaida: '',
        };
        break;
      case 'pesagem':
        if (!formData.empresa || !formData.motorista) {
          toast.error('Preencha os campos obrigatórios');
          return;
        }
        registro = {
          id,
          categoria: 'pesagem',
          data: formData.data || format(new Date(), 'dd/MM/yyyy'),
          empresa: formData.empresa,
          placa: formData.placa || '',
          motorista: formData.motorista,
          rgCpf: formData.rgCpf || '',
          horarioEntrada: formData.horarioEntrada || format(new Date(), 'HH:mm'),
          pesoEntrada: Number(formData.pesoEntrada) || 0,
          horarioSaida: '',
          pesoSaida: 0,
          porteiroEntrada: user?.nome || '',
        };
        break;
      case 'entregas2':
        if (!formData.motorista || !formData.empresa) {
          toast.error('Preencha os campos obrigatórios');
          return;
        }
        registro = {
          id,
          categoria: 'entregas2',
          data: formData.data || format(new Date(), 'dd/MM/yyyy'),
          horarioEntrada: formData.horarioEntrada || format(new Date(), 'HH:mm'),
          motorista: formData.motorista,
          cpfRg: formData.cpfRg || '',
          empresa: formData.empresa,
          departamento: formData.departamento || '',
          placa: formData.placa || '',
          horarioSaida: '',
          ...(formData.pesoEntrada ? { pesoEntrada: Number(formData.pesoEntrada) } : {}),
        };
        break;
      case 'coleta':
        if (!formData.empresa || !formData.motorista) {
          toast.error('Preencha os campos obrigatórios');
          return;
        }
        registro = {
          id,
          categoria: 'coleta',
          rgCpf: formData.rgCpf || '',
          horarioEntrada: formData.horarioEntrada || format(new Date(), 'HH:mm'),
          placa: formData.placa || '',
          empresa: formData.empresa,
          motorista: formData.motorista,
          departamento: formData.departamento || '',
          data: formData.data || format(new Date(), 'dd/MM/yyyy'),
          horarioSaida: '',
          ...(formData.pesoEntrada ? { pesoEntrada: Number(formData.pesoEntrada) } : {}),
        };
        break;
      case 'movimentacao': {
        if (!formData.nomeColaborador) {
          toast.error('Preencha o nome do colaborador');
          return;
        }
        const tipoMov = (formData.tipoMovimentacao as 'entrando' | 'saindo') || 'entrando';
        const horaAtual = format(new Date(), 'HH:mm');
        registro = {
          id,
          categoria: 'movimentacao',
          nomeColaborador: formData.nomeColaborador,
          rgCpf: formData.rgCpf || '',
          horarioEntrada: tipoMov === 'entrando' ? horaAtual : '',
          horarioSaida: tipoMov === 'saindo' ? horaAtual : '',
          tipoMovimentacao: tipoMov,
          autorizadoPor: formData.autorizadoPor || '',
          porteiro: formData.porteiro || user?.nome || '',
          data: formData.data || format(new Date(), 'dd/MM/yyyy'),
        };
        break;
      }
      case 'correspondencias':
        if (!formData.destinatario) {
          toast.error('Preencha o destinatário');
          return;
        }
        registro = {
          id,
          categoria: 'correspondencias',
          destinatario: formData.destinatario,
          remetente: formData.remetente || '',
          tipo: formData.tipo || '',
          departamento: formData.departamento || '',
          horarioEntrada: formData.horarioEntrada || format(new Date(), 'HH:mm'),
          horarioSaida: '',
          quemRetirou: '',
          porteiro: formData.porteiro || user?.nome || '',
          data: formData.data || format(new Date(), 'dd/MM/yyyy'),
        };
        break;
      case 'pesagem_apara':
        if (!formData.condutor) {
          toast.error('Preencha o nome do condutor');
          return;
        }
        if (!formData.tipoReboque?.trim()) {
          toast.error('Preencha o tipo de reboque');
          return;
        }
        registro = {
          id,
          categoria: 'pesagem_apara',
          condutor: formData.condutor,
          tipoReboque: formData.tipoReboque || '',
          veiculo: formData.veiculo || '',
          pesoCarregado: Number(formData.pesoCarregado) || 0,
          pesoVazio: Number(formData.pesoVazio) || 0,
          data: formData.data || format(new Date(), 'dd/MM/yyyy'),
          horarioEntrada: formData.horarioEntrada || format(new Date(), 'HH:mm'),
          horarioSaida: '',
          porteiro: user?.nome || '',
        };
        break;
      case 'pesagem_tinta':
        if (!formData.condutor?.trim()) {
          toast.error('Preencha o nome do condutor');
          return;
        }
        if (!formData.material?.trim()) {
          toast.error('Preencha o material');
          return;
        }
        if (!formData.veiculo?.trim()) {
          toast.error('Preencha o veículo');
          return;
        }
        if (!formData.peso || Number(formData.peso) <= 0) {
          toast.error('Preencha o peso');
          return;
        }
        // Pesagem de tinta/solvente é registrada já concluída (aba Finalizados)
        const horarioConcluido = format(new Date(), 'HH:mm');
        registro = {
          id,
          categoria: 'pesagem_tinta',
          condutor: formData.condutor,
          material: formData.material || '',
          veiculo: formData.veiculo || '',
          peso: Number(formData.peso) || 0,
          data: formData.data || format(new Date(), 'dd/MM/yyyy'),
          horarioEntrada: formData.horarioEntrada || horarioConcluido,
          horarioSaida: horarioConcluido,
          porteiro: user?.nome || '',
        };
        break;
      default:
        return;
    }

    if (extrasPersistidos.length > 0) {
      registro.pessoasExtras = extrasPersistidos;
    }

    if (registroInicial && isRefacao) {
      registro.versaoAnteriorId = registroInicial.id;
      if (registro.detalhes) {
        registro.detalhes = registro.detalhes + ` [Versão corrigida referente ao #${registroInicial.id}]`;
      } else {
        registro.detalhes = `[Versão corrigida referente ao #${registroInicial.id}]`;
      }
      inativarRegistroFluxo(registroInicial.id, id, 'Substituído por nova versão corrigida (Refazer)');
    }

    if (formData.observacao?.trim()) {
      registro.observacao = formData.observacao.trim();
    }

    // Metadados usados exclusivamente pelo disparo seguro de notificações FCM.
    registro.criadoPorUid = user?.id || '';
    registro.criadoPor = user?.nome || '';
    registro.departamento = registro.departamento || formData.departamento || '';

    if (isRascunho && registroInicial) {
      removeRascunhoFluxo(registroInicial.id);
    }

    addRegistroFluxo(registro);

    // Auto-cadastrar pessoa na coleção Cadastros
    switch (categoria) {
      case 'entregas1':
        if (formData.nome) checkAndCadastrarPessoa(formData.nome, { empresa: formData.empresa, rgCpf: formData.rgCpf, tipo: 'Visitante' });
        break;
      case 'visitantes':
        if (formData.nome) checkAndCadastrarPessoa(formData.nome, { empresa: formData.empresa, departamento: formData.departamento, rgCpf: formData.rgCpf, tipo: 'Visitante' });
        break;
      case 'prestadores':
        if (formData.nome) checkAndCadastrarPessoa(formData.nome, { empresa: formData.empresa, departamento: formData.departamento, rgCpf: formData.rgCpf, tipo: 'Prestador' });
        break;
      case 'pesagem':
        if (formData.motorista) checkAndCadastrarPessoa(formData.motorista, { empresa: formData.empresa, rgCpf: formData.rgCpf, tipo: 'Motorista', placa: formData.placa });
        break;
      case 'entregas2':
        if (formData.motorista) checkAndCadastrarPessoa(formData.motorista, { empresa: formData.empresa, departamento: formData.departamento, rgCpf: formData.cpfRg, tipo: 'Motorista', placa: formData.placa });
        break;
      case 'coleta':
        if (formData.motorista) checkAndCadastrarPessoa(formData.motorista, { empresa: formData.empresa, rgCpf: formData.rgCpf, tipo: 'Motorista', placa: formData.placa });
        break;
      case 'movimentacao':
        if (formData.nomeColaborador) checkAndCadastrarPessoa(formData.nomeColaborador, { rgCpf: formData.rgCpf, tipo: 'Colaborador' });
        break;
      case 'correspondencias':
        if (formData.destinatario) checkAndCadastrarPessoa(formData.destinatario, { departamento: formData.departamento, tipo: 'Visitante' });
        break;
      case 'pesagem_apara':
        if (formData.condutor) checkAndCadastrarPessoa(formData.condutor, { tipo: 'Motorista', placa: formData.veiculo });
        break;
      case 'pesagem_tinta':
        if (formData.condutor) checkAndCadastrarPessoa(formData.condutor, { tipo: 'Motorista', placa: formData.veiculo });
        break;
    }

    if (extrasPersistidos.length > 0) {
      const tipoExtra = categoria === 'prestadores' ? 'Prestador' : categoria === 'pesagem' || categoria === 'entregas2' || categoria === 'coleta' ? 'Motorista' : 'Visitante';
      extrasPersistidos.forEach((extra) => checkAndCadastrarPessoa(extra.nome, {
        empresa: extra.empresa,
        rgCpf: extra.rgCpf,
        departamento: formData.departamento,
        tipo: tipoExtra,
      }));
    }

    toast.success(isRefacao ? 'Nova versão do registro salva com sucesso!' : 'Registro adicionado com sucesso!');

    if (categoria === 'coleta') {
      const mensagem = buildReleaseMessage(registro);
      setColetaMessage(mensagem);
      limparCampos();
      return; // Do not call onClose() yet, wait for user to close the message modal
    }

    limparCampos();
    onClose();
  };

  const renderPessoasExtras = () => {
    if (!supportsExtraPeople(categoria)) return null;

    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 overflow-hidden">
        <button
          type="button"
          onClick={() => setExtrasOpen((openState) => !openState)}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-emerald-500/10 transition-colors"
          aria-expanded={extrasOpen}
        >
          <span className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-400">
            <Users className="h-5 w-5" />
            Pessoas extras
            {pessoasExtras.length > 0 && (
              <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs text-white">{pessoasExtras.length}</span>
            )}
          </span>
          {extrasOpen ? <ChevronUp className="h-5 w-5 text-emerald-600" /> : <ChevronDown className="h-5 w-5 text-emerald-600" />}
        </button>

        {extrasOpen && (
          <div className="space-y-4 border-t border-emerald-500/20 p-4">
            <p className="text-sm text-muted-foreground">
              Adicione outras pessoas que entrarão no mesmo registro. Os demais campos seguem a entrada principal e ficam vinculados a este registro.
            </p>

            {pessoasExtras.map((extra, index) => (
              <div key={extra.id} className="space-y-3 rounded-lg border border-border bg-background p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm">Pessoa extra {index + 1}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removePessoaExtra(extra.id)}
                    className="h-8 w-8 border-red-500/40 text-red-600 hover:bg-red-500/10"
                    aria-label={`Remover pessoa extra ${index + 1}`}
                    title="Remover pessoa"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Nome Completo *</Label>
                  <AutocompleteInput
                    value={extra.nome}
                    onChange={(value) => updatePessoaExtra(extra.id, 'nome', value)}
                    onSelect={(suggestion) => handlePessoaExtraSelect(extra.id, suggestion.data || {})}
                    suggestions={nameSuggestions}
                    placeholder="Nome completo"
                  />
                </div>

                <div className="space-y-2">
                  <Label>RG/CPF *</Label>
                  <AutocompleteInput
                    value={extra.rgCpf}
                    onChange={(value) => updatePessoaExtra(extra.id, 'rgCpf', formatCpfRg(value))}
                    onSelect={(suggestion) => handlePessoaExtraSelect(extra.id, suggestion.data || {})}
                    suggestions={rgCpfSuggestions}
                    placeholder="00.000.000-0"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Empresa *</Label>
                  <AutocompleteInput
                    value={extra.empresa}
                    onChange={(value) => updatePessoaExtra(extra.id, 'empresa', value)}
                    onSelect={(suggestion) => handlePessoaExtraEmpresaSelect(extra.id, suggestion.data || {})}
                    suggestions={empresaSuggestions}
                    placeholder="Empresa da pessoa"
                  />
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addPessoaExtra}
              className="w-full border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400"
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar outra pessoa
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderFields = () => {
    const activeCatForFields = categoria || categoriaInicial || 'entregas2';
    const tipoMov = (formData.tipoMovimentacao as 'entrando' | 'saindo') || 'entrando';
    switch (activeCatForFields) {
      case 'entregas1':
        return (
          <>
            <div className="space-y-3">
              <Label className="text-base">Nome Completo *</Label>
              <AutocompleteInput
                value={formData.nome || ''}
                onChange={(v) => updateField('nome', v)}
                onSelect={(s) => handleAutoSelect(s.data || {})}
                suggestions={nameSuggestions}
                placeholder="Nome completo"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-base">RG/CPF</Label>
              <AutocompleteInput
                value={formData.rgCpf || ''}
                onChange={(v) => updateField('rgCpf', formatCpfRg(v))}
                onSelect={(s) => handleAutoSelect(s.data || {})}
                suggestions={rgCpfSuggestions}
                placeholder="00.000.000-0"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-base">Empresa *</Label>
              <AutocompleteInput
                value={formData.empresa || ''}
                onChange={(v) => updateField('empresa', v)}
                onSelect={(s) => handleEmpresaSelect(s.data || {})}
                suggestions={empresaSuggestions}
                placeholder="Selecione ou digite a empresa"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-base">Data</Label>
              <Input value={formData.data || ''} readOnly className="bg-muted" />
            </div>
            <div className="space-y-3">
              <Label className="text-base">Horário Entrada</Label>
              <Input value={formData.horarioEntrada || ''} readOnly className="bg-muted" />
            </div>
          </>
        );
      case 'visitantes':
        return (
          <>
            <div className="space-y-3">
              <Label className="text-base">Nome Completo *</Label>
              <AutocompleteInput
                value={formData.nome || ''}
                onChange={(v) => updateField('nome', v)}
                onSelect={(s) => handleAutoSelect(s.data || {})}
                suggestions={nameSuggestions}
                placeholder="Nome completo"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-base">RG/CPF *</Label>
              <AutocompleteInput
                value={formData.rgCpf || ''}
                onChange={(v) => updateField('rgCpf', formatCpfRg(v))}
                onSelect={(s) => handleAutoSelect(s.data || {})}
                suggestions={rgCpfSuggestions}
                placeholder="00.000.000-0"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-base">Empresa *</Label>
              <AutocompleteInput
                value={formData.empresa || ''}
                onChange={(v) => updateField('empresa', v)}
                onSelect={(s) => handleEmpresaSelect(s.data || {})}
                suggestions={empresaSuggestions}
                placeholder="Selecione ou digite a empresa"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-base">Departamento *</Label>
              <Select
                value={formData.departamento || ''}
                onValueChange={(v) => updateField('departamento', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o departamento" />
                </SelectTrigger>
                <SelectContent>
                  {[...departamentos]
                    .sort((a, b) => a.nome.localeCompare(b.nome))
                    .map((d) => (
                      <SelectItem key={d.id || d.nome} value={d.nome}>
                        {d.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label className="text-base">Data</Label>
              <Input value={formData.data || ''} readOnly className="bg-muted" />
            </div>
            <div className="space-y-3">
              <Label className="text-base">Horário Entrada</Label>
              <Input value={formData.horarioEntrada || ''} readOnly className="bg-muted" />
            </div>
          </>
        );
      case 'prestadores':
        return (
          <>
            <div className="space-y-3">
              <Label className="text-base">Nome Completo *</Label>
              <AutocompleteInput
                value={formData.nome || ''}
                onChange={(v) => updateField('nome', v)}
                onSelect={(s) => handleAutoSelect(s.data || {})}
                suggestions={nameSuggestions}
                placeholder="Nome completo"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-base">RG/CPF *</Label>
              <AutocompleteInput
                value={formData.rgCpf || ''}
                onChange={(v) => updateField('rgCpf', formatCpfRg(v))}
                onSelect={(s) => handleAutoSelect(s.data || {})}
                suggestions={rgCpfSuggestions}
                placeholder="00.000.000-0"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-base">Empresa *</Label>
              <AutocompleteInput
                value={formData.empresa || ''}
                onChange={(v) => updateField('empresa', v)}
                onSelect={(s) => handleEmpresaSelect(s.data || {})}
                suggestions={empresaSuggestions}
                placeholder="Selecione ou digite a empresa"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-base">Departamento *</Label>
              <Select
                value={formData.departamento || ''}
                onValueChange={(v) => updateField('departamento', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o departamento" />
                </SelectTrigger>
                <SelectContent>
                  {[...departamentos]
                    .sort((a, b) => a.nome.localeCompare(b.nome))
                    .map((d) => (
                      <SelectItem key={d.id || d.nome} value={d.nome}>
                        {d.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label className="text-base">Data</Label>
              <Input value={formData.data || ''} readOnly className="bg-muted" />
            </div>
            <div className="space-y-3">
              <Label className="text-base">Horário Entrada</Label>
              <Input value={formData.horarioEntrada || ''} readOnly className="bg-muted" />
            </div>
          </>
        );
      case 'pesagem':
        return (
          <>
            <div className="space-y-3">
              <Label className="text-base">Nome Completo *</Label>
              <AutocompleteInput
                value={formData.motorista || ''}
                onChange={(v) => updateField('motorista', v)}
                onSelect={(s) => handleAutoSelect(s.data || {})}
                suggestions={nameSuggestions}
                placeholder="Nome do motorista"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-base">RG/CPF</Label>
              <AutocompleteInput
                value={formData.rgCpf || ''}
                onChange={(v) => updateField('rgCpf', formatCpfRg(v))}
                onSelect={(s) => handleAutoSelect(s.data || {})}
                suggestions={rgCpfSuggestions}
                placeholder="00.000.000-0"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-base">Empresa *</Label>
              <AutocompleteInput
                value={formData.empresa || ''}
                onChange={(v) => updateField('empresa', v)}
                onSelect={(s) => handleEmpresaSelect(s.data || {})}
                suggestions={empresaSuggestions}
                placeholder="Selecione ou digite a empresa"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-base">Placa</Label>
              <AutocompleteInput
                value={formData.placa || ''}
                onChange={(v) => updateField('placa', v.toUpperCase())}
                onSelect={(s) => handleAutoSelect(s.data || {})}
                suggestions={placaSuggestions}
                placeholder="ABC-1D23"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-base">Peso de Entrada (kg)</Label>
              <Input
                type="number"
                placeholder="0"
                value={formData.pesoEntrada || ''}
                onChange={(e) => updateField('pesoEntrada', e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <Label className="text-base">Data</Label>
              <Input value={formData.data || ''} readOnly className="bg-muted" />
            </div>
            <div className="space-y-3">
              <Label className="text-base">Horário Entrada</Label>
              <Input value={formData.horarioEntrada || ''} readOnly className="bg-muted" />
            </div>
          </>
        );
      case 'entregas2':
        return (
          <>
            <div className="space-y-3">
              <Label className="text-base">Nome Completo *</Label>
              <AutocompleteInput
                value={formData.motorista || ''}
                onChange={(v) => updateField('motorista', v)}
                onSelect={(s) => handleAutoSelect(s.data || {})}
                suggestions={nameSuggestions}
                placeholder="Nome do motorista"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-base">RG/CPF</Label>
              <AutocompleteInput
                value={formData.cpfRg || ''}
                onChange={(v) => updateField('cpfRg', formatCpfRg(v))}
                onSelect={(s) => handleAutoSelect(s.data || {})}
                suggestions={rgCpfSuggestions}
                placeholder="00.000.000-0"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-base">Empresa *</Label>
              <AutocompleteInput
                value={formData.empresa || ''}
                onChange={(v) => updateField('empresa', v)}
                onSelect={(s) => handleEmpresaSelect(s.data || {})}
                suggestions={empresaSuggestions}
                placeholder="Selecione ou digite a empresa"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-base">Departamento</Label>
              <Select
                value={formData.departamento || ''}
                onValueChange={(v) => updateField('departamento', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o departamento" />
                </SelectTrigger>
                <SelectContent>
                  {[...departamentos]
                    .sort((a, b) => a.nome.localeCompare(b.nome))
                    .map((d) => (
                      <SelectItem key={d.id || d.nome} value={d.nome}>
                        {d.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label className="text-base">Placa</Label>
              <AutocompleteInput
                value={formData.placa || ''}
                onChange={(v) => updateField('placa', v.toUpperCase())}
                onSelect={(s) => handleAutoSelect(s.data || {})}
                suggestions={placaSuggestions}
                placeholder="ABC-1D23"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-base">Peso de Entrada (kg) <span className="text-muted-foreground font-normal">(opcional)</span></Label>
              <Input
                type="number"
                placeholder="Ex: 12500"
                value={formData.pesoEntrada || ''}
                onChange={(e) => updateField('pesoEntrada', e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <Label className="text-base">Data</Label>
              <Input value={formData.data || ''} readOnly className="bg-muted" />
            </div>
            <div className="space-y-3">
              <Label className="text-base">Horário Entrada</Label>
              <Input value={formData.horarioEntrada || ''} readOnly className="bg-muted" />
            </div>
          </>
        );
      case 'coleta':
        return (
          <>
            <div className="space-y-3">
              <Label className="text-base">Nome Completo *</Label>
              <AutocompleteInput
                value={formData.motorista || ''}
                onChange={(v) => updateField('motorista', v)}
                onSelect={(s) => handleAutoSelect(s.data || {})}
                suggestions={nameSuggestions}
                placeholder="Nome do motorista"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-base">RG/CPF</Label>
              <AutocompleteInput
                value={formData.rgCpf || ''}
                onChange={(v) => updateField('rgCpf', formatCpfRg(v))}
                onSelect={(s) => handleAutoSelect(s.data || {})}
                suggestions={rgCpfSuggestions}
                placeholder="00.000.000-0"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-base">Empresa *</Label>
              <AutocompleteInput
                value={formData.empresa || ''}
                onChange={(v) => updateField('empresa', v)}
                onSelect={(s) => handleEmpresaSelect(s.data || {})}
                suggestions={empresaSuggestions}
                placeholder="Selecione ou digite a empresa"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-base">Departamento</Label>
              <Select
                value={formData.departamento || ''}
                onValueChange={(v) => updateField('departamento', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o departamento" />
                </SelectTrigger>
                <SelectContent>
                  {[...departamentos]
                    .sort((a, b) => a.nome.localeCompare(b.nome))
                    .map((d) => (
                      <SelectItem key={d.id || d.nome} value={d.nome}>
                        {d.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label className="text-base">Placa</Label>
              <AutocompleteInput
                value={formData.placa || ''}
                onChange={(v) => updateField('placa', v.toUpperCase())}
                onSelect={(s) => handleAutoSelect(s.data || {})}
                suggestions={placaSuggestions}
                placeholder="ABC-1D23"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-base">Peso de Entrada (kg) <span className="text-muted-foreground font-normal">(opcional)</span></Label>
              <Input
                type="number"
                placeholder="Ex: 12500"
                value={formData.pesoEntrada || ''}
                onChange={(e) => updateField('pesoEntrada', e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <Label className="text-base">Data</Label>
              <Input value={formData.data || ''} readOnly className="bg-muted" />
            </div>
            <div className="space-y-3">
              <Label className="text-base">Horário Entrada</Label>
              <Input value={formData.horarioEntrada || ''} readOnly className="bg-muted" />
            </div>
          </>
        );
      case 'movimentacao':
        return (
          <>
            <div className="space-y-3">
              <Label className="text-base">Nome do Colaborador *</Label>
              <AutocompleteInput
                value={formData.nomeColaborador || ''}
                onChange={(v) => updateField('nomeColaborador', v)}
                onSelect={(s) => handleAutoSelect(s.data || {})}
                suggestions={nameSuggestions}
                placeholder="Nome completo do colaborador"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-base">RG/CPF</Label>
              <AutocompleteInput
                value={formData.rgCpf || ''}
                onChange={(v) => updateField('rgCpf', formatCpfRg(v))}
                onSelect={(s) => handleAutoSelect(s.data || {})}
                suggestions={rgCpfSuggestions}
                placeholder="00.000.000-0"
              />
            </div>
            {/* Checkbox Entrando / Saindo */}
            <div className="space-y-3">
              <Label className="text-base">Movimentação *</Label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => updateField('tipoMovimentacao', 'entrando')}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg border-2 py-2.5 text-sm font-semibold transition-colors ${
                    tipoMov === 'entrando'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                      : 'border-border bg-background text-muted-foreground hover:border-emerald-500/50'
                  }`}
                >
                  <span className="text-base">→</span>
                  Entrando
                </button>
                <button
                  type="button"
                  onClick={() => updateField('tipoMovimentacao', 'saindo')}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg border-2 py-2.5 text-sm font-semibold transition-colors ${
                    tipoMov === 'saindo'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400'
                      : 'border-border bg-background text-muted-foreground hover:border-amber-500/50'
                  }`}
                >
                  <span className="text-base">←</span>
                  Saindo
                </button>
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-base">{tipoMov === 'saindo' ? 'Horário Saída' : 'Horário Entrada'}</Label>
              <Input value={formData.horarioEntrada || ''} readOnly className="bg-muted" />
            </div>
            <div className="space-y-3">
              <Label className="text-base">Autorizado Por</Label>
              <AutocompleteInput
                value={formData.autorizadoPor || ''}
                onChange={(v) => updateField('autorizadoPor', v)}
                onSelect={(s) => handleAutoSelect(s.data || {}, 'autorizadoPor')}
                suggestions={nameSuggestions}
                placeholder="Nome de quem autorizou"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-base">Porteiro</Label>
              <Input
                value={formData.porteiro || user?.nome || ''}
                readOnly
                className="bg-muted"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-base">Data</Label>
              <Input value={formData.data || ''} readOnly className="bg-muted" />
            </div>
          </>
        );
      case 'correspondencias':
        return (
          <>
            <div className="space-y-3">
              <Label className="text-base">Destinatário *</Label>
              <AutocompleteInput
                value={formData.destinatario || ''}
                onChange={(v) => updateField('destinatario', v)}
                onSelect={(s) => handleAutoSelect(s.data || {})}
                suggestions={nameSuggestions}
                placeholder="Nome de quem vai receber"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-base">Remetente</Label>
              <AutocompleteInput
                value={formData.remetente || ''}
                onChange={(v) => updateField('remetente', v)}
                onSelect={(s) => handleAutoSelect(s.data || {})}
                suggestions={empresaSuggestions}
                placeholder="Quem enviou a correspondência"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-base">Tipo</Label>
              <Select
                value={formData.tipo || ''}
                onValueChange={(v) => updateField('tipo', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Carta">Carta</SelectItem>
                  <SelectItem value="Pacote">Pacote</SelectItem>
                  <SelectItem value="Encomenda">Encomenda</SelectItem>
                  <SelectItem value="Documento">Documento</SelectItem>
                  <SelectItem value="Revista">Revista</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label className="text-base">Departamento</Label>
              <Select
                value={formData.departamento || ''}
                onValueChange={(v) => updateField('departamento', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o departamento" />
                </SelectTrigger>
                <SelectContent>
                  {[...departamentos]
                    .sort((a, b) => a.nome.localeCompare(b.nome))
                    .map((d) => (
                      <SelectItem key={d.id || d.nome} value={d.nome}>
                        {d.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label className="text-base">Horário Entrada</Label>
              <Input value={formData.horarioEntrada || ''} readOnly className="bg-muted" />
            </div>
            <div className="space-y-3">
              <Label className="text-base">Porteiro</Label>
              <Input
                value={formData.porteiro || user?.nome || ''}
                readOnly
                className="bg-muted"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-base">Data</Label>
              <Input value={formData.data || ''} readOnly className="bg-muted" />
            </div>
          </>
        );
      case 'pesagem_apara':
        return (
          <>
            <div className="space-y-3">
              <Label className="text-base">Condutor *</Label>
              <AutocompleteInput
                value={formData.condutor || ''}
                onChange={(v) => updateField('condutor', v)}
                onSelect={(s) => handleAutoSelect(s.data || {})}
                suggestions={nameSuggestions}
                placeholder="Nome do condutor"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-base">Tipo de Reboque *</Label>
              <AutocompleteInput
                value={formData.tipoReboque || ''}
                onChange={(v) => updateField('tipoReboque', v.toUpperCase())}
                onSelect={(s) => handleReboqueSelect(s.data || {})}
                suggestions={reboqueSuggestions}
                placeholder="Ex: BAÚ, PRANCHA, GAIOLA"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-base">Veículo</Label>
              <AutocompleteInput
                value={formData.veiculo || ''}
                onChange={(v) => updateField('veiculo', v.toUpperCase())}
                onSelect={(s) => handleVeiculoSelect(s.data || {})}
                suggestions={placaSuggestions}
                placeholder="Tipo de veículo"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-base">Peso Carregado (kg)</Label>
              <Input
                type="number"
                placeholder="0"
                value={formData.pesoCarregado || ''}
                onChange={(e) => updateField('pesoCarregado', e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <Label className="text-base">Peso Vazio (kg)</Label>
              <Input
                type="number"
                placeholder="0"
                value={formData.pesoVazio || ''}
                onChange={(e) => updateField('pesoVazio', e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <Label className="text-base">Data</Label>
              <Input value={formData.data || ''} readOnly className="bg-muted" />
            </div>
            <div className="space-y-3">
              <Label className="text-base">Horário Entrada</Label>
              <Input value={formData.horarioEntrada || ''} readOnly className="bg-muted" />
            </div>
          </>
        );
      case 'pesagem_tinta':
        return (
          <>
            <div className="space-y-3">
              <Label className="text-base">Condutor *</Label>
              <AutocompleteInput
                value={formData.condutor || ''}
                onChange={(v) => updateField('condutor', v)}
                onSelect={(s) => handleAutoSelect(s.data || {})}
                suggestions={nameSuggestions}
                placeholder="Nome do condutor"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-base">Material *</Label>
              <AutocompleteInput
                value={formData.material || ''}
                onChange={(v) => updateField('material', v.toUpperCase())}
                onSelect={(s) => handleMaterialSelect(s.data || {})}
                suggestions={materialSuggestions}
                placeholder="Ex: TINTA, SOLVENTE"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-base">Veículo *</Label>
              <AutocompleteInput
                value={formData.veiculo || ''}
                onChange={(v) => updateField('veiculo', v.toUpperCase())}
                onSelect={(s) => handleVeiculoSelect(s.data || {})}
                suggestions={placaSuggestions}
                placeholder="Tipo de veículo"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-base">Peso (kg) *</Label>
              <Input
                type="number"
                placeholder="0"
                value={formData.peso || ''}
                onChange={(e) => updateField('peso', e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <Label className="text-base">Data</Label>
              <Input value={formData.data || ''} readOnly className="bg-muted" />
            </div>
            <div className="space-y-3">
              <Label className="text-base">Horário</Label>
              <Input value={formData.horarioEntrada || ''} readOnly className="bg-muted" />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <>
    <Dialog open={open && !coletaMessage} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {isRascunho ? (
              <AlertTriangle className="h-6 w-6 text-red-500" />
            ) : isRefacao ? (
              <AlertTriangle className="h-6 w-6 text-amber-500" />
            ) : null}
            {isRascunho ? 'Modificar Rascunho' : isRefacao ? 'Refazer Registro (Corrigir Versão)' : 'Novo Registro'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {isRefacao && (
            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-base rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold uppercase tracking-wider text-sm">Modo de Refação Auditável</p>
                <p>Altere as informações necessárias abaixo e salve para criar uma nova versão corrigida do registro original.</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-3">
                <Label className="flex items-center gap-1 text-base">
                  Tipo de Registro <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={categoria}
                  onValueChange={handleCategoriaChange}
                  disabled={isRefacao}
                >
                  <SelectTrigger className={!categoria ? 'text-muted-foreground border-amber-500/50 focus:ring-amber-500' : ''}>
                    <SelectValue placeholder="Selecione o tipo de registro" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS_FLUXO.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {(() => {
                let cpf = '';
                if (formData.rgCpf) cpf = formData.rgCpf;
                else if (formData.cpfRg) cpf = formData.cpfRg;
                
                const { isRecorrente, pessoa } = verificarRecorrencia(cpf);
                
                if (!isRecorrente || !pessoa) return null;
                
                if (pessoa.ticket) {
                  return (
                    <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/30 rounded-lg px-4 py-2.5">
                      <Ticket className="h-5 w-5 text-emerald-600" />
                      <span className="text-base font-semibold text-emerald-700 dark:text-emerald-400">{pessoa.ticket}</span>
                    </div>
                  );
                }
                
                return (
                  <Button
                    onClick={handleCriarTicket}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-base"
                  >
                    <Ticket className="h-5 w-5 mr-2" />
                    Criar Ticket
                  </Button>
                );
              })()}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">{renderFields()}</div>

          {renderPessoasExtras()}

          {categoria && (
            <div className="space-y-3 pt-2 border-t border-border/50">
              <Label className="text-base">Observação <span className="text-muted-foreground font-normal">(Opcional)</span></Label>
              <Textarea
                placeholder="Anotações ou observações adicionais sobre o registro..."
                value={formData.observacao || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, observacao: e.target.value }))}
                rows={3}
                className="resize-none text-base"
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 flex-wrap justify-between sm:justify-end w-full pt-4">
          {isRascunho ? (
            <Button variant="destructive" onClick={handleDeleteDraft} className="w-full sm:w-auto mb-2 sm:mb-0 sm:mr-auto text-base">
              Excluir Rascunho
            </Button>
          ) : (
            <Button variant="secondary" onClick={handleSaveDraft} className="w-full sm:w-auto mb-2 sm:mb-0 sm:mr-auto text-base">
              Salvar Rascunho
            </Button>
          )}

          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none text-base">
              Cancelar
            </Button>
            {isRascunho && (
              <Button onClick={handleSaveDraft} variant="outline" className="flex-1 sm:flex-none border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 text-base">
                Atualizar Rascunho
              </Button>
            )}
            <Button onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-700 flex-1 sm:flex-none text-base">
              Salvar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={!!coletaMessage} onOpenChange={(v) => {
      if (!v) {
        setColetaMessage(null);
        onClose();
      }
    }}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm bg-background rounded-lg border shadow-lg p-4"
        >
          <DialogTitle className="text-base font-medium mb-3">Mensagem de Liberação</DialogTitle>
          <div className="bg-muted p-2 rounded text-base text-foreground select-all">
            {coletaMessage}
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-base flex-1"
              onClick={() => {
                setColetaMessage(null);
                onClose();
              }}
            >
              Fechar
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-base flex-1"
              onClick={() => {
                if (coletaMessage) {
                  navigator.clipboard.writeText(coletaMessage)
                    .then(() => toast.success('Mensagem copiada!'))
                    .catch(() => toast.error('Erro ao copiar. Selecione o texto e copie manualmente.'));
                }
                setColetaMessage(null);
                onClose();
              }}
            >
              Copiar
            </Button>
          </div>
          <DialogPrimitive.Close className="absolute top-3 right-3 rounded-full p-1 opacity-70 hover:opacity-100 hover:bg-muted">
            <X className="h-4 w-4" />
            <span className="sr-only">Fechar</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>

    <Dialog open={ticketModalOpen} onOpenChange={(v) => {
      if (!v) {
        setTicketModalOpen(false);
        setTicketGerado(null);
      }
    }}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className="data-[state=open]:animate-none data-[state=closed]:animate-none fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm bg-background rounded-lg border shadow-lg p-4"
        >
          <DialogTitle className="flex items-center gap-2 text-base font-medium mb-3">
            <Ticket className="h-5 w-5 text-amber-500" />
            Ticket Gerado com Sucesso!
          </DialogTitle>
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-500/30 p-3 rounded-lg text-center">
            <p className="text-base text-muted-foreground mb-1">Guarde este código para visitas futuras</p>
            <p className="text-2xl font-bold tracking-wider text-amber-700 dark:text-amber-400 select-all">{ticketGerado}</p>
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs flex-1"
              onClick={() => {
                setTicketModalOpen(false);
                setTicketGerado(null);
              }}
            >
              Fechar
            </Button>
            <Button
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs flex-1"
              onClick={() => {
                if (ticketGerado) {
                  navigator.clipboard.writeText(ticketGerado)
                    .then(() => toast.success('Ticket copiado!'))
                    .catch(() => toast.error('Erro ao copiar. Selecione o texto e copie manualmente.'));
                }
                setTicketModalOpen(false);
                setTicketGerado(null);
              }}
            >
              Copiar Ticket
            </Button>
          </div>
          <DialogPrimitive.Close className="absolute top-3 right-3 rounded-full p-1 opacity-70 hover:opacity-100 hover:bg-muted">
            <X className="h-4 w-4" />
            <span className="sr-only">Fechar</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
    </>
  );
}
