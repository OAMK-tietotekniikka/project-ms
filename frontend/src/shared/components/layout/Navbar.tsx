import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
	House,
	FolderPlus,
	Languages,
	LogOut,
	Users,
	GraduationCap,
	BookText,
} from "lucide-react";
import { cn } from "@/shared/utils/utils";
import { useRole } from "@/core/auth/useUserRole.hook";
import { useLogout } from "@/core/auth/useLogout.hook";

const NavBar: React.FC = () => {
	const { t, i18n } = useTranslation();
	const { userRole } = useRole();
	const navigate = useNavigate();
	const { logout } = useLogout();
	let role = userRole;

	const changeLanguage = () => {
		const currentLang = i18n.language;
		i18n.changeLanguage(currentLang === "en" ? "fi" : "en");
	};

	const handleLogout = async () => {
		try {
			await logout();
		} catch (error) {
			console.error("Logout failed:", error);
		}
	};

	const NavItem = ({
		to,
		icon: Icon,
		label,
		onClick,
	}: {
		to?: string;
		icon: React.ElementType;
		label: string;
		onClick?: () => void;
	}) => {
		const baseClasses =
			"flex items-center justify-center w-12 h-12 rounded-xl transition-all hover:bg-accent";

		if (onClick) {
			return (
				<button
					onClick={onClick}
					className={cn(baseClasses, "text-muted-foreground")}
					title={label}
				>
					<Icon className="h-5 w-5" />
				</button>
			);
		}

		return (
			<NavLink
				to={to!}
				className={({ isActive }) =>
					cn(
						baseClasses,
						isActive
							? "bg-accent text-accent-foreground"
							: "text-muted-foreground",
					)
				}
				title={label}
			>
				<Icon className="h-5 w-5" />
			</NavLink>
		);
	};

	// Navigation items array to avoid duplication
	const getNavItems = () => {
		const items = [
			{
				to: role === "student" || role === "teacher" ? "/" : "/login",
				icon: House,
				label: t("dashb"),
			},
		];

		if (role === "student") {
			items.push({
				to: "/projects/create",
				icon: FolderPlus,
				label: t("createProj"),
			});
		}

		if (role === "teacher") {
			items.push(
				{
					to: "/teachers",
					icon: GraduationCap,
					label: t("teachers"),
				},
				{
					to: "/students",
					icon: Users,
					label: t("studentsMain"),
				},
				{
					to: "/projects",
					icon: BookText,
					label: t("companies"),
				},
			);
		}

		return items;
	};

	const navItems = getNavItems();

	return (
		<nav
			className={cn(
				"fixed z-50 bg-background/95 backdrop-blur-sm border border-border shadow-lg",
				// Mobile: bottom horizontal
				"bottom-0 left-0 right-0 border-t rounded-t-xl p-2",
				// Desktop: right vertical
				"md:right-4 md:top-1/2 md:transform md:-translate-y-1/2 md:bottom-auto md:left-auto md:border md:rounded-xl",
			)}
		>
			<div
				className={cn(
					"flex gap-2",
					// Mobile: horizontal
					"justify-center max-w-screen-sm mx-auto",
					// Desktop: vertical
					"md:flex-col md:items-center md:max-w-none md:mx-0",
				)}
			>
				{navItems.map((item, index) => (
					<NavItem key={index} {...item} />
				))}

				{/* Separator - only on desktop */}
				<div className="hidden md:block w-8 h-px bg-border my-1" />

				{/* Language Toggle */}
				<NavItem
					icon={Languages}
					label={`${t("language")} (${i18n.language.toUpperCase()})`}
					onClick={changeLanguage}
				/>

				{/* Sign Out */}
				<NavItem
					icon={LogOut}
					label={t("logout")}
					onClick={handleLogout} // add logout
				/>
			</div>
		</nav>
	);
};

export default NavBar;
