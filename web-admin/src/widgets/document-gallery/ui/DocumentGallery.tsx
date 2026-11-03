import { useState } from "react";
import { ImageOff, Maximize2 } from "lucide-react";
import {
  DOCUMENT_GROUPS,
  DOCUMENT_LABELS,
  useApplicationDocument,
  type DocumentSlot,
  type DriverApplication,
} from "@/entities/application";
import { Modal, Skeleton } from "@/shared/ui";

interface TileProps {
  application: DriverApplication;
  slot: DocumentSlot;
  onOpen: (slot: DocumentSlot) => void;
}

function DocumentTile({ application, slot, onOpen }: TileProps) {
  const image = useApplicationDocument(application, slot);
  const label = DOCUMENT_LABELS[slot];

  return (
    <button
      type="button"
      onClick={() => image.data && onOpen(slot)}
      disabled={!image.data}
      aria-label={`Open ${label}`}
      className="group flex flex-col gap-2 text-left focus-visible:outline-none"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-zinc-100 ring-1 ring-zinc-200 group-focus-visible:ring-2 group-focus-visible:ring-brand-500">
        {image.isLoading ? (
          <Skeleton className="size-full rounded-none" />
        ) : image.data ? (
          <>
            <img
              src={image.data}
              alt={label}
              className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
            <span className="absolute top-2 right-2 rounded-md bg-zinc-950/60 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100">
              <Maximize2 className="size-3.5" />
            </span>
          </>
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-1 text-zinc-400">
            <ImageOff className="size-5" />
            <span className="text-xs">Not provided</span>
          </div>
        )}
      </div>
      <span className="text-[13px] font-medium text-zinc-700">{label}</span>
    </button>
  );
}

function Lightbox({
  application,
  slot,
  onClose,
}: {
  application: DriverApplication;
  slot: DocumentSlot;
  onClose: () => void;
}) {
  const image = useApplicationDocument(application, slot);
  return (
    <Modal open onClose={onClose} title={DOCUMENT_LABELS[slot]} size="xl">
      {image.data ? (
        <img
          src={image.data}
          alt={DOCUMENT_LABELS[slot]}
          className="mx-auto max-h-[75vh] w-auto rounded-lg object-contain"
        />
      ) : null}
    </Modal>
  );
}

export function DocumentGallery({ application }: { application: DriverApplication }) {
  const [openSlot, setOpenSlot] = useState<DocumentSlot | null>(null);

  return (
    <div className="space-y-6">
      {DOCUMENT_GROUPS.map((group) => (
        <section key={group.title}>
          <h3 className="mb-3 text-[13px] font-semibold text-zinc-500">{group.title}</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {group.slots.map((slot) => (
              <DocumentTile
                key={slot}
                application={application}
                slot={slot}
                onOpen={setOpenSlot}
              />
            ))}
          </div>
        </section>
      ))}

      {openSlot ? (
        <Lightbox application={application} slot={openSlot} onClose={() => setOpenSlot(null)} />
      ) : null}
    </div>
  );
}
