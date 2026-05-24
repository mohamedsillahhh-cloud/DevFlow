-- Migracao: Adicionar user_id e RLS a todas as tabelas
-- Data: 2026-05-24

-- ============================================================
-- 1. Adicionar coluna user_id nas tabelas raiz
-- ============================================================

ALTER TABLE clientes ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL DEFAULT auth.uid();
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL DEFAULT auth.uid();
ALTER TABLE investimentos ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL DEFAULT auth.uid();
ALTER TABLE projetos ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL DEFAULT auth.uid();
ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL DEFAULT auth.uid();

-- ============================================================
-- 2. Adicionar coluna user_id nas tabelas filhas
-- ============================================================

ALTER TABLE pagamentos ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL DEFAULT auth.uid();
ALTER TABLE receitas ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL DEFAULT auth.uid();
ALTER TABLE tempo_projeto ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL DEFAULT auth.uid();
ALTER TABLE aportes ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL DEFAULT auth.uid();

-- ============================================================
-- 3. Atualizar user_id nas tabelas filhas baseado no pai
-- ============================================================

UPDATE pagamentos p
SET user_id = pr.user_id
FROM projetos pr
WHERE p.projeto_id = pr.id AND p.user_id IS NULL;

UPDATE receitas r
SET user_id = pr.user_id
FROM projetos pr
WHERE r.projeto_id = pr.id AND r.user_id IS NULL;

UPDATE tempo_projeto tp
SET user_id = pr.user_id
FROM projetos pr
WHERE tp.projeto_id = pr.id AND tp.user_id IS NULL;

UPDATE aportes a
SET user_id = i.user_id
FROM investimentos i
WHERE a.investimento_id = i.id AND a.user_id IS NULL;

-- ============================================================
-- 4. Garantir que user_id nao seja nulo nas filhas
-- ============================================================

ALTER TABLE pagamentos ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE receitas ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE tempo_projeto ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE aportes ALTER COLUMN user_id SET NOT NULL;

-- ============================================================
-- 5. Remover politicas antigas USING(true)
-- ============================================================

DROP POLICY IF EXISTS "Enable all for authenticated users" ON clientes;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON gastos;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON investimentos;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON projetos;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON configuracoes;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON pagamentos;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON receitas;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON tempo_projeto;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON aportes;

DROP POLICY IF EXISTS "Allow all" ON clientes;
DROP POLICY IF EXISTS "Allow all" ON gastos;
DROP POLICY IF EXISTS "Allow all" ON investimentos;
DROP POLICY IF EXISTS "Allow all" ON projetos;
DROP POLICY IF EXISTS "Allow all" ON configuracoes;
DROP POLICY IF EXISTS "Allow all" ON pagamentos;
DROP POLICY IF EXISTS "Allow all" ON receitas;
DROP POLICY IF EXISTS "Allow all" ON tempo_projeto;
DROP POLICY IF EXISTS "Allow all" ON aportes;

-- ============================================================
-- 6. Ativar RLS em todas as tabelas
-- ============================================================

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE investimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE projetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE receitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tempo_projeto ENABLE ROW LEVEL SECURITY;
ALTER TABLE aportes ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 7. Politicas para tabelas raiz (filtro direto por user_id)
-- ============================================================

CREATE POLICY "owner_clientes" ON clientes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "owner_gastos" ON gastos
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "owner_investimentos" ON investimentos
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "owner_projetos" ON projetos
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "owner_configuracoes" ON configuracoes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 8. Politicas para tabelas filhas (via JOIN no pai)
-- ============================================================

CREATE POLICY "owner_pagamentos" ON pagamentos
  FOR ALL USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM projetos WHERE id = pagamentos.projeto_id AND user_id = auth.uid()
    )
  ) WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM projetos WHERE id = pagamentos.projeto_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "owner_receitas" ON receitas
  FOR ALL USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM projetos WHERE id = receitas.projeto_id AND user_id = auth.uid()
    )
  ) WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM projetos WHERE id = receitas.projeto_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "owner_tempo_projeto" ON tempo_projeto
  FOR ALL USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM projetos WHERE id = tempo_projeto.projeto_id AND user_id = auth.uid()
    )
  ) WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM projetos WHERE id = tempo_projeto.projeto_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "owner_aportes" ON aportes
  FOR ALL USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM investimentos WHERE id = aportes.investimento_id AND user_id = auth.uid()
    )
  ) WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM investimentos WHERE id = aportes.investimento_id AND user_id = auth.uid()
    )
  );
