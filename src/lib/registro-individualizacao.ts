import type { RegistroFluxo, PessoaExtra } from './data';

export type RegistroPessoa = PessoaExtra & {
  principal: boolean;
  departamento?: string;
};

function principalDoRegistro(registro: RegistroFluxo): RegistroPessoa {
  const r = registro as any;
  let nome = '';
  let rgCpf = '';
  let empresa = '';

  switch (registro.categoria) {
    case 'visitantes':
    case 'prestadores':
    case 'entregas1':
      nome = r.nome || r.nomeEmpresa?.split(' / ')[0] || r.nomeEmpresa || '';
      rgCpf = r.rgCpf || '';
      empresa = r.empresa || r.nomeEmpresa?.split(' / ')[1] || '';
      break;
    case 'pesagem':
    case 'entregas2':
      nome = r.motorista || '';
      rgCpf = r.rgCpf || r.cpfRg || '';
      empresa = r.empresa || '';
      break;
    case 'coleta':
      nome = r.motorista || '';
      rgCpf = r.rgCpf || '';
      empresa = r.empresa || '';
      break;
    case 'pesagem_apara':
    case 'pesagem_tinta':
      nome = r.condutor || '';
      rgCpf = r.rgCpf || r.cpfRg || '';
      empresa = r.empresa || '';
      break;
    case 'movimentacao':
      nome = r.nomeColaborador || '';
      rgCpf = r.rgCpf || '';
      empresa = r.empresa || '';
      break;
    case 'correspondencias':
      nome = r.destinatario || '';
      rgCpf = r.rgCpf || r.cpfRg || '';
      empresa = r.empresa || '';
      break;
  }

  return {
    id: 'principal',
    nome,
    rgCpf,
    empresa,
    departamento: r.departamento || '',
    principal: true,
  };
}

export function getRegistroPessoas(registro: RegistroFluxo): RegistroPessoa[] {
  const principal = principalDoRegistro(registro);
  const extras = Array.isArray(registro.pessoasExtras)
    ? registro.pessoasExtras.map((extra) => ({
        ...extra,
        principal: false,
        departamento: (registro as any).departamento || '',
      }))
    : [];
  return [principal, ...extras].filter((pessoa) => pessoa.nome.trim());
}

export function expandRegistroIndividualmente(r: RegistroFluxo): RegistroFluxo[] {
  const pessoas = getRegistroPessoas(r);
  if (pessoas.length <= 1) return [r];
  const individualizadoEm = r.individualizadoEm || '';
  return pessoas.map((pessoa) => individualizarRegistroPessoa(
    r,
    pessoa,
    `${r.id}__view__${pessoa.id}`,
    pessoa.principal ? r.horarioSaida : pessoa.horarioSaida || '',
    individualizadoEm,
    r.detalhes,
    r.ocorrencia,
    r.porteiroSaida,
    r.porteiroSaidaUid,
  ));
}

export function individualizarRegistroPessoa(
  registro: RegistroFluxo,
  pessoa: RegistroPessoa,
  novoId: string,
  horarioSaida: string,
  individualizadoEm: string,
  detalhes?: string,
  ocorrencia?: string,
  porteiroSaida?: string,
  porteiroSaidaUid?: string,
): RegistroFluxo {
  const child: any = {
    ...registro,
    id: novoId,
    pessoasExtras: undefined,
    registroGrupoOriginal: false,
    registroIndividualizado: true,
    registroPaiId: registro.id,
    pessoaOrigemId: pessoa.id,
    pessoaPrincipal: pessoa.principal,
    individualizadoEm,
    inativo: false,
    dataInativacao: undefined,
    motivoRefacao: undefined,
    horarioSaida: horarioSaida || '',
    detalhes: detalhes || registro.detalhes,
    ocorrencia: ocorrencia || registro.ocorrencia,
    ...(horarioSaida ? { porteiroSaida, porteiroSaidaUid } : {}),
  };

  switch (registro.categoria) {
    case 'visitantes':
    case 'prestadores':
    case 'entregas1':
      child.nome = pessoa.nome;
      child.empresa = pessoa.empresa;
      child.nomeEmpresa = `${pessoa.nome} / ${pessoa.empresa}`;
      child.rgCpf = pessoa.rgCpf;
      break;
    case 'pesagem':
      child.motorista = pessoa.nome;
      child.empresa = pessoa.empresa;
      child.rgCpf = pessoa.rgCpf;
      break;
    case 'entregas2':
      child.motorista = pessoa.nome;
      child.empresa = pessoa.empresa;
      child.cpfRg = pessoa.rgCpf;
      break;
    case 'coleta':
      child.motorista = pessoa.nome;
      child.empresa = pessoa.empresa;
      child.rgCpf = pessoa.rgCpf;
      break;
    case 'pesagem_apara':
    case 'pesagem_tinta':
      child.condutor = pessoa.nome;
      if (pessoa.rgCpf) child.rgCpf = pessoa.rgCpf;
      if (pessoa.empresa) child.empresa = pessoa.empresa;
      break;
    case 'movimentacao':
      child.nomeColaborador = pessoa.nome;
      child.rgCpf = pessoa.rgCpf;
      break;
    case 'correspondencias':
      child.destinatario = pessoa.nome;
      if (pessoa.rgCpf) child.rgCpf = pessoa.rgCpf;
      if (pessoa.empresa) child.empresa = pessoa.empresa;
      break;
  }

  return child as RegistroFluxo;
}
