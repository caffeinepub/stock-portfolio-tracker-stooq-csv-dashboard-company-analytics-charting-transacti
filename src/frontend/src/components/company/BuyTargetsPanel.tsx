import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { BuyTarget, Transaction } from "../../lib/types";

interface BuyTargetsPanelProps {
  targets: BuyTarget[];
  transactions: Transaction[];
  onAdd: (target: Omit<BuyTarget, "id" | "ticker">) => void;
  onUpdate: (
    id: string,
    updates: Partial<Omit<BuyTarget, "id" | "ticker">>,
  ) => void;
  onDelete: (id: string) => void;
}

export function BuyTargetsPanel({
  targets,
  transactions,
  onAdd,
  onUpdate,
  onDelete,
}: BuyTargetsPanelProps) {
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");

  const buyTransactions = transactions.filter((t) => t.type === "BUY");

  const handleSubmit = () => {
    if (!price || !quantity) return;
    onAdd({
      price: Number.parseFloat(price),
      quantity: Number.parseFloat(quantity),
      status: "Planned",
      note: note || undefined,
    });
    setPrice("");
    setQuantity("");
    setNote("");
    setOpen(false);
  };

  const handleToggleStatus = (target: BuyTarget) => {
    onUpdate(target.id, {
      status: target.status === "Planned" ? "Executed" : "Planned",
    });
  };

  const handleLinkTransaction = (targetId: string, transactionId: string) => {
    onUpdate(targetId, {
      linkedTransactionId: transactionId,
      status: "Executed",
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Targets d'achat</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" data-ocid="targets.open_modal_button">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter
            </Button>
          </DialogTrigger>
          <DialogContent data-ocid="targets.dialog">
            <DialogHeader>
              <DialogTitle>Ajouter un target</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="target-price">Prix cible</Label>
                <Input
                  id="target-price"
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Ex: 140.00"
                  data-ocid="targets.input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target-quantity">Quantité</Label>
                <Input
                  id="target-quantity"
                  type="number"
                  step="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Ex: 10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target-note">Note (optionnel)</Label>
                <Textarea
                  id="target-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Notes sur ce target..."
                  data-ocid="targets.textarea"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                data-ocid="targets.cancel_button"
              >
                Annuler
              </Button>
              <Button onClick={handleSubmit} data-ocid="targets.submit_button">
                Ajouter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {targets.length === 0 ? (
          <p
            className="text-center text-sm text-muted-foreground"
            data-ocid="targets.empty_state"
          >
            Aucun target configuré
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prix</TableHead>
                <TableHead>Quantité</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Transaction liée</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {targets.map((target, i) => (
                <TableRow key={target.id} data-ocid={`targets.item.${i + 1}`}>
                  <TableCell>{target.price.toFixed(2)} €</TableCell>
                  <TableCell>{target.quantity}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        target.status === "Executed" ? "default" : "secondary"
                      }
                    >
                      {target.status === "Executed" ? "Exécuté" : "Planifié"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {target.linkedTransactionId ? (
                      <span className="text-sm text-muted-foreground">Lié</span>
                    ) : target.status === "Executed" ? (
                      <Select
                        onValueChange={(txId) =>
                          handleLinkTransaction(target.id, txId)
                        }
                      >
                        <SelectTrigger className="h-8 w-32">
                          <SelectValue placeholder="Lier..." />
                        </SelectTrigger>
                        <SelectContent>
                          {buyTransactions.map((tx) => (
                            <SelectItem key={tx.id} value={tx.id}>
                              {new Date(tx.date).toLocaleDateString("fr-FR")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleStatus(target)}
                        data-ocid={`targets.toggle.${i + 1}`}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(target.id)}
                        data-ocid={`targets.delete_button.${i + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
