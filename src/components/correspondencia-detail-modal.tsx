'use client';

import {
  AlertTriangle,
  FileText,
  Mail,
  PackageCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { RegistroCorrespondencias } from '@/lib/data';
import AutocompleteInput, { type AutocompleteSuggestion } from './autocomplete-input';

interface CorrespondenciaDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registro: RegistroCorrespondencias | null;
  nameSuggestions: AutocompleteSuggestion[];
  quemRetirou: string;
  onQuemRetirouChange: (value: string) => void;
  detalhesSaida: string;
  onDetalhesSaidaChange: (value: string) => void;
  ocorrenciaSaida: string;
  onOcorrenciaSaidaChange: (value: string) => void;
  onRegistrarRetirada: () => void;
}

export default function CorrespondenciaDetailModal({
  open,
  onOpenChange,
  registro,
  nameSuggestions,
  quemRetirou,
  onQuemRetirouChange,
  detalhesSaida,
  onDetalhesSaidaChange,
  ocorrenciaSaida,
  onOcorrenciaSaidaChange,
  onRegistrarRetirada,
}: CorrespondenciaDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md max-h-[85vh] overflow-y-auto custom-scrollbar"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-emerald-600" />
            Detalhes da Correspondência
          </DialogTitle>
        </DialogHeader>

        {registro && (
          <div className="space-y-5">
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-emerald-600" />
                <span className="font-semibold text-sm">Informações da Correspondência</span>
              </div>
              <div className="bg-muted/50 rounded-xl p-4 space-y-2.5">
                {[
                  { label: 'Destinatário', value: registro.destinatario },
                  { label: 'Remetente', value: registro.remetente },
                  { label: 'Tipo', value: registro.tipo },
                  { label: 'Departamento', value: registro.departamento },
                  { label: 'Data', value: registro.data },
                  { label: 'Horário de Entrada', value: registro.horarioEntrada },
                  { label: 'Porteiro', value: registro.porteiro },
                  ...(registro.horarioSaida ? [{ label: 'Horário de Retirada', value: registro.horarioSaida }] : []),
                  ...(registro.quemRetirou ? [{ label: 'Quem Retirou', value: registro.quemRetirou }] : []),
                ].map((field) => (
                  <div key={field.label} className="flex justify-between items-start gap-2">
                    <span className="text-sm font-medium text-muted-foreground shrink-0">{field.label}</span>
                    <span className="text-sm text-foreground text-right">{field.value || '-'}</span>
                  </div>
                ))}
              </div>
            </div>

            {registro.horarioSaida && (registro.detalhes || registro.ocorrencia) && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="font-semibold text-sm">Registros Adicionais</span>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 space-y-2.5">
                  {registro.detalhes && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Detalhes</span>
                      <p className="text-sm text-foreground mt-0.5">{registro.detalhes}</p>
                    </div>
                  )}
                  {registro.ocorrencia && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Ocorrência</span>
                      <p className="text-sm text-foreground mt-0.5">{registro.ocorrencia}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!registro.horarioSaida && (
              <>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-2">
                    <PackageCheck className="h-4 w-4 text-emerald-600" />
                    Quem Retirou
                  </Label>
                  <AutocompleteInput
                    value={quemRetirou}
                    onChange={onQuemRetirouChange}
                    onSelect={(suggestion) => {
                      if (suggestion.data?.name) onQuemRetirouChange(suggestion.data.name as string);
                    }}
                    suggestions={nameSuggestions}
                    placeholder="Nome de quem retirou"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Detalhes
                  </Label>
                  <Textarea
                    placeholder="Informações adicionais..."
                    value={detalhesSaida}
                    onChange={(event) => onDetalhesSaidaChange(event.target.value)}
                    rows={3}
                    className="text-base"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Ocorrência
                  </Label>
                  <Textarea
                    placeholder="Registrar ocorrência ou incidente..."
                    value={ocorrenciaSaida}
                    onChange={(event) => onOcorrenciaSaidaChange(event.target.value)}
                    rows={3}
                    className="text-base"
                  />
                </div>

                <Button
                  onClick={onRegistrarRetirada}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white text-base font-semibold"
                >
                  <PackageCheck className="h-5 w-5 mr-2" />
                  Registrar Retirada
                </Button>
              </>
            )}

            {registro.horarioSaida && (
              <div className="flex items-center justify-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-sm px-3 py-1">
                  Retirado em {registro.horarioSaida}
                  {registro.quemRetirou ? ` por ${registro.quemRetirou}` : ''}
                </Badge>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
