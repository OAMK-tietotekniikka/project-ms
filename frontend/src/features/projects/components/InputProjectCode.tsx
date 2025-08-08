import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/shared/components/ui/dialog";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSeparator,
	InputOTPSlot,
} from "@/shared/components/ui/input-otp";

interface InputProjectCodeDialogProps {
	onSubmit?: (code: string) => void;
	onCancel?: () => void;
	trigger?: React.ReactNode;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}

const InputProjectCodeDialog = ({
	onSubmit,
	onCancel,
	trigger,
	open,
	onOpenChange,
}: InputProjectCodeDialogProps) => {
	const { t } = useTranslation();
	const [code, setCode] = useState("");
	const [error, setError] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		// Validation
		if (code.length !== 6) {
			setError(t("join_code_error") || "Join code must be 9 characters");
			return;
		}

		setError("");
		setCode("");
		toast.success(t("toast_success"));

		// Call parent callback if provided
		if (onSubmit) {
			onSubmit(code);
		}

		// Close dialog after successful submission
		if (onOpenChange) {
			onOpenChange(false);
		}
	};

	const handleCodeChange = (value: string) => {
		setCode(value);
		// Clear error when user starts typing
		if (error) {
			setError("");
		}
	};

	const handleCancel = () => {
		// Reset form state
		setCode("");
		setError("");

		if (onCancel) {
			onCancel();
		}

		if (onOpenChange) {
			onOpenChange(false);
		}
	};

	const handleOpenChange = (newOpen: boolean) => {
		if (!newOpen) {
			// Reset form when dialog closes
			setCode("");
			setError("");
		}

		if (onOpenChange) {
			onOpenChange(newOpen);
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			{trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="text-center">
						{t("projects_joinCode")}
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-6">
					<div className="space-y-4">
						<div className="flex justify-center">
							<InputOTP maxLength={6} value={code} onChange={handleCodeChange}>
								<InputOTPGroup>
									<InputOTPSlot index={0} />
									<InputOTPSlot index={1} />
									<InputOTPSlot index={2} />
								</InputOTPGroup>
								<InputOTPSeparator />
								<InputOTPGroup>
									<InputOTPSlot index={3} />
									<InputOTPSlot index={4} />
									<InputOTPSlot index={5} />
								</InputOTPGroup>
							</InputOTP>
						</div>
					</div>

					<div className="flex justify-center">
						<div className="flex flex-col gap-3 w-full max-w-[280px]">
							<Button type="submit" className="w-full hover:cursor-pointer">
								{t("join")}
							</Button>
						</div>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
};

export default InputProjectCodeDialog;
