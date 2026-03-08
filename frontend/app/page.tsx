import { redirect } from "next/navigation";
import { DEFAULT_LOCALE } from "@/constants";

export default function Home() {
  redirect(`/${DEFAULT_LOCALE}/auth/login`);
}
