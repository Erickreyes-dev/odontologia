"use client";

import { signOut } from "@/auth";
import { useRef } from "react";
import { LogoutIcon, LogoutIconHandle } from "./ui/logout";
import { useI18n } from "./i18n/i18n-provider";

const LogoutButton = () => {
    const logoutIconRef = useRef<LogoutIconHandle>(null);
    const { t } = useI18n();

    const handleMouseEnter = () => {
        logoutIconRef.current?.startAnimation();
    };

    const handleMouseLeave = () => {
        logoutIconRef.current?.stopAnimation();
    };

    const handleLogout = async () => {
        await signOut();
    };

    return (
        <button
            onClick={handleLogout}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="w-full flex items-center justify-between"
        >
            <span>{t("nav.logout")}</span>
            <LogoutIcon ref={logoutIconRef} size={20} />
        </button>
    );
};

export default LogoutButton;
