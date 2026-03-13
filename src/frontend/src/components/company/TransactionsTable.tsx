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
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Transaction } from "../../lib/types";

interface TransactionsTableProps {
  transactions: Transaction[];
  onAdd: (transaction: Omit<Transaction, "id">) => void;
  onDelete: (id: string) => void;
  ticker: string;
}

export function TransactionsTable({
  transactions,
  onAdd,
  onDelete,
  ticker,
}: TransactionsTableProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"BUY" | "SELL">("BUY");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = () => {
    if (!quantity || !price || !date) return;
    onAdd({
      ticker,
      type,
      date: new Date(date),
      quantity: Number.parseFloat(quantity),
      price: Number.parseFloat(price),
      note: note || undefined,
    });
    setQuantity("");
    setPrice("");
    setNote("");
    setOpen(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Transactions</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" data-ocid="tx.open_modal_button">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter
            </Button>
          </DialogTrigger>
          <DialogContent data-ocid="tx.dialog">
            <DialogHeader>
              <DialogTitle>Ajouter une transaction</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tx-type">Type</Label>
                <Select
                  value={type}
                  onValueChange={(v) => setType(v as "BUY" | "SELL")}
                >
                  <SelectTrigger id="tx-type" data-ocid="tx.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BUY">Achat</SelectItem>
                    <SelectItem value="SELL">Vente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tx-date">Date</Label>
                <Input
                  id="tx-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  data-ocid="tx.input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tx-quantity">Quantité</Label>
                <Input
                  id="tx-quantity"
                  type="number"
                  step="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Ex: 10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tx-price">Prix unitaire</Label>
                <Input
                  id="tx-price"
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Ex: 150.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tx-note">Note (optionnel)</Label>
                <Textarea
                  id="tx-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Notes sur cette transaction..."
                  data-ocid="tx.textarea"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                data-ocid="tx.cancel_button"
              >
                Annuler
              </Button>
              <Button onClick={handleSubmit} data-ocid="tx.submit_button">
                Ajouter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p
            className="text-center text-sm text-muted-foreground"
            data-ocid="tx.empty_state"
          >
            Aucune transaction enregistrée
          </p>
        ) : (
          <Table data-ocid="tx.table">
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Quantité</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx, i) => (
                <TableRow key={tx.id} data-ocid={`tx.item.${i + 1}`}>
                  <TableCell>
                    <Badge
                      variant={tx.type === "BUY" ? "default" : "secondary"}
                    >
                      {tx.type === "BUY" ? "Achat" : "Vente"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(tx.date).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell>{tx.quantity}</TableCell>
                  <TableCell>{tx.price.toFixed(2)} €</TableCell>
                  <TableCell>{(tx.quantity * tx.price).toFixed(2)} €</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(tx.id)}
                      data-ocid={`tx.delete_button.${i + 1}`}
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
