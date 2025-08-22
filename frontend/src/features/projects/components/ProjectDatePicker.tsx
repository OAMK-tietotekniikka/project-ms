import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/components/ui/button";
import { Calendar } from "@/shared/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/shared/components/ui/popover";
import { type DateRange } from "react-day-picker";
import { fi, enGB, sv } from "react-day-picker/locale";

interface DatePickerWithRangeProps {
	dateRange: DateRange | undefined;
	onDateChange: (dateRange: DateRange | undefined) => void;
}

export const ProjectDatePicker: React.FC<DatePickerWithRangeProps> = ({
	dateRange,
	onDateChange,
}) => {
	const { t, i18n } = useTranslation();
	const [startPopoverOpen, setStartPopoverOpen] = useState(false);
	const [endPopoverOpen, setEndPopoverOpen] = useState(false);

	const actualLocale = i18n.language === "fi" ? fi : enGB;
	const currentLanguage = i18n.language;

	const formatDate = (date: Date) => {
		const options: Intl.DateTimeFormatOptions = {
			year: "numeric",
			month: "long",
			day: "numeric",
		};

		return date.toLocaleDateString(currentLanguage, options);
	};

	const handleStartDateSelect = (date: Date | undefined) => {
		// When a new start date is chosen after the end date, clear the end date.
		if (date && dateRange?.to && date > dateRange.to) {
			onDateChange({ from: date, to: undefined });
		} else {
			onDateChange({ from: date, to: dateRange?.to });
		}
		setStartPopoverOpen(false); // Close the popover on selection
	};

	const handleEndDateSelect = (date: Date | undefined) => {
		onDateChange({ from: dateRange?.from, to: date });
		setEndPopoverOpen(false); // Close the popover on selection
	};

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
			{/* Start Date Picker */}
			<Popover open={startPopoverOpen} onOpenChange={setStartPopoverOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						className="w-full justify-start text-left font-normal"
					>
						{dateRange?.from ? (
							formatDate(dateRange.from)
						) : (
							<span>{t("startDate")}</span>
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0" align="start">
					<Calendar
						mode="single"
						selected={dateRange?.from}
						onSelect={handleStartDateSelect}
						locale={actualLocale}
						showOutsideDays={false}
						fixedWeeks
					/>
				</PopoverContent>
			</Popover>

			{/* End Date Picker */}
			<Popover open={endPopoverOpen} onOpenChange={setEndPopoverOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						className="w-full justify-start text-left font-normal"
						disabled={!dateRange?.from}
					>
						{dateRange?.to ? (
							formatDate(dateRange.to)
						) : (
							<span>{t("dueDate")}</span>
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0" align="start">
					<Calendar
						mode="single"
						selected={dateRange?.to}
						onSelect={handleEndDateSelect}
						disabled={dateRange?.from ? { before: dateRange.from } : undefined}
						locale={actualLocale}
						showOutsideDays={false}
						fixedWeeks
					/>
				</PopoverContent>
			</Popover>
		</div>
	);
};
