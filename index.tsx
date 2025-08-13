import { useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import { Camera, Wrench, FolderOpen, Plus, Settings, Car, Home, ChevronRight, ChevronLeft, Save, Share2, Trash2, Search } from 'lucide-react'

type Guide = {
  title: string;
  overview: string;
  tools: string[];
  safety: string[];
  steps: string[];
  est: { time: string; difficulty: string };
}

const MOCK_GUIDES: Record<string, Guide> = {
  brake_caliper: {
    title: "Brake Caliper Inspection & Replacement",
    overview: "Diagnose sticking or seized calipers causing uneven pad wear, pulling, or overheating.",
    tools: ["Socket set", "Torque wrench", "C-clamp", "Brake cleaner", "Jack + jack stands"],
    safety: [
      "Park on level ground, chock wheels.",
      "Use jack stands; never rely on a jack.",
      "Wear eye protection and gloves.",
    ],
    steps: [
      "Loosen lug nuts, raise vehicle, secure with jack stands.",
      "Remove wheel; inspect rotor and pads for uneven wear.",
      "Unbolt caliper, suspend with wire (do not stress hose).",
      "Compress piston with C-clamp; check for smooth travel.",
      "If replacing: swap caliper, bleed brakes, torque bolts to spec.",
      "Reinstall wheel, torque lugs to spec, test at low speed.",
    ],
    est: { time: "60–120 min", difficulty: "Intermediate" },
  },
  serpentine_belt: {
    title: "Serpentine Belt Replacement",
    overview: "Replace cracked or noisy drive belt causing squeal, poor charging, or overheating.",
    tools: ["Belt tool or breaker bar", "Socket set", "Belt routing diagram", "Flashlight"],
    safety: ["Engine off and cool.", "Keep fingers clear of pulleys."],
    steps: [
      "Document belt routing (photo/diagram).",
      "Relieve tensioner, slip belt off pulleys.",
      "Route new belt per diagram and seat on all ribs.",
      "Release tensioner slowly; verify alignment on each pulley.",
      "Start engine and observe; confirm no squeal or tracking issues.",
    ],
    est: { time: "20–45 min", difficulty: "Easy" },
  },
  alternator: {
    title: "Alternator Test & Swap",
    overview: "Diagnose charging issues and replace alternator if failing.",
    tools: ["Multimeter", "Socket set", "Belt tool", "Battery terminal wrench"],
    safety: ["Disconnect negative battery cable.", "Mind sharp edges and hot components."],
    steps: [
      "Check battery rest voltage (12.6V typical).",
      "Start engine; check charging (13.8–14.6V typical).",
      "If low, remove belt and unbolt alternator; disconnect harness.",
      "Install replacement, reconnect, refit belt and tension.",
      "Re-test charging voltage; clear any codes if present.",
    ],
    est: { time: "45–120 min", difficulty: "Intermediate" },
  },
}

const SAMPLE_PREDICTIONS = [
  { label: "brake_caliper", name: "Brake Caliper", confidence: 0.82 },
  { label: "serpentine_belt", name: "Serpentine Belt", confidence: 0.11 },
  { label: "alternator", name: "Alternator", confidence: 0.07 },
]

const VEHICLE_PRESETS = [
  { id: "v1", name: "2006 Infiniti G35", mileage: 0 },
  { id: "v2", name: "1997 Lexus LS 400", mileage: 0 },
]

const Button = ({ className = "", children, ...props }: any) => (
  <button className={`px-4 py-2 rounded-2xl shadow-sm border border-gray-200 hover:shadow transition disabled:opacity-50 ${className}`} {...props}>{children}</button>
)

const Card = ({ className = "", children }: any) => (
  <div className={`rounded-2xl shadow-sm border border-gray-200 bg-white ${className}`}>{children}</div>
)

const CardHeader = ({ title, subtitle, right }: any) => (
  <div className="flex items-center justify-between p-4 border-b border-gray-100">
    <div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
    <div>{right}</div>
  </div>
)

const CardContent = ({ children, className = "" }: any) => (
  <div className={`p-4 ${className}`}>{children}</div>
)

const fmtPct = (n: number) => `${Math.round(n * 100)}%`
const SectionTitle = ({ icon: Icon, title, children }: any) => (
  <div className="flex items-center gap-2 mb-3">
    {Icon && <Icon className="w-5 h-5 text-gray-700" />}
    <h4 className="text-base font-semibold">{title}</h4>
    {children}
  </div>
)

const Tabs = ({ current, onChange }: any) => {
  const items = [
    { key: "capture", label: "Capture", icon: Camera },
    { key: "identify", label: "Identify", icon: Search },
    { key: "guide", label: "Guide", icon: Wrench },
    { key: "log", label: "Log", icon: FolderOpen },
    { key: "garage", label: "Garage", icon: Car },
    { key: "projects", label: "Projects", icon: Home },
    { key: "settings", label: "Settings", icon: Settings },
  ]
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 grid grid-cols-7 gap-1">
      {items.map((it) => (
        <Button key={it.key} className={`flex flex-col items-center py-2 text-xs ${current === it.key ? "bg-gray-100" : "bg-white"}`} onClick={() => onChange(it.key)}>
          <it.icon className="w-5 h-5" />
          {it.label}
        </Button>
      ))}
    </div>
  )
}

export default function HomePage() {
  const [tab, setTab] = useState("capture")
  const [photo, setPhoto] = useState<any>(null)
  const [vehicleId, setVehicleId] = useState(VEHICLE_PRESETS[0].id)
  const vehicle = useMemo(() => VEHICLE_PRESETS.find((v) => v.id === vehicleId), [vehicleId])

  const [preds, setPreds] = useState<any[]>([])
  const [pickedLabel, setPickedLabel] = useState<string | null>(null)
  const [entries, setEntries] = useState<any[]>([])

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
    }
  }, [])

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('wm_entries') || '[]')
      setEntries(saved)
    } catch {}
  }, [])
  useEffect(() => {
    try {
      localStorage.setItem('wm_entries', JSON.stringify(entries))
    } catch {}
  }, [entries])

  const runMockIdentify = async () => {
    setPreds([])
    setPickedLabel(null)
    // Simulate an API call
    const res = await fetch('/api/identify')
    const json = await res.json()
    setPreds(json.predictions)
    setTab('identify')
  }

  const currentGuide = pickedLabel ? MOCK_GUIDES[pickedLabel] : null

  const addToLog = () => {
    if (!currentGuide) return
    const newEntry = {
      id: Math.random().toString(36).slice(2),
      date: new Date().toISOString(),
      vehicle: vehicle?.name,
      label: pickedLabel,
      title: currentGuide.title,
      note: `Followed guide for ${currentGuide.title}.`,
      mileage: vehicle?.mileage,
      photo: photo?.preview || null,
      cost: 0,
    }
    setEntries([newEntry, ...entries])
    setTab('log')
  }

  const removeEntry = (id: string) => setEntries(entries.filter((e) => e.id !== id))

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pb-24">
      <header className="sticky top-0 z-10 backdrop-blur bg-white/80 border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="w-6 h-6" />
            <span className="font-semibold">WrenchMate</span>
            <span className="text-xs text-gray-500">(Demo)</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Car className="w-4 h-4" /> {vehicle?.name}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 space-y-4">
        {tab === 'capture' && (
          <Card>
            <CardHeader title="Capture or Upload" subtitle="Take a photo of the part. Clear lighting and a medium distance works best." right={<Camera className="w-5 h-5" />} />
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <SectionTitle icon={Camera} title="Use Camera" />
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) {
                          const url = URL.createObjectURL(f)
                          setPhoto({ file: f, preview: url })
                        }
                      }}
                    />
                    <Button className="w-full flex items-center justify-center gap-2">
                      <Camera className="w-5 h-5" />
                      Open camera / gallery
                    </Button>
                  </label>
                  {photo && (
                    <div className="rounded-xl overflow-hidden border border-gray-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.preview} alt="preview" className="w-full object-cover" />
                    </div>
                  )}
                  <div className="flex items-center justify-end gap-2">
                    <Button disabled={!photo} onClick={runMockIdentify} className="bg-black text-white">
                      Identify Part <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-3">
                  <SectionTitle icon={Wrench} title="Tips for better results" />
                  <ul className="text-sm text-gray-700 list-disc ml-5 space-y-1">
                    <li>Move back 1–2 feet so the full part is visible.</li>
                    <li>Avoid harsh shadows; use a flashlight if needed.</li>
                    <li>Take a second photo from a different angle.</li>
                  </ul>
                  <SectionTitle icon={Car} title="Pick Vehicle" />
                  <div className="grid gap-2">
                    {VEHICLE_PRESETS.map((v) => (
                      <label key={v.id} className={`flex items-center justify-between p-3 border rounded-xl ${vehicleId===v.id?"border-black":"border-gray-200"}`}>
                        <div>
                          <div className="font-medium">{v.name}</div>
                          <div className="text-xs text-gray-500">Mileage: {v.mileage.toLocaleString()} mi</div>
                        </div>
                        <input type="radio" name="veh" checked={vehicleId===v.id} onChange={()=>setVehicleId(v.id)} />
                      </label>
                    ))}
                    <Button className="flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Add Vehicle
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {tab === 'identify' && (
          <Card>
            <CardHeader title="Top Matches" subtitle="Select the best match to open a guide." right={<Search className="w-5 h-5" />} />
            <CardContent>
              {!preds.length ? (
                <div className="py-10 text-center text-gray-600">Analyzing photo…</div>
              ) : (
                <div className="grid md:grid-cols-3 gap-3">
                  {preds.map((p) => (
                    <button
                      key={p.label}
                      className={`text-left p-3 rounded-xl border ${pickedLabel===p.label?"border-black bg-gray-50":"border-gray-200"}`}
                      onClick={() => { setPickedLabel(p.label); setTab('guide'); }}
                    >
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-gray-500">Confidence {fmtPct(p.confidence)}</div>
                      <div className="text-xs mt-2 text-gray-600">Tap to open guide</div>
                    </button>
                  ))}
                </div>
              )}
              <div className="flex justify-between mt-4">
                <Button onClick={()=>setTab('capture')} className="flex items-center gap-2"><ChevronLeft className="w-4 h-4"/>Back</Button>
                <Button onClick={()=>setTab('guide')} disabled={!preds.length} className="bg-black text-white flex items-center gap-2">Continue<ChevronRight className="w-4 h-4"/></Button>
              </div>
            </CardContent>
          </Card>
        )}

        {tab === 'guide' && (
          <Card>
            <CardHeader title={currentGuide ? currentGuide.title : 'Pick a match to view the guide'} subtitle={currentGuide?.overview} right={<Wrench className="w-5 h-5" />} />
            <CardContent>
              {!currentGuide ? (
                <div className="text-gray-600">Select one of the identified parts first.</div>
              ) : (
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-4">
                    <SectionTitle title="Safety" />
                    <ul className="list-disc ml-5 text-sm text-gray-700 space-y-1">
                      {currentGuide.safety.map((s, i) => (<li key={i}>{s}</li>))}
                    </ul>
                    <SectionTitle title="Tools" />
                    <div className="flex flex-wrap gap-2">
                      {currentGuide.tools.map((t, idx) => (
                        <span key={idx} className="text-xs px-2 py-1 rounded-full border bg-gray-50">{t}</span>
                      ))}
                    </div>
                    <SectionTitle title="Steps" />
                    <ol className="list-decimal ml-5 text-sm text-gray-800 space-y-2">
                      {currentGuide.steps.map((s, i) => (<li key={i}>{s}</li>))}
                    </ol>
                  </div>
                  <div className="space-y-3">
                    <Card className="bg-gray-50">
                      <CardContent>
                        <div className="text-sm text-gray-700">Estimated time</div>
                        <div className="text-lg font-semibold">{currentGuide.est.time}</div>
                        <div className="text-sm text-gray-700 mt-2">Difficulty</div>
                        <div className="text-lg font-semibold">{currentGuide.est.difficulty}</div>
                      </CardContent>
                    </Card>
                    <Button onClick={addToLog} className="w-full bg-black text-white flex items-center justify-center gap-2">
                      <Save className="w-4 h-4" /> Add to Log
                    </Button>
                    <Button className="w-full flex items-center justify-center gap-2">
                      <Share2 className="w-4 h-4" /> Share Guide
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {tab === 'log' && (
          <Card>
            <CardHeader title="Maintenance & Repair Log" subtitle="Export coming in full build." right={<FolderOpen className="w-5 h-5" />} />
            <CardContent>
              {entries.length === 0 ? (
                <div className="text-gray-600">No entries yet. Add one from a guide.</div>
              ) : (
                <div className="space-y-3">
                  {entries.map((e) => (
                    <div key={e.id} className="p-3 rounded-xl border border-gray-200 bg-white flex items-center gap-3">
                      {e.photo && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={e.photo} alt="thumb" className="w-20 h-20 object-cover rounded-lg border" />
                      )}
                      <div className="flex-1">
                        <div className="font-medium">{e.title}</div>
                        <div className="text-xs text-gray-500">{new Date(e.date).toLocaleString()} • {e.vehicle}</div>
                        <div className="text-sm text-gray-700 mt-1">{e.note}</div>
                      </div>
                      <Button onClick={()=>removeEntry(e.id)} className="text-red-600 flex items-center gap-1"><Trash2 className="w-4 h-4"/>Remove</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {tab === 'garage' && (
          <Card>
            <CardHeader title="Garage" subtitle="Manage vehicles and quick reminders." right={<Car className="w-5 h-5" />} />
            <CardContent>
              <div className="grid md:grid-cols-2 gap-3">
                {VEHICLE_PRESETS.map((v) => (
                  <Card key={v.id} className={`border ${vehicleId===v.id?"border-black":"border-gray-200"}`}>
                    <CardContent>
                      <div className="font-semibold">{v.name}</div>
                      <div className="text-xs text-gray-500">Mileage: {v.mileage.toLocaleString()} mi</div>
                      <div className="mt-3 flex gap-2">
                        <Button onClick={()=>setVehicleId(v.id)} className="bg-black text-white">Set Active</Button>
                        <Button>Edit</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button className="flex items-center justify-center gap-2 h-24"><Plus className="w-4 h-4"/>Add Vehicle</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {tab === 'projects' && (
          <Card>
            <CardHeader title="Projects" subtitle="Create boards for big jobs (coming soon)." right={<Home className="w-5 h-5" />} />
            <CardContent>
              <div className="text-gray-600">Kanban boards and cost tracking will live here in the full build.</div>
            </CardContent>
          </Card>
        )}

        {tab === 'settings' && (
          <Card>
            <CardHeader title="Settings" subtitle="PWA & privacy options for the full build." right={<Settings className="w-5 h-5" />} />
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Offline mode</div>
                  <div className="text-sm text-gray-500">Cache guides and your last 10 items.</div>
                </div>
                <input type="checkbox" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Improve model</div>
                  <div className="text-sm text-gray-500">Allow anonymized photos to train recognition.</div>
                </div>
                <input type="checkbox" />
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <Tabs current={tab} onChange={setTab} />
    </div>
  )
}
