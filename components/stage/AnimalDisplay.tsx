"use client";

import Image from "next/image";
import type { AnimalId } from "@/lib/conductor/types";

/** 左 → 右：青蛙、海獺、小鳥（三直欄拼滿螢幕寬） */
const ANIMALS: AnimalId[] = ["frog", "otter", "bird"];

type Props = {
  activeAnimal: AnimalId;
  isPinching: boolean;
};

export function AnimalDisplay({ activeAnimal, isPinching }: Props) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex overflow-hidden bg-[#050508]">
      {ANIMALS.map((id) => {
        const isActive = id === activeAnimal;
        const showOpen = isActive && isPinching;

        return (
          <div
            key={id}
            className={`relative h-full min-w-0 flex-1 overflow-hidden transition-[filter,opacity] duration-500 ease-out ${
              isActive
                ? "z-10 brightness-105"
                : "z-0 brightness-[0.45] saturate-[0.8]"
            }`}
          >
            <Image
              src={
                showOpen
                  ? `/images/${id}-open.png`
                  : `/images/${id}-close.png`
              }
              alt={id}
              fill
              className="object-cover object-center"
              sizes="34vw"
              priority={id === "otter"}
            />
          </div>
        );
      })}

      <div className="pointer-events-none absolute inset-y-0 left-[33.333%] z-20 w-px bg-black/40" />
      <div className="pointer-events-none absolute inset-y-0 left-[66.666%] z-20 w-px bg-black/40" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[18vh] bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
    </div>
  );
}
