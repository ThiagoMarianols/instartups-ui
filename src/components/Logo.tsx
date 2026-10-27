import { Group, Text } from "@mantine/core";
import classes from "./Logo.module.css";

/** Símbolo da marca (mesmo desenho de public/icons/logo.svg), já com fundo próprio. */
export function Marca({ tamanho, className }: { tamanho: number; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" width={tamanho} height={tamanho} className={className} aria-hidden="true" focusable="false">
      <rect width="64" height="64" rx="14" fill="#0F2A44" />
      <path d="M15 49 C 22 36, 29 31, 39 25" fill="none" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" />
      <circle cx="15" cy="49" r="6" fill="#FFFFFF" />
      <circle cx="39" cy="25" r="8" fill="#FF6B4A" />
      <path d="M42 8.3 A17 17 0 0 1 55.7 22" fill="none" stroke="#FF6B4A" strokeWidth="5.5" strokeLinecap="round" />
    </svg>
  );
}

interface LogoProps {
  tamanho?: "sm" | "md";
}

export function Logo({ tamanho = "sm" }: LogoProps) {
  const md = tamanho === "md";
  return (
    <Group gap={10} wrap="nowrap">
      <Marca tamanho={md ? 34 : 30} className={classes.marca} />
      <Text component="span" fz={md ? 21 : 19} fw={700} style={{ letterSpacing: "-0.02em" }} c="inherit">
        InStartups
      </Text>
    </Group>
  );
}
