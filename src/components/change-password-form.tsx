"use client";
import { useState } from "react";
import { Dialog as ConfirmDialog, DialogContent as ConfirmDialogContent, DialogHeader as ConfirmDialogHeader, DialogTitle as ConfirmDialogTitle, DialogFooter as ConfirmDialogFooter } from "@/components/ui/dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { changePassword } from "@/lib/api/authHelper";
import { getProfile } from "@/lib/api/authHelper";
import { useRouter } from "next/navigation";

interface ChangePasswordFormProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ open, onOpenChange }) => {
	const user = getProfile();
	const router = useRouter();
	const [oldPassword, setOldPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [showOld, setShowOld] = useState(false);
	const [showNew, setShowNew] = useState(false);
	const [showConfirmPw, setShowConfirmPw] = useState(false);

	const handleFormSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (newPassword !== confirmPassword) {
			toast.error("Password baru dan konfirmasi tidak sama.");
			return;
		}
		setShowConfirm(true);
	};

	const handleChangePassword = async () => {
		setLoading(true);
		try {
			await changePassword(user.id, user.email, oldPassword, newPassword);
			toast.success("Ganti password berhasil, silahkan login ulang.");
			setOldPassword("");
			setNewPassword("");
			setConfirmPassword("");
			onOpenChange(false);
			setTimeout(() => {
				router.replace("/login");
			}, 500);
		} catch (err) {
			// @ts-expect-error: error object may have response.data.error
			const errorMsg = err?.response?.data?.error || "Gagal ganti password.";
			if (errorMsg.toLowerCase().includes("token tidak valid")) {
				toast.error("Sesi anda sudah habis, silahkan login ulang.");
				localStorage.removeItem("user");
				setTimeout(() => {
					router.replace("/login");
				}, 500);
				return;
			}
			toast.error(errorMsg);
		} finally {
			setLoading(false);
			setShowConfirm(false);
		}
	};

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="max-w-md rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white via-gray-50 to-gray-200 dark:from-black dark:via-gray-900 dark:to-gray-800">
					<DialogHeader>
						<DialogTitle className="text-2xl font-bold text-blue-700 dark:text-blue-300 flex items-center gap-2">
							<span role="img" aria-label="key">🔒</span> Ganti Password
						</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleFormSubmit} className="space-y-6">
						<div className="flex flex-col gap-2">
							<Label htmlFor="oldPassword" className="font-semibold text-gray-700 dark:text-gray-200">Password Lama</Label>
							<div className="relative">
								<Input id="oldPassword" type={showOld ? "text" : "password"} value={oldPassword} onChange={e => setOldPassword(e.target.value)} required disabled={loading} placeholder="Masukkan password lama" className="border-2 rounded-lg px-3 py-2 focus:border-blue-500 pr-10" />
								<button type="button" tabIndex={-1} className="absolute right-2 top-2 text-gray-500" onClick={() => setShowOld(v => !v)}>
									{showOld ? <EyeOff size={20} /> : <Eye size={20} />}
								</button>
							</div>
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor="newPassword" className="font-semibold text-gray-700 dark:text-gray-200">Password Baru</Label>
							<div className="relative">
								<Input id="newPassword" type={showNew ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} required disabled={loading} minLength={8} placeholder="Password baru minimal 8 karakter" className="border-2 rounded-lg px-3 py-2 focus:border-blue-500 pr-10" />
								<button type="button" tabIndex={-1} className="absolute right-2 top-2 text-gray-500" onClick={() => setShowNew(v => !v)}>
									{showNew ? <EyeOff size={20} /> : <Eye size={20} />}
								</button>
							</div>
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor="confirmPassword" className="font-semibold text-gray-700 dark:text-gray-200">Konfirmasi Password Baru</Label>
							<div className="relative">
								<Input id="confirmPassword" type={showConfirmPw ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required disabled={loading} minLength={8} placeholder="Ulangi password baru" className="border-2 rounded-lg px-3 py-2 focus:border-blue-500 pr-10" />
								<button type="button" tabIndex={-1} className="absolute right-2 top-2 text-gray-500" onClick={() => setShowConfirmPw(v => !v)}>
									{showConfirmPw ? <EyeOff size={20} /> : <Eye size={20} />}
								</button>
							</div>
						</div>
						<DialogFooter className="flex gap-2 justify-end mt-6">
							<Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="rounded-lg px-4 py-2">Batal</Button>
							<Button type="submit" disabled={loading} className="rounded-lg px-4 py-2 bg-blue-700 text-white hover:bg-blue-800 font-semibold shadow-md">{loading ? "Menyimpan..." : "Ya, Ganti Password"}</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
			<ConfirmDialog open={showConfirm} onOpenChange={setShowConfirm}>
				<ConfirmDialogContent className="max-w-sm rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
					<ConfirmDialogHeader>
						<ConfirmDialogTitle className="text-lg font-bold text-blue-700 dark:text-blue-300">Konfirmasi Ganti Password</ConfirmDialogTitle>
					</ConfirmDialogHeader>
					<div className="py-4 text-gray-700 dark:text-gray-200">Apakah Anda yakin ingin mengganti password?</div>
					<ConfirmDialogFooter className="flex gap-2 justify-end">
						<Button type="button" variant="outline" onClick={() => setShowConfirm(false)} disabled={loading} className="rounded-lg px-4 py-2">Batal</Button>
						<Button type="button" onClick={handleChangePassword} disabled={loading} className="rounded-lg px-4 py-2 bg-blue-700 text-white hover:bg-blue-800 font-semibold shadow-md">{loading ? "Memproses..." : "Ya, Ganti Password"}</Button>
					</ConfirmDialogFooter>
				</ConfirmDialogContent>
			</ConfirmDialog>
		</>
	);
};

export default ChangePasswordForm;
