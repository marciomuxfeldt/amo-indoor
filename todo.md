# Amo Indoor - Sistema de Autenticação com Supabase Auth

## Objetivo
Implementar autenticação segura para o Painel Administrativo usando Supabase Auth, com controle de roles (admin/coordinator) e proteção de rotas.

## Arquitetura de Segurança

### Usuários Humanos (Admin/Coordenador)
- Autenticação via Supabase Auth (email + senha)
- Sessão JWT gerenciada pelo Supabase
- Roles: `admin` ou `coordinator`
- Acesso ao Painel Administrativo

### Dispositivos (TVs)
- Autenticação separada (código + senha)
- Não usa Supabase Auth
- Acesso apenas à visualização de TV

## Tarefas de Implementação

### 1. Configuração Inicial
- [ ] Instalar dependência `@supabase/supabase-js` (já instalada)
- [ ] Verificar configuração do Supabase em `.env`
- [ ] Criar tabela `admin_users` no Supabase para roles

### 2. AuthStore (Pinia)
- [ ] Criar `/src/stores/authStore.ts`
- [ ] Implementar:
  - Estado: `user`, `role`, `loading`, `session`
  - Ações: `login()`, `logout()`, `checkSession()`, `getRole()`
  - Persistência de sessão após refresh

### 3. Componentes de Autenticação
- [ ] Criar `/src/views/admin/AdminLogin.vue`
  - Formulário de email + senha
  - Validação de campos
  - Feedback de erros
  - Loading state
- [ ] Criar `/src/layouts/AdminLayout.vue`
  - Header com informações do usuário
  - Botão de logout
  - Menu lateral administrativo
  - Slot para conteúdo

### 4. Navigation Guards
- [ ] Criar `/src/router/guards/authGuard.ts`
  - Verificar sessão ativa antes de acessar `/admin/*`
  - Redirecionar para `/admin/login` se não autenticado
  - Verificar role do usuário
- [ ] Atualizar `/src/router/index.ts`
  - Adicionar rota `/admin/login`
  - Aplicar guard em todas as rotas `/admin/*`
  - Configurar meta `requiresAuth: true`

### 5. Integração com Supabase
- [ ] Atualizar `/src/services/supabase.ts`
  - Adicionar funções de autenticação
  - `signIn(email, password)`
  - `signOut()`
  - `getSession()`
  - `onAuthStateChange()`

### 6. Banco de Dados (Supabase)
- [ ] Criar tabela `admin_users` com SQL:
  ```sql
  CREATE TABLE admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'coordinator')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```
- [ ] Configurar RLS (Row Level Security)
- [ ] Criar políticas de acesso

### 7. Atualização de Componentes Existentes
- [ ] Atualizar `/src/views/Admin.vue`
  - Usar `AdminLayout` como wrapper
  - Remover lógica de autenticação antiga (se houver)
- [ ] Atualizar componentes administrativos:
  - `OrderManagement.vue`
  - `DeviceManagement.vue`
  - `MediaManagement.vue`
  - `ProductManagement.vue`
  - `TvMonitor.vue`

### 8. Separação TV vs Admin
- [ ] Garantir que `/tv/:code` não requer autenticação de usuário
- [ ] Manter autenticação de dispositivo separada
- [ ] Documentar diferença entre os dois sistemas

### 9. Configuração para Deploy
- [ ] Criar/atualizar `vercel.json` para SPA rewrites
- [ ] Verificar variáveis de ambiente no Vercel
- [ ] Testar deploy

### 10. Testes e Validação
- [ ] Testar fluxo de login completo
- [ ] Testar persistência de sessão após refresh
- [ ] Testar logout
- [ ] Testar redirecionamento de rotas protegidas
- [ ] Testar expiração de token
- [ ] Verificar que TVs continuam funcionando sem autenticação de usuário

## Estrutura de Arquivos

```
src/
├── stores/
│   ├── authStore.ts          ← NOVO (gerenciamento de autenticação)
│   ├── ordersStore.ts
│   ├── devicesStore.ts
│   └── ...
├── views/
│   ├── admin/
│   │   └── AdminLogin.vue    ← NOVO (tela de login)
│   ├── Admin.vue             ← ATUALIZAR (usar AdminLayout)
│   └── TvDisplay.vue
├── layouts/
│   └── AdminLayout.vue       ← NOVO (layout com header e logout)
├── router/
│   ├── guards/
│   │   └── authGuard.ts      ← NOVO (proteção de rotas)
│   └── index.ts              ← ATUALIZAR (adicionar guards)
├── services/
│   └── supabase.ts           ← ATUALIZAR (adicionar auth functions)
└── types/
    └── index.ts              ← ATUALIZAR (adicionar tipos de auth)
```

## Fluxo de Autenticação

1. Usuário acessa `/admin`
2. Navigation Guard verifica sessão
3. Se não autenticado → redireciona para `/admin/login`
4. Usuário faz login com email + senha
5. Supabase valida credenciais
6. AuthStore busca role do usuário na tabela `admin_users`
7. Sessão é criada e persistida
8. Usuário é redirecionado para `/admin`
9. Navigation Guard permite acesso
10. AdminLayout exibe informações do usuário

## Segurança

- ✅ JWT gerenciado pelo Supabase
- ✅ Sessão persistente com refresh token
- ✅ RLS no Supabase para proteção de dados
- ✅ Roles verificadas no backend
- ✅ Frontend apenas para UX (não é autoridade)
- ✅ Logout automático se token expirar
- ✅ Sem senhas hardcoded
- ✅ Separação clara entre auth de usuário e dispositivo

## Observações

- O sistema atual já tem Supabase configurado
- Manter compatibilidade com funcionalidades existentes
- Não quebrar autenticação de dispositivos (TVs)
- Código limpo, comentado e profissional
- Preparado para evolução futura