import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { HorizontalLine } from "../../lib/types";

interface HorizontalLinesPanelProps {
  lines: HorizontalLine[];
  onAdd: (line: Omit<HorizontalLine, "id" | "ticker">) => void;
  onDelete: (id: string) => void;
}

export function HorizontalLinesPanel({
  lines,
  onAdd,
  onDelete,
}: HorizontalLinesPanelProps) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [price, setPrice] = useState("");
  const [color, setColor] = useState("#3b82f6");

  const presets = [
    { label: "Support bas", color: "#22c55e" },
    { label: "Résistance haute", color: "#ef4444" },
    { label: "Prix achat cible", color: "#3b82f6" },
    { label: "Prix vente cible", color: "#f59e0b" },
  ];

  const handleSubmit = () => {
    if (!label || !price) return;
    onAdd({ label, price: Number.parseFloat(price), color });
    setLabel("");
    setPrice("");
    setColor("#3b82f6");
    setOpen(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Lignes horizontales</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" data-ocid="lines.open_modal_button">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter
            </Button>
          </DialogTrigger>
          <DialogContent data-ocid="lines.dialog">
            <DialogHeader>
              <DialogTitle>Ajouter une ligne</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Préréglages</Label>
                <div className="grid grid-cols-2 gap-2">
                  {presets.map((preset) => (
                    <Button
                      key={preset.label}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setLabel(preset.label);
                        setColor(preset.color);
                      }}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hl-label">Label</Label>
                <Input
                  id="hl-label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Ex: Support"
                  data-ocid="lines.input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hl-price">Prix</Label>
                <Input
                  id="hl-price"
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Ex: 150.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hl-color">Couleur</Label>
                <Input
                  id="hl-color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                data-ocid="lines.cancel_button"
              >
                Annuler
              </Button>
              <Button onClick={handleSubmit} data-ocid="lines.submit_button">
                Ajouter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {lines.length === 0 ? (
          <p
            className="text-center text-sm text-muted-foreground"
            data-ocid="lines.empty_state"
          >
            Aucune ligne configurée
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line, i) => (
                <TableRow key={line.id} data-ocid={`lines.item.${i + 1}`}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: line.color }}
                      />
                      {line.label}
                    </div>
                  </TableCell>
                  <TableCell>{line.price.toFixed(2)} €</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(line.id)}
                      data-ocid={`lines.delete_button.${i + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
