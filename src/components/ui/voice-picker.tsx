"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
// Removed Orb import to avoid WebGL context issues - using a simple colored circle instead

export interface Voice {
  voice_id: string;
  name: string;
  preview_url?: string;
}

interface VoicePickerProps {
  voices: Voice[];
  value?: string;
  onValueChange?: (voiceId: string) => void;
  placeholder?: string;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function VoicePicker({
  voices,
  value,
  onValueChange,
  placeholder = "Select a voice...",
  className,
  open: controlledOpen,
  onOpenChange,
}: VoicePickerProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const selectedVoice = voices.find((v) => v.voice_id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selectedVoice ? selectedVoice.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search voices..." />
          <CommandList>
            <CommandEmpty>No voices found.</CommandEmpty>
            {voices.map((voice) => (
              <CommandItem
                key={voice.voice_id}
                value={voice.name}
                onSelect={() => {
                  onValueChange?.(voice.voice_id);
                  setOpen(false);
                }}
                className="flex items-center gap-3"
              >
                <div className="h-12 w-12 rounded-full shrink-0 bg-linear-to-br from-purple-500 via-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-lg">
                  {voice.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{voice.name}</div>
                  {voice.preview_url && (
                    <div className="text-xs text-muted-foreground">Has preview</div>
                  )}
                </div>
                <Check
                  className={cn(
                    "h-4 w-4 shrink-0",
                    value === voice.voice_id ? "opacity-100" : "opacity-0"
                  )}
                />
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

