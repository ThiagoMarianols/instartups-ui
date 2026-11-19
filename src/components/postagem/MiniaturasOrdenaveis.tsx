"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CSSProperties } from "react";
import type { MidiaLocal } from "@/hooks/useMidiasUpload";
import { MiniaturaNova } from "./Miniaturas";
import classes from "./postagem.module.css";

interface Props {
  itens: MidiaLocal[];
  onReordenar: (de: number, para: number) => void;
  onRemover: (chave: string) => void;
  onAjustar: (chave: string) => void;
  style?: CSSProperties;
}

/** Miniaturas do compositor que podem ser arrastadas (mouse, toque ou teclado) para mudar a ordem. */
export function MiniaturasOrdenaveis({ itens, onReordenar, onRemover, onAjustar, style }: Props) {
  const sensores = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // Segurar um instante antes de arrastar: um toque rápido continua rolando a página.
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const posicao = (id: string | number) => itens.findIndex((m) => m.chave === id) + 1;
  const anuncios: Announcements = {
    onDragStart: ({ active }) => `Mídia ${posicao(active.id)} selecionada.`,
    onDragOver: ({ over }) => (over ? `Sobre a posição ${posicao(over.id)}.` : "Fora da lista."),
    onDragEnd: ({ over }) => (over ? `Mídia movida para a posição ${posicao(over.id)}.` : "Mídia solta."),
    onDragCancel: () => "Movimento cancelado.",
  };

  const aoSoltar = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const de = itens.findIndex((m) => m.chave === active.id);
    const para = itens.findIndex((m) => m.chave === over.id);
    if (de >= 0 && para >= 0) onReordenar(de, para);
  };

  return (
    <DndContext
      sensors={sensores}
      collisionDetection={closestCenter}
      onDragEnd={aoSoltar}
      accessibility={{
        announcements: anuncios,
        screenReaderInstructions: {
          draggable: "Para mudar a ordem, pressione espaço, use as setas e pressione espaço de novo para soltar. Esc cancela.",
        },
      }}
    >
      <SortableContext items={itens.map((m) => m.chave)} strategy={rectSortingStrategy}>
        <div className={classes.miniaturas} style={style}>
          {itens.map((m, i) => (
            <ItemOrdenavel
              key={m.chave}
              midia={m}
              posicao={itens.length > 1 ? i + 1 : undefined}
              onRemover={() => onRemover(m.chave)}
              onAjustar={m.erro ? undefined : () => onAjustar(m.chave)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function ItemOrdenavel({
  midia: m,
  posicao,
  onRemover,
  onAjustar,
}: {
  midia: MidiaLocal;
  posicao?: number;
  onRemover: () => void;
  onAjustar?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: m.chave });
  return (
    <MiniaturaNova
      preview={m.preview}
      tipo={m.tipo}
      progresso={m.progresso}
      pronta={Boolean(m.url)}
      erro={m.erro}
      onRemover={onRemover}
      posicao={posicao}
      onAjustar={onAjustar}
      arrasto={{
        ref: setNodeRef,
        style: { transform: CSS.Transform.toString(transform), transition },
        ...attributes,
        ...listeners,
        "aria-label": `Mídia ${posicao ?? 1}${m.tipo === "VIDEO" ? " (vídeo)" : " (foto)"}`,
        arrastando: isDragging,
      }}
    />
  );
}
