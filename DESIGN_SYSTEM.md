# Design System — DevFlow

Crie todos os componentes seguindo exatamente este padrão visual.

---

## Tema

- **Estilo:** Dashboard SaaS Premium
- **Aparência:** Dark Mode
- **Visual:** Minimalista, moderno e profissional
- **Inspirado em:** Stripe, Linear, Vercel, Notion, Raycast
- Bordas suaves
- Espaçamento generoso
- Sem gradientes exagerados
- Sem sombras fortes

---

## Cores

| Token | Cor |
|---|---|
| Fundo principal | `#050505` |
| Fundo secundário (cards) | `#0D0D0D` |
| Bordas | `#1A1A1A` |
| Texto principal | `#FFFFFF` |
| Texto secundário | `#6B7280` |
| Receita / positivo | `#00E5C0` |
| Gasto / negativo | `#FF4D67` |
| Destaque | `#FFFFFF` |

---

## Cards

```
border-radius: 16px
border: 1px solid #1A1A1A
background: #0D0D0D
padding: 24px
```

---

## Inputs

```
height: 56px
border-radius: 12px
background: #0D0D0D
border: 1px solid #1A1A1A
```

**Placeholder:** `#6B7280`

---

## Botões

### Primário
```
background: #FFFFFF
color: #000000
height: 48px
border-radius: 12px
```

### Secundário
```
background: transparent
border: 1px solid #1A1A1A
color: white
```

---

## Tabelas

### Cabeçalho
```
font-size: 12px
letter-spacing: 0.12em
text-transform: uppercase
color: #6B7280
```

### Linhas
```
height: 64px
border-bottom: 1px solid #1A1A1A
```

### Hover
```
background: rgba(255, 255, 255, 0.03)
```

### Valores
- **Receitas:** `#00E5C0`
- **Gastos:** `#FF4D67`

---

## Métricas

Sempre mostrar quando aplicável:

```
Receitas
Gastos
Saldo
Registos
```

Formato visual:

```
┌─────────┐
  Receitas
  CVE 0,00
└─────────┘
```

---

## Espaçamento

| Contexto | Valor |
|---|---|
| Entre secções | `32px` |
| Entre cards | `24px` |
| Entre elementos internos | `16px` |

---

## Regras

- Nunca usar mais de 3 cores principais por tela.
- Nunca usar bordas grossas (`> 1px`).
- Nunca misturar estilos diferentes.
- Todas as tabelas devem ser visualmente idênticas.
- Todos os filtros devem usar o mesmo componente reutilizável.
- Todos os cards de estatísticas devem usar o mesmo layout.
- Todo novo módulo deve parecer parte do mesmo sistema.
- Preferir `rem` / `em` sobre `px` para escalabilidade, exceto em borders.
