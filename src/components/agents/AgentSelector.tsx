import { Agent } from "@/lib/api";
import { Check, ChevronDown, User } from "lucide-react";
import * as React from "react";
import clsx from "clsx";

interface AgentSelectorProps {
  agents: Agent[];
  selectedAgent: Agent | null;
  onSelect: (agent: Agent) => void;
}

export default function AgentSelector({
  agents,
  selectedAgent,
  onSelect,
}: AgentSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  if (!agents || agents.length === 0) {
    return (
      <div className="p-4 bg-neutral-50 rounded-xl border border-dashed border-neutral-200 text-sm text-neutral-400 text-center">
        No hay agentes activos.
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-300",
          isOpen
            ? "bg-white border-indigo-600 ring-4 ring-indigo-50 shadow-sm"
            : "bg-white border-neutral-200 hover:border-neutral-300 hover:shadow-md active:scale-[0.98]",
        )}
      >
        <div className="flex items-center gap-4 overflow-hidden">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
            <User className="w-5 h-5" />
          </div>
          <div className="text-left">
            <span className="block text-sm font-bold text-neutral-900 truncate">
              {selectedAgent ? selectedAgent.name : "Seleccionar Agente"}
            </span>
            {selectedAgent && (
              <span className="block text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                Conectado
              </span>
            )}
          </div>
        </div>
        <ChevronDown
          className={clsx(
            "w-5 h-5 text-neutral-400 transition-transform duration-300",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute z-20 w-full mt-3 bg-white border border-neutral-200 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
          <ul className="max-h-72 overflow-y-auto py-2">
            {agents.map((agent) => (
              <li key={agent.id}>
                <button
                  onClick={() => {
                    onSelect(agent);
                    setIsOpen(false);
                  }}
                  className={clsx(
                    "w-full flex items-center justify-between px-5 py-4 text-left hover:bg-neutral-50 transition-colors group",
                    selectedAgent?.id === agent.id && "bg-neutral-50/80",
                  )}
                >
                  <div className="flex flex-col">
                    <span
                      className={clsx(
                        "text-sm font-bold transition-colors",
                        selectedAgent?.id === agent.id
                          ? "text-indigo-600"
                          : "text-neutral-900 group-hover:text-indigo-600",
                      )}
                    >
                      {agent.name}
                    </span>
                    <span className="text-xs text-neutral-400 capitalize mt-0.5">
                      {agent.status}
                    </span>
                  </div>
                  {selectedAgent?.id === agent.id && (
                    <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Check className="w-3 h-3 stroke-[3px]" />
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
