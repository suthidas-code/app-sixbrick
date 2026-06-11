import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "เข้าสู่ระบบ - SIXBRICK",
  description: "เข้าสู่ระบบจัดการกิจกรรม SIXBRICK",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
