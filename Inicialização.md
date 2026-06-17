# Manual de Inicialização do Projeto — APEX Portaria

Este manual orienta como preparar o ambiente de desenvolvimento e executar o servidor localmente no Windows de forma rápida e segura.

---

## 🚀 Requisitos Pré-Ativos

*   **Node.js**: Versão LTS recomendada (v18 ou superior).
*   **Gerenciador de Pacotes**: Recomendamos o **pnpm** (versão 9.0.0 ou superior) para máxima velocidade e eficiência.

---

## 🛠️ Passo 1: Instalação de Dependências no Windows

Em sistemas operacionais Windows, a instalação padrão pode apresentar falhas ao compilar módulos nativos (como a biblioteca `sharp`). Para evitar erros de compilação ou do `node-gyp`, você deve rodar a instalação ignorando scripts nativos desnecessários para o desenvolvimento local.

Execute o seguinte comando no terminal:

```bash
pnpm install --ignore-scripts
```

*Nota: Esse comando instala perfeitamente todas as dependências (Next.js, Zustand, Radix UI, Firebase, Framer Motion) sem falhar.*

---

## 💻 Passo 2: Executar o Servidor de Desenvolvimento

Após concluir a instalação das dependências, inicialize o servidor local executando:

```bash
pnpm exec next dev
```

*Nota: O comando `pnpm exec next dev` é o mais compatível no Windows, pois executa diretamente o binário local do Next.js (Turbopack) sem iniciar sub-processos do CMD.*

---

## 🌐 Passo 3: Acessar a Aplicação

O servidor Next.js será inicializado localmente. Por padrão, você poderá acessar o sistema no seu navegador pelo seguinte endereço:

👉 [http://localhost:3000](http://localhost:3000)

---

## 🚨 Solução de Problemas Comuns

### 1. Comando `next` ou `npx dev` não reconhecido
Nunca utilize `npx dev` para rodar o projeto. O comando correto para inicializar o Next.js localmente é `pnpm dev`. O erro `npx dev` ocorre porque o npm tenta instalar um pacote obsoleto de terceiros chamado "dev" que é incompatível com Windows.

### 2. Erros de compilação com `sharp` ou `node-gyp`
Caso tente rodar um `pnpm install` comum e ocorra um erro de build na pasta do `sharp`, simplesmente remova a pasta `node_modules` e rode novamente:
```bash
pnpm install --ignore-scripts
```
