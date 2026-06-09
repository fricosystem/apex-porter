'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, MapPin, Map as MapIcon, Loader2, Save, Edit2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { PontoRota, RotaGeoreferenciada } from '@/lib/data';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

// Load map dynamically to avoid SSR issues
const MiniMap = dynamic(() => import('./mini-map'), { ssr: false, loading: () => <div className="h-48 w-full bg-muted/50 rounded-xl flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> });

interface ModalNovoPontoProps {
  onClose: () => void;
  onAdd: (ponto: Omit<PontoRota, 'id'>) => void;
  pontoEditar?: PontoRota;
}

function ModalNovoPonto({ onClose, onAdd, pontoEditar }: ModalNovoPontoProps) {
  const [nome, setNome] = useState(pontoEditar?.nome || '');
  const [horarioExecucao, setHorarioExecucao] = useState(pontoEditar?.horarioExecucao || '');
  const [raio, setRaio] = useState(pontoEditar?.raio || 50);
  const [recorrente, setRecorrente] = useState(pontoEditar?.recorrente || false);
  const [diasSemana, setDiasSemana] = useState<string[]>(pontoEditar?.diasSemana || []);
  const [latitude, setLatitude] = useState<number | null>(pontoEditar?.latitude || null);
  const [longitude, setLongitude] = useState<number | null>(pontoEditar?.longitude || null);
  const [locating, setLocating] = useState(!pontoEditar);

  const diasOptions = [
    { value: 'seg', label: 'Seg' },
    { value: 'ter', label: 'Ter' },
    { value: 'qua', label: 'Qua' },
    { value: 'qui', label: 'Qui' },
    { value: 'sex', label: 'Sex' },
    { value: 'sab', label: 'Sáb' },
    { value: 'dom', label: 'Dom' },
  ];

  useEffect(() => {
    if (!pontoEditar && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          setLocating(false);
        },
        (error) => {
          console.error("Erro ao obter geolocalização:", error);
          toast.error("Não foi possível obter sua localização atual.");
          // Fallback location if needed
          setLatitude(-23.55052);
          setLongitude(-46.633308);
          setLocating(false);
        },
        { enableHighAccuracy: true }
      );
    } else if (pontoEditar) {
      setLocating(false);
    } else {
      toast.error("Geolocalização não suportada pelo navegador.");
      setLocating(false);
    }
  }, [pontoEditar]);

  const handleAdd = () => {
    if (!nome.trim()) {
      toast.error("Nome do ponto é obrigatório.");
      return;
    }
    if (!horarioExecucao) {
      toast.error("Horário de execução é obrigatório.");
      return;
    }
    if (latitude === null || longitude === null) {
      toast.error("Aguarde a obtenção da localização.");
      return;
    }
    if (recorrente && diasSemana.length === 0) {
      toast.error("Selecione pelo menos um dia da semana para recorrência.");
      return;
    }

    onAdd({
      nome,
      latitude,
      longitude,
      raio,
      horarioExecucao,
      recorrente,
      diasSemana: recorrente ? diasSemana : undefined,
    });
  };

  const toggleDia = (dia: string) => {
    setDiasSemana(prev => 
      prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia]
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-bold text-lg">{pontoEditar ? 'Editar Ponto da Rota' : 'Novo Ponto da Rota'}</h3>
          <button onClick={onClose} className="p-2 bg-muted/50 rounded-full hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Localização (Raio: {raio}m)</label>
            {locating ? (
              <div className="h-48 w-full bg-muted/50 rounded-xl flex flex-col items-center justify-center text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mb-2" />
                <span className="text-sm">Obtendo localização precisa...</span>
              </div>
            ) : latitude && longitude ? (
              <MiniMap latitude={latitude} longitude={longitude} raio={raio} />
            ) : null}
            
            <div className="mt-4">
              <label className="block text-xs text-muted-foreground mb-1">Ajustar Raio (em metros)</label>
              <input
                type="range"
                min="10"
                max="200"
                step="5"
                value={raio}
                onChange={(e) => setRaio(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>10m</span>
                <span>200m</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome do Ponto *</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Portaria Principal"
                className="w-full bg-background border border-input rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Horário de Execução *</label>
              <input
                type="time"
                value={horarioExecucao}
                onChange={(e) => setHorarioExecucao(e.target.value)}
                className="w-full bg-background border border-input rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="flex items-center justify-between bg-muted/30 p-3 rounded-xl border border-border">
              <label className="text-sm font-medium">Recorrente</label>
              <button
                type="button"
                onClick={() => setRecorrente(!recorrente)}
                className={`w-11 h-6 rounded-full transition-colors relative ${recorrente ? 'bg-primary' : 'bg-muted-foreground/30'}`}
              >
                <div className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-transform ${recorrente ? 'left-6' : 'left-1'}`} />
              </button>
            </div>

            <AnimatePresence>
              {recorrente && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <label className="block text-sm font-medium mb-2">Dias da semana</label>
                  <div className="flex flex-wrap gap-2">
                    {diasOptions.map(dia => (
                      <button
                        key={dia.value}
                        type="button"
                        onClick={() => toggleDia(dia.value)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                          diasSemana.includes(dia.value)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {dia.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="p-4 border-t border-border bg-muted/20">
          <button
            onClick={handleAdd}
            className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <Save className="h-5 w-5" />
            {pontoEditar ? 'Salvar Ponto' : 'Adicionar Ponto'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

interface ModalNovaRotaProps {
  onClose: () => void;
  rotaEditar?: RotaGeoreferenciada;
}

export function ModalNovaRota({ onClose, rotaEditar }: ModalNovaRotaProps) {
  const [nomeRota, setNomeRota] = useState(rotaEditar?.nome || '');
  const [pontos, setPontos] = useState<PontoRota[]>(rotaEditar?.pontos || []);
  const [showNovoPonto, setShowNovoPonto] = useState(false);
  const [pontoParaEditar, setPontoParaEditar] = useState<PontoRota | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { addRotaGeoreferenciada, updateRotaGeoreferenciada } = useAppStore();

  const handleSaveRota = async () => {
    if (!nomeRota.trim()) {
      toast.error("Informe o nome da rota.");
      return;
    }
    if (pontos.length === 0) {
      toast.error("Adicione pelo menos um ponto na rota.");
      return;
    }

    setIsSaving(true);
    try {
      if (rotaEditar) {
        const rotaAtualizada: RotaGeoreferenciada = {
          ...rotaEditar,
          nome: nomeRota,
          pontos,
          atualizadoEm: new Date().toISOString(),
        };
        updateRotaGeoreferenciada(rotaAtualizada);
        toast.success("Rota atualizada com sucesso!");
      } else {
        const novaRota: RotaGeoreferenciada = {
          id: crypto.randomUUID(),
          nome: nomeRota,
          pontos,
          criadoEm: new Date().toISOString(),
        };
        addRotaGeoreferenciada(novaRota);
        toast.success("Rota criada com sucesso!");
      }
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar rota.");
      setIsSaving(false);
    }
  };

  const handleAddPonto = (pontoData: Omit<PontoRota, 'id'>) => {
    if (pontoParaEditar) {
      // Editando ponto existente
      setPontos(pontos.map(p => 
        p.id === pontoParaEditar.id ? { ...pontoData, id: pontoParaEditar.id } : p
      ));
      setPontoParaEditar(null);
    } else {
      // Adicionando novo ponto
      const novoPonto: PontoRota = {
        ...pontoData,
        id: crypto.randomUUID(),
      };
      setPontos([...pontos, novoPonto]);
    }
    setShowNovoPonto(false);
  };

  const handleEditarPonto = (ponto: PontoRota) => {
    setPontoParaEditar(ponto);
    setShowNovoPonto(true);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="bg-card w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col h-[85vh]"
        >
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="font-bold text-xl flex items-center gap-2">
              <MapIcon className="h-6 w-6 text-primary" />
              {rotaEditar ? 'Editar Rota Georeferenciada' : 'Nova Rota Georeferenciada'}
            </h2>
            <button onClick={onClose} className="p-2 bg-muted/50 rounded-full hover:bg-muted transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4 overflow-y-auto flex-1 space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1">Nome da Rota *</label>
              <input
                type="text"
                value={nomeRota}
                onChange={(e) => setNomeRota(e.target.value)}
                placeholder="Ex: Rota Externa Norte"
                className="w-full bg-background border border-input rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium">Pontos da Rota</label>
                <button
                  onClick={() => {
                    setPontoParaEditar(null);
                    setShowNovoPonto(true);
                  }}
                  className="flex items-center gap-1 text-xs font-medium bg-primary/10 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  Adicionar Ponto
                </button>
              </div>

              <div className="space-y-3">
                {pontos.length === 0 ? (
                  <div className="text-center py-8 bg-muted/30 rounded-xl border border-dashed border-border">
                    <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-muted-foreground">Nenhum ponto adicionado.</p>
                  </div>
                ) : (
                  pontos.map((ponto, idx) => (
                    <div key={ponto.id} className="bg-background border border-border rounded-xl p-3 flex items-start gap-3 shadow-sm">
                      <div className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{ponto.nome}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Horário: {ponto.horarioExecucao} | Raio: {ponto.raio}m
                        </p>
                        {ponto.recorrente && (
                          <div className="flex gap-1 mt-2">
                            {ponto.diasSemana?.map(dia => (
                              <span key={dia} className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded capitalize">
                                {dia}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditarPonto(ponto)}
                          className="text-muted-foreground p-1 hover:text-primary hover:bg-primary/10 rounded-md"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setPontos(pontos.filter(p => p.id !== ponto.id))}
                          className="text-destructive p-1 hover:bg-destructive/10 rounded-md"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-border bg-muted/20">
            <button
              onClick={handleSaveRota}
              disabled={isSaving}
              className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              {rotaEditar ? 'Salvar Alterações' : 'Criar Rota'}
            </button>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showNovoPonto && (
          <ModalNovoPonto 
            onClose={() => {
              setShowNovoPonto(false);
              setPontoParaEditar(null);
            }} 
            onAdd={handleAddPonto}
            pontoEditar={pontoParaEditar || undefined}
          />
        )}
      </AnimatePresence>
    </>
  );
}
