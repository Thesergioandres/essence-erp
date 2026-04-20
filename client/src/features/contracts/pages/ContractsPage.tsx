import { jsPDF } from "jspdf";
import {
  Camera,
  Download,
  Eye,
  FileSignature,
  PenTool,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import Webcam from "react-webcam";
import { useSession } from "../../../hooks/useSession";
import { Button, LoadingSpinner, toast } from "../../../shared/components/ui";
import { contractService } from "../services";
import type { ContractRecord } from "../types/contract.types";

const isAdminRole = (role?: string) =>
  ["admin", "super_admin", "god"].includes(String(role || "").toLowerCase());

const resolveSignerName = (contract: ContractRecord) => {
  if (typeof contract.signedBy === "string") {
    return "Firmante";
  }

  return contract.signedBy?.name || "Firmante";
};

const toInputDateTimeLocal = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
};

export default function ContractsPage() {
  const { user } = useSession();
  const canEditContracts = isAdminRole(user?.role);

  const signatureRef = useRef<SignatureCanvas | null>(null);
  const webcamRef = useRef<Webcam | null>(null);

  const [contracts, setContracts] = useState<ContractRecord[]>([]);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [adminEditMode, setAdminEditMode] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [signedAtInput, setSignedAtInput] = useState("");
  const [photoData, setPhotoData] = useState("");
  const [signatureData, setSignatureData] = useState("");

  const selectedContract = useMemo(
    () =>
      contracts.find(contract => contract._id === selectedContractId) || null,
    [contracts, selectedContractId]
  );

  const isSignedReadOnly = Boolean(selectedContract?.signedAt);
  const isReadOnly = isSignedReadOnly && !adminEditMode;

  const resetDraft = () => {
    setTitle("");
    setContent("");
    setSignedAtInput("");
    setPhotoData("");
    setSignatureData("");
    setAdminEditMode(false);
    signatureRef.current?.clear();
  };

  const hydrateDraftFromContract = (contract: ContractRecord | null) => {
    if (!contract) {
      resetDraft();
      return;
    }

    setTitle(contract.title || "");
    setContent(contract.content || "");
    setSignedAtInput(toInputDateTimeLocal(contract.signedAt));
    setPhotoData(contract.photoData || "");
    setSignatureData(contract.signatureData || "");
    setAdminEditMode(false);
    signatureRef.current?.clear();
  };

  const loadContracts = async () => {
    setLoading(true);
    try {
      const data = await contractService.list();
      setContracts(data);
      if (data.length > 0) {
        setSelectedContractId(current => current || data[0]._id);
      } else {
        setSelectedContractId(null);
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "No se pudieron cargar los contratos"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContracts();
  }, []);

  useEffect(() => {
    hydrateDraftFromContract(selectedContract);
  }, [selectedContractId, selectedContract?._id]);

  const capturePhoto = () => {
    const shot = webcamRef.current?.getScreenshot();
    if (!shot) {
      toast.error("No se pudo capturar la foto. Verifica permisos de camara");
      return;
    }

    setPhotoData(shot);
    toast.success("Foto capturada");
  };

  const clearSignature = () => {
    signatureRef.current?.clear();
    setSignatureData("");
  };

  const readSignatureData = () => {
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      return signatureRef.current.toDataURL("image/png");
    }

    return signatureData;
  };

  const createContract = async () => {
    const finalSignatureData = readSignatureData();

    if (!title.trim()) {
      toast.error("El titulo del contrato es obligatorio");
      return;
    }

    if (!content.trim()) {
      toast.error("El contenido del contrato es obligatorio");
      return;
    }

    if (!finalSignatureData) {
      toast.error("La firma digital es obligatoria");
      return;
    }

    if (!photoData) {
      toast.error("La foto del firmante es obligatoria");
      return;
    }

    try {
      setSaving(true);
      const created = await contractService.create({
        title: title.trim(),
        content: content.trim(),
        signatureData: finalSignatureData,
        photoData,
      });

      setContracts(previous => [created, ...previous]);
      setSelectedContractId(created._id);
      toast.success("Contrato firmado y guardado correctamente");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "No se pudo guardar el contrato"
      );
    } finally {
      setSaving(false);
    }
  };

  const updateContract = async () => {
    if (!selectedContract || !canEditContracts) {
      return;
    }

    const finalSignatureData =
      readSignatureData() || selectedContract.signatureData;

    try {
      setSaving(true);
      const updated = await contractService.update(selectedContract._id, {
        title: title.trim(),
        content: content.trim(),
        signatureData: finalSignatureData,
        photoData: photoData || selectedContract.photoData,
        signedAt: signedAtInput
          ? new Date(signedAtInput).toISOString()
          : undefined,
      });

      setContracts(previous =>
        previous.map(contract =>
          contract._id === updated._id ? updated : contract
        )
      );
      setSelectedContractId(updated._id);
      setAdminEditMode(false);
      toast.success("Contrato actualizado");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "No se pudo actualizar el contrato"
      );
    } finally {
      setSaving(false);
    }
  };

  const removeContract = async () => {
    if (!selectedContract || !canEditContracts) {
      return;
    }

    if (!confirm("Quieres eliminar este contrato de forma permanente?")) {
      return;
    }

    try {
      setDeleting(true);
      await contractService.remove(selectedContract._id);
      const updatedContracts = contracts.filter(
        contract => contract._id !== selectedContract._id
      );
      setContracts(updatedContracts);
      setSelectedContractId(updatedContracts[0]?._id || null);
      if (updatedContracts.length === 0) {
        resetDraft();
      }
      toast.success("Contrato eliminado");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "No se pudo eliminar el contrato"
      );
    } finally {
      setDeleting(false);
    }
  };

  const exportApaPdf = (contract: ContractRecord) => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 72; // 2.54cm
    const maxWidth = pageWidth - margin * 2;
    const lineHeight = 24; // doble espacio APA

    let cursorY = margin;
    let pageNumber = 1;

    const paintHeader = () => {
      doc.setFont("times", "normal");
      doc.setFontSize(12);
      doc.text(String(pageNumber), pageWidth - margin, 40, { align: "right" });
    };

    const ensureSpace = (neededHeight: number) => {
      if (cursorY + neededHeight <= pageHeight - margin) {
        return;
      }

      doc.addPage();
      pageNumber += 1;
      paintHeader();
      cursorY = margin;
    };

    paintHeader();

    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.text(
      String(contract.title || "CONTRATO").toUpperCase(),
      pageWidth / 2,
      cursorY,
      {
        align: "center",
      }
    );
    cursorY += lineHeight * 2;

    doc.setFont("times", "normal");
    const contentLines = doc.splitTextToSize(contract.content || "", maxWidth);
    for (const line of contentLines) {
      ensureSpace(lineHeight);
      doc.text(line, margin, cursorY);
      cursorY += lineHeight;
    }

    cursorY += lineHeight;
    ensureSpace(lineHeight * 4);

    doc.text(`Firmado por: ${resolveSignerName(contract)}`, margin, cursorY);
    cursorY += lineHeight;
    doc.text(
      `Fecha de firma: ${new Date(contract.signedAt).toLocaleString("es-CO")}`,
      margin,
      cursorY
    );
    cursorY += lineHeight;

    const renderImage = (
      label: string,
      imageData: string,
      width: number,
      height: number
    ) => {
      if (!imageData) {
        return;
      }

      ensureSpace(height + lineHeight * 2);
      doc.text(label, margin, cursorY);
      cursorY += lineHeight;
      doc.addImage(imageData, "PNG", margin, cursorY, width, height);
      cursorY += height + lineHeight;
    };

    renderImage("Firma digital:", contract.signatureData, 180, 80);
    renderImage("Registro fotografico:", contract.photoData, 180, 120);

    const safeTitle =
      contract.title
        ?.trim()
        ?.replace(/[^a-z0-9-_]+/gi, "-")
        ?.slice(0, 64) || "contrato";

    doc.save(`apa-${safeTitle}.pdf`);
  };

  if (loading) {
    return (
      <main className="min-h-[60vh] pb-32">
        <div className="mx-auto flex max-w-6xl items-center justify-center py-20">
          <LoadingSpinner />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 pb-32 pt-4 sm:px-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:px-8">
      <aside className="space-y-4 rounded-3xl border border-slate-800 bg-slate-950/90 p-4 shadow-xl sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
              <FileSignature className="h-4 w-4" />
              Contratos
            </p>
            <h1 className="mt-2 text-lg font-semibold text-white">
              Expediente Digital
            </h1>
          </div>
          <Button
            onClick={() => {
              setSelectedContractId(null);
              resetDraft();
            }}
            className="min-h-11 rounded-xl border border-cyan-300/30 bg-cyan-500/20 px-3 text-cyan-100 hover:bg-cyan-500/30"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Nuevo
          </Button>
        </div>

        <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
          {contracts.map(contract => {
            const selected = contract._id === selectedContractId;
            return (
              <button
                key={contract._id}
                onClick={() => setSelectedContractId(contract._id)}
                className={`min-h-11 w-full rounded-2xl border px-3 py-3 text-left transition-all duration-300 ${
                  selected
                    ? "border-cyan-300/50 bg-cyan-500/15 text-cyan-100"
                    : "border-slate-800 bg-slate-900/70 text-slate-200 hover:border-slate-700"
                }`}
              >
                <p className="text-sm font-semibold">{contract.title}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {resolveSignerName(contract)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {new Date(contract.signedAt).toLocaleDateString("es-CO")}
                </p>
              </button>
            );
          })}

          {contracts.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-700 bg-slate-900/70 p-4 text-sm text-slate-400">
              Aun no hay contratos registrados.
            </p>
          )}
        </div>
      </aside>

      <section className="space-y-5 rounded-3xl border border-slate-800 bg-slate-950/90 p-4 shadow-xl sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-white">
            {selectedContract ? "Detalle del Contrato" : "Nuevo Contrato"}
          </h2>

          <div className="flex flex-wrap gap-2">
            {selectedContract && (
              <Button
                onClick={() => exportApaPdf(selectedContract)}
                className="min-h-11 rounded-xl border border-slate-600 bg-slate-800 px-3 text-slate-100 hover:bg-slate-700"
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar PDF APA
              </Button>
            )}

            {selectedContract &&
              canEditContracts &&
              isSignedReadOnly &&
              !adminEditMode && (
                <Button
                  onClick={() => setAdminEditMode(true)}
                  className="min-h-11 rounded-xl border border-amber-300/40 bg-amber-500/15 px-3 text-amber-100 hover:bg-amber-500/25"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Editar como Admin
                </Button>
              )}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-1 text-xs text-slate-400">
            <span>Titulo</span>
            <input
              value={title}
              onChange={event => setTitle(event.target.value)}
              disabled={isReadOnly}
              className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 outline-none transition-all duration-300 focus:border-cyan-400/70 disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="Contrato de distribucion"
            />
          </label>

          <label className="space-y-1 text-xs text-slate-400">
            <span>Fecha de firma</span>
            <input
              value={signedAtInput}
              onChange={event => setSignedAtInput(event.target.value)}
              disabled={isReadOnly || !canEditContracts}
              type="datetime-local"
              className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 outline-none transition-all duration-300 focus:border-cyan-400/70 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>
        </div>

        <label className="space-y-1 text-xs text-slate-400">
          <span>Contenido contractual</span>
          <textarea
            value={content}
            onChange={event => setContent(event.target.value)}
            disabled={isReadOnly}
            rows={10}
            className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm text-slate-100 outline-none transition-all duration-300 focus:border-cyan-400/70 disabled:cursor-not-allowed disabled:opacity-60"
            placeholder="Redacta clausulas, obligaciones y alcance del acuerdo"
          />
        </label>

        <div className="grid gap-4 xl:grid-cols-2">
          <article className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-100">
                <PenTool className="h-4 w-4 text-cyan-300" />
                Firma digital
              </p>
              <Button
                onClick={clearSignature}
                disabled={isReadOnly}
                className="min-h-11 rounded-lg border border-slate-600 bg-slate-800 px-2.5 text-xs text-slate-100 hover:bg-slate-700"
              >
                Limpiar
              </Button>
            </div>

            <div className="rounded-xl border border-slate-700 bg-white">
              {isReadOnly ? (
                signatureData ? (
                  <img
                    src={signatureData}
                    alt="Firma digital"
                    className="h-48 w-full object-contain"
                  />
                ) : (
                  <div className="flex h-48 items-center justify-center text-sm text-slate-500">
                    Sin firma registrada
                  </div>
                )
              ) : (
                <SignatureCanvas
                  ref={reference => {
                    signatureRef.current = reference;
                  }}
                  penColor="#0f172a"
                  canvasProps={{
                    className: "h-48 w-full rounded-xl",
                  }}
                />
              )}
            </div>
          </article>

          <article className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-100">
              <Camera className="h-4 w-4 text-cyan-300" />
              Evidencia fotografica
            </p>

            <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
              {isReadOnly ? (
                photoData ? (
                  <img
                    src={photoData}
                    alt="Foto del firmante"
                    className="h-48 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-48 items-center justify-center text-sm text-slate-500">
                    Sin foto registrada
                  </div>
                )
              ) : (
                <Webcam
                  ref={reference => {
                    webcamRef.current = reference;
                  }}
                  audio={false}
                  screenshotFormat="image/png"
                  videoConstraints={{
                    facingMode: "user",
                  }}
                  className="h-48 w-full object-cover"
                />
              )}
            </div>

            {!isReadOnly && (
              <Button
                onClick={capturePhoto}
                className="min-h-11 rounded-xl border border-cyan-300/30 bg-cyan-500/20 px-3 text-cyan-100 hover:bg-cyan-500/30"
              >
                <Camera className="mr-2 h-4 w-4" />
                Capturar foto
              </Button>
            )}
          </article>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          {!selectedContract ? (
            <Button
              onClick={createContract}
              disabled={saving}
              className="min-h-11 rounded-xl border border-cyan-300/35 bg-cyan-500/20 px-4 text-cyan-100 hover:bg-cyan-500/30"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Guardando..." : "Firmar y Guardar"}
            </Button>
          ) : (
            <>
              {canEditContracts && adminEditMode && (
                <Button
                  onClick={updateContract}
                  disabled={saving}
                  className="min-h-11 rounded-xl border border-amber-300/35 bg-amber-500/20 px-4 text-amber-100 hover:bg-amber-500/30"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Actualizando..." : "Guardar cambios"}
                </Button>
              )}

              {canEditContracts && (
                <Button
                  onClick={removeContract}
                  disabled={deleting}
                  className="min-h-11 rounded-xl border border-rose-300/35 bg-rose-500/15 px-4 text-rose-100 hover:bg-rose-500/25"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {deleting ? "Eliminando..." : "Eliminar"}
                </Button>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
