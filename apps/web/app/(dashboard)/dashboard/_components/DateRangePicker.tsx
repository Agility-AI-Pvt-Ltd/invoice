// apps/web/app/(dashboard)/dashboard/_components/DateRangePicker.tsx
import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";

type DateRangePickerProps = {
  from: string; // YYYY-MM
  to: string;   // YYYY-MM
  onChange: (from: string, to: string) => void;
};

export default function DateRangePicker({ from, to, onChange }: DateRangePickerProps) {
  // Convert "YYYY-MM" strings to Date objects (first day of month)
  const parse = (value: string) => {
    const [year, month] = value.split("-").map(Number);
    return new Date(year, month - 1, 1);
  };

  const [startDate, setStartDate] = useState<Date>(parse(from));
  const [endDate, setEndDate] = useState<Date>(parse(to));

  const handleApply = () => {
    const fmt = (d: Date) => format(d, "yyyy-MM");
    onChange(fmt(startDate), fmt(endDate));
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col">
        <label className="text-xs font-medium text-muted-foreground mb-1">From</label>
        <DatePicker
          selected={startDate}
          onChange={(date: Date) => setStartDate(date)}
          dateFormat="yyyy-MM"
          showMonthYearPicker
          className="bg-background border border-border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div className="flex flex-col">
        <label className="text-xs font-medium text-muted-foreground mb-1">To</label>
        <DatePicker
          selected={endDate}
          onChange={(date: Date) => setEndDate(date)}
          dateFormat="yyyy-MM"
          showMonthYearPicker
          className="bg-background border border-border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <button
        type="button"
        onClick={handleApply}
        className="px-3 py-1 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
      >
        Apply
      </button>
    </div>
  );
}
