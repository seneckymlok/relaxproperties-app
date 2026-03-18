import { cookies } from "next/headers";
import { Inter, Libre_Baskerville } from "next/font/google";
import "../globals.css";
import AdminSidebar from "@/components/admin/AdminSidebar";

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin", "latin-ext"],
    display: "swap",
});

const libreBaskerville = Libre_Baskerville({
    variable: "--font-libre-baskerville",
    subsets: ["latin", "latin-ext"],
    display: "swap",
    weight: ["400", "700"],
    style: ["normal", "italic"],
});

export const metadata = {
    title: "Admin | Relax Properties",
};

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const session = cookieStore.get("admin_session");
    const isAuthenticated = session?.value === "authenticated";

    return (
        <html lang="sk">
            <body className={`${inter.variable} ${libreBaskerville.variable} min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)]`}>
                {isAuthenticated && <AdminSidebar />}
                <main className={isAuthenticated ? "ml-60 min-h-screen" : "min-h-screen"}>
                    <div className={isAuthenticated ? "p-6 lg:p-8" : ""}>
                        {children}
                    </div>
                </main>
            </body>
        </html>
    );
}
