"use client";

import { useState, type ReactNode } from "react";
import { MantineProvider } from "@mantine/core";
import { DatesProvider } from "@mantine/dates";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { theme } from "@/theme/theme";
import { ErroApi } from "@/lib/api/erros";
import { AvisoInstalacao } from "@/components/pwa/AvisoInstalacao";

dayjs.locale("pt-br");

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: (falhas, erro) =>
              falhas < 2 && !(erro instanceof ErroApi && erro.status < 500),
          },
        },
      }),
  );

  return (
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <DatesProvider settings={{ locale: "pt-br", firstDayOfWeek: 0 }}>
        <Notifications position="top-right" zIndex={1000} />
        <QueryClientProvider client={queryClient}>
          <ModalsProvider labels={{ confirm: "Confirmar", cancel: "Cancelar" }}>{children}</ModalsProvider>
        </QueryClientProvider>
        <AvisoInstalacao />
      </DatesProvider>
    </MantineProvider>
  );
}
