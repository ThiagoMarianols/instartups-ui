import { ShellApp } from "@/components/app/ShellApp";

export default function LayoutApp({ children }: LayoutProps<"/">) {
  return <ShellApp>{children}</ShellApp>;
}
