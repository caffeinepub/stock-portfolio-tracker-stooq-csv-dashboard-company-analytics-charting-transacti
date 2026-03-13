import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TimeRange } from "../../lib/types";

interface RangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

export function RangeSelector({ value, onChange }: RangeSelectorProps) {
  const ranges: TimeRange[] = ["1Y", "2Y", "3Y", "5Y", "MAX"];

  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as TimeRange)}>
      <TabsList>
        {ranges.map((range) => (
          <TabsTrigger key={range} value={range}>
            {range}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
