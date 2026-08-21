import type { RegistroFluxo } from './data';

function formatDocument(documento?: string): { label: string; value: string } {
  if (!documento) return { label: 'RG/CPF', value: '-' };
  const digits = documento.replace(/\D/g, '');
  if (digits.length === 11) {
    return { label: 'CPF', value: digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') };
  }
  if (digits.length > 0) {
    return { label: 'RG', value: digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.') };
  }
  return { label: 'RG/CPF', value: documento };
}

function categoryAction(categoria: RegistroFluxo['categoria']): string {
  switch (categoria) {
    case 'coleta': return 'retirar a coleta';
    case 'visitantes': return 'uma visita';
    case 'prestadores': return 'uma prestação de serviço';
    case 'entregas1':
    case 'entregas2': return 'uma entrega';
    case 'pesagem': return 'uma pesagem';
    case 'pesagem_apara': return 'uma pesagem de apara';
    case 'pesagem_tinta': return 'uma pesagem de tinta/solvente';
    case 'correspondencias': return 'uma entrega de correspondência';
    default: return categoria;
  }
}

function buildGroupedReleaseMessage(registro: RegistroFluxo): string {
  const fields = registro as any;
  const principalNome = fields.nome
    || fields.motorista
    || fields.condutor
    || fields.nomeEmpresa?.split(' / ')[0]
    || fields.nomeEmpresa
    || '';
  const principalDoc = fields.rgCpf || fields.cpfRg || '';
  const principalEmpresa = fields.empresa || fields.nomeEmpresa?.split(' / ')[1] || '';
  const extras = Array.isArray(fields.pessoasExtras) ? fields.pessoasExtras : [];
  const pessoas = [
    { nome: principalNome, doc: principalDoc, empresa: principalEmpresa },
    ...extras.map((extra: any) => ({
      nome: extra.nome,
      doc: extra.rgCpf,
      empresa: extra.empresa || principalEmpresa,
    })),
  ].filter((pessoa) => String(pessoa.nome || '').trim());

  const pessoasTexto = pessoas.map((pessoa: any) => {
    const documento = formatDocument(pessoa.doc);
    return `${String(pessoa.nome).trim().toUpperCase()}, ${documento.label} ${documento.value}`;
  }).reduce((texto, pessoa, index, lista) => {
    if (index === 0) return pessoa;
    if (index === lista.length - 1) return `${texto} e ${pessoa}`;
    return `${texto}, ${pessoa}`;
  }, '');

  const empresas = Array.from(new Set(
    pessoas.map((pessoa: any) => String(pessoa.empresa || '').trim().toUpperCase()).filter(Boolean)
  ));
  const empresaTexto = empresas.length <= 1
    ? `pela empresa ${empresas[0] || 'EMPRESA NÃO INFORMADA'}`
    : `pelas empresas ${empresas.join(' e ')}`;
  const plural = pessoas.length > 1;

  return `Apenas para conhecimento, ${plural ? 'os Srs.' : 'o Sr.'} ${pessoasTexto || 'NOME NÃO INFORMADO'}, ${empresaTexto}, ${plural ? 'já se encontram' : 'já se encontra'} nas dependências da empresa para ${categoryAction(registro.categoria)}.`;
}

export function buildReleaseMessage(registro: RegistroFluxo): string {
  const fields = registro as any;
  const extras = Array.isArray(fields.pessoasExtras) ? fields.pessoasExtras : [];

  // Registros com acompanhantes mantêm a mensagem agrupada já utilizada.
  if (extras.length > 0) return buildGroupedReleaseMessage(registro);

  const nome = String(
    fields.nome
      || fields.motorista
      || fields.condutor
      || fields.nomeEmpresa?.split(' / ')[0]
      || fields.nomeEmpresa
      || 'NOME NÃO INFORMADO',
  ).trim().toUpperCase();
  const documento = formatDocument(fields.rgCpf || fields.cpfRg || '');
  const empresa = String(fields.empresa || fields.nomeEmpresa?.split(' / ')[1] || 'EMPRESA NÃO INFORMADA')
    .trim()
    .toUpperCase();

  return `O Sr. ${nome}, ${documento.label} ${documento.value}, está aqui na portaria pela empresa ${empresa} para ${categoryAction(registro.categoria)}. Podemos liberar?`;
}
