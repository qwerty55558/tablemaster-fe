import React from "react";

export default function MainLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <div className={"select-none"}>
                {children}
            </div>
        </>
    );
}
