import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Database, Download, Info, Moon, Sun, Trash2 } from "lucide-react";
import { useState } from "react";
import { useThemeMode } from "../hooks/useThemeMode";
import {
  DATA_CATEGORIES,
  clearAllData,
  clearCategoryData,
  exportCategoryData,
} from "../lib/localDataAdmin";

export function SettingsPage() {
  const { mode, toggleMode } = useThemeMode();
  const [exportData, setExportData] = useState<string>("");
  const [exportOpen, setExportOpen] = useState(false);

  const handleExportCategory = (key: string) => {
    const data = exportCategoryData(key);
    setExportData(data);
    setExportOpen(true);
  };

  const handleClearCategory = (key: string) => {
    clearCategoryData(key);
    window.location.reload();
  };

  const handleClearAll = () => {
    clearAllData();
    window.location.reload();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Préférences et gestion des données
        </p>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            {mode === "dark" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
            Apparence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="theme-switch" className="font-medium">
                Mode sombre
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Basculer entre le thème clair et sombre
              </p>
            </div>
            <Switch
              id="theme-switch"
              checked={mode === "dark"}
              onCheckedChange={toggleMode}
              data-ocid="settings.theme.switch"
            />
          </div>
        </CardContent>
      </Card>

      {/* Data source info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4" />
            Source de données
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Les données historiques sont récupérées depuis{" "}
            <a
              href="https://stooq.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              Stooq.com
            </a>{" "}
            au format CSV via l'API publique.
          </p>
          <p>
            Format URL :{" "}
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
              https://stooq.com/q/d/l/?s=&#123;ticker&#125;&i=d
            </code>
          </p>
          <p className="text-xs">
            Les données sont mises en cache 5 minutes en mémoire pour éviter les
            requêtes redondantes.
          </p>
        </CardContent>
      </Card>

      {/* Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4" />
            Guide d'utilisation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            1. <strong className="text-foreground">Entreprises</strong> —
            Recherchez et parcourez les 100 entreprises disponibles. Cliquez
            pour voir le détail.
          </p>
          <p>
            2. <strong className="text-foreground">Graphique</strong> —
            Sélectionnez la plage (1A, 2A, 3A, 5A) et le type (Ligne /
            Chandelier). Activez MA50/MA200.
          </p>
          <p>
            3. <strong className="text-foreground">Lignes horizontales</strong>{" "}
            — Définissez des niveaux de support, résistance ou cibles de prix.
          </p>
          <p>
            4. <strong className="text-foreground">Transactions</strong> —
            Enregistrez vos achats et ventes. Le P&L est calculé
            automatiquement.
          </p>
          <p>
            5. <strong className="text-foreground">Targets</strong> — Planifiez
            des paliers d'achat et liez-les à vos transactions.
          </p>
          <p>
            6. <strong className="text-foreground">Portefeuille</strong> — Vue
            synthétique de toutes vos positions et P&L global.
          </p>
        </CardContent>
      </Card>

      <Separator />

      {/* Data management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4" />
            Gestion des données locales
          </CardTitle>
          <CardDescription>
            Toutes les données sont stockées dans votre navigateur
            (localStorage)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {DATA_CATEGORIES.map((category) => (
            <div
              key={category.key}
              className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3"
            >
              <div>
                <p className="text-sm font-medium">{category.label}</p>
                <p className="text-xs text-muted-foreground">
                  {category.description}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportCategory(category.key)}
                  data-ocid="settings.export.button"
                >
                  <Download className="mr-1 h-3 w-3" />
                  Export
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      data-ocid="settings.delete.button"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent data-ocid="settings.delete.dialog">
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Confirmer la suppression
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Supprimer toutes les données «{category.label}» ? Action
                        irréversible.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel data-ocid="settings.delete.cancel_button">
                        Annuler
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleClearCategory(category.key)}
                        data-ocid="settings.delete.confirm_button"
                      >
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base text-destructive">
            Zone dangereuse
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" data-ocid="settings.reset.button">
                <Trash2 className="mr-2 h-4 w-4" />
                Tout supprimer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent data-ocid="settings.reset.dialog">
              <AlertDialogHeader>
                <AlertDialogTitle>Réinitialisation complète</AlertDialogTitle>
                <AlertDialogDescription>
                  Supprimer TOUTES les données : favoris, transactions, lignes,
                  targets et préférences. Action irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-ocid="settings.reset.cancel_button">
                  Annuler
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClearAll}
                  data-ocid="settings.reset.confirm_button"
                >
                  Tout supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Export modal */}
      <AlertDialog open={exportOpen} onOpenChange={setExportOpen}>
        <AlertDialogContent
          className="max-w-2xl"
          data-ocid="settings.export.dialog"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Données exportées</AlertDialogTitle>
            <AlertDialogDescription>
              Copiez ces données pour les sauvegarder
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={exportData}
            readOnly
            className="min-h-[200px] font-mono text-xs"
          />
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setExportOpen(false)}
              data-ocid="settings.export.close_button"
            >
              Fermer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
