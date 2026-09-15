// app/dashboard/contracts/page.tsx

"use client"

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react"

import {
    FileUp,
    Plus,
    ShieldCheck,
    Upload,
    X,
} from "lucide-react"

import {
    ContractFilters,
    ContractTable,
    MobileSectionTabs,
    NewRequestModal,
    RequestTable,
    StatCards,
} from "@/components/contracts/contracts"

import {
    contractService,
    type Contract,
    type ContractRequest,
    type ContractRequestFormData,
    type ContractType,
} from "@/lib/services/contract.service"


/* -------------------------------------------------------------------------- */
/* Upload contract modal                                                       */
/* -------------------------------------------------------------------------- */

function UploadContractModal({
    open,
    onClose,
    onUploaded,
}: {
    open: boolean
    onClose: () => void
    onUploaded: (contract: Contract) => void
}) {
    const inputRef = useRef<HTMLInputElement | null>(null)

    const [title, setTitle] = useState("")

    const [contractType, setContractType] =
        useState<ContractType>("NDA")

    const [file, setFile] = useState<File | null>(null)

    const [saving, setSaving] = useState(false)

    const [error, setError] = useState("")


    /* ---------------------------------------------------------------------- */
    /* Reset                                                                   */
    /* ---------------------------------------------------------------------- */

    const reset = () => {
        setTitle("")
        setContractType("NDA")
        setFile(null)
        setError("")

        if (inputRef.current) {
            inputRef.current.value = ""
        }
    }


    /* ---------------------------------------------------------------------- */
    /* Close                                                                   */
    /* ---------------------------------------------------------------------- */

    const handleClose = () => {
        if (saving) {
            return
        }

        reset()
        onClose()
    }


    if (!open) {
        return null
    }


    /* ---------------------------------------------------------------------- */
    /* Submit                                                                  */
    /* ---------------------------------------------------------------------- */

    const submit = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault()

        if (saving) {
            return
        }

        setError("")


        // Validate title
        if (!title.trim()) {
            setError("Contract title is required.")
            return
        }


        // Validate contract type
        if (!contractType) {
            setError("Please select a contract type.")
            return
        }


        // Validate file
        if (!file) {
            setError("Please choose a file to upload.")
            return
        }


        // Optional file validation
        const allowedTypes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ]

        const isImage = file.type.startsWith("image/")

        if (
            !allowedTypes.includes(file.type) &&
            !isImage
        ) {
            setError(
                "Please upload a PDF, DOC, DOCX, or image file."
            )

            return
        }


        try {
            setSaving(true)


            /*
             * The service handles:
             *
             * 1. POST /contracts/upload-url
             * 2. PUT file directly to Cloudflare R2
             * 3. POST /contracts/upload/complete
             *
             * We only pass the form data here.
             */

            const formData = new FormData()

            formData.append(
                "title",
                title.trim()
            )

            formData.append(
                "contractType",
                contractType
            )

            formData.append(
                "file",
                file
            )


            const created =
                await contractService.uploadContract(
                    formData
                )


            // Make sure backend returned a contract
            if (!created?._id) {
                throw new Error(
                    "Contract upload completed but no contract was returned."
                )
            }


            // Update parent contracts list
            onUploaded(created)


            // Reset modal
            reset()


            // Close modal
            onClose()

        } catch (err) {

            console.error(
                "Contract upload failed:",
                err
            )

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to upload contract."
            )

        } finally {
            setSaving(false)
        }
    }


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="upload-dialog-title"
                className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl"
            >

                {/* ---------------------------------------------------------- */}
                {/* Header                                                       */}
                {/* ---------------------------------------------------------- */}

                <div className="flex items-start justify-between">

                    <div>

                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-yellow-400">
                            NyayMitra
                        </p>

                        <h2
                            id="upload-dialog-title"
                            className="mt-1 text-xl font-semibold text-white"
                        >
                            Upload contract
                        </h2>

                        <p className="mt-1 text-sm text-zinc-400">
                            Add an existing contract for review
                            or record-keeping.
                        </p>

                    </div>


                    <button
                        type="button"
                        onClick={handleClose}
                        aria-label="Close dialog"
                        disabled={saving}
                        className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-900 hover:text-white disabled:opacity-50"
                    >
                        <X className="size-5" />
                    </button>

                </div>


                {/* ---------------------------------------------------------- */}
                {/* Error                                                        */}
                {/* ---------------------------------------------------------- */}

                {error && (
                    <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-300">
                        {error}
                    </div>
                )}


                {/* ---------------------------------------------------------- */}
                {/* Form                                                         */}
                {/* ---------------------------------------------------------- */}

                <form
                    onSubmit={submit}
                    className="mt-6 flex flex-col gap-4"
                >

                    {/* Contract title */}

                    <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-300">

                        Contract title

                        <input
                            required
                            value={title}
                            onChange={(event) => {
                                setTitle(
                                    event.target.value
                                )

                                if (error) {
                                    setError("")
                                }
                            }}
                            placeholder="e.g. Vendor agreement – Acme"
                            disabled={saving}
                            className="h-10 rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
                        />

                    </label>


                    {/* Contract type */}

                    <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-300">

                        Contract type

                        <select
                            value={contractType}
                            onChange={(event) => {
                                setContractType(
                                    event.target.value as ContractType
                                )

                                if (error) {
                                    setError("")
                                }
                            }}
                            disabled={saving}
                            className="h-10 rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none focus:border-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
                        >

                            {[
                                "NDA",
                                "Employment Agreement",
                                "Vendor Agreement",
                                "Service Agreement",
                                "Consulting Agreement",
                                "Partnership Agreement",
                                "Shareholder Agreement",
                                "Lease Agreement",
                                "MSA",
                                "SLA",
                                "Privacy Policy",
                                "Terms & Conditions",
                                "Website Policy",
                                "Founders Agreement",
                                "Investment Agreement",
                                "Custom Contract",

                            ].map(
                                (option) => (
                                    <option
                                        key={option}
                                        value={option}
                                        className="bg-zinc-950 text-zinc-100"
                                    >
                                        {option}
                                    </option>
                                )
                            )}

                        </select>

                    </label>


                    {/* File */}

                    <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-300">

                        File

                        <div
                            role="button"
                            tabIndex={saving ? -1 : 0}
                            onClick={() => {
                                if (!saving) {
                                    inputRef.current?.click()
                                }
                            }}
                            onKeyDown={(event) => {
                                if (
                                    !saving &&
                                    (event.key === "Enter" ||
                                        event.key === " ")
                                ) {
                                    event.preventDefault()
                                    inputRef.current?.click()
                                }
                            }}
                            className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-zinc-700 bg-zinc-900 px-3 py-3 text-sm text-zinc-300 transition hover:border-yellow-400/50 disabled:cursor-not-allowed"
                        >

                            <span className="truncate">

                                {file
                                    ? file.name
                                    : "Choose a PDF, DOCX, or image"}

                            </span>


                            <Upload className="size-4 shrink-0 text-zinc-500" />

                        </div>


                        <input
                            ref={inputRef}
                            type="file"
                            accept=".pdf,.doc,.docx,image/*"
                            className="hidden"
                            disabled={saving}
                            onChange={(event) => {

                                const selectedFile =
                                    event.target.files?.[0] ??
                                    null

                                setFile(selectedFile)

                                if (selectedFile) {
                                    setError("")
                                }

                            }}
                        />

                    </label>


                    {/* File information */}

                    {file && (
                        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-xs text-zinc-400">

                            <div className="flex items-center justify-between gap-3">

                                <span className="truncate">
                                    {file.name}
                                </span>

                                <span className="shrink-0">
                                    {(
                                        file.size /
                                        (1024 * 1024)
                                    ).toFixed(2)}{" "}
                                    MB
                                </span>

                            </div>

                        </div>
                    )}


                    {/* ------------------------------------------------------ */}
                    {/* Actions                                                  */}
                    {/* ------------------------------------------------------ */}

                    <div className="flex justify-end gap-2 pt-2">

                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={saving}
                            className="rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-400 transition hover:bg-zinc-900 hover:text-white disabled:opacity-50"
                        >
                            Cancel
                        </button>


                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
                        >

                            <FileUp className="size-4" />

                            {saving
                                ? "Uploading…"
                                : "Upload contract"}

                        </button>

                    </div>

                </form>

            </div>

        </div>
    )
}


/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function ContractsPage() {

    const [view, setView] =
        useState<"contracts" | "requests">(
            "contracts"
        )


    const [search, setSearch] =
        useState("")


    const [status, setStatus] =
        useState("All statuses")


    const [type, setType] =
        useState("All types")


    const [priority, setPriority] =
        useState("All priorities")


    const [showRequestModal, setShowRequestModal] =
        useState(false)


    const [showUploadModal, setShowUploadModal] =
        useState(false)


    const [contracts, setContracts] =
        useState<Contract[]>([])


    const [requests, setRequests] =
        useState<ContractRequest[]>([])


    const [loading, setLoading] =
        useState(true)


    const [error, setError] =
        useState<string | null>(null)


    const [creatingRequest, setCreatingRequest] =
        useState(false)


    /* ---------------------------------------------------------------------- */
    /* Load data                                                               */
    /* ---------------------------------------------------------------------- */

    const loadData = useCallback(
        async () => {

            try {

                setLoading(true)
                setError(null)


                const [
                    contractsResponse,
                    requestsResponse,
                ] = await Promise.all([

                    contractService.getContracts({
                        page: 1,
                        limit: 50,
                    }),

                    contractService.getContractRequests({
                        page: 1,
                        limit: 50,
                    }),

                ])


                setContracts(
                    contractsResponse?.data ?? []
                )


                setRequests(
                    requestsResponse?.requests ?? []
                )

            } catch (err) {

                console.error(
                    "Failed to load contracts:",
                    err
                )


                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load contracts."
                )

            } finally {

                setLoading(false)

            }

        },
        []
    )


    useEffect(() => {
        void loadData()
    }, [loadData])


    /* ---------------------------------------------------------------------- */
    /* Filter contracts                                                        */
    /* ---------------------------------------------------------------------- */

    const filteredContracts = useMemo(() => {

        const normalizedSearch =
            search.trim().toLowerCase()


        return contracts.filter(
            (contract) => {

                const counterpartyName =
                    contract.counterparty?.name ??
                    ""


                const counterpartyCompany =
                    contract.counterparty?.company ??
                    ""


                const haystack = [

                    contract.title,

                    contract.contractNumber,

                    contract.contractType,

                    counterpartyName,

                    counterpartyCompany,

                ]
                    .join(" ")
                    .toLowerCase()


                const matchesSearch =
                    !normalizedSearch ||
                    haystack.includes(
                        normalizedSearch
                    )


                const matchesStatus =
                    status === "All statuses" ||
                    contract.status === status


                const matchesType =
                    type === "All types" ||
                    contract.contractType === type


                const matchesPriority =
                    priority === "All priorities" ||
                    contract.priority === priority


                return (
                    matchesSearch &&
                    matchesStatus &&
                    matchesType &&
                    matchesPriority
                )
            }
        )

    }, [
        contracts,
        search,
        status,
        type,
        priority,
    ])


    /* ---------------------------------------------------------------------- */
    /* Filter requests                                                         */
    /* ---------------------------------------------------------------------- */

    const filteredRequests = useMemo(() => {

        const normalizedSearch =
            search.trim().toLowerCase()


        return requests.filter(
            (request) => {

                const requester =
                    typeof request.requestedBy ===
                        "string"
                        ? request.requestedBy
                        : request.requestedBy?.name ??
                        request.requestedBy?.email ??
                        ""


                const haystack = [

                    request.title,

                    request.requestNumber,

                    request.contractType,

                    request.description,

                    requester,

                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase()


                const matchesSearch =
                    !normalizedSearch ||
                    haystack.includes(
                        normalizedSearch
                    )


                const matchesStatus =
                    status === "All statuses" ||
                    request.status === status


                const matchesType =
                    type === "All types" ||
                    request.contractType === type


                const matchesPriority =
                    priority === "All priorities" ||
                    request.priority === priority


                return (
                    matchesSearch &&
                    matchesStatus &&
                    matchesType &&
                    matchesPriority
                )
            }
        )

    }, [
        requests,
        search,
        status,
        type,
        priority,
    ])


    /* ---------------------------------------------------------------------- */
    /* Create request                                                          */
    /* ---------------------------------------------------------------------- */

    const handleCreateRequest = async (
        data: ContractRequestFormData
    ) => {

        try {

            setCreatingRequest(true)
            setError(null)


            const newRequest =
                await contractService.createContractRequest(
                    data
                )


            setRequests((current) => [
                newRequest,
                ...current,
            ])


            setShowRequestModal(false)

            setView("requests")

            setSearch("")
            setStatus("All statuses")
            setType("All types")
            setPriority("All priorities")

        } catch (err) {

            console.error(
                "Failed to create legal request:",
                err
            )


            const message =
                err instanceof Error
                    ? err.message
                    : "Failed to create legal request."


            setError(message)

            throw err

        } finally {

            setCreatingRequest(false)

        }
    }


    /* ---------------------------------------------------------------------- */
    /* Upload contract                                                         */
    /* ---------------------------------------------------------------------- */

    const handleUploadedContract = (
        created: Contract
    ) => {

        setContracts((current) => [
            created,
            ...current,
        ])


        setView("contracts")


        /*
         * Clear filters so the newly uploaded
         * contract is immediately visible.
         */

        setSearch("")
        setStatus("All statuses")
        setType("All types")
        setPriority("All priorities")

    }


    /* ---------------------------------------------------------------------- */
    /* Loading                                                                 */
    /* ---------------------------------------------------------------------- */

    if (loading) {

        return (
            <main className="contracts-theme min-h-screen bg-black text-zinc-100">

                <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">

                    <div className="flex min-h-[400px] items-center justify-center">

                        <div className="flex items-center gap-3 text-sm text-zinc-400">

                            <span className="size-2 animate-pulse rounded-full bg-yellow-400" />

                            Loading legal operations...

                        </div>

                    </div>

                </div>

            </main>
        )
    }


    /* ---------------------------------------------------------------------- */
    /* Page                                                                    */
    /* ---------------------------------------------------------------------- */

    return (

        <main className="contracts-theme min-h-screen bg-black text-zinc-100">

            <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">

                {/* ---------------------------------------------------------------- */}
                {/* Header                                                            */}
                {/* ---------------------------------------------------------------- */}

                <header className="flex flex-col gap-5 border-b border-zinc-800 pb-6 sm:flex-row sm:items-end sm:justify-between">

                    <div>

                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-yellow-400">

                            <ShieldCheck className="size-4" />

                            NyayMitra Legal Operations

                        </div>


                        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                            Contracts workspace
                        </h1>


                        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
                            One calm place to track requests,
                            contracts, reviews, and renewal
                            obligations.
                        </p>

                    </div>


                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">

                        <button
                            type="button"
                            onClick={() =>
                                setShowUploadModal(true)
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-semibold text-zinc-100 transition hover:border-yellow-400/40 hover:bg-zinc-900"
                        >

                            <Upload className="size-4" />

                            Upload contract

                        </button>


                        <button
                            type="button"
                            onClick={() =>
                                setShowRequestModal(true)
                            }
                            disabled={creatingRequest}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-4 py-3 text-sm font-semibold text-black shadow-sm transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
                        >

                            <Plus className="size-4" />

                            New legal request

                        </button>

                    </div>

                </header>


                {/* ---------------------------------------------------------------- */}
                {/* Error                                                             */}
                {/* ---------------------------------------------------------------- */}

                {error && (

                    <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">

                        <span>
                            {error}
                        </span>


                        <button
                            type="button"
                            onClick={() => {

                                setError(null)

                                void loadData()

                            }}
                            className="shrink-0 rounded-lg border border-red-900/50 px-3 py-1.5 text-xs font-semibold text-red-200 hover:bg-red-900/30"
                        >
                            Retry
                        </button>

                    </div>

                )}


                {/* ---------------------------------------------------------------- */}
                {/* Stats                                                             */}
                {/* ---------------------------------------------------------------- */}

                <section className="mt-6">

                    <StatCards
                        contracts={contracts}
                        requests={requests}
                    />

                </section>


                {/* ---------------------------------------------------------------- */}
                {/* Legal work                                                        */}
                {/* ---------------------------------------------------------------- */}

                <section className="mt-8 flex flex-col gap-4">

                    <div className="flex items-center justify-between">

                        <div>

                            <h2 className="text-lg font-semibold text-white">
                                Legal work
                            </h2>


                            <p className="mt-1 text-sm text-zinc-400">
                                Monitor active agreements and
                                work in progress.
                            </p>

                        </div>


                        <div className="hidden sm:block">

                            <MobileSectionTabs
                                active={view}
                                setActive={setView}
                            />

                        </div>

                    </div>


                    <div className="sm:hidden">

                        <MobileSectionTabs
                            active={view}
                            setActive={setView}
                        />

                    </div>


                    {/* ============================================================= */}
                    {/* CONTRACTS                                                      */}
                    {/* ============================================================= */}

                    {view === "contracts" ? (

                        <>

                            <ContractFilters
                                search={search}
                                setSearch={setSearch}
                                status={status}
                                setStatus={setStatus}
                                type={type}
                                setType={setType}
                                priority={priority}
                                setPriority={setPriority}
                            />


                            <ContractTable
                                contracts={filteredContracts}
                            />

                        </>

                    ) : (

                        /* =========================================================== */
                        /* REQUESTS                                                     */
                        /* =========================================================== */

                        <>

                            <ContractFilters
                                search={search}
                                setSearch={setSearch}
                                status={status}
                                setStatus={setStatus}
                                type={type}
                                setType={setType}
                                priority={priority}
                                setPriority={setPriority}
                            />


                            <RequestTable
                                requests={filteredRequests}
                            />


                            {requests.length === 0 && (

                                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-10 text-center">

                                    <h3 className="text-sm font-semibold text-white">
                                        No legal requests yet
                                    </h3>


                                    <p className="mt-2 text-sm text-zinc-500">
                                        Create your first legal request
                                        to get started.
                                    </p>


                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowRequestModal(
                                                true
                                            )
                                        }
                                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-black hover:bg-yellow-300"
                                    >

                                        <Plus className="size-4" />

                                        New legal request

                                    </button>

                                </div>

                            )}

                        </>

                    )}

                </section>


                {/* ---------------------------------------------------------------- */}
                {/* Footer                                                            */}
                {/* ---------------------------------------------------------------- */}

                <footer className="mt-8 flex items-center justify-between border-t border-zinc-800 pt-5 text-xs text-zinc-500">

                    <span>
                        © 2026 NyayMitra
                    </span>


                    <span>
                        Confidential workspace
                    </span>

                </footer>

            </div>


            {/* ------------------------------------------------------------------ */}
            {/* Modals                                                              */}
            {/* ------------------------------------------------------------------ */}

            <NewRequestModal
                open={showRequestModal}
                onClose={() => {

                    if (!creatingRequest) {
                        setShowRequestModal(false)
                    }

                }}
                onCreated={handleCreateRequest}
            />


            <UploadContractModal
                open={showUploadModal}
                onClose={() =>
                    setShowUploadModal(false)
                }
                onUploaded={
                    handleUploadedContract
                }
            />

        </main>
    )
}