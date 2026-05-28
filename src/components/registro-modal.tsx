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
import { X, Ticket } from 'lucide-react';
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
} from '@/lib/data';
import AutocompleteInput, { type AutocompleteSuggestion } from './autocomplete-input';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import { formatCpfRg } from '@/lib/utils';

// Unified data structure for autocomplete — stores ALL available info
// regardless of which category it came from
export interface UnifiedSuggestionData {
  name: string;       // person's name
  company: string;    // company name
  doc: string;        // RG/CPF
  plate: string;      // vehicle plate
  department: string; // department
  origin?: string;    // source origin ('cadastro')
}

// Maps unified data → form fields for each category
export function mapToFormFields(categoria: CategoriaFluxo | '', data: UnifiedSuggestionData): Record<string, string> {
  const mapped: Record<string, string> = {};

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
      if (data.department) mapped.autorizadoPor = data.department;
      break;
    case 'correspondencias':
      if (data.name) mapped.destinatario = data.name;
      if (data.company) mapped.remetente = data.company;
      if (data.department) mapped.departamento = data.department;
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
      data.department = r.departamento;
      break;
    case 'coleta':
      data.doc = r.rgCpf;
      data.plate = r.placa;
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
    });
    if (!categoriaInicial) {
      setCategoria('');
    }
  };

  useEffect(() => {
    if (open) {
      if (prefilledFormData) {
        setFormData(prefilledFormData);
        setCategoria(categoriaInicial);
      } else if (registroInicial && (isRefacao || isRascunho)) {
        setCategoria(registroInicial.categoria);
        const { id: _i, inativo: _in, versaoAnteriorId: _v, dataInativacao: _di, motivoRefacao: _m, ...rest } = registroInicial as any;
        setFormData({ ...rest });
      } else {
        setFormData({
          data: format(new Date(), 'dd/MM/yyyy'),
          horarioEntrada: format(new Date(), 'HH:mm'),
          porteiro: user?.nome || '',
        });
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
      }
      
      return novoFormData;
    });
    
    setCategoria(novaCategoria);
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
  const handleAutoSelect = (suggestionData: Record<string, string>) => {
    const unified = suggestionData as unknown as UnifiedSuggestionData;
    const activeCatForAuto = categoria || categoriaInicial || 'entregas2';
    const mapped = mapToFormFields(activeCatForAuto, unified);

    setFormData((prev) => ({
      ...prev,
      ...mapped,
      // Always preserve auto date/time — never overwrite with historical values
      data: format(new Date(), 'dd/MM/yyyy'),
      horarioEntrada: format(new Date(), 'HH:mm'),
      porteiro: prev.porteiro || user?.nome || '',
    }));
  };

  const handleEmpresaSelect = (suggestionData: Record<string, string>) => {
    const unified = suggestionData as unknown as UnifiedSuggestionData;
    if (unified.company) {
      setFormData((prev) => ({
        ...prev,
        empresa: unified.company,
      }));
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
      opts: { empresa?: string; departamento?: string; rgCpf?: string; tipo?: string }
    ) => {
      const nomeTrim = nome.trim();
      if (!nomeTrim) return;
      const existing = pessoas.find(
        (p) => p.nome.toLowerCase() === nomeTrim.toLowerCase() && !p.inativo
      );
      if (existing) {
        // Atualiza campos se vierem preenchidos e ainda não estiverem salvos
        const updates: Partial<typeof existing> = {};
        if (opts.empresa && !existing.empresa) updates.empresa = opts.empresa.trim();
        if (opts.departamento && !existing.departamento) updates.departamento = opts.departamento.trim();
        if (opts.rgCpf && !existing.rgCpf) updates.rgCpf = opts.rgCpf.trim();
        if (Object.keys(updates).length > 0) {
          updatePessoa({ ...existing, ...updates });
        }
      } else {
        addPessoa({
          id: `pessoa_${Date.now()}`,
          nome: nomeTrim,
          tipo: (opts.tipo || 'Visitante') as import('@/lib/data').TipoPessoa,
          empresa: opts.empresa?.trim() || '',
          departamento: opts.departamento?.trim() || '',
          rgCpf: opts.rgCpf?.trim() || '',
          placa: '',
          cargo: '',
          telefone: '',
          email: '',
        });
      }
    };

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
      default:
        return;
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
        if (formData.motorista) checkAndCadastrarPessoa(formData.motorista, { empresa: formData.empresa, tipo: 'Motorista' });
        break;
      case 'entregas2':
        if (formData.motorista) checkAndCadastrarPessoa(formData.motorista, { empresa: formData.empresa, departamento: formData.departamento, rgCpf: formData.cpfRg, tipo: 'Motorista' });
        break;
      case 'coleta':
        if (formData.motorista) checkAndCadastrarPessoa(formData.motorista, { empresa: formData.empresa, rgCpf: formData.rgCpf, tipo: 'Motorista' });
        break;
      case 'movimentacao':
        if (formData.nomeColaborador) checkAndCadastrarPessoa(formData.nomeColaborador, { rgCpf: formData.rgCpf, tipo: 'Colaborador' });
        break;
      case 'correspondencias':
        if (formData.destinatario) checkAndCadastrarPessoa(formData.destinatario, { departamento: formData.departamento, tipo: 'Visitante' });
        break;
    }

    toast.success(isRefacao ? 'Nova versão do registro salva com sucesso!' : 'Registro adicionado com sucesso!');

    if (categoria === 'coleta') {
      let docLabel = 'RG/CPF';
      let docValue = formData.rgCpf || '-';
      
      if (formData.rgCpf) {
        const digits = formData.rgCpf.replace(/\D/g, '');
        if (digits.length === 11) {
          docLabel = 'CPF';
          docValue = digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        } else if (digits.length > 0) {
          docLabel = 'RG';
          docValue = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        }
      }
      
      const mensagem = `O Sr. ${formData.motorista || ''}, ${docLabel} ${docValue}, está aqui pela empresa ${formData.empresa || ''} para retirar a coleta. Podemos liberar?`;
      
      setColetaMessage(mensagem);
      limparCampos();
      return; // Do not call onClose() yet, wait for user to close the message modal
    }

    limparCampos();
    onClose();
  };

  const renderFields = () => {
    const activeCatForFields = categoria || categoriaInicial || 'entregas2';
    const tipoMov = (formData.tipoMovimentacao as 'entrando' | 'saindo') || 'entrando';
    switch (activeCatForFields) {
      case 'entregas1':
        return (
          <>
            <div className="space-y-2">
              <Label>Nome *</Label>
              <AutocompleteInput
                value={formData.nome || ''}
                onChange={(v) => updateField('nome', v)}
                onSelect={(s) => handleAutoSelect(s.data || {})}
                suggestions={nameSuggestions}
                placeholder="Nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label>RG/CPF</Label>
              <AutocompleteInput
                value={formData.rgCpf || ''}
                onChange={(v) => updateField('rgCpf', formatCpfRg(v))}
                onSelect={(s) => handleAutoSelect(s.data || {})}
                suggestions={rgCpfSuggestions}
                placeholder="00.000.000-0"
              />
            </div>
            <div className="space-y-2">
              <Label>Empresa *</Label>
              <AutocompleteInput
                value={formData.empresa || ''}
                onChange={(v) => updateField('empresa', v)}
                onSelect={(s) => handleEmpresaSelect(s.data || {})}
                suggestions={empresaSuggestions}
                placeholder="Selecione ou digite a empresa"
              />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input value={formData.data || ''} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Horário Entrada</Label>
              <Input value={formData.horarioEntrada || ''} readOnly className="bg-muted" />
            </div>
          </>
        );
      case 'visitantes':
        return (
          <>
            <div className="space-y-2">
              <Label>Nome *</Label>
              <AutocompleteInput
                value={formData.nome || ''}
                onChange={(v) => updateField('nome', v)}
                onSelect={(s) => handleAutoSelect(s.data || {})}
                suggestions={nameSuggestions}
                placeholder="Nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label>RG/CPF *</Label>
              <AutocompleteInput
                value={formData.rgCpf || ''}
                onChange={(v) => updateField('rgCpf', formatCpfRg(v))}
                onSelect={(s) => handleAutoSelect(s.data || {})}
                suggestions={rgCpfSuggestions}
                placeholder="00.000.000-0"
              />
            </div>
            <div className="space-y-2">
              <Label>Empresa *</Label>
              <AutocompleteInput
                value={formData.empresa || ''}
                onChange={(v) => updateField('empresa', v)}
                onSelect={(s) => handleEmpresaSelect(s.data || {})}
                suggestions={empresaSuggestions}
                placeholder="Selecione ou digite a empresa"
              />
            </div>
            <div className="space-y-2">
              <Label>Departamento *</Label>
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
            <div className="space-y-2">
              <Label>Data</Label>
              <Input value={formData.data || ''} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Horário Entrada</Label>
              <Input value={formData.horarioEntrada || ''} readOnly className="bg-muted" />
            </div>
          </>
        );
      case 'prestadores':
        return (
          <>
            <div className="space-y-2">
              <Label>Nome *</Label>
              <AutocompleteInput
                value={formData.nome || ''}
                onChange={(v) => updateField('nome', v)}
                onSelect={(s) => handleAutoSelect(s.data || {})}
                suggestions={nameSuggestions}
                placeholder="Nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label>RG/CPF *</Label>
              <AutocompleteInput
                value={formData.rgCpf || ''}
                onChange={(v) => updateField('rgCpf', formatCpfRg(v))}
                onSelect={(s) => handleAutoSelect(s.data || {})}
                suggestions={rgCpfSuggestions}
                placeholder="00.000.000-0"
              />
            </div>
            <div className="space-y-2">
              <Label>Empresa *</Label>
              <AutocompleteInput
                value={formData.empresa || ''}
                onChange={(v) => updateField('empresa', v)}
                onSelect={(s) => handleEmpresaSelect(s.data || {})}
                suggestions={empresaSuggestions}
                placeholder="Selecione ou digite a empresa"
              />
            </div>
            <div className="space-y-2">
              <Label>Departamento *</Label>
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
            <div className="space-y-2">
              <Label>Data</Label>
              <Input value={formData.data || ''} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Horário Entrada</Label>
              <Input value={formData.horarioEntrada || ''} readOnly className="bg-muted" />
            </div>
          </>
        );
      case 'pesagem':
        return (
          <>
            <div className="space-y-2">
              <Label>Nome do Motorista *</Label>
              <AutocompleteInput
                value={formData.motorista || ''}
                onChange={(v) => updateField('motorista', v)}
                onSelect={(s) => handleAutoSelect(s.data || {})}
                suggestions={nameSuggestions}
                placeholder="Nome do motorista"
              />
            </div>
            <div className="space-y-2">
              <Label>RG/CPF</Label>
              <AutocompleteInput
                value={formData.rgCpf || ''}
                onChange={(v) => updateField('rgCpf', formatCpfRg(v))}
                onSelect={(s) => handleAutoSelect(s.data || {})}
                suggestions={rgCpfSuggestions}
                placeholder="00.000.000-0"
              />
            </div>
            <div className="space-y-2">
              <Label>Empresa *</Label>
              <AutocompleteInput
                value={formData.empresa || ''}
                onChange={(v) => updateField('empresa', v)}
                onSelect={(s) => handleEmpresaSelect(s.data || {})}
                suggestions={empresaSuggestions}
                placeholder="Selecione ou digite a empresa"
              />
            </div>
            <div className="space-y-2">
              <Label>Placa</Label>
              <AutocompleteInput
                value={formData.placa || ''}
                onChange={(v) => updateField('placa', v.toUpperCase())}
                onSelect={(s) => handleAutoSelect(s.data || {})}
                suggestions={placaSuggestions}
                placeholder="ABC-1D23"
              />
            </div>
            <div className="space-y-2">
              <Label>Peso de Entrada (kg)</Label>
              <Input
                type="number"
                placeholder="0"
                value={formData.pesoEntrada || ''}
                onChange={(e) => updateField('pesoEntrada', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input value={formData.data || ''} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Horário Entrada</Label>
              <Input value={formData.horarioEntrada || ''} readOnly className="bg-muted" />
            </div>
          </>
        );
      case 'entregas2':
        return (
          <>
            <div className="space-y-2">
              <Label>Nome do Motorista *</Label>
              <AutocompleteInput
                value={formData.motorista || ''}
                onChange={(v) => updateField('motorista', v)}
                onSelect={(s) => handleAutoSelect(s.data || {})}
                suggestions={nameSuggestions}
                placeholder="Nome do motorista"
              />
            </div>
            <div className="space-y-2">
              <Label>RG/CPF</Label>
              <AutocompleteInput
                value={formData.cpfRg || ''}
                onChange={(v) => updateField('cpfRg', formatCpfRg(v))}
                onSelect={(s) => handleAutoSelect(s.data || {})}
                suggestions={rgCpfSuggestions}
                placeholder="00.000.000-0"
              />
            </div>
            <div className="space-y-2">
              <Label>Empresa *</Label>
              <AutocompleteInput
                value={formData.empresa || ''}
                onChange={(v) => updateField('empresa', v)}
                onSelect={(s) => handleEmpresaSelect(s.data || {})}
                suggestions={empresaSuggestions}
                placeholder="Selecione ou digite a empresa"
              />
            </div>
            <div className="space-y-2">
              <Label>Departamento</Label>
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
            <div className="space-y-2">
              <Label>Placa</Label>
              <AutocompleteInput
                value={formData.placa || ''}
                onChange={(v) => updateField('placa', v.toUpperCase())}
                onSelect={(s) => handleAutoSelect(s.data || {})}
                suggestions={placaSuggestions}
                placeholder="ABC-1D23"
              />
            </div>
            <div className="space-y-2">
              <Label>Peso de Entrada (kg) <span className="text-muted-foreground font-normal">(opcional)</span></Label>
              <Input
                type="number"
                placeholder="Ex: 12500"
                value={formData.pesoEntrada || ''}
                onChange={(e) => updateField('pesoEntrada', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input value={formData.data || ''} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Horário Entrada</Label>
              <Input value={formData.horarioEntrada || ''} readOnly className="bg-muted" />
            </div>
          </>
        );
      case 'coleta':
        return (
          <>
            <div className="space-y-2">
              <Label>Nome do Motorista *</Label>
              <AutocompleteInput
                value={formData.motorista || ''}
                onChange={(v) => updateField('motorista', v)}
                onSelect={(s) => handleAutoSelect(s.data || {})}
                suggestions={nameSuggestions}
                placeholder="Nome do motorista"
              />
            </div>
            <div className="space-y-2">
              <Label>RG/CPF</Label>
              <AutocompleteInput
                value={formData.rgCpf || ''}
                onChange={(v) => updateField('rgCpf', formatCpfRg(v))}
                onSelect={(s) => handleAutoSelect(s.data || {})}
                suggestions={rgCpfSuggestions}
                placeholder="00.000.000-0"
              />
            </div>
            <div className="space-y-2">
              <Label>Empresa *</Label>
              <AutocompleteInput
                value={formData.empresa || ''}
                onChange={(v) => updateField('empresa', v)}
                onSelect={(s) => handleEmpresaSelect(s.data || {})}
                suggestions={empresaSuggestions}
                placeholder="Selecione ou digite a empresa"
              />
            </div>
            <div className="space-y-2">
              <Label>Placa</Label>
              <AutocompleteInput
                value={formData.placa || ''}
                onChange={(v) => updateField('placa', v.toUpperCase())}
                onSelect={(s) => handleAutoSelect(s.data || {})}
                suggestions={placaSuggestions}
                placeholder="ABC-1D23"
              />
            </div>
            <div className="space-y-2">
              <Label>Peso de Entrada (kg) <span className="text-muted-foreground font-normal">(opcional)</span></Label>
              <Input
                type="number"
                placeholder="Ex: 12500"
                value={formData.pesoEntrada || ''}
                onChange={(e) => updateField('pesoEntrada', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input value={formData.data || ''} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Horário Entrada</Label>
              <Input value={formData.horarioEntrada || ''} readOnly className="bg-muted" />
            </div>
          </>
        );
      case 'movimentacao':
        return (
          <>
            <div className="space-y-2">
              <Label>Nome do Colaborador *</Label>
              <AutocompleteInput
                value={formData.nomeColaborador || ''}
                onChange={(v) => updateField('nomeColaborador', v)}
                onSelect={(s) => handleAutoSelect(s.data || {})}
                suggestions={nameSuggestions}
                placeholder="Nome completo do colaborador"
              />
            </div>
            <div className="space-y-2">
              <Label>RG/CPF</Label>
              <AutocompleteInput
                value={formData.rgCpf || ''}
                onChange={(v) => updateField('rgCpf', formatCpfRg(v))}
                onSelect={(s) => handleAutoSelect(s.data || {})}
                suggestions={rgCpfSuggestions}
                placeholder="00.000.000-0"
              />
            </div>
            {/* Checkbox Entrando / Saindo */}
            <div className="space-y-2">
              <Label>Movimentação *</Label>
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
            <div className="space-y-2">
              <Label>{tipoMov === 'saindo' ? 'Horário Saída' : 'Horário Entrada'}</Label>
              <Input value={formData.horarioEntrada || ''} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Autorizado Por</Label>
              <AutocompleteInput
                value={formData.autorizadoPor || ''}
                onChange={(v) => updateField('autorizadoPor', v)}
                onSelect={(s) => handleAutoSelect(s.data || {})}
                suggestions={nameSuggestions}
                placeholder="Nome de quem autorizou"
              />
            </div>
            <div className="space-y-2">
              <Label>Porteiro</Label>
              <Input
                value={formData.porteiro || user?.nome || ''}
                readOnly
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input value={formData.data || ''} readOnly className="bg-muted" />
            </div>
          </>
        );
      case 'correspondencias':
        return (
          <>
            <div className="space-y-2">
              <Label>Destinatário *</Label>
              <AutocompleteInput
                value={formData.destinatario || ''}
                onChange={(v) => updateField('destinatario', v)}
                onSelect={(s) => handleAutoSelect(s.data || {})}
                suggestions={nameSuggestions}
                placeholder="Nome de quem vai receber"
              />
            </div>
            <div className="space-y-2">
              <Label>Remetente</Label>
              <AutocompleteInput
                value={formData.remetente || ''}
                onChange={(v) => updateField('remetente', v)}
                onSelect={(s) => handleAutoSelect(s.data || {})}
                suggestions={empresaSuggestions}
                placeholder="Quem enviou a correspondência"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
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
            <div className="space-y-2">
              <Label>Departamento</Label>
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
            <div className="space-y-2">
              <Label>Horário Entrada</Label>
              <Input value={formData.horarioEntrada || ''} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Porteiro</Label>
              <Input
                value={formData.porteiro || user?.nome || ''}
                readOnly
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input value={formData.data || ''} readOnly className="bg-muted" />
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
          <DialogTitle className="flex items-center gap-2">
            {isRascunho ? (
              <AlertTriangle className="h-5 w-5 text-red-500" />
            ) : isRefacao ? (
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            ) : null}
            {isRascunho ? 'Modificar Rascunho' : isRefacao ? 'Refazer Registro (Corrigir Versão)' : 'Novo Registro'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {isRefacao && (
            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs rounded-xl p-3.5 flex items-start gap-2.5">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold uppercase tracking-wider text-[11px]">Modo de Refação Auditável</p>
                <p>Altere as informações necessárias abaixo e salve para criar uma nova versão corrigida do registro original.</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label className="flex items-center gap-1">
                  Tipo de Visita <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={categoria}
                  onValueChange={handleCategoriaChange}
                  disabled={isRefacao}
                >
                  <SelectTrigger className={!categoria ? 'text-muted-foreground border-amber-500/50 focus:ring-amber-500' : ''}>
                    <SelectValue placeholder="Selecione o tipo de visita" />
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
                    <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/30 rounded-lg px-3 py-2">
                      <Ticket className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{pessoa.ticket}</span>
                    </div>
                  );
                }
                
                return (
                  <Button
                    onClick={handleCriarTicket}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <Ticket className="h-4 w-4 mr-2" />
                    Criar Ticket
                  </Button>
                );
              })()}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">{renderFields()}</div>

          {categoria && (
            <div className="space-y-2 pt-2 border-t border-border/50">
              <Label>Observação <span className="text-muted-foreground font-normal">(Opcional)</span></Label>
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
            <Button variant="destructive" onClick={handleDeleteDraft} className="w-full sm:w-auto mb-2 sm:mb-0 sm:mr-auto">
              Excluir Rascunho
            </Button>
          ) : (
            <Button variant="secondary" onClick={handleSaveDraft} className="w-full sm:w-auto mb-2 sm:mb-0 sm:mr-auto">
              Salvar Rascunho
            </Button>
          )}

          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
              Cancelar
            </Button>
            {isRascunho && (
              <Button onClick={handleSaveDraft} variant="outline" className="flex-1 sm:flex-none border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10">
                Atualizar Rascunho
              </Button>
            )}
            <Button onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-700 flex-1 sm:flex-none">
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
          <DialogTitle className="text-sm font-medium mb-3">Mensagem de Liberação</DialogTitle>
          <div className="bg-muted p-2 rounded text-xs text-foreground select-all">
            {coletaMessage}
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs flex-1"
              onClick={() => {
                setColetaMessage(null);
                onClose();
              }}
            >
              Fechar
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex-1"
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
          <DialogTitle className="flex items-center gap-2 text-sm font-medium mb-3">
            <Ticket className="h-5 w-5 text-amber-500" />
            Ticket Gerado com Sucesso!
          </DialogTitle>
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-500/30 p-3 rounded-lg text-center">
            <p className="text-xs text-muted-foreground mb-1">Guarde este código para visitas futuras</p>
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
