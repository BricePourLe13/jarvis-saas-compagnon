# 🎨 DESIGN SYSTEM V2 - JARVIS DASHBOARD

**Date :** 25 octobre 2025  
**Version :** 2.0 - Harmonisation avec site vitrine

---

## 🎯 PALETTE DE COULEURS

### Couleurs Principales (Site Vitrine)

```css
/* JARVIS Brand Colors */
--jarvis-purple: #8B5CF6;      /* Violet principal (identité) */
--jarvis-blue: #3B82F6;        /* Bleu secondaire */
--jarvis-green: #10B981;       /* Vert success */
--jarvis-orange: #F59E0B;      /* Orange warning */
```

### Adaptation Dashboard (Dark Mode)

```css
:root {
  /* Light mode (rarement utilisé) */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 262 83% 58%;        /* #8B5CF6 - JARVIS Purple */
  --primary-foreground: 210 40% 98%;
}

.dark {
  /* Dark mode (défaut dashboard) */
  --background: 220 13% 13%;     /* #1a1d29 - Background sombre */
  --foreground: 210 40% 98%;     /* #f8fafc - Texte blanc */
  
  --card: 220 13% 18%;           /* #242837 - Cards */
  --card-hover: 220 13% 20%;     /* #282d3f - Hover */
  
  --primary: 262 83% 58%;        /* #8B5CF6 - JARVIS Purple ✨ */
  --primary-hover: 262 83% 65%;  /* #a78bfa - Hover */
  --primary-foreground: 210 40% 98%;
  
  --secondary: 217 91% 60%;      /* #3B82F6 - JARVIS Blue */
  --secondary-foreground: 210 40% 98%;
  
  --success: 142 76% 36%;        /* #10B981 - Green */
  --warning: 38 92% 50%;         /* #F59E0B - Orange */
  --destructive: 0 84% 60%;      /* #ef4444 - Red */
  
  --accent: 262 90% 70%;         /* #a78bfa - Purple light */
  
  --muted: 220 13% 30%;
  --muted-foreground: 215 20% 65%;
  
  --border: 220 13% 25%;
  --input: 220 13% 25%;
  
  --ring: 262 83% 58%;           /* Focus ring = primary */
}
```

---

## 🎨 UTILISATION

### Boutons

```tsx
// Primary (JARVIS Purple)
<Button className="bg-primary hover:bg-primary-hover text-primary-foreground">
  Action principale
</Button>

// Secondary (JARVIS Blue)
<Button variant="secondary">
  Action secondaire
</Button>

// Success
<Button className="bg-success text-white">
  Valider
</Button>
```

### Cards

```tsx
// Card standard
<div className="bg-card border border-border hover:bg-card-hover">
  Contenu
</div>

// Card avec accent
<div className="bg-card border-l-4 border-primary">
  Contenu avec accent purple
</div>
```

### Badges

```tsx
// Status badges
<Badge className="bg-primary/10 text-primary border-primary/20">Premium</Badge>
<Badge className="bg-success/10 text-success border-success/20">Actif</Badge>
<Badge className="bg-warning/10 text-warning border-warning/20">En attente</Badge>
<Badge className="bg-destructive/10 text-destructive border-destructive/20">Risque</Badge>
```

### Text Colors

```tsx
// Texte principal
<p className="text-foreground">Texte normal</p>

// Texte mutted
<p className="text-muted-foreground">Texte secondaire</p>

// Texte avec couleur brand
<h1 className="text-primary">Titre JARVIS</h1>
```

---

## 🌈 GRADIENTS (Identité Visuelle)

```css
/* Gradient JARVIS (Purple → Blue) */
.gradient-jarvis {
  background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%);
}

/* Gradient text */
.gradient-text-jarvis {
  background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

---

## 📐 COMPOSANTS STANDARDS

### StatCard (KPI)

```tsx
<div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all">
  <div className="flex items-center gap-3 mb-4">
    <div className="p-3 rounded-lg bg-primary/10">
      <Icon className="h-6 w-6 text-primary" />
    </div>
  </div>
  <p className="text-sm text-muted-foreground">Label</p>
  <p className="text-3xl font-bold text-foreground">Valeur</p>
</div>
```

### AlertCard

```tsx
<div className="border rounded-lg p-4 bg-warning/10 border-warning/20">
  <div className="flex items-start gap-3">
    <AlertTriangle className="h-5 w-5 text-warning" />
    <div>
      <h3 className="font-semibold text-foreground">Titre</h3>
      <p className="text-sm text-muted-foreground">Message</p>
    </div>
  </div>
</div>
```

---

## 🎯 DIFFÉRENCES AVEC ANCIEN DASHBOARD

| Élément | Ancien (Kestra-inspired) | Nouveau (JARVIS Brand) |
|---------|-------------------------|------------------------|
| **Primary** | Purple générique (#8b5cf6) | JARVIS Purple (#8B5CF6) ✅ Même ! |
| **Secondary** | Gris (#2d3142) | JARVIS Blue (#3B82F6) ✨ |
| **Accent** | Purple light (#a78bfa) | Purple light (#a78bfa) ✅ |
| **Gradient** | ❌ Absent | ✅ Purple → Blue |
| **Cohérence** | ❌ Dashboard ≠ Vitrine | ✅ Dashboard = Vitrine |

**Conclusion :** Le primary était déjà bon (#8B5CF6), mais on ajoute :
- **Secondary blue** (#3B82F6)
- **Gradients JARVIS** (purple → blue)
- **Cohérence visuelle** complète

---

## 📦 FICHIERS À MODIFIER

```
src/app/globals.css → Mettre à jour .dark colors
src/components/dashboard/DashboardShell.tsx → Appliquer new colors
```

---

**Status :** ✅ Design System V2 défini - Prêt pour implémentation

