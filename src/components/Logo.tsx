import Image from "next/image";
import { Group, Text } from "@mantine/core";
import classes from "./Logo.module.css";

/** Símbolo da marca usando a logo padrão do projeto (public/logo.png). */
export function Marca({ tamanho, className }: { tamanho: number; className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="InStartups"
      width={tamanho}
      height={tamanho}
      priority
      className={className}
      style={{
        objectFit: "contain",
      }}
    />
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
